"use client";

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Loader2, Cpu, ShieldCheck, BookmarkPlus, CheckCircle2, ChevronDown, AlertCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import JobProgress from '@/components/JobProgress';
import TitleReportView from '@/components/TitleReport';
import {
  API_BASE_URL, getUserEmail, setUserEmail, fetchCredits, fetchConfig,
  startTitleReport, pollJob, parseSurveySuggestions,
  ApiError, Job, TitleReport,
} from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

// Exact AnyROR Record Types from https://anyror.gujarat.gov.in/LandRecordRural.aspx
const RECORD_TYPES = [
  { value: "OLD_SCAN_712", label: "OLD SCANNED VF-7/12 DETAILS (જૂના સ્કેન કરેલ ગા.ન. ૭/૧૨ ની વિગતો)" },
  { value: "OLD_SCAN_6", label: "OLD SCANNED VF-6 ENTRY DETAILS (જૂના સ્કેન કરેલ હક્ક પત્રક ગા.ન. ૬ ની વિગતો)" },
  { value: "VF7", label: "VF-7 SURVEY NO DETAILS (ગા.ન. ૭ ની વિગતો)" },
  { value: "VF8A", label: "VF-8A KHATA DETAILS (ગા.ન. ૮અ ની વિગતો)" },
  { value: "VF6", label: "VF-6 ENTRY DETAILS (હક્ક પત્રક ગા.ન. ૬ ની વિગતો)" },
  { value: "135D", label: "135-D NOTICE FOR MUTATION (હક્ક પત્રક ફેરફાર માટે ૧૩૫-ડી નોટીસ)" },
  { value: "INTEGRATED", label: "INTEGRATED SURVEY NO DETAILS (સરવે નંબરને લગતી સંપૂર્ણ માહિતી)" },
  { value: "OWNER_NAME", label: "KNOW KHATA BY OWNER NAME (ખાતેદારના નામ પરથી ખાતુ જાણવા)" },
  { value: "E_CHAVDI", label: "e-CHAVDI (ઈ-ચાવડી)" },
  { value: "REVENUE_CASE", label: "REVENUE CASE DETAILS (જમીન રેકર્ડ ને લગતા કેસની વિગત)" },
];

export default function DocumentUpload() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('auto');

  // Manual Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Automation State
  const [recordType, setRecordType] = useState('OLD_SCAN_712');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');   // English name for display
  const [villageGujarati, setVillageGujarati] = useState(''); // Gujarati name sent to backend
  const [surveyNo, setSurveyNo] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');

  // Job-based scrape state (shared contract with property/[id])
  const [autoPhase, setAutoPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [autoJob, setAutoJob] = useState<Job | null>(null);
  const [autoReport, setAutoReport] = useState<TitleReport | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null);
  const autoAbortRef = useRef<AbortController | null>(null);

  // Cascading dropdown data
  interface Village { english: string; gujarati: string; }
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas]     = useState<string[]>([]);
  const [villages, setVillages]   = useState<Village[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas]     = useState(false);
  const [loadingVillages, setLoadingVillages]   = useState(false);

  const handleSaveToPortfolio = async () => {
    const rec = autoReport?.record;
    if (!rec || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const { data: existing } = await supabase
        .from('portfolio_assets')
        .select('id')
        .eq('survey_no', rec.survey_no || surveyNo.trim())
        .eq('village', rec.village || village.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        setSaveState('duplicate');
        setTimeout(() => setSaveState('idle'), 3000);
        return;
      }

      const { error } = await supabase.from('portfolio_assets').insert({
        survey_no: rec.survey_no || surveyNo.trim(),
        district: rec.district || district.trim(),
        taluka: rec.taluka || taluka.trim(),
        village: rec.village || village.trim(),
        owner_name: rec.owner_name || null,
        area: rec.area || null,
        tenure_type: rec.tenure_type || null,
        encumbrances: rec.encumbrances || null,
        jantri_rate: rec.jantri_rate || null,
        last_sale: rec.last_sale || null,
        mutation_entries: rec.mutation_entries || null,
        record_type: recordType,
      });
      if (error) throw error;
      setSaveState('saved');
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  // Get dynamic label for the last field based on record type
  const getEntryFieldLabel = () => {
    switch (recordType) {
      case 'VF8A': return 'Khata No. (ખાતા નંબર)';
      case 'VF6': return 'Entry No. (નોંધ નંબર)';
      case 'OLD_SCAN_712': return 'Scanned Record Survey/Block No. (સ્કેન રેકર્ડ મુજબ સર્વે/બ્લોક નંબર)';
      case 'OLD_SCAN_6': return 'Scanned Record Survey/Block No. (સ્કેન રેકર્ડ મુજબ સર્વે/બ્લોક નંબર)';
      case '135D': return 'Survey/Block No. (સર્વે/બ્લોક નંબર)';
      case 'INTEGRATED': return 'Survey/Block No. (સર્વે/બ્લોક નંબર)';
      default: return 'Survey/Block No. (સર્વે/બ્લોક નંબર)';
    }
  };

  // Whether this record type requires owner name instead of survey number
  const needsOwnerName = recordType === 'OWNER_NAME';

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE_URL}/analyze-record`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Analysis Failed");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("System error reading document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Starts the background scrape job (same jobs API as the property page). */
  const launchJob = async (surveyOverride?: string) => {
    if (autoPhase === 'running') return;

    // Credit gate: if payments are enabled on the backend and the user has
    // no credits, redirect to the pricing page before launching the bot.
    let userEmail = getUserEmail();
    const cfg = await fetchConfig();
    if (cfg?.payments_enabled && !userEmail) {
      const entered = window.prompt(
        `Enter your email to claim ${cfg.free_trial_credits} free search${cfg.free_trial_credits === 1 ? '' : 'es'} (no card needed). Credits are linked to your email.`
      );
      if (!entered || !entered.includes('@')) return;
      userEmail = entered.trim().toLowerCase();
      setUserEmail(userEmail);
    }
    if (userEmail) {
      const info = await fetchCredits(userEmail);
      if (info?.payments_enabled && info.credits <= 0) {
        alert("No search credits remaining. You'll be redirected to the pricing page.");
        window.location.href = '/pricing';
        return;
      }
    }

    const surveyValue = surveyOverride ?? (needsOwnerName ? ownerName.trim() : surveyNo.trim());

    setAutoPhase('running');
    setAutoJob(null);
    setAutoReport(null);
    setAutoError(null);
    setAutoSuggestions([]);
    setSaveState('idle');
    setJobStartedAt(Date.now());

    try {
      const { job_id } = await startTitleReport(
        {
          record_type: recordType,
          district: district.trim(),
          taluka: taluka.trim(),
          village: (villageGujarati || village).trim(),
          survey_no: surveyValue,
          include_chain: true,
        },
        userEmail || undefined
      );

      autoAbortRef.current?.abort();
      const ac = new AbortController();
      autoAbortRef.current = ac;

      const final = await pollJob(job_id, { signal: ac.signal, onUpdate: setAutoJob, intervalMs: 2500 });
      if (final.status === 'done' && final.result) {
        setAutoReport(final.result);
        setAutoPhase('done');
      } else {
        const msg = final.error || 'The search failed on the government portal. Please retry.';
        setAutoError(msg);
        setAutoSuggestions(
          final.suggestions && final.suggestions.length > 0
            ? final.suggestions
            : parseSurveySuggestions(msg)
        );
        setAutoPhase('error');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (err instanceof ApiError && err.status === 402) {
        alert(err.message || 'Payment required — purchase search credits first.');
        window.location.href = '/pricing';
        return;
      }
      const msg = err instanceof Error ? err.message : 'Could not connect to the backend. Please retry in a minute.';
      setAutoError(msg);
      setAutoSuggestions(parseSurveySuggestions(msg));
      setAutoPhase('error');
    }
  };

  const handleAutomate = (e: React.FormEvent) => {
    e.preventDefault();
    launchJob();
  };

  /** Suggestion chip click: retry immediately with the corrected survey number. */
  const applySuggestion = (opt: string) => {
    setSurveyNo(opt);
    launchJob(opt);
  };

  useEffect(() => {
    return () => autoAbortRef.current?.abort();
  }, []);

  // Warm up the Render backend as soon as the page mounts (free tier cold-starts)
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, []);

  // Cascading dropdown effects
  useEffect(() => {
    setLoadingDistricts(true);
    fetch(`${API_BASE_URL}/options/districts`)
      .then(r => r.json()).then(d => setDistricts(d.districts || [])).catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, []);

  useEffect(() => {
    if (!district) { setTalukas([]); setTaluka(''); setVillages([]); return; }
    setLoadingTalukas(true);
    setTaluka(''); setVillages([]);
    fetch(`${API_BASE_URL}/options/talukas?district=${encodeURIComponent(district)}`)
      .then(r => r.json()).then(d => setTalukas(d.talukas || [])).catch(() => setTalukas([]))
      .finally(() => setLoadingTalukas(false));
  }, [district]);

  // Clear stale village suggestions when location changes (typed village is kept usable)
  useEffect(() => {
    setVillages([]);
  }, [district, taluka]);

  // OPTIONAL: load live village suggestions from AnyROR (~20s Playwright scrape).
  // The form is fully usable without this — the backend fuzzy-matches the
  // free-typed English village name against the live AnyROR dropdown.
  const loadVillageSuggestions = () => {
    if (!district || !taluka || loadingVillages) return;
    setLoadingVillages(true);
    fetch(`${API_BASE_URL}/options/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`)
      .then(r => r.json()).then(d => setVillages(d.villages || [])).catch(() => setVillages([]))
      .finally(() => setLoadingVillages(false));
  };

  const inputClass = "input";
  const selectClass = "input cursor-pointer";
  const isAutoFormValid = district && taluka && village.trim() && (needsOwnerName ? ownerName.trim() : surveyNo.trim());

  // LIVE PROGRESS SCREEN — real job stages streamed from the backend
  if (autoPhase === 'running') {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-4 sm:px-6">
        <TopNav />
        <div className="w-full max-w-[560px]">
          <JobProgress job={autoJob} startedAt={jobStartedAt} title="Fetching the record from AnyROR" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-10 px-4 sm:px-6 flex flex-col items-center">
      <TopNav />
      <div className="w-full max-w-[640px] flex flex-col gap-6">
        <Reveal>
          <div className="text-center">
             <p className="eyebrow mb-1">Title Scanner</p>
             <h1 className="text-3xl font-bold text-ink mb-2">Fetch or scan a land record</h1>
             <p className="text-muted text-sm">Fetch it live from AnyROR, or upload a document for OCR analysis.</p>
          </div>
        </Reveal>

        {/* Tab Controls */}
        <Reveal delay={80}>
        <div className="flex bg-surface-soft border border-border rounded-xl p-1">
          <button onClick={() => setActiveTab('auto')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'auto' ? 'bg-surface text-brand shadow-sm border border-border' : 'text-muted hover:text-ink'}`}>Fetch from AnyROR</button>
          <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'manual' ? 'bg-surface text-brand shadow-sm border border-border' : 'text-muted hover:text-ink'}`}>Upload document (OCR)</button>
        </div>
        </Reveal>

        {activeTab === 'manual' ? (
          <form
            onSubmit={handleUpload}
            className="sl-anim card p-6 sm:p-8 flex flex-col gap-6"
            style={{ animation: 'sl-fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) both' }}
          >
             <div className="w-full h-40 border-2 border-dashed border-border-strong rounded-xl flex flex-col items-center justify-center text-muted hover:border-brand transition-colors relative cursor-pointer group">
                <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <UploadCloud size={36} className="mb-3 group-hover:text-brand transition-colors" />
                <span className="text-sm font-medium group-hover:text-ink">{file ? file.name : "Drop your 7/12 image or PDF here"}</span>
             </div>
             <button type="submit" disabled={!file || isAnalyzing} className="btn btn-primary w-full py-3">
               {isAnalyzing ? <><Loader2 className="animate-spin" size={16}/> Analyzing document…</> : "Analyze Document"}
             </button>
          </form>
        ) : (
          <form
            onSubmit={handleAutomate}
            className="sl-anim card p-6 sm:p-8 flex flex-col gap-5"
            style={{ animation: 'sl-fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) 0.08s both' }}
          >
            {/* AnyROR Record Type */}
            <div className="flex flex-col gap-1.5">
              <label className="label">Record type (કોઇ એક પસંદ કરો)</label>
              <select value={recordType} onChange={e => setRecordType(e.target.value)} style={{ appearance: 'auto', WebkitAppearance: 'menulist' as any }} className={selectClass}>
                {RECORD_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Cascading Location Dropdowns */}
            <div className="flex flex-col gap-4">
              {/* District */}
              <div className="flex flex-col gap-1.5">
                <label className="label">District (જીલ્લો)</label>
                <div className="relative">
                  <select value={district} onChange={e => setDistrict(e.target.value)}
                    className={`${selectClass} appearance-none pr-8`} disabled={loadingDistricts}>
                    <option value="">{loadingDistricts ? 'Loading…' : 'Select district'}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {loadingDistricts
                    ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin pointer-events-none" />
                    : <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />}
                </div>
              </div>

              {/* Taluka */}
              <div className="flex flex-col gap-1.5">
                <label className="label">Taluka (તાલુકો)</label>
                <div className="relative">
                  <select value={taluka} onChange={e => setTaluka(e.target.value)}
                    className={`${selectClass} appearance-none pr-8`} disabled={!district || loadingTalukas}>
                    <option value="">{!district ? 'Select district first' : loadingTalukas ? 'Loading…' : 'Select taluka'}</option>
                    {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {loadingTalukas
                    ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin pointer-events-none" />
                    : <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />}
                </div>
              </div>

              {/* Village — free text input (English or Gujarati; backend fuzzy-matches on AnyROR) */}
              <div className="flex flex-col gap-1.5">
                <label className="label flex items-center gap-2">
                  Village (ગામ)
                  {loadingVillages && <span className="text-brand font-normal text-xs">fetching from AnyROR (~20s)…</span>}
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={e => {
                    const typed = e.target.value;
                    setVillage(typed);
                    const obj = villages.find(v => v.english.toLowerCase() === typed.trim().toLowerCase());
                    setVillageGujarati(obj ? obj.gujarati : '');
                  }}
                  placeholder="e.g. Navrangpura, Vejalpur, Bopal"
                  list="upload-village-suggestions"
                  className={inputClass}
                />
                <datalist id="upload-village-suggestions">
                  {villages.map(v => <option key={v.gujarati} value={v.english} />)}
                </datalist>
                <button
                  type="button"
                  onClick={loadVillageSuggestions}
                  disabled={!district || !taluka || loadingVillages}
                  className="text-left text-xs text-brand hover:text-brand-strong underline underline-offset-2 decoration-brand/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 w-fit"
                >
                  {loadingVillages
                    ? <><Loader2 size={11} className="animate-spin" /> Loading suggestions from AnyROR…</>
                    : villages.length > 0
                      ? <>↻ Reload suggestions ({villages.length} villages loaded)</>
                      : <>Load village suggestions from AnyROR (takes ~20s)</>}
                </button>
              </div>

              {/* Survey / Owner */}
              {needsOwnerName ? (
                <div className="flex flex-col gap-1.5">
                  <label className="label">Owner Name (જમીન માલિકનું નામ)</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Enter owner name" className={inputClass} />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="label">{getEntryFieldLabel()}</label>
                  <input type="text" value={surveyNo} onChange={e => setSurveyNo(e.target.value)} placeholder="Enter survey/block number (e.g. 123)" className={`${inputClass} font-mono`} />
                  <p className="text-faint text-xs leading-relaxed">Common formats: 123, 123/1, 123 P, 45 A — check AnyROR for exact format</p>
                </div>
              )}
            </div>

            <div className="text-xs text-ink-soft bg-brand-soft/60 rounded-lg p-3 border border-brand-border leading-relaxed">
              <span className="font-semibold text-brand">Note:</span> the government CAPTCHA is solved
              automatically (10–20 seconds) and everything runs in the background with a live progress feed.
              <span className="block mt-1 text-muted">The first search may take 60–90s extra while the backend warms up (free hosting cold start).</span>
            </div>

             <button type="submit" disabled={!isAutoFormValid} className="btn btn-primary w-full py-3">
               <Cpu size={16}/> Fetch Record
             </button>
          </form>
        )}

        {/* Auto scrape — error + recovery */}
        {autoPhase === 'error' && (
          <div
            className="sl-anim card p-6 border-danger-border flex flex-col gap-4"
            style={{ animation: 'sl-fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) both' }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-ink mb-1">Search Failed</h3>
                <p className="text-sm text-danger break-words leading-relaxed">{autoError}</p>
              </div>
            </div>
            {autoSuggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-ink-soft font-medium">
                  Valid survey numbers found in this village — tap one to search it:
                </span>
                <div className="flex flex-wrap gap-2">
                  {autoSuggestions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => applySuggestion(opt)}
                      className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-soft text-brand text-sm font-mono hover:border-brand transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => launchJob()}
              className="btn btn-primary w-fit"
            >
              <RotateCcw size={13} /> Retry Search
            </button>
          </div>
        )}

        {/* Auto scrape — full ownership report */}
        {autoPhase === 'done' && autoReport && (
          <div
            className="sl-anim flex flex-col gap-4"
            style={{ animation: 'sl-fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) both' }}
          >
            <TitleReportView report={autoReport} />
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleSaveToPortfolio}
                disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'duplicate'}
                className={`btn flex-1
                  ${saveState === 'saved' ? 'bg-success-soft text-success border border-success-border cursor-default'
                  : saveState === 'duplicate' ? 'bg-warning-soft text-warning border border-warning-border cursor-default'
                  : saveState === 'error' ? 'bg-danger-soft text-danger border border-danger-border'
                  : 'btn-primary'}`}
              >
                {saveState === 'saving' && <><Loader2 size={14} className="animate-spin"/> Saving...</>}
                {saveState === 'saved' && <><CheckCircle2 size={14}/> Saved to Portfolio</>}
                {saveState === 'duplicate' && <><CheckCircle2 size={14}/> Already Saved</>}
                {saveState === 'error' && <>Save Failed — Retry</>}
                {saveState === 'idle' && <><BookmarkPlus size={14}/> Save to Portfolio</>}
              </button>
              <Link
                href={
                  `/property/SURVEY-${encodeURIComponent(autoReport.record.survey_no || surveyNo.trim())}` +
                  `?district=${encodeURIComponent(autoReport.record.district || district)}` +
                  `&taluka=${encodeURIComponent(autoReport.record.taluka || taluka)}` +
                  `&village=${encodeURIComponent(autoReport.record.village || village)}` +
                  `&record_type=${encodeURIComponent(recordType)}`
                }
                className="btn btn-outline flex-1 text-center"
              >
                Open Full Property View
              </Link>
              <Link href="/dashboard" className="btn btn-ghost flex-1 text-center">View Portfolio</Link>
            </div>
          </div>
        )}

        {/* Manual OCR result */}
        {result && (
           <div
             className="sl-anim card p-6 border-l-4 border-l-success flex flex-col gap-4"
             style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) both' }}
           >
              <div className="flex items-center justify-between flex-wrap gap-2">
                 <div className="flex items-center gap-2 text-success font-semibold text-sm"><ShieldCheck size={16}/> Record Retrieved Successfully</div>
                 <span className="badge bg-success-soft text-success border border-success-border">Verified &amp; translated</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><span className="eyebrow">Owner</span><div className="text-sm text-ink font-medium mt-0.5">{result.owner_name}</div></div>
                 <div><span className="eyebrow">Survey No</span><div className="text-sm text-ink font-mono mt-0.5">{result.survey_no}</div></div>
                 <div><span className="eyebrow">Tenure Type</span><div className="text-sm text-ink mt-0.5">{result.tenure_type}</div></div>
                 <div><span className="eyebrow">Encumbrances</span><div className="text-sm text-danger font-medium mt-0.5">{result.encumbrances}</div></div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 mt-2 pt-4 border-t border-border">
                  <Link href="/dashboard" className="btn btn-outline flex-1 text-center">View Portfolio</Link>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
