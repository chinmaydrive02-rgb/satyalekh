"use client";

// Gujarat Land Document Library — what every record is, why it matters in a
// transaction, and where to get it (Landeed-style state document directory).

import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { BookOpen, Zap, ExternalLink, ChevronDown } from 'lucide-react';

const DOCS = [
  {
    name: '7/12 Extract (Satbara Utara / VF-7/12)', autofetch: true,
    what: 'The core record of rights: owner names, survey number, area, tenure type, crops and encumbrances for a parcel.',
    why: 'The first document in any due diligence — establishes who owns the land and whether it is mortgaged or restricted.',
    how: 'AnyROR Gujarat (free, Gujarati) — or fetch it here in English with a risk analysis.', link: 'https://anyror.gujarat.gov.in',
  },
  {
    name: 'VF-6 (Hakk Patrak / Mutation Entry Register)', autofetch: true,
    what: 'The chronological log of every change to the record: sales, inheritance, mortgages, court orders — each as a numbered entry (nondh).',
    why: 'Reveals the ownership chain and any disputed or pending mutations. A clean 7/12 with a messy VF-6 is a red flag.',
    how: 'AnyROR → VF-6 Entry Details — fetchable through our Title Scanner.', link: 'https://anyror.gujarat.gov.in',
  },
  {
    name: 'VF-8A (Khata Details)', autofetch: true,
    what: 'The account (khata) statement listing all parcels held by one khatedar in a village.',
    why: 'Confirms total holdings of the seller and catches parcels they may not have disclosed.',
    how: 'AnyROR → VF-8A Khata Details — fetchable here by khata number.', link: 'https://anyror.gujarat.gov.in',
  },
  {
    name: '135-D Notice', autofetch: true,
    what: 'The statutory notice issued when a mutation is proposed, inviting objections within 30 days.',
    why: 'A pending 135-D means ownership is mid-transfer — wait for certification before transacting.',
    how: 'AnyROR → 135-D Notice for Mutation.', link: 'https://anyror.gujarat.gov.in',
  },
  {
    name: 'Index-2 (Sale Deed Index)', autofetch: false,
    what: 'The sub-registrar’s index of a registered document: parties, property, consideration paid and registration date.',
    why: 'Proves the last registered transaction and the real price paid — cross-check it against the 7/12 owner.',
    how: 'Garvi (IORA) portal of the Inspector General of Registration, Gujarat.', link: 'https://garvi.gujarat.gov.in',
  },
  {
    name: 'Encumbrance Certificate (Search Report)', autofetch: false,
    what: 'A certificate listing all registered transactions (sales, mortgages, leases) on a property for a period — typically 12-30 years.',
    why: 'Banks insist on it; it surfaces charges that may not appear on the current 7/12.',
    how: 'Sub-registrar office / Garvi; advocates compile 30-year title search reports from it.', link: 'https://garvi.gujarat.gov.in',
  },
  {
    name: 'NA (Non-Agricultural) Order', autofetch: false,
    what: 'The collector’s permission converting agricultural land to non-agricultural use under GLRC §65.',
    why: 'Without NA, construction on farmland is illegal regardless of what the seller promises.',
    how: 'iORA Gujarat portal (online NA applications) or the district collectorate.', link: 'https://iora.gujarat.gov.in',
  },
  {
    name: 'Jantri (ASR) Rate Certificate', autofetch: false,
    what: 'The government’s minimum valuation of land per sq m for an area — the floor for stamp duty.',
    why: 'Sets your stamp-duty cost and signals official valuation; large gaps vs market price are negotiation intel.',
    how: 'Garvi jantri lookup — and our reports surface it when present on the record.', link: 'https://garvi.gujarat.gov.in',
  },
  {
    name: 'Property Card (City Survey)', autofetch: false,
    what: 'The urban equivalent of the 7/12 for city-survey areas: ownership, area, tenure for non-agricultural urban plots.',
    why: 'For flats and city plots, this (not the 7/12) is the primary ownership record.',
    how: 'AnyROR → Property Card / e-Milkat, or the city survey office.', link: 'https://anyror.gujarat.gov.in',
  },
  {
    name: 'RERA Project Registration', autofetch: false,
    what: 'Gujarat RERA’s record of a registered real-estate project: promoter, approvals, timelines, complaints.',
    why: 'Buying into a project? Unregistered = illegal to sell; the RERA file shows litigation and delays.',
    how: 'GujRERA portal project search.', link: 'https://gujrera.gujarat.gov.in',
  },
];

export default function DocumentLibrary() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-24 pb-12 px-6 relative">
      <TopNav />
      <div className="w-full max-w-[860px] mx-auto flex flex-col gap-6">
        <div className="border-b border-[#3b494b]/40 pb-4">
          <h1 className="text-4xl font-display uppercase tracking-tight text-[#00f0ff] flex items-center gap-3"><BookOpen size={30}/> Gujarat Document Library</h1>
          <p className="text-[#849495] text-xs tracking-widest uppercase mt-2">Every land document explained — what it is, why it matters, where to get it</p>
        </div>

        <div className="flex flex-col gap-2">
          {DOCS.map((d, i) => (
            <div key={i} className="glass-panel border border-[#3b494b]/40">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-left">
                <span className="flex-1 text-sm font-display uppercase tracking-wide text-[#dbfcff]">{d.name}</span>
                {d.autofetch && (
                  <span className="px-2 py-0.5 text-[8px] uppercase font-bold tracking-widest bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/40 flex items-center gap-1">
                    <Zap size={9}/> Auto-fetch
                  </span>
                )}
                <ChevronDown size={14} className={`text-[#849495] transition-transform ${open === i ? 'rotate-180' : ''}`}/>
              </button>
              {open === i && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#3b494b]/20 pt-3">
                  <div><span className="text-[9px] uppercase tracking-widest font-bold text-[#00f0ff]">What it is</span>
                    <p className="text-[11px] text-[#b8c8c9] leading-relaxed mt-1">{d.what}</p></div>
                  <div><span className="text-[9px] uppercase tracking-widest font-bold text-[#de4ced]">Why it matters</span>
                    <p className="text-[11px] text-[#b8c8c9] leading-relaxed mt-1">{d.why}</p></div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]"><span className="text-[9px] uppercase tracking-widest font-bold text-[#4edea3]">How to get it</span>
                      <p className="text-[11px] text-[#b8c8c9] leading-relaxed mt-1">{d.how}</p></div>
                    <div className="flex gap-2">
                      <a href={d.link} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 border border-[#3b494b] text-[#849495] text-[9px] font-bold uppercase tracking-widest hover:text-[#dbfcff] flex items-center gap-1.5">
                        Official Portal <ExternalLink size={9}/>
                      </a>
                      {d.autofetch && (
                        <Link href="/" className="px-3 py-2 bg-[#00f0ff] text-[#002022] text-[9px] font-bold uppercase tracking-widest hover:brightness-110">
                          Fetch in English →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="glass-panel border border-[#00f0ff]/30 bg-[#00f0ff]/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="flex-1 text-[11px] text-[#b8c8c9] leading-relaxed">
            Got these documents already? Keep them safe in your <span className="text-[#00f0ff]">Property Locker</span> —
            organised by type, available on any device.
          </p>
          <Link href="/locker" className="px-5 py-2.5 bg-gradient-to-r from-[#0bd9e4] to-[#00f0ff] text-[#002022] text-[10px] font-bold uppercase tracking-widest">Open Locker</Link>
        </div>
      </div>
    </main>
  );
}
