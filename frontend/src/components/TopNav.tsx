"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, UploadCloud, Phone, LayoutDashboard, TrendingUp, ShieldCheck, Menu, X,
  Wallet, Sparkles, Vault, BookOpen, Bell, ChevronDown, Users,
} from 'lucide-react';
import { getUserEmail, fetchCredits, fetchUnseenAlertCount, CreditsInfo, isDemoActive } from '@/lib/api';

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [unseenAlerts, setUnseenAlerts] = useState(0);
  const [demoActive, setDemoActive] = useState(false); // client-only, post-hydration
  const moreRef = useRef<HTMLDivElement | null>(null);

  // ── DEMO MODE ── small badge while a demo session is active
  useEffect(() => { setDemoActive(isDemoActive()); }, [pathname]);

  // Show credit balance for users who have linked an email (payments enabled only)
  useEffect(() => {
    const email = getUserEmail();
    if (!email) return;
    fetchCredits(email).then(info => {
      if (info && info.payments_enabled) setCreditsInfo(info);
    });
    // Unseen watchlist alerts badge — fail silently
    fetchUnseenAlertCount(email).then(setUnseenAlerts).catch(() => {});
  }, [pathname]);

  // Close the "More" dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const primaryLinks = [
    { href: '/', label: 'Search', icon: <Search size={15}/> },
    { href: '/watchlist', label: 'Watchlist', icon: <Bell size={15}/>, badge: unseenAlerts },
    { href: '/dashboard', label: 'Portfolio', icon: <LayoutDashboard size={15}/> },
    { href: '/upload', label: 'Title Scanner', icon: <UploadCloud size={15}/> },
    { href: '/land-intel', label: 'Land Intel', icon: <Sparkles size={15}/> },
    { href: '/pricing', label: 'Pricing', icon: <Wallet size={15}/> },
  ];

  const moreLinks = [
    { href: '/market', label: 'Market Intel', icon: <TrendingUp size={15}/> },
    { href: '/compliance', label: 'FSI Compliance', icon: <ShieldCheck size={15}/> },
    { href: '/locker', label: 'Property Locker', icon: <Vault size={15}/> },
    { href: '/documents', label: 'Document Library', icon: <BookOpen size={15}/> },
    { href: '/directory', label: 'Legal Directory', icon: <Users size={15}/> },
    { href: '/contact', label: 'Contact', icon: <Phone size={15}/> },
  ];

  const allLinks = [...primaryLinks, ...moreLinks];

  const linkCls = (active: boolean) =>
    `relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'text-brand bg-brand-soft' : 'text-ink-soft hover:text-ink hover:bg-surface-soft'
    }`;

  return (
    <nav className="fixed top-0 left-0 w-full z-[999] bg-surface/90 backdrop-blur-md border-b border-border shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_8px_-4px_rgba(22,36,31,0.08)]">
       <div className="max-w-[1280px] mx-auto px-4 h-16 flex justify-between items-center gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap group">
             {/* Shield mark: document rules + check, matches the favicon */}
             <span className="w-8 h-8 rounded-lg bg-gradient-to-b from-brand to-brand-strong text-white flex items-center justify-center shadow-sm ring-1 ring-brand-strong/60 transition-transform group-hover:scale-105">
               <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                 <path d="M16 5.5l7.5 3v7c0 5.2-3.2 9-7.5 11-4.3-2-7.5-5.8-7.5-11v-7l7.5-3z" fill="rgba(255,255,255,0.14)" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                 <path d="M12.6 12h6.8M12.6 14.8h6.8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round" />
                 <path d="M12.7 18.6l2.3 2.3 4.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             </span>
             <span className="font-display text-lg font-bold text-ink tracking-tight">Satya-Lekh</span>
             {demoActive && (
               <span className="badge bg-warning-soft text-warning border border-warning-border text-[10px] uppercase tracking-wide">
                 Demo
               </span>
             )}
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex gap-0.5 items-center">
            {primaryLinks.map((link) => {
               const isActive = pathname === link.href;
               return (
                 <Link key={link.href} href={link.href} className={linkCls(isActive)}>
                    {link.icon} {link.label}
                    {!!link.badge && link.badge > 0 && (
                      <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                 </Link>
               );
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={linkCls(moreLinks.some(l => l.href === pathname))}
              >
                More <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 card p-1.5 shadow-lg">
                  {moreLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === link.href ? 'text-brand bg-brand-soft font-medium' : 'text-ink-soft hover:bg-surface-soft'
                      }`}
                    >
                      {link.icon} {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {creditsInfo && (
              <Link
                href="/pricing"
                title={`Search credits for ${creditsInfo.email}`}
                className="ml-2 badge bg-brand-soft text-brand border border-brand-border hover:bg-brand-soft/70 transition-colors"
              >
                <Wallet size={12}/> {creditsInfo.credits} credit{creditsInfo.credits === 1 ? '' : 's'}
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-muted hover:text-ink transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
       </div>

       {/* Mobile Dropdown */}
       {mobileOpen && (
         <div className="lg:hidden px-4 pb-4 pt-2 border-t border-border bg-surface flex flex-col gap-0.5 max-h-[calc(100vh-64px)] overflow-y-auto">
           {allLinks.map((link) => {
              const isActive = pathname === link.href;
              const badge = 'badge' in link ? (link as { badge?: number }).badge : 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-brand bg-brand-soft' : 'text-ink-soft hover:bg-surface-soft'
                  }`}
                >
                   {link.icon} {link.label}
                   {!!badge && badge > 0 && (
                     <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                       {badge > 9 ? '9+' : badge}
                     </span>
                   )}
                </Link>
              );
           })}
           {creditsInfo && (
             <Link
               href="/pricing"
               onClick={() => setMobileOpen(false)}
               className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-brand"
             >
               <Wallet size={15}/> {creditsInfo.credits} search credit{creditsInfo.credits === 1 ? '' : 's'}
             </Link>
           )}
         </div>
       )}
    </nav>
  );
}
