"use client";

import React from "react";
import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";
import TopNav from "@/components/TopNav";
import WelcomeIntro from "@/components/WelcomeIntro";
import { Reveal, CountUp } from "@/components/motion";
import {
  Landmark, Languages, ShieldCheck, FileSearch, Bell, GitBranch,
  Vault, Scale, TrendingUp, Search, Cpu, FileCheck2, ArrowRight,
  CheckCircle2, Building2, Gavel, UserCheck, MapPin, Zap, Globe2,
  FileBadge2, Database, Timer, Stamp, IndianRupee, Route,
} from "lucide-react";

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

/* ── Data ─────────────────────────────────────────────────────── */

const HOW_IT_WORKS = [
  {
    icon: <Search size={20} />,
    title: "Locate the plot",
    desc: "Pick district and taluka, type the village and survey number — English is fine, we match it against the local-script government records.",
  },
  {
    icon: <Cpu size={20} />,
    title: "We fetch the official record",
    desc: "Our fulfilment engine routes your request to the fastest channel — portal fetch, DigiLocker or our verified cache — with CAPTCHA solving and translation handled automatically.",
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
    desc: "The official RoR — 7/12, RTC, Khasra — translated and structured: owner, area, tenure, encumbrances, jantri rate.",
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
    desc: "Search district court records for cases naming the recorded owner before you transact.",
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

/* Four fulfilment channels — one search box, four ways to deliver. */
const CHANNELS = [
  {
    icon: <Database size={20} />,
    sla: "Instant",
    slaTone: "text-success bg-success-soft border-success-border",
    title: "Verified cache",
    desc: "Parcels already checked through Satya-Lekh are served from our corpus instantly — already-verified records are free to view again.",
  },
  {
    icon: <FileBadge2 size={20} />,
    sla: "Seconds",
    slaTone: "text-brand bg-brand-soft border-brand-border",
    title: "DigiLocker rails",
    desc: "Government-signed RoR PDFs pulled straight from official issuers in DigiLocker-enabled states. No CAPTCHA, no queues. Rolling out.",
  },
  {
    icon: <Cpu size={20} />,
    sla: "~2 minutes",
    slaTone: "text-brand bg-brand-soft border-brand-border",
    title: "Live portal fetch",
    desc: "Our engine reads the state portal for you — AnyROR today, MahaBhulekh and Bhoomi next — solving CAPTCHAs and translating as it goes.",
  },
  {
    icon: <Stamp size={20} />,
    sla: "2–5 days",
    slaTone: "text-accent bg-accent-soft border-accent-border",
    title: "Certified copies",
    desc: "Certified 7/12 + index-2 and 30-year search reports fetched from the Sub-Registrar's office by our on-ground partners, advocate-reviewed.",
  },
];

/* Coverage board — honest per-state status, straight from the rollout plan. */
type StateStatus = "live" | "next" | "planned";
const COVERAGE: {
  state: string;
  portal: string;
  record: string;
  status: StateStatus;
  note?: string;
}[] = [
  { state: "Gujarat", portal: "AnyROR", record: "7/12 · VF-6 · VF-8A", status: "live", note: "Full title reports, litigation check, watchlist" },
  { state: "Maharashtra", portal: "MahaBhulekh", record: "7/12 · 8A · Property card", status: "next", note: "Marathi → English, same report format" },
  { state: "Karnataka", portal: "Bhoomi", record: "RTC / Pahani", status: "next", note: "Kannada → English" },
  { state: "Uttar Pradesh", portal: "UP Bhulekh", record: "Khasra / Khatauni", status: "planned" },
  { state: "Tamil Nadu", portal: "TN e-Services", record: "Patta / Chitta", status: "planned" },
  { state: "Rajasthan", portal: "Apna Khata", record: "Jamabandi Nakal", status: "planned" },
  { state: "Punjab & Haryana", portal: "Jamabandi", record: "Jamabandi", status: "planned" },
  { state: "Madhya Pradesh", portal: "MP Bhulekh", record: "Khasra", status: "planned" },
  { state: "Telangana", portal: "Bhu Bharati", record: "RoR · EC", status: "planned" },
  { state: "Andhra Pradesh", portal: "Meebhoomi", record: "1-B · Adangal", status: "planned" },
  { state: "West Bengal", portal: "Banglarbhumi", record: "Porcha RoR", status: "planned" },
  { state: "Kerala", portal: "Ente Bhoomi", record: "RoR", status: "planned" },
];

const STATUS_META: Record<StateStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "text-success bg-success-soft border-success-border" },
  next: { label: "Next up", cls: "text-brand bg-brand-soft border-brand-border" },
  planned: { label: "On the roadmap", cls: "text-muted bg-surface-soft border-border" },
};

const PORTAL_MARQUEE = [
  "AnyROR · Gujarat", "MahaBhulekh · Maharashtra", "Bhoomi · Karnataka",
  "UP Bhulekh · Uttar Pradesh", "Patta Chitta · Tamil Nadu", "Apna Khata · Rajasthan",
  "Jamabandi · Punjab & Haryana", "MP Bhulekh · Madhya Pradesh", "Bhu Bharati · Telangana",
  "Meebhoomi · Andhra Pradesh", "Banglarbhumi · West Bengal", "Ente Bhoomi · Kerala",
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
            <span className="inline-flex items-center gap-2.5 w-fit rounded-full border border-brand-border bg-brand-soft/70 px-3.5 py-1.5 text-xs font-semibold text-brand">
              <span className="pulse-dot" aria-hidden="true" />
              Gujarat live today · pan-India rollout underway
            </span>
            <h1 className="font-serif text-[2.65rem] sm:text-6xl font-semibold text-ink leading-[1.04] tracking-tight">
              Know the truth of a title{" "}
              <em className="text-sheen not-italic sm:italic font-medium">before the token changes hands.</em>
            </h1>
            <p className="text-lg text-ink-soft leading-relaxed max-w-lg">
              India&apos;s land records sit behind CAPTCHAs, regional scripts and
              registrar queues. Satya-Lekh reads them for you — in English, with a
              clear title-risk verdict for buyers, lawyers and banks. Gujarat&apos;s
              7/12 (સાતબાર) records today; Maharashtra and Karnataka next.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2"><Landmark size={15} className="text-brand" /> Official government data</span>
              <span className="flex items-center gap-2"><Languages size={15} className="text-brand" /> Local script → English</span>
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Risk-scored reports</span>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
              {[
                { n: 33, suffix: "", label: "districts live" },
                { n: 250, suffix: "+", label: "talukas" },
                { n: 18000, suffix: "+", label: "villages indexed" },
                { n: 12, suffix: "", label: "states on the roadmap" },
              ].map((s) => (
                <span key={s.label} className="flex flex-col">
                  <strong className="font-mono tnum text-2xl font-bold text-ink leading-none">
                    <CountUp target={s.n} suffix={s.suffix} />
                  </strong>
                  <span className="text-xs text-muted mt-1 uppercase tracking-[0.08em]">{s.label}</span>
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

      {/* ── Portal marquee — the breadth signal ──────────────────── */}
      <section className="border-y border-border bg-surface py-3.5 overflow-hidden" aria-label="State land-record portals">
        <div className="marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="marquee-track" aria-hidden={dup === 1}>
              {PORTAL_MARQUEE.map((p) => (
                <span key={`${dup}-${p}`} className="flex items-center gap-2 whitespace-nowrap text-xs font-mono text-muted">
                  <Landmark size={11} className="text-brand/60" /> {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust strip: who it serves ───────────────────────────── */}
      <section className="border-b border-border bg-surface px-4 sm:px-6">
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

      {/* ── Four channels — the fulfilment engine ────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Route size={12} /> One search box, four channels</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              Every request takes the fastest honest route to the record.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              There is no magic API into every state — so we built a document-fulfilment
              engine instead. Each search is routed to whichever channel can actually
              deliver it, and we tell you the speed up front: instant, minutes, or days.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CHANNELS.map((c, i) => (
              <Reveal key={c.title} delay={i * 110} variant="reveal-scale">
                <div className="card channel-card p-6 flex flex-col gap-3.5 h-full">
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                      {c.icon}
                    </span>
                    <span className={`badge border text-[11px] ${c.slaTone}`}>
                      <Timer size={11} /> {c.sla}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-ink">{c.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coverage board — pan-India, honestly labelled ────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-12 lg:gap-16 items-start">
          <Reveal variant="reveal-left" className="lg:sticky lg:top-24">
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Globe2 size={12} /> Coverage</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12] mb-4">
              Built in Gujarat.<br />Headed everywhere land is bought.
            </h2>
            <p className="text-ink-soft leading-relaxed mb-6">
              We ship one state at a time and label each one honestly — live, next up,
              or on the roadmap. The report format never changes: whichever state the
              record comes from, you get the same risk-scored, English-language verdict.
            </p>
            <ul className="flex flex-col gap-3 text-sm text-ink-soft mb-7">
              {[
                "Same 0–100 title score in every state",
                "Local script handled — Gujarati, Marathi, Kannada and beyond",
                "Government-signed DigiLocker documents where states support them",
                "Certified copies anywhere via our on-ground partner network",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <Link href="/coverage" className="btn btn-outline w-fit">
              See the full coverage plan <ArrowRight size={14} />
            </Link>
          </Reveal>

          <Reveal variant="reveal-right" delay={120}>
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-surface-soft/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">State-by-state rollout</span>
                <span className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="pulse-dot" aria-hidden="true" /> 1 live · 2 next · 9 planned
                </span>
              </div>
              <div className="divide-y divide-border">
                {COVERAGE.map((s, i) => {
                  const meta = STATUS_META[s.status];
                  return (
                    <Reveal key={s.state} delay={Math.min(i * 55, 440)}>
                      <div className="state-row px-5 py-3.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1.1fr_1fr_auto] gap-x-4 gap-y-1 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink flex items-center gap-2">
                            {s.state}
                            {s.status === "live" && <span className="pulse-dot" aria-hidden="true" />}
                          </p>
                          <p className="text-[11px] font-mono text-faint truncate">{s.portal}</p>
                        </div>
                        <div className="hidden sm:block min-w-0">
                          <p className="text-xs text-ink-soft truncate">{s.record}</p>
                          {s.note && <p className="text-[11px] text-muted truncate">{s.note}</p>}
                        </div>
                        <span className={`badge border text-[10px] uppercase tracking-[0.08em] justify-self-end ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-border bg-surface-soft/40 text-[11px] text-muted flex items-center gap-1.5">
                <Zap size={11} className="text-accent" />
                DigiLocker-enabled states unlock in batches as issuer integrations go live.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Report showcase — the artefact ───────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <Reveal variant="reveal-left" className="order-2 lg:order-1">
            <ReportMock />
          </Reveal>
          <Reveal delay={120} variant="reveal-right" className="order-1 lg:order-2">
            <div className="flex flex-col gap-5 max-w-lg">
              <p className="eyebrow text-accent">The report</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12]">
                A title opinion you can actually read.
              </h2>
              <p className="text-ink-soft leading-relaxed">
                Others fetch documents. We answer the question you actually have —
                <em className="text-ink font-medium"> is this title clean?</em> Every
                search produces a structured, printable report: a 0–100 title score,
                ledger-style checks for encumbrances, tenure and prohibited categories,
                and the full mutation history drawn as a timeline.
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
              One place for land intelligence
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

      {/* ── Certified copies — the human channel ─────────────────── */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal variant="reveal-scale">
          <div className="max-w-[1200px] mx-auto card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
              <div className="p-8 sm:p-12 flex flex-col gap-4">
                <p className="eyebrow text-accent flex items-center gap-1.5"><Stamp size={12} /> Certified &amp; advocate-reviewed</p>
                <h2 className="font-serif text-3xl sm:text-[2.4rem] font-semibold text-ink leading-[1.12]">
                  When the bank asks for the certified copy, we stand in the queue.
                </h2>
                <p className="text-ink-soft leading-relaxed max-w-xl">
                  Some documents never left the registrar&apos;s office — certified 7/12
                  with index-2, and the 30-year search report your lender wants. Our
                  on-ground partners fetch them from the Sub-Registrar&apos;s office,
                  an advocate reviews them, and they land in your property locker.
                </p>
                <div className="flex flex-wrap gap-x-7 gap-y-3 pt-2">
                  {[
                    { icon: <IndianRupee size={14} />, k: "From ₹1,500", v: "transparent, per document" },
                    { icon: <Timer size={14} />, k: "2–5 working days", v: "tracked like any search" },
                    { icon: <Gavel size={14} />, k: "Advocate-reviewed", v: "ready for lenders" },
                  ].map((x) => (
                    <span key={x.k} className="flex items-center gap-2.5 text-sm">
                      <span className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">{x.icon}</span>
                      <span className="flex flex-col leading-tight">
                        <strong className="text-ink">{x.k}</strong>
                        <span className="text-xs text-muted">{x.v}</span>
                      </span>
                    </span>
                  ))}
                </div>
                <Link href="/contact" className="btn btn-primary w-fit mt-3">
                  Order a certified copy <ArrowRight size={14} />
                </Link>
              </div>
              {/* Ledger-style order ticket */}
              <div className="doc-rules bg-surface-soft/50 border-t lg:border-t-0 lg:border-l border-border p-8 sm:p-10 flex flex-col justify-center gap-4" aria-hidden="true">
                <p className="font-mono text-[10px] text-faint uppercase tracking-[0.13em]">Order ticket · SL-CC-0417</p>
                {[
                  ["Certified 7/12 + Index-2", "₹1,500"],
                  ["30-year search report", "₹4,999"],
                  ["Advocate certification", "included"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2 text-[13px]">
                    <span className="text-ink-soft whitespace-nowrap">{k}</span>
                    <span className="leader" />
                    <span className="font-mono font-semibold text-ink whitespace-nowrap tnum">{v}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-accent/50 text-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] -rotate-2">
                    <Stamp size={10} /> SRO fetched
                  </span>
                  delivered to your locker
                </div>
              </div>
            </div>
          </div>
        </Reveal>
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
                  No card needed, verdict in minutes. Already-verified parcels are
                  free to view, forever.
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
                India land-title intelligence — official records fetched, translated,
                risk-scored and monitored, for the people who sign. Live in Gujarat;
                Maharashtra and Karnataka next.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
              <div className="flex flex-col gap-2.5">
                <span className="eyebrow text-white/40">Product</span>
                <Link href="/" className="text-white/70 hover:text-white transition-colors">Title search</Link>
                <Link href="/coverage" className="text-white/70 hover:text-white transition-colors">Coverage</Link>
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
              Satya-Lekh reports are generated from official government records but are not a legal
              title opinion. For transactions, verify the index-2, a 30-year search report and pending
              litigation with a lawyer — or order the certified pack and we&apos;ll do the legwork.
            </p>
            <span className="text-xs text-white/50">
              © {new Date().getFullYear()} Satya-Lekh — land title intelligence for India.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
