"use client";

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Loader2, Cpu, ShieldCheck, AlertTriangle, MapPin, User, Calendar, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { API_BASE_URL } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

// Exact AnyROR Record Types from https://anyror.gujarat.gov.in/LandRecordRural.aspx
const RECORD_TYPES = [
  { value: "OLD_SCAN_712", label: "OLD SCANNED VF-7/12 DETAILS (àªà«àª¨àª¾ àª¸à«àªà«àª¨ àªàª°à«àª² àªàª¾.àª¨. à«­/à«§à«¨ àª¨à« àªµàª¿àªàª¤à«)" },
  { value: "OLD_SCAN_6", label: "OLD SCANNED VF-6 ENTRY DETAILS (àªà«àª¨àª¾ àª¸à«àªà«àª¨ àªàª°à«àª² àª¹àªà«àª àªªàª¤à«àª°àª àªàª¾.àª¨. à«¬ àª¨à« àªµàª¿àªàª¤à«)" },
  { value: "VF7", label: "VF-7 SURVEY NO DETAILS (àªàª¾.àª¨. à«­ àª¨à« àªµàª¿àªàª¤à«)" },
  { value: "VF8A", label: "VF-8A KHATA DETAILS (àªàª¾.àª¨. à«®àª àª¨à« àªµàª¿àªàª¤à«)" },
  { value: "VF6", label: "VF-6 ENTRY DETAILS (àª¹àªà«àª àªªàª¤à«àª°àª àªàª¾.àª¨. à«¬ àª¨à« àªµàª¿àªàª¤à«)" },
  { value: "135D", label: "135-D NOTICE FOR MUTATION (àª¹àªà«àª àªªàª¤à«àª°àª àª«à«àª°àª«àª¾àª° àª®àª¾àªà« à«§à«©à««-àª¡à« àª¨à«àªà«àª¸)" },
  { value: "INTEGRATED", label: "INTEGRATED SURVEY NO DETAILS (àª¸àª°àªµà« àª¨àªàª¬àª°àª¨à« àª²àªàª¤à« àª¸àªàªªà«àª°à«àª£ àª®àª¾àª¹àª¿àª¤à«)" },
  { value: "OWNER_NAME", label: "KNOW KHATA BY OWNER NAME (àªàª¾àª¤à«àª¦àª¾àª°àª¨àª¾ àª¨àª¾àª® àªªàª°àª¥à« àªàª¾àª¤à« àªàª¾àª£àªµàª¾)" },
  { value: "E_CHAVDI", label: "e-CHAVDI (àª-àªàª¾àªµàª¡à«)" },
  { value: "REVENUE_CASE", label: "REVENUE CASE DETAILS (àªàª®à«àª¨ àª°à«àªàª°à«àª¡ àª¨à« àª²àªàª¤àª¾ àªà«àª¸àª¨à« àªµàª¿àªàª¤)" },
];

// Progress stages shown while RPA bot is working
const PROGRESS_STAGES = [
  { pct: 5, label: "Initializing secure connection to Government Portal..." },
  { pct: 15, label: "Navigating to AnyROR Gujarat Revenue Department..." },
  { pct: 25, label: "Selecting record type and filling district details..." },
  { pct: 35, label: "Populating taluka and village cascading fields..." },
  { pct: 45, label: "Entering survey/block number into form..." },
  { pct: 55, label: "Capturing CAPTCHA image from government server..." },
  { pct: 65, label: "Solving CAPTCHA via Gemini Vision AI..." },
  { pct: 75, label: "Submitting request to Revenue Department API..." },
  { pct: 85, label: "Parsing and extracting record data..." },
  { pct: 92, label: "Translating Gujarati fields to English..." },
  { pct: 98, label: "Validating document integrity and finalizing..." },
];

export default function DocumentUpload() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('auto');

  // Manual Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Automation State â free text inputs
  const [recordType, setRecordType] = useState('OLD_SCAN_712');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [autoResult, setAutoResult] = useState<any>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');

  const handleSaveToPortfolio = async () => {
    if (!autoResult || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const { data: existing } = await supabase
        .from('portfolio_assets')
        .select('id')
        .eq('survey_no', autoResult.survey_no || surveyNo.trim())
        .eq('village', autoResult.village || village.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        setSaveState('duplicate');
        setTimeout(() => setSaveState('idle'), 3000);
        return;
      }

      const { error } = await supabase.from('portfolio_assets').insert({
        survey_no: autoResult.survey_no || surveyNo.trim(),
        district: autoResult.district || district.trim(),
        taluka: autoResult.taluka || taluka.trim(),
        village: autoResult.village || village.trim(),
        owner_name: autoResult.owner_name || null,
        area: autoResult.area || null,
        tenure_type: autoResult.tenure_type || null,
        encumbrances: autoResult.encumbrances || null,
        jantri_rate: autoResult.jantri_rate || null,
        last_sale: autoResult.last_sale || null,
        mutation_entries: autoResult.mutation_entries || null,
        record_type: recordType,
      });
      if (error) throw error;
      setSaveState('saved');
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  // Progress Loading State
  const [showProgress, setShowProgress] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const progressTimerRef = useRef<any>(null);

  // Get dynamic label for the last field based on record type
  const getEntryFieldLabel = () => {
    switch (recordType) {
      case 'VF8A': return 'Khata No. (àªàª¾àª¤àª¾ àª¨àªàª¬àª°)';
      case 'VF6': return 'Entry No. (àª¨à«àªàª§ àª¨àªàª¬àª°)';
      case 'OLD_SCAN_712': return 'Scanned Record Survey/Block No. (àª¸à«àªà«àª¨ àª°à«àªàª°à«àª¡ àª®à«àªàª¬ àª¸àª°à«àªµà«/àª¬à«àª²à«àª àª¨àªàª¬àª°)';
      case 'OLD_SCAN_6': return 'Scanned Record Survey/Block No. (àª¸à«àªà«àª¨ àª°à«àªàª°à«àª¡ àª®à«àªàª¬ àª¸àª°à«àªµà«/àª¬à«àª²à«àª àª¨àªàª¬àª°)';
      case '135D': return 'Survey/Block No. (àª¸àª°à«àªµà«/àª¬à«àª²à«àª àª¨àªàª¬àª°)';
      case 'INTEGRATED': return 'Survey/Block No. (àª¸àª°à«àªµà«/àª¬à«àª²à«àª àª¨àªàª¬àª°)';
      default: return 'Survey/Block No. (àª¸àª°à«àªµà«/àª¬à«àª²à«àª àª¨àªàª¬àª°)';
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

  const simulateProgress = () => {
    let idx = 0;
    setShowProgress(true);
    setProgressPct(0);
    setProgressLabel(PROGRESS_STAGES[0].label);
    progressTimerRef.current = setInterval(() => {
      if (idx < PROGRESS_STAGES.length) {
        setProgressPct(PROGRESS_STAGES[idx].pct);
        setProgressLabel(PROGRESS_STAGES[idx].label);
        idx++;
      }
    }, 1800);
  };

  const handleAutomate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoResult(null);
    simulateProgress();
    try {
      const res = await fetch(`${API_BASE_URL}/fetch-anyror`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          record_type: recordType, 
          district: district.trim(), 
          taluka: taluka.trim(), 
          village: village.trim(), 
          survey_no: needsOwnerName ? ownerName.trim() : surveyNo.trim() 
        })
      });
      clearInterval(progressTimerRef.current);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Unknown error" }));
        setProgressPct(0); setProgressLabel(""); setShowProgress(false);
        alert(`RPA Error: ${errData.detail || "Backend returned an error"}`);
        return;
      }
      const data = await res.json();
      setProgressPct(100);
      setProgressLabel("Record retrieved successfully!");
      setTimeout(() => { setShowProgress(false); setAutoResult(data); }, 1200);
    } catch {
      clearInterval(progressTimerRef.current);
      setProgressPct(0); setProgressLabel(""); setShowProgress(false);
      alert("Could not connect to the RPA backend. Please ensure the backend server is running.");
    }
  };

  useEffect(() => {
    return () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
  }, []);

  const inputClass = "w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]";
  const selectClass = "w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-[#00f0ff] transition-colors cursor-pointer";
  const isAutoFormValid = district.trim() && taluka.trim() && village.trim() && (needsOwnerName ? ownerName.trim() : surveyNo.trim());

  // PROGRESS LOADING SCREEN
  if (showProgress) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col items-center justify-center relative overflow-hidden">
        <TopNav />
        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-[520px] px-6">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-[#00f0ff]/30 flex items-center justify-center">
              <Cpu size={36} className="text-[#00f0ff] animate-pulse" />
            </div>
            <div className="absolute -inset-3 border border-[#00f0ff]/10 animate-ping" style={{ animationDuration: '3s' }}></div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-display uppercase tracking-tight mb-2">Autonomous RPA Bot Active</h2>
            <p className="text-[10px] text-[#849495] uppercase tracking-widest">Processing in secure background â Do not close this page</p>
          </div>
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#849495]">Progress</span>
              <span className="text-sm font-mono text-[#00f0ff] font-bold">{progressPct}%</span>
            </div>
            <div className="w-full h-3 bg-[#1c1b1b] border border-[#3b494b]/40 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00f0ff] to-[#4edea3] transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
          <div className="glass-panel p-4 w-full text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[#00f0ff] font-mono">
              <Loader2 size={14} className="animate-spin" />
              {progressLabel}
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 mt-2">
            {PROGRESS_STAGES.filter((_, i) => {
              const currentIdx = PROGRESS_STAGES.findIndex(s => s.pct >= progressPct);
              return i <= Math.max(currentIdx, 0);
            }).map((stage, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                <span className={`w-4 h-4 flex items-center justify-center border ${stage.pct <= progressPct ? 'border-[#4edea3] text-[#4edea3]' : 'border-[#3b494b] text-[#3b494b]'}`}>
                  {stage.pct <= progressPct ? 'â' : 'Â·'}
                </span>
                <span className={stage.pct <= progressPct ? 'text-[#dbfcff]' : 'text-[#3b494b]'}>{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-20 pb-10 px-6 flex flex-col items-center relative overflow-hidden">
      <TopNav />
      <div className="z-10 w-full max-w-[640px] flex flex-col gap-6 mt-4">
        <div className="text-center mb-0">
           <h1 className="text-3xl md:text-4xl font-display uppercase tracking-tight mb-2">Initialize Forensic Scan</h1>
           <p className="text-[#849495] font-sans text-xs tracking-widest uppercase">Upload Title Deed OR Deploy Automated AnyROR RPA Bot</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#1c1b1b]/80 border border-[#3b494b]/40 mb-2 p-1">
          <button onClick={() => setActiveTab('auto')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'auto' ? 'bg-[#00f0ff] text-[#002022]' : 'text-[#849495] hover:text-[#00f0ff]'}`}>Auto Web Scraper</button>
          <button onClick={() => setActiveTab('manual')} className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'manual' ? 'bg-[#00f0ff] text-[#002022]' : 'text-[#849495] hover:text-[#00f0ff]'}`}>Manual OCR Upload</button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleUpload} className="glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-6">
             <div className="w-full h-40 border-2 border-dashed border-[#3b494b] flex flex-col items-center justify-center text-[#849495] hover:border-[#00f0ff] transition-colors relative cursor-pointer group">
                <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <UploadCloud size={40} className="mb-3 group-hover:text-[#00f0ff] transition-colors" />
                <span className="text-xs uppercase tracking-widest font-bold group-hover:text-[#dbfcff]">{file ? file.name : "Drop Secure File Here"}</span>
             </div>
             <button type="submit" disabled={!file || isAnalyzing} className="w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all flex justify-center items-center">
               {isAnalyzing ? <><Loader2 className="animate-spin mr-2" size={18}/> Executing Vector Scan</> : "Analyze Document"}
             </button>
          </form>
        ) : (
          <form onSubmit={handleAutomate} className="glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-5">
            {/* AnyROR Record Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#00f0ff]">Select Any One (àªà«àª àªàª àªªàª¸àªàª¦ àªàª°à«)</label>
              <select value={recordType} onChange={e => setRecordType(e.target.value)} style={{ appearance: 'auto', WebkitAppearance: 'menulist' as any }} className={selectClass}>
                {RECORD_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">District (àªà«àª²à«àª²à«)</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ahmedabad" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Taluka (àª¤àª¾àª²à«àªà«)</label>
                <input type="text" value={taluka} onChange={e => setTaluka(e.target.value)} placeholder="e.g. Daskroi" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Village (àªàª¾àª®)</label>
                <input type="text" value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Bopal" className={inputClass} />
              </div>
              
              {needsOwnerName ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Owner Name (àªàª®à«àª¨ àª®àª¾àª²àª¿àªàª¨à«àª àª¨àª¾àª®)</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Enter owner name" className={inputClass} />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">{getEntryFieldLabel()}</label>
                  <input type="text" value={surveyNo} onChange={e => setSurveyNo(e.target.value)} placeholder="Enter survey/block number (e.g. 123)" className={inputClass} />
                </div>
              )}
            </div>

            <div className="text-[10px] text-[#849495] bg-[#1c1b1b]/60 p-3 border border-[#3b494b]/30">
              <span className="text-[#eab308] font-bold">â  CAPTCHA:</span> The RPA bot will auto-solve the government CAPTCHA using Gemini Vision AI. This may take 10-20 seconds. 
              <span className="text-[#00f0ff]"> All processing happens in background â you&apos;ll see a live progress feed.</span>
            </div>

             <button type="submit" disabled={!isAutoFormValid} className="mt-2 w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#de4ced] to-[#ff00f0] hover:brightness-110 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
               <Cpu className="mr-2" size={18}/> Launch RPA Bot
             </button>
          </form>
        )}

        {/* Results Block */}
        {(result || autoResult) && (
           <div className="glass-panel p-6 border-l-4 border-l-[#4edea3] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[#4edea3] font-bold tracking-widest uppercase text-xs"><ShieldCheck size={16}/> Record Retrieved Successfully</div>
                 <span className="text-[10px] bg-[#4edea3]/10 text-[#4edea3] px-2 py-1 uppercase tracking-widest border border-[#4edea3]/30">VERIFIED &amp; TRANSLATED</span>
              </div>
              
              {autoResult && (
                <div className="flex flex-col gap-0">
                  <div className="text-xs text-[#00f0ff] font-bold uppercase tracking-widest mb-3">{autoResult.message}</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold flex items-center gap-1"><User size={10}/> Owner Name</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.owner_name}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold flex items-center gap-1"><MapPin size={10}/> Location</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.village}, {autoResult.taluka?.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Survey No.</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.survey_no}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Area</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.area}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Tenure Type</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.tenure_type}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Cultivation</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.cultivation}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Jantri Rate</span>
                       <div className="text-sm font-display text-[#00f0ff]">{autoResult.jantri_rate}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold flex items-center gap-1"><Calendar size={10}/> Last Sale</span>
                       <div className="text-sm font-display text-[#dbfcff]">{autoResult.last_sale}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#3b494b]/40 grid grid-cols-1 gap-3">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Mutation Entries</span>
                       <div className="text-xs font-mono text-[#dbfcff]">{autoResult.mutation_entries}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#ba1b24] uppercase tracking-widest font-bold flex items-center gap-1"><AlertTriangle size={10}/> Encumbrances</span>
                       <div className="text-xs font-mono text-[#ba1b24]">{autoResult.encumbrances}</div>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="grid grid-cols-2 gap-4">
                   <div><span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Owner</span><div className="text-sm font-display">{result.owner_name}</div></div>
                   <div><span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Survey No</span><div className="text-sm font-display">{result.survey_no}</div></div>
                   <div><span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Tenure Type</span><div className="text-sm font-display">{result.tenure_type}</div></div>
                   <div><span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Encumbrances</span><div className="text-sm font-display text-[#ba1b24]">{result.encumbrances}</div></div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-[#3b494b]/40">
                  {autoResult && (
                    <button
                      onClick={handleSaveToPortfolio}
                      disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'duplicate'}
                      className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2
                        ${saveState === 'saved' ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/50 cursor-default'
                        : saveState === 'duplicate' ? 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/50 cursor-default'
                        : saveState === 'error' ? 'bg-[#ba1b24]/10 text-[#ba1b24] border border-[#ba1b24]/50'
                        : 'bg-gradient-to-r from-[#de4ced] to-[#ff00f0] text-[#002022] hover:brightness-110'}`}
                    >
                      {saveState === 'saving' && <><Loader2 size={12} className="animate-spin"/> Saving...</>}
                      {saveState === 'saved' && <><CheckCircle2 size={12}/> Saved to Portfolio</>}
                      {saveState === 'duplicate' && <><CheckCircle2 size={12}/> Already Saved</>}
                      {saveState === 'error' && <>Save Failed â Retry</>}
                      {saveState === 'idle' && <><BookmarkPlus size={12}/> Save to Portfolio</>}
                    </button>
                  )}
                  <Link href={`/property/SURVEY-${surveyNo}`} className="flex-1 py-3 text-center text-[#0a0a0a] bg-[#4edea3] hover:bg-[#dbfcff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">Explore Intel</Link>
                  <Link href="/dashboard" className="flex-1 py-3 text-center text-[#dbfcff] border border-[#3b494b] bg-black/40 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">View Portfolio</Link>
              </div>
           </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
}
