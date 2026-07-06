"use client";

import React, { useState, useMemo } from 'react';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
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
  // Stamp duty calculator
  const [dealValue, setDealValue] = useState('');
  const [femaleBuyer, setFemaleBuyer] = useState(false);

  const duty = useMemo(() => {
    const v = parseFloat(dealValue);
    if (!v || v <= 0) return null;
    // Gujarat: stamp duty 4.9% (incl. surcharge); registration fee 1%,
    // waived for sole female buyers. Verify current notification before paying.
    const stamp = v * 0.049;
    const reg = femaleBuyer ? 0 : v * 0.01;
    return { stamp, reg, total: stamp + reg };
  }, [dealValue, femaleBuyer]);

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

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col pt-24 pb-12 px-4 sm:px-6">
      <TopNav />

      <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <Reveal>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
          <div>
            <p className="eyebrow mb-1">Compliance</p>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-ink">GDCR Compliance Calculator</h1>
              <span className="badge bg-success-soft text-success border border-success-border">
                <Shield size={12}/> CGDCR-2017 basis
              </span>
            </div>
            <p className="text-muted text-sm flex items-center gap-2">
              <Calculator size={14} className="text-brand"/> FSI, buildable area and chargeable-FSI premium estimator for Gujarat zones
            </p>
          </div>
        </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Inputs */}
          <Reveal variant="reveal-left" delay={80} className="lg:col-span-2">
          <div className="card p-6 sm:p-8 flex flex-col gap-5 h-fit">
            <h2 className="text-base font-semibold text-ink border-b border-border pb-3 flex items-center gap-2">
              <Ruler size={16} className="text-brand"/> Plot Parameters
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="label">Development Zone</label>
              <select value={zoneKey} onChange={e => setZoneKey(e.target.value)} className="input cursor-pointer">
                {ZONES.map(z => <option key={z.key} value={z.key}>{z.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Abutting Road Width</label>
              <select value={roadKey} onChange={e => setRoadKey(e.target.value)} className="input cursor-pointer">
                {ROADS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Plot Area (sq m)</label>
              <input type="number" min="1" value={plotArea} onChange={e => setPlotArea(e.target.value)} placeholder="e.g. 1000" className="input font-mono" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Jantri Rate (₹ / sq m) — optional</label>
              <input type="number" min="0" value={jantri} onChange={e => setJantri(e.target.value)} placeholder="e.g. 8500 (from your 7/12 report)" className="input font-mono" />
              <p className="text-faint text-xs leading-relaxed">Used to estimate the chargeable-FSI premium (≈40% of jantri per extra sq m of built-up area). The jantri rate appears in your Satya-Lekh property report.</p>
            </div>
          </div>
          </Reveal>

          {/* Results */}
          <Reveal variant="reveal-right" delay={160} className="lg:col-span-3">
          <div className="flex flex-col gap-6">
            {zone.maxFsi === 0 ? (
              <div className="card p-10 border-danger-border bg-danger-soft/50 flex flex-col items-center gap-4 text-center">
                <AlertTriangle size={36} className="text-danger" />
                <h3 className="text-lg font-semibold text-danger">No-Development Zone</h3>
                <p className="text-sm text-muted max-w-md leading-relaxed">
                  Agricultural / no-development zoned land cannot be built on without NA (non-agricultural)
                  conversion under Section 65 of the Gujarat Land Revenue Code. Check the tenure type in your
                  7/12 report — &quot;New Tenure&quot; land additionally requires premium payment before transfer or NA use.
                </p>
              </div>
            ) : !result ? (
              <div className="card p-10 flex flex-col items-center gap-4 text-center">
                <Building2 size={36} className="text-faint" />
                <p className="text-sm text-muted max-w-sm">Enter a plot area to compute buildable area, FSI limits and premium-FSI cost.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="sl-anim card card-lift p-6 border-l-4 border-l-success flex flex-col gap-1" style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) both' }}>
                    <span className="eyebrow">Base FSI (free)</span>
                    <span className="text-3xl font-bold font-mono text-success">{result.baseFsi.toFixed(1)}</span>
                    <span className="text-xs text-muted font-mono">{fmt(result.baseBuiltUp)} sq m buildable</span>
                  </div>
                  <div className="sl-anim card card-lift p-6 border-l-4 border-l-brand flex flex-col gap-1" style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) 80ms both' }}>
                    <span className="eyebrow">Max FSI (with premium)</span>
                    <span className="text-3xl font-bold font-mono text-brand">{result.maxFsi.toFixed(1)}</span>
                    <span className="text-xs text-muted font-mono">{fmt(result.maxBuiltUp)} sq m buildable</span>
                  </div>
                  <div className="sl-anim card card-lift p-6 border-l-4 border-l-warning flex flex-col gap-1" style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) 160ms both' }}>
                    <span className="eyebrow">Max Ground Coverage</span>
                    <span className="text-3xl font-bold font-mono text-warning">{Math.round(zone.coverage * 100)}%</span>
                    <span className="text-xs text-muted font-mono">{fmt(result.groundCoverage)} sq m footprint</span>
                  </div>
                </div>

                <div className="card p-6 sm:p-8 flex flex-col gap-5">
                  <h2 className="text-base font-semibold text-ink border-b border-border pb-3 flex items-center gap-2">
                    <IndianRupee size={16} className="text-success"/> Chargeable FSI Premium
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-soft border-l-4 border-brand">
                      <span className="eyebrow">Purchasable Extra Built-up</span>
                      <span className="text-xl font-bold font-mono text-ink">{fmt(result.chargeableArea)} sq m</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-soft border-l-4 border-success">
                      <span className="eyebrow">Estimated Premium Cost</span>
                      <span className="text-xl font-bold font-mono text-success">
                        {parseFloat(jantri) > 0 ? `₹${fmt(result.premiumCost)}` : 'Enter jantri rate ↑'}
                      </span>
                    </div>
                  </div>
                  {result.roadLimited && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-warning-border bg-warning-soft">
                      <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                      <p className="text-xs text-warning leading-relaxed">
                        Your road width caps usable FSI at {road.fsiCap.toFixed(1)} — below the zone maximum of {zone.maxFsi.toFixed(1)}.
                        Wider road frontage unlocks more buildable area.
                      </p>
                    </div>
                  )}
                </div>

                <div className="card p-6 flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Landmark size={15} className="text-brand"/> Title Checks Before You Build
                  </h3>
                  <ul className="flex flex-col gap-2 text-sm text-muted leading-relaxed">
                    <li className="flex gap-2"><span className="text-brand">▸</span> Verify tenure type on the 7/12 — &quot;New Tenure / Navi Sharat&quot; land needs premium payment + collector permission before NA use or sale.</li>
                    <li className="flex gap-2"><span className="text-brand">▸</span> Check encumbrances (boja) column for mortgages and liens — banks won&apos;t lend against encumbered titles.</li>
                    <li className="flex gap-2"><span className="text-brand">▸</span> Confirm all mutation entries (ferfar) are certified — pending entries can stall plan approval.</li>
                    <li className="flex gap-2"><span className="text-brand">▸</span> Agricultural land requires NA conversion (GLRC §65) before any construction.</li>
                  </ul>
                </div>
              </>
            )}

            {/* Stamp Duty & Registration Calculator */}
            <div className="card p-6 sm:p-8 flex flex-col gap-5">
              <h2 className="text-base font-semibold text-ink border-b border-border pb-3 flex items-center gap-2">
                <IndianRupee size={16} className="text-brand"/> Stamp Duty &amp; Registration (Gujarat)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Transaction Value (₹) — higher of deal price or jantri value</label>
                  <input type="number" min="0" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="e.g. 5000000" className="input font-mono" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer pb-3">
                  <input type="checkbox" checked={femaleBuyer} onChange={e => setFemaleBuyer(e.target.checked)} className="accent-[var(--brand)] w-4 h-4" />
                  <span className="text-sm text-ink-soft">Sole female buyer (registration fee waived)</span>
                </label>
              </div>
              {duty && (
                <div
                  className="sl-anim grid grid-cols-1 md:grid-cols-3 gap-4"
                  style={{ animation: 'sl-fade-up 0.45s cubic-bezier(0.22,0.61,0.36,1) both' }}
                >
                  <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-soft border-l-4 border-brand">
                    <span className="eyebrow">Stamp Duty (4.9%)</span>
                    <span className="text-lg font-bold font-mono text-ink">₹{fmt(duty.stamp)}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-soft border-l-4 border-warning">
                    <span className="eyebrow">Registration (1%)</span>
                    <span className="text-lg font-bold font-mono text-ink">{duty.reg === 0 ? 'Waived' : `₹${fmt(duty.reg)}`}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-soft border-l-4 border-success">
                    <span className="eyebrow">Total Government Cost</span>
                    <span className="text-lg font-bold font-mono text-success">₹{fmt(duty.total)}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-faint leading-relaxed">Duty is payable on the higher of consideration or jantri valuation. Rates per prevailing Gujarat notification — verify with the sub-registrar before payment.</p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-soft/60">
              <Info size={14} className="text-muted mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Indicative estimates based on simplified CGDCR-2017 parameters. Actual FSI, coverage, height and premium
                depend on the sanctioned Development Plan, TP scheme, plot geometry and authority circulars in force.
                Always verify with AUDA / your local development authority and a licensed architect before transacting.
              </p>
            </div>
          </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
