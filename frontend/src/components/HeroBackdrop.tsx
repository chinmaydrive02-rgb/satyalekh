"use client";

import React from "react";

/* ── HeroBackdrop — a slow, premium animated field for the light hero.
   Pure CSS/SVG, transform/opacity only, GPU-friendly, ~24–40s loops, very
   low contrast so hero text stays crisp. Layers, back to front:
     1. Drifting conic/radial gradient mesh blobs (brand + gold, tiny alpha)
     2. A faint cadastral "survey grid" motif (fits land/records)
     3. Soft contour-line rings that breathe slowly
     4. The existing paper grain (via var(--grain))
   Everything is aria-hidden and pointer-events:none; all animation is
   disabled under prefers-reduced-motion in globals.css (see .hero-backdrop*). ── */
export default function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      {/* Drifting gradient mesh — two blobs on long, offset loops */}
      <span className="hero-backdrop-blob hero-backdrop-blob--brand" />
      <span className="hero-backdrop-blob hero-backdrop-blob--gold" />

      {/* Cadastral survey grid + contour rings, drawn once and drifted */}
      <svg
        className="hero-backdrop-svg"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Fade the whole motif toward the edges so it never fights text */}
          <radialGradient id="hb-fade" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hb-mask">
            <rect width="1200" height="700" fill="url(#hb-fade)" />
          </mask>
          <pattern id="hb-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="var(--color-brand)" strokeWidth="1" />
          </pattern>
        </defs>

        <g mask="url(#hb-mask)">
          {/* Survey / cadastral grid — very faint, slowly drifting */}
          <g className="hero-backdrop-grid" opacity="0.05">
            <rect x="-120" y="-120" width="1440" height="940" fill="url(#hb-grid)" />
          </g>

          {/* Contour-line rings — like a survey elevation map, breathing */}
          <g
            className="hero-backdrop-contour"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.1"
            opacity="0.07"
          >
            <ellipse cx="300" cy="230" rx="120" ry="86" />
            <ellipse cx="300" cy="230" rx="188" ry="140" />
            <ellipse cx="300" cy="230" rx="262" ry="198" />
            <ellipse cx="300" cy="230" rx="342" ry="262" />
          </g>
          <g
            className="hero-backdrop-contour hero-backdrop-contour--alt"
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="1.1"
            opacity="0.06"
          >
            <ellipse cx="960" cy="470" rx="140" ry="104" />
            <ellipse cx="960" cy="470" rx="216" ry="162" />
            <ellipse cx="960" cy="470" rx="300" ry="228" />
          </g>
        </g>
      </svg>

      {/* Paper grain on top, ties it into the house texture */}
      <span className="hero-backdrop-grain" />
    </div>
  );
}
