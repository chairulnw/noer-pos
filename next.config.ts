import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "standalone",
  redirects: async () => [{ source: "/pasien/owner/:path*", destination: "/pemilik/:path*", permanent: true }],
  // upload logo + QRIS lewat server action
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
};

export default nextConfig;
