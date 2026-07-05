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
      dot: "bg-warning animate-pulse",
      text: "Connecting to server",
      label: "text-warning",
    },
    ready: {
      dot: "bg-success",
      text: "Server ready",
      label: "text-success",
    },
    error: {
      dot: "bg-faint",
      text: "Server offline",
      label: "text-muted",
    },
  }[status];

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2 px-3 py-1.5
        bg-surface border border-border rounded-full shadow-sm
        text-xs font-medium print:hidden
        transition-opacity duration-700 ${status === "ready" ? "opacity-80" : "opacity-100"}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className={config.label}>{config.text}</span>
    </div>
  );
}
