import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // upload logo + QRIS lewat server action
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;
