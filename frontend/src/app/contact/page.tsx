"use client";

import React from 'react';
import { Mail, Phone, MapPin, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function ContactOwner() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[800px] mx-auto flex flex-col gap-8 mt-10 items-center">
        
        <div className="text-center mb-8">
           <h1 className="text-5xl font-display uppercase tracking-tight mb-4">Contact Protocol</h1>
           <p className="text-[#849495] font-sans text-xs tracking-widest uppercase">
              Establish an encrypted dialogue with the Master Architect of Satya-Lekh.
           </p>
        </div>

        <div className="glass-panel w-full p-10 flex flex-col md:flex-row items-center gap-10 border border-[#00f0ff]/40 bg-[#1c1b1b]/80 relative group overflow-hidden">
           
           {/* Cyber Grid Bg */}
           <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity bg-[linear-gradient(rgba(0,240,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

           <div className="z-10 bg-[#00f0ff]/10 p-6 border border-[#00f0ff] rounded-full flex items-center justify-center relative">
              <User size={64} className="text-[#00f0ff]" />
              <div className="absolute inset-0 border-t-2 border-[#00f0ff] rounded-full animate-spin"></div>
           </div>

           <div className="z-10 flex flex-col flex-1 w-full gap-6">
              <div>
                 <h2 className="text-3xl font-display text-[#dbfcff] uppercase tracking-wide">Chinmay Mistry</h2>
                 <span className="text-xs text-[#00f0ff] tracking-[0.2em] font-bold uppercase mt-1 block">Lead Architect & Founder</span>
              </div>

              <div className="flex flex-col gap-4">
                 <a href="mailto:chinmaydrive02@gmail.com" className="flex items-center gap-4 text-sm text-[#849495] font-sans uppercase tracking-[0.1em] hover:text-[#00f0ff] transition-colors p-3 bg-black/40 border border-[#3b494b] hover:border-[#00f0ff]/50">
                    <Mail size={16} className="text-[#00f0ff]" /> chinmaydrive02@gmail.com
                    <ChevronRight size={16} className="ml-auto opacity-50"/>
                 </a>
                 <a href="tel:+917487070961" className="flex items-center gap-4 text-sm text-[#849495] font-sans uppercase tracking-[0.1em] hover:text-[#00f0ff] transition-colors p-3 bg-black/40 border border-[#3b494b] hover:border-[#00f0ff]/50">
                    <Phone size={16} className="text-[#00f0ff]" /> +91 7487070961
                    <ChevronRight size={16} className="ml-auto opacity-50"/>
                 </a>
              </div>
           </div>
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
