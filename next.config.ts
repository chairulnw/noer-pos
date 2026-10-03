import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "standalone",
  // upload logo + QRIS lewat server action
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
