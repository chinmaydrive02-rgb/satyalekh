"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Cpu, FileCheck2, ChevronRight, X, ShieldCheck, Landmark, Languages } from 'lucide-react';

// First-visit explainer for Satya-Lekh: a clean one-time "how it works" card.
// Stored in localStorage so returning users skip straight to the app.

const STORAGE_KEY = 'sl_intro_seen_v1';

const STEPS = [
  {
    icon: <Search size={20} />,
    title: 'Locate the plot',
    desc: 'Pick district & taluka, type the village and survey number — English is fine, we match it against the Gujarati government records.',
  },
  {
    icon: <Cpu size={20} />,
    title: 'We fetch the official record',
    desc: 'Our system opens the government AnyROR portal, solves the CAPTCHA, and pulls your official 7/12 (Satbara) record.',
  },
  {
    icon: <FileCheck2 size={20} />,
    title: 'Get a clear verdict',
    desc: 'A 0–100 title score: encumbrances, tenure restrictions, mutation flags and ownership — translated to English, ready to save or print.',
  },
];

export default function WelcomeIntro() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'closing'>('hidden');

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setPhase('visible');
    } catch { /* private mode — skip intro */ }
  }, []);

  const dismiss = useCallback(() => {
    setPhase('closing');
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setTimeout(() => setPhase('hidden'), 350);
  }, []);

  // Allow ESC to skip
  useEffect(() => {
    if (phase === 'hidden') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dismiss]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4 transition-opacity duration-300 ${phase === 'closing' ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="card relative w-full max-w-[560px] p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-ink mb-1">Welcome to Satya-Lekh</h1>
            <p className="text-sm text-muted leading-relaxed">
              The government&apos;s 7/12 (સાતબાર) records are locked behind CAPTCHAs and Gujarati script.
              Satya-Lekh reads them for you — in minutes, in English, with title-risk analysis.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-4 flex items-start gap-4 bg-surface-soft/50"
                style={{ animation: `sl-slide-in 0.4s ease ${i * 0.1}s both` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-brand-soft text-brand">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink mb-0.5">
                    {s.title}
                  </div>
                  <p className="text-muted text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={dismiss}
              className="btn btn-primary px-8 py-3"
            >
              Get started <ChevronRight size={16} />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Landmark size={12} /> Official govt data</span>
              <span className="flex items-center gap-1.5"><Languages size={12} /> ગુજરાતી → English</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Risk scored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
