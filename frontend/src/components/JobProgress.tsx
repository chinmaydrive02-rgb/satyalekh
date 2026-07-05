"use client";

// Live progress panel for background title-report jobs.
// Shared by property/[id] (core flow) and upload (Auto Web Scraper tab).

import React, { useEffect, useState } from 'react';
import { Loader2, Check, Clock } from 'lucide-react';
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

  const currentIdx = job?.stage ? JOB_STAGES.findIndex((s) => s.key === job.stage) : -1;
  const progress = Math.min(100, Math.max(0, job?.progress ?? 0));
  const elapsed = startedAt ? now - startedAt : 0;
  const queued = !job || job.status === 'queued';

  return (
    <div className="w-full card p-6 md:p-8 flex flex-col gap-6 print:hidden">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="text-brand animate-spin shrink-0" />
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </div>
        {startedAt && (
          <span className="flex items-center gap-1.5 text-sm font-mono text-muted">
            <Clock size={13} /> {formatElapsed(elapsed)} elapsed
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted">
            {queued ? 'Queued — waiting for a worker…' : job?.stage_label || 'Working…'}
          </span>
          <span className="text-sm font-mono text-brand font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-surface-soft border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700 ease-out"
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
            <li key={stage.key} className="flex items-center gap-3 text-sm">
              <span
                className={`w-5 h-5 shrink-0 flex items-center justify-center rounded-full border ${
                  isDone
                    ? 'border-success bg-success-soft text-success'
                    : isCurrent
                      ? 'border-brand text-brand'
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
        A live bot is navigating the government AnyROR portal for you — solving the CAPTCHA and
        translating the Gujarati record. <span className="text-ink-soft font-medium">The first search can take
        2–3 minutes</span> (free hosting cold start + government portal speed). Repeat searches of
        the same parcel return instantly from cache. Keep this page open.
      </p>
    </div>
  );
}
