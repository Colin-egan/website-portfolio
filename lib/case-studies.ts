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
    image: "/missionpropphoto.png",
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
    image: "/citywellphoto.png",
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
    image: "/folkscafephoto.png",
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
    image: "/wilmingtonlawyersphoto.png",
    url: "https://02-built-azbb785af-colin7.vercel.app/",
  },
];
