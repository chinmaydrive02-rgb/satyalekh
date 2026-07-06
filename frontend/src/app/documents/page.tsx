"use client";

// Gujarat Land Document Library — what every record is, why it matters in a
// transaction, and where to get it (Landeed-style state document directory).

import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { Reveal } from '@/components/motion';
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
    <main className="min-h-screen bg-bg text-ink pt-24 pb-12 px-4 sm:px-6">
      <TopNav />
      <div className="w-full max-w-[860px] mx-auto flex flex-col gap-6">
        <Reveal>
          <div className="border-b border-border pb-6">
            <p className="eyebrow mb-1">Reference</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-ink flex items-center gap-3"><BookOpen size={28} className="text-brand"/> Gujarat Document Library</h1>
            <p className="text-muted text-sm mt-2">Every land document explained — what it is, why it matters, where to get it.</p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-2">
          {DOCS.map((d, i) => (
            <div
              key={i}
              className="sl-anim card overflow-hidden"
              style={{ animation: `sl-slide-in 0.5s cubic-bezier(0.22,0.61,0.36,1) ${Math.min(i * 60, 480)}ms both` }}
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-soft/50 transition-colors">
                <span className="flex-1 text-sm font-semibold text-ink">{d.name}</span>
                {d.autofetch && (
                  <span className="badge bg-success-soft text-success border border-success-border shrink-0">
                    <Zap size={10}/> Auto-fetch
                  </span>
                )}
                <ChevronDown size={15} className={`text-muted transition-transform shrink-0 ${open === i ? 'rotate-180' : ''}`}/>
              </button>
              {open === i && (
                <div
                  className="sl-anim px-4 pb-4 flex flex-col gap-3 border-t border-border pt-3"
                  style={{ animation: 'sl-fade-up 0.3s cubic-bezier(0.22,0.61,0.36,1) both' }}
                >
                  <div><span className="eyebrow text-brand">What it is</span>
                    <p className="text-sm text-ink-soft leading-relaxed mt-1">{d.what}</p></div>
                  <div><span className="eyebrow text-warning">Why it matters</span>
                    <p className="text-sm text-ink-soft leading-relaxed mt-1">{d.why}</p></div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]"><span className="eyebrow text-success">How to get it</span>
                      <p className="text-sm text-ink-soft leading-relaxed mt-1">{d.how}</p></div>
                    <div className="flex gap-2">
                      <a href={d.link} target="_blank" rel="noopener noreferrer"
                        className="btn btn-outline py-2 px-3 text-xs">
                        Official Portal <ExternalLink size={10}/>
                      </a>
                      {d.autofetch && (
                        <Link href="/" className="btn btn-primary py-2 px-3 text-xs">
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

        <Reveal delay={100}>
          <div className="card card-lift border-brand-border bg-brand-soft/50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="flex-1 text-sm text-ink-soft leading-relaxed">
              Got these documents already? Keep them safe in your <span className="text-brand font-medium">Property Locker</span> —
              organised by type, available on any device.
            </p>
            <Link href="/locker" className="btn btn-primary whitespace-nowrap">Open Locker</Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
