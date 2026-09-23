import type { NextConfig } from "next";

const UNCCLUB_ORIGIN = "https://eganlab-uncclubmaker.vercel.app";

const nextConfig: NextConfig = {
  // The UNC club builder is a separate Vercel project (basePath: /uncclub).
  async rewrites() {
    return [
      { source: "/uncclub", destination: `${UNCCLUB_ORIGIN}/uncclub` },
      { source: "/uncclub/:path*", destination: `${UNCCLUB_ORIGIN}/uncclub/:path*` },
    ];
  },
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
