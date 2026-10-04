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
import { TitleReport as TitleReportData, CheckStatus, RiskVerdict, SourceRecord, SupportingMutationRecord } from '@/lib/api';
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
  unavailable: 'Not verified',
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
  const clamped = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const offset = c * (1 - clamped / 100);
  return (
    <div className="relative w-[108px] h-[108px] shrink-0" role="img" aria-label={`Risk score ${clamped} out of 100; higher means more risk`}>
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
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted mt-1">risk / 100</span>
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

/** Saved source values are rendered as text only, never interpreted as HTML. */
export function SourceRecordView({ source }: { source: SourceRecord }) {
  const tables = [{ title: 'Ownership rows from the source', rows: source.raw_ownership_rows }, { title: 'Rights and other interests from the source', rows: source.raw_rights_rows }, { title: 'Unclassified ownership references', rows: source.mutation_refs?.ownership_unclassified }, { title: 'Unclassified rights references', rows: source.mutation_refs?.rights_unclassified }];
  const sourceLabels: Record<string, string> = { district: 'District', taluka: 'Taluka', village: 'Village', survey_no: 'Survey / block number', upin: 'UPIN', old_survey_no: 'Old survey number' };
  const sourceDetails = Object.entries({ ...source.locations, ...source.identifiers });
  return <section className="sl-source-record card p-4 sm:p-6 space-y-4"><div><h3 className="text-base font-semibold">Original record contents</h3><p className="text-sm text-muted mt-2">Informational record · source as of: {source.source_as_of || 'Not supplied'}. This date belongs to the source; it is separate from the analysis generation date. The uploaded file has not been authenticated against the government portal.</p></div>
    {sourceDetails.length > 0 && <dl className="grid sm:grid-cols-2 gap-3">{sourceDetails.map(([key, value]) => <div key={key}><dt className="text-xs text-muted">{sourceLabels[key] || key.replace(/_/g, ' ')}</dt><dd className="text-sm whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>}
    {source.labels && <dl className="grid sm:grid-cols-2 gap-3">{Object.entries(source.labels).map(([label, value]) => <div key={label}><dt className="text-xs text-muted break-words">{label}</dt><dd className="text-sm whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>}
    {tables.map(({ title, rows }) => rows && rows.length > 0 && <div key={title}><h4 className="text-sm font-semibold mb-2">{title} ({rows.length})</h4><div className="overflow-x-auto print:overflow-visible rounded-lg border border-border" tabIndex={0} role="region" aria-label={title}><table className="w-full text-sm border-collapse"><caption className="sr-only">{title}; all parsed rows shown in source order</caption><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-border last:border-0">{row.map((cell, j) => <td key={j} className="p-3 align-top whitespace-pre-wrap break-words min-w-28 print:min-w-0 print:text-xs">{cell}</td>)}</tr>)}</tbody></table></div></div>)}
    {source.owners && source.owners.length > 0 && <div><h4 className="text-sm font-semibold">All parsed holders</h4><ul className="mt-2 space-y-2">{source.owners.map((owner, i) => <li key={i} className="text-sm whitespace-pre-wrap break-words">{owner}</li>)}</ul></div>}
    {source.rights && source.rights.length > 0 && <div><h4 className="text-sm font-semibold">All parsed rights entries</h4><ul className="mt-2 space-y-2">{source.rights.map((right, i) => <li key={i} className="text-sm whitespace-pre-wrap break-words">{right}</li>)}</ul></div>}
    <p className="text-xs text-muted">These are source readings, not a title opinion or an English translation. Check every holder, right and mutation reference against the original and supporting documents.</p>
  </section>;
}

/** Preserve native source strings, including unknown fields, without HTML execution. */
function SupportingMutationView({ supporting }: { supporting: SupportingMutationRecord }) {
  const { source_record: source, mutation_record: mutation, metadata } = supporting;
  const labels: Record<string, string> = {
    entry_no: 'Entry number', entry_date: 'Entry date', decision_date: 'Decision date',
    effective_date: 'Effective date', change_type: 'Change type', status: 'Recorded entry status',
    office_status: 'Recorded office status', narrative: 'Entry narrative', affected_surveys: 'Affected surveys / accounts',
    officer_remarks: 'Officer remarks', application_no: 'Application number', original_change_type: 'Original change type',
    applicant_name: 'Applicant name', application_date: 'Application date', notice_prepared_date: 'Notice prepared date',
    notice_given_date: 'Notice given date', last_notice_served_date: 'Last notice served date',
  };
  const fields = { ...mutation, ...source.raw_fields };
  return <section className="sl-source-record card p-4 sm:p-6 space-y-4">
    <div><h3 className="text-base font-semibold">Supporting VF-6 · entry {mutation.entry_no || source.identifiers?.entry_no || 'not supplied'}</h3>
      <p className="text-sm text-muted mt-2">Informational source as of: {source.source_as_of || 'Not supplied'}. These source dates are separate from the report generation date.</p>
      <p className="text-sm text-muted mt-2">The recorded status below is copied from the supplied page. It is not an authenticated or certified copy, and does not independently establish approval, legal effect or title. No buyer, seller or owner is inferred from these entries.</p>
    </div>
    {source.locations && <dl className="grid sm:grid-cols-3 gap-3">{Object.entries(source.locations).map(([key, value]) => <div key={key}><dt className="text-xs text-muted capitalize">{key}</dt><dd className="text-sm whitespace-pre-wrap break-words">{value || 'Not supplied'}</dd></div>)}</dl>}
    <dl className="space-y-4">{Object.entries(fields).map(([key, value]) => <div key={key} className="border-t border-border pt-3"><dt className="text-xs text-muted break-words">{labels[key] || key.replace(/_/g, ' ')}{source.labels?.[key] ? ` · ${source.labels[key]}` : ''}</dt><dd className="text-sm whitespace-pre-wrap break-words mt-1">{value || 'Not supplied in the source'}</dd></div>)}</dl>
    <p className="text-xs text-muted">Gujarati wording is retained without translation. Compare the full narrative and remarks with the original record and supporting instruments.</p>
    <p className="text-xs font-mono break-all">Source SHA-256 · {metadata?.source_sha256 || 'Not supplied'}</p>
    <p className="text-xs text-muted">This fingerprint identifies the uploaded file; it does not authenticate it.</p>
    {metadata?.warnings?.map((warning, index) => <p key={index} className="text-xs text-muted break-words">{warning}</p>)}
  </section>;
}

export default function TitleReport({ report }: { report: TitleReportData }) {
  const { record, risk, chain_of_title: chain, cached, generated_at, coverage } = report;
  const verdict = VERDICT_STYLES[risk.verdict] ?? VERDICT_STYLES.CAUTION;
  const suppliedRecord = coverage?.source === 'user_supplied_record' || coverage?.source === 'user_supplied_record_bundle';
  const suppliedBundle = coverage?.source === 'user_supplied_record_bundle';
  const riskNotAssessed = suppliedRecord && risk.checks.every(check => check.status === 'unavailable');

  let generatedLabel = '';
  try {
    const generatedDate = new Date(generated_at);
    generatedLabel = generated_at && Number.isFinite(generatedDate.getTime()) ? generatedDate.toLocaleString('en-IN') : '';
  } catch {
    generatedLabel = generated_at || '';
  }

  // Presentational document reference — deterministic from record identity.
  const refNo = `SL/${(record.district || 'GUJ').slice(0, 3).toUpperCase()}/${(record.survey_no || '—').replace(/\s+/g, '')}`;

  const encumbranceText = record.encumbrances?.trim() || '';
  const encumbrancesUnavailable = ['', 'unknown', 'not available', 'not found', 'n/a', 'null', '—', '-'].includes(encumbranceText.toLowerCase());
  const hasEncumbrances = !encumbrancesUnavailable && !/[\u0a80-\u0aff]/.test(encumbranceText) && !['none', 'nil', 'no', 'clear'].includes(encumbranceText.toLowerCase());

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
          .sl-report section.sl-source-record { break-inside: auto; overflow: visible !important; }
          .sl-report .sl-source-record table { table-layout: fixed; width: 100%; }
          .sl-report .sl-source-record td { overflow-wrap: anywhere; }
          .sl-report .sl-anim { animation: none !important; }
        }
      `}</style>

      {report.demo && (
        <section className="rounded-xl border-2 border-warning-border bg-warning-soft p-4 text-warning">
          <p className="text-sm font-bold">SAMPLE REPORT · DEMONSTRATION DATA</p>
          <p className="mt-1 text-xs">Illustrative records only. No live government record was retrieved for this report.</p>
        </section>
      )}
      {suppliedRecord && (
        <section className="rounded-xl border border-warning-border bg-warning-soft p-4">
          <p className="text-sm font-semibold text-warning">Preliminary analysis of an uploaded record</p>
          <p className="mt-1 text-sm text-muted">
            {coverage?.user_review_confirmed
              ? 'Based on entries confirmed by the user against the supplied document. The source excerpts and reviewer identity have not been independently verified.'
              : 'Based on unreviewed text extraction. Compare the readings with the original document before relying on them.'}
            {' '}Official source authenticity, supporting instruments and the complete title history remain unverified.
          </p>
        </section>
      )}
      {/* ── Document header: memo masthead + verdict ─────────────── */}
      <section className="card overflow-hidden">
        {/* Masthead strip — ref no + issue date, like an official opinion */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 md:px-8 py-3 border-b border-border bg-surface-soft/50">
          <span className="eyebrow text-brand">Title Intelligence Report — 7/12 Record</span>
          <span className="flex items-center gap-3 flex-wrap font-mono text-[11px] text-muted tnum break-all">
            <span>Ref {refNo}</span>
            {generatedLabel && <span className="text-faint">·</span>}
            {generatedLabel && <span className="block">{generatedLabel}</span>}
          </span>
        </div>
        {/* Gold registrar rule */}
        <div className="h-[3px] bg-gradient-to-r from-accent/70 via-accent/25 to-transparent" aria-hidden="true" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-ink leading-tight break-words">
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
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
            {riskNotAssessed
              ? <p className="max-w-40 text-sm text-muted font-medium">Risk score not assessed</p>
              : <ScoreDial score={risk.score} stroke={verdict.stroke} textCls={verdict.text} />}
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`sl-verdict sl-anim inline-block px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] rounded-lg border-2 -rotate-2 ${verdict.badge}`}
                style={{ animation: 'sl-pop 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) 0.85s both' }}
              >
                {verdict.label}
              </span>
              <span className="eyebrow text-[9px]">{suppliedRecord ? 'Preliminary risk screen' : 'Automated assessment'}</span>
              {!riskNotAssessed && <span className="text-[10px] text-muted">Higher score = more risk</span>}
            </div>
          </div>
        </div>
      </section>

      {coverage && (
        <section className="card p-6 md:p-8" aria-labelledby="report-coverage-heading">
          <h3 id="report-coverage-heading" className="text-base font-semibold text-ink">Evidence coverage</h3>
          <p className="text-sm text-muted leading-relaxed mt-2">
            {coverage.mutation_records_uploaded !== undefined
              ? `${coverage.mutation_records_uploaded} supporting mutation records supplied by the user; ${coverage.mutation_entries_identified} mutation references identified in the primary record. Uploaded records have not been authenticated against the portal.`
              : coverage.chain_requested
              ? `${coverage.mutation_records_retrieved} of ${coverage.mutation_entries_identified} identified mutation records retrieved.`
              : 'Mutation record retrieval was not requested for this report.'}
            {' '}{coverage.chain_complete && coverage.source !== 'user_supplied_record_bundle'
              ? 'The requested mutation retrieval is complete. The assessment remains limited to the records available.'
              : 'The ownership history is incomplete. Review the outstanding evidence before relying on the assessment.'}
          </p>
          {coverage.source === 'user_supplied_record_bundle' ? (
            <p className="mt-2 text-sm text-warning break-words">
              {coverage.unresolved_mutation_references?.length ?? coverage.mutation_records_not_attempted} referenced entries not supplied.
              {Boolean(coverage.unresolved_mutation_references?.length) && <> Entry numbers: {coverage.unresolved_mutation_references?.join(', ')}.</>}
            </p>
          ) : (coverage.mutation_records_failed > 0 || coverage.mutation_records_not_attempted > 0) && (
            <p className="mt-2 text-sm text-warning">
              {coverage.mutation_records_failed} could not be retrieved; {coverage.mutation_records_not_attempted} not yet attempted.
            </p>
          )}
          {Boolean(coverage.mutation_references_requiring_review?.length) && <div className="mt-3 text-sm text-warning">
            <p>{coverage.mutation_references_requiring_review?.length} source references need manual review before they can be matched to an entry number. Check each original character; Gujarati letter પ is distinct from digit ૫ (5).</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">{coverage.mutation_references_requiring_review?.map((reference, index) => <li key={index} className="whitespace-pre-wrap break-words">{reference}</li>)}</ul>
          </div>}
          <p className="mt-3 text-xs text-muted leading-relaxed">A risk score describes findings in the available records. It does not establish that the title is clear.</p>
        </section>
      )}

      {/* ── Risk checks — ledger rows ─────────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap gap-2 items-baseline justify-between border-b-2 border-ink/10 pb-3 mb-2">
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
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink break-words">
                    {check.name.replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase())}
                  </span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className={`badge border text-[10px] uppercase tracking-wide shrink-0 ${STATUS_PILL[check.status] ?? STATUS_PILL.unavailable}`}>
                    {STATUS_LABEL[check.status] ?? check.status}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed mt-1 break-words">{check.detail}</p>
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
        <div className="flex flex-wrap gap-2 items-baseline justify-between border-b-2 border-ink/10 pb-3 mb-5">
          <h3 className="text-base font-semibold text-ink">Record Details</h3>
          <span className="font-mono text-[11px] text-faint">{report.demo ? "sample data" : suppliedRecord ? 'as per supplied readings' : 'as per retrieved record'}</span>
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
              className={`text-sm break-words ${hasEncumbrances ? 'text-danger font-semibold' : encumbrancesUnavailable ? 'text-muted' : 'text-ink'}`}
            >
              {encumbrancesUnavailable ? 'Not available in the extracted record' : encumbranceText}
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
          <span className="font-mono text-[11px] text-faint">{suppliedBundle ? 'Source entries · continuity unverified' : 'oldest → newest'}</span>
        </div>
        <ChainOfTitle entries={chain || []} ariaLabel={suppliedBundle ? 'Uploaded mutation source entries' : undefined} />
      </section>

      {report.source_record && <SourceRecordView source={report.source_record}/>}
      {report.supporting_records?.map((supporting, index) => <SupportingMutationView key={`${supporting.mutation_record.entry_no}-${index}`} supporting={supporting}/>)}

      {report.source_document && (
        <section className="card p-6 md:p-8">
          <h3 className="text-base font-semibold text-ink">Original document reference</h3>
          <p className="mt-2 text-xs text-muted">This fingerprint identifies the exact uploaded file used for the reading. It does not verify the document’s signature or authenticity.</p>
          <p className="mt-3 text-xs font-mono break-all">SHA-256 · {report.source_document.sha256}</p>
          <p className="mt-2 text-xs text-muted">{report.source_document.pages_processed ?? 'Unknown'} of {report.source_document.pages_total ?? 'unknown'} pages processed. Keep the original file with this report.</p>
        </section>
      )}

      {report.source_evidence && report.source_evidence.length > 0 && (
        <section className="card p-6 md:p-8">
          <h3 className="text-base font-semibold text-ink">Source readings and references</h3>
          <p className="mt-2 text-xs text-muted">Machine readings and user-entered excerpts are shown separately. A page reference does not independently verify an excerpt.</p>
          <div className="mt-4 space-y-4">
            {report.source_evidence.map((entry, index) => (
              <div key={index} className="border-t border-border pt-3 text-sm break-words">
                <p className="font-medium">{entry.field?.replace(/_/g, ' ') || 'Source reading'}{entry.page ? ` · page ${entry.page}` : ''}</p>
                <p className="text-xs text-muted mt-1">{entry.method === 'user_review' ? 'User-entered reading · excerpt unverified' : 'Machine extraction · unreviewed'}</p>
                {entry.value && <p className="mt-1">{entry.value}</p>}
                <blockquote className="mt-1 whitespace-pre-wrap text-muted">{entry.snippet || 'Excerpt not supplied.'}</blockquote>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Footer / disclaimer */}
      <p className="text-xs text-faint leading-relaxed border-t border-border pt-4">
        Automated report <span className="font-mono tnum">{refNo}</span> generated{' '}
        {generatedLabel && <>on {generatedLabel} </>}{report.demo ? "from demonstration data, not a live government record." : suppliedRecord ? "from user-supplied documents; no live government record was retrieved." : "from the retrieved AnyROR record."}
        This is not a legal title opinion — for transactions, verify the index-2, a 30-year
        search report and pending litigation with a lawyer.
      </p>
    </article>
  );
}
