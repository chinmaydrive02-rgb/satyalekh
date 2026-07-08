"use client";

import React, { useState, useEffect, useRef, use, Suspense, useCallback } from 'react';
import {
  ChevronLeft, AlertCircle, Share2, Loader2, Search, BookmarkPlus, CheckCircle2,
  Mail, Gift, Printer, Landmark, RotateCcw, Database, Bell, BellRing,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/TopNav';
import JobProgress from '@/components/JobProgress';
import TitleReportView from '@/components/TitleReport';
import {
  API_BASE_URL, getUserEmail, setUserEmail, fetchCredits, fetchConfig,
  startTitleReport, pollJob, parseSurveySuggestions, addToWatchlist,
  ApiError, Job, TitleReport, isDemoActive, demoHeaders,
} from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

type Phase =
  | 'boot'          // deciding what to do on load
  | 'missing'       // no survey number / location params in the URL
  | 'need_email'    // email capture before first search (free-trial credits)
  | 'paywalled'     // out of credits
  | 'running'       // job started — live progress
  | 'done'          // report ready
  | 'error';        // job failed

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

function PropertyContent({ propertyId }: { propertyId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // Location context from URL params (set by SearchWidget)
  const urlDistrict = searchParams.get('district') || '';
  const urlTaluka = searchParams.get('taluka') || '';
  const urlVillage = searchParams.get('village') || '';
  const urlRecordType = searchParams.get('record_type') || 'OLD_SCAN_712';

  const surveyNum = propertyId.replace('SURVEY-', '');
  const hasSurveyNumber = !!surveyNum && surveyNum !== 'XX';
  const hasLocation = !!(urlDistrict && urlTaluka && urlVillage);
  const searchKey = `${urlDistrict}|${urlTaluka}|${urlVillage}|${surveyNum}|${urlRecordType}`;

  const [phase, setPhase] = useState<Phase>('boot');
  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<TitleReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [freeTrialCredits, setFreeTrialCredits] = useState(2);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');
  const [watchState, setWatchState] = useState<'idle' | 'saving' | 'watching' | 'need_email' | 'error'>('idle');
  const [watchEmailInput, setWatchEmailInput] = useState('');

  // Litigation check (eCourts) — unchanged existing feature
  const [litState, setLitState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [litResult, setLitResult] = useState<any>(null);
  const [litError, setLitError] = useState('');
  const [litYear, setLitYear] = useState(String(new Date().getFullYear()));

  // Guards: which searchKey a job was already started for (prevents duplicate
  // job starts on React StrictMode double-mount), and the active poll abort.
  const startedKeyRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /** Starts (or restarts) the background title-report job and polls it. */
  const runJob = useCallback(async (email: string) => {
    const key = searchKey;
    setPhase('running');
    setJob(null);
    setReport(null);
    setError(null);
    setSuggestions([]);
    setSaveState('idle');
    setWatchState('idle');
    setLitState('idle');
    setLitResult(null);
    setStartedAt(Date.now());

    try {
      const { job_id } = await startTitleReport(
        {
          district: urlDistrict,
          taluka: urlTaluka,
          village: urlVillage,
          survey_no: surveyNum,
          record_type: urlRecordType,
          include_chain: true,
        },
        email || undefined
      );

      // If the user navigated to a different parcel while starting, stop here.
      if (startedKeyRef.current !== key) return;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const final = await pollJob(job_id, { signal: ac.signal, onUpdate: setJob, intervalMs: 2500 });

      if (final.status === 'done' && final.result) {
        setReport(final.result);
        setPhase('done');
      } else {
        const msg = final.error || 'The search failed on the government portal. Please retry.';
        setError(msg);
        setSuggestions(
          final.suggestions && final.suggestions.length > 0
            ? final.suggestions
            : parseSurveySuggestions(msg)
        );
        setPhase('error');
      }
    } catch (e: unknown) {
      if (isAbortError(e)) return;
      if (e instanceof ApiError && e.status === 402) {
        setPhase('paywalled');
        return;
      }
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please retry.';
      setError(msg);
      setSuggestions(parseSurveySuggestions(msg));
      setPhase('error');
    }
  }, [searchKey, urlDistrict, urlTaluka, urlVillage, surveyNum, urlRecordType]);

  /** Decides on load: missing params → email gate → credits gate → auto-start. */
  const bootstrap = useCallback(async () => {
    if (!hasSurveyNumber || !hasLocation) {
      setPhase('missing');
      return;
    }

    const email = getUserEmail();
    const cfg = await fetchConfig();
    if (cfg) setFreeTrialCredits(cfg.free_trial_credits);

    // ── DEMO MODE ── skip email/credit gates; startTitleReport() attaches
    // X-Demo-Token and the backend runs a free simulated job.
    if (isDemoActive()) {
      runJob(email);
      return;
    }

    if (cfg?.payments_enabled && !email) {
      setPhase('need_email');
      return;
    }
    if (email) {
      const info = await fetchCredits(email);
      if (info?.payments_enabled && info.credits <= 0) {
        setPhase('paywalled');
        return;
      }
    }
    runJob(email);
  }, [hasSurveyNumber, hasLocation, runJob]);

  // AUTO-START: the search begins as soon as the page loads with valid params.
  useEffect(() => {
    if (startedKeyRef.current === searchKey) return; // already started for this parcel
    startedKeyRef.current = searchKey;
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const retry = () => {
    startedKeyRef.current = searchKey;
    bootstrap();
  };

  const optionHref = (opt: string) =>
    `/property/SURVEY-${encodeURIComponent(opt)}` +
    `?district=${encodeURIComponent(urlDistrict)}` +
    `&taluka=${encodeURIComponent(urlTaluka)}` +
    `&village=${encodeURIComponent(urlVillage)}` +
    `&record_type=${encodeURIComponent(urlRecordType)}`;

  /** Suggestion chip click: update the URL and restart with the corrected survey no. */
  const applySuggestion = (opt: string) => {
    router.replace(optionHref(opt));
  };

  const record = report?.record;

  const handleSaveToPortfolio = async () => {
    if (!record || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const surveyVal = record.survey_no || surveyNum;
      const villageVal = record.village || urlVillage;
      const { data: existing } = await supabase
        .from('portfolio_assets')
        .select('id')
        .eq('survey_no', surveyVal)
        .eq('village', villageVal)
        .limit(1);

      if (existing && existing.length > 0) {
        setSaveState('duplicate');
        setTimeout(() => setSaveState('idle'), 3000);
        return;
      }

      const { error: insertError } = await supabase.from('portfolio_assets').insert({
        survey_no: surveyVal,
        district: record.district || urlDistrict,
        taluka: record.taluka || urlTaluka,
        village: villageVal,
        owner_name: record.owner_name || null,
        area: record.area || null,
        tenure_type: record.tenure_type || null,
        encumbrances: record.encumbrances || null,
        jantri_rate: record.jantri_rate || null,
        last_sale: record.last_sale || null,
        mutation_entries: record.mutation_entries || null,
        record_type: urlRecordType,
      });
      if (insertError) throw insertError;
      setSaveState('saved');
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  /** Watchlist: daily re-check + alerts on any change to this parcel. */
  const handleWatchPlot = async (emailOverride?: string) => {
    if (watchState === 'saving' || watchState === 'watching') return;
    // ── DEMO MODE ── no email prompt; the backend writes to the in-memory
    // demo watchlist when a valid X-Demo-Token accompanies the request.
    const email = (emailOverride || getUserEmail() ||
      (isDemoActive() ? 'demo@satya-lekh.example' : '')).trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setWatchState('need_email');
      return;
    }
    setWatchState('saving');
    try {
      await addToWatchlist({
        email,
        district: record?.district || urlDistrict,
        taluka: record?.taluka || urlTaluka,
        village: record?.village || urlVillage,
        survey_no: record?.survey_no || surveyNum,
        record_type: urlRecordType,
      });
      setWatchState('watching');
    } catch {
      setWatchState('error');
      setTimeout(() => setWatchState('idle'), 3000);
    }
  };

  const runLitigationSearch = async () => {
    if (!record?.owner_name || litState === 'running') return;
    setLitState('running');
    setLitError('');
    try {
      const res = await fetch(`${API_BASE_URL}/litigation-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...demoHeaders() },
        body: JSON.stringify({ name: record.owner_name, district: record.district || urlDistrict, year: litYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Search failed');
      setLitResult(data);
      setLitState('done');
    } catch (e: any) {
      setLitError(e.message || 'Search failed');
      setLitState('error');
    }
  };

  return (
    <>
      {/* Navigation Breadcrumb */}
      <Link href="/dashboard" className="flex items-center gap-1.5 text-brand text-sm font-medium hover:text-brand-strong transition-colors w-fit print:hidden">
        <ChevronLeft size={16} /> Back to portfolio
      </Link>

      {/* Page header: parcel identity + actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
        <div>
          <p className="eyebrow mb-1">Survey number</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-mono text-ink mb-2">
            {hasSurveyNumber ? surveyNum : 'No Survey'}
          </h1>
          <p className="text-muted text-sm">
            {[urlVillage || record?.village, (urlTaluka || record?.taluka || '').replace(/_/g, ' '), urlDistrict || record?.district]
              .filter(Boolean).join(', ') || 'Location not specified'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Satya-Lekh — Survey ${surveyNum}`, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            className="btn btn-outline">
            <Share2 size={14} /> Share
          </button>
          {report && (
            <button
              onClick={() => window.print()}
              className="btn btn-outline text-brand border-brand-border hover:border-brand">
              <Printer size={14} /> Download Report
            </button>
          )}
        </div>
      </div>

      {/* ── Missing parameters ─────────────────────────────────────────── */}
      {phase === 'missing' && (
        <div className="card p-10 flex flex-col items-center gap-5 text-center">
          <Database size={44} className="text-faint" />
          <p className="text-sm text-muted max-w-md leading-relaxed">
            {!hasSurveyNumber
              ? 'No survey number specified.'
              : 'Location details (district / taluka / village) are missing from this link.'}{' '}
            Start a search to generate a title report.
          </p>
          <Link href="/" className="btn btn-primary">
            <Search size={14} /> New Search
          </Link>
        </div>
      )}

      {/* ── Booting (config / credits check before auto-start) ────────── */}
      {phase === 'boot' && (
        <div className="flex items-center justify-center gap-3 py-20 text-muted text-sm">
          <Loader2 size={18} className="text-brand animate-spin" /> Preparing your search…
        </div>
      )}

      {/* ── Email capture (free trial) — search starts right after ────── */}
      {phase === 'need_email' && (
        <div className="card flex flex-col items-center gap-4 p-8 border-brand-border bg-brand-soft/40 text-center">
          <Gift size={24} className="text-success" />
          <div>
            <h3 className="text-lg font-semibold text-ink mb-1">
              Get {freeTrialCredits} Free Search{freeTrialCredits === 1 ? '' : 'es'}
            </h3>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              Enter your email to claim your free trial searches — no card needed. Your title
              search starts immediately after.
            </p>
          </div>
          <form
            className="flex w-full max-w-sm gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const em = emailInput.trim().toLowerCase();
              if (!em.includes('@')) return;
              setUserEmail(em);
              startedKeyRef.current = searchKey;
              runJob(em);
            }}
          >
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@email.com"
              className="input flex-1"
            />
            <button
              type="submit"
              className="btn btn-primary whitespace-nowrap"
            >
              <Mail size={13} /> Start Search
            </button>
          </form>
        </div>
      )}

      {/* ── Paywall — out of credits ───────────────────────────────────── */}
      {phase === 'paywalled' && (
        <div className="card flex flex-col items-center gap-4 p-8 border-warning-border bg-warning-soft/50 text-center">
          <AlertCircle size={24} className="text-warning" />
          <div>
            <h3 className="text-lg font-semibold text-ink mb-1">No Search Credits Remaining</h3>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              Each search runs a live bot against the government AnyROR portal — CAPTCHA solving,
              Gujarati translation and structured extraction included.
            </p>
          </div>
          <Link
            href="/pricing"
            className="btn btn-primary"
          >
            Buy Search Credits
          </Link>
        </div>
      )}

      {/* ── Live progress ──────────────────────────────────────────────── */}
      {phase === 'running' && <JobProgress job={job} startedAt={startedAt} />}

      {/* ── Error + recovery ───────────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="card flex flex-col gap-5 p-8 border-danger-border">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-ink mb-1">Search Failed</h3>
              <p className="text-sm text-danger break-words leading-relaxed">{error}</p>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-ink-soft font-medium">
                Valid survey numbers found in this village — tap one to search it:
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => applySuggestion(opt)}
                    className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-soft text-brand text-sm font-mono hover:bg-brand-soft/60 hover:border-brand transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={retry}
            className="btn btn-primary w-fit"
          >
            <RotateCcw size={13} /> Retry Search
          </button>
        </div>
      )}

      {/* ── The ownership report ───────────────────────────────────────── */}
      {phase === 'done' && report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TitleReportView report={report} />

            {/* Litigation Check (eCourts) — existing feature, unchanged */}
            <div className="card p-6 md:p-8 print:hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-border pb-3">
                <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                  <Landmark size={18} className="text-warning" /> Litigation Check
                  <span className="badge bg-warning-soft text-warning border border-warning-border">Beta</span>
                </h2>
                {litState !== 'running' && (
                  <div className="flex items-center gap-2">
                    <input value={litYear} onChange={(e) => setLitYear(e.target.value)} maxLength={4}
                      className="input w-[80px] font-mono" />
                    <button onClick={runLitigationSearch}
                      className="btn btn-primary whitespace-nowrap">
                      Search eCourts
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Searches Gujarat district court records for cases naming{' '}
                <span className="text-ink font-medium">{record?.owner_name || 'the recorded owner'}</span> in the
                selected registration year — pending and disposed. Principal court complex of{' '}
                {record?.district || urlDistrict} district.
              </p>
              {litState === 'running' && (
                <div className="flex items-center gap-3 py-4 text-warning text-sm">
                  <Loader2 size={16} className="animate-spin" /> Querying the eCourts portal (60–180s — live CAPTCHA solving)…
                </div>
              )}
              {litState === 'error' && (
                <div className="text-sm text-danger px-3 py-2 rounded-lg border border-danger-border bg-danger-soft">{litError}</div>
              )}
              {litState === 'done' && litResult && (
                <div className="flex flex-col gap-2">
                  <div className={`text-sm px-3 py-2 rounded-lg border ${litResult.cases?.length ? 'border-danger-border text-danger bg-danger-soft' : 'border-success-border text-success bg-success-soft'}`}>
                    {litResult.message}
                  </div>
                  {(litResult.cases || []).map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-surface-soft rounded-lg border-l-2 border-danger flex flex-col gap-0.5">
                      <span className="text-sm font-mono text-ink">{c.case_no} · {c.case_type}</span>
                      <span className="text-sm text-ink-soft">{c.parties}</span>
                      <span className="text-xs text-muted">{c.status} {c.court ? `· ${c.court}` : ''}</span>
                    </div>
                  ))}
                  <p className="text-xs text-faint leading-relaxed">
                    Name-based search — same-name matches are possible and spellings vary across records. One year per search; check multiple years and the High Court for transaction-grade certainty.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar actions */}
          <div className="flex flex-col gap-6 print:hidden">
            <div className="card p-6 sticky top-24">
              <h2 className="text-base font-semibold text-ink mb-5">Actions</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveToPortfolio}
                  disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'duplicate'}
                  className={`btn w-full
                    ${saveState === 'saved' ? 'bg-success-soft text-success border border-success-border cursor-default'
                    : saveState === 'duplicate' ? 'bg-warning-soft text-warning border border-warning-border cursor-default'
                    : saveState === 'error' ? 'bg-danger-soft text-danger border border-danger-border'
                    : 'btn-primary'}`}
                >
                  {saveState === 'saving' && <><Loader2 size={14} className="animate-spin" /> Saving...</>}
                  {saveState === 'saved' && <><CheckCircle2 size={14} /> Saved to Portfolio</>}
                  {saveState === 'duplicate' && <><CheckCircle2 size={14} /> Already in Portfolio</>}
                  {saveState === 'error' && <>Save Failed — Retry</>}
                  {saveState === 'idle' && <><BookmarkPlus size={14} /> Save to Portfolio</>}
                </button>

                {/* Watch this plot — daily re-check + change alerts */}
                {watchState === 'need_email' ? (
                  <form
                    className="flex flex-col gap-2 p-3 rounded-lg border border-brand-border bg-brand-soft/50"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const em = watchEmailInput.trim().toLowerCase();
                      if (!em.includes('@')) return;
                      setUserEmail(em);
                      handleWatchPlot(em);
                    }}
                  >
                    <span className="text-xs text-ink-soft">Enter your email to get change alerts for this plot:</span>
                    <input
                      type="email"
                      required
                      value={watchEmailInput}
                      onChange={(e) => setWatchEmailInput(e.target.value)}
                      placeholder="you@email.com"
                      className="input"
                    />
                    <button type="submit" className="btn btn-primary w-full py-2 text-sm">
                      <Bell size={13} /> Start Watching
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => handleWatchPlot()}
                    disabled={watchState === 'saving' || watchState === 'watching'}
                    className={`btn w-full
                      ${watchState === 'watching' ? 'bg-success-soft text-success border border-success-border cursor-default'
                      : watchState === 'error' ? 'bg-danger-soft text-danger border border-danger-border'
                      : 'btn-outline'}`}
                  >
                    {watchState === 'saving' && <><Loader2 size={14} className="animate-spin" /> Adding…</>}
                    {watchState === 'watching' && <><BellRing size={14} /> Watching this plot</>}
                    {watchState === 'error' && <>Could not add — Retry</>}
                    {watchState === 'idle' && <><Bell size={14} /> Watch this plot</>}
                  </button>
                )}
                {watchState === 'watching' && (
                  <p className="text-xs text-muted leading-relaxed -mt-1">
                    We re-check this parcel daily and alert you on any mutation, encumbrance or
                    ownership change. <Link href="/watchlist" className="text-brand hover:underline">View watchlist →</Link>
                  </p>
                )}

                <button
                  onClick={() => window.print()}
                  className="btn btn-outline w-full"
                >
                  <Printer size={14} /> Download Report
                </button>
                <Link href="/" className="btn btn-outline w-full text-center">Search Another Record</Link>
                <Link href="/dashboard" className="btn btn-ghost w-full text-center">View Portfolio</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PropertyDetail({ params }: { params: Promise<{ id?: string }> }) {
  const resolvedParams = use(params);
  const rawId = resolvedParams?.id || 'SURVEY-XX';
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId); // survey numbers like "123/1" arrive percent-encoded
  } catch {
    /* keep raw */
  }
  const propertyId = decodedId.toUpperCase();

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col pt-24 pb-12 px-4 sm:px-6 print:pt-0">
      <TopNav />
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-brand animate-spin" /></div>}>
          <PropertyContent propertyId={propertyId} />
        </Suspense>
      </div>
    </main>
  );
}
