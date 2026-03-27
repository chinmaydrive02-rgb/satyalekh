"use client";

import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import { Shield, FileText, AlertTriangle, Cpu, Terminal, ChevronRight, Hash, CheckCircle2 } from 'lucide-react';

export default function ComplianceTerminal() {
  const [activeHash, setActiveHash] = useState('7f4...91e');

  const registryDocs = [
    { title: "Land Parcel #784/BK", hash: "0x7f4...91e", status: "VERIFIED" },
    { title: "Conveyance - Satya-Lekh Corp", hash: "0xa42...3cc", status: "VERIFIED" },
    { title: "Safety Clearance #102", hash: "0x981...ff0", status: "PENDING" },
    { title: "Certificate of Allotment", hash: "0x3d2...11b", status: "VERIFIED" },
    { title: "FY 2023-24 Clearance", hash: "0xbb0...45a", status: "VERIFIED" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />
      
      <div className="z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 h-[calc(100vh-120px)]">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#3b494b]/40 pb-4 gap-4 flex-shrink-0">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-4xl font-display uppercase tracking-tight text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">Sovereign Compliance Terminal</h1>
                 <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-[#ba1b24]/10 text-[#ba1b24] border border-[#ba1b24]/50 flex items-center gap-2">
                    <Shield size={12}/> LEVEL 4 CLEARANCE REQUIRED
                 </span>
              </div>
              <p className="text-[#849495] font-sans text-xs tracking-widest uppercase flex items-center gap-2">
                 <Terminal size={14} className="text-[#4edea3]"/> Immutable Blockchain Record & Autonomic Legal Counsel Active
              </p>
           </div>
           
           <div className="flex gap-4">
              <div className="glass-panel p-3 border-[#00f0ff]/30 text-right">
                 <span className="text-[10px] text-[#849495] uppercase tracking-widest">Network Status</span>
                 <div className="text-sm font-bold text-[#4edea3] flex items-center justify-end gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></div> SECURE LINK
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
           
           {/* Left Column - Hashes & Registry */}
           <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar shrink-0">
              <div className="text-xs font-bold text-[#849495] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <Hash size={14}/> Encrypted Registry Tokens
              </div>
              
              <div className="flex flex-col gap-3">
                 {registryDocs.map((doc, i) => (
                    <div 
                      key={i}
                      onClick={() => setActiveHash(doc.hash)}
                      className={`p-5 border cursor-pointer transition-all flex flex-col gap-3 relative group
                        ${activeHash === doc.hash 
                           ? 'bg-[#00f0ff]/10 border-[#00f0ff] border-l-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                           : 'bg-[#1c1b1b]/50 border-[#3b494b]/40 hover:border-[#00f0ff]/50'
                        }
                      `}
                    >
                       <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${doc.status === 'VERIFIED' ? 'text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/30' : 'text-[#ba1b24] bg-[#ba1b24]/10 border-[#ba1b24]/30'}`}>
                             {doc.status}
                          </span>
                          {doc.status === 'VERIFIED' ? <CheckCircle2 size={16} className="text-[#4edea3]"/> : <AlertTriangle size={16} className="text-[#ba1b24] animate-pulse"/>}
                       </div>
                       <div>
                         <h3 className="text-md font-display text-[#dbfcff] uppercase">{doc.title}</h3>
                         <span className="text-[10px] mt-1 font-mono text-[#849495] group-hover:text-[#00f0ff]/70 transition-colors flex items-center gap-1">
                            SHA-256: {doc.hash}
                         </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Right Column - Matrix Viewer & AI Counsel */}
           <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                 
                 {/* Raw Title Matrix */}
                 <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#0a0f0f]/90 relative h-full min-h-[500px] flex flex-col shadow-[inset_0_0_30px_rgba(0,240,255,0.03)]">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,240,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full">
                       <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4 mb-6">
                          <h2 className="text-xl font-display uppercase tracking-wider text-[#dbfcff] flex items-center gap-2">
                             <FileText size={20} className="text-[#00f0ff]"/> INTELLIGENCE_MATRIX_784.DAT
                          </h2>
                          <span className="text-[10px] tracking-widest uppercase text-[#00f0ff] bg-[#00f0ff]/10 px-3 py-1 border border-[#00f0ff]/30">
                             DECODED PAYLOAD
                          </span>
                       </div>

                       <div className="font-mono text-sm leading-relaxed text-[#dbfcff]/80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                          
                          <div className="border border-[#4edea3]/30 bg-[#4edea3]/5 p-4 relative">
                             <div className="absolute top-0 left-0 w-2 h-full bg-[#4edea3]"></div>
                             <p className="text-[#4edea3] font-bold uppercase tracking-widest text-xs mb-2">Validated Ownership Node</p>
                             <div className="flex justify-between items-end border-b border-[#3b494b] pb-2 mb-2">
                                <span className="text-[#849495] text-[10px] uppercase tracking-widest">Entity Signature</span>
                                <span className="text-[#dbfcff]">SATYA-LEKH INFRASTRUCTURE PVT LTD</span>
                             </div>
                             <div className="flex justify-between items-end">
                                <span className="text-[#849495] text-[10px] uppercase tracking-widest">Aquisition Epoch</span>
                                <span className="text-[#4edea3]">12 MAY 2021 [BLOCK 4492910]</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-black/60 p-4 border border-[#3b494b]/40">
                                <span className="text-[10px] text-[#849495] uppercase tracking-widest block mb-1">Vector Coordinates</span>
                                <div className="text-sm text-[#00f0ff]">23.0225° N, 72.5714° E</div>
                             </div>
                             <div className="bg-black/60 p-4 border border-[#3b494b]/40">
                                <span className="text-[10px] text-[#849495] uppercase tracking-widest block mb-1">Spatial Extent (SQ.M)</span>
                                <div className="text-sm text-[#dbfcff]">14,500.00</div>
                             </div>
                          </div>

                          <div className="border border-[#ba1b24]/30 bg-[#ba1b24]/5 p-4 relative">
                             <div className="absolute top-0 left-0 w-2 h-full bg-[#ba1b24]"></div>
                             <p className="text-[#ba1b24] font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                                <AlertTriangle size={14}/> Active Encumbrance Warning
                             </p>
                             <p className="text-xs">
                                Registered collateral lien detected by node [ICICI_BANK_LTD]. 
                                <br/><span className="text-[#849495] mt-1 block">Value: INR 450,000,000. Discharge pending.</span>
                             </p>
                          </div>
                          
                          <div className="border border-[#eab308]/30 bg-[#eab308]/5 p-4 relative">
                             <div className="absolute top-0 left-0 w-2 h-full bg-[#eab308]"></div>
                             <p className="text-[#eab308] font-bold uppercase tracking-widest text-xs mb-2">Zoning Directive</p>
                             <p className="text-xs">
                                Classified R-1 Residential under AUDA Masterplan 2032. Commercial development strictly prohibited without supplementary premium conversion.
                             </p>
                          </div>
                          
                       </div>
                    </div>
                 </div>

                 {/* Diagnostics & Autopilot Counsel */}
                 <div className="flex flex-col gap-6 h-full">
                    
                    {/* Integrity Score */}
                    <div className="glass-panel p-8 border-t-2 border-[#de4ced] flex flex-col justify-center bg-gradient-to-b from-[#de4ced]/5 to-transparent flex-shrink-0">
                       <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#849495] mb-2">Autonomic Risk Assessment</h3>
                       <div className="text-4xl font-display text-[#de4ced] mb-1">
                          MODERATE YIELD RISK
                       </div>
                       <span className="text-xs text-[#dbfcff]/60 uppercase tracking-widest">
                          Clearance Coefficient: 68.4%
                       </span>
                       <div className="w-full bg-black/50 h-3 mt-6 border border-[#3b494b]/40 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#4edea3] via-[#de4ced] to-[#ba1b24] w-[68.4%] relative">
                             <div className="absolute top-0 right-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"></div>
                          </div>
                       </div>
                    </div>

                    {/* AI Directives */}
                    <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#00f0ff]/5 flex flex-col gap-5 flex-1 shadow-[0_0_30px_rgba(0,240,255,0.03)]">
                       <h3 className="text-sm font-display tracking-[0.1em] uppercase text-[#00f0ff] flex items-center gap-3 border-b border-[#00f0ff]/20 pb-3">
                          <Cpu size={18}/> Project Counsel Directives
                       </h3>
                       
                       <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 mt-2">
                          <div className="group">
                             <p className="flex items-start gap-3 text-sm font-mono text-[#dbfcff]/90">
                                <ChevronRight size={16} className="text-[#00f0ff] mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform"/>
                                AI detected spatial anomaly comparing Survey Boundaries (Record #102) against live Mapbox Satellite Vectors. 1.2% variance observed.
                             </p>
                          </div>
                          <div className="group">
                             <p className="flex items-start gap-3 text-sm font-mono text-[#dbfcff]/90">
                                <ChevronRight size={16} className="text-[#00f0ff] mt-0.5 shrink-0 group-hover:translate-x-1 transition-transform"/>
                                Lien discharge timeline misaligned with Project Alpha launch window. Expedited noc required from ICICI.
                             </p>
                          </div>
                          <div className="mt-4 p-4 border border-[#de4ced]/40 bg-[#de4ced]/10 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-[#de4ced]/20 blur-xl"></div>
                             <p className="text-[#de4ced] font-bold uppercase tracking-widest text-xs mb-2">▶ TACTICAL ACTION REQUIRED</p>
                             <p className="text-sm font-mono text-[#dbfcff]">
                                Initiate immediate Heritage Noc protocol via ASI Terminal. Proximity to Sarkhej Roza mandates Tier-2 Archaeological clearance within 14 days to prevent construction injunction.
                             </p>
                          </div>
                       </div>
                    </div>

                 </div>
              </div>

           </div>
        </div>
      </div>
      
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
