"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Cpu, FileCheck2, ChevronRight, X, ShieldCheck, Landmark, Languages } from 'lucide-react';

// First-visit cinematic intro + explainer for Satya-Lekh.
// Shows a boot sequence, then a 3-step "how it works", then dismisses.
// Stored in localStorage so returning users skip straight to the map.

const STORAGE_KEY = 'sl_intro_seen_v1';

const BOOT_LINES = [
  '> SATYA-LEKH TITLE INTELLIGENCE v2.2',
  '> Linking to AnyROR · Revenue Dept · Govt of Gujarat',
  '> Gemini Vision CAPTCHA solver . . . . . ARMED',
  '> Gujarati → English neural translation . . . . . ONLINE',
  '> Encumbrance & tenure risk engine . . . . . ONLINE',
  '> 33 districts · 250+ talukas · 18,000+ villages indexed',
  '> SYSTEM READY_',
];

const STEPS = [
  {
    icon: <Search size={22} />,
    title: 'Locate the Plot',
    desc: 'Pick district & taluka, type the village and survey number — English is fine, we match it against the Gujarati government records.',
  },
  {
    icon: <Cpu size={22} />,
    title: 'The Bot Does the Work',
    desc: 'A live robot opens the government AnyROR portal, solves the CAPTCHA with AI vision, and pulls your official 7/12 (Satbara) record.',
  },
  {
    icon: <FileCheck2 size={22} />,
    title: 'Read It in English',
    desc: 'Owner, area, tenure, mutations and encumbrances — translated, risk-scored (clear / restricted / encumbered) and ready to save or print.',
  },
];

export default function WelcomeIntro() {
  const [phase, setPhase] = useState<'hidden' | 'boot' | 'steps' | 'closing'>('hidden');
  const [bootCount, setBootCount] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setPhase('boot');
    } catch { /* private mode — skip intro */ }
  }, []);

  // Type out boot lines one by one
  useEffect(() => {
    if (phase !== 'boot') return;
    if (bootCount >= BOOT_LINES.length) {
      const t = setTimeout(() => setPhase('steps'), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBootCount(c => c + 1), 260);
    return () => clearTimeout(t);
  }, [phase, bootCount]);

  const dismiss = useCallback(() => {
    setPhase('closing');
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setTimeout(() => setPhase('hidden'), 450);
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
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[#050505]/95 backdrop-blur-sm transition-opacity duration-500 ${phase === 'closing' ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,240,255,0.4)_50%)] bg-[length:100%_3px]" />
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.07),_transparent_60%)]" />

      <button
        onClick={dismiss}
        className="absolute top-5 right-5 text-[#849495] hover:text-[#00f0ff] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
      >
        Skip <X size={16} />
      </button>

      <div className="relative w-full max-w-[640px] px-6">
        {phase === 'boot' && (
          <div className="font-mono text-[13px] leading-7 text-[#00f0ff]/90 min-h-[210px]">
            {BOOT_LINES.slice(0, bootCount).map((l, i) => (
              <div key={i} className={i === bootCount - 1 ? 'animate-pulse' : 'opacity-70'}>{l}</div>
            ))}
          </div>
        )}

        {(phase === 'steps' || phase === 'closing') && (
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-[#dbfcff] mb-2">
                Satya<span className="text-[#00f0ff]">-</span>Lekh
              </h1>
              <p className="text-[#00f0ff] uppercase tracking-[0.3em] text-[11px] font-bold">
                Gujarat Land Records · Decoded in English
              </p>
              <p className="text-[#849495] text-xs mt-4 max-w-md mx-auto leading-relaxed">
                The government&apos;s 7/12 (સાતબાર) records are locked behind CAPTCHAs and Gujarati script.
                Satya-Lekh reads them for you — in minutes, in English, with title-risk analysis.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="glass-panel border border-[#3b494b]/40 bg-[#1c1b1b]/70 p-4 flex items-start gap-4"
                  style={{ animation: `sl-slide-in 0.5s ease ${i * 0.15}s both` }}
                >
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center border border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff]">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-[#dbfcff] font-display uppercase text-sm tracking-wide mb-1">
                      <span className="text-[#00f0ff] font-mono mr-2">0{i + 1}</span>{s.title}
                    </div>
                    <p className="text-[#849495] text-[11px] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={dismiss}
                className="px-10 py-4 bg-gradient-to-r from-[#0bd9e4] to-[#00f0ff] text-[#002022] text-sm font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all flex items-center gap-2"
              >
                Enter the HUD <ChevronRight size={16} />
              </button>
              <div className="flex items-center gap-5 text-[9px] text-[#3b494b] uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Landmark size={10} /> Official Govt Data</span>
                <span className="flex items-center gap-1.5"><Languages size={10} /> ગુજરાતી → English</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={10} /> Risk Scored</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
