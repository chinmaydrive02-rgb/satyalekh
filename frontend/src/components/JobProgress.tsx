"use client";

// Live progress panel for background title-report jobs.
// Shared by property/[id] (core flow) and upload (Auto Web Scraper tab).

import React, { useEffect, useState } from 'react';
import { Loader2, Check, Clock, AlertTriangle } from 'lucide-react';
import { Job, JOB_STAGES } from '@/lib/api';

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

export default function JobProgress({
  job,
  startedAt,
  title = 'Fetching your title report',
}: {
  job: Job | null;
  startedAt: number | null;
  title?: string;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const finished = job?.status === 'done';
  const failed = job?.status === 'error';
  const currentIdx = job?.stage ? JOB_STAGES.findIndex((s) => s.key === job.stage) : -1;
  const progress = Math.min(100, Math.max(0, job?.progress ?? 0));
  const elapsed = startedAt ? now - startedAt : 0;
  const queued = !job || job.status === 'queued';

  return (
    <div className="w-full card p-6 md:p-8 flex flex-col gap-6 print:hidden">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {failed ? <AlertTriangle size={18} className="text-warning shrink-0" /> : finished ? <Check size={18} className="text-success shrink-0" /> : <Loader2 size={18} className="text-brand animate-spin shrink-0" />}
          <h2 className="text-base font-semibold text-ink">{failed ? 'Report could not be completed' : finished ? 'Report ready' : title}</h2>
        </div>
        {startedAt && (
          <span className="flex items-center gap-1.5 text-sm font-mono text-muted">
            <Clock size={13} /> {formatElapsed(elapsed)} elapsed
          </span>
        )}
      </div>

      {/* Progress bar — animated shimmer sweep while working */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted" role="status" aria-live="polite">
            {failed ? job?.error || 'Please try again or upload the official record.' : finished ? 'Completed' : queued ? 'Your search is queued…' : job?.stage_label || 'Working…'}
          </span>
          <span className="text-sm font-mono tnum text-brand font-semibold">{progress}%</span>
        </div>
        <div role="progressbar" aria-label="Report progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="w-full h-2.5 bg-surface-soft border border-border rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(22,36,31,0.06)]">
          <div
            className="shimmer h-full rounded-full bg-gradient-to-r from-brand-strong via-brand to-brand transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
      </div>

      {/* Stage checklist */}
      <ol className="flex flex-col gap-2.5" aria-label="Search stages">
        {JOB_STAGES.map((stage, i) => {
          const isDone = currentIdx > i || (job?.status === 'done');
          const isCurrent = currentIdx === i && job?.status === 'running';
          return (
            <li
              key={stage.key}
              className={`flex items-center gap-3 text-sm rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                isCurrent ? 'bg-brand-soft/60' : ''
              }`}
            >
              <span
                className={`w-5 h-5 shrink-0 flex items-center justify-center rounded-full border transition-colors ${
                  isDone
                    ? 'border-success bg-success-soft text-success'
                    : isCurrent
                      ? 'border-brand text-brand shadow-[0_0_0_3px_rgba(15,118,110,0.12)]'
                      : 'border-border text-faint'
                }`}
              >
                {isDone ? <Check size={12} /> : isCurrent ? <Loader2 size={11} className="animate-spin" /> : '·'}
              </span>
              <span
                className={
                  isDone ? 'text-ink-soft' : isCurrent ? 'text-ink font-medium' : 'text-faint'
                }
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Honest expectations */}
      <p className="text-xs leading-relaxed text-muted border-t border-border pt-4">
        {failed ? 'No completed report is available from this attempt. You can retry the search or upload an official record for analysis.' : finished ? 'Your report is ready to review.' : <>
          We are retrieving and analysing the available land records. <span className="text-ink-soft font-medium">Live searches can take several minutes</span>, depending on government portal availability. Saved results may load faster. Keep this page open to follow progress.
          {elapsed > 180000 && <span className="block mt-2 text-warning">This is taking longer than usual. Avoid starting duplicate searches while this request is still running.</span>}
        </>}
      </p>
    </div>
  );
}
