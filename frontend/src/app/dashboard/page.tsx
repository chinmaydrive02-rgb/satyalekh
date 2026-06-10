"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Database, TrendingUp, AlertTriangle, CheckCircle2, Crosshair, Plus, Loader2, X, FolderOpen, Trash2, Download, RefreshCw } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

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

export default function Dashboard() {
  const supabase = createClient();

  const [holdings, setHoldings] = useState<PortfolioAsset[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [showIngest, setShowIngest] = useState(false);
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load portfolio from Supabase ──────────────────────────
  const loadPortfolio = useCallback(async () => {
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
        alert(`RPA Error: ${errData.detail || "Backend returned an error."}`);
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
        ? "Could not connect to the RPA backend. Please start the backend server."
        : `Error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsFetching(false);
    }
  };

  // ── Delete asset ──────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from your portfolio?')) return;
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

  const inputClass = "w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-mono text-xs focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]";
  const totalCleared = holdings.filter(h => !h.encumbrances || h.encumbrances.toLowerCase() === 'none').length;
  const totalRisks = holdings.filter(h => h.encumbrances && h.encumbrances.toLowerCase() !== 'none').length;
  const isFormValid = district.trim() && taluka.trim() && village.trim() && surveyNo.trim();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-20 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      <div className="z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8 mt-4">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-[#3b494b]/40 pb-6">
          <div>
            <h1 className="text-4xl font-display uppercase tracking-tight mb-2">SOVEREIGN PORTFOLIO</h1>
            <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
              <Database size={14}/> Active Intelligence Contracts — {isLoadingPortfolio ? '...' : `${holdings.length} Assets`}
            </p>
          </div>
          <div className="flex gap-3">
            {holdings.length > 0 && (
              <button onClick={handleExport} className="px-4 py-3 border border-[#3b494b] text-[#849495] text-xs font-bold tracking-widest uppercase hover:border-[#4edea3] hover:text-[#4edea3] transition-all flex items-center gap-2">
                <Download size={14}/> Export CSV
              </button>
            )}
            <button onClick={() => loadPortfolio()} title="Refresh" className="px-4 py-3 border border-[#3b494b] text-[#849495] text-xs font-bold tracking-widest uppercase hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all flex items-center gap-2">
              <RefreshCw size={14}/>
            </button>
            <button onClick={() => setShowIngest(!showIngest)} className="px-6 py-3 bg-[#00f0ff] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#dbfcff] transition-all flex items-center gap-2">
              {showIngest ? <><X size={14}/> Close</> : <><Plus size={14}/> Add Asset</>}
            </button>
          </div>
        </div>

        {/* Ingest Form */}
        {showIngest && (
          <form onSubmit={handleIngest} className="glass-panel p-6 border-l-4 border-[#00f0ff] flex flex-col gap-4">
            <h2 className="text-sm font-display text-[#00f0ff] uppercase flex items-center gap-2 mb-2"><Crosshair size={14}/> AnyROR Target Retrieval</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">District (જીલ્લો)</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ahmedabad" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Taluka (તાલુકો)</label>
                <input type="text" value={taluka} onChange={e => setTaluka(e.target.value)} placeholder="e.g. Daskroi" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Village (ગામ)</label>
                <input type="text" value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Bopal" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Survey No. (સર્વે નંબર)</label>
                <input type="text" value={surveyNo} onChange={e => setSurveyNo(e.target.value)} placeholder="e.g. 123" className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={isFetching || !isFormValid} className="mt-2 w-full md:w-auto self-end py-3 px-8 text-[#0a0a0a] font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-[#de4ced] to-[#ff00f0] disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2">
              {isFetching ? <><Loader2 size={14} className="animate-spin"/> Fetching from AnyROR...</> : "Fetch & Ingest Asset"}
            </button>
          </form>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-l-2 border-l-[#00f0ff] flex flex-col justify-between h-[120px]">
            <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Total Assets</span>
            <span className="text-3xl font-display text-[#dbfcff]">{isLoadingPortfolio ? '—' : holdings.length}</span>
          </div>
          <div className="glass-panel p-6 border-l-2 border-l-[#4edea3] flex flex-col justify-between h-[120px]">
            <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Clear Title</span>
            <span className="text-3xl font-display text-[#dbfcff]">{isLoadingPortfolio ? '—' : totalCleared}</span>
          </div>
          <div className="glass-panel p-6 border-l-2 border-l-[#ba1b24] flex flex-col justify-between h-[120px] bg-[#ba1b24]/5">
            <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Encumbered</span>
            <span className="text-3xl font-display text-[#ba1b24]">{isLoadingPortfolio ? '—' : totalRisks}</span>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="glass-panel mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3b494b]/40 text-[#849495] text-[10px] tracking-widest uppercase bg-[#131313]">
                <th className="p-4 font-normal">Survey No.</th>
                <th className="p-4 font-normal">Location</th>
                <th className="p-4 font-normal">Owner</th>
                <th className="p-4 font-normal">Area</th>
                <th className="p-4 font-normal">Jantri Rate</th>
                <th className="p-4 font-normal text-right">Status</th>
                <th className="p-4 font-normal text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {isLoadingPortfolio ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={28} className="text-[#00f0ff] animate-spin" />
                      <div className="text-[#849495] text-xs uppercase tracking-widest">Loading Portfolio from Supabase...</div>
                    </div>
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FolderOpen size={40} className="text-[#3b494b]" />
                      <div className="text-[#849495] font-sans text-xs uppercase tracking-widest">No Active Holdings</div>
                      <div className="text-[#3b494b] font-sans text-xs">Search a land record then click &quot;Save to Portfolio&quot;</div>
                      <Link href="/upload" className="px-6 py-2 text-[10px] bg-[#00f0ff] text-[#002022] font-bold uppercase tracking-widest hover:bg-[#dbfcff] transition-all">
                        Go to Title Scanner
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                holdings.map((asset) => {
                  const isEncumbered = asset.encumbrances && asset.encumbrances.toLowerCase() !== 'none';
                  return (
                    <tr key={asset.id} className="border-b border-[#3b494b]/20 hover:bg-[#1c1b1b] transition-colors group">
                      <td className="p-4 text-[#00f0ff] font-bold">
                        <Link
                          href={`/property/SURVEY-${asset.survey_no}?district=${encodeURIComponent(asset.district||'')}&taluka=${encodeURIComponent(asset.taluka||'')}&village=${encodeURIComponent(asset.village||'')}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <TrendingUp size={14}/> {asset.survey_no}
                        </Link>
                      </td>
                      <td className="p-4 text-xs">
                        <div className="text-[#dbfcff]">{asset.village}</div>
                        <div className="text-[#849495]">{asset.taluka}, {asset.district}</div>
                      </td>
                      <td className="p-4 text-[#dbfcff] text-xs">{asset.owner_name || '—'}</td>
                      <td className="p-4 text-[#dbfcff] text-xs">{asset.area || '—'}</td>
                      <td className="p-4 text-[#4edea3] text-xs font-bold">{asset.jantri_rate || '—'}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-widest uppercase font-bold border ${!isEncumbered ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/50' : 'bg-[#ba1b24]/10 text-[#ba1b24] border-[#ba1b24]/50'}`}>
                          {!isEncumbered ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                          {isEncumbered ? 'ENCUMBERED' : 'CLEAR'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={deletingId === asset.id}
                          className="p-2 text-[#3b494b] hover:text-[#ba1b24] transition-colors disabled:opacity-50"
                          title="Remove from portfolio"
                        >
                          {deletingId === asset.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
