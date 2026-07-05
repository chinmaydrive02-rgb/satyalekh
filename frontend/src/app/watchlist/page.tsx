"use client";

// Watchlist — daily re-checks of saved parcels with field-level change alerts.
// Backend: POST /watchlist, GET /watchlist, DELETE /watchlist/{id},
// GET /watchlist/alerts, POST /watchlist/{id}/alerts/seen.

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import {
  Bell, BellRing, Loader2, Trash2, Mail, MapPin, Clock, ArrowRight,
  CheckCheck, AlertTriangle, Search, Eye,
} from 'lucide-react';
import {
  getUserEmail, setUserEmail,
  fetchWatchlist, removeFromWatchlist, fetchWatchlistAlerts, markWatchAlertsSeen,
  WatchlistItem, WatchAlert,
  isDemoActive, DEMO_EMAIL,
} from '@/lib/api';

const FIELD_LABELS: Record<string, string> = {
  owner_name: 'Owner',
  area: 'Area',
  tenure_type: 'Tenure type',
  encumbrances: 'Encumbrances',
  mutation_entries: 'Mutation entries',
  jantri_rate: 'Jantri rate',
  last_sale: 'Last sale',
  cultivation: 'Cultivation',
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

function fmtDate(iso?: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function WatchlistPage() {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [hasEmail, setHasEmail] = useState<boolean | null>(null); // null = booting

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<WatchAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = getUserEmail();
    if (saved) {
      setEmail(saved);
      setHasEmail(true);
    } else if (isDemoActive()) {
      // ── DEMO MODE ── skip the email prompt; the backend serves the
      // in-memory demo watchlist whenever a valid X-Demo-Token is attached.
      setEmail(DEMO_EMAIL);
      setHasEmail(true);
    } else {
      setHasEmail(false);
    }
  }, []);

  const load = useCallback(async (em: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const [list, alertList] = await Promise.all([
        fetchWatchlist(em),
        fetchWatchlistAlerts(em),
      ]);
      setItems(list);
      setAlerts(alertList);
    } catch (e: unknown) {
      setLoadError(
        e instanceof Error && e.message
          ? e.message
          : 'Could not load your watchlist — the server may be warming up. Try again in a minute.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasEmail && email) load(email);
  }, [hasEmail, email, load]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailInput.trim().toLowerCase();
    if (!em.includes('@')) return;
    setUserEmail(em);
    setEmail(em);
    setHasEmail(true);
  };

  const handleRemove = async (item: WatchlistItem) => {
    if (!confirm(`Stop watching Survey ${item.survey_no}, ${item.village}?`)) return;
    setRemovingId(item.id);
    try {
      await removeFromWatchlist(item.id, email);
      setItems(prev => prev.filter(i => i.id !== item.id));
      setAlerts(prev => prev.filter(a => a.watchlist_id !== item.id));
    } catch {
      alert('Could not remove — please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMarkSeen = async (watchlistId: string) => {
    setMarkingId(watchlistId);
    try {
      await markWatchAlertsSeen(watchlistId);
      setAlerts(prev => prev.map(a => a.watchlist_id === watchlistId ? { ...a, seen: true } : a));
    } catch {
      // non-fatal
    } finally {
      setMarkingId(null);
    }
  };

  const unseenCount = alerts.filter(a => !a.seen).length;

  const parcelHref = (p: { survey_no?: string; district?: string; taluka?: string; village?: string; record_type?: string | null }) =>
    `/property/SURVEY-${encodeURIComponent(p.survey_no || '')}` +
    `?district=${encodeURIComponent(p.district || '')}` +
    `&taluka=${encodeURIComponent(p.taluka || '')}` +
    `&village=${encodeURIComponent(p.village || '')}` +
    `&record_type=${encodeURIComponent(p.record_type || 'OLD_SCAN_712')}`;

  return (
    <main className="min-h-screen bg-bg text-ink pt-24 pb-12 px-4 sm:px-6">
      <TopNav />
      <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="border-b border-border pb-6">
          <p className="eyebrow mb-1">Monitoring</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink flex items-center gap-3">
            <Bell size={28} className="text-brand" /> Watchlist
          </h1>
          <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
            We re-check your parcels daily and alert you on any mutation, encumbrance or
            ownership change — so nothing on the government record moves without you knowing.
          </p>
        </div>

        {/* Email capture */}
        {hasEmail === false && (
          <form onSubmit={handleEmailSubmit} className="card p-8 flex flex-col gap-4 max-w-md">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Mail size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">Link your email</h2>
                <p className="text-sm text-muted">Your watchlist is tied to your email — the same one used for search credits.</p>
              </div>
            </div>
            <input
              type="email"
              required
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="you@email.com"
              className="input"
            />
            <button type="submit" className="btn btn-primary">
              Open my watchlist
            </button>
          </form>
        )}

        {hasEmail && (
          <>
            {loadError && (
              <div className="text-sm text-danger px-4 py-3 rounded-lg border border-danger-border bg-danger-soft flex items-center justify-between gap-3 flex-wrap">
                <span>{loadError}</span>
                <button onClick={() => load(email)} className="btn btn-outline py-1.5 px-3 text-sm">Retry</button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-muted text-sm">
                <Loader2 size={20} className="text-brand animate-spin" /> Loading your watchlist…
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* Watched parcels */}
                <section className="lg:col-span-3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink">
                      Watched parcels
                      {items.length > 0 && <span className="text-muted font-normal"> · {items.length}</span>}
                    </h2>
                  </div>

                  {items.length === 0 && !loadError ? (
                    <div className="card p-10 flex flex-col items-center gap-4 text-center">
                      <span className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                        <Bell size={22} />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-ink mb-1">Nothing on watch yet</h3>
                        <p className="text-sm text-muted max-w-sm leading-relaxed">
                          Run a title check and press <span className="font-medium text-ink">“Watch this plot”</span> on
                          the report. We&apos;ll re-check the parcel daily and alert you on any mutation,
                          encumbrance or ownership change.
                        </p>
                      </div>
                      <Link href="/" className="btn btn-primary">
                        <Search size={14} /> Search a land record
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map(item => (
                        <div key={item.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={parcelHref(item)} className="group">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-mono font-bold text-ink group-hover:text-brand transition-colors">
                                  Survey {item.survey_no}
                                </span>
                                {item.record_type && (
                                  <span className="text-xs text-faint font-mono">{item.record_type}</span>
                                )}
                              </div>
                              <p className="text-sm text-muted flex items-center gap-1.5 mt-1">
                                <MapPin size={13} className="shrink-0 text-brand" />
                                {[item.village, item.taluka, item.district].filter(Boolean).join(', ')}
                              </p>
                            </Link>
                            <p className="text-xs text-faint flex items-center gap-1.5 mt-1.5">
                              <Clock size={11} /> Last checked: {fmtDate(item.last_checked_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={parcelHref(item)} className="btn btn-outline py-2 px-3 text-sm">
                              <Eye size={13} /> View
                            </Link>
                            <button
                              onClick={() => handleRemove(item)}
                              disabled={removingId === item.id}
                              title="Stop watching"
                              className="p-2.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                            >
                              {removingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Alerts feed */}
                <section className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                      Alerts
                      {unseenCount > 0 && (
                        <span className="badge bg-danger-soft text-danger border border-danger-border">
                          {unseenCount} new
                        </span>
                      )}
                    </h2>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="card p-8 flex flex-col items-center gap-3 text-center">
                      <BellRing size={22} className="text-faint" />
                      <p className="text-sm text-muted leading-relaxed max-w-xs">
                        No changes detected yet. When anything on a watched record changes —
                        a new mutation entry, an encumbrance, a different owner — it shows up here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {alerts.map(alert => {
                        const changes = Object.entries(alert.changes || {});
                        return (
                          <div
                            key={alert.id}
                            className={`card p-4 flex flex-col gap-3 ${!alert.seen ? 'border-warning-border bg-warning-soft/40' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!alert.seen && (
                                    <span className="w-2 h-2 rounded-full bg-warning shrink-0" title="Unseen" />
                                  )}
                                  <span className="text-sm font-semibold text-ink font-mono truncate">
                                    Survey {alert.survey_no || '—'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted mt-0.5">
                                  {[alert.village, alert.taluka, alert.district].filter(Boolean).join(', ')}
                                </p>
                              </div>
                              <span className="text-xs text-faint whitespace-nowrap shrink-0">{fmtDate(alert.created_at)}</span>
                            </div>

                            {/* Field-level diffs: old → new */}
                            <div className="flex flex-col gap-2">
                              {changes.length === 0 ? (
                                <p className="text-xs text-muted flex items-center gap-1.5">
                                  <AlertTriangle size={12} className="text-warning" /> Record changed — open the parcel for details.
                                </p>
                              ) : changes.map(([field, diff]) => (
                                <div key={field} className="text-xs bg-surface rounded-lg border border-border p-2.5">
                                  <span className="font-semibold text-ink-soft">{fieldLabel(field)}</span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-muted line-through break-all">{diff?.old || '—'}</span>
                                    <ArrowRight size={11} className="text-faint shrink-0" />
                                    <span className="text-danger font-medium break-all">{diff?.new || '—'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                              <Link
                                href={parcelHref(alert)}
                                className="text-xs text-brand font-medium hover:underline"
                              >
                                Re-check parcel →
                              </Link>
                              {!alert.seen && (
                                <button
                                  onClick={() => handleMarkSeen(alert.watchlist_id)}
                                  disabled={markingId === alert.watchlist_id}
                                  className="btn btn-outline py-1.5 px-2.5 text-xs"
                                >
                                  {markingId === alert.watchlist_id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <CheckCheck size={12} />} Mark seen
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-faint leading-relaxed">
                    Watchlist for <span className="font-mono text-muted">{email}</span>. Parcels are
                    re-checked daily against the official AnyROR record.
                  </p>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
