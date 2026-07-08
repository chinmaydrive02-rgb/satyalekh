"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Database, AlertTriangle, CheckCircle2, Crosshair, Plus, Loader2, X, FolderOpen, Trash2, Download, RefreshCw, Bell, BellRing } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { Reveal } from '@/components/motion';
import { API_BASE_URL, getUserEmail, setUserEmail, addToWatchlist, isDemoActive } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { FlaskConical } from 'lucide-react';

interface PortfolioAsset {
  id: string;
  survey_no: string;
  district: string | null;
  taluka: string | null;
  village: string | null;
  owner_name: string | null;
  area: string | null;
  tenure_type: string | null;
  encumbrances: string | null;
  jantri_rate: string | null;
  last_sale: string | null;
  notes: string | null;
  created_at: string;
}

// ── DEMO MODE ── seeded portfolio (client-side; never queries Supabase).
const DEMO_HOLDINGS: PortfolioAsset[] = [
  { id: 'demo-p1', survey_no: '128 P', district: 'Ahmedabad', taluka: 'City',    village: 'Navrangpura', owner_name: 'Rameshbhai K. Patel', area: '0-16-19 (Ha-Are-SqM)', tenure_type: 'Old Tenure', encumbrances: 'None', jantri_rate: '₹42,000/sqm', last_sale: '2019', notes: null, created_at: '2026-05-01T10:00:00Z' },
  { id: 'demo-p2', survey_no: '45',    district: 'Ahmedabad', taluka: 'Sanand',  village: 'Sanand',      owner_name: 'Kiritbhai M. Shah',    area: '1-20-00 (Ha-Are-SqM)', tenure_type: 'New Tenure', encumbrances: 'Live boja — Bank of Baroda', jantri_rate: '₹18,000/sqm', last_sale: '2022', notes: null, created_at: '2026-04-20T10:00:00Z' },
  { id: 'demo-p3', survey_no: '301',   district: 'Surat',     taluka: 'Choryasi', village: 'Bhimrad',    owner_name: 'Nileshbhai R. Desai',  area: '0-08-40 (Ha-Are-SqM)', tenure_type: 'Old Tenure', encumbrances: 'None', jantri_rate: '₹28,000/sqm', last_sale: '2021', notes: null, created_at: '2026-03-15T10:00:00Z' },
  { id: 'demo-p4', survey_no: '72',    district: 'Ahmedabad', taluka: 'Dholera', village: 'Dholera',     owner_name: 'Ambaben J. Chaudhary', area: '2-10-00 (Ha-Are-SqM)', tenure_type: 'Restricted (72-AA)', encumbrances: 'Tenure restriction; NA pending', jantri_rate: '₹4,200/sqm', last_sale: '2018', notes: null, created_at: '2026-02-10T10:00:00Z' },
];

export default function Dashboard() {
  const supabase = createClient();
  const [demoActive, setDemoActive] = useState(false);

  const [holdings, setHoldings] = useState<PortfolioAsset[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [showIngest, setShowIngest] = useState(false);
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // ── Load portfolio from Supabase ──────────────────────────
  const loadPortfolio = useCallback(async () => {
    // ── DEMO MODE ── seeded portfolio, no Supabase.
    if (isDemoActive()) {
      setDemoActive(true);
      setHoldings(DEMO_HOLDINGS);
      setIsLoadingPortfolio(false);
      return;
    }
    setIsLoadingPortfolio(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHoldings(data || []);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  // ── Fetch from AnyROR + save to Supabase ─────────────────
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!district.trim() || !taluka.trim() || !village.trim() || !surveyNo.trim()) return;
    setIsFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fetch-anyror`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district: district.trim(), taluka: taluka.trim(), village: village.trim(), survey_no: surveyNo.trim() })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Unknown error" }));
        alert(`Fetch error: ${errData.detail || "Backend returned an error."}`);
        return;
      }
      const data = await res.json();

      // Duplicate check
      const { data: existing } = await supabase
        .from('portfolio_assets')
        .select('id')
        .eq('survey_no', data.survey_no || surveyNo.trim())
        .eq('village', data.village || village.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        alert(`Survey ${surveyNo} from ${data.village || village} is already in your portfolio.`);
        setShowIngest(false);
        setDistrict(''); setTaluka(''); setVillage(''); setSurveyNo('');
        return;
      }

      await supabase.from('portfolio_assets').insert({
        survey_no: data.survey_no || surveyNo.trim(),
        district: data.district || district.trim(),
        taluka: data.taluka || taluka.trim(),
        village: data.village || village.trim(),
        owner_name: data.owner_name || null,
        area: data.area || null,
        tenure_type: data.tenure_type || null,
        encumbrances: data.encumbrances || null,
        jantri_rate: data.jantri_rate || null,
        last_sale: data.last_sale || null,
        mutation_entries: data.mutation_entries || null,
        record_type: 'OLD_SCAN_712',
      });

      await loadPortfolio();
      setShowIngest(false);
      setDistrict(''); setTaluka(''); setVillage(''); setSurveyNo('');
    } catch (err: any) {
      alert(err?.message?.includes('fetch')
        ? "Could not connect to the backend. Please start the backend server."
        : `Error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsFetching(false);
    }
  };

  // ── Delete asset ──────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from your portfolio?')) return;
    if (isDemoActive()) { setHoldings(prev => prev.filter(h => h.id !== id)); return; }
    setDeletingId(id);
    try {
      const { error } = await supabase.from('portfolio_assets').delete().eq('id', id);
      if (error) throw error;
      setHoldings(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Watch a portfolio parcel (daily re-check + alerts) ────
  const handleWatch = async (asset: PortfolioAsset) => {
    if (watchingId || watchedIds.has(asset.id)) return;
    let email = getUserEmail();
    if (!email) {
      const entered = window.prompt('Enter your email to get change alerts for this parcel:');
      if (!entered || !entered.includes('@')) return;
      email = entered.trim().toLowerCase();
      setUserEmail(email);
    }
    setWatchingId(asset.id);
    try {
      await addToWatchlist({
        email,
        district: asset.district || '',
        taluka: asset.taluka || '',
        village: asset.village || '',
        survey_no: asset.survey_no,
      });
      setWatchedIds(prev => new Set(prev).add(asset.id));
    } catch {
      alert('Could not add to watchlist — please try again.');
    } finally {
      setWatchingId(null);
    }
  };

  // ── CSV Export ────────────────────────────────────────────
  const handleExport = () => {
    if (holdings.length === 0) return;
    const headers = ['Survey No', 'Village', 'Taluka', 'District', 'Owner', 'Area', 'Tenure Type', 'Encumbrances', 'Jantri Rate', 'Last Sale', 'Added On'];
    const rows = holdings.map(h => [
      h.survey_no, h.village || '', h.taluka || '', h.district || '',
      h.owner_name || '', h.area || '', h.tenure_type || '',
      h.encumbrances || '', h.jantri_rate || '', h.last_sale || '',
      new Date(h.created_at).toLocaleDateString('en-IN')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'satya-lekh-portfolio.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const totalCleared = holdings.filter(h => !h.encumbrances || h.encumbrances.toLowerCase() === 'none').length;
  const totalRisks = holdings.filter(h => h.encumbrances && h.encumbrances.toLowerCase() !== 'none').length;
  const isFormValid = district.trim() && taluka.trim() && village.trim() && surveyNo.trim();

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col pt-24 pb-12 px-4 sm:px-6">
      <TopNav />
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <Reveal>
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-border pb-6">
          <div>
            <p className="eyebrow mb-1">Portfolio</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Your saved parcels</h1>
            <p className="text-muted text-sm flex items-center gap-2">
              <Database size={14}/> {isLoadingPortfolio ? 'Loading…' : `${holdings.length} asset${holdings.length === 1 ? '' : 's'} tracked`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {holdings.length > 0 && (
              <button onClick={handleExport} className="btn btn-outline">
                <Download size={14}/> Export CSV
              </button>
            )}
            <button onClick={() => loadPortfolio()} title="Refresh" className="btn btn-outline px-3">
              <RefreshCw size={14}/>
            </button>
            <button onClick={() => setShowIngest(!showIngest)} className="btn btn-primary">
              {showIngest ? <><X size={14}/> Close</> : <><Plus size={14}/> Add Asset</>}
            </button>
          </div>
        </div>
        </Reveal>

        {demoActive && (
          <div className="text-sm text-warning bg-warning-soft border border-warning-border rounded-lg px-4 py-2.5 flex items-start gap-2">
            <FlaskConical size={14} className="mt-0.5 shrink-0" />
            <span>Demo portfolio — sample parcels across Ahmedabad and Surat. Click any survey number to open its title report; watch and export work on this seeded data.</span>
          </div>
        )}

        {/* Ingest Form */}
        {showIngest && (
          <form
            onSubmit={handleIngest}
            className="sl-anim card p-6 border-l-4 border-l-brand flex flex-col gap-4"
            style={{ animation: 'sl-fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) both' }}
          >
            <h2 className="text-base font-semibold text-ink flex items-center gap-2"><Crosshair size={15} className="text-brand"/> Fetch a parcel from AnyROR</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label">District (જીલ્લો)</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ahmedabad" className="input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Taluka (તાલુકો)</label>
                <input type="text" value={taluka} onChange={e => setTaluka(e.target.value)} placeholder="e.g. Daskroi" className="input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Village (ગામ)</label>
                <input type="text" value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Bopal" className="input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Survey No. (સર્વે નંબર)</label>
                <input type="text" value={surveyNo} onChange={e => setSurveyNo(e.target.value)} placeholder="e.g. 123" className="input font-mono" />
              </div>
            </div>
            <button type="submit" disabled={isFetching || !isFormValid} className="btn btn-primary w-full md:w-auto self-end">
              {isFetching ? <><Loader2 size={14} className="animate-spin"/> Fetching from AnyROR…</> : "Fetch & Save Asset"}
            </button>
          </form>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Reveal delay={60} className="h-full">
            <div className="card card-lift p-6 border-l-4 border-l-brand flex flex-col justify-between min-h-[110px] h-full">
              <span className="eyebrow">Total Assets</span>
              <span className="text-3xl font-bold font-mono text-ink">{isLoadingPortfolio ? '—' : holdings.length}</span>
            </div>
          </Reveal>
          <Reveal delay={150} className="h-full">
            <div className="card card-lift p-6 border-l-4 border-l-success flex flex-col justify-between min-h-[110px] h-full">
              <span className="eyebrow">Clear Title</span>
              <span className="text-3xl font-bold font-mono text-success">{isLoadingPortfolio ? '—' : totalCleared}</span>
            </div>
          </Reveal>
          <Reveal delay={240} className="h-full">
            <div className="card card-lift p-6 border-l-4 border-l-danger flex flex-col justify-between min-h-[110px] h-full">
              <span className="eyebrow">Encumbered</span>
              <span className="text-3xl font-bold font-mono text-danger">{isLoadingPortfolio ? '—' : totalRisks}</span>
            </div>
          </Reveal>
        </div>

        {/* Portfolio Table */}
        <Reveal delay={120}>
        <div className="card overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-muted text-xs uppercase tracking-wider bg-surface-soft">
                <th className="p-4 font-semibold">Survey No.</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Owner</th>
                <th className="p-4 font-semibold">Area</th>
                <th className="p-4 font-semibold">Jantri Rate</th>
                <th className="p-4 font-semibold text-right">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoadingPortfolio ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={26} className="text-brand animate-spin" />
                      <div className="text-muted text-sm">Loading your portfolio…</div>
                    </div>
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FolderOpen size={36} className="text-faint" />
                      <div className="text-ink font-medium text-sm">No saved parcels yet</div>
                      <div className="text-muted text-sm">Search a land record then click &quot;Save to Portfolio&quot;</div>
                      <Link href="/upload" className="btn btn-primary">
                        Go to Title Scanner
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                holdings.map((asset) => {
                  const isEncumbered = asset.encumbrances && asset.encumbrances.toLowerCase() !== 'none';
                  const isWatched = watchedIds.has(asset.id);
                  return (
                    <tr key={asset.id} className="border-b border-border hover:bg-surface-soft/60 transition-colors">
                      <td className="p-4">
                        <Link
                          href={`/property/SURVEY-${asset.survey_no}?district=${encodeURIComponent(asset.district||'')}&taluka=${encodeURIComponent(asset.taluka||'')}&village=${encodeURIComponent(asset.village||'')}`}
                          className="font-mono font-semibold text-brand hover:underline"
                        >
                          {asset.survey_no}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="text-ink">{asset.village}</div>
                        <div className="text-muted text-xs">{asset.taluka}, {asset.district}</div>
                      </td>
                      <td className="p-4 text-ink-soft">{asset.owner_name || '—'}</td>
                      <td className="p-4 text-ink-soft font-mono text-xs">{asset.area || '—'}</td>
                      <td className="p-4 text-ink-soft font-mono text-xs">{asset.jantri_rate || '—'}</td>
                      <td className="p-4 text-right">
                        <span className={`badge border ${!isEncumbered ? 'bg-success-soft text-success border-success-border' : 'bg-danger-soft text-danger border-danger-border'}`}>
                          {!isEncumbered ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                          {isEncumbered ? 'Encumbered' : 'Clear'}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleWatch(asset)}
                          disabled={watchingId === asset.id || isWatched}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-70 ${isWatched ? 'text-success' : 'text-muted hover:text-brand hover:bg-brand-soft'}`}
                          title={isWatched ? 'On your watchlist — daily re-checks active' : 'Watch: daily re-check + change alerts'}
                        >
                          {watchingId === asset.id
                            ? <Loader2 size={15} className="animate-spin"/>
                            : isWatched ? <BellRing size={15}/> : <Bell size={15}/>}
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={deletingId === asset.id}
                          className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                          title="Remove from portfolio"
                        >
                          {deletingId === asset.id ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </Reveal>
      </div>
    </main>
  );
}
