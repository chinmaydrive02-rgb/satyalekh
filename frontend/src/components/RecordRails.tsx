"use client";

import React from "react";
import { Landmark, FileBadge2, Gavel, MapPin, Database } from "lucide-react";

/* ── RecordRails — an honest "built on official government rails" credibility
   row. These are the official record systems Satya-Lekh *reads from* — framed
   as sources, not partners/endorsers. Wordmark-style (icon + name + record),
   no fake company logos. Honesty preserved. Static, evenly-spaced row that
   wraps gracefully; no marquee needed at this width. ── */

const RAILS: { name: string; sub: string; icon: React.ReactNode }[] = [
  { name: "AnyROR", sub: "Gujarat 7/12", icon: <Landmark size={16} /> },
  { name: "DigiLocker", sub: "Signed PDFs", icon: <FileBadge2 size={16} /> },
  { name: "eCourts", sub: "Litigation", icon: <Gavel size={16} /> },
  { name: "Bhoomi", sub: "Karnataka RTC", icon: <MapPin size={16} /> },
  { name: "MahaBhulekh", sub: "Maharashtra 7/12", icon: <Database size={16} /> },
];

export default function RecordRails() {
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="eyebrow flex items-center gap-2 text-center">
        <span className="rail-tick" aria-hidden="true" />
        Reads from official government record systems
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-5">
        {RAILS.map((r, i) => (
          <li
            key={r.name}
            className="rail-chip group flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2 shadow-xs"
            style={{ "--rail-i": i } as React.CSSProperties}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
              {r.icon}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-ink">{r.name}</span>
              <span className="text-[11px] text-muted">{r.sub}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="max-w-md text-center text-[11px] leading-relaxed text-faint">
        Satya-Lekh is not affiliated with or endorsed by these agencies — we
        fetch, translate and structure their public records for you.
      </p>
    </div>
  );
}
