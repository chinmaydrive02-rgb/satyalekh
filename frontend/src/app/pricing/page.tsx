"use client";

import React from 'react';
import { Database, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-24 pb-10 px-10 flex flex-col items-center justify-center relative overflow-hidden">
      <TopNav />

      <div className="z-10 mb-12 text-center flex flex-col items-center">
        <h1 className="text-5xl font-display uppercase tracking-tight mb-4">Architectural Pricing</h1>
        <p className="text-[#849495] font-sans tracking-widest uppercase text-sm max-w-[600px]">
          Secure title intelligence tiers. Choose on-demand queries for individual plots 
          or bulk enterprise API access for financial institutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 w-full max-w-[900px]">
        
        {/* Pay as You Go */}
        <div className="glass-panel p-8 flex flex-col relative group overflow-hidden bg-[#1c1b1b]/80 border-[#3b494b]/40 border">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <Zap size={100} />
          </div>
          <h2 className="text-2xl font-display uppercase mb-2">Per-Query Access</h2>
          <div className="text-[#00f0ff] font-display text-4xl mb-6">₹1,500 <span className="text-sm text-[#849495] tracking-widest uppercase">/ plot</span></div>
          
          <ul className="flex flex-col gap-4 mb-8 text-sm text-[#dbfcff]/80 font-sans mt-4">
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> Instant OCR Extraction</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> GDCR FSI Calculator</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> Basic Litigation Flags</li>
          </ul>

          <button className="mt-auto w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] hover:brightness-110 transition-all border-none outline-none relative z-10">
            Initialize Scan Card
          </button>
        </div>

        {/* Enterprise */}
        <div className="glass-panel p-8 flex flex-col relative group overflow-hidden bg-[#2a2a2a]/60 border-[#00f0ff]/50 border drop-shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <Database size={100} />
          </div>
          <h2 className="text-2xl font-display uppercase mb-2 text-[#00f0ff]">Bank Bulk Deals</h2>
          <div className="text-[#dbfcff] font-display text-4xl mb-6">Custom <span className="text-sm text-[#4edea3] tracking-widest uppercase">/ annual</span></div>
          
          <ul className="flex flex-col gap-4 mb-8 text-sm text-[#dbfcff]/80 font-sans mt-4">
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Unlimited Regional Queries</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Direct PostGIS API Access</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Advanced Risk Aggregation</li>
          </ul>

          <button className="mt-auto w-full py-4 text-[#00f0ff] font-bold text-sm tracking-[0.15em] uppercase bg-transparent border border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all relative z-10">
            Contact Authority
          </button>
        </div>

      </div>

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
}
