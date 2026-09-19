import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    // Pin the workspace root so Turbopack resolves `next` from the project,
    // not from nested app/ paths (fails after pnpm layout changes otherwise).
    root: join(process.cwd()),
  },
  transpilePackages: ["neowatch-player"],
  // TTFs for the /api/og share-card renderer must ship with the serverless
  // bundle (tracing can't see the dynamic path join in the route).
  outputFileTracingIncludes: {
    "/api/og/**": ["./assets/fonts/**"],
  },
  // Keep the Next.js "N" badge off the bottom nav in mobile DevTools
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;
