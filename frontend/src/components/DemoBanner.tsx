"use client";

// Slim amber bar shown while a demo session is active. Client-only: renders
// nothing during SSR / before hydration (demo state lives in localStorage),
// which avoids hydration mismatches. Hidden on print.

import React, { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { isDemoActive, exitDemo } from '@/lib/api';

export default function DemoBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoActive());
  }, []);

  if (!active) return null;

  const handleExit = () => {
    exitDemo();
    setActive(false);
    window.location.href = '/';
  };

  return (
    <div className="print:hidden fixed bottom-0 left-0 w-full z-[1000] bg-warning-soft border-t border-warning-border">
      <div className="max-w-[1280px] mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-warning">
        <FlaskConical size={12} className="shrink-0" />
        <span className="font-semibold tracking-wide">DEMO MODE</span>
        <span className="hidden sm:inline text-warning/80">— sample data for demonstration</span>
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
