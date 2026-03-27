import React from 'react';
import { ChevronLeft, MapPin, Activity, TrendingUp, AlertCircle, FileText, Share2, CornerDownRight } from 'lucide-react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';

export default function PropertyDetail({ params }: { params: { id?: string } }) {
  // Mock data tailored for the dynamic route
  const propertyId = (params?.id || 'SURVEY-XX').toUpperCase();
  const isEncumbered = propertyId === "SURVEY-88";

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
                 <span className={`px-3 py-1 text-xs uppercase font-bold tracking-widest border ${isEncumbered ? 'bg-[#ba1b24]/10 text-[#ba1b24] border-[#ba1b24]/50' : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/50'}`}>
                    {isEncumbered ? 'ENCUMBERED' : 'CLEAR TITLE'}
                 </span>
              </div>
              <p className="text-[#849495] font-sans text-sm tracking-widest uppercase flex items-center gap-2">
                 <MapPin size={14} className="text-[#00f0ff]"/> Sector 4, {propertyId === 'SURVEY-88' ? 'Bopal' : 'Shela'}, Ahmedabad Region
              </p>
           </div>
           
           <div className="flex gap-4">
              <button className="px-6 py-3 border border-[#3b494b] text-[#849495] text-xs font-bold tracking-widest uppercase hover:bg-[#1c1b1b] hover:text-[#dbfcff] transition-all flex items-center gap-2">
                 <Share2 size={14}/> Share Intel
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-[#00dbe9] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all flex items-center gap-2">
                 <FileText size={14}/> Download 7/12
              </button>
           </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left/Main Column - Details & Deals */}
           <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Core Land Intelligence */}
              <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#1c1b1b]/50">
                 <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2">Core Land Intelligence</h2>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Total Area</span>
                       <span className="text-lg font-display text-[#dbfcff]">14,500 sq.m</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Zone Type</span>
                       <span className="text-lg font-display text-[#dbfcff]">R1 (Residential)</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">Current Est. Value</span>
                       <span className="text-lg font-display text-[#4edea3]">₹4.2 Cr</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-[#849495] tracking-[0.2em] font-bold uppercase">FSI Limit</span>
                       <span className="text-lg font-display text-[#dbfcff]">2.7</span>
                    </div>
                 </div>
              </div>

              {/* Comparable Deals Nearby */}
              <div className="glass-panel p-8 border border-[#3b494b]/40">
                 <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-2 mb-6">
                    <h2 className="text-xl font-display uppercase text-[#00f0ff] flex items-center gap-2">
                       <TrendingUp size={18} /> Comparable Vicinity Deals
                    </h2>
                    <span className="text-xs text-[#849495] font-sans tracking-widest uppercase">Last 6 Months</span>
                 </div>

                 <div className="flex flex-col gap-4">
                    {[
                      { dist: "0.2 km", id: "SURVEY-31", type: "R1 Plot", price: "₹3.8 Cr", dir: "North" },
                      { dist: "0.5 km", id: "SURVEY-42", type: "Commercial", price: "₹14.0 Cr", dir: "East" },
                      { dist: "1.1 km", id: "SURVEY-19", type: "Agriculture", price: "₹1.1 Cr", dir: "South-West" }
                    ].map((deal, i) => (
                       <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#111111]/80 hover:bg-[#1c1b1b] border-l-2 border-[#00f0ff] transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="bg-[#00f0ff]/10 text-[#00f0ff] p-2 aspect-square flex items-center justify-center font-display text-xs">
                                {deal.dist}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-display uppercase text-sm">{deal.id} <span className="opacity-50">/</span> {deal.type}</span>
                                <span className="text-[10px] text-[#849495] tracking-widest uppercase mt-1">Target: {deal.dir}</span>
                             </div>
                          </div>
                          <div className="text-[#4edea3] font-display text-lg mt-2 md:mt-0">{deal.price}</div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Title Genealogy */}
              <div className="glass-panel p-8 border border-[#3b494b]/40">
                 <h2 className="text-xl font-display uppercase text-[#00f0ff] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2">
                    <AlertCircle size={18}/> Title Genealogy Chain
                 </h2>
                 <div className="flex flex-col relative border-l-2 border-[#3b494b]/40 ml-4 pl-6 py-2 gap-6 font-mono text-sm">
                    {/* Genesis Node */}
                    <div className="relative">
                       <div className="absolute w-4 h-4 rounded-full bg-[#849495] border-[3px] border-[#0a0a0a] -left-[33px] top-1"></div>
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase mb-1 block">1982 • Genesis Allocation</span>
                       <div className="text-[#dbfcff]">Original Allotment to <span className="text-[#4edea3]">Shri Ramanlal Patel</span></div>
                       <span className="text-xs text-[#849495]">Entry No: 4421/V</span>
                    </div>
                    {/* Intermediate Transfer */}
                    <div className="relative">
                       <div className="absolute w-4 h-4 rounded-full bg-[#849495] border-[3px] border-[#0a0a0a] -left-[33px] top-1"></div>
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase mb-1 block">2005 • Inheritance Transfer</span>
                       <div className="text-[#dbfcff]">Transferred to Legal Heirs (3 Partitions)</div>
                       <span className="text-xs text-[#849495]">Entry No: 8892/Inheritance</span>
                    </div>
                    {/* Current Node */}
                    <div className="relative">
                       <div className="absolute w-4 h-4 rounded-full bg-[#00f0ff] border-[3px] border-[#0a0a0a] -left-[33px] top-1 shadow-[0_0_10px_#00f0ff]"></div>
                       <span className="text-[10px] text-[#00f0ff] font-bold tracking-[0.2em] uppercase mb-1 block">2021 • Corporate Conveyance</span>
                       <div className="text-[#dbfcff]">Sale Deed registered to <span className="font-bold text-[#dbfcff]">Satya-Lekh Infrastructure</span></div>
                       <span className="text-xs text-[#00f0ff]">Entry No: 1102/Sale</span>
                    </div>
                 </div>
              </div>

              {/* Heritage Proximity Audit */}
              <div className="glass-panel p-8 border border-[#3b494b]/40">
                 <h2 className="text-xl font-display uppercase text-[#de4ced] mb-6 border-b border-[#3b494b]/40 pb-2 flex items-center gap-2">
                    <Activity size={18}/> Heritage & NMA Proximity
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 border-[#de4ced]">
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Closest Protected Monument</span>
                       <span className="text-lg font-display text-[#dbfcff]">Sarkhej Roza Complex</span>
                       <span className="text-xs font-mono text-[#de4ced] mt-1">Distance: 420 meters</span>
                    </div>
                    <div className="flex flex-col gap-2 p-4 bg-[#111111]/80 border-l-2 border-[#ba1b24]">
                       <span className="text-[10px] text-[#849495] tracking-widest uppercase font-bold">Regulatory Impact</span>
                       <span className="text-sm font-sans text-[#dbfcff]/90">
                          Falls within the <span className="text-[#ba1b24] font-bold mt-1">Regulated Zone (100m-300m buffer rules)</span>.
                       </span>
                       <span className="text-xs font-mono text-[#ba1b24] mt-1">NMA NOC Required for modification.</span>
                    </div>
                 </div>
              </div>

           </div>

           {/* Right Column - Updates & Risks */}
           <div className="flex flex-col gap-6">
              
              {/* Live Automated Updates */}
              <div className="glass-panel p-6 border border-[#3b494b]/40 sticky top-24">
                 <h2 className="text-lg font-display uppercase text-[#dbfcff] flex items-center gap-2 mb-6">
                    <Activity size={16} className="text-[#00f0ff]"/> Tactical Network Updates
                 </h2>

                 <div className="relative border-l border-[#3b494b]/60 ml-2 pl-6 flex flex-col gap-8">
                    
                    <div className="relative">
                       <div className="absolute w-3 h-3 bg-[#00f0ff] rounded-full -left-[31px] top-1 shadow-[0_0_10px_#00f0ff]"></div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#00f0ff] font-bold tracking-[0.15em] uppercase">Today, 14:00</span>
                          <span className="text-sm font-sans text-[#dbfcff]">GDCR Alert: FSI increased to 2.7 in this micro-market.</span>
                       </div>
                    </div>

                    <div className="relative">
                       <div className={`absolute w-3 h-3 rounded-full -left-[31px] top-1 ${isEncumbered ? 'bg-[#ba1b24] shadow-[0_0_10px_#ba1b24]' : 'bg-[#849495]'}`}></div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#849495] font-bold tracking-[0.15em] uppercase">2 Weeks Ago</span>
                          <span className="text-sm font-sans text-[#dbfcff]/80">
                             {isEncumbered ? 'Bank of Baroda lodged a mortgage claim of ₹45L on this sector.' : 'Quarterly land tax cleared. Zero pending municipal dues.'}
                          </span>
                       </div>
                    </div>

                    <div className="relative">
                       <div className="absolute w-3 h-3 bg-[#849495] rounded-full -left-[31px] top-1"></div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#849495] font-bold tracking-[0.15em] uppercase">4 Months Ago</span>
                          <span className="text-sm font-sans text-[#dbfcff]/80">TP Road expansion announced. 40ft road adjacent to North border approved.</span>
                       </div>
                    </div>

                 </div>

                 {isEncumbered && (
                   <div className="mt-8 p-4 bg-[#ba1b24]/10 border border-[#ba1b24]/40 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-[#ba1b24] text-xs font-bold tracking-widest uppercase">
                         <AlertCircle size={14}/> Resolving Action Required
                      </div>
                      <p className="text-xs text-[#dbfcff]/80">
                         This property currently holds a severe risk flag. Connect with our Legal Authority terminal to begin dispute resolution.
                      </p>
                      <Link href="/directory" className="mt-2 text-[10px] uppercase font-bold text-[#ba1b24] border border-[#ba1b24] px-4 py-2 text-center hover:bg-[#ba1b24] hover:text-[#0a0a0a] transition-colors flex items-center justify-center gap-2">
                         Hire Legal Counsel <CornerDownRight size={12}/>
                      </Link>
                   </div>
                 )}
              </div>

           </div>
           
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
