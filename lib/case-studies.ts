export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  color: string;
  image: string;
  url: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "mission-properties",
    title: "Mission Properties",
    client: "Mission Properties",
    category: "Real Estate",
    year: "2025",
    description: "A modern property listing and marketing site built to convert visitors into leads.",
    tags: ["Next.js", "Tailwind", "Framer Motion"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    url: "https://missionproperties.vercel.app/",
  },
  {
    slug: "city-well",
    title: "City Well",
    client: "City Well",
    category: "Community",
    year: "2025",
    description: "A clean, welcoming web presence for a community-focused organization.",
    tags: ["Next.js", "Tailwind"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    url: "https://citywell.vercel.app/",
  },
  {
    slug: "folks-cafe",
    title: "Folks Cafe",
    client: "Folks Cafe",
    category: "Hospitality",
    year: "2025",
    description: "A warm, inviting website for an independent cafe — built to drive foot traffic and online orders.",
    tags: ["Next.js", "Tailwind", "Framer Motion"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    url: "https://folks-cafe.vercel.app/",
  },
  {
    slug: "wilmington-lawyers",
    title: "Wilmington Lawyers",
    client: "Wilmington Lawyers",
    category: "Legal",
    year: "2025",
    description: "A professional, trust-building website for a Wilmington-area law firm.",
    tags: ["Next.js", "Tailwind"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    url: "https://02-built-azbb785af-colin7.vercel.app/",
  },
];
