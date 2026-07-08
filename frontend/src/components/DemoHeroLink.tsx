"use client";

// Subtle "Live investor demo" entry point for the landing hero. Fires the
// guest demo (POST /demo/start, no credentials) then routes into the guided
// tour. SSR-safe — the click handler is the only place demo state is touched.
// Reduced-motion safe (no animations of its own).

import React, { useState } from 'react';
import { FlaskConical, Loader2, ArrowRight } from 'lucide-react';
import { demoStart } from '@/lib/api';

export default function DemoHeroLink() {
  const [launching, setLaunching] = useState(false);

  const launch = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      await demoStart();
      window.location.href = '/demo/tour';
    } catch {
      // Fall back to the demo landing page (has its own retry + credentials).
      window.location.href = '/demo';
    }
  };

  return (
    <button
      type="button"
      onClick={launch}
      disabled={launching}
      className="group inline-flex items-center gap-2 w-fit text-sm font-medium text-brand hover:text-brand-strong transition-colors disabled:opacity-70"
    >
      {launching
        ? <Loader2 size={14} className="animate-spin" />
        : <FlaskConical size={14} />}
      {launching ? 'Starting the demo…' : 'Live investor demo — one click, seeded data'}
      {!launching && <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
