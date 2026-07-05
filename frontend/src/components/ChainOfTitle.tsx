"use client";

// Vertical chain-of-title timeline (oldest → newest), drawn like a
// registrar's ledger: ringed node markers, hairline connectors, and one
// "ledger slip" card per mutation entry (ferfar nondh). Entries flagged
// with a chain gap render a broken (dashed red) connector above them.

import React from 'react';
import { ArrowRight, FileClock, AlertTriangle } from 'lucide-react';
import { ChainEntry } from '@/lib/api';

const SEVERE_FLAG = /gap|break|missing|dispute|disputed|fraud|forg|stay|court|litigat|encumbr|mortgage|boja|attach/i;
const GAP_FLAG = /gap|break|missing/i;

function isSevere(flag: string): boolean {
  return SEVERE_FLAG.test(flag);
}

function hasGap(entry: ChainEntry): boolean {
  return (entry.flags || []).some((f) => GAP_FLAG.test(f));
}

export default function ChainOfTitle({ entries }: { entries: ChainEntry[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="border border-dashed border-border-strong rounded-xl bg-surface-soft/50 p-8 flex flex-col items-center gap-3 text-center">
        <span className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
          <FileClock size={22} className="text-faint" />
        </span>
        <p className="text-sm text-ink-soft font-medium">Mutation history unavailable for this record type.</p>
        <p className="text-xs text-muted max-w-md leading-relaxed">
          Old scanned 7/12 extracts don&apos;t always include the full ferfar nondh (mutation register).
          Verify the VF-6 entry details at the e-Dhara kendra for the complete chain.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col" aria-label="Chain of title, oldest to newest">
      {entries.map((entry, i) => {
        const flags = entry.flags || [];
        const flagged = flags.length > 0;
        const gapAbove = i > 0 && hasGap(entry);
        const isLast = i === entries.length - 1;

        return (
          <li key={`${entry.entry_no}-${i}`} className="relative flex gap-4">
            {/* Timeline gutter: connector + ringed node */}
            <div className="flex flex-col items-center w-6 shrink-0">
              {/* Connector above the node (highlights breaks in the chain) */}
              {i > 0 && (
                <div
                  className={
                    gapAbove
                      ? 'w-0 h-5 border-l-2 border-dashed border-danger'
                      : 'w-0 h-5 border-l-2 border-border-strong'
                  }
                />
              )}
              {i === 0 && <div className="h-5" />}
              <div
                className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                  flagged
                    ? 'border-danger bg-danger-soft shadow-[0_0_0_3px_rgba(180,35,24,0.1)]'
                    : 'border-brand bg-brand-soft shadow-[0_0_0_3px_rgba(15,118,110,0.1)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${flagged ? 'bg-danger' : 'bg-brand'}`} />
              </div>
              {!isLast && <div className="w-0 flex-1 border-l-2 border-border-strong" />}
            </div>

            {/* Ledger slip */}
            <div className={`flex-1 min-w-0 ${isLast ? 'pb-1' : 'pb-6'} pt-1.5`}>
              {gapAbove && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger mb-2">
                  <AlertTriangle size={12} /> Possible break in the chain before this entry
                </div>
              )}
              <div
                className={`rounded-xl p-4 flex flex-col gap-2 border transition-shadow hover:shadow-md ${
                  flagged
                    ? 'border-danger-border bg-danger-soft/50 border-l-[3px] border-l-danger'
                    : 'border-border bg-surface border-l-[3px] border-l-brand/30 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-bold tnum border ${
                    flagged ? 'text-danger border-danger-border bg-surface' : 'text-ink border-border bg-surface-soft/70'
                  }`}>
                    Entry {entry.entry_no || '—'}
                  </span>
                  <span className="text-xs font-mono text-muted tnum">{entry.date || 'Date unknown'}</span>
                  {entry.mutation_type && (
                    <span className="text-xs font-medium text-brand border border-brand-border bg-brand-soft rounded-full px-2 py-0.5">
                      {entry.mutation_type}
                    </span>
                  )}
                </div>

                {(entry.from_party || entry.to_party) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                    <span className="break-words">{entry.from_party || 'Unknown party'}</span>
                    <ArrowRight size={13} className="text-brand shrink-0" />
                    <span className="font-semibold text-ink break-words">{entry.to_party || 'Unknown party'}</span>
                  </div>
                )}

                {entry.description && (
                  <p className="text-sm text-muted leading-relaxed">{entry.description}</p>
                )}

                {flagged && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {flags.map((flag, fi) => (
                      <span
                        key={fi}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
                          isSevere(flag)
                            ? 'text-danger border-danger-border bg-danger-soft'
                            : 'text-warning border-warning-border bg-warning-soft'
                        }`}
                      >
                        <AlertTriangle size={10} /> {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
