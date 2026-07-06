"use client";

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Zap, Send, X, CheckCircle2, Loader2, CreditCard, Wallet } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import { API_BASE_URL, getUserEmail, setUserEmail, fetchCredits, CreditsInfo } from '@/lib/api';

export default function Pricing() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTier, setContactTier] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Payment / credits state
  const [buyEmail, setBuyEmail] = useState('');
  const [buyLoading, setBuyLoading] = useState(0); // quantity currently being purchased (0 = idle)
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [checkingCredits, setCheckingCredits] = useState(false);
  const [payError, setPayError] = useState('');

  // Restore saved email and show current balance on load
  useEffect(() => {
    const saved = getUserEmail();
    if (saved) {
      setBuyEmail(saved);
      fetchCredits(saved).then(info => { if (info) setCreditsInfo(info); });
    }
  }, []);

  const validEmail = buyEmail.trim().includes('@');

  const handleCheckCredits = async () => {
    if (!validEmail) { setPayError('Enter a valid email to check credits.'); return; }
    setPayError('');
    setCheckingCredits(true);
    setUserEmail(buyEmail);
    const info = await fetchCredits(buyEmail.trim().toLowerCase());
    setCheckingCredits(false);
    if (info) setCreditsInfo(info);
    else setPayError('Could not reach the server — it may be warming up. Try again in a minute.');
  };

  const handleBuy = async (quantity: number) => {
    if (!validEmail) { setPayError('Enter your email above first — credits are linked to it.'); return; }
    setPayError('');
    setBuyLoading(quantity);
    setUserEmail(buyEmail);
    try {
      const res = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyEmail.trim().toLowerCase(), quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setPayError(data.detail || 'Payments are not enabled yet — please use the contact form below.');
    } catch {
      setPayError('Could not reach the payment server. It may be warming up — try again in a minute.');
    } finally {
      setBuyLoading(0);
    }
  };

  const openContact = (tier: string) => {
    setContactTier(tier);
    setShowContactModal(true);
    setIsSent(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Send via mailto link (works universally without backend)
    const subject = encodeURIComponent(`[Satya-Lekh] ${contactTier} Inquiry from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\nTier: ${contactTier}\n\nMessage:\n${formData.message}`
    );

    // Open mailto link
    window.open(`mailto:chinmaydrive02@gmail.com?subject=${subject}&body=${body}`, '_blank');

    // Also try sending via formsubmit.co (free email forwarding service)
    try {
      await fetch('https://formsubmit.co/ajax/chinmaydrive02@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          tier: contactTier,
          message: formData.message,
          _subject: `[Satya-Lekh] ${contactTier} Inquiry from ${formData.name}`
        })
      });
    } catch {
      // Fallback — the mailto already opened
    }

    setIsSending(false);
    setIsSent(true);
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-bg text-ink pt-24 pb-16 px-4 sm:px-6 flex flex-col items-center">
      <TopNav />

      <Reveal className="flex flex-col items-center">
        <div className="mb-12 text-center flex flex-col items-center max-w-[640px]">
          <p className="eyebrow mb-2">Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Simple, per-search pricing</h1>
          <p className="text-muted text-base leading-relaxed">
            On-demand title checks for individual plots, or bulk enterprise access
            for banks and law firms.
          </p>
          <p className="mt-5 text-success text-sm border border-success-border bg-success-soft rounded-lg px-4 py-2.5">
            New users get free trial searches automatically — just enter your email and run your first search.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[900px]">

        {/* Pay as You Go */}
        <Reveal delay={80} className="h-full">
        <div className="card card-lift p-7 sm:p-8 flex flex-col relative group overflow-hidden h-full">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-brand">
            <Zap size={100} />
          </div>
          <h2 className="text-xl font-semibold text-ink mb-1">Per-Query Access</h2>
          <div className="text-brand font-display text-4xl font-bold mb-6">₹1,500 <span className="text-sm text-muted font-normal">/ plot</span></div>

          <ul className="flex flex-col gap-3 mb-6 text-sm text-ink-soft">
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-success shrink-0 mt-0.5"/> Title Clearance Score + printable report</li>
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-success shrink-0 mt-0.5"/> Prohibited-category &amp; encumbrance screen</li>
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-success shrink-0 mt-0.5"/> 5-pack = full Title Pack: 7/12 + VF-6 mutation history + VF-8A khata + owner-name search</li>
          </ul>

          {/* Email + credits */}
          <div className="flex flex-col gap-3 mb-5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="label">Your email (credits are linked to it)</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={buyEmail}
                  onChange={e => setBuyEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleCheckCredits}
                  disabled={checkingCredits || !validEmail}
                  className="btn btn-outline whitespace-nowrap px-3 text-sm"
                >
                  {checkingCredits ? <Loader2 size={13} className="animate-spin"/> : <Wallet size={13}/>} Check Credits
                </button>
              </div>
            </div>
            {creditsInfo && (
              <div className={`text-sm px-3 py-2 rounded-lg border ${creditsInfo.payments_enabled ? 'border-success-border text-success bg-success-soft' : 'border-warning-border text-warning bg-warning-soft'}`}>
                {creditsInfo.payments_enabled
                  ? <>Remaining credits for {creditsInfo.email}: <span className="font-bold">{creditsInfo.credits}</span></>
                  : <>Payments are not enabled yet — searches are currently free during beta.</>}
              </div>
            )}
            {payError && <div className="text-sm text-danger px-3 py-2 rounded-lg border border-danger-border bg-danger-soft">{payError}</div>}
          </div>

          {/* Buy buttons */}
          <div className="mt-auto flex flex-col gap-3 relative z-10">
            <button
              onClick={() => handleBuy(1)}
              disabled={buyLoading !== 0}
              className="btn btn-primary w-full py-3"
            >
              {buyLoading === 1 ? <Loader2 size={14} className="animate-spin"/> : <CreditCard size={14}/>} Buy 1 Search — ₹1,500
            </button>
            <button
              onClick={() => handleBuy(5)}
              disabled={buyLoading !== 0}
              className="btn btn-outline w-full text-brand border-brand-border hover:border-brand"
            >
              {buyLoading === 5 ? <Loader2 size={13} className="animate-spin"/> : <CreditCard size={13}/>} Buy 5 Searches — ₹6,000 <span className="text-success font-medium">(save 20%)</span>
            </button>
            <button
              onClick={() => openContact('Per-Query Access (₹1,500/plot)')}
              className="btn btn-ghost w-full py-2 text-sm"
            >
              <Send size={12}/> Questions? Contact us instead
            </button>
          </div>
        </div>
        </Reveal>

        {/* Enterprise — featured tier */}
        <Reveal delay={200} variant="reveal-scale" className="h-full">
        <div className="card card-lift tier-glow p-7 sm:p-8 flex flex-col relative group overflow-hidden border-brand shadow-md h-full">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] text-brand">
            <Database size={100} />
          </div>
          <span className="badge bg-brand-soft text-brand border border-brand-border w-fit mb-3">For banks &amp; firms</span>
          <h2 className="text-xl font-semibold text-ink mb-1">Enterprise Bulk Access</h2>
          <div className="text-ink font-display text-4xl font-bold mb-6">Custom <span className="text-sm text-muted font-normal">/ annual</span></div>

          <ul className="flex flex-col gap-3 mb-8 text-sm text-ink-soft">
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-brand shrink-0 mt-0.5"/> Unlimited regional queries</li>
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-brand shrink-0 mt-0.5"/> Direct API access</li>
            <li className="flex items-start gap-3"><ShieldCheck size={16} className="text-brand shrink-0 mt-0.5"/> Advanced risk aggregation &amp; portfolio monitoring</li>
          </ul>

          <button
            onClick={() => openContact('Enterprise Bulk Deal (Custom/Annual)')}
            className="btn btn-primary mt-auto w-full py-3 relative z-10"
          >
            <Send size={14}/> Talk to Sales
          </button>
        </div>
        </Reveal>

      </div>

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
          <div
            className="sl-anim card w-full max-w-[480px] relative shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ animation: 'sl-fade-up 0.35s cubic-bezier(0.22,0.61,0.36,1) both' }}
          >

            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-1.5 text-muted hover:text-ink transition-colors"
            >
              <X size={18}/>
            </button>

            <div className="p-8 flex flex-col gap-6">

              {isSent ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <CheckCircle2 size={48} className="text-success" />
                  <h3 className="text-xl font-semibold text-ink">Message Sent</h3>
                  <p className="text-sm text-muted">
                    Your inquiry has been forwarded. We&apos;ll respond within 24 hours.
                  </p>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="btn btn-primary mt-2 px-8"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-semibold text-ink mb-1">Send Inquiry</h3>
                    <p className="text-sm text-brand font-medium">{contactTier}</p>
                  </div>

                  <form onSubmit={handleSend} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Full Name</label>
                      <input
                        type="text" required
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="input"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Email Address</label>
                      <input
                        type="email" required
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="input"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Company / Organization</label>
                      <input
                        type="text"
                        value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                        className="input"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Message</label>
                      <textarea
                        required rows={4}
                        value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                        className="input resize-none"
                        placeholder="Tell us about your use case..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSending}
                      className="btn btn-primary w-full py-3"
                    >
                      {isSending ? <><Loader2 size={14} className="animate-spin"/> Sending...</> : <><Send size={14}/> Send Message</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
