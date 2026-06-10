"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Search, Wallet } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { getUserEmail, fetchCredits, CreditsInfo } from '@/lib/api';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';

  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // The Stripe webhook credits the account server-side; we just poll the
  // balance a couple of times since the webhook can lag the redirect slightly.
  useEffect(() => {
    const email = getUserEmail();
    if (!email) { setLoadingCredits(false); return; }
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      const info = await fetchCredits(email);
      if (cancelled) return;
      if (info) setCreditsInfo(info);
      if (attempts < 4 && (!info || info.credits <= 0)) {
        setTimeout(poll, 2500);
      } else {
        setLoadingCredits(false);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="z-10 w-full max-w-[520px] glass-panel p-10 border border-[#4edea3]/30 flex flex-col items-center gap-6 text-center">
      <CheckCircle2 size={56} className="text-[#4edea3]" />
      <div>
        <h1 className="text-3xl font-display uppercase tracking-tight mb-2">Payment Successful</h1>
        <p className="text-xs text-[#849495] uppercase tracking-widest leading-relaxed">
          Your search credit has been added to your account.
        </p>
      </div>

      {sessionId && (
        <div className="w-full text-[9px] font-mono text-[#3b494b] break-all border border-[#3b494b]/30 bg-[#111]/60 px-3 py-2">
          TXN REF: {sessionId}
        </div>
      )}

      <div className="w-full flex items-center justify-center gap-2 text-xs font-mono py-3 border border-[#3b494b]/40 bg-[#1c1b1b]/60">
        <Wallet size={14} className="text-[#00f0ff]" />
        {loadingCredits ? (
          <span className="flex items-center gap-2 text-[#849495]"><Loader2 size={12} className="animate-spin" /> Updating credit balance…</span>
        ) : creditsInfo ? (
          <span className="text-[#dbfcff]">Current balance: <span className="text-[#4edea3] font-bold">{creditsInfo.credits} search credit{creditsInfo.credits === 1 ? '' : 's'}</span></span>
        ) : (
          <span className="text-[#849495]">Credits will appear within a minute — check the pricing page.</span>
        )}
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <Link href="/upload" className="w-full py-4 text-center text-[#002022] bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] hover:brightness-110 text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2">
          <Search size={14} /> Start Searching
        </Link>
        <Link href="/pricing" className="w-full py-3 text-center text-[#dbfcff] border border-[#3b494b] bg-black/40 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">
          Back to Pricing
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      <Suspense fallback={<Loader2 size={32} className="text-[#00f0ff] animate-spin z-10" />}>
        <PaymentSuccessContent />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
