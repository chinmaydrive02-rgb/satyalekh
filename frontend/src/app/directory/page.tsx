"use client";

import React from 'react';
import { Phone, Mail, MapPin, Scale, Shield, Award } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function Directory() {
  const firms = [
    {
      name: "Chinmay Mistry",
      specialty: "Lead Counsel & System Architect",
      rating: "Verified Authority",
      address: "Ahmedabad, Gujarat",
      contact: "+91 7487070961",
      tier: "LEVEL 5",
      icon: <Scale className="text-[#00f0ff]" size={24}/>
    },
    {
      name: "NIC Gujarat Point of Contact",
      specialty: "Government Data Gateway",
      rating: "Govt. Authenticated",
      address: "Gandhinagar, Gujarat",
      contact: "1800-XXX-GOVT",
      tier: "GOVERNMENT",
      icon: <Shield className="text-[#4edea3]" size={24}/>
    }
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[1000px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-l-4 border-[#00f0ff] pl-6 mb-4">
           <h1 className="text-4xl font-display uppercase tracking-tight">Legal Authority Directory</h1>
           <p className="text-[#849495] font-sans text-xs tracking-widest uppercase">
              Verified legal counsel for resolving title disputes, lifting encumbrances, and NA conversions.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firms.map((firm, idx) => (
            <div key={idx} className="glass-panel p-6 flex flex-col gap-4 border border-[#3b494b]/40 relative group hover:border-[#00f0ff]/50 transition-colors">
               <div className="flex justify-between items-start">
                  {firm.icon}
                  <span className={`text-[10px] font-bold tracking-widest px-2 py-1 uppercase ${firm.tier === 'PREMIUM' ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30' : 'bg-[#1c1b1b] text-[#849495] border border-[#3b494b]'}`}>
                     {firm.tier}
                  </span>
               </div>
               
               <div className="flex flex-col">
                  <h3 className="text-xl font-display text-[#dbfcff] uppercase tracking-tight">{firm.name}</h3>
                  <span className="text-xs text-[#00f0ff] tracking-widest font-sans mt-1">{firm.specialty}</span>
               </div>

               <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-[#849495] font-sans uppercase tracking-[0.1em]">
                     <MapPin size={12}/> {firm.address}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#849495] font-sans uppercase tracking-[0.1em]">
                     <Phone size={12}/> {firm.contact}
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-[#3b494b]/40 flex justify-between items-center">
                  <div className="text-xs font-bold text-[#4edea3] tracking-widest uppercase">{firm.rating}</div>
                  <button className="text-[10px] font-bold text-[#0a0a0a] bg-[#dbfcff] px-4 py-2 hover:bg-[#00f0ff] transition-colors uppercase tracking-[0.15em]">
                     Dispatch Brief
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
