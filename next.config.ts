import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: join(process.cwd()),
  },
  transpilePackages: ["neowatch-player"],
  outputFileTracingIncludes: {
    "/api/og/**": ["./assets/fonts/**"],
  },
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;
