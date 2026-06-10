"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Status = "warming" | "ready" | "error";

export default function ServerWarmup() {
  const [status, setStatus] = useState<Status>("warming");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/`, {
          method: "GET",
          // Give Render up to 90s to cold-start
          signal: AbortSignal.timeout(90_000),
        });
        if (cancelled) return;
        if (res.ok) {
          setStatus("ready");
          // Auto-hide 4s after "ready" so it doesn't clutter the UI
          setTimeout(() => { if (!cancelled) setVisible(false); }, 4000);
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  const config = {
    warming: {
      dot: "bg-amber-400 animate-pulse",
      text: "API Warming Up",
      pill: "border-amber-400/20",
      label: "text-amber-400/90",
    },
    ready: {
      dot: "bg-emerald-400",
      text: "API Ready",
      pill: "border-emerald-400/20",
      label: "text-emerald-400/90",
    },
    error: {
      dot: "bg-[#849495]",
      text: "API Offline",
      pill: "border-[#3b494b]/40",
      label: "text-[#849495]",
    },
  }[status];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-3 py-1.5
        bg-[#0d1314]/90 border ${config.pill} backdrop-blur-md
        text-[10px] font-bold tracking-widest uppercase
        transition-opacity duration-700 ${status === "ready" ? "opacity-70" : "opacity-100"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className={config.label}>{config.text}</span>
    </div>
  );
}
