import type { MetadataRoute } from "next";

// Note: /work/[slug] routes are intentionally excluded — they immediately
// redirect off-domain to each client's live site, so there's no on-domain
// content for search engines to index there.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://eganlab.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    { url: `${base}/work`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  ];
}
