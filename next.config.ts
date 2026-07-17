import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // Allow canvas-confetti in client bundle
  transpilePackages: [],
  experimental: {
    serverActions: {
      // Default is 1MB, which rejects most real phone photos uploaded via the client portal.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
