"use client";

import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import { Shield, FileText, AlertTriangle, Cpu, Terminal, ChevronRight, Hash, CheckCircle2, FolderOpen, Search } from 'lucide-react';
import Link from 'next/link';

export default function ComplianceTerminal() {
  // No hardcoded fake documents — data comes from scanned records
  const [registryDocs] = useState<any[]>([]);
  const [activeHash, setActiveHash] = useState<string | null>(null);

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
                 <Terminal size={14} className="text-[#4edea3]"/> Blockchain-Immutable Record Verification & Autonomic Legal Counsel
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
           
           {/* Left Column - Registry Tokens */}
           <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar shrink-0">
              <div className="text-xs font-bold text-[#849495] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <Hash size={14}/> Encrypted Registry Tokens
              </div>
              
              {registryDocs.length === 0 ? (
                <div className="flex flex-col items-center gap-6 py-16 text-center">
                  <FolderOpen size={48} className="text-[#3b494b]" />
                  <div>
                    <h3 className="text-sm font-display uppercase text-[#849495] mb-2">No Verified Documents</h3>
                    <p className="text-[10px] text-[#3b494b] max-w-[280px] mx-auto">
                      Scan land records via the Title Scanner to generate compliance tokens and blockchain verification hashes.
                    </p>
                  </div>
                  <Link 
                    href="/upload"
                    className="px-6 py-3 bg-gradient-to-r from-[#de4ced] to-[#ff00f0] text-[#002022] text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    <Search size={12}/> Go to Title Scanner
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   {registryDocs.map((doc: any, i: number) => (
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
              )}
           </div>

           {/* Right Column - AI Counsel Overview */}
           <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                 
                 {/* Matrix Viewer - Empty State */}
                 <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#0a0f0f]/90 relative h-full min-h-[500px] flex flex-col shadow-[inset_0_0_30px_rgba(0,240,255,0.03)]">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,240,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full">
                       <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4 mb-6">
                          <h2 className="text-xl font-display uppercase tracking-wider text-[#dbfcff] flex items-center gap-2">
                             <FileText size={20} className="text-[#00f0ff]"/> INTELLIGENCE_MATRIX.DAT
                          </h2>
                          <span className="text-[10px] tracking-widest uppercase text-[#849495] bg-[#1c1b1b] px-3 py-1 border border-[#3b494b]/30">
                             AWAITING DATA
                          </span>
                       </div>

                       <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                          <Cpu size={48} className="text-[#3b494b]" />
                          <p className="text-xs text-[#849495] uppercase tracking-widest max-w-[300px]">
                            No compliance data loaded. Use the Title Scanner to fetch and verify a land record first.
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Diagnostics & Autopilot Counsel */}
                 <div className="flex flex-col gap-6 h-full">
                    
                    {/* Integrity Score */}
                    <div className="glass-panel p-8 border-t-2 border-[#3b494b] flex flex-col justify-center flex-shrink-0">
                       <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#849495] mb-2">Autonomic Risk Assessment</h3>
                       <div className="text-4xl font-display text-[#849495] mb-1">
                          NO DATA
                       </div>
                       <span className="text-xs text-[#dbfcff]/40 uppercase tracking-widest">
                          Clearance Coefficient: —
                       </span>
                       <div className="w-full bg-black/50 h-3 mt-6 border border-[#3b494b]/40 overflow-hidden">
                          <div className="h-full bg-[#3b494b]/30 w-0"></div>
                       </div>
                    </div>

                    {/* AI Counsel - Empty */}
                    <div className="glass-panel p-8 border border-[#3b494b]/40 bg-[#111]/50 flex flex-col gap-5 flex-1">
                       <h3 className="text-sm font-display tracking-[0.1em] uppercase text-[#849495] flex items-center gap-3 border-b border-[#3b494b]/20 pb-3">
                          <Cpu size={18}/> Project Counsel Directives
                       </h3>
                       
                       <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                          <ChevronRight size={32} className="text-[#3b494b]" />
                          <p className="text-xs text-[#3b494b] max-w-[280px]">
                            AI counsel directives will appear here once a land record has been scanned and verified through the system.
                          </p>
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
