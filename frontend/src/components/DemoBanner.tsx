"use client";

// Persistent demo strip shown while a demo session is active. Client-only:
// renders nothing during SSR / before hydration (demo state lives in
// localStorage), which avoids hydration mismatches. Hidden on print.
// Reduced-motion safe — no animations.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Compass, Search, X } from 'lucide-react';
import { isDemoActive, exitDemo } from '@/lib/api';

// The curated sample parcel — one click straight into a live title check.
const DEMO_TITLE_CHECK =
  '/property/SURVEY-128%20P?district=Ahmedabad&taluka=City&village=Navrangpura&record_type=OLD_SCAN_712';

export default function DemoBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setActive(isDemoActive()));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!active) return null;

  const handleExit = () => {
    exitDemo();
    setActive(false);
    window.location.href = '/';
  };

  return (
    <div className="print:hidden fixed bottom-0 left-0 w-full z-[1000] bg-warning-soft border-t border-warning-border">
      <div className="max-w-[1280px] mx-auto px-4 py-1.5 flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-warning">
        <span className="flex items-center gap-1.5">
          <FlaskConical size={12} className="shrink-0" />
          <span className="font-semibold tracking-wide">DEMO MODE</span>
          <span className="hidden sm:inline text-warning/80">· sample data</span>
        </span>
        <span aria-hidden>·</span>
        <Link
          href="/demo/tour"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-brand transition-colors"
        >
          <Compass size={11} /> Tour
        </Link>
        <span aria-hidden>·</span>
        <Link
          href={DEMO_TITLE_CHECK}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-brand transition-colors"
        >
          <Search size={11} /> Run a title check
        </Link>
        <span aria-hidden>·</span>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-danger transition-colors"
        >
          Exit demo <X size={11} />
        </button>
      </div>
    </div>
  );
}
