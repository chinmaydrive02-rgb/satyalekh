"use client";

import React, { useState, useMemo } from 'react';
import TopNav from '@/components/TopNav';
import { Shield, Calculator, AlertTriangle, Ruler, Building2, IndianRupee, Info, Landmark } from 'lucide-react';

// ── CGDCR-2017 (Gujarat Comprehensive GDCR) indicative zone parameters ──
// Base FSI is free; additional "chargeable" FSI is purchasable up to the max,
// priced as a percentage of the jantri (government) land rate.
// These are simplified planning figures — final values depend on the local
// Development Plan, road width, plot size and use. Always verify with AUDA/
// local authority before transacting.
const ZONES = [
  { key: 'R1',   label: 'R1 — Residential Zone 1',        baseFsi: 1.8, maxFsi: 2.7, coverage: 0.45 },
  { key: 'R2',   label: 'R2 — Residential Zone 2',        baseFsi: 1.2, maxFsi: 1.8, coverage: 0.45 },
  { key: 'R3',   label: 'R3 — Residential (Gamtal Edge)', baseFsi: 1.0, maxFsi: 1.0, coverage: 0.50 },
  { key: 'COM',  label: 'Commercial / C Zone',            baseFsi: 1.8, maxFsi: 4.0, coverage: 0.50 },
  { key: 'TOZ',  label: 'Transit Oriented Zone (BRTS/Metro)', baseFsi: 1.8, maxFsi: 4.0, coverage: 0.50 },
  { key: 'IND',  label: 'Industrial Zone',                baseFsi: 1.0, maxFsi: 1.2, coverage: 0.55 },
  { key: 'AG',   label: 'Agricultural / No-Development',  baseFsi: 0.0, maxFsi: 0.0, coverage: 0.00 },
];

// Road width limits the FSI you can actually use (CGDCR table — simplified)
const ROADS = [
  { key: 'lt9',   label: 'Below 9 m',  fsiCap: 1.2 },
  { key: '9to12', label: '9 – 12 m',   fsiCap: 1.8 },
  { key: '12to18',label: '12 – 18 m',  fsiCap: 2.7 },
  { key: 'gte18', label: '18 m & above', fsiCap: 4.0 },
];

// Chargeable FSI premium ≈ 40% of jantri rate per sq m of extra built-up area
const CHARGEABLE_FSI_JANTRI_FACTOR = 0.4;

export default function ComplianceCalculator() {
  const [zoneKey, setZoneKey] = useState('R1');
  const [roadKey, setRoadKey] = useState('12to18');
  const [plotArea, setPlotArea] = useState('');
  const [jantri, setJantri] = useState('');

  const zone = ZONES.find(z => z.key === zoneKey)!;
  const road = ROADS.find(r => r.key === roadKey)!;

  const result = useMemo(() => {
    const area = parseFloat(plotArea);
    if (!area || area <= 0 || zone.maxFsi === 0) return null;
    const baseFsi = Math.min(zone.baseFsi, road.fsiCap);
    const maxFsi = Math.min(zone.maxFsi, road.fsiCap);
    const baseBuiltUp = area * baseFsi;
    const maxBuiltUp = area * maxFsi;
    const chargeableArea = Math.max(0, maxBuiltUp - baseBuiltUp);
    const jantriRate = parseFloat(jantri) || 0;
    const premiumCost = chargeableArea * jantriRate * CHARGEABLE_FSI_JANTRI_FACTOR;
    const groundCoverage = area * zone.coverage;
    const roadLimited = road.fsiCap < zone.maxFsi;
    return { baseFsi, maxFsi, baseBuiltUp, maxBuiltUp, chargeableArea, premiumCost, groundCoverage, roadLimited };
  }, [plotArea, jantri, zone, road]);

  const inputCls = "w-full px-4 py-3 bg-[#111] border border-[#3b494b] text-[#dbfcff] text-sm font-mono focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#3b494b]";
  const labelCls = "text-[#849495] text-[10px] font-bold tracking-widest uppercase";
  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] flex flex-col pt-24 pb-12 px-6 relative overflow-hidden">
      <TopNav />

      <div className="z-10 w-full max-w-[1100px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#3b494b]/40 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-display uppercase tracking-tight text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">GDCR Compliance Engine</h1>
              <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/50 flex items-center gap-2">
                <Shield size={12}/> CGDCR-2017 BASIS
              </span>
            </div>
            <p className="text-[#849495] font-sans text-xs tracking-widest uppercase flex items-center gap-2">
              <Calculator size={14} className="text-[#4edea3]"/> FSI / Buildable Area / Chargeable-FSI Premium Estimator for Gujarat Zones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Inputs */}
          <div className="lg:col-span-2 glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-6 h-fit">
            <h2 className="text-lg font-display uppercase text-[#dbfcff] border-b border-[#3b494b]/40 pb-3 flex items-center gap-2">
              <Ruler size={16} className="text-[#00f0ff]"/> Plot Parameters
            </h2>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Development Zone</label>
              <select value={zoneKey} onChange={e => setZoneKey(e.target.value)} className={inputCls} style={{ backgroundColor: '#111' }}>
                {ZONES.map(z => <option key={z.key} value={z.key} style={{ backgroundColor: '#111' }}>{z.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Abutting Road Width</label>
              <select value={roadKey} onChange={e => setRoadKey(e.target.value)} className={inputCls} style={{ backgroundColor: '#111' }}>
                {ROADS.map(r => <option key={r.key} value={r.key} style={{ backgroundColor: '#111' }}>{r.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Plot Area (sq m)</label>
              <input type="number" min="1" value={plotArea} onChange={e => setPlotArea(e.target.value)} placeholder="e.g. 1000" className={inputCls} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>Jantri Rate (₹ / sq m) — optional</label>
              <input type="number" min="0" value={jantri} onChange={e => setJantri(e.target.value)} placeholder="e.g. 8500 (from your 7/12 report)" className={inputCls} />
              <p className="text-[#3b494b] text-[9px] leading-relaxed">Used to estimate the chargeable-FSI premium (≈40% of jantri per extra sq m of built-up area). The jantri rate appears in your Satya-Lekh property report.</p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {zone.maxFsi === 0 ? (
              <div className="glass-panel p-10 border border-[#ba1b24]/50 bg-[#ba1b24]/5 flex flex-col items-center gap-4 text-center">
                <AlertTriangle size={40} className="text-[#ba1b24]" />
                <h3 className="text-xl font-display uppercase text-[#ba1b24]">No-Development Zone</h3>
                <p className="text-xs text-[#849495] max-w-md leading-relaxed">
                  Agricultural / no-development zoned land cannot be built on without NA (non-agricultural)
                  conversion under Section 65 of the Gujarat Land Revenue Code. Check the tenure type in your
                  7/12 report — "New Tenure" land additionally requires premium payment before transfer or NA use.
                </p>
              </div>
            ) : !result ? (
              <div className="glass-panel p-10 border border-[#3b494b]/40 flex flex-col items-center gap-4 text-center">
                <Building2 size={40} className="text-[#3b494b]" />
                <p className="text-xs text-[#849495] uppercase tracking-widest max-w-sm">Enter a plot area to compute buildable area, FSI limits and premium-FSI cost.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-6 border-l-2 border-l-[#4edea3] flex flex-col gap-1">
                    <span className={labelCls}>Base FSI (free)</span>
                    <span className="text-3xl font-display text-[#4edea3]">{result.baseFsi.toFixed(1)}</span>
                    <span className="text-[10px] text-[#849495] font-mono">{fmt(result.baseBuiltUp)} sq m buildable</span>
                  </div>
                  <div className="glass-panel p-6 border-l-2 border-l-[#00f0ff] flex flex-col gap-1">
                    <span className={labelCls}>Max FSI (with premium)</span>
                    <span className="text-3xl font-display text-[#00f0ff]">{result.maxFsi.toFixed(1)}</span>
                    <span className="text-[10px] text-[#849495] font-mono">{fmt(result.maxBuiltUp)} sq m buildable</span>
                  </div>
                  <div className="glass-panel p-6 border-l-2 border-l-[#de4ced] flex flex-col gap-1">
                    <span className={labelCls}>Max Ground Coverage</span>
                    <span className="text-3xl font-display text-[#de4ced]">{Math.round(zone.coverage * 100)}%</span>
                    <span className="text-[10px] text-[#849495] font-mono">{fmt(result.groundCoverage)} sq m footprint</span>
                  </div>
                </div>

                <div className="glass-panel p-8 border border-[#3b494b]/40 flex flex-col gap-5">
                  <h2 className="text-lg font-display uppercase text-[#dbfcff] border-b border-[#3b494b]/40 pb-3 flex items-center gap-2">
                    <IndianRupee size={16} className="text-[#4edea3]"/> Chargeable FSI Premium
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#00f0ff]">
                      <span className={labelCls}>Purchasable Extra Built-up</span>
                      <span className="text-xl font-display text-[#dbfcff]">{fmt(result.chargeableArea)} sq m</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-[#111111]/80 border-l-2 border-[#4edea3]">
                      <span className={labelCls}>Estimated Premium Cost</span>
                      <span className="text-xl font-display text-[#4edea3]">
                        {parseFloat(jantri) > 0 ? `₹${fmt(result.premiumCost)}` : 'Enter jantri rate ↑'}
                      </span>
                    </div>
                  </div>
                  {result.roadLimited && (
                    <div className="flex items-start gap-3 p-3 border border-[#eab308]/40 bg-[#eab308]/5">
                      <AlertTriangle size={14} className="text-[#eab308] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-[#eab308] leading-relaxed">
                        Your road width caps usable FSI at {road.fsiCap.toFixed(1)} — below the zone maximum of {zone.maxFsi.toFixed(1)}.
                        Wider road frontage unlocks more buildable area.
                      </p>
                    </div>
                  )}
                </div>

                <div className="glass-panel p-6 border border-[#3b494b]/40 bg-[#111]/50 flex flex-col gap-3">
                  <h3 className="text-xs font-display tracking-[0.1em] uppercase text-[#849495] flex items-center gap-2">
                    <Landmark size={14}/> Title Checks Before You Build
                  </h3>
                  <ul className="flex flex-col gap-2 text-[11px] text-[#849495] leading-relaxed font-sans">
                    <li className="flex gap-2"><span className="text-[#00f0ff]">▸</span> Verify tenure type on the 7/12 — "New Tenure / Navi Sharat" land needs premium payment + collector permission before NA use or sale.</li>
                    <li className="flex gap-2"><span className="text-[#00f0ff]">▸</span> Check encumbrances (boja) column for mortgages and liens — banks won't lend against encumbered titles.</li>
                    <li className="flex gap-2"><span className="text-[#00f0ff]">▸</span> Confirm all mutation entries (ferfar) are certified — pending entries can stall plan approval.</li>
                    <li className="flex gap-2"><span className="text-[#00f0ff]">▸</span> Agricultural land requires NA conversion (GLRC §65) before any construction.</li>
                  </ul>
                </div>
              </>
            )}

            <div className="flex items-start gap-3 p-4 border border-[#3b494b]/40 bg-[#1c1b1b]/30">
              <Info size={14} className="text-[#849495] mt-0.5 shrink-0" />
              <p className="text-[9px] text-[#3b494b] leading-relaxed">
                Indicative estimates based on simplified CGDCR-2017 parameters. Actual FSI, coverage, height and premium
                depend on the sanctioned Development Plan, TP scheme, plot geometry and authority circulars in force.
                Always verify with AUDA / your local development authority and a licensed architect before transacting.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0)_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
    </main>
  );
}
