"use client";

import React from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Reveal, CountUp } from "@/components/motion";
import {
  ShieldCheck, ArrowRight, CheckCircle2, Scale, Landmark, FileSearch,
  Database, Cpu, Stamp, FileBadge2, Route, RefreshCw, Bell, Vault,
  MapPin, Gavel, TrendingUp, IndianRupee, Building2, Timer, Layers,
  GitBranch, Satellite, MonitorPlay, ClipboardList, Hourglass, Banknote,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   /investors — the fundraising narrative.
   Every number on this page traces to the repo's own docs:
   PAN_INDIA_PLAYBOOK.md, PRODUCT_ROADMAP.md, AGENT_BRIEFING.md,
   LAUNCH_CHECKLIST.md. No invented traction.
   ────────────────────────────────────────────────────────────── */

/* ── Hero counters — the honest numbers that exist today ─────── */
const HERO_STATS: { n: number; suffix: string; label: string }[] = [
  { n: 1, suffix: "", label: "state live" },
  { n: 13, suffix: "", label: "states in the adapter registry" },
  { n: 4, suffix: "", label: "fulfilment channels" },
  { n: 12, suffix: "", label: "restriction layers designed" },
  { n: 33, suffix: "", label: "Gujarat districts indexed" },
  { n: 18000, suffix: "+", label: "villages indexed" },
];

/* ── Problem cards ────────────────────────────────────────────── */
const PROBLEM_CARDS = [
  {
    icon: <Scale size={20} />,
    stat: "~2/3",
    statLabel: "of civil litigation",
    body:
      "Land and property disputes are commonly estimated to account for about two-thirds of India's civil caseload. Land is the country's largest asset class — and its most litigated.",
  },
  {
    icon: <Landmark size={20} />,
    stat: "Presumptive",
    statLabel: "not guaranteed",
    body:
      "Indian land titles are presumptive: the record shows who the revenue department believes holds the land, not a state-guaranteed ownership. The burden of verification sits entirely on the buyer.",
  },
  {
    icon: <Hourglass size={20} />,
    stat: "Weeks",
    statLabel: "and lakhs in fees",
    body:
      "The standard answer is a lawyer-run 30-year search: registrar-office queues, regional-script records, opinion letters. Buyers pay lakhs and wait weeks for a verdict a machine can assemble in minutes.",
  },
];

/* ── Channels (router diagram legend) ─────────────────────────── */
const CHANNEL_LEGEND = [
  { icon: <Database size={16} />, name: "Verified cache", sla: "Instant", note: "already-checked parcels, served free" },
  { icon: <FileBadge2 size={16} />, name: "DigiLocker rails", sla: "Seconds", note: "government-signed PDFs, ~12 issuer states" },
  { icon: <Cpu size={16} />, name: "Live portal fetch", sla: "Minutes", note: "CAPTCHA solved, local script translated" },
  { icon: <Stamp size={16} />, name: "Human network", sla: "Days", note: "certified copies from the Sub-Registrar's office" },
];

/* ── What exists today — the shipped checklist ────────────────── */
const BUILT_TODAY: { icon: React.ReactNode; title: string; note: string }[] = [
  { icon: <Cpu size={16} />, title: "Working Gujarat pipeline", note: "AnyROR scraping with AI CAPTCHA solving and Gujarati → English translation, end to end" },
  { icon: <FileSearch size={16} />, title: "0–100 title score + chain of title", note: "deterministic checks for encumbrances, restricted tenure and mutation-chain gaps" },
  { icon: <Gavel size={16} />, title: "Litigation check", note: "eCourts search for cases naming the recorded owner" },
  { icon: <Bell size={16} />, title: "Watchlist + alerts", note: "parcels re-checked and diffed for mutation or encumbrance changes" },
  { icon: <Vault size={16} />, title: "Property locker", note: "deeds, 7/12s and approvals stored per user" },
  { icon: <TrendingUp size={16} />, title: "FSI + stamp-duty tools", note: "CGDCR-2017 FSI calculator and duty estimates for Gujarat zones" },
  { icon: <Satellite size={16} />, title: "Land-intel drawing tool", note: "satellite view with parcel drawing and infrastructure-proximity context" },
  { icon: <Route size={16} />, title: "Four-channel backend", note: "document-fulfilment router with a 13-state adapter registry" },
  { icon: <ClipboardList size={16} />, title: "Manual-fulfilment order flow", note: "certified-copy orders tracked like any other job, measured in days" },
  { icon: <MonitorPlay size={16} />, title: "Demo mode", note: "the full product walkable without a live government portal" },
];

/* ── Roadmap — sequencing straight from the playbook ─────────── */
const ROADMAP: { phase: string; title: string; body: string }[] = [
  {
    phase: "Step 1",
    title: "Mumbai-IP deployment",
    body:
      "NIC-hosted portals throttle foreign data-center traffic. One Indian-infrastructure deployment unlocks both the Gujarat scraper and eCourts litigation search in production — the single gating dependency, and the first use of funds.",
  },
  {
    phase: "Step 2",
    title: "Maharashtra — MahaBhulekh",
    body:
      "India's biggest land market, next door to Gujarat. Same adapter pattern, Marathi → English is the same muscle as Gujarati. The launch moment: two-state title checks in English.",
  },
  {
    phase: "Step 3",
    title: "DigiLocker requester status",
    body:
      "One official integration yields government-signed land records across roughly a dozen issuer states — no CAPTCHA, no IP games. Pure paperwork now, a coverage step-change when approved.",
  },
  {
    phase: "Step 4",
    title: "Karnataka + Ahmedabad fulfilment partner",
    body:
      "Bhoomi RTC adapter for Bangalore demand, in parallel with our first on-ground partner for certified copies and 30-year search reports — the channel that justifies bank-grade pricing.",
  },
  {
    phase: "Step 5",
    title: "A state per fortnight",
    body:
      "The adapter interface makes each new state a file, not a fork: Tamil Nadu → Uttar Pradesh → Rajasthan → Punjab & Haryana, prioritised by transaction volume. The incumbent's home states come last — we fight where they are weakest.",
  },
];

/* ── Business model ladder ────────────────────────────────────── */
const PRICING_LADDER: {
  icon: React.ReactNode;
  tier: string;
  price: string;
  note: string;
  accent?: boolean;
}[] = [
  { icon: <ShieldCheck size={16} />, tier: "Free trials", price: "2 searches", note: "See the verdict before paying — the conversion funnel starts at zero." },
  { icon: <IndianRupee size={16} />, tier: "Per-search", price: "from ₹299", note: "Impulse-purchasable single verdicts for individual buyers." },
  { icon: <Layers size={16} />, tier: "Title Pack", price: "5-search bundle", note: "Bundled searches today; per-state document packs as states come online." },
  { icon: <Stamp size={16} />, tier: "Certified & manual", price: "₹1,500–4,999", note: "SRO-fetched certified copies and 30-year search reports, advocate-reviewed.", accent: true },
  { icon: <Building2 size={16} />, tier: "Bank & enterprise", price: "Custom", note: "Bulk collateral verification and API access — the boring, lucrative tier.", accent: true },
];

/* ── Compact report mock — the artefact in 30 seconds ─────────── */
function MiniReportMock() {
  return (
    <div className="relative mx-auto w-full max-w-[360px]" aria-hidden="true">
      <div className="absolute inset-0 translate-x-3 translate-y-4 -rotate-2 rounded-2xl bg-surface border border-border shadow-sm" />
      <div className="relative rounded-2xl bg-surface border border-border shadow-xl overflow-hidden rotate-[0.4deg]">
        {/* Header band */}
        <div className="px-5 pt-4 pb-3.5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-brand text-[9px]">Title Intelligence Report</p>
            <p className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
              Survey No. <span className="font-mono font-bold tnum">128&thinsp;P</span>
            </p>
            <p className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
              <MapPin size={9} className="text-brand" /> Navrangpura, City, Ahmedabad
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-bold tnum text-success leading-none block">92</span>
            <span className="text-[8px] uppercase tracking-[0.13em] text-muted">Title score</span>
          </div>
        </div>

        {/* Verdict row */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-border bg-surface-soft/40">
          <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-success/70 text-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] -rotate-2">
            <CheckCircle2 size={10} /> Clear
          </span>
          <span className="text-[9px] text-faint font-mono">7/12 · AnyROR · English</span>
        </div>

        {/* Ledger rows */}
        <div className="px-5 py-3.5 flex flex-col gap-2 text-[11px]">
          {[
            ["Encumbrances (boja)", "None"],
            ["Tenure — Juni Sharat", "Transferable"],
            ["Mutation chain", "Complete · 5 entries"],
            ["Litigation (eCourts)", "No matches"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <CheckCircle2 size={11} className="text-success shrink-0 translate-y-0.5" />
              <span className="text-ink-soft whitespace-nowrap">{k}</span>
              <span className="leader" />
              <span className="font-medium text-ink whitespace-nowrap">{v}</span>
            </div>
          ))}
        </div>

        {/* Chain of title */}
        <div className="px-5 pb-4">
          <p className="eyebrow text-[8px] mb-1.5">Chain of title</p>
          <div className="flex items-center gap-0">
            {["1987", "2004", "2019"].map((yr, i) => (
              <React.Fragment key={yr}>
                {i > 0 && <span className="h-px flex-1 bg-border-strong" />}
                <span className="flex flex-col items-center gap-1">
                  <span className="w-2 h-2 rounded-full border-2 border-brand bg-brand-soft" />
                  <span className="font-mono text-[8px] text-muted tnum">{yr}</span>
                </span>
              </React.Fragment>
            ))}
            <span className="h-px flex-1 bg-border-strong" />
            <span className="flex flex-col items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/15" />
              <span className="font-mono text-[8px] font-semibold text-brand tnum">Today</span>
            </span>
          </div>
        </div>

        {/* Gold seal */}
        <div className="absolute bottom-10 right-4 w-12 h-12 rounded-full border-2 border-accent/50 flex items-center justify-center rotate-12 opacity-80">
          <ShieldCheck size={16} className="text-accent/70" />
        </div>
      </div>

      <div
        className="sl-anim absolute -right-2 sm:-right-5 -bottom-3 card px-2.5 py-1.5 shadow-lg text-[10px] flex items-center gap-1.5 rotate-1"
        style={{ animation: "sl-float 6s ease-in-out 0.6s infinite" }}
      >
        <ShieldCheck size={11} className="text-success" />
        <span className="text-ink-soft">Verdict, <span className="font-semibold text-ink">not just documents</span></span>
      </div>
    </div>
  );
}

/* ── Router diagram — one search, four channels, drawn in ─────── */
function RouterDiagram() {
  const rows = [
    { y: 48, label: "Verified cache", sla: "instant", stroke: "var(--color-brand)" },
    { y: 128, label: "DigiLocker rails", sla: "seconds", stroke: "var(--color-brand)" },
    { y: 208, label: "Live portal fetch", sla: "minutes", stroke: "var(--color-brand)" },
    { y: 288, label: "Human network", sla: "days", stroke: "var(--color-accent)" },
  ];
  return (
    <svg viewBox="0 0 920 336" className="w-full h-auto" role="img" aria-label="Document-fulfilment router: one search routed across four channels by speed">
      {/* Search node */}
      <g>
        <rect x="16" y="140" width="172" height="56" rx="12" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
        <text x="102" y="164" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-ink)">One title search</text>
        <text x="102" y="182" textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--color-muted)">state · village · survey no</text>
      </g>

      {/* Router node */}
      <g>
        <rect x="336" y="132" width="188" height="72" rx="12" fill="var(--color-brand-soft)" stroke="var(--color-brand)" strokeWidth="1.5" />
        <text x="430" y="162" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-brand)">Fulfilment router</text>
        <text x="430" y="182" textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--color-muted)">state × document type</text>
      </g>

      {/* Search → router */}
      <path
        className="draw-line"
        style={{ "--draw-len": 160, "--draw-delay": "0.1s" } as React.CSSProperties}
        d="M188 168 C 262 168, 262 168, 336 168"
        fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="160"
      />

      {/* Router → channels */}
      {rows.map((r, i) => (
        <path
          key={r.label}
          className="draw-line"
          style={{ "--draw-len": 340, "--draw-delay": `${0.45 + i * 0.18}s` } as React.CSSProperties}
          d={`M524 168 C 600 168, 600 ${r.y}, 676 ${r.y}`}
          fill="none" stroke={r.stroke} strokeWidth="1.8" strokeDasharray="340" opacity="0.8"
        />
      ))}

      {/* Channel nodes */}
      {rows.map((r) => (
        <g key={r.label}>
          <rect x="676" y={r.y - 26} width="228" height="52" rx="10" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
          <text x="692" y={r.y - 3} fontSize="12.5" fontWeight="600" fill="var(--color-ink)">{r.label}</text>
          <text x="692" y={r.y + 15} fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--color-accent)">{r.sla}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Flywheel — the corpus loop, drawn as arcs ────────────────── */
function FlywheelDiagram() {
  const arcs = [
    "M 360 110 A 150 150 0 0 1 510 260",
    "M 510 260 A 150 150 0 0 1 360 410",
    "M 360 410 A 150 150 0 0 1 210 260",
    "M 210 260 A 150 150 0 0 1 360 110",
  ];
  const nodes = [
    { cx: 360, cy: 110 },
    { cx: 510, cy: 260 },
    { cx: 360, cy: 410 },
    { cx: 210, cy: 260 },
  ];
  return (
    <svg viewBox="0 0 720 520" className="w-full h-auto" role="img" aria-label="Corpus flywheel: every fetch feeds the corpus, repeats become instant, watchlists diff the changes">
      {/* Arcs draw in sequence around the loop */}
      {arcs.map((d, i) => (
        <path
          key={d}
          className="draw-line"
          style={{ "--draw-len": 240, "--draw-delay": `${0.15 + i * 0.3}s` } as React.CSSProperties}
          d={d}
          fill="none"
          stroke={i % 2 === 0 ? "var(--color-brand)" : "var(--color-accent)"}
          strokeWidth="2"
          strokeDasharray="240"
          opacity="0.75"
        />
      ))}

      {/* Nodes */}
      {nodes.map((n) => (
        <g key={`${n.cx}-${n.cy}`}>
          <circle cx={n.cx} cy={n.cy} r="9" fill="var(--color-brand-soft)" stroke="var(--color-brand)" strokeWidth="2" />
        </g>
      ))}

      {/* Labels */}
      <g fontSize="14" fontWeight="600" fill="var(--color-ink)">
        <text x="360" y="72" textAnchor="middle">Every fetch, any channel</text>
        <text x="538" y="252" textAnchor="start">Lands in the corpus</text>
        <text x="360" y="452" textAnchor="middle">Repeats: instant &amp; free</text>
        <text x="182" y="252" textAnchor="end">Watchlists diff changes</text>
      </g>
      <g fontSize="10.5" fill="var(--color-muted)" fontFamily="ui-monospace, monospace">
        <text x="360" y="90" textAnchor="middle">cache · DigiLocker · portal · human</text>
        <text x="538" y="270" textAnchor="start">parsed · risk-scored · stored</text>
        <text x="360" y="470" textAnchor="middle">marginal cost → 0</text>
        <text x="182" y="270" textAnchor="end">mutation &amp; encumbrance alerts</text>
      </g>

      {/* Center */}
      <g>
        <circle cx="360" cy="260" r="72" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
        <text x="360" y="252" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-brand)">The verified</text>
        <text x="360" y="270" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-brand)">corpus</text>
        <text x="360" y="290" textAnchor="middle" fontSize="9.5" fill="var(--color-muted)" fontFamily="ui-monospace, monospace">compounds per search</text>
      </g>
    </svg>
  );
}

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <TopNav />

      {/* ── 1 · Hero — the thesis ──────────────────────────────── */}
      <section className="section-dark pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="relative z-10 max-w-[1100px] mx-auto flex flex-col gap-8">
          <span
            className="sl-anim inline-flex items-center gap-2.5 w-fit rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/85"
            style={{ animation: "sl-fade-up 0.6s cubic-bezier(0.22,0.61,0.36,1) both" }}
          >
            <span className="pulse-dot" aria-hidden="true" /> Investor brief · Gujarat live · raising our first round
          </span>

          <h1
            className="sl-anim font-serif text-[2.8rem] sm:text-6xl lg:text-[4.2rem] font-semibold text-white leading-[1.04] tracking-tight max-w-4xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.08s both" }}
          >
            The trust layer for{" "}
            <em className="text-sheen not-italic sm:italic font-medium">Indian land.</em>
          </h1>

          <p
            className="sl-anim text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.16s both" }}
          >
            India&apos;s land records are fragmented across 30+ state portals, a dozen
            scripts and thousands of registrar offices. Satya-Lekh turns them into a
            single, English-language, risk-scored verdict: <span className="text-white font-medium">is this title clean?</span>
          </p>

          <div
            className="sl-anim flex flex-wrap gap-3"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.24s both" }}
          >
            <Link href="/contact" className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-6 py-3 font-semibold">
              Request the data room <ArrowRight size={15} />
            </Link>
            <Link href="/demo" className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3">
              Walk the product in demo mode
            </Link>
          </div>

          {/* Honest counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-6 border-t border-white/10 pt-8">
            {HERO_STATS.map((s) => (
              <span key={s.label} className="flex flex-col">
                <strong className="font-mono tnum text-3xl font-bold text-white leading-none">
                  <CountUp target={s.n} suffix={s.suffix} />
                </strong>
                <span className="text-[11px] text-white/50 mt-1.5 uppercase tracking-[0.08em] leading-snug">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2 · The problem ────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Scale size={12} /> The problem</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              India&apos;s largest asset class runs on records nobody can read.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              Every land transaction in India rests on a stack of revenue records,
              mutation entries and registrar documents — kept in regional scripts,
              behind CAPTCHAs and office queues, with no guarantee attached. The
              cost of not reading them properly is measured in decades of litigation.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROBLEM_CARDS.map((c, i) => (
              <Reveal key={c.stat} delay={i * 120} variant="reveal-scale">
                <div className="card p-7 flex flex-col gap-4 h-full">
                  <span className="w-11 h-11 rounded-xl bg-danger-soft text-danger border border-danger-border/60 flex items-center justify-center">
                    {c.icon}
                  </span>
                  <div>
                    <p className="font-mono tnum text-3xl font-bold text-ink leading-none">{c.stat}</p>
                    <p className="eyebrow mt-1.5">{c.statLabel}</p>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 · The product in 30 seconds ──────────────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <Reveal variant="reveal-left">
            <div className="flex flex-col gap-5 max-w-lg">
              <p className="eyebrow text-accent">The product in 30 seconds</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12]">
                One artefact: the title verdict.
              </h2>
              <p className="text-ink-soft leading-relaxed">
                A buyer pastes a survey number. We fetch the official record, solve
                the CAPTCHA, translate the script, and return a structured report:
                a 0–100 title score, ledger-style checks for encumbrances, tenure
                and mutation-chain gaps, a litigation lookup, and the full chain of
                title drawn as a timeline. Printable, shareable, in English.
              </p>
              <p className="text-ink-soft leading-relaxed">
                This is the artefact that gets forwarded on WhatsApp before a token
                changes hands — and the unit everything else on this page compounds around.
              </p>
              <Link href="/demo" className="btn btn-outline w-fit mt-1">
                See a live sample <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={140} variant="reveal-right">
            <MiniReportMock />
          </Reveal>
        </div>
      </section>

      {/* ── 4 · The architecture moat ──────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Route size={12} /> The architecture moat</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-3xl">
              There is no magic API into every state. There is a router.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-3xl mb-10">
              Pan-India coverage is not one technology — it is four fulfilment
              channels stacked behind one search box, each honest about its speed.
              Every search becomes a document request routed by state and document
              type: cache when we have it, DigiLocker where the state issues it,
              portal fetch where we scrape it, and a human at the Sub-Registrar&apos;s
              office when only paper will do.
            </p>
          </Reveal>

          <Reveal variant="reveal-scale">
            <div className="card p-6 sm:p-10">
              <RouterDiagram />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
                {CHANNEL_LEGEND.map((c) => (
                  <div key={c.name} className="flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">{c.icon}</span>
                    <span className="flex flex-col leading-tight min-w-0">
                      <span className="text-sm font-semibold text-ink">{c.name}</span>
                      <span className="text-[11px] font-mono text-accent flex items-center gap-1"><Timer size={9} /> {c.sla}</span>
                      <span className="text-xs text-muted mt-0.5">{c.note}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
            <Reveal delay={80}>
              <div className="card p-7 h-full flex flex-col gap-3">
                <p className="eyebrow flex items-center gap-1.5"><Banknote size={12} /> The model is proven at scale</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  A YC-backed competitor has raised roughly <span className="font-mono tnum font-semibold text-ink">$16.3M</span> across
                  five rounds on exactly this four-channel architecture — scrapers,
                  official digital rails, a human fulfilment network and a growing
                  document corpus — with freemium, per-document and enterprise
                  pricing on top. The market has already validated the machine.
                  We are building the same machine, one state deep at a time.
                </p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="card p-7 h-full flex flex-col gap-3 border-accent-border">
                <p className="eyebrow text-accent flex items-center gap-1.5"><GitBranch size={12} /> Our wedge: depth over breadth</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  They fetch documents. We answer the question underneath —{" "}
                  <em className="text-ink font-medium">is this title clean?</em> The
                  risk-scored verdict, chain of title and litigation check are the
                  layer a document fetcher has to rebuild from scratch to follow us.
                  We won&apos;t chase 120 document types; we&apos;ll own the verdict.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 5 · The corpus flywheel ────────────────────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
          <Reveal variant="reveal-left">
            <p className="eyebrow mb-2 flex items-center gap-1.5"><RefreshCw size={12} /> The corpus flywheel</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12] mb-4">
              Every search makes the next one cheaper.
            </h2>
            <p className="text-ink-soft leading-relaxed mb-5">
              Every record fetched through any channel — cache, DigiLocker, portal
              or human — is parsed, risk-scored and preserved. Repeat lookups are
              served instantly and free, at zero marginal cost. The same corpus
              powers watchlist diffing: we re-check parcels and alert owners on any
              mutation or encumbrance change.
            </p>
            <p className="text-ink-soft leading-relaxed mb-6">
              At scale this becomes the defensible asset: the cleanest
              English-language, risk-scored index of Indian land records —
              an asset that compounds with usage and cannot be shortcut by capital alone.
            </p>
            <ul className="flex flex-col gap-3 text-sm text-ink-soft">
              {[
                "Already-verified parcels are free to view — a built-in acquisition loop",
                "Watchlist re-checks turn one-off searches into recurring relationships",
                "Every new state adapter feeds the same corpus and the same score",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal variant="reveal-right" delay={140}>
            <div className="card p-4 sm:p-8">
              <FlywheelDiagram />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6 · What's built today ─────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><CheckCircle2 size={12} /> Shipped, not slideware</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              What exists today
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              We label everything honestly — live, next, or planned. This list is
              the first category: working software you can click through right now,
              built before raising a rupee.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {BUILT_TODAY.map((item, i) => (
              <Reveal key={item.title} delay={Math.min(i * 70, 630)}>
                <div className="flex items-start gap-3.5 py-3.5 border-b border-border">
                  <span className="w-8 h-8 rounded-lg bg-success-soft text-success border border-success-border/60 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink flex items-center gap-2">
                      {item.title}
                      <CheckCircle2 size={13} className="text-success shrink-0" />
                    </p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="text-xs text-muted mt-6 flex items-center gap-1.5">
              <Landmark size={12} className="text-brand" />
              Coverage today: all 33 Gujarat districts, 250+ talukas, 18,000+ villages indexed from AnyROR.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 7 · Roadmap ────────────────────────────────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Route size={12} /> The rollout</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4">
              One state at a time, then one a fortnight.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-14">
              Each step below is independently shippable and already sequenced.
              The architecture is built; the round funds the execution of this list.
            </p>
          </Reveal>

          <div className="relative">
            {/* Timeline rail */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-brand via-border-strong to-accent" aria-hidden="true" />
            <div className="flex flex-col gap-10">
              {ROADMAP.map((m, i) => (
                <Reveal key={m.title} delay={i * 110} variant="reveal-left">
                  <div className="relative pl-14">
                    <span className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-brand text-white font-mono text-sm font-bold flex items-center justify-center shadow-md ring-4 ring-surface tnum">
                      {i + 1}
                    </span>
                    <p className="eyebrow text-brand mb-1">{m.phase}</p>
                    <h3 className="text-lg font-semibold text-ink mb-1.5">{m.title}</h3>
                    <p className="text-sm text-muted leading-relaxed max-w-xl">{m.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 · Business model ─────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><IndianRupee size={12} /> Business model</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              A ladder from free trial to bank contract.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-12">
              The pricing shape is the proven one in this category: free first
              searches to show the verdict, impulse-priced singles, bundles, and a
              high-margin certified tier that earns the enterprise conversation.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
            {PRICING_LADDER.map((p, i) => (
              <Reveal key={p.tier} delay={i * 100} variant="reveal-scale">
                <div className={`card card-lift p-5 flex flex-col gap-2.5 ${p.accent ? "border-accent-border" : ""}`}>
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.accent ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand"}`}>
                    {p.icon}
                  </span>
                  <p className="eyebrow text-[10px]">{`Rung ${i + 1}`}</p>
                  <h3 className="text-sm font-semibold text-ink leading-tight">{p.tier}</h3>
                  <p className="font-mono tnum text-lg font-bold text-ink leading-none">{p.price}</p>
                  <p className="text-xs text-muted leading-relaxed">{p.note}</p>
                  {/* Ladder bar — height rises with the tier */}
                  <span
                    className={`mt-2 w-full rounded-sm ${p.accent ? "bg-accent/70" : "bg-brand/60"}`}
                    style={{ height: `${8 + i * 9}px` }}
                    aria-hidden="true"
                  />
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={160}>
            <p className="text-xs text-muted mt-6">
              Live today: free trial searches and per-search checkout. Certified SKUs
              run through the manual-fulfilment order flow; enterprise verification is
              the deliberate end-state, not the starting point.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 9 · The ask ────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="section-dark max-w-[1200px] mx-auto rounded-3xl px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow text-accent-bright mb-3">The ask</p>
                <h2 className="font-serif text-3xl sm:text-[2.6rem] font-semibold text-white leading-[1.1] mb-4">
                  Raising our first round.
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  The product works in one state. The architecture is built for
                  thirteen. The round funds Indian infrastructure, the next two
                  state adapters, DigiLocker requester status and the first
                  fulfilment partner — every line item already sequenced above.
                  Ask us for the data room and walk the working product yourself.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href="/contact"
                  className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold"
                >
                  Request the data room <ArrowRight size={15} />
                </Link>
                <Link
                  href="/demo"
                  className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-7 py-3 whitespace-nowrap"
                >
                  Try the product first
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
        <p className="max-w-[1200px] mx-auto text-[11px] text-faint mt-6 leading-relaxed">
          Figures on this page describe shipped software and designed architecture, not
          audited traction. Market framing (share of civil litigation, presumptive title)
          reflects commonly cited estimates for the Indian land-records market.
        </p>
      </section>
    </main>
  );
}
