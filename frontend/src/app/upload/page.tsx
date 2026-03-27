"use client";

import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, Cpu } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { ANYROR_DATASET } from '@/lib/anyrorData';

export default function DocumentUpload() {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('auto');

  // Manual Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Automation State
  const [district, setDistrict] = useState('Ahmedabad');
  const [taluka, setTaluka] = useState('Sanand');
  const [village, setVillage] = useState('Shela');
  const [surveyNo, setSurveyNo] = useState('25');
  const [autoResult, setAutoResult] = useState<any>(null);

  // Cascading Handlers
  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    const firstTaluka = Object.keys(ANYROR_DATASET[d] || {})[0] || "";
    setTaluka(firstTaluka);
    const firstVillage = Object.keys(ANYROR_DATASET[d]?.[firstTaluka] || {})[0] || "";
    setVillage(firstVillage);
    setSurveyNo(ANYROR_DATASET[d]?.[firstTaluka]?.[firstVillage]?.[0] || "");
  };

  const handleTalukaChange = (t: string) => {
    setTaluka(t);
    const firstVillage = Object.keys(ANYROR_DATASET[district]?.[t] || {})[0] || "";
    setVillage(firstVillage);
    setSurveyNo(ANYROR_DATASET[district]?.[t]?.[firstVillage]?.[0] || "");
  };

  const handleVillageChange = (v: string) => {
    setVillage(v);
    setSurveyNo(ANYROR_DATASET[district]?.[taluka]?.[v]?.[0] || "");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/analyze-record", {
        method: "POST",
        body: formData,
      });
      
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

  const handleAutomate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAutoResult(null);

    try {
      const res = await fetch("http://localhost:8000/fetch-anyror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, taluka, village, survey_no: surveyNo })
      });
      
      if (!res.ok) throw new Error("Automation Failed");
      
      const data = await res.json();
      setAutoResult(data);
    } catch (error) {
      console.error(error);
      alert("Automation bot encountered an error connecting to AnyROR.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-24 pb-10 px-10 flex flex-col items-center justify-center relative overflow-hidden">
      <TopNav />

      <div className="z-10 w-full max-w-[600px] flex flex-col gap-6">
        <div className="text-center mb-0">
           <h1 className="text-4xl font-display uppercase tracking-tight mb-2">Initialize Forensic Scan</h1>
           <p className="text-[#849495] font-sans text-xs tracking-widest uppercase">
              Upload Title Deed OR Deploy automated AnyROR Playwright bot.
           </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#1c1b1b]/80 border border-[#3b494b]/40 rounded-sm mb-2 p-1">
          <button 
            onClick={() => setActiveTab('auto')}
            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'auto' ? 'bg-[#00f0ff] text-[#002022]' : 'text-[#849495] hover:text-[#00f0ff]'}`}
          >
            Auto Web Scraper
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'manual' ? 'bg-[#00f0ff] text-[#002022]' : 'text-[#849495] hover:text-[#00f0ff]'}`}
          >
            Manual OCR Upload
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleUpload} className="glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-6">
             <div className="w-full h-40 border-2 border-dashed border-[#3b494b] flex flex-col items-center justify-center text-[#849495] hover:border-[#00f0ff] transition-colors relative cursor-pointer group">
                <input 
                   type="file" 
                   accept="image/*,application/pdf"
                   className="absolute inset-0 opacity-0 cursor-pointer"
                   onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <UploadCloud size={40} className="mb-3 group-hover:text-[#00f0ff] transition-colors" />
                <span className="text-xs uppercase tracking-widest font-bold group-hover:text-[#dbfcff]">
                  {file ? file.name : "Drop Secure File Here"}
                </span>
             </div>

             <button 
               type="submit" 
               disabled={!file || isAnalyzing}
               className="w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all flex justify-center items-center"
             >
               {isAnalyzing ? <><Loader2 className="animate-spin mr-2" size={18}/> Executing Vector Scan</> : "Analyze Document"}
             </button>
          </form>
        ) : (
          <form onSubmit={handleAutomate} className="glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#849495]">District (જિલ્લો)</label>
                <select value={district} onChange={e => handleDistrictChange(e.target.value)} className="bg-[#1c1b1b] border border-[#3b494b] text-[#dbfcff] p-2 font-mono text-sm outline-none appearance-auto">
                  {Object.keys(ANYROR_DATASET).map(d => <option key={d} value={d} className="bg-[#1c1b1b] text-white">{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#849495]">Taluka (તાલુકો)</label>
                <select value={taluka} onChange={e => handleTalukaChange(e.target.value)} className="bg-[#1c1b1b] border border-[#3b494b] text-[#dbfcff] p-2 font-mono text-sm outline-none appearance-auto">
                  {Object.keys(ANYROR_DATASET[district] || {}).map(t => <option key={t} value={t} className="bg-[#1c1b1b] text-white">{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#849495]">Village (ગામ)</label>
                <select value={village} onChange={e => handleVillageChange(e.target.value)} className="bg-[#1c1b1b] border border-[#3b494b] text-[#dbfcff] p-2 font-mono text-sm outline-none appearance-auto">
                  {Object.keys(ANYROR_DATASET[district]?.[taluka] || {}).map(v => <option key={v} value={v} className="bg-[#1c1b1b] text-white">{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#849495]">Survey No. (સર્વે નંબર)</label>
                <select value={surveyNo} onChange={e => setSurveyNo(e.target.value)} className="bg-[#1c1b1b] border border-[#3b494b] text-[#dbfcff] p-2 font-mono text-sm outline-none appearance-auto">
                  {(ANYROR_DATASET[district]?.[taluka]?.[village] || []).map(s => <option key={s} value={s} className="bg-[#1c1b1b] text-white">{s}</option>)}
                </select>
              </div>
            </div>

             <button 
               type="submit" 
               disabled={isAnalyzing}
               className="mt-2 w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#de4ced] to-[#ff00f0] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all flex justify-center items-center"
             >
               {isAnalyzing ? <><Loader2 className="animate-spin mr-2" size={18}/> Bot Traversing Govt Portal...</> : <><Cpu className="mr-2" size={18}/> Launch RPA Bot</>}
             </button>
          </form>
        )}

        {/* Results Block */}
        {(result || autoResult) && (
           <div className="glass-panel p-6 border-l-4 border-l-[#4edea3] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[#4edea3] font-bold tracking-widest uppercase text-xs">
                    <FileText size={16}/> Operation Successful
                 </div>
                 <span className="text-[10px] bg-[#4edea3]/10 text-[#4edea3] px-2 py-1 uppercase tracking-widest border border-[#4edea3]/30">
                    DATA SECURED
                 </span>
              </div>
              
              {result && (
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Owner</span>
                      <div className="text-sm font-display">{result.owner_name}</div>
                   </div>
                   <div>
                      <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Survey No</span>
                      <div className="text-sm font-display">{result.survey_no}</div>
                   </div>
                   <div>
                      <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Tenure Type</span>
                      <div className="text-sm font-display">{result.tenure_type}</div>
                   </div>
                   <div>
                      <span className="text-[10px] text-[#849495] uppercase tracking-widest font-bold">Encumbrances</span>
                      <div className="text-sm font-display text-[#ba1b24]">{result.encumbrances}</div>
                   </div>
                </div>
              )}

              {autoResult && (
                <div className="flex flex-col gap-2">
                   <div className="text-xs text-[#849495] mb-2">{autoResult.message}</div>
                   {autoResult.error && <div className="text-[#ba1b24] font-mono text-xs">{autoResult.error}</div>}
                   {autoResult.raw_html && (
                     <pre className="text-[10px] font-mono text-[#00f0ff] bg-black p-3 overflow-x-auto max-h-40">
                       {autoResult.raw_html.substring(0, 500) + "...\n[DATA TRUNCATED FOR UI]"}
                     </pre>
                   )}
                </div>
              )}

              {/* Action/Routing Hub */}
              <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-[#3b494b]/40">
                  <Link 
                    href={`/property/SURVEY-${surveyNo}`}
                    className="flex-1 py-3 text-center text-[#0a0a0a] bg-[#4edea3] hover:bg-[#dbfcff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
                  >
                     Explore Surrounding Intel
                  </Link>
                  <Link 
                    href="/dashboard"
                    className="flex-1 py-3 text-center text-[#dbfcff] border border-[#3b494b] bg-black/40 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
                  >
                     View in Portfolio
                  </Link>
              </div>
           </div>
        )}
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
}
