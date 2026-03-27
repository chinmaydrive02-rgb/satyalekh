"use client";

import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { mockData } from '@/lib/mockData';

export default function SearchWidget({ onPlotSelect }: { onPlotSelect: (plot: any) => void }) {
  const [surveyNo, setSurveyNo] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyNo) return;
    
    // Find plot in mock data
    const plot = mockData.features.find((f: any) => 
      f.properties.type === 'plot' && f.properties.survey_number === surveyNo
    );
    
    if (plot) {
      onPlotSelect(plot);
    } else {
      alert("Survey number not found in mock data");
    }
  };

  return (
    <div className="glass-panel w-[320px] absolute top-8 left-8 z-40 p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1 mb-2">
         <h1 className="text-[#dbfcff] font-display font-medium text-[28px] uppercase tracking-tight leading-none">Satya-Lekh</h1>
         <span className="text-[#00f0ff] uppercase tracking-[0.2em] text-[10px] font-bold">Title Intelligence HUD</span>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[#00f0ff] to-transparent opacity-40"></div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        {/* District */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">District</label>
           <div className="px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] flex justify-between items-center text-[#dbfcff]/70 text-sm font-sans uppercase">
              Ahmedabad <ChevronDown size={14} />
           </div>
        </div>

        {/* Village */}
        <div className="flex flex-col gap-2">
           <label className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Village / Zone</label>
           <div className="px-4 py-3 bg-[#1c1b1b] border-b-2 border-[#3b494b] flex justify-between items-center text-[#dbfcff]/70 text-sm font-sans uppercase">
              Shela <ChevronDown size={14} />
           </div>
        </div>

        {/* Survey No Input */}
        <div className="flex flex-col gap-2 mt-2">
           <label className="text-[#00f0ff] text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
             <Search size={12}/> Target Survey ID
           </label>
           <input 
             type="text" 
             value={surveyNo}
             onChange={(e) => setSurveyNo(e.target.value)}
             placeholder="e.g. 25"
             className="w-full px-4 py-3 bg-transparent border-b-2 border-[#3b494b] text-[#dbfcff] font-display text-[18px] focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]"
           />
        </div>

        <button 
          type="submit" 
          className="mt-4 w-full h-[48px] bg-gradient-to-br from-[#0bd9e4] to-[#00f0ff] hover:brightness-110 active:brightness-90 text-[#002022] font-bold text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group"
        >
          <span className="relative z-10">Initialize Vector</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </form>
    </div>
  );
}
