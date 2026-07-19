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
  /** Path to a short walkthrough video, e.g. "/videos/mission-properties.mp4". Optional — section is hidden when absent. */
  video?: string;
  /** "Old site" screenshot. When set, renders a before/after slider against `image` as the "after". */
  beforeImage?: string;
  /** Walkthrough of the old site. Paired with `videoAfter` to render a before/after video comparison. */
  videoBefore?: string;
  /** Walkthrough of the rebuilt site. Paired with `videoBefore` to render a before/after video comparison. */
  videoAfter?: string;
  /** Extra screenshots shown in a gallery grid below the main content. */
  gallery?: string[];
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
    videoBefore: "/videos/mission-properties-before.mp4",
    videoAfter: "/videos/mission-properties-after.mp4",
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
  {
    slug: "bloke-apparel-supply",
    title: "Bloke Apparel & Supply",
    client: "Bloke Apparel & Supply",
    category: "Retail",
    year: "2026",
    description: "An independent menswear and supply shop site built around curated, shop-floor-tested goods rather than warehouse inventory.",
    tags: ["Next.js", "Tailwind"],
    color: "#7C3AED",
    image: "/blokeapparelphoto.png",
    url: "https://bloke-apparel-supply.vercel.app/index.html",
  },
];
