"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";
import TopNav from "@/components/TopNav";
import WelcomeIntro from "@/components/WelcomeIntro";
import {
  Landmark, Languages, ShieldCheck, FileSearch, Bell, GitBranch,
  Vault, Scale, TrendingUp, Search, Cpu, FileCheck2, ArrowRight,
  CheckCircle2, Building2, Gavel, UserCheck, MapPin,
} from "lucide-react";

/* ── Scroll reveal: adds .is-visible when the block enters the viewport.
   CSS (.reveal) handles the transition and respects reduced motion. ── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/* ── Hand-crafted CSS mock of the title report — the product visual.
   Pure DOM, no screenshots. Mirrors the real TitleReport aesthetics. ── */
function ReportMock() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]" aria-hidden="true">
      {/* Sheet behind — a second document in the stack */}
      <div className="absolute inset-0 translate-x-4 translate-y-5 -rotate-2 rounded-2xl bg-surface border border-border shadow-sm" />
      <div className="absolute inset-0 -translate-x-3 translate-y-2 rotate-1 rounded-2xl bg-surface-soft border border-border" />

      {/* The report sheet */}
      <div className="relative rounded-2xl bg-surface border border-border shadow-xl overflow-hidden rotate-[0.4deg]">
        {/* Deed-header band */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-brand">Title Intelligence Report</p>
            <p className="font-serif text-xl font-semibold text-ink mt-1 leading-tight">
              Survey No. <span className="font-mono font-bold tnum">128&thinsp;P</span>
            </p>
            <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
              <MapPin size={10} className="text-brand" /> Navrangpura, City, Ahmedabad
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[10px] text-faint tnum">Ref SL/AHM/128P</p>
            <div className="mt-1.5 inline-flex flex-col items-end">
              <span className="text-3xl font-mono font-bold tnum text-success leading-none">92</span>
              <span className="text-[9px] uppercase tracking-[0.13em] text-muted mt-0.5">Title score</span>
            </div>
          </div>
        </div>

        {/* Verdict stamp row */}
        <div className="px-6 py-3.5 flex items-center justify-between border-b border-border bg-surface-soft/40">
          <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-success/70 text-success px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] -rotate-2">
            <CheckCircle2 size={11} /> Clear
          </span>
          <span className="text-[10px] text-faint font-mono">7/12 · AnyROR · English</span>
        </div>

        {/* Ledger check rows */}
        <div className="px-6 py-4 flex flex-col gap-2.5 text-[12px]">
          {[
            ["Encumbrances (boja)", "None", true],
            ["Tenure — Juni Sharat", "Freely transferable", true],
            ["Mutation chain", "Complete · 5 entries", true],
            ["Prohibited category", "Not listed", true],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-baseline gap-2">
              <CheckCircle2 size={12} className="text-success shrink-0 translate-y-0.5" />
              <span className="text-ink-soft whitespace-nowrap">{k}</span>
              <span className="leader" />
              <span className="font-medium text-ink whitespace-nowrap">{v}</span>
            </div>
          ))}
        </div>

        {/* Mini chain of title */}
        <div className="px-6 pb-5">
          <p className="eyebrow text-[9px] mb-2">Chain of title</p>
          <div className="flex items-center gap-0">
            {["1987", "2004", "2019"].map((yr, i) => (
              <React.Fragment key={yr}>
                {i > 0 && <span className="h-px flex-1 bg-border-strong" />}
                <span className="flex flex-col items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-brand bg-brand-soft" />
                  <span className="font-mono text-[9px] text-muted tnum">{yr}</span>
                </span>
              </React.Fragment>
            ))}
            <span className="h-px flex-1 bg-border-strong" />
            <span className="flex flex-col items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-brand/15" />
              <span className="font-mono text-[9px] font-semibold text-brand tnum">Today</span>
            </span>
          </div>
        </div>

        {/* Gold registrar seal */}
        <div className="absolute bottom-14 right-5 w-16 h-16 rounded-full border-2 border-accent/50 flex items-center justify-center rotate-12 opacity-80">
          <div className="w-12 h-12 rounded-full border border-accent/40 border-dashed flex items-center justify-center">
            <ShieldCheck size={20} className="text-accent/70" />
          </div>
        </div>
      </div>

      {/* Floating fact chips */}
      <div className="sl-anim absolute -left-3 sm:-left-8 top-24 card px-3 py-2 shadow-lg text-[11px] flex items-center gap-1.5 -rotate-2"
        style={{ animation: "sl-float 5s ease-in-out infinite" }}>
        <Languages size={12} className="text-brand" />
        <span className="text-ink-soft">ગુજરાતી → <span className="font-semibold text-ink">English</span></span>
      </div>
      <div className="sl-anim absolute -right-2 sm:-right-6 -bottom-4 card px-3 py-2 shadow-lg text-[11px] flex items-center gap-1.5 rotate-1"
        style={{ animation: "sl-float 6s ease-in-out 0.8s infinite" }}>
        <ShieldCheck size={12} className="text-success" />
        <span className="text-ink-soft">CAPTCHA solved <span className="font-semibold text-ink">automatically</span></span>
      </div>
    </div>
  );
}

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
    icon: <FileSearch size={19} />,
    title: "Title reports in English",
    desc: "The official 7/12 (Satbara) record translated and structured — owner, area, tenure, encumbrances, jantri rate.",
    href: "/upload",
  },
  {
    icon: <GitBranch size={19} />,
    title: "Chain of title",
    desc: "Every mutation entry (ferfar nondh) as a timeline, with breaks and disputed entries flagged automatically.",
    href: "/upload",
  },
  {
    icon: <Bell size={19} />,
    title: "Watchlist alerts",
    desc: "We re-check your parcels daily and alert you on any mutation, encumbrance or ownership change.",
    href: "/watchlist",
  },
  {
    icon: <Scale size={19} />,
    title: "Litigation check",
    desc: "Search Gujarat district court records for cases naming the recorded owner before you transact.",
    href: "/upload",
  },
  {
    icon: <Vault size={19} />,
    title: "Property locker",
    desc: "Keep your 7/12, sale deeds, NA orders and approvals organised and reachable on any device.",
    href: "/locker",
  },
  {
    icon: <TrendingUp size={19} />,
    title: "Market & compliance tools",
    desc: "Jantri-vs-market analysis, FSI calculators and stamp-duty estimates for Gujarat zones.",
    href: "/market",
  },
];

const AUDIENCES = [
  { icon: <UserCheck size={15} />, label: "Home & land buyers", note: "before you pay a token" },
  { icon: <Gavel size={15} />, label: "Lawyers & title firms", note: "faster due-diligence drafts" },
  { icon: <Building2 size={15} />, label: "Banks & NBFCs", note: "collateral screening at scale" },
  { icon: <Landmark size={15} />, label: "Developers", note: "land aggregation checks" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <WelcomeIntro />
      <TopNav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-mesh pt-28 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="sl-anim flex flex-col gap-7 lg:pt-8" style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) both" }}>
            <span className="inline-flex items-center gap-2 w-fit rounded-full border border-brand-border bg-brand-soft/70 px-3.5 py-1.5 text-xs font-semibold text-brand">
              <Landmark size={13} /> Gujarat land records · AnyROR
            </span>
            <h1 className="font-serif text-[2.65rem] sm:text-6xl font-semibold text-ink leading-[1.04] tracking-tight">
              Know the truth of a title{" "}
              <em className="text-brand not-italic sm:italic font-medium">before the token changes hands.</em>
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed max-w-lg">
              The government&apos;s 7/12 (સાતબાર) records sit behind CAPTCHAs and Gujarati
              script. Satya-Lekh reads them for you — in English, with a clear
              title-risk verdict for buyers, lawyers and banks.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2"><Landmark size={15} className="text-brand" /> Official government data</span>
              <span className="flex items-center gap-2"><Languages size={15} className="text-brand" /> ગુજરાતી → English</span>
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Risk-scored reports</span>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
              {[["33", "districts"], ["250+", "talukas"], ["18,000+", "villages indexed"]].map(([n, l]) => (
                <span key={l} className="flex flex-col">
                  <strong className="font-mono tnum text-2xl font-bold text-ink leading-none">{n}</strong>
                  <span className="text-xs text-muted mt-1 uppercase tracking-[0.08em]">{l}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Search card front-and-center */}
          <div className="sl-anim w-full max-w-xl mx-auto lg:mx-0 lg:pt-2" style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.15s both" }}>
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* ── Trust strip: who it serves ───────────────────────────── */}
      <section className="border-y border-border bg-surface px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <div
              key={a.label}
              className={`flex items-center gap-3 py-5 px-4 sm:px-6 border-border ${
                i === 1 ? "border-l" : i === 2 ? "border-t lg:border-t-0 lg:border-l" : i === 3 ? "border-l border-t lg:border-t-0" : ""
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">{a.icon}</span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-ink leading-tight">{a.label}</span>
                <span className="text-xs text-muted truncate">{a.note}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Report showcase — the artefact ───────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <Reveal className="order-2 lg:order-1">
            <ReportMock />
          </Reveal>
          <Reveal delay={120} className="order-1 lg:order-2">
            <div className="flex flex-col gap-5 max-w-lg">
              <p className="eyebrow text-accent">The report</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12]">
                A title opinion you can actually read.
              </h2>
              <p className="text-ink-soft leading-relaxed">
                Every search produces a structured, printable report — a 0–100 title
                score, ledger-style checks for encumbrances, tenure and prohibited
                categories, and the full mutation history drawn as a timeline.
              </p>
              <ul className="flex flex-col gap-3 text-sm text-ink-soft">
                {[
                  "Verdict at a glance — Clear, Caution or High Risk",
                  "Chain of title with breaks flagged automatically",
                  "Jantri rate, area, cultivation and last-sale context",
                  "Print-clean PDF for your file or your lawyer",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
              <Link href="/demo" className="btn btn-outline w-fit mt-1">
                See a sample in demo mode <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-surface border-y border-border py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2">How it works</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-12">
              From survey number to title verdict
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
            {/* Dashed connector across the steps (desktop) */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] border-t-2 border-dashed border-border-strong" aria-hidden="true" />
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="flex flex-col gap-4 md:items-center md:text-center relative">
                  <div className="relative w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-md shrink-0 z-10 ring-4 ring-surface">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-surface tnum">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2">Everything for due diligence</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-12">
              One place for Gujarat land intelligence
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 90}>
                <Link
                  href={f.href}
                  className="card card-lift p-6 flex flex-col gap-3.5 group h-full hover:border-brand-border"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center transition-colors group-hover:bg-brand group-hover:text-white">
                    {f.icon}
                  </span>
                  <h3 className="text-base font-semibold text-ink group-hover:text-brand transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                  <span className="mt-auto pt-1 text-xs font-semibold text-brand inline-flex items-center gap-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Explore <ArrowRight size={12} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA band ────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="section-dark max-w-[1200px] mx-auto rounded-3xl px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow text-accent-bright mb-3">Start now</p>
                <h2 className="font-serif text-3xl sm:text-[2.6rem] font-semibold text-white leading-[1.1] mb-4">
                  Ready to verify a plot?
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  Run your first title check now — new users get free trial searches.
                  No card needed, verdict in minutes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <a
                  href="#top"
                  onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold"
                >
                  Start a search <ArrowRight size={15} />
                </a>
                <Link href="/pricing" className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-7 py-3 whitespace-nowrap">
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="section-dark px-4 sm:px-6">
        <div className="relative z-10 max-w-[1200px] mx-auto py-14">
          <div className="flex flex-col md:flex-row justify-between gap-10 pb-10 border-b border-white/10">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center shadow-md">
                  <ShieldCheck size={18} className="text-white" />
                </span>
                <span className="font-display text-lg font-bold text-white tracking-tight">Satya-Lekh</span>
                <span className="font-serif italic text-sm text-white/40">सत्य · લેખ</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Gujarat land-title intelligence — official AnyROR records, translated,
                risk-scored and monitored, for the people who sign.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
              <div className="flex flex-col gap-2.5">
                <span className="eyebrow text-white/40">Product</span>
                <Link href="/" className="text-white/70 hover:text-white transition-colors">Title search</Link>
                <Link href="/watchlist" className="text-white/70 hover:text-white transition-colors">Watchlist</Link>
                <Link href="/upload" className="text-white/70 hover:text-white transition-colors">Title scanner</Link>
                <Link href="/land-intel" className="text-white/70 hover:text-white transition-colors">Land intel</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="eyebrow text-white/40">Tools</span>
                <Link href="/market" className="text-white/70 hover:text-white transition-colors">Market intel</Link>
                <Link href="/compliance" className="text-white/70 hover:text-white transition-colors">FSI compliance</Link>
                <Link href="/locker" className="text-white/70 hover:text-white transition-colors">Property locker</Link>
                <Link href="/documents" className="text-white/70 hover:text-white transition-colors">Document library</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="eyebrow text-white/40">Company</span>
                <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
                <Link href="/directory" className="text-white/70 hover:text-white transition-colors">Legal directory</Link>
                <Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link>
                <Link href="/demo" className="text-white/70 hover:text-white transition-colors">Demo</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col gap-4">
            <p className="text-xs text-white/40 leading-relaxed max-w-3xl">
              Satya-Lekh reports are generated from official AnyROR records but are not a legal title
              opinion. For transactions, verify the index-2, a 30-year search report and pending
              litigation with a lawyer.
            </p>
            <span className="text-xs text-white/50">
              © {new Date().getFullYear()} Satya-Lekh — Gujarat land title intelligence.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
