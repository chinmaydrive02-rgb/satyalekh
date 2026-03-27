"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Scale, Building, TrendingUp, User, MapPin, X } from 'lucide-react';

interface RiskCardProps {
  plot: any;
  onClose: () => void;
}

export default function RiskCard({ plot, onClose }: RiskCardProps) {
  if (!plot) return null;

  const isGreen = plot.risk_color === '#4edea3';
  const isRed = plot.risk_color === '#ba1b24';
  const isYellow = plot.risk_color === '#ffdad7';

  // Hardcoded FSI Logic
  const canDevelop = plot.zone_type === 'R1' && plot.road_width >= 18;
  const fsiContent = canDevelop ? (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-[#00f0ff]">
        <span className="opacity-70 tracking-wider font-sans">BASE FSI</span>
        <span className="font-display font-medium text-[16px]">1.8</span>
      </div>
      <div className="flex justify-between items-center text-xs text-[#00f0ff]">
        <span className="opacity-70 tracking-wider font-sans">PAID FSI</span>
        <span className="font-display font-medium text-[16px]">0.9</span>
      </div>
      <div className="h-[2px] w-full bg-[#3b494b] opacity-40 my-1"></div>
      <div className="flex justify-between items-center text-sm font-bold text-[#dbfcff]">
        <span className="tracking-widest">TOTAL</span>
        <span className="font-display text-[20px] text-[#00f0ff]">2.7</span>
      </div>
      <div className="mt-3 flex gap-2 items-center px-3 py-2 bg-[#2a2a2a] text-[#4edea3]">
        <TrendingUp size={14} strokeWidth={2.5}/>
        <span className="text-xs font-bold tracking-widest uppercase">Max Height: 45 Meters</span>
      </div>
    </div>
  ) : (
    <div className="mt-2 flex gap-2 items-center px-4 py-3 bg-[#1c1b1b] border border-[#3b494b]/40 text-[#ba1b24]">
      <ShieldAlert size={14} strokeWidth={2}/>
      <span className="text-xs font-bold uppercase tracking-widest">Restricted Development</span>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass-panel w-[380px] p-0 flex flex-col text-sm"
      >
        {/* Header Block */}
        <div className="px-6 py-5 border-b-2 border-b-[#3b494b]/40 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#dbfcff] font-display font-medium text-[24px] uppercase leading-none tracking-tight">
              Survey {plot.survey_number}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#00f0ff]/70 font-sans tracking-widest uppercase">
              <MapPin size={12} /> {plot.village_name} Village
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#dbfcff]/50 hover:text-[#00f0ff] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title Check Block */}
        <div className="px-6 py-6 border-b border-b-[#3b494b]/40 bg-[#131313]/30">
          <div className="flex items-center gap-2 mb-4 text-[#dbfcff]/50 text-xs font-bold tracking-[0.1em] uppercase">
             <User size={12}/> Ownership Verification
          </div>
          
          <div className="text-[18px] text-[#dbfcff] font-display font-medium mb-1">
            {plot.owner_name}
          </div>
          <div className="flex justify-between items-center text-xs opacity-70 mb-5">
            <span className="font-sans font-medium uppercase tracking-wider">Tenure Type</span>
            <span className="text-[#dbfcff]">{plot.tenure_type}</span>
          </div>

          {/* Legal Risk Meter */}
          <div className={`px-4 py-3 flex items-center justify-between text-xs font-bold tracking-widest uppercase 
            ${isRed ? 'bg-[#ba1b24]/20 border-[#ba1b24]/50 text-[#ba1b24]' : 
              (isYellow ? 'bg-[#ffdad7]/10 border-[#ffdad7]/30 text-[#ffdad7]' : 
              'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]')}
             border`}
          >
            <span className="flex items-center gap-2">
              <Scale size={14} /> Litigation Status
            </span>
            <span>{plot.is_litigated ? 'Active Dispute' : 'Clear Title'}</span>
          </div>
        </div>

        {/* Investment Potential Block */}
        <div className="px-6 py-6 bg-[#0e0e0e]/40">
           <div className="flex items-center gap-2 mb-5 text-[#dbfcff]/50 text-xs font-bold tracking-[0.1em] uppercase">
             <Building size={12}/> Investment Potential (GDCR)
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1">
               <span className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Zone Type</span>
               <span className="text-[#dbfcff] font-display text-[15px]">{plot.zone_type}</span>
            </div>
            <div className="flex flex-col gap-1">
               <span className="text-[#849495] text-[10px] font-bold tracking-widest uppercase">Road Width</span>
               <span className="text-[#dbfcff] font-display text-[15px]">{plot.road_width}m</span>
            </div>
          </div>

          {fsiContent}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
