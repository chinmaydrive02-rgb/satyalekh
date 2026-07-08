"use client";

import React, { useCallback, useEffect, useRef } from "react";

/* ── MagneticButton — wraps a CTA so it follows the pointer by a few px,
   springing back on leave via a CSS transition. Transform-only, no layout
   shift. Degrades to a plain wrapper on touch / coarse pointers / reduced
   motion (the effect simply never binds). Renders a <span> so it can wrap
   <a>/<Link>/<button> without nesting interactive elements. ── */
export function MagneticButton({
  children,
  className = "",
  strength = 6,
}: {
  children: React.ReactNode;
  className?: string;
  /** max pointer-follow translation in px */
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const enabled = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    enabled.current = fine && !reduced;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const el = ref.current;
      if (!el || !enabled.current) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * strength;
      const dy = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * strength;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      });
    },
    [strength]
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform = "";
  }, []);

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`magnetic inline-flex ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Tilt — subtle pointer-based 3D tilt for cards. Rotates within a small
   range around X/Y and lifts on hover. Transform-only, rAF-throttled, and
   inert on touch / coarse pointers / reduced motion. Applies perspective on
   the wrapper so children get depth without changing layout. ── */
export function Tilt({
  children,
  className = "",
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  /** max rotation in degrees on each axis */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const enabled = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    enabled.current = fine && !reduced;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      const box = inner.current;
      if (!el || !box || !enabled.current) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        box.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(
          2
        )}deg) translateZ(0)`;
      });
    },
    [max]
  );

  const reset = useCallback(() => {
    const box = inner.current;
    if (!box) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    box.style.transform = "";
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`tilt-perspective ${className}`}
    >
      <div ref={inner} className="tilt-inner h-full">
        {children}
      </div>
    </div>
  );
}
