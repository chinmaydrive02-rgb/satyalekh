"use client";

import React from "react";
import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";
import TopNav from "@/components/TopNav";
import WelcomeIntro from "@/components/WelcomeIntro";
import {
  Landmark, Languages, ShieldCheck, FileSearch, Bell, GitBranch,
  Vault, Scale, TrendingUp, Search, Cpu, FileCheck2, ArrowRight,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: <Search size={20} />,
    title: "Locate the plot",
    desc: "Pick district and taluka, type the village and survey number — English is fine, we match it against the Gujarati government records.",
  },
  {
    icon: <Cpu size={20} />,
    title: "We fetch the official record",
    desc: "Our system reads the government AnyROR portal for you — CAPTCHA solving and Gujarati-to-English translation handled automatically.",
  },
  {
    icon: <FileCheck2 size={20} />,
    title: "Get a clear verdict",
    desc: "A 0–100 title score with encumbrance, tenure and mutation checks — plus the full chain of title, ready to save or print.",
  },
];

const FEATURES = [
  {
    icon: <FileSearch size={20} />,
    title: "Title reports in English",
    desc: "The official 7/12 (Satbara) record translated and structured — owner, area, tenure, encumbrances, jantri rate.",
    href: "/upload",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Chain of title",
    desc: "Every mutation entry (ferfar nondh) as a timeline, with breaks and disputed entries flagged automatically.",
    href: "/upload",
  },
  {
    icon: <Bell size={20} />,
    title: "Watchlist alerts",
    desc: "We re-check your parcels daily and alert you on any mutation, encumbrance or ownership change.",
    href: "/watchlist",
  },
  {
    icon: <Scale size={20} />,
    title: "Litigation check",
    desc: "Search Gujarat district court records for cases naming the recorded owner before you transact.",
    href: "/upload",
  },
  {
    icon: <Vault size={20} />,
    title: "Property locker",
    desc: "Keep your 7/12, sale deeds, NA orders and approvals organised and reachable on any device.",
    href: "/locker",
  },
  {
    icon: <TrendingUp size={20} />,
    title: "Market & compliance tools",
    desc: "Jantri-vs-market analysis, FSI calculators and stamp-duty estimates for Gujarat zones.",
    href: "/market",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <WelcomeIntro />
      <TopNav />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-6 lg:pt-10">
            <span className="eyebrow text-brand">Gujarat land records · AnyROR</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-[1.1]">
              Gujarat land title checks <span className="text-brand">in minutes</span>
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed max-w-lg">
              The government&apos;s 7/12 (સાતબાર) records are locked behind CAPTCHAs and
              Gujarati script. Satya-Lekh reads them for you — in English, with a clear
              title-risk verdict for buyers, lawyers and banks.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2"><Landmark size={15} className="text-brand" /> Official government data</span>
              <span className="flex items-center gap-2"><Languages size={15} className="text-brand" /> ગુજરાતી → English</span>
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Risk-scored reports</span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted border-t border-border pt-5">
              <span><strong className="text-ink font-semibold">33</strong> districts</span>
              <span><strong className="text-ink font-semibold">250+</strong> talukas</span>
              <span><strong className="text-ink font-semibold">18,000+</strong> villages indexed</span>
            </div>
          </div>

          {/* Search card front-and-center */}
          <div className="w-full max-w-xl mx-auto lg:mx-0">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="bg-surface border-y border-border py-14 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="eyebrow mb-2">How it works</p>
          <h2 className="text-2xl font-bold text-ink mb-8">From survey number to title verdict</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    {s.icon}
                  </span>
                  <span className="text-sm font-mono text-faint">0{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="eyebrow mb-2">Everything for due diligence</p>
          <h2 className="text-2xl font-bold text-ink mb-8">One place for Gujarat land intelligence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Link key={i} href={f.href} className="card p-6 flex flex-col gap-3 hover:border-brand transition-colors group">
                <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                  {f.icon}
                </span>
                <h3 className="text-base font-semibold text-ink group-hover:text-brand transition-colors">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto card p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-brand text-white border-brand">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white">Ready to verify a plot?</h2>
            <p className="text-white/80 text-sm">Run your first title check now — new users get free trial searches.</p>
          </div>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="btn bg-white text-brand hover:bg-brand-soft whitespace-nowrap">
            Start a search <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted">
          <span>© {new Date().getFullYear()} Satya-Lekh — Gujarat land title intelligence.</span>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
            <Link href="/documents" className="hover:text-ink transition-colors">Document library</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact</Link>
            <Link href="/demo" className="hover:text-ink transition-colors">Demo</Link>
          </div>
        </div>
        <p className="max-w-[1200px] mx-auto mt-4 text-xs text-faint leading-relaxed">
          Satya-Lekh reports are generated from official AnyROR records but are not a legal title
          opinion. For transactions, verify the index-2, a 30-year search report and pending
          litigation with a lawyer.
        </p>
      </footer>
    </main>
  );
}
