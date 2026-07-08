"use client";

// /demo — login gate for the sample-data demo. On success the 24h demo
// token is stored locally (sl_demo_token / sl_demo_expiry) and every
// title-report / watchlist / options request carries X-Demo-Token, so the
// backend serves realistic Gujarat fixtures through the real product flow.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, KeyRound, Loader2, LogIn, ShieldCheck, User, Sparkles, ArrowRight } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import { demoLogin, demoStart, isDemoActive, exitDemo, ApiError } from '@/lib/api';

export default function DemoLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [alreadyActive, setAlreadyActive] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAlreadyActive(isDemoActive()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleLaunch = async () => {
    if (launching || loading) return;
    setLaunching(true);
    setError('');
    try {
      await demoStart();
      window.location.href = '/demo/tour';
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong — please try again in a moment.'
      );
      setLaunching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    setError('');
    try {
      await demoLogin(username.trim(), password);
      window.location.href = '/demo/tour';
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong — please try again in a moment.'
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg">
      <TopNav />
      <div className="pt-16 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Reveal variant="reveal-scale">
          <div className="card p-7 sm:p-8 flex flex-col gap-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <span className="eyebrow flex items-center gap-1.5">
                <FlaskConical size={12} /> Demo access
              </span>
              <h1 className="text-2xl font-bold text-ink">Try Satya-Lekh in demo mode</h1>
              <p className="text-sm text-muted leading-relaxed">
                Sample data, real product flow — the full title-check pipeline, risk
                scoring, chain of title and watchlist, powered by realistic Gujarat
                fixture parcels instead of live AnyROR scrapes.
              </p>
            </div>

            {alreadyActive && (
              <div className="text-xs text-success bg-success-soft border border-success-border rounded-lg px-3 py-2 flex items-center gap-2">
                <ShieldCheck size={13} className="shrink-0" />
                <span>
                  A demo session is already active.{' '}
                  <Link href="/demo/tour" className="underline underline-offset-2 font-medium">Open the guided tour</Link>
                  {' '}or{' '}
                  <button
                    type="button"
                    className="underline underline-offset-2 font-medium"
                    onClick={() => { exitDemo(); setAlreadyActive(false); }}
                  >
                    exit the demo
                  </button>.
                </span>
              </div>
            )}

            {/* Primary, frictionless entry — no credentials needed */}
            <button
              type="button"
              onClick={handleLaunch}
              disabled={launching || loading}
              className="btn btn-primary w-full h-12 text-base"
            >
              {launching
                ? <><Loader2 size={16} className="animate-spin" /> Starting your demo…</>
                : <><Sparkles size={16} /> Launch the investor demo <ArrowRight size={15} /></>}
            </button>
            <p className="text-xs text-faint leading-relaxed -mt-2">
              No sign-in required — this opens a guided tour with realistic seeded data across every feature.
            </p>

            {error && !username && (
              <p className="text-sm text-danger bg-danger-soft border border-danger-border rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-faint font-semibold whitespace-nowrap">
                Or sign in with demo credentials
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="demo-username">Username</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input
                    id="demo-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Demo username"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="demo-password">Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input
                    id="demo-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Demo password"
                    className="input pl-9"
                  />
                </div>
              </div>

              {error && !!username && (
                <p className="text-sm text-danger bg-danger-soft border border-danger-border rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!username.trim() || !password || loading || launching}
                className="btn btn-outline w-full h-11"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                  : <><LogIn size={15} /> Enter demo</>}
              </button>
            </form>

            <p className="text-xs text-faint leading-relaxed">
              Demo sessions last 24 hours and never touch live government portals or
              real customer data. Need credentials? Use the{' '}
              <Link href="/contact" className="text-brand hover:text-brand-strong underline underline-offset-2">
                contact form
              </Link>{' '}to request access.
            </p>
          </div>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-center text-xs text-faint mt-4">
              Looking for real searches?{' '}
              <Link href="/" className="text-brand hover:text-brand-strong underline underline-offset-2">
                Back to the live product
              </Link>
            </p>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
