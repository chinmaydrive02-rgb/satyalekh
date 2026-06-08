"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ANYROR_DATASET } from '@/lib/anyrorData';

export default function SearchWidget({ onPlotSelect }: { onPlotSelect: (plot: any) => void }) {
  const [district, setDistrict] = useState('Ahmedabad');
  const [taluka, setTaluka] = useState('CITY');
  const [village, setVillage] = useState('Navrangpura');
  const [surveyNo, setSurveyNo] = useState('');

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    const firstTaluka = Object.keys(ANYROR_DATASET[d] || {})[0] || "";
    setTaluka(firstTaluka);
    const firstVillage = Object.keys(ANYROR_DATASET[d]?.[firstTaluka] || {})[0] || "";
    setVillage(firstVillage);
    setSurveyNo('');
  };

  const handleTalukaChange = (t: string) => {
    setTaluka(t);
    const firstVillage = Object.keys(ANYROR_DATASET[district]?.[t] || {})[0] || "";
    setVillage(firstVillage);
    setSurveyNo('');
  };

  const handleVillageChange = (v: string) => {
    setVillage(v);
    setSurveyNo('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyNo.trim()) return;
    // Navigate to property detail page — real data comes from backend
    window.location.href = `/property/SURVEY-${surveyNo.trim()}?district=${district}&taluka=${taluka}&village=${village}`;
  };

  const selectClass = "w-full px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] text-[#dbfcff] text-sm font-sans uppercase focus:outline-none focus:border-[#00f0ff] transition-colors cursor-pointer";
  const inputClass = "w-full px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] text-[#dbfcff] text-sm font-mono focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]";

  return (
    <div className="glass-panel w-[320px] p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1 mb-2">
         <h1 className="text-[#dbfcff] font-display font-medium text-[28px] uppercase tracking-tight leading-none">Satya-Lekh</h1>
         <span className="text-[#00f0ff] uppercase tracking-[0.2em] text-[10px] font-bold">Title Intelligence HUD</span>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[#00f0ff] to-transparent opacity-40"></div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        {/* District */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">District (જીલ્લો)</label>
           <select 
             value={district} 
             onChange={e => handleDistrictChange(e.target.value)}
             style={{ appearance: 'auto', WebkitAppearance: 'menulist' as any }}
             className={selectClass}
           >
             {Object.keys(ANYROR_DATASET).map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
           </select>
        </div>

        {/* Taluka */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Taluka (તાલુકો)</label>
           <select 
             value={taluka} 
             onChange={e => handleTalukaChange(e.target.value)}
             style={{ appearance: 'auto', WebkitAppearance: 'menulist' as any }}
             className={selectClass}
           >
             {Object.keys(ANYROR_DATASET[district] || {}).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
           </select>
        </div>

        {/* Village */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Village (ગામ)</label>
           <select 
             value={village} 
             onChange={e => handleVillageChange(e.target.value)}
             style={{ appearance: 'auto', WebkitAppearance: 'menulist' as any }}
             className={selectClass}
           >
             {Object.keys(ANYROR_DATASET[district]?.[taluka] || {}).map(v => <option key={v} value={v}>{v}</option>)}
           </select>
        </div>

        {/* Survey No — Free text input */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Survey / Block No. (સર્વે નંબર)</label>
           <input 
             type="text"
             value={surveyNo}
             onChange={e => setSurveyNo(e.target.value)}
             placeholder="Enter survey number (e.g. 123)"
             className={inputClass}
           />
        </div>

        <button 
          type="submit"
          disabled={!surveyNo.trim()}
          className="mt-2 w-full h-[48px] bg-gradient-to-br from-[#0bd9e4] to-[#00f0ff] hover:brightness-110 active:brightness-90 text-[#002022] font-bold text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2"><Search size={14}/> Initialize Vector</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </form>
    </div>
  );
}
