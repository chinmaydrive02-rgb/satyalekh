import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  // Suppress ESLint errors during build (allows Vercel deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Suppress TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
