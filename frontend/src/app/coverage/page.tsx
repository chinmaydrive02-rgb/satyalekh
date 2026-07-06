"use client";

import React from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Reveal } from "@/components/motion";
import {
  Landmark, ShieldCheck, ArrowRight, CheckCircle2, Globe2, Zap,
  Database, Cpu, Stamp, FileBadge2, Timer, Route, Search, Bell,
} from "lucide-react";

type StateStatus = "live" | "next" | "planned";

const STATUS_META: Record<StateStatus, { label: string; cls: string; dot: string }> = {
  live: { label: "Live", cls: "text-success bg-success-soft border-success-border", dot: "bg-success" },
  next: { label: "Next up", cls: "text-brand bg-brand-soft border-brand-border", dot: "bg-brand" },
  planned: { label: "On the roadmap", cls: "text-muted bg-surface-soft border-border", dot: "bg-border-strong" },
};

const STATES: {
  state: string;
  portal: string;
  record: string;
  status: StateStatus;
  note: string;
}[] = [
  { state: "Gujarat", portal: "AnyROR", record: "7/12 (Satbara) · VF-6 · VF-8A", status: "live", note: "Full title reports with 0–100 score, chain of title, litigation check and daily watchlist. Our reference state." },
  { state: "Maharashtra", portal: "MahaBhulekh", record: "7/12 · 8A · Property cards", status: "next", note: "India's biggest land market, right next door. Marathi → English, same report format, same score." },
  { state: "Karnataka", portal: "Bhoomi", record: "RTC / Pahani", status: "next", note: "Well-digitised records and heavy Bangalore demand. Kannada → English." },
  { state: "Uttar Pradesh", portal: "UP Bhulekh", record: "Khasra / Khatauni", status: "planned", note: "Also reachable through DigiLocker issuer rails." },
  { state: "Tamil Nadu", portal: "TN e-Services", record: "Patta / Chitta", status: "planned", note: "High transaction volume; strong NRI demand." },
  { state: "Rajasthan", portal: "Apna Khata", record: "Jamabandi Nakal", status: "planned", note: "" },
  { state: "Punjab", portal: "Jamabandi Punjab", record: "Jamabandi", status: "planned", note: "Sister portal to Haryana's — both land together." },
  { state: "Haryana", portal: "Jamabandi Haryana", record: "Jamabandi", status: "planned", note: "" },
  { state: "Madhya Pradesh", portal: "MP Bhulekh / RCMS", record: "Khasra", status: "planned", note: "DigiLocker issuer live for RCMS documents." },
  { state: "Telangana", portal: "Bhu Bharati", record: "RoR · EC", status: "planned", note: "Certified registration documents issue straight into DigiLocker." },
  { state: "Andhra Pradesh", portal: "Meebhoomi", record: "1-B · Adangal", status: "planned", note: "" },
  { state: "West Bengal", portal: "Banglarbhumi", record: "Porcha RoR", status: "planned", note: "Login-walled portal — certified channel available meanwhile." },
  { state: "Kerala", portal: "Ente Bhoomi", record: "RoR", status: "planned", note: "Newer portal with open-data APIs for some record sets." },
];

const CHANNELS = [
  {
    icon: <Database size={22} />,
    sla: "Instant · free",
    title: "Verified cache",
    desc: "Every record fetched through any channel is preserved — parsed, scored and stored. If someone already verified your parcel, you see it instantly and free.",
    points: ["Already-verified parcels free to view", "Powers watchlist change detection", "Grows with every single search"],
  },
  {
    icon: <FileBadge2 size={22} />,
    sla: "Seconds",
    title: "DigiLocker rails",
    desc: "Where states issue land records through DigiLocker, we pull government-signed PDFs over official APIs — no CAPTCHA, no portal downtime games.",
    points: ["Government-signed documents", "One consent tap in DigiLocker", "Unlocks ~12 states in batches"],
  },
  {
    icon: <Cpu size={22} />,
    sla: "~2 minutes",
    title: "Live portal fetch",
    desc: "Our engine reads the state portal directly — solving CAPTCHAs, walking district → taluka → village cascades and translating the local script as it goes.",
    points: ["AnyROR live today", "MahaBhulekh & Bhoomi next", "Progress shown stage by stage"],
  },
  {
    icon: <Stamp size={22} />,
    sla: "2–5 working days",
    title: "Certified copies",
    desc: "For documents that only exist at the Sub-Registrar's office, our on-ground partners fetch certified copies and an advocate reviews them before delivery.",
    points: ["Certified 7/12 + index-2 from ₹1,500", "30-year search report ₹4,999", "Tracked in-app like any search"],
  },
];

export default function Coverage() {
  return (
    <main className="min-h-screen bg-bg">
      <TopNav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-mesh pt-28 pb-14 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1000px] mx-auto text-center flex flex-col items-center gap-6">
          <span className="sl-anim inline-flex items-center gap-2.5 rounded-full border border-brand-border bg-brand-soft/70 px-3.5 py-1.5 text-xs font-semibold text-brand"
            style={{ animation: "sl-fade-up 0.6s cubic-bezier(0.22,0.61,0.36,1) both" }}>
            <Globe2 size={13} /> Coverage &amp; rollout
          </span>
          <h1 className="sl-anim font-serif text-4xl sm:text-6xl font-semibold text-ink leading-[1.05] tracking-tight max-w-3xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.08s both" }}>
            One report format.{" "}
            <em className="text-sheen not-italic sm:italic font-medium">Every state, honestly labelled.</em>
          </h1>
          <p className="sl-anim text-lg text-ink-soft leading-relaxed max-w-2xl"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.16s both" }}>
            No one has a magic API into every Indian state — so we don&apos;t pretend to.
            Here is exactly where Satya-Lekh works today, what&apos;s next, and how each
            document actually reaches you.
          </p>
          <div className="sl-anim flex flex-wrap justify-center gap-x-10 gap-y-4 pt-2"
            style={{ animation: "sl-fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.24s both" }}>
            {[
              ["1", "state live", "text-success"],
              ["2", "next up", "text-brand"],
              ["10", "on the roadmap", "text-accent"],
              ["4", "fulfilment channels", "text-ink"],
            ].map(([n, l, tone]) => (
              <span key={l} className="flex flex-col items-center">
                <strong className={`font-mono tnum text-3xl font-bold leading-none ${tone}`}>{n}</strong>
                <span className="text-xs text-muted mt-1.5 uppercase tracking-[0.08em]">{l}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── The router diagram ───────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Route size={12} /> The fulfilment engine</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4 max-w-2xl">
              Four channels behind one search box
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-10">
              Every search becomes a document request, routed to whichever channel can
              genuinely deliver it for that state and document type. The speed is shown
              before you commit — instant, seconds, minutes or days. Never a surprise.
            </p>
          </Reveal>

          {/* Animated route: search → router → four channels (desktop) */}
          <Reveal variant="reveal-scale" className="hidden lg:block mb-12">
            <svg viewBox="0 0 1100 190" className="w-full h-auto" aria-hidden="true">
              {/* nodes */}
              <g fontFamily="ui-monospace, monospace" fontSize="12">
                <rect x="10" y="72" width="170" height="46" rx="10" fill="var(--color-brand-soft)" stroke="var(--color-brand)" />
                <text x="95" y="99" textAnchor="middle" fill="var(--color-brand)" fontWeight="700">Your search</text>

                <rect x="420" y="66" width="180" height="58" rx="12" fill="var(--color-pine)" stroke="var(--color-pine-line)" />
                <text x="510" y="90" textAnchor="middle" fill="#f4f6f3" fontWeight="700">Document router</text>
                <text x="510" y="108" textAnchor="middle" fill="rgba(244,246,243,0.55)" fontSize="10">state + doc type → channel</text>

                {[
                  ["Verified cache", "instant", 8],
                  ["DigiLocker", "seconds", 56],
                  ["Portal fetch", "~2 min", 104],
                  ["Certified copy", "2–5 days", 152],
                ].map(([label, sla, y]) => (
                  <g key={label as string}>
                    <rect x="880" y={(y as number) - 4} width="210" height="38" rx="9" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
                    <text x="898" y={(y as number) + 19} fill="var(--color-ink)" fontWeight="600">{label}</text>
                    <text x="1074" y={(y as number) + 19} textAnchor="end" fill="var(--color-accent)" fontSize="10">{sla}</text>
                  </g>
                ))}
              </g>
              {/* animated connectors */}
              <path className="draw-line" style={{ "--draw-len": 260, "--draw-delay": "0.15s" } as React.CSSProperties}
                d="M180 95 C 300 95, 300 95, 420 95" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="260" />
              {[23, 71, 119, 167].map((y, i) => (
                <path key={y} className="draw-line"
                  style={{ "--draw-len": 340, "--draw-delay": `${0.5 + i * 0.18}s` } as React.CSSProperties}
                  d={`M600 95 C 740 95, 740 ${y}, 880 ${y}`}
                  fill="none" stroke={i === 3 ? "var(--color-accent)" : "var(--color-brand)"} strokeWidth="1.8"
                  strokeDasharray="340" opacity="0.75" />
              ))}
            </svg>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CHANNELS.map((c, i) => (
              <Reveal key={c.title} delay={i * 110} variant="reveal-scale">
                <div className="card channel-card p-6 flex flex-col gap-4 h-full">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                      {c.icon}
                    </span>
                    <span className="badge border text-[11px] text-accent bg-accent-soft border-accent-border">
                      <Timer size={11} /> {c.sla}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{c.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{c.desc}</p>
                  <ul className="mt-auto flex flex-col gap-2 pt-2 border-t border-border text-[13px] text-ink-soft">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-brand shrink-0 mt-0.5" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── State table ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1000px] mx-auto">
          <Reveal>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><Landmark size={12} /> State by state</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-4">
              The rollout, in the open
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-2xl mb-10">
              We ship roughly one state adapter per fortnight, prioritised by transaction
              volume — and DigiLocker-enabled states unlock in batches on top. Certified
              copies are available in select cities regardless of portal status.
            </p>
          </Reveal>

          <div className="flex flex-col gap-3">
            {STATES.map((s, i) => {
              const meta = STATUS_META[s.status];
              return (
                <Reveal key={s.state} delay={Math.min(i * 45, 360)}>
                  <div className="card state-row px-5 sm:px-6 py-4 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 items-center">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot} ${s.status === "live" ? "pulse-dot" : ""}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <p className="text-base font-semibold text-ink">{s.state}</p>
                        <p className="text-[11px] font-mono text-faint">{s.portal}</p>
                        <p className="text-xs text-ink-soft">{s.record}</p>
                      </div>
                      {s.note && <p className="text-xs text-muted mt-1 leading-relaxed">{s.note}</p>}
                    </div>
                    <span className={`badge border text-[10px] uppercase tracking-[0.08em] ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 card bg-surface-soft/50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Zap size={18} />
              </span>
              <p className="text-sm text-ink-soft leading-relaxed">
                <strong className="text-ink">Don&apos;t see your state live yet?</strong>{" "}
                The certified-copy channel works ahead of portal coverage, and every
                record we fetch anywhere joins the verified cache — so coverage
                compounds. Tell us which state you need and we&apos;ll prioritise it.
              </p>
              <Link href="/contact" className="btn btn-outline whitespace-nowrap shrink-0">
                Request a state <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="section-dark max-w-[1000px] mx-auto rounded-3xl px-8 py-14 sm:px-14 overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="font-serif text-3xl sm:text-[2.4rem] font-semibold text-white leading-[1.1] mb-4">
                  Gujarat is live. Start there.
                </h2>
                <p className="text-white/70 text-base leading-relaxed">
                  33 districts, 250+ talukas, 18,000+ villages — with free trial
                  searches and a verdict in minutes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link href="/" className="btn bg-white text-pine hover:bg-brand-soft border border-white/10 px-7 py-3 text-base whitespace-nowrap font-semibold">
                  <Search size={15} /> Run a title check
                </Link>
                <Link href="/watchlist" className="btn btn-ghost text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-7 py-3 whitespace-nowrap">
                  <Bell size={15} /> Watch a parcel
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer strip ─────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 sm:px-6 py-8">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand" />
            © {new Date().getFullYear()} Satya-Lekh — land title intelligence for India.
          </span>
          <span>Statuses on this page are updated as adapters and issuer integrations ship.</span>
        </div>
      </footer>
    </main>
  );
}
