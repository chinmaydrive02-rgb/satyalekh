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

/* ── rAF-throttled scroll subscription. Calls `onFrame(scrollY)` at most once
   per animation frame; adds/removes the listener itself. SSR-safe (runs only
   in useEffect). ── */
export function useRafScroll(onFrame: (y: number) => void) {
  const cbRef = useRef(onFrame);
  useEffect(() => {
    cbRef.current = onFrame;
  });
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        cbRef.current(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // sync initial state
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/* ── Gentle scroll parallax: translates children by scrollY * rate, capped at
   maxShift px. Transform-only (no layout shift), rAF-throttled, and inert on
   touch/mobile widths and under prefers-reduced-motion. ── */
export function Parallax({
  children,
  maxShift = 24,
  rate = 0.06,
  className = "",
}: {
  children: React.ReactNode;
  maxShift?: number;
  rate?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 1023px), (hover: none)").matches;
    if (reduced || mobile) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const shift = Math.min(window.scrollY * rate, maxShift);
        el.style.transform = `translate3d(0, ${shift}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [maxShift, rate]);
  return (
    <div ref={ref} className={`parallax ${className}`}>
      {children}
    </div>
  );
}
