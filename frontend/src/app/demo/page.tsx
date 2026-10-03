"use client";

// /demo — login gate for the sample-data demo. On success the 24h demo
// token is stored locally (sl_demo_token / sl_demo_expiry) and every
// title-report / watchlist / options request carries X-Demo-Token, so the
// backend serves realistic Gujarat fixtures through the real product flow.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const HomeMap = dynamic(() => import('@/components/HomeMap'), { ssr: false });
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
    <main className="min-h-screen bg-[#102b29] relative isolate overflow-x-clip">
      <div className="absolute inset-0 -z-10 opacity-50" aria-hidden="true"><HomeMap /></div>
      <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-r from-[#102b29] via-[#102b29]/75 to-[#102b29]/30" />
      <TopNav />
      <div className="relative min-h-screen max-w-[1200px] mx-auto grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-10 px-5 sm:px-8 pt-28 pb-24">
        <div className="brand-arrive text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[#e1c990]">The Satya-Lekh experience</p>
          <h1 className="mt-6 font-serif text-5xl sm:text-7xl leading-[1.04] tracking-tight">One parcel.<br />The bigger<br /><em className="text-[#e1c990] font-normal">picture.</em></h1>
          <p className="mt-6 max-w-md text-[#dce7e0] text-base sm:text-lg leading-relaxed">Follow a Gujarat property from its record of rights to the questions that matter. Explore the product with a ready-made case file.</p>
          <div className="mt-8 max-w-md border-t border-white/20">
            {[
              ['01', 'Read the record', 'Ownership, tenure and encumbrances, organised in English.'],
              ['02', 'Follow the history', 'Trace mutations and explore illustrative litigation results.'],
              ['03', 'See the wider context', 'Explore maps, screening layers and your property portfolio.'],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4 py-4 border-b border-white/15">
                <span className="font-mono text-xs text-[#e1c990] pt-1">{number}</span>
                <div><h2 className="text-base font-semibold">{title}</h2><p className="text-sm leading-relaxed text-[#c3d2c8] mt-1">{description}</p></div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-[#c3d2c8]">Illustrative records. Real product interactions. No client documents required.</p>
        </div>
        <div className="w-full max-w-md mx-auto lg:ml-auto">
          <Reveal variant="reveal-scale">
          <div className="card p-7 sm:p-8 flex flex-col gap-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <span className="eyebrow flex items-center gap-1.5">
                <FlaskConical size={12} /> Demo access
              </span>
              <h2 className="font-serif text-3xl font-semibold text-ink">Your case file is ready.</h2>
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
                : <><Sparkles size={16} /> Start exploring <ArrowRight size={15} /></>}
            </button>
            <p className="text-xs text-faint leading-relaxed -mt-2">
              No sign-in required — this opens a guided tour with realistic seeded data across every feature.
            </p>

            {error && !username && (
              <p className="text-sm text-danger bg-danger-soft border border-danger-border rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted">Have demo credentials?</summary>
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
            </details>

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
            <p className="text-center text-xs text-[#dce7e0] mt-4">
              Looking for real searches?{' '}
              <Link href="/" className="text-[#e1c990] hover:text-white underline underline-offset-2">
                Back to the live product
              </Link>
            </p>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
