"use client";

import React from 'react';
import { Mail, Phone, User, ChevronRight } from 'lucide-react';
import TopNav from '@/components/TopNav';

export default function ContactOwner() {
  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col pt-24 pb-12 px-4 sm:px-6">
      <TopNav />

      <div className="w-full max-w-[720px] mx-auto flex flex-col gap-8 mt-6 items-center">

        <div className="text-center">
           <p className="eyebrow mb-1">Contact</p>
           <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3">Get in touch</h1>
           <p className="text-muted text-sm">
              Questions about a report, enterprise access, or certified opinions — we respond within 24 hours.
           </p>
        </div>

        <div className="card w-full p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
           <div className="w-24 h-24 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center shrink-0">
              <User size={44} className="text-brand" />
           </div>

           <div className="flex flex-col flex-1 w-full gap-6">
              <div>
                 <h2 className="text-2xl font-semibold text-ink">Chinmay Mistry</h2>
                 <span className="text-sm text-brand font-medium mt-0.5 block">Lead Architect &amp; Founder</span>
              </div>

              <div className="flex flex-col gap-3">
                 <a href="mailto:chinmaydrive02@gmail.com" className="flex items-center gap-3 text-sm text-ink-soft hover:text-brand transition-colors p-3.5 rounded-lg bg-surface-soft border border-border hover:border-brand-border">
                    <Mail size={16} className="text-brand shrink-0" /> chinmaydrive02@gmail.com
                    <ChevronRight size={16} className="ml-auto text-faint"/>
                 </a>
                 <a href="tel:+917487070961" className="flex items-center gap-3 text-sm text-ink-soft hover:text-brand transition-colors p-3.5 rounded-lg bg-surface-soft border border-border hover:border-brand-border">
                    <Phone size={16} className="text-brand shrink-0" /> +91 7487070961
                    <ChevronRight size={16} className="ml-auto text-faint"/>
                 </a>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
