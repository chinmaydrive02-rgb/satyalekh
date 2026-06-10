"use client";

import React, { useState, useMemo, use, Suspense } from 'react';
import { ChevronLeft, MapPin, Activity, AlertCircle, FileText, Share2, Database, Loader2, Search, User, BookmarkPlus, CheckCircle2, Download } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { API_BASE_URL, getUserEmail, fetchCredits } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function PropertyContent({ propertyId }: { propertyId: string }) {
  const searchParams = useSearchParams();
  
  // Extract location context from URL params (set by SearchWidget)
  const urlDistrict = searchParams.get('district') || 'Ahmedabad';
  const urlTaluka = searchParams.get('taluka') || 'CITY';
  const urlVillage = searchParams.get('village') || 'Navrangpura';
  const urlRecordType = searchParams.get('record_type') || 'OLD_SCAN_712';
  
  const supabase = createClient();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');

  const handleSaveToPortfolio = async () => {
    if (!record || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('portfolio_assets')
        .select('id')
        .eq('survey_no', record.survey_no || propertyId.replace('SURVEY-', ''))
        .eq('village', record.village || urlVillage)
        .limit(1);

      if (existing && existing.length > 0) {
        setSaveState('duplicate');
        setTimeout(() => setSaveState('idle'), 3000);
        return;
      }

      const { error: insertError } = await supabase.from('portfolio_assets').insert({
        survey_no: record.survey_no || propertyId.replace('SURVEY-', ''),
        district: record.district || urlDistrict,
        taluka: record.taluka || urlTaluka,
        village: record.village || urlVillage,
        owner_name: record.owner_name || null,
        area: record.area || null,
        tenure_type: record.tenure_type || null,
        encumbrances: record.encumbrances || null,
        jantri_rate: record.jantri_rate || null,
        last_sale: record.last_sale || null,
        mutation_entries: record.mutation_entries || null,
        record_type: 'OLD_SCAN_712',
      });
      if (insertError) throw insertError;
      setSaveState('saved');
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const surveyNum = propertyId.replace('SURVEY-', '');
  const hasSurveyNumber = !!surveyNum && surveyNum !== 'XX';

  // Manual fetch — only runs when the user clicks "FETCH RECORD FROM ANYROR".
  // The scrape takes 30-120s (live CAPTCHA solving), so we never auto-trigger it.
  const fetchPropertyData = async () => {
    if (isLoading) return;

    // Credit gate: if payments are enabled and the user has no credits,
    // send them to the pricing page.
    const userEmail = getUserEmail();
    if (userEmail) {
      const info = await fetchCredits(userEmail);
      if (info?.payments_enabled && info.credits <= 0) {
        window.location.href = '/pricing';
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userEmail) headers['X-User-Email'] = userEmail;
      const res = await fetch(`${API_BASE_URL}/fetch-anyror`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          survey_no: surveyNum,
          district: urlDistrict,
          taluka: urlTaluka,
          village: urlVillage,
          record_type: urlRecordType
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
      } else if (res.status === 402) {
        const errData = await res.json().catch(() => ({ detail: 'Payment required' }));
        setError(errData.detail || 'Payment required — purchase search credits on the pricing page.');
      } else {
        const errData = await res.json().catch(() => ({ detail: "Unknown error" }));
        setError(errData.detail || "Could not fetch record from backend.");
      }
    } catch {
      setError("Backend not available. It may be cold-starting (60-90s on free hosting) — try again in a minute.");
    } finally {
      setIsLoading(false);
    }
  };

  // If the scrape failed because the survey number wasn't found, the backend
  // returns "...Available options (first 15): ['123', '123/1', ...]" — parse
  // those so the user can pick the correct one.
  const availableOptions = useMemo<string[]>(() => {
    if (!error) return [];
    const match = error.match(/Available options \(first \d+\): \[(.*?)\]/);
    if (!match) return [];
    return match[1]
      .split(',')
      .map(s => s.replace(/['"]/g, '').trim())
      .filter(Boolean);
  }, [error]);

  const optionHref = (opt: string) =>
    `/property/SURVEY-${encodeURIComponent(opt)}` +
    `?district=${encodeURIComponent(urlDistrict)}` +
    `&taluka=${encodeURIComponent(urlTaluka)}` +
    `&village=${encodeURIComponent(urlVillage)}` +
    `&record_type=${encodeURIComponent(urlRecordType)}`;

  const hasEncumbrances = record?.encumbrances && 
    record.encumbrances.toLowerCase() !== 'none' && 
    record.encumbrances !== '—';

  return (
    <>
      {/* Navigation Breadcrumb */}
      <Link href="/dashboard" className="flex items-center gap-2 text-[#00f0ff] text-xs font-bold uppercase tracking-widest hover:text-[#dbfcff] transition-colors w-fit">
        <ChevronLeft size={16} /> Return to Portfolio
      </Link>

      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#3b494b]/40 pb-6 gap-4">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-5xl font-display uppercase tracking-tight">{propertyId.replace('SURVEY-', '')}</h1>
               {record && (
                 <span className={`px-3 py-1 text-xs uppercase font-bold tracking-widest border ${
                   hasEncumbrances 
                     ? 'bg-[#ba1b24]/10 text-[#ba1b24] border-[#ba1b24]/50' 
                     : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/50'
                 }`}>
                   {hasEncumbrances ? 'ENCUMBERED' : 'CLEAR TITLE'}
                 </span>
               )}
            </div>
            <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
               <MapPin size={14} className="text-[#00f0ff]"/> {record?.village || urlVillage}, {record?.taluka?.replace(/_/g, ' ') || urlTaluka.replace(/_/g, ' ')}, {record?.district || urlDistrict}
            </p>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-3 border border-[#3b494b] text-[#849495] text-xs font-bold tracking-widest uppercase hover:bg-[#1c1b1b] hover:text-[#dbfcff] transition-all flex items-center gap-2">
               <Share2 size={14}/> Share Intel
            </button>
            <Link href="/upload" className="px-6 py-3 bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all flex items-center gap-2">
               <Search size={14}/> Fetch via RPA
            </Link>
         </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="text-[#00f0ff] animate-spin" />
          <span className="text-xs text-[#849495] uppercase tracking-widest">Fetching Real Data from AnyROR Government Portal...</span>
          <span className="text-[10px] text-[#3b494b]">This may take 30-120 seconds (CAPTCHA solving + data extraction). First search may take 60-90s extra while the backend warms up.</span>
        </div>
      )}

      {/* Pre-Fetch State — record is only fetched when the user clicks the button */}
      {!isLoading && !record && (
        <div className="glass-panel p-8 md:p-12 flex flex-col gap-8 border border-[#3b494b]/40">

          {/* Search Parameter Summary */}
          <div>
            <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2">Search Parameters</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">District</span>
                <span className="text-sm font-mono text-[#dbfcff]">{urlDistrict}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Taluka</span>
                <span className="text-sm font-mono text-[#dbfcff]">{urlTaluka.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Village</span>
                <span className="text-sm font-mono text-[#dbfcff]">{urlVillage}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Survey No.</span>
                <span className="text-sm font-mono text-[#00f0ff]">{hasSurveyNumber ? surveyNum : '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Record Type</span>
                <span className="text-sm font-mono text-[#dbfcff]">{urlRecordType.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {/* Error from a previous fetch attempt */}
          {error && (
            <div className="flex flex-col gap-4 p-4 bg-[#111111]/80 border-l-2 border-[#ba1b24]">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-[#ba1b24] mt-0.5 flex-shrink-0" />
                <p className="text-xs font-mono text-[#ba1b24] break-words">{error}</p>
              </div>
              {availableOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Valid survey numbers found in this village — pick the right one:</span>
                  <div className="flex flex-wrap gap-2">
                    {availableOptions.map(opt => (
                      <Link
                        key={opt}
                        href={optionHref(opt)}
                        className="px-3 py-1.5 border border-[#00f0ff]/40 bg-[#00f0ff]/5 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/15 transition-colors"
                      >
                        {opt}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fetch Trigger */}
          {hasSurveyNumber ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <button
                onClick={fetchPropertyData}
                className="px-10 py-4 bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] text-[#002022] text-sm font-bold tracking-[0.15em] uppercase hover:brightness-110 transition-all flex items-center gap-3"
              >
                <Download size={16} /> Fetch Record from AnyROR
              </button>
              <p className="text-[10px] text-[#849495] max-w-md leading-relaxed">
                <span className="text-[#eab308] font-bold">⚠</span> This will take 30-120 seconds — the bot navigates the live government portal and solves the CAPTCHA with Gemini Vision. First search may take 60-90s extra while the backend warms up.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 text-center">
              <Database size={48} className="text-[#3b494b]" />
              <p className="text-xs text-[#3b494b] max-w-md">No survey number specified. Use the Title Scanner to search for a record.</p>
              <Link href="/upload" className="px-8 py-3 bg-gradient-to-r from-[#de4ced] to-[#ff00f0] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all">
                Open Title Scanner
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Real Data Display */}
      {!isLoading && record && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#1c1b1b]/50">
                 <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2">Core Land Intelligence</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase flex items-center gap-1"><User size={10}/> Owner Name</span>
                       <span className="text-lg font-display text-[#dbfcff]">{record.owner_name || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Total Area</span>
                       <span className="text-lg font-display text-[#dbfcff]">{record.area || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Tenure Type</span>
                       <span className="text-lg font-display text-[#dbfcff]">{record.tenure_type || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Cultivation</span>
                       <span className="text-lg font-display text-[#dbfcff]">{record.cultivation || '—'}</span>
                    </div>
                 </div>
              </div>
              <div className="glass-panel p-8 border border-[#3b494b]/40">
                 <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2"><Activity size={18}/> Financial Intelligence</h2>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#4edea3]">
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Jantri Rate</span>
                       <span className="text-lg font-display text-[#4edea3]">{record.jantri_rate || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#00f0ff]">
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Last Sale</span>
                       <span className="text-lg font-display text-[#dbfcff]">{record.last_sale || '—'}</span>
                    </div>
                 </div>
              </div>
              <div className="glass-panel p-8 border border-[#3b494b]/40">
                 <h2 className="text-xl font-display uppercase text-[#de4ced] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2"><AlertCircle size={18}/> Risk Assessment</h2>
                 <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 border-[#849495]">
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Mutation Entries</span>
                       <span className="text-sm font-mono text-[#dbfcff]">{record.mutation_entries || 'No mutation data'}</span>
                    </div>
                    <div className={`flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 ${hasEncumbrances ? 'border-[#ba1b24]' : 'border-[#4edea3]'}`}>
                       <span className={`text-[10px] tracking-widest uppercase font-bold ${hasEncumbrances ? 'text-[#ba1b24]' : 'text-[#4edea3]'}`}>Encumbrances</span>
                       <span className={`text-sm font-mono ${hasEncumbrances ? 'text-[#ba1b24]' : 'text-[#4edea3]'}`}>{record.encumbrances || 'None detected'}</span>
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex flex-col gap-6">
              <div className="glass-panel p-6 border border-[#3b494b]/40 sticky top-24">
                 <h2 className="text-lg font-display uppercase text-[#dbfcff] flex items-center gap-2 mb-6"><FileText size={16} className="text-[#00f0ff]"/> Record Summary</h2>
                 <div className="flex flex-col gap-4 text-sm">
                    <div className="flex justify-between border-b border-[#3b494b]/20 pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">Survey No.</span><span className="text-[#dbfcff] font-mono">{record.survey_no || '—'}</span></div>
                    <div className="flex justify-between border-b border-[#3b494b]/20 pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">Village</span><span className="text-[#dbfcff]">{record.village || '—'}</span></div>
                    <div className="flex justify-between border-b border-[#3b494b]/20 pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">District</span><span className="text-[#dbfcff]">{record.district || '—'}</span></div>
                    <div className="flex justify-between border-b border-[#3b494b]/20 pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">Taluka</span><span className="text-[#dbfcff]">{record.taluka?.replace(/_/g, ' ') || '—'}</span></div>
                    <div className="flex justify-between border-b border-[#3b494b]/20 pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">Record</span><span className="text-[#00f0ff] text-xs">{record.message || '—'}</span></div>
                    <div className="flex justify-between pb-2"><span className="text-[#849495] text-xs uppercase tracking-widest">Status</span><span className={`text-xs font-bold uppercase ${record.status === 'SUCCESS' ? 'text-[#4edea3]' : 'text-[#ba1b24]'}`}>{record.status || '—'}</span></div>
                 </div>
                 <div className="mt-6 flex flex-col gap-3">
                    {record && (
                      <button
                        onClick={handleSaveToPortfolio}
                        disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'duplicate'}
                        className={`w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2
                          ${saveState === 'saved' ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/50 cursor-default'
                          : saveState === 'duplicate' ? 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/50 cursor-default'
                          : saveState === 'error' ? 'bg-[#ba1b24]/10 text-[#ba1b24] border border-[#ba1b24]/50'
                          : 'bg-gradient-to-r from-[#de4ced] to-[#ff00f0] text-[#002022] hover:brightness-110'}`}
                      >
                        {saveState === 'saving' && <><Loader2 size={12} className="animate-spin"/> Saving...</>}
                        {saveState === 'saved' && <><CheckCircle2 size={12}/> Saved to Portfolio</>}
                        {saveState === 'duplicate' && <><CheckCircle2 size={12}/> Already in Portfolio</>}
                        {saveState === 'error' && <>Save Failed — Retry</>}
                        {saveState === 'idle' && <><BookmarkPlus size={12}/> Save to Portfolio</>}
                      </button>
                    )}
                    <Link href="/upload" className="w-full py-3 text-center text-[#0a0a0a] bg-[#4edea3] hover:bg-[#dbfcff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">Search Another Record</Link>
                    <Link href="/dashboard" className="w-full py-3 text-center text-[#dbfcff] border border-[#3b494b] bg-black/40 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">View Portfolio</Link>
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
  const propertyId = (resolvedParams?.id || 'SURVEY-XX').toUpperCase();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      <div className="z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-[#00f0ff] animate-spin" /></div>}>
          <PropertyContent propertyId={propertyId} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
