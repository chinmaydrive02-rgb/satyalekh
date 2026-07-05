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
    <div className="card w-full max-w-[520px] p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
      <span className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center">
        <CheckCircle2 size={34} className="text-success" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">Payment Successful</h1>
        <p className="text-sm text-muted leading-relaxed">
          Your search credit has been added to your account.
        </p>
      </div>

      {sessionId && (
        <div className="w-full text-xs font-mono text-faint break-all border border-border rounded-lg bg-surface-soft px-3 py-2">
          TXN REF: {sessionId}
        </div>
      )}

      <div className="w-full flex items-center justify-center gap-2 text-sm py-3 border border-border rounded-lg bg-surface-soft">
        <Wallet size={15} className="text-brand" />
        {loadingCredits ? (
          <span className="flex items-center gap-2 text-muted"><Loader2 size={13} className="animate-spin" /> Updating credit balance…</span>
        ) : creditsInfo ? (
          <span className="text-ink">Current balance: <span className="text-success font-bold">{creditsInfo.credits} search credit{creditsInfo.credits === 1 ? '' : 's'}</span></span>
        ) : (
          <span className="text-muted">Credits will appear within a minute — check the pricing page.</span>
        )}
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <Link href="/upload" className="btn btn-primary w-full py-3">
          <Search size={15} /> Start Searching
        </Link>
        <Link href="/pricing" className="btn btn-outline w-full">
          Back to Pricing
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-6">
      <TopNav />
      <Suspense fallback={<Loader2 size={32} className="text-brand animate-spin" />}>
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}
