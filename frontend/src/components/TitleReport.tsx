"use client";

// Full ownership report view: parcel header + verdict, risk checks table,
// record details grid, and the chain-of-title timeline.
// The whole report prints as a clean black-on-white document (see the
// @media print block below plus the global print rules in globals.css).

import React from 'react';
import {
  MapPin, User, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Zap, GitBranch,
} from 'lucide-react';
import { TitleReport as TitleReportData, CheckStatus, RiskVerdict } from '@/lib/api';
import ChainOfTitle from '@/components/ChainOfTitle';

const VERDICT_STYLES: Record<RiskVerdict, { label: string; badge: string; text: string }> = {
  CLEAR: {
    label: 'Clear',
    badge: 'text-success border-success-border bg-success-soft',
    text: 'text-success',
  },
  CAUTION: {
    label: 'Caution',
    badge: 'text-warning border-warning-border bg-warning-soft',
    text: 'text-warning',
  },
  HIGH_RISK: {
    label: 'High Risk',
    badge: 'text-danger border-danger-border bg-danger-soft',
    text: 'text-danger',
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

function Detail({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'col-span-2 md:col-span-3' : ''}`}>
      <span className="eyebrow">{label}</span>
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
        }
      `}</style>

      {/* Report header: parcel identity + verdict */}
      <section className="card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">
            Ownership Report — 7/12 Record
          </span>
          <h2 className="text-2xl font-bold text-ink">
            Survey No. <span className="font-mono">{record.survey_no || '—'}</span>
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
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <div className={`text-4xl font-bold font-mono ${verdict.text}`}>
              {risk.score}
              <span className="text-sm text-muted font-normal">/100</span>
            </div>
            <div className="eyebrow">Title score</div>
          </div>
          <span
            className={`sl-verdict px-4 py-2 text-sm font-bold rounded-lg border ${verdict.badge}`}
          >
            {verdict.label}
          </span>
        </div>
      </section>

      {/* Risk checks table */}
      <section className="card p-6 md:p-8">
        <h3 className="text-base font-semibold text-ink border-b border-border pb-3 mb-4">
          Title Checks
        </h3>
        <div className="flex flex-col divide-y divide-border">
          {risk.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <span className="mt-0.5">
                <CheckIcon status={check.status} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink">
                    {check.name}
                  </span>
                  <span className="text-xs text-faint">
                    {STATUS_LABEL[check.status] ?? check.status}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed mt-0.5">{check.detail}</p>
              </div>
            </div>
          ))}
          {risk.checks.length === 0 && (
            <p className="text-sm text-muted py-3">No automated checks were returned for this record.</p>
          )}
        </div>
      </section>

      {/* Record details grid */}
      <section className="card p-6 md:p-8">
        <h3 className="text-base font-semibold text-ink border-b border-border pb-3 mb-5">
          Record Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
          <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
            <span className="eyebrow flex items-center gap-1">
              <User size={11} /> Recorded Owner
            </span>
            <span className="text-lg font-semibold text-ink break-words">
              {record.owner_name || '—'}
            </span>
          </div>
          <Detail label="Total Area" value={record.area} />
          <Detail label="Tenure Type" value={record.tenure_type} />
          <Detail label="Cultivation" value={record.cultivation} />
          <Detail label="Jantri Rate" value={record.jantri_rate} />
          <Detail label="Last Sale" value={record.last_sale} />
          <div className="flex flex-col gap-1">
            <span className="eyebrow">
              Encumbrances
            </span>
            <span
              className={`text-sm break-words ${hasEncumbrances ? 'text-danger font-semibold' : 'text-success'}`}
            >
              {record.encumbrances || 'None detected'}
            </span>
          </div>
          <Detail label="Mutation Entries (summary)" value={record.mutation_entries} wide />
        </div>
      </section>

      {/* Chain of title timeline */}
      <section className="card p-6 md:p-8">
        <h3 className="text-base font-semibold text-ink border-b border-border pb-3 mb-5 flex items-center gap-2">
          <GitBranch size={15} className="text-brand" /> Chain of Title
          <span className="text-xs font-normal text-muted">
            oldest → newest
          </span>
        </h3>
        <ChainOfTitle entries={chain || []} />
      </section>

      {/* Footer / disclaimer */}
      <p className="text-xs text-faint leading-relaxed">
        Automated report generated {generatedLabel && <>on {generatedLabel} </>}from the official
        AnyROR 7/12 record. This is not a legal title opinion — for transactions, verify the
        index-2, a 30-year search report and pending litigation with a lawyer.
      </p>
    </article>
  );
}
