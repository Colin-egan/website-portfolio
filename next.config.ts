import type { NextConfig } from "next";

const UNCCLUB_ORIGIN = "https://eganlab-uncclubmaker.vercel.app";

const nextConfig: NextConfig = {
  // The club builder is a separate Vercel project (basePath: /clubs).
  async rewrites() {
    return [
      { source: "/clubs", destination: `${UNCCLUB_ORIGIN}/clubs` },
      { source: "/clubs/:path*", destination: `${UNCCLUB_ORIGIN}/clubs/:path*` },
    ];
  },
  // Keep links to the old /uncclub path working.
  async redirects() {
    return [
      { source: "/uncclub", destination: "/clubs", permanent: false },
      { source: "/uncclub/:path*", destination: "/clubs/:path*", permanent: false },
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
