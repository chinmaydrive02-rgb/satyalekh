"use client";

import React, { useEffect, useRef, useState } from "react";

/* ── Scroll reveal: adds .is-visible when the block enters the viewport.
   CSS (.reveal / .reveal-left / .reveal-right / .reveal-scale) handles the
   transition and respects reduced motion. ── */
export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "reveal",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: "reveal" | "reveal-left" | "reveal-right" | "reveal-scale";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${variant} ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/* ── Count-up number: animates 0 → target when scrolled into view.
   Falls back to the final value instantly under reduced motion. ── */
export function CountUp({
  target,
  suffix = "",
  duration = 1400,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started.current) return;
          started.current = true;
          io.unobserve(e.target);
          if (reduced) { setVal(target); return; }
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            // easeOutCubic
            setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tnum">
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
