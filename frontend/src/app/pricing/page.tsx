"use client";

import React, { useState } from 'react';
import { Database, ShieldCheck, Zap, Send, X, CheckCircle2, Loader2 } from 'lucide-react';
import TopNav from '@/components/TopNav';

export default function Pricing() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTier, setContactTier] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-24 pb-10 px-10 flex flex-col items-center justify-center relative overflow-hidden">
      <TopNav />

      <div className="z-10 mb-12 text-center flex flex-col items-center">
        <h1 className="text-5xl font-display uppercase tracking-tight mb-4">Architectural Pricing</h1>
        <p className="text-[#849495] font-sans tracking-widest uppercase text-sm max-w-[600px]">
          Secure title intelligence tiers. Choose on-demand queries for individual plots 
          or bulk enterprise API access for financial institutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 w-full max-w-[900px]">
        
        {/* Pay as You Go */}
        <div className="glass-panel p-8 flex flex-col relative group overflow-hidden bg-[#1c1b1b]/80 border-[#3b494b]/40 border">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <Zap size={100} />
          </div>
          <h2 className="text-2xl font-display uppercase mb-2">Per-Query Access</h2>
          <div className="text-[#00f0ff] font-display text-4xl mb-6">₹1,500 <span className="text-sm text-[#849495] tracking-widest uppercase">/ plot</span></div>
          
          <ul className="flex flex-col gap-4 mb-8 text-sm text-[#dbfcff]/80 font-sans mt-4">
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> Instant OCR Extraction</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> GDCR FSI Calculator</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#4edea3]"/> Basic Litigation Flags</li>
          </ul>

          <button 
            onClick={() => openContact('Per-Query Access (₹1,500/plot)')}
            className="mt-auto w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] hover:brightness-110 transition-all border-none outline-none relative z-10 flex items-center justify-center gap-2"
          >
            <Send size={14}/> Get Started
          </button>
        </div>

        {/* Enterprise */}
        <div className="glass-panel p-8 flex flex-col relative group overflow-hidden bg-[#2a2a2a]/60 border-[#00f0ff]/50 border drop-shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <Database size={100} />
          </div>
          <h2 className="text-2xl font-display uppercase mb-2 text-[#00f0ff]">Bank Bulk Deals</h2>
          <div className="text-[#dbfcff] font-display text-4xl mb-6">Custom <span className="text-sm text-[#4edea3] tracking-widest uppercase">/ annual</span></div>
          
          <ul className="flex flex-col gap-4 mb-8 text-sm text-[#dbfcff]/80 font-sans mt-4">
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Unlimited Regional Queries</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Direct PostGIS API Access</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-[#00f0ff]"/> Advanced Risk Aggregation</li>
          </ul>

          <button 
            onClick={() => openContact('Enterprise Bulk Deal (Custom/Annual)')}
            className="mt-auto w-full py-4 text-[#00f0ff] font-bold text-sm tracking-[0.15em] uppercase bg-transparent border border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all relative z-10 flex items-center justify-center gap-2"
          >
            <Send size={14}/> Contact Authority
          </button>
        </div>

      </div>

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="glass-panel w-full max-w-[480px] border border-[#00f0ff]/30 relative">
            
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-[#849495] hover:text-[#dbfcff] transition-colors"
            >
              <X size={18}/>
            </button>

            <div className="p-8 flex flex-col gap-6">
              
              {isSent ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <CheckCircle2 size={48} className="text-[#4edea3]" />
                  <h3 className="text-xl font-display uppercase">Message Sent</h3>
                  <p className="text-xs text-[#849495] uppercase tracking-widest">
                    Your inquiry has been forwarded. We'll respond within 24 hours.
                  </p>
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="mt-4 px-8 py-3 bg-[#4edea3] text-[#0a0a0a] text-xs font-bold uppercase tracking-widest hover:bg-[#dbfcff] transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-display uppercase mb-1">Send Inquiry</h3>
                    <p className="text-[10px] text-[#00f0ff] uppercase tracking-widest font-bold">{contactTier}</p>
                  </div>

                  <form onSubmit={handleSend} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Full Name</label>
                      <input 
                        type="text" required
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Email Address</label>
                      <input 
                        type="email" required
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Company / Organization</label>
                      <input 
                        type="text"
                        value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Message</label>
                      <textarea 
                        required rows={4}
                        value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 font-sans text-sm focus:outline-none focus:border-[#00f0ff] transition-colors resize-none placeholder:text-[#3b494b]"
                        placeholder="Tell us about your use case..."
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isSending}
                      className="w-full py-4 text-[#002022] font-bold text-sm tracking-[0.15em] uppercase bg-gradient-to-r from-[#de4ced] to-[#ff00f0] disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
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

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
}
