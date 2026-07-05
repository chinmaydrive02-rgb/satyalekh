"use client";

// Full ownership report view, styled as an official title-opinion memo:
// deed-style document header with ref number + date, an animated score
// dial with a stamp-like verdict badge, ledger-style check rows, ruled
// record details, and the chain-of-title timeline.
// The whole report prints as a clean black-on-white document (see the
// @media print block below plus the global print rules in globals.css).

import React from 'react';
import {
  MapPin, User, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Zap, GitBranch,
} from 'lucide-react';
import { TitleReport as TitleReportData, CheckStatus, RiskVerdict } from '@/lib/api';
import ChainOfTitle from '@/components/ChainOfTitle';

const VERDICT_STYLES: Record<RiskVerdict, { label: string; badge: string; text: string; stroke: string }> = {
  CLEAR: {
    label: 'Clear',
    badge: 'text-success border-success bg-success-soft',
    text: 'text-success',
    stroke: 'var(--success)',
  },
  CAUTION: {
    label: 'Caution',
    badge: 'text-warning border-warning bg-warning-soft',
    text: 'text-warning',
    stroke: 'var(--warning)',
  },
  HIGH_RISK: {
    label: 'High Risk',
    badge: 'text-danger border-danger bg-danger-soft',
    text: 'text-danger',
    stroke: 'var(--danger)',
  },
};

function CheckIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 size={15} className="text-success shrink-0" />;
    case 'warn':
      return <AlertTriangle size={15} className="text-warning shrink-0" />;
    case 'fail':
      return <XCircle size={15} className="text-danger shrink-0" />;
    default:
      return <MinusCircle size={15} className="text-faint shrink-0" />;
  }
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Fail',
  unavailable: 'N/A',
};

const STATUS_PILL: Record<CheckStatus, string> = {
  pass: 'text-success bg-success-soft border-success-border',
  warn: 'text-warning bg-warning-soft border-warning-border',
  fail: 'text-danger bg-danger-soft border-danger-border',
  unavailable: 'text-faint bg-surface-soft border-border',
};

/** Animated score dial — SVG donut arc drawn from 0 to the score. */
function ScoreDial({ score, stroke, textCls }: { score: number; stroke: string; textCls: string }) {
  const r = 46;
  const c = 2 * Math.PI * r; // ≈ 289
  const clamped = Math.min(100, Math.max(0, score));
  const offset = c * (1 - clamped / 100);
  return (
    <div className="relative w-[108px] h-[108px] shrink-0" role="img" aria-label={`Title score ${clamped} out of 100`}>
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={stroke} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="sl-anim"
          style={{
            '--dial-c': `${c}`,
            animation: 'sl-dial 1.3s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s both',
          } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-mono font-bold tnum leading-none ${textCls}`}>{clamped}</span>
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted mt-1">of 100</span>
      </div>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'col-span-2 md:col-span-3' : ''}`}>
      <span className="eyebrow text-[10px]">{label}</span>
      <span className="text-sm text-ink break-words">{value || '—'}</span>
    </div>
  );
}

export default function TitleReport({ report }: { report: TitleReportData }) {
  const { record, risk, chain_of_title: chain, cached, generated_at } = report;
  const verdict = VERDICT_STYLES[risk.verdict] ?? VERDICT_STYLES.CAUTION;

  let generatedLabel = '';
  try {
    generatedLabel = generated_at ? new Date(generated_at).toLocaleString('en-IN') : '';
  } catch {
    generatedLabel = generated_at || '';
  }

  // Presentational document reference — deterministic from record identity.
  const refNo = `SL/${(record.district || 'GUJ').slice(0, 3).toUpperCase()}/${(record.survey_no || '—').replace(/\s+/g, '')}`;

  const hasEncumbrances =
    !!record.encumbrances &&
    !['none', 'nil', 'n/a', 'no', 'null', '—', 'clear', ''].includes(
      record.encumbrances.trim().toLowerCase()
    );

  return (
    <article className="sl-report flex flex-col gap-6">
      {/* Print-only refinements (global print rules live in globals.css) */}
      <style>{`
        @media print {
          .sl-report { background: #fff !important; }
          .sl-report, .sl-report * {
            color: #111 !important;
            background: transparent !important;
            border-color: #999 !important;
            text-shadow: none !important;
          }
          .sl-report .sl-verdict { border-width: 2px !important; font-weight: 700; }
          .sl-report section { break-inside: avoid; }
          .sl-report .sl-anim { animation: none !important; }
        }
      `}</style>

      {/* ── Document header: memo masthead + verdict ─────────────── */}
      <section className="card overflow-hidden">
        {/* Masthead strip — ref no + issue date, like an official opinion */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 md:px-8 py-3 border-b border-border bg-surface-soft/50">
          <span className="eyebrow text-brand">Title Intelligence Report — 7/12 Record</span>
          <span className="flex items-center gap-3 font-mono text-[11px] text-muted tnum">
            <span>Ref {refNo}</span>
            {generatedLabel && <span className="hidden sm:inline text-faint">·</span>}
            {generatedLabel && <span className="hidden sm:inline">{generatedLabel}</span>}
          </span>
        </div>
        {/* Gold registrar rule */}
        <div className="h-[3px] bg-gradient-to-r from-accent/70 via-accent/25 to-transparent" aria-hidden="true" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-ink leading-tight">
              Survey No. <span className="font-mono font-bold tnum">{record.survey_no || '—'}</span>
            </h2>
            <p className="text-sm text-muted flex items-center gap-2">
              <MapPin size={13} className="text-brand shrink-0" />
              {[record.village, record.taluka?.replace(/_/g, ' '), record.district]
                .filter(Boolean)
                .join(', ') || 'Location unavailable'}
            </p>
            {cached && (
              <span className="inline-flex items-center gap-1.5 w-fit text-xs font-medium text-success border border-success-border bg-success-soft rounded-full px-2.5 py-1 mt-1 print:hidden">
                <Zap size={11} /> Retrieved from cache — free (no credit used)
              </span>
            )}
          </div>

          {/* Score dial + stamp-style verdict */}
          <div className="flex items-center gap-6 shrink-0">
            <ScoreDial score={risk.score} stroke={verdict.stroke} textCls={verdict.text} />
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`sl-verdict sl-anim inline-block px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] rounded-lg border-2 -rotate-2 ${verdict.badge}`}
                style={{ animation: 'sl-pop 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) 0.85s both' }}
              >
                {verdict.label}
              </span>
              <span className="eyebrow text-[9px]">Verdict</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk checks — ledger rows ─────────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex items-baseline justify-between border-b-2 border-ink/10 pb-3 mb-2">
          <h3 className="text-base font-semibold text-ink">Title Checks</h3>
          <span className="font-mono text-[11px] text-faint tnum">{risk.checks.length} automated checks</span>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {risk.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-3 py-3.5 -mx-2 px-2 rounded-lg transition-colors hover:bg-surface-soft/60">
              <span className="mt-0.5">
                <CheckIcon status={check.status} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink whitespace-nowrap">
                    {check.name}
                  </span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className={`badge border text-[10px] uppercase tracking-wide shrink-0 ${STATUS_PILL[check.status] ?? STATUS_PILL.unavailable}`}>
                    {STATUS_LABEL[check.status] ?? check.status}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed mt-1">{check.detail}</p>
              </div>
            </div>
          ))}
          {risk.checks.length === 0 && (
            <p className="text-sm text-muted py-3">No automated checks were returned for this record.</p>
          )}
        </div>
      </section>

      {/* ── Record details — ruled grid ───────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex items-baseline justify-between border-b-2 border-ink/10 pb-3 mb-5">
          <h3 className="text-base font-semibold text-ink">Record Details</h3>
          <span className="font-mono text-[11px] text-faint">as per AnyROR</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
          <div className="flex flex-col gap-1.5 col-span-2 md:col-span-3 rounded-xl border border-border bg-surface-soft/50 px-4 py-3.5 border-l-[3px] border-l-accent/60">
            <span className="eyebrow text-[10px] flex items-center gap-1">
              <User size={11} /> Recorded Owner
            </span>
            <span className="font-serif text-xl font-semibold text-ink break-words">
              {record.owner_name || '—'}
            </span>
          </div>
          <Detail label="Total Area" value={record.area} />
          <Detail label="Tenure Type" value={record.tenure_type} />
          <Detail label="Cultivation" value={record.cultivation} />
          <Detail label="Jantri Rate" value={record.jantri_rate} />
          <Detail label="Last Sale" value={record.last_sale} />
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-[10px]">Encumbrances</span>
            <span
              className={`text-sm break-words ${hasEncumbrances ? 'text-danger font-semibold' : 'text-success'}`}
            >
              {record.encumbrances || 'None detected'}
            </span>
          </div>
          <Detail label="Mutation Entries (summary)" value={record.mutation_entries} wide />
        </div>
      </section>

      {/* ── Chain of title timeline ───────────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink/10 pb-3 mb-5">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <GitBranch size={15} className="text-brand" /> Chain of Title
          </h3>
          <span className="font-mono text-[11px] text-faint">oldest → newest</span>
        </div>
        <ChainOfTitle entries={chain || []} />
      </section>

      {/* Footer / disclaimer */}
      <p className="text-xs text-faint leading-relaxed border-t border-border pt-4">
        Automated report <span className="font-mono tnum">{refNo}</span> generated{' '}
        {generatedLabel && <>on {generatedLabel} </>}from the official AnyROR 7/12 record.
        This is not a legal title opinion — for transactions, verify the index-2, a 30-year
        search report and pending litigation with a lawyer.
      </p>
    </article>
  );
}
