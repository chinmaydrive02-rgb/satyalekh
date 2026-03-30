"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Activity, AlertCircle, FileText, Share2, Database, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function PropertyDetail({ params }: { params: { id?: string } }) {
  const propertyId = (params?.id || 'SURVEY-XX').toUpperCase();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to fetch real data from backend on mount
  useEffect(() => {
    const fetchPropertyData = async () => {
      setIsLoading(true);
      try {
        const surveyNum = propertyId.replace('SURVEY-', '');
        const res = await fetch(`http://localhost:8000/fetch-anyror`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ survey_no: surveyNum, district: 'Ahmedabad', taluka: 'Ahmedabad_City', village: 'Navrangpura' })
        });
        if (res.ok) {
          const data = await res.json();
          setRecord(data);
        } else {
          setError("Could not fetch record from backend.");
        }
      } catch {
        setError("Backend not available. Start the RPA server to view real property data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPropertyData();
  }, [propertyId]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Navigation Breadcrumb */}
        <Link href="/dashboard" className="flex items-center gap-2 text-[#00f0ff] text-xs font-bold uppercase tracking-widest hover:text-[#dbfcff] transition-colors w-fit">
          <ChevronLeft size={16} /> Return to Portfolio
        </Link>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#3b494b]/40 pb-6 gap-4">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-5xl font-display uppercase tracking-tight">{propertyId}</h1>
              </div>
              <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
                 <MapPin size={14} className="text-[#00f0ff]"/> {record?.village || '—'}, {record?.district || '—'}
              </p>
           </div>
           
           <div className="flex gap-4">
              <button className="px-6 py-3 border border-[#3b494b] text-[#849495] text-xs font-bold tracking-widest uppercase hover:bg-[#1c1b1b] hover:text-[#dbfcff] transition-all flex items-center gap-2">
                 <Share2 size={14}/> Share Intel
              </button>
              <Link href="/upload" className="px-6 py-3 bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all flex items-center gap-2">
                 <Search size={14}/> Fetch via RPA
              </Link>
           </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="text-[#00f0ff] animate-spin" />
            <span className="text-xs text-[#849495] uppercase tracking-widest">Querying Backend for Real Property Data...</span>
          </div>
        )}

        {/* Error / No Data State */}
        {!isLoading && error && (
          <div className="glass-panel p-12 flex flex-col items-center gap-6 text-center border border-[#3b494b]/40">
            <Database size={48} className="text-[#3b494b]" />
            <div>
              <h2 className="text-xl font-display uppercase mb-2 text-[#849495]">No Record Data Available</h2>
              <p className="text-xs text-[#3b494b] max-w-md">
                {error}
              </p>
            </div>
            <Link 
              href="/upload"
              className="px-8 py-3 bg-gradient-to-r from-[#de4ced] to-[#ff00f0] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all"
            >
              Fetch Record via Title Scanner
            </Link>
          </div>
        )}

        {/* Real Data Display */}
        {!isLoading && record && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Left/Main Column - Details */}
             <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Core Land Intelligence */}
                <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#1c1b1b]/50">
                   <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2">Core Land Intelligence</h2>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Owner Name</span>
                         <span className="text-lg font-display text-[#dbfcff]">{record.owner_name || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Total Area</span>
                         <span className="text-lg font-display text-[#dbfcff]">{record.area || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Tenure Type</span>
                         <span className="text-lg font-display text-[#dbfcff]">{record.tenure_type || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Cultivation</span>
                         <span className="text-lg font-display text-[#dbfcff]">{record.cultivation || '—'}</span>
                      </div>
                   </div>
                </div>

                {/* Financial Data */}
                <div className="glass-panel p-8 border border-[#3b494b]/40">
                   <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2">
                      <Activity size={18}/> Financial Intelligence
                   </h2>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#4edea3]">
                         <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Jantri Rate</span>
                         <span className="text-lg font-display text-[#4edea3]">{record.jantri_rate || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#00f0ff]">
                         <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Last Sale</span>
                         <span className="text-lg font-display text-[#dbfcff]">{record.last_sale || '—'}</span>
                      </div>
                   </div>
                </div>

                {/* Mutation & Encumbrances */}
                <div className="glass-panel p-8 border border-[#3b494b]/40">
                   <h2 className="text-xl font-display uppercase text-[#de4ced] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2">
                      <AlertCircle size={18}/> Risk Assessment
                   </h2>
                   <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 border-[#849495]">
                         <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Mutation Entries</span>
                         <span className="text-sm font-mono text-[#dbfcff]">{record.mutation_entries || 'No mutation data'}</span>
                      </div>
                      <div className="flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 border-[#ba1b24]">
                         <span className="text-[10px] text-[#ba1b24] tracking-widest uppercase font-bold">Encumbrances</span>
                         <span className="text-sm font-mono text-[#ba1b24]">{record.encumbrances || 'None detected'}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right Column - Location & Actions */}
             <div className="flex flex-col gap-6">
                <div className="glass-panel p-6 border border-[#3b494b]/40 sticky top-24">
                   <h2 className="text-lg font-display uppercase text-[#dbfcff] flex items-center gap-2 mb-6">
                      <FileText size={16} className="text-[#00f0ff]"/> Record Summary
                   </h2>

                   <div className="flex flex-col gap-4 text-sm">
                      <div className="flex justify-between border-b border-[#3b494b]/20 pb-2">
                         <span className="text-[#849495] text-xs uppercase tracking-widest">Survey No.</span>
                         <span className="text-[#dbfcff] font-mono">{record.survey_no || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#3b494b]/20 pb-2">
                         <span className="text-[#849495] text-xs uppercase tracking-widest">Village</span>
                         <span className="text-[#dbfcff]">{record.village || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#3b494b]/20 pb-2">
                         <span className="text-[#849495] text-xs uppercase tracking-widest">District</span>
                         <span className="text-[#dbfcff]">{record.district || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#3b494b]/20 pb-2">
                         <span className="text-[#849495] text-xs uppercase tracking-widest">Taluka</span>
                         <span className="text-[#dbfcff]">{record.taluka?.replace(/_/g, ' ') || '—'}</span>
                      </div>
                   </div>

                   <div className="mt-6 flex flex-col gap-3">
                      <Link 
                        href="/upload"
                        className="w-full py-3 text-center text-[#0a0a0a] bg-[#4edea3] hover:bg-[#dbfcff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
                      >
                        Re-fetch via Title Scanner
                      </Link>
                      <Link 
                        href="/compliance"
                        className="w-full py-3 text-center text-[#dbfcff] border border-[#3b494b] bg-black/40 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
                      >
                        View Compliance Report
                      </Link>
                   </div>
                </div>
             </div>
             
          </div>
        )}
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
