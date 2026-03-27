"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, UploadCloud, Database, Phone, LayoutDashboard, User, TrendingUp, ShieldCheck, Menu, X } from 'lucide-react';

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: 'Intel Map', icon: <Map size={14}/> },
    { href: '/dashboard', label: 'Portfolio', icon: <LayoutDashboard size={14}/> },
    { href: '/market', label: 'Market Intel', icon: <TrendingUp size={14}/> },
    { href: '/compliance', label: 'Compliance Audit', icon: <ShieldCheck size={14}/> },
    { href: '/upload', label: 'Title Scanner', icon: <UploadCloud size={14}/> },
    { href: '/directory', label: 'Legal Counsel', icon: <Phone size={14}/> },
    { href: '/pricing', label: 'API / Pricing', icon: <Database size={14}/> },
    { href: '/contact', label: 'Contact', icon: <User size={14}/> },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-[999] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#3b494b]/30">
       <div className="max-w-[1600px] mx-auto px-4 py-3 flex justify-between items-center">
          {/* Brand */}
          <Link href="/" className="text-[#00f0ff] font-display text-lg uppercase tracking-wider font-bold whitespace-nowrap">
             Satya-Lekh
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex gap-2 items-center">
            {links.map((link) => {
               const isActive = pathname === link.href;
               return (
                 <Link 
                   key={link.href} 
                   href={link.href}
                   className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold tracking-widest uppercase transition-colors
                     ${isActive 
                       ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]' 
                       : 'bg-[#1c1b1b]/80 border-[#3b494b]/40 text-[#849495] hover:border-[#00f0ff]/50 hover:text-[#dbfcff]'}
                   `}
                 >
                    {link.icon} {link.label}
                 </Link>
               )
            })}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#849495] hover:text-[#00f0ff]">
            {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
       </div>

       {/* Mobile Dropdown */}
       {mobileOpen && (
         <div className="lg:hidden px-4 pb-4 flex flex-wrap gap-2 border-t border-[#3b494b]/20 pt-3">
           {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] font-bold tracking-widest uppercase transition-colors
                    ${isActive 
                      ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]' 
                      : 'bg-[#1c1b1b]/80 border-[#3b494b]/40 text-[#849495] hover:border-[#00f0ff]/50 hover:text-[#dbfcff]'}
                  `}
                >
                   {link.icon} {link.label}
                </Link>
              )
           })}
         </div>
       )}
    </nav>
  );
}
