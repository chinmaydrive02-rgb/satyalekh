"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Scale, Building, TrendingUp, User, MapPin, X } from 'lucide-react';

interface RiskCardProps {
  plot: any;
  onClose: () => void;
}

export default function RiskCard({ plot, onClose }: RiskCardProps) {
  if (!plot) return null;

  // Hardcoded FSI Logic
  const canDevelop = plot.zone_type === 'R1' && plot.road_width >= 18;
  const fsiContent = canDevelop ? (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm text-ink-soft">
        <span className="text-muted">Base FSI</span>
        <span className="font-mono font-semibold text-ink">1.8</span>
      </div>
      <div className="flex justify-between items-center text-sm text-ink-soft">
        <span className="text-muted">Paid FSI</span>
        <span className="font-mono font-semibold text-ink">0.9</span>
      </div>
      <div className="h-px w-full bg-border my-1"></div>
      <div className="flex justify-between items-center text-sm font-semibold text-ink">
        <span>Total</span>
        <span className="font-mono text-lg text-brand">2.7</span>
      </div>
      <div className="mt-3 flex gap-2 items-center px-3 py-2 rounded-lg bg-success-soft text-success border border-success-border">
        <TrendingUp size={14} strokeWidth={2.5}/>
        <span className="text-xs font-semibold">Max height: 45 metres</span>
      </div>
    </div>
  ) : (
    <div className="mt-2 flex gap-2 items-center px-4 py-3 rounded-lg bg-danger-soft border border-danger-border text-danger">
      <ShieldAlert size={14} strokeWidth={2}/>
      <span className="text-xs font-semibold">Restricted development</span>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="card w-[380px] max-w-full p-0 flex flex-col text-sm shadow-lg overflow-hidden"
      >
        {/* Header Block */}
        <div className="px-6 py-5 border-b border-border flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-ink font-semibold text-xl">
              Survey <span className="font-mono">{plot.survey_number}</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin size={12} /> {plot.village_name} village
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title Check Block */}
        <div className="px-6 py-5 border-b border-border">
          <div className="eyebrow flex items-center gap-1.5 mb-3">
             <User size={11}/> Ownership Verification
          </div>

          <div className="text-base text-ink font-semibold mb-1">
            {plot.owner_name}
          </div>
          <div className="flex justify-between items-center text-xs text-muted mb-4">
            <span>Tenure type</span>
            <span className="text-ink-soft font-medium">{plot.tenure_type}</span>
          </div>

          {/* Legal Risk Meter */}
          <div className={`px-4 py-3 rounded-lg flex items-center justify-between text-xs font-semibold border
            ${plot.is_litigated
              ? 'bg-danger-soft border-danger-border text-danger'
              : 'bg-success-soft border-success-border text-success'}`}
          >
            <span className="flex items-center gap-2">
              <Scale size={14} /> Litigation status
            </span>
            <span>{plot.is_litigated ? 'Active dispute' : 'Clear title'}</span>
          </div>
        </div>

        {/* Investment Potential Block */}
        <div className="px-6 py-5 bg-surface-soft/50">
           <div className="eyebrow flex items-center gap-1.5 mb-4">
             <Building size={11}/> Development Potential (GDCR)
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-0.5">
               <span className="eyebrow">Zone type</span>
               <span className="text-ink font-mono text-sm">{plot.zone_type}</span>
            </div>
            <div className="flex flex-col gap-0.5">
               <span className="eyebrow">Road width</span>
               <span className="text-ink font-mono text-sm">{plot.road_width}m</span>
            </div>
          </div>

          {fsiContent}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
