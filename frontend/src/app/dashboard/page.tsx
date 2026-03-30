"use client";

import React, { useState } from 'react';
import { Database, TrendingUp, AlertTriangle, CheckCircle2, Crosshair, Plus, Loader2, X, FolderOpen } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { ANYROR_DATASET } from '@/lib/anyrorData';

export default function Dashboard() {
  // Start with empty portfolio — no fake holdings
  const [holdings, setHoldings] = useState<any[]>([]);

  const [showIngest, setShowIngest] = useState(false);
  const [district, setDistrict] = useState('Ahmedabad');
  const [taluka, setTaluka] = useState('Ahmedabad_City');
  const [village, setVillage] = useState('Navrangpura');
  const [surveyNo, setSurveyNo] = useState('1');
  const [isFetching, setIsFetching] = useState(false);

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

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFetching(true);
    
    try {
      const res = await fetch("http://localhost:8000/fetch-anyror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, taluka, village, survey_no: surveyNo })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Use real data from backend
        const newAsset = {
          id: `SURVEY-${surveyNo}`,
          village: data.village || village,
          type: data.tenure_type || "Fetched Record",
          size: data.area || "—",
          status: data.encumbrances && data.encumbrances !== "None" ? "ENCUMBERED" : "CLEARED"
        };
        setHoldings(prev => [newAsset, ...prev]);
        setShowIngest(false);
      } else {
        alert("Backend returned an error. Please ensure the RPA backend is running.");
      }
    } catch (error) {
      alert("Could not connect to the RPA backend at localhost:8000. Please start the backend server.");
    } finally {
      setIsFetching(false);
    }
  };

  const selectClass = "w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-mono text-xs focus:outline-none focus:border-[#00f0ff] transition-colors cursor-pointer";

  const totalCleared = holdings.filter(h => h.status === 'CLEARED').length;
  const totalRisks = holdings.filter(h => h.status === 'ENCUMBERED').length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-20 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8 mt-4">
        {/* Header Block */}
        <div className="flex justify-between items-end border-b border-[#3b494b]/40 pb-6">
           <div>
              <h1 className="text-4xl font-display uppercase tracking-tight mb-2">SOVEREIGN PORTFOLIO</h1>
              <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
                 <Database size={14}/> Active Intelligence Contracts
              </p>
           </div>
           
           <button 
             onClick={() => setShowIngest(!showIngest)}
             className="px-6 py-3 bg-[#00f0ff] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#dbfcff] transition-all flex items-center gap-2"
           >
              {showIngest ? <><X size={14}/> Close</> : <><Plus size={14}/> Add Custom Asset</>}
           </button>
        </div>

        {/* Dynamic Ingestion Interface */}
        {showIngest && (
           <form onSubmit={handleIngest} className="glass-panel p-6 border-l-4 border-[#00f0ff] flex flex-col gap-4">
              <h2 className="text-sm font-display text-[#00f0ff] uppercase flex items-center gap-2 mb-2">
                 <Crosshair size={14}/> AnyROR Target Retrieval
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">District</label>
                   <select 
                     value={district} 
                     onChange={e => handleDistrictChange(e.target.value)} 
                     style={{ appearance: 'auto', WebkitAppearance: 'auto' }}
                     className={selectClass}
                   >
                     {Object.keys(ANYROR_DATASET).map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Taluka</label>
                   <select 
                     value={taluka} 
                     onChange={e => handleTalukaChange(e.target.value)} 
                     style={{ appearance: 'auto', WebkitAppearance: 'auto' }}
                     className={selectClass}
                   >
                     {Object.keys(ANYROR_DATASET[district] || {}).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Village</label>
                   <select 
                     value={village} 
                     onChange={e => handleVillageChange(e.target.value)} 
                     style={{ appearance: 'auto', WebkitAppearance: 'auto' }}
                     className={selectClass}
                   >
                     {Object.keys(ANYROR_DATASET[district]?.[taluka] || {}).map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Survey No.</label>
                   <select 
                     value={surveyNo} 
                     onChange={e => setSurveyNo(e.target.value)} 
                     style={{ appearance: 'auto', WebkitAppearance: 'auto' }}
                     className={selectClass}
                   >
                     {(ANYROR_DATASET[district]?.[taluka]?.[village] || []).map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
              </div>
              <button 
                type="submit" 
                disabled={isFetching}
                className="mt-4 w-full md:w-auto self-end py-3 px-8 text-[#0a0a0a] font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-[#de4ced] to-[#ff00f0] disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2"
              >
                 {isFetching ? <><Loader2 size={14} className="animate-spin"/> Fetching from AnyROR...</> : "Fetch & Ingest Asset"}
              </button>
           </form>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-panel p-6 border-l-2 border-l-[#00f0ff] flex flex-col justify-between h-[120px]">
              <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Total Assets</span>
              <span className="text-3xl font-display text-[#dbfcff]">{holdings.length}</span>
           </div>
           <div className="glass-panel p-6 border-l-2 border-l-[#4edea3] flex flex-col justify-between h-[120px]">
              <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Verified Assets</span>
              <span className="text-3xl font-display text-[#dbfcff]">{totalCleared}</span>
           </div>
           <div className="glass-panel p-6 border-l-2 border-l-[#ba1b24] flex flex-col justify-between h-[120px] bg-[#ba1b24]/5">
              <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Active Risks</span>
              <span className="text-3xl font-display text-[#ba1b24]">{totalRisks}</span>
           </div>
        </div>

        {/* Asset Ledger */}
        <div className="glass-panel mt-4 overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-[#3b494b]/40 text-[#849495] text-[10px] tracking-widest uppercase bg-[#131313]">
                    <th className="p-4 font-normal">Asset Hash (Survey)</th>
                    <th className="p-4 font-normal">Region / Village</th>
                    <th className="p-4 font-normal">Classification</th>
                    <th className="p-4 font-normal">Area</th>
                    <th className="p-4 font-normal text-right">Integrity Audit</th>
                 </tr>
              </thead>
              <tbody className="font-mono text-sm">
                 {holdings.map((asset, i) => (
                    <tr key={asset.id + i} className="border-b border-[#3b494b]/20 hover:bg-[#1c1b1b] transition-colors group cursor-pointer relative">
                       <td className="p-4 text-[#00f0ff] font-bold">
                          <Link href={`/property/${asset.id}`} className="hover:underline flex items-center gap-2">
                             <TrendingUp size={14}/> {asset.id}
                          </Link>
                       </td>
                       <td className="p-4 text-[#dbfcff]">{asset.village}</td>
                       <td className="p-4 text-[#849495]">{asset.type}</td>
                       <td className="p-4 text-[#dbfcff]">{asset.size}</td>
                       <td className="p-4 text-right">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] tracking-widest uppercase font-bold border ${
                             asset.status === 'CLEARED' ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/50' : 'bg-[#ba1b24]/10 text-[#ba1b24] border-[#ba1b24]/50'
                          }`}>
                            {asset.status === 'CLEARED' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                            {asset.status}
                          </span>
                       </td>
                    </tr>
                 ))}
                 {holdings.length === 0 && (
                    <tr>
                       <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                             <FolderOpen size={40} className="text-[#3b494b]" />
                             <div className="text-[#849495] font-sans text-xs uppercase tracking-widest">
                                No Active Holdings
                             </div>
                             <div className="text-[#3b494b] font-sans text-xs">
                                Click "Add Custom Asset" to fetch real land records from AnyROR
                             </div>
                          </div>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>

      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
