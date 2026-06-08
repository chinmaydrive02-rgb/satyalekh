"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchWidget({ onPlotSelect }: { onPlotSelect: (plot: any) => void }) {
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyNo.trim() || !district.trim() || !taluka.trim() || !village.trim()) return;
    // Navigate to property detail page â real data comes from backend
    window.location.href = `/property/SURVEY-${surveyNo.trim()}?district=${encodeURIComponent(district.trim())}&taluka=${encodeURIComponent(taluka.trim())}&village=${encodeURIComponent(village.trim())}`;
  };

  const isFormValid = district.trim() && taluka.trim() && village.trim() && surveyNo.trim();

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
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">District (àªà«àª²à«àª²à«)</label>
           <input 
             type="text"
             value={district}
             onChange={e => setDistrict(e.target.value)}
             placeholder="e.g. Ahmedabad"
             className={inputClass}
           />
        </div>

        {/* Taluka */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Taluka (àª¤àª¾àª²à«àªà«)</label>
           <input 
             type="text"
             value={taluka}
             onChange={e => setTaluka(e.target.value)}
             placeholder="e.g. Daskroi"
             className={inputClass}
           />
        </div>

        {/* Village */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Village (àªàª¾àª®)</label>
           <input 
             type="text"
             value={village}
             onChange={e => setVillage(e.target.value)}
             placeholder="e.g. Bopal"
             className={inputClass}
           />
        </div>

        {/* Survey No â Free text input */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Survey / Block No. (àª¸àª°à«àªµà« àª¨àªàª¬)</label>
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
          disabled={!isFormValid}
          className="mt-2 w-full h-[48px] bg-gradient-to-br from-[#0bd9e4] to-[#00f0ff] hover:brightness-110 active:brightness-90 text-[#002022] font-bold text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2"><Search size={14}/> Initialize Vector</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </form>
    </div>
  );
}
