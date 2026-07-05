import type { NextConfig } from "next";

// ─── Security headers (SECURITY F-13) ───────────────────────────────────────
// CSP is built from the domains the app actually talks to:
//   * the FastAPI backend (NEXT_PUBLIC_API_URL, Render domains, localhost dev)
//   * Supabase (REST + storage + realtime websocket)
//   * Mapbox GL (api/events.mapbox.com, blob: workers — Map.tsx, land-intel)
//   * Google Fonts (layout.tsx), formsubmit.co (pricing contact form)
// 'unsafe-inline'/'unsafe-eval' in script-src are required by Next.js inline
// bootstrap scripts and dev tooling; tighten to nonces when feasible.

const API_ORIGINS = [
  process.env.NEXT_PUBLIC_API_URL || "",
  "https://satyalekh-api.onrender.com",
  "https://satyalekh-api-sg.onrender.com",
  "http://localhost:8000",
]
  .filter(Boolean)
  .filter((v, i, a) => a.indexOf(v) === i)
  .join(" ");

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.mapbox.com https://*.supabase.co",
  `connect-src 'self' ${API_ORIGINS} https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://formsubmit.co`,
  "worker-src 'self' blob:",
  "child-src blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formsubmit.co",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  // Suppress TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
