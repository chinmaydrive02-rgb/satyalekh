"use client";

// Risk Intel — Development Restrictions & Risk Engine.
// Twelve regulatory screening layers a parcel passes through, each anchored
// to the real statute it encodes, with honest live / partial / beta / planned
// statuses and a deterministic, clearly-labelled sample screening.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Reveal, CountUp } from "@/components/motion";
import {
  RISK_LAYERS, SAMPLE_CHECKS, SAMPLE_PARCEL,
  type LayerStatus, type CheckOutcome,
} from "@/lib/riskLayers";
import {
  Landmark, Trees, PlaneTakeoff, Activity, Wheat, ShieldAlert, Flame, Zap,
  Waves, Building2, Map as MapIcon, Gavel, Scale, Layers, ShieldCheck,
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, RotateCcw, MapPin,
  Search, UserCheck, Building, Radar, FileSearch,
} from "lucide-react";

/* ── Presentation metadata ────────────────────────────────────── */

const LAYER_ICONS: Record<number, React.ReactNode> = {
  1: <Landmark size={18} />,
  2: <Trees size={18} />,
  3: <PlaneTakeoff size={18} />,
  4: <Activity size={18} />,
  5: <Wheat size={18} />,
  6: <ShieldAlert size={18} />,
  7: <Flame size={18} />,
  8: <Zap size={18} />,
  9: <Waves size={18} />,
  10: <Building2 size={18} />,
  11: <MapIcon size={18} />,
  12: <Gavel size={18} />,
};

const STATUS_META: Record<LayerStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "text-success bg-success-soft border-success-border" },
  partial: { label: "Partly live", cls: "text-brand bg-brand-soft border-brand-border" },
  beta: { label: "Beta", cls: "text-accent bg-accent-soft border-accent-border" },
  planned: { label: "Planned", cls: "text-muted bg-surface-soft border-border" },
};

const OUTCOME_META: Record<CheckOutcome, { label: string; cls: string; icon: React.ReactNode }> = {
  clear: { label: "Clear", cls: "text-success", icon: <CheckCircle2 size={15} className="text-success" /> },
  caution: { label: "Caution", cls: "text-warning", icon: <AlertTriangle size={15} className="text-warning" /> },
  restricted: { label: "Restricted", cls: "text-danger", icon: <XCircle size={15} className="text-danger" /> },
};

const STATUTE_MARQUEE = [
  "AMASR Act 1958", "Wildlife (Protection) Act 1972", "IS 1893 (Part 1) : 2016",
  "GSR 751(E) — AAI height rules", "PMP (ROU) Act 1962", "Indian Electricity Rules 1956",
  "CRZ Notification 2019", "CGDCR-2017", "Gujarat Land Revenue Code §65",
  "GTPUD Act 1976", "Forest (Conservation) Act 1980", "Benami Act 1988",
];

const AUDIENCES = [
  { icon: <UserCheck size={15} />, label: "Home & land buyers", note: "avoid unbuildable land before the token" },
  { icon: <Gavel size={15} />, label: "Lawyers & title firms", note: "restrictions annexure to the title opinion" },
  { icon: <Building size={15} />, label: "Banks & NBFCs", note: "collateral that can actually be enforced" },
  { icon: <Building2 size={15} />, label: "Developers", note: "FSI, TP yield & true buildable area" },
];

/* ── Hero visual: the layer stack a parcel drops through ─────── */

const STACK_PLANES: { label: string; sub: string; tone: string }[] = [
  { label: "Heritage & environment", sub: "beta", tone: "var(--color-accent-bright)" },
  { label: "Aviation & defence", sub: "partly live", tone: "#6ee7d8" },
  { label: "Seismic & terrain", sub: "beta", tone: "var(--color-accent-bright)" },
  { label: "Pipeline & HT corridors", sub: "planned", tone: "rgba(255,255,255,0.4)" },
  { label: "GDCR & TP planning", sub: "live", tone: "#7fd8a4" },
  { label: "Title, tenure & fraud", sub: "live", tone: "#7fd8a4" },
];

function LayerStack() {
  return (
    <svg viewBox="0 0 520 486" className="w-full h-auto" aria-hidden="true">
      {/* parcel pin at the top */}
      <g className="sl-anim" style={{ animation: "sl-pop 0.6s cubic-bezier(0.22,0.61,0.36,1) 0.2s both" }}>
        <circle cx="310" cy="22" r="7" fill="var(--color-accent-bright)" />
        <circle cx="310" cy="22" r="12" fill="none" stroke="var(--color-accent-bright)" strokeOpacity="0.35" />
        <text x="330" y="26" fontFamily="ui-monospace, monospace" fontSize="11" fill="rgba(255,255,255,0.65)">
          THE PARCEL
        </text>
      </g>

      {/* the drop-line through every layer */}
      <path
        className="draw-line"
        style={{ "--draw-len": 400, "--draw-delay": "0.35s" } as React.CSSProperties}
        d="M310 36 L310 436"
        fill="none"
        stroke="var(--color-accent-bright)"
        strokeWidth="1.5"
        strokeDasharray="400"
        opacity="0.8"
      />

      {/* six screening planes */}
      {STACK_PLANES.map((p, i) => {
        const y = 84 + i * 58;
        return (
          <g
            key={p.label}
            className="sl-anim"
            style={{ animation: `sl-fade-up 0.55s cubic-bezier(0.22,0.61,0.36,1) ${0.3 + i * 0.12}s both` }}
          >
            <path
              d={`M310 ${y - 28} L446 ${y} L310 ${y + 28} L174 ${y} Z`}
              fill="rgba(255,255,255,0.05)"
              stroke={p.tone}
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <circle cx="310" cy={y} r="4.5" fill={p.tone} />
            <text
              x="160" y={y + 4} textAnchor="end"
              fontFamily="ui-monospace, monospace" fontSize="11.5"
              fill="rgba(255,255,255,0.68)"
            >
              {p.label}
            </text>
            <text
              x="456" y={y + 3.5}
              fontFamily="ui-monospace, monospace" fontSize="9"
              fill={p.tone} letterSpacing="0.08em"
            >
              {p.sub.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* verdict chip at the bottom */}
      <g className="sl-anim" style={{ animation: "sl-pop 0.6s cubic-bezier(0.22,0.61,0.36,1) 1.25s both" }}>
        <rect x="228" y="438" width="164" height="32" rx="9"
          fill="rgba(127,216,164,0.12)" stroke="#7fd8a4" strokeOpacity="0.6" />
        <text x="310" y="458" textAnchor="middle"
          fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700"
          fill="#7fd8a4" letterSpacing="0.1em">
          ONE VERDICT
        </text>
      </g>
    </svg>
  );
}

/* ── Sample screening: 12 checks resolving one by one ────────── */

function SampleScreening() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);
  const [resolved, setResolved] = useState(0);

  // Auto-start once scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Deterministic, staggered resolution — instant under reduced motion.
  // State updates are deferred (rAF / interval callbacks) so nothing is set
  // synchronously in the effect body.
  useEffect(() => {
    if (!started) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf = requestAnimationFrame(() => setResolved(0));
    if (reduced) {
      const t = requestAnimationFrame(() => setResolved(SAMPLE_CHECKS.length));
      return () => { cancelAnimationFrame(raf); cancelAnimationFrame(t); };
    }
    const timer = setInterval(() => {
      setResolved((n) => {
        if (n >= SAMPLE_CHECKS.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, 420);
    return () => { cancelAnimationFrame(raf); clearInterval(timer); };
  }, [started, run]);

  const done = resolved >= SAMPLE_CHECKS.length;
  const counts = {
    clear: SAMPLE_CHECKS.filter((c) => c.outcome === "clear").length,
    caution: SAMPLE_CHECKS.filter((c) => c.outcome === "caution").length,
    restricted: SAMPLE_CHECKS.filter((c) => c.outcome === "restricted").length,
  };

  return (
    <div ref={containerRef} className="card overflow-hidden">
      {/* Panel header */}
      <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface-soft/50 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink flex items-center gap-2">
            <Radar size={14} className="text-brand" /> {SAMPLE_PARCEL.label}
          </p>
          <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-brand" /> {SAMPLE_PARCEL.location}
            <span className="font-mono text-faint ml-1">· Ref {SAMPLE_PARCEL.ref}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge border text-[10px] uppercase tracking-[0.1em] text-accent bg-accent-soft border-accent-border">
            Illustrative sample
          </span>
          <button
            onClick={() => setRun((r) => r + 1)}
            className="btn btn-ghost px-2.5 py-1.5 text-xs"
            aria-label="Replay sample screening"
          >
            <RotateCcw size={12} /> Replay
          </button>
        </div>
      </div>

      {/* Check rows */}
      <div className="divide-y divide-border">
        {SAMPLE_CHECKS.map((c, i) => {
          const state = i < resolved ? "resolved" : i === resolved && !done ? "active" : "pending";
          const meta = OUTCOME_META[c.outcome];
          return (
            <div key={c.layer} className={`px-5 sm:px-6 py-3 transition-opacity duration-300 ${state === "pending" ? "opacity-40" : ""}`}>
              <div className="flex items-baseline gap-2.5 text-[13px]">
                <span className="shrink-0 translate-y-0.5 w-[15px]">
                  {state === "resolved" ? (
                    <span className="sl-anim inline-flex" style={{ animation: "sl-pop 0.4s cubic-bezier(0.22,0.61,0.36,1) both" }}>
                      {meta.icon}
                    </span>
                  ) : state === "active" ? (
                    <span className="pulse-dot" aria-hidden="true" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-border-strong" aria-hidden="true" />
                  )}
                </span>
                <span className="font-mono text-[10px] text-faint tnum shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-ink whitespace-nowrap">{c.layer}</span>
                <span className="leader" />
                <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap ${state === "resolved" ? meta.cls : "text-faint"}`}>
                  {state === "resolved" ? meta.label : state === "active" ? "Screening…" : "Queued"}
                </span>
              </div>
              {state === "resolved" && (
                <p className="sl-anim text-xs text-muted leading-relaxed mt-1 pl-[52px]"
                  style={{ animation: "sl-fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) both" }}>
                  {c.finding}
                </p>
              )}
              {state === "active" && (
                <div className="mt-2 ml-[52px] h-1 rounded-full bg-surface-soft shimmer overflow-hidden" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Verdict band */}
      {done && (
        <div className="sl-anim px-5 sm:px-6 py-5 border-t border-border bg-surface-soft/50"
          style={{ animation: "sl-fade-up 0.55s cubic-bezier(0.22,0.61,0.36,1) both" }}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { n: counts.clear, label: "clear", cls: "text-success" },
              { n: counts.caution, label: "caution", cls: "text-warning" },
              { n: counts.restricted, label: "restricted", cls: "text-danger" },
            ].map((s) => (
              <span key={s.label} className="flex items-baseline gap-1.5">
                <strong className={`font-mono tnum text-2xl font-bold leading-none ${s.cls}`}>{s.n}</strong>
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{s.label}</span>
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border-2 border-warning/60 text-warning px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] -rotate-1">
              <AlertTriangle size={10} /> Buildable with conditions
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed mt-3">
            Development feasible outside the pipeline ROU strip — obtain the NOCAS height
            NOC, confirm GETCO clearance on the 220 kV line, and verify TP betterment
            charges before plan submission.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function RiskIntel() {
  return (
    <main className="min-h-screen bg-bg">
      <TopNav />

      {/* ── Hero — dark, cinematic ─────────────────────────────── */}
      <section className="section-dark pt-28 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="relative z-10 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="sl-anim flex flex-col gap-7"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) both" }}>
            <span className="inline-flex items-center gap-2.5 w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <Layers size={13} className="text-accent-bright" />
              Development Restrictions &amp; Risk Engine
            </span>
            <h1 className="font-serif text-[2.5rem] sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
              What the title{" "}
              <em className="text-sheen not-italic sm:italic font-medium">doesn&apos;t</em>{" "}
              tell you.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              A clean 7/12 says who owns the land. It says nothing about the ASI
              monument 180 metres away, the gas pipeline under the corner, the AAI
              height cap, or the TP scheme that renamed the plot. Satya-Lekh screens
              every parcel through twelve regulatory layers — and gives one verdict.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6">
              {[
                { n: 12, suffix: "", label: "restriction layers" },
                { n: 4, suffix: "", label: "live today" },
                { n: 30, suffix: "+", label: "rules encoded" },
              ].map((s) => (
                <span key={s.label} className="flex flex-col">
                  <strong className="font-mono tnum text-3xl font-bold text-white leading-none">
                    <CountUp target={s.n} suffix={s.suffix} />
                  </strong>
                  <span className="text-xs text-white/50 mt-1 uppercase tracking-[0.08em]">{s.label}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#sample-screening"
                className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-6 py-3 font-semibold whitespace-nowrap">
                See a sample screening <ArrowRight size={14} />
              </a>
              <Link href="/"
                className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 whitespace-nowrap">
                <Search size={14} /> Run a title check first
              </Link>
            </div>
          </div>

          {/* The layer stack */}
          <Reveal variant="reveal-scale" className="w-full max-w-[480px] mx-auto lg:mx-0">
            <LayerStack />
          </Reveal>
        </div>
      </section>

      {/* ── Statute marquee — the depth signal ─────────────────── */}
      <section className="border-b border-border bg-surface py-3.5 overflow-hidden" aria-label="Statutes and regulations encoded">
        <div className="marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="marquee-track" aria-hidden={dup === 1}>
              {STATUTE_MARQUEE.map((s) => (
                <span key={`${dup}-${s}`} className="flex items-center gap-2 whitespace-nowrap text-xs font-mono text-muted">
                  <Scale size={11} className="text-accent/70" /> {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── The 12 layers ──────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Layers size={12} /> The screening layers</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              Twelve layers of what the record won&apos;t volunteer
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-6">
              Each layer encodes a real statute or regulation into machine-checkable
              rules. We label every one honestly — four run live today inside the
              title score, Land Intel and the FSI calculator; the rest ship as the
              datasets land.
            </p>
            <div className="flex flex-wrap gap-2 mb-12">
              {(Object.keys(STATUS_META) as LayerStatus[]).map((s) => (
                <span key={s} className={`badge border text-[10px] uppercase tracking-[0.08em] ${STATUS_META[s].cls}`}>
                  {STATUS_META[s].label}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RISK_LAYERS.map((layer, i) => {
              const meta = STATUS_META[layer.status];
              return (
                <Reveal key={layer.id} delay={(i % 3) * 90}>
                  <div className="card channel-card p-6 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                        {LAYER_ICONS[layer.id]}
                      </span>
                      <span className={`badge border text-[10px] uppercase tracking-[0.08em] ${meta.cls}`}>
                        {layer.status === "live" && <span className="pulse-dot" aria-hidden="true" />}
                        {meta.label}
                      </span>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-faint tnum">Layer {String(layer.id).padStart(2, "0")}</p>
                      <h3 className="text-base font-semibold text-ink leading-snug">{layer.title}</h3>
                    </div>
                    <p className="font-mono text-[10.5px] text-accent leading-relaxed">{layer.citation}</p>
                    <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted leading-relaxed">
                      {layer.checks.map((c) => (
                        <li key={c} className="flex gap-2">
                          <span className="text-brand shrink-0">▸</span> {c}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-3 border-t border-border flex flex-col gap-2">
                      <p className="text-[11px] text-faint leading-relaxed italic">{layer.note}</p>
                      {layer.href && (
                        <Link href={layer.href}
                          className="text-xs font-semibold text-success inline-flex items-center gap-1 hover:text-brand transition-colors w-fit">
                          <ShieldCheck size={12} /> {layer.hrefLabel} <ArrowRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Sample screening demo ──────────────────────────────── */}
      <section id="sample-screening" className="bg-surface border-y border-border py-20 sm:py-24 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-12 lg:gap-16 items-start">
          <Reveal variant="reveal-left" className="lg:sticky lg:top-24">
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Radar size={12} /> Sample screening</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.12] mb-4">
              Twelve checks.<br />One honest verdict.
            </h2>
            <p className="text-ink-soft leading-relaxed mb-6">
              This is how a screening reads for a mock Ahmedabad parcel — a Bopal
              final plot with a gas-pipeline ROU clipping one corner. Every finding
              cites the band, buffer or clearance it was tested against, so your
              lawyer or architect can verify each line.
            </p>
            <ul className="flex flex-col gap-3 text-sm text-ink-soft mb-7">
              {[
                "Findings in metres and statute bands, not vague warnings",
                "Restricted areas quantified — build around them, or walk away",
                "Cautions map to the exact NOC to obtain and from whom",
                "Attaches to the title report as a restrictions annexure",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-brand shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <Link href="/" className="btn btn-outline w-fit">
              <FileSearch size={14} /> Start with the title check
            </Link>
            <p className="text-xs text-faint leading-relaxed mt-5 max-w-md">
              Illustrative sample on a mock parcel — the findings show report
              language, not live data for any real survey number.
            </p>
          </Reveal>

          <Reveal variant="reveal-right" delay={120}>
            <SampleScreening />
          </Reveal>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────── */}
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

      {/* ── CTA band ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20">
        <Reveal>
          <div className="section-dark max-w-[1200px] mx-auto rounded-3xl px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow text-accent-bright mb-3">Two questions, one platform</p>
                <h2 className="font-serif text-3xl sm:text-[2.5rem] font-semibold text-white leading-[1.1] mb-4">
                  The title says who owns it.<br />The layers say what you can build.
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  Start with the 0–100 title score — prohibited categories, tenure
                  and litigation are screened today. The restriction layers attach
                  as they go live, on the same parcel, in the same report.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link href="/"
                  className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold">
                  <Search size={15} /> Run a title check
                </Link>
                <Link href="/contact"
                  className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-7 py-3 whitespace-nowrap">
                  Talk to us about early access
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Disclaimer footer strip ────────────────────────────── */}
      <footer className="border-t border-border px-4 sm:px-6 py-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-3 text-xs text-muted">
          <p className="leading-relaxed max-w-3xl">
            Risk-layer screening is generated from public datasets and encoded
            regulatory rules. It is an early-warning tool — not a substitute for
            site-specific NOCs from ASI, AAI/NOCAS, the forest department, pipeline
            operators, DISCOMs or your development authority, and not a legal
            opinion. Layer statuses on this page update as datasets and rule
            packs ship.
          </p>
          <span className="flex items-center gap-2 text-muted">
            <ShieldCheck size={14} className="text-brand" />
            © {new Date().getFullYear()} Satya-Lekh — land title intelligence for India.
          </span>
        </div>
      </footer>
    </main>
  );
}
