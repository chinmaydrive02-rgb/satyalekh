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
  Target, Globe2, Ruler, Swords, Rocket,
} from "lucide-react";
import {
  HERO_STATS, PROBLEM_CARDS, CHANNEL_LEGEND, RESTRICTION_LAYERS,
  MARKET_BANDS, ROADMAP, PRICING_LADDER, UNIT_ECONOMICS, COMPETITION,
} from "@/lib/investorData";

/* ──────────────────────────────────────────────────────────────
   /investors — the fundraising narrative, as scrollytelling.
   Every number on this page traces to the repo's own docs
   (PAN_INDIA_PLAYBOOK / PRODUCT_ROADMAP / AGENT_BRIEFING /
   LAUNCH_CHECKLIST) or to commonly-cited public estimates that
   are clearly labelled as market framing. No invented traction:
   no user counts, no MRR, no signed customers.
   ────────────────────────────────────────────────────────────── */

/* Icons kept local to the page (JSX can't live in the .ts data file). */
const CHANNEL_ICONS = [
  <Database key="db" size={16} />,
  <FileBadge2 key="fb" size={16} />,
  <Cpu key="cpu" size={16} />,
  <Stamp key="st" size={16} />,
];
const PROBLEM_ICONS = [<Scale key="s" size={20} />, <Landmark key="l" size={20} />, <Hourglass key="h" size={20} />];
const PRICING_ICONS = [
  <ShieldCheck key="p0" size={16} />,
  <IndianRupee key="p1" size={16} />,
  <Layers key="p2" size={16} />,
  <Stamp key="p3" size={16} />,
  <Building2 key="p4" size={16} />,
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

/* ── Market framing — a concentric TAM → SAM → SOM visual ─────── */
function MarketVisual() {
  const cx = 200;
  const cy = 200;
  return (
    <svg viewBox="0 0 400 400" className="w-full h-auto" role="img"
      aria-label="Concentric market framing: India real-estate transactions, narrowing to annual title and diligence spend, narrowing to a digital-first serviceable slice">
      {MARKET_BANDS.map((b, i) => (
        <g key={b.key}>
          <circle
            cx={cx} cy={cy} r={b.r}
            fill={b.fill} fillOpacity={i === 0 ? 0.35 : i === 1 ? 0.55 : 0.7}
            className="draw-line"
            style={{
              "--draw-len": Math.round(2 * Math.PI * b.r),
              "--draw-delay": `${0.2 + i * 0.35}s`,
            } as React.CSSProperties}
            stroke={b.stroke}
            strokeWidth={1.6}
            strokeDasharray={Math.round(2 * Math.PI * b.r)}
          />
        </g>
      ))}
      {/* Band labels stacked at the top of each ring */}
      {MARKET_BANDS.map((b, i) => (
        <g key={`${b.key}-label`} className="sl-anim"
          style={{ animation: `sl-fade-up 0.55s cubic-bezier(0.22,0.61,0.36,1) ${0.5 + i * 0.35}s both` }}>
          <text x={cx} y={cy - b.r + (i === 2 ? 28 : 22)} textAnchor="middle"
            fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700"
            fill={b.stroke} letterSpacing="0.12em">
            {b.key}
          </text>
          <text x={cx} y={cy - b.r + (i === 2 ? 44 : 38)} textAnchor="middle"
            fontSize="9.5" fill="var(--color-ink-soft)">
            {b.ring}
          </text>
        </g>
      ))}
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
            <Link href="/contact" className="btn btn-arrow bg-white text-pine hover:bg-brand-soft border border-white/10 px-6 py-3 font-semibold">
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
                    {PROBLEM_ICONS[i]}
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
              <Link href="/demo" className="btn btn-outline btn-arrow w-fit mt-1">
                See a live sample <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={140} variant="reveal-right">
            <MiniReportMock />
          </Reveal>
        </div>
      </section>

      {/* ── 4 · The architecture moat — router ─────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Route size={12} /> Why we win · the moat</p>
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
                {CHANNEL_LEGEND.map((c, i) => (
                  <div key={c.name} className="flex items-start gap-2.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.accent ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand"}`}>{CHANNEL_ICONS[i]}</span>
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
                  <em className="text-ink font-medium">is this title clean, and is this buildable?</em> The
                  risk-scored verdict, chain of title, litigation check and restriction
                  engine are the layer a document fetcher has to rebuild from scratch to
                  follow us. We won&apos;t chase 120 document types; we&apos;ll own the verdict.
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

      {/* ── 6 · The restriction engine — the real wedge ────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Ruler size={12} /> The wedge · restriction engine</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-3xl">
              Others fetch documents. We answer <em className="text-brand not-italic">is this buildable</em>.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-3xl mb-10">
              A clean title is only half the question a buyer actually has. The other
              half is whether the land can be used — and that is buried across twelve
              overlapping restriction regimes: tenure, zoning, coastal and forest
              buffers, road and TP-scheme reservations, acquisition notices, wakf and
              trust flags. Our development-restriction engine scores all twelve on top
              of the record. A document fetcher has to build this layer from scratch to
              follow us.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {RESTRICTION_LAYERS.map((layer, i) => (
              <Reveal key={layer} delay={Math.min(i * 55, 600)} variant="reveal-scale">
                <div className="card p-4 flex items-center gap-3 h-full">
                  <span className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0 font-mono tnum text-[11px] font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-medium text-ink leading-tight">{layer}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="card bg-surface-soft/50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Layers size={18} />
              </span>
              <p className="text-sm text-ink-soft leading-relaxed flex-1">
                <strong className="text-ink">Twelve layers, one verdict.</strong>{" "}
                The engine is the deepest part of the moat — the analysis a buyer
                would otherwise pay a lawyer and a town-planner for, separately.
                See how each layer is scored.
              </p>
              <Link href="/risk-intel" className="btn btn-outline btn-arrow whitespace-nowrap shrink-0">
                Explore the restriction engine <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 7 · Market framing — TAM → SAM → SOM ───────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <Reveal variant="reveal-left">
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Target size={12} /> Market sizing · framing</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12] mb-4 max-w-xl">
              A market defined by its largest asset — and its most litigated.
            </h2>
            <p className="text-ink-soft leading-relaxed mb-6 max-w-xl">
              This is market <em className="text-ink font-medium">framing</em>, not company
              traction, and it is expressed as directional ranges rather than false
              precision. India&apos;s real-estate transaction volume defines the outer
              band; the annual title and diligence spend already flowing through
              lawyers, brokers and banks is the addressable middle; the digital-first
              slice that starts with one live state is where we begin.
            </p>

            {/* Band legend */}
            <div className="flex flex-col gap-4 mb-6">
              {MARKET_BANDS.map((b) => (
                <div key={b.key} className="flex items-start gap-3">
                  <span className="mt-1 w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: b.stroke === "var(--color-accent)" ? "var(--color-accent)" : "var(--color-brand)" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-muted mr-2">{b.key}</span>
                      {b.ring}
                    </p>
                    <p className="text-xs text-muted leading-relaxed">{b.cite}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Anchor facts — commonly-cited, non-fabricated */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6">
              <span className="flex flex-col">
                <strong className="font-mono tnum text-3xl font-bold text-ink leading-none">
                  ~<CountUp target={66} suffix="%" />
                </strong>
                <span className="text-[11px] text-muted mt-1.5 uppercase tracking-[0.08em] leading-snug max-w-[9rem]">
                  commonly-cited share of civil cases tied to land
                </span>
              </span>
              <span className="flex flex-col">
                <strong className="font-mono tnum text-3xl font-bold text-ink leading-none">
                  $<CountUp target={16} suffix=".3M" />
                </strong>
                <span className="text-[11px] text-muted mt-1.5 uppercase tracking-[0.08em] leading-snug max-w-[9rem]">
                  raised by a YC-backed competitor on this model
                </span>
              </span>
            </div>
          </Reveal>

          <Reveal variant="reveal-scale" delay={120}>
            <div className="card p-6 sm:p-8">
              <MarketVisual />
              <div className="mt-6 pt-5 border-t border-border">
                {/* Traction we can show — only what's real */}
                <p className="eyebrow flex items-center gap-1.5 mb-4"><CheckCircle2 size={12} className="text-success" /> What we can honestly claim</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {[
                    { n: 1, suffix: "", label: "state pipeline live (Gujarat)" },
                    { n: 13, suffix: "", label: "state architecture shipped" },
                    { n: 4, suffix: "", label: "fulfilment channels" },
                    { n: 12, suffix: "", label: "restriction layers designed" },
                  ].map((s) => (
                    <span key={s.label} className="flex flex-col">
                      <strong className="font-mono tnum text-2xl font-bold text-ink leading-none">
                        <CountUp target={s.n} suffix={s.suffix} />
                      </strong>
                      <span className="text-[11px] text-muted mt-1.5 uppercase tracking-[0.08em] leading-snug">{s.label}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-faint leading-relaxed mt-5 flex items-start gap-1.5">
                  <Globe2 size={12} className="text-brand shrink-0 mt-0.5" />
                  Concentric bands are directional market framing, not measured company
                  traction. The four figures above are shipped software and designed
                  architecture — no revenue, user or customer numbers are claimed.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 8 · Business model & unit economics ────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><IndianRupee size={12} /> Business model &amp; unit economics</p>
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
                    {PRICING_ICONS[i]}
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

          {/* Illustrative unit-economics strip */}
          <Reveal delay={120}>
            <div className="card p-6 sm:p-8 mt-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <p className="eyebrow flex items-center gap-1.5"><TrendingUp size={12} /> Unit-economics intuition</p>
                <span className="badge border text-[10px] uppercase tracking-[0.1em] text-accent bg-accent-soft border-accent-border">
                  Illustrative — not measured margins
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {UNIT_ECONOMICS.map((u) => (
                  <div key={u.label} className={`rounded-xl border p-5 flex flex-col gap-3 ${u.accent ? "border-accent-border bg-accent-soft/25" : "border-border bg-surface-soft/40"}`}>
                    <p className="text-sm font-semibold text-ink">{u.label}</p>
                    <div className="flex items-end justify-between gap-4">
                      <span className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.1em] text-muted">Price</span>
                        <span className="font-mono tnum text-2xl font-bold text-ink leading-none mt-1">{u.price}</span>
                      </span>
                      <span className="flex flex-col text-right">
                        <span className="text-[10px] uppercase tracking-[0.1em] text-muted">Cost driver</span>
                        <span className="text-[13px] font-medium text-ink-soft mt-1">{u.cost}</span>
                      </span>
                    </div>
                    {/* margin intuition bar: price above cost, illustrative only */}
                    <div className="mt-1">
                      <div className="h-2 rounded-full bg-border-strong/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.accent ? "bg-accent/75" : "bg-brand/70"}`}
                          style={{ width: u.accent ? "58%" : "82%" }}
                        />
                      </div>
                      <p className="text-[10px] text-faint mt-1.5 font-mono">illustrative gross-margin band ↑</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{u.intuition}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-faint leading-relaxed mt-5 flex items-start gap-1.5">
                <IndianRupee size={12} className="text-brand shrink-0 mt-0.5" />
                These bars illustrate cost structure and margin shape only — they are not
                measured unit economics. Instant digital searches carry near-zero marginal
                cost once cached; the certified tier prices the on-ground fulfilment cost
                with margin. No revenue or realised-margin figures are claimed.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-xs text-muted mt-6">
              Live today: free trial searches and per-search checkout. Certified SKUs
              run through the manual-fulfilment order flow; enterprise verification is
              the deliberate end-state, not the starting point.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 9 · Go-to-market & roadmap ─────────────────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Rocket size={12} /> Go-to-market &amp; roadmap</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4">
              Ahmedabad-first, then one state at a time.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-14">
              We start where transaction velocity and NRI demand are highest, go deep
              in Gujarat, then use the adapter pattern to add states — each step
              independently shippable and already sequenced. The round funds the
              execution of this list.
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

      {/* ── 10 · Competition ───────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Swords size={12} /> Competition</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              Honest positioning against a funded incumbent.
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-10">
              A YC-backed incumbent has raised roughly{" "}
              <span className="font-mono tnum font-semibold text-ink">$16.3M</span> and covers
              breadth — many states, 120+ document types. We are not trying to out-breadth
              them. We compete on depth: a verdict rather than a document, and a restriction
              engine no document fetcher can shortcut.
            </p>
          </Reveal>

          <Reveal variant="reveal-scale">
            <div className="card overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1.1fr_1.2fr_1.4fr] gap-x-4 px-5 sm:px-7 py-4 border-b border-border bg-surface-soft/50 text-[11px] uppercase tracking-[0.1em] font-semibold text-muted">
                <span>Dimension</span>
                <span className="flex items-center gap-1.5"><Building2 size={12} /> Funded incumbent</span>
                <span className="flex items-center gap-1.5 text-brand"><ShieldCheck size={12} /> Satya-Lekh</span>
              </div>
              {COMPETITION.map((row, i) => (
                <Reveal key={row.dimension} delay={i * 70}>
                  <div className="grid grid-cols-[1.1fr_1.2fr_1.4fr] gap-x-4 px-5 sm:px-7 py-4 border-b border-border last:border-b-0 items-start">
                    <span className="text-sm font-semibold text-ink">{row.dimension}</span>
                    <span className="text-[13px] text-muted leading-relaxed">{row.incumbent}</span>
                    <span className="text-[13px] text-ink-soft leading-relaxed flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-brand shrink-0 mt-0.5" />
                      <span>{row.us}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-[11px] text-faint leading-relaxed mt-5">
              Funding figure for the incumbent (~$16.3M over five rounds) reflects
              commonly-reported public coverage, per our own market research
              (PAN_INDIA_PLAYBOOK). Positioning claims describe our architecture and
              intent, not head-to-head benchmark results.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 11 · What's built today ────────────────────────────── */}
      <section className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6">
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

      {/* ── 12 · Team / why-now + the ask ──────────────────────── */}
      <section className="px-4 sm:px-6 py-20">
        <Reveal>
          <div className="section-dark max-w-[1200px] mx-auto rounded-3xl px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow text-accent-bright mb-3">Why now · the ask</p>
                <h2 className="font-serif text-3xl sm:text-[2.6rem] font-semibold text-white leading-[1.1] mb-4">
                  Raising our first institutional round.
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  The product works in one state. The architecture is built for
                  thirteen. The moat — the verdict and the restriction engine — is
                  the hard part, and it is already shipped. The round funds Indian
                  infrastructure, the next state adapters, DigiLocker requester status
                  and the first fulfilment partner — every line item already sequenced
                  above. Ask us for the data room and walk the working product yourself.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href="/contact"
                  className="btn btn-arrow bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold"
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
          audited traction — no user counts, revenue or signed customers are claimed.
          Market framing (share of civil litigation, presumptive title, incumbent
          funding) reflects commonly-cited estimates for the Indian land-records market;
          unit-economics bars are illustrative of cost structure, not measured margins.
        </p>
      </section>
    </main>
  );
}
