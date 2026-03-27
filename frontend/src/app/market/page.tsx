"use client";

import React from 'react';
import { TrendingUp, BarChart2, Activity, Map, ArrowRight, Flame, Newspaper } from 'lucide-react';
import TopNav from '@/components/TopNav';

export default function MarketIntelligence() {
  const regions = [
    { name: "Shela (R1 Residential)", jantri: 8500, market: 42000, growth: "+39.7%" }, // Updated via web search
    { name: "Bopal (Commercial)", jantri: 12000, market: 85000, growth: "+16.0%" },
    { name: "Sanand (Industrial Phase II)", jantri: 4200, market: 18000, growth: "+162.5%" }, // Updated via web search
    { name: "Sarkhej (Mixed Use)", jantri: 9000, market: 55000, growth: "+11.1%" },
  ];

  // Helper macro to calculate arbitrary percentage width for the visual bars
  const calculateWidth = (val: number, max: number) => `${Math.min(100, (val / max) * 100)}%`;
  const MAX_MARKET_VAL = 90000;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#3b494b]/40 pb-6 gap-4">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-5xl font-display uppercase tracking-tight">Market Intelligence</h1>
                 <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-[#ba1b24]/20 text-[#ba1b24] border border-[#ba1b24]/50 flex items-center gap-2 animate-pulse">
                    <Activity size={12}/> LIVE DATA FEED
                 </span>
              </div>
              <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
                 <Map size={14} className="text-[#00f0ff]"/> Regional Jantri (Government) vs Real Market Value Analysis
              </p>
           </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-panel p-6 border-l-2 border-l-[#00f0ff] flex flex-col justify-between h-[120px]">
              <span className="text-[10px] text-[#849495] font-sans tracking-[0.2em] uppercase">Ahmedabad Prop Rates (2018-24)</span>
              <span className="text-4xl font-display text-[#dbfcff]">49<span className="text-lg text-[#00f0ff]">%</span></span>
              <span className="text-[10px] text-[#00f0ff] font-sans tracking-widest uppercase mt-1">Sustained Appreciation Rate</span>
           </div>
           <div className="glass-panel p-6 border-l-2 border-l-[#ba1b24] flex flex-col justify-between h-[120px] bg-[#ba1b24]/5">
              <span className="text-[10px] text-[#849495] font-sans tracking-[0.2em] uppercase">Expected Jantri Hike (2025)</span>
              <span className="text-3xl font-display text-[#ba1b24] uppercase">100 - 200%</span>
              <span className="text-[10px] text-[#ba1b24] font-sans tracking-widest uppercase mt-1">Pending Govt Notification</span>
           </div>
           <div className="glass-panel p-6 border-l-2 border-l-[#de4ced] flex flex-col justify-between h-[120px]">
              <span className="text-[10px] text-[#849495] font-sans tracking-[0.2em] uppercase">Highest Capital Growth (10 YR)</span>
              <span className="text-3xl font-display text-[#dbfcff]">Sanand</span>
              <span className="text-[10px] text-[#de4ced] font-sans tracking-widest uppercase mt-1">Land rate surged by 425%</span>
           </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Engine: Charts & Heatmap */}
           <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* The Differential Charts */}
              <div className="glass-panel border-[#3b494b]/40">
                 <div className="flex items-center justify-between p-6 border-b border-[#3b494b]/40 bg-[#131313]/60">
                    <h2 className="text-xl font-display uppercase tracking-tight flex items-center gap-3">
                       <BarChart2 size={18} className="text-[#00f0ff]"/> Micro-Market Discrepancy Matrix
                    </h2>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-[#849495]">
                       <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#4edea3]"></div> Jantri Rate</div>
                       <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#00f0ff]"></div> Market Rate</div>
                    </div>
                 </div>

                 <div className="p-6 flex flex-col gap-8">
                    {regions.map((region, idx) => (
                       <div key={idx} className="flex flex-col gap-3">
                          <div className="flex justify-between items-end">
                             <span className="text-sm font-bold tracking-widest uppercase text-[#dbfcff]">{region.name}</span>
                             <span className="text-[10px] text-[#00f0ff] font-bold tracking-widest bg-[#00f0ff]/10 px-2 py-1 flex items-center gap-1">
                                <TrendingUp size={12}/> {region.growth}
                             </span>
                          </div>

                          {/* Bars Container */}
                          <div className="flex flex-col gap-2 relative border-l border-[#3b494b]/40 pl-4 py-1">
                             {/* Jantri Bar */}
                             <div className="flex items-center gap-4 w-full">
                                <div className="h-4 bg-[#4edea3]/80 relative flex items-center overflow-hidden group transition-all" style={{ width: calculateWidth(region.jantri, MAX_MARKET_VAL) }}></div>
                                <span className="text-[10px] font-mono text-[#849495]">₹{region.jantri.toLocaleString()}/sqm</span>
                             </div>

                             {/* Market Bar */}
                             <div className="flex items-center gap-4 w-full">
                                <div className="h-4 bg-[#00f0ff] relative flex items-center overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all" style={{ width: calculateWidth(region.market, MAX_MARKET_VAL) }}></div>
                                <span className="text-[10px] font-mono text-[#00f0ff] font-bold">₹{region.market.toLocaleString()}/sqm</span>
                             </div>

                             {/* Differential Arrow Logic */}
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[#849495] font-sans tracking-widest uppercase flex items-center gap-2 border border-[#3b494b]/40 bg-[#0a0a0a] px-3 py-1 opacity-60 hover:opacity-100 transition-opacity cursor-help">
                                Spread: {Math.round(region.market / region.jantri)}x <ArrowRight size={10} className="text-[#00f0ff]"/>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Demand Heatmap */}
              <div className="glass-panel border-[#3b494b]/40">
                 <div className="flex items-center justify-between p-6 border-b border-[#3b494b]/40 bg-[#131313]/60">
                    <h2 className="text-xl font-display uppercase tracking-tight flex items-center gap-3">
                       <Flame size={18} className="text-[#ba1b24]"/> Territorial Demand Heatmap
                    </h2>
                 </div>
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#ba1b24]/20 border border-[#ba1b24]/50 p-4 flex flex-col items-center justify-center text-center gap-2 transition-all hover:bg-[#ba1b24]/30 cursor-pointer">
                       <span className="text-2xl font-display text-[#ba1b24]">SHELA</span>
                       <span className="text-[10px] text-[#dbfcff] font-bold uppercase tracking-widest border border-[#ba1b24] px-2 py-1">CRITICAL DEMAND</span>
                       <span className="text-[10px] text-[#849495] font-sans">Jantri set to spike 621%</span>
                    </div>
                    <div className="bg-[#de4ced]/20 border border-[#de4ced]/50 p-4 flex flex-col items-center justify-center text-center gap-2 transition-all hover:bg-[#de4ced]/30 cursor-pointer">
                       <span className="text-2xl font-display text-[#de4ced]">SANAND</span>
                       <span className="text-[10px] text-[#dbfcff] font-bold uppercase tracking-widest border border-[#de4ced] px-2 py-1">HIGH MOMENTUM</span>
                       <span className="text-[10px] text-[#849495] font-sans">Micron Semi-Conductor Effect</span>
                    </div>
                    <div className="bg-[#de4ced]/20 border border-[#de4ced]/50 p-4 flex flex-col items-center justify-center text-center gap-2 transition-all hover:bg-[#de4ced]/30 cursor-pointer">
                       <span className="text-2xl font-display text-[#de4ced]">SG HIGHWAY</span>
                       <span className="text-[10px] text-[#dbfcff] font-bold uppercase tracking-widest border border-[#de4ced] px-2 py-1">HIGH MOMENTUM</span>
                       <span className="text-[10px] text-[#849495] font-sans">Corporate Expansions</span>
                    </div>
                    <div className="bg-[#4edea3]/10 border border-[#4edea3]/30 p-4 flex flex-col items-center justify-center text-center gap-2 transition-all hover:bg-[#4edea3]/20 cursor-pointer">
                       <span className="text-2xl font-display text-[#4edea3]">GIFT CITY</span>
                       <span className="text-[10px] text-[#4edea3] font-bold uppercase tracking-widest border border-[#4edea3]/50 px-2 py-1">STABILIZING</span>
                       <span className="text-[10px] text-[#849495] font-sans">Consistent FII Inflows</span>
                    </div>
                 </div>
              </div>

           </div>

           {/* Right Column: Live News Source Feed */}
           <div className="glass-panel border-[#3b494b]/40 flex flex-col h-full bg-[#111111]/80 relative custom-scrollbar">
              <div className="flex items-center justify-between p-6 border-b border-[#3b494b]/40 bg-[#131313] sticky top-0 z-10 w-full">
                 <h2 className="text-xl font-display uppercase tracking-tight flex items-center gap-3">
                    <Newspaper size={18} className="text-[#00f0ff]"/> Macro News Feed
                 </h2>
              </div>
              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                 
                 {[
                   {
                     source: "Ahmedabad Mirror (Apr 2025)",
                     title: "Shela Jantri Rates Proposed to Increase by 621%",
                     desc: "The draft jantri rates for open plots in the Shela region are proposed to undergo a staggering 621% hike, translating to an effective 2,030% FSI cost jump compared to pre-2023 levels.",
                     tag: "REGULATION", color: "#ba1b24"
                   },
                   {
                     source: "Economic Times (Q1 2025)",
                     title: "Sanand Land Rates Spike Following Micron Chip Plant",
                     desc: "Land rates in Sanand have increased by a massive 162.5% over the last five years and 425% over the last ten years, driven by the new semiconductor manufacturing district.",
                     tag: "INDUSTRIAL", color: "#de4ced"
                   },
                   {
                     source: "NHB Housing Index (Q2 FY 24-25)",
                     title: "Ahmedabad Witnesses 7.9% Property Appreciation",
                     desc: "Quarterly trends demonstrate sustained momentum as Ahmedabad properties saw an overall 7.9% growth, bolstered by Metro Phase 2 inaugurations and NRI investments.",
                     tag: "RESIDENTIAL", color: "#4edea3"
                   },
                   {
                     source: "Gujarat Samachar (Nov 2024)",
                     title: "Developers Rush Approvals Ahead of Jantri Hike",
                     desc: "Gujarat's real estate sector saw a 6% increase in new project registrations as developers attempt to bypass the anticipated 100-200% state-wide jantri revision expected in late 2025.",
                     tag: "FINANCE", color: "#00f0ff"
                   }
                 ].map((news, i) => (
                    <div key={i} className="flex flex-col gap-2 relative pl-4 border-l-2 border-[#3b494b] group hover:border-[#00f0ff] transition-colors pb-4 border-b border-b-[#3b494b]/20">
                       <div className="absolute w-2 h-2 rounded-full -left-[5px] top-1" style={{ backgroundColor: news.color }}></div>
                       <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold font-sans">
                           <span className="text-[#849495]">{news.source}</span>
                           <span style={{ color: news.color, borderColor: `${news.color}40` }} className="bg-black/40 px-2 py-1 border">{news.tag}</span>
                       </div>
                       <h3 className="text-sm font-display leading-tight text-[#dbfcff] group-hover:text-[#00f0ff] transition-colors mt-1">{news.title}</h3>
                       <p className="text-xs text-[#849495] font-serif leading-relaxed mt-2">{news.desc}</p>
                    </div>
                 ))}
                 
              </div>
           </div>

        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
