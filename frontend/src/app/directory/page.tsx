"use client";

import React from 'react';
import { Phone, MapPin, Scale, Shield } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';

export default function Directory() {
  const firms = [
    {
      name: "Chinmay Mistry",
      specialty: "Lead Counsel & System Architect",
      rating: "Verified",
      address: "Ahmedabad, Gujarat",
      contact: "+91 7487070961",
      tier: "Advocate",
      icon: <Scale className="text-brand" size={22}/>
    },
    {
      name: "NIC Gujarat Point of Contact",
      specialty: "Government Data Gateway",
      rating: "Govt. Authenticated",
      address: "Gandhinagar, Gujarat",
      contact: "1800-XXX-GOVT",
      tier: "Government",
      icon: <Shield className="text-success" size={22}/>
    }
  ];

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col pt-24 pb-12 px-4 sm:px-6">
      <TopNav />

      <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-8">
        <Reveal>
          <div className="border-b border-border pb-6">
             <p className="eyebrow mb-1">Directory</p>
             <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Legal Counsel Directory</h1>
             <p className="text-muted text-sm">
                Verified legal counsel for resolving title disputes, lifting encumbrances, and NA conversions.
             </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {firms.map((firm, idx) => (
            <Reveal key={idx} delay={80 + (idx % 3) * 100} variant="reveal-scale" className="h-full">
            <div className="card card-lift p-6 flex flex-col gap-4 hover:border-brand transition-colors h-full">
               <div className="flex justify-between items-start">
                  <span className="w-10 h-10 rounded-lg bg-surface-soft flex items-center justify-center">{firm.icon}</span>
                  <span className="badge bg-surface-soft text-muted border border-border">
                     {firm.tier}
                  </span>
               </div>

               <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-ink">{firm.name}</h3>
                  <span className="text-sm text-brand mt-0.5">{firm.specialty}</span>
               </div>

               <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted">
                     <MapPin size={13}/> {firm.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                     <Phone size={13}/> {firm.contact}
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-border flex justify-between items-center gap-3">
                  <span className="text-xs font-semibold text-success">{firm.rating}</span>
                  <button className="btn btn-outline py-2 px-4 text-sm">
                     Contact
                  </button>
               </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
