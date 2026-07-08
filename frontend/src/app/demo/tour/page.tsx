"use client";

// /demo/tour — the investor demo "control center". A guided checklist that
// walks through every feature, each preloaded with realistic seeded context.
// Only reachable in demo mode (redirects to /demo otherwise). On-brand:
// serif headings, Reveal animations, card / card-lift, registrar-gold accents.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import { isDemoActive, exitDemo } from '@/lib/api';
import {
  Sparkles, MapPin, ArrowRight, Search, GitBranch, Scale, Radar, Bell,
  Sparkle, TrendingUp, Stamp, Vault, Building2, ShieldCheck, CheckCircle2,
  FlaskConical, LayoutDashboard, Compass, X,
} from 'lucide-react';

// The curated sample parcel — matches the backend demo fixture (Navrangpura).
const SAMPLE = {
  district: 'Ahmedabad',
  taluka: 'City',
  village: 'Navrangpura',
  survey: '128 P',
  recordType: 'OLD_SCAN_712',
};

const TITLE_CHECK_HREF =
  `/property/SURVEY-${encodeURIComponent(SAMPLE.survey)}` +
  `?district=${encodeURIComponent(SAMPLE.district)}` +
  `&taluka=${encodeURIComponent(SAMPLE.taluka)}` +
  `&village=${encodeURIComponent(SAMPLE.village)}` +
  `&record_type=${SAMPLE.recordType}`;

interface TourCard {
  key: string;
  href: string;
  icon: React.ReactNode;
  title: string;
  what: string;
}

const CARDS: TourCard[] = [
  {
    key: 'title',
    href: TITLE_CHECK_HREF,
    icon: <Search size={18} />,
    title: 'Title report & risk score',
    what: 'A 0–100 title score with a CLEAR / CAUTION / HIGH-RISK verdict on the 7/12 record.',
  },
  {
    key: 'chain',
    href: TITLE_CHECK_HREF,
    icon: <GitBranch size={18} />,
    title: 'Chain of title',
    what: 'Every mutation drawn as a timeline — who sold to whom, with the gaps flagged.',
  },
  {
    key: 'litigation',
    href: TITLE_CHECK_HREF,
    icon: <Scale size={18} />,
    title: 'Litigation check',
    what: 'District-court cases naming the recorded owner — run it from inside the report.',
  },
  {
    key: 'risk',
    href: '/risk-intel',
    icon: <Radar size={18} />,
    title: 'Risk Intel screening',
    what: 'Twelve regulatory layers — pipeline ROU, AAI height, CRZ, tenure — auto-screened on load.',
  },
  {
    key: 'watchlist',
    href: '/watchlist',
    icon: <Bell size={18} />,
    title: 'Watchlist & alerts',
    what: 'Seeded parcels under daily re-check, with a change alert already waiting.',
  },
  {
    key: 'land-intel',
    href: '/land-intel',
    icon: <Sparkle size={18} />,
    title: 'Land Intel report',
    what: 'A sample parcel is pre-drawn on the map — one click for a full due-diligence assessment.',
  },
  {
    key: 'market',
    href: '/market',
    icon: <TrendingUp size={18} />,
    title: 'Market intel',
    what: 'Jantri-vs-market spreads, a demand heatmap and a seeded Gujarat news feed.',
  },
  {
    key: 'portfolio',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    title: 'Portfolio',
    what: 'Four seeded holdings across Ahmedabad and Surat — clear, encumbered and restricted.',
  },
  {
    key: 'locker',
    href: '/locker',
    icon: <Vault size={18} />,
    title: 'Property locker',
    what: 'Six sample documents — 7/12, sale deed, NA order, EC, mutation and tax receipt.',
  },
  {
    key: 'compliance',
    href: '/compliance',
    icon: <Building2 size={18} />,
    title: 'Compliance / FSI',
    what: 'FSI and stamp-duty calculators for the same parcel — buildable area at a glance.',
  },
];

const STORE_KEY = 'sl_demo_tour_seen';

export default function DemoTour() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  // Gate: only in demo. Load "explored" progress from localStorage.
  // setState is deferred into a rAF callback (not run synchronously in the
  // effect body) to avoid cascading renders.
  useEffect(() => {
    if (!isDemoActive()) {
      router.replace('/demo');
      return;
    }
    const raf = requestAnimationFrame(() => {
      setReady(true);
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (raw) setSeen(new Set(JSON.parse(raw) as string[]));
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [router]);

  const markSeen = (key: string) => {
    setSeen((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev).add(key);
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-bg">
        <TopNav />
      </main>
    );
  }

  const exploredCount = CARDS.filter((c) => seen.has(c.key)).length;

  return (
    <main className="min-h-screen bg-bg text-ink pb-20">
      <TopNav />

      {/* Hero */}
      <section className="section-dark pt-28 pb-14 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="relative z-10 max-w-[1100px] mx-auto flex flex-col gap-6">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <FlaskConical size={13} className="text-accent-bright" /> Investor demo · sample data
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-serif text-[2.3rem] sm:text-5xl font-semibold text-white leading-[1.06] tracking-tight max-w-3xl">
              Walk the whole product in a few clicks.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
              Every feature below is preloaded with realistic Gujarat data — no live
              scrapes, no empty states. Start with the sample title check, then explore
              each capability from this control center.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Compass size={14} className="text-accent-bright" />
                {exploredCount} of {CARDS.length} explored
              </span>
              <span className="h-1.5 w-40 rounded-full bg-white/10 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-accent-bright transition-[width] duration-500"
                  style={{ width: `${(exploredCount / CARDS.length) * 100}%` }}
                />
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col gap-10 -mt-8">
        {/* Curated sample parcel — the one-click hero action */}
        <Reveal variant="reveal-scale">
          <div className="card p-6 sm:p-8 border-l-4 border-l-accent shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-accent/50 to-brand/40" aria-hidden="true" />
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div className="flex flex-col gap-2">
                <span className="eyebrow text-accent flex items-center gap-1.5">
                  <Stamp size={12} /> Start here
                </span>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Run this title check
                </h2>
                <p className="text-sm text-muted flex items-center gap-1.5">
                  <MapPin size={13} className="text-brand" />
                  Navrangpura · Survey {SAMPLE.survey} · {SAMPLE.taluka}, {SAMPLE.district}
                </p>
                <p className="text-sm text-ink-soft leading-relaxed max-w-lg mt-1">
                  Fires the real title-report pipeline against seeded data — you&apos;ll watch
                  the live progress stages, then land on a full risk-scored report with the
                  chain of title and a litigation check.
                </p>
              </div>
              <Link
                href={TITLE_CHECK_HREF}
                onClick={() => { markSeen('title'); markSeen('chain'); markSeen('litigation'); }}
                className="btn btn-primary h-12 px-6 text-base whitespace-nowrap shrink-0"
              >
                <Sparkles size={16} /> Run this title check <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Feature cards */}
        <div>
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-5 border-b border-border pb-4">
              <div>
                <p className="eyebrow mb-1">The full walkthrough</p>
                <h2 className="font-serif text-2xl font-semibold text-ink">Explore every feature</h2>
              </div>
              <span className="text-xs text-muted hidden sm:block">Each opens with seeded context</span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CARDS.map((c, i) => (
              <Reveal key={c.key} delay={(i % 3) * 80} className="h-full">
                <Link
                  href={c.href}
                  onClick={() => markSeen(c.key)}
                  className="card card-lift p-6 flex flex-col gap-3 h-full hover:border-brand transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand border border-brand-border/60 flex items-center justify-center">
                      {c.icon}
                    </span>
                    {seen.has(c.key) ? (
                      <span className="badge bg-success-soft text-success border border-success-border text-[10px] uppercase tracking-wide">
                        <CheckCircle2 size={11} /> Explored
                      </span>
                    ) : (
                      <ArrowRight size={16} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-ink leading-snug">{c.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{c.what}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <Reveal>
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-ink-soft leading-relaxed flex items-center gap-2">
              <ShieldCheck size={15} className="text-brand shrink-0" />
              Demo sessions last 24 hours and never touch live government portals or real customer data.
            </p>
            <button
              type="button"
              onClick={() => { exitDemo(); window.location.href = '/'; }}
              className="btn btn-outline whitespace-nowrap shrink-0 hover:text-danger hover:border-danger-border"
            >
              <X size={14} /> Exit demo
            </button>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
