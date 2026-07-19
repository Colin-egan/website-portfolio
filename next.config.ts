import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB. Raised further since desktop-imported camera/DSLR photos
      // routinely exceed 10MB — the client portal was still crashing on those.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
