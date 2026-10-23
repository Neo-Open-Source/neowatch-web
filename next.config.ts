import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["neowatch-player"],
  outputFileTracingIncludes: {
    "/api/og/**": ["./assets/fonts/**"],
  },
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;
