"use client";

// Vertical chain-of-title timeline (oldest → newest).
// Each node = mutation entry no + date + type, from_party → to_party,
// description, and flag chips. Entries flagged with a chain gap render a
// broken (dashed red) connector line above them.

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
      <div className="border border-border rounded-lg bg-surface-soft/60 p-8 flex flex-col items-center gap-3 text-center">
        <FileClock size={28} className="text-faint" />
        <p className="text-sm text-ink-soft">Mutation history unavailable for this record type.</p>
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
            {/* Timeline gutter: connector + node dot */}
            <div className="flex flex-col items-center w-6 shrink-0">
              {/* Connector above the dot (highlights breaks in the chain) */}
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
                className={`w-3 h-3 shrink-0 border-2 ${
                  flagged ? 'border-danger bg-danger-soft' : 'border-success bg-success-soft'
                }`}
                style={{ borderRadius: '9999px' }}
              />
              {!isLast && <div className="w-0 flex-1 border-l-2 border-border-strong" />}
            </div>

            {/* Entry card */}
            <div className={`flex-1 min-w-0 ${isLast ? 'pb-1' : 'pb-6'} pt-2`}>
              {gapAbove && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger mb-2">
                  <AlertTriangle size={12} /> Possible break in the chain before this entry
                </div>
              )}
              <div
                className={`border rounded-lg p-4 flex flex-col gap-2 ${
                  flagged ? 'border-danger-border bg-danger-soft/60' : 'border-border bg-surface'
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-mono font-bold text-ink">
                    Entry {entry.entry_no || '—'}
                  </span>
                  <span className="text-xs font-mono text-muted">{entry.date || 'Date unknown'}</span>
                  {entry.mutation_type && (
                    <span className="text-xs font-medium text-brand border border-brand-border bg-brand-soft rounded-full px-2 py-0.5">
                      {entry.mutation_type}
                    </span>
                  )}
                </div>

                {(entry.from_party || entry.to_party) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                    <span className="break-words">{entry.from_party || 'Unknown party'}</span>
                    <ArrowRight size={13} className="text-faint shrink-0" />
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
