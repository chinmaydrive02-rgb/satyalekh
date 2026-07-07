"use client";

/* Route-level entrance: every navigation re-mounts this template, replaying a
   subtle fade + 8px rise (.page-enter in globals.css — house easing, 0.35s,
   disabled under prefers-reduced-motion). Deliberately minimal so it can
   never interfere with rendering. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
