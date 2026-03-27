"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, UploadCloud, Database, Phone, LayoutDashboard, User, TrendingUp, ShieldCheck } from 'lucide-react';

export default function TopNav() {
  const pathname = usePathname();

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
    <nav className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
       {/* Ensure the wrapper doesn't capture clicks on the map behind it, but buttons do */}
       <div className="flex gap-4 pointer-events-auto">
         {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold tracking-widest uppercase transition-colors backdrop-blur-md
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

       <div className="pointer-events-auto">
         <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-colors">
            Authorize Node
         </button>
       </div>
    </nav>
  );
}
