export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  category: string;
  year: string;
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  tags: string[];
  color: string;
  image: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "luxe-ecommerce",
    title: "Luxe Commerce Rebrand",
    client: "Luxe Boutique",
    category: "E-Commerce",
    year: "2024",
    description: "A complete digital transformation for a high-end fashion retailer, resulting in a 340% increase in online revenue.",
    challenge: "The client's outdated WooCommerce site was losing customers to competitors with superior UX. Mobile conversion sat at 0.8%.",
    solution: "Rebuilt on Next.js with a custom headless Shopify integration, immersive product photography layouts, and a one-click checkout flow.",
    results: ["340% increase in online revenue", "Mobile conversion up from 0.8% to 4.2%", "Page load time reduced from 8s to 0.9s", "Featured on Awwwards SOTD"],
    tags: ["Next.js", "Shopify", "Framer Motion", "Tailwind"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    slug: "saas-dashboard",
    title: "Orbit SaaS Platform",
    client: "Orbit Analytics",
    category: "SaaS / Dashboard",
    year: "2024",
    description: "A data-dense analytics dashboard that feels effortless to navigate — turning complex metrics into beautiful, actionable insights.",
    challenge: "Existing dashboard overwhelmed users with raw data. Churn was 34% in the first 30 days due to onboarding friction.",
    solution: "Designed a progressive disclosure interface with animated data visualizations, AI-assisted insights panel, and guided onboarding flow.",
    results: ["30-day churn reduced from 34% to 9%", "User session time increased 3.2×", "NPS score jumped from 22 to 67", "Won 2024 SaaS UX Award"],
    tags: ["React", "TypeScript", "Recharts", "Tailwind", "Supabase"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    slug: "restaurant-booking",
    title: "Ember Restaurant Group",
    client: "Ember Restaurants",
    category: "Hospitality",
    year: "2024",
    description: "A cinematic website for a Michelin-starred restaurant group that drove 280% more direct bookings vs. third-party platforms.",
    challenge: "The group was paying 30% commission to OpenTable. They needed a direct booking system that matched their premium brand.",
    solution: "Built a custom reservation system with atmospheric animations, automated email sequences, and Stripe deposits to reduce no-shows.",
    results: ["280% increase in direct bookings", "$180k saved in annual commission fees", "No-show rate down from 22% to 4%", "Waitlist feature generates 800+ sign-ups/month"],
    tags: ["Next.js", "Stripe", "Resend", "GSAP", "Prisma"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  },
  {
    slug: "fitness-app",
    title: "APEX Fitness App",
    client: "APEX Training",
    category: "Health & Fitness",
    year: "2023",
    description: "A subscription fitness platform with AI-generated workout plans and real-time form feedback, hitting 50k users in 6 months.",
    challenge: "Fitness apps are a crowded market. The client needed a differentiated product with strong retention hooks beyond basic content.",
    solution: "Built adaptive AI workout generation, social accountability features, and streak mechanics that made users return daily.",
    results: ["50,000 users in 6 months", "89% 30-day retention rate", "$280k MRR at month 6", "Featured in TechCrunch"],
    tags: ["React Native", "Next.js", "OpenAI", "Supabase", "Stripe"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  },
  {
    slug: "architecture-portfolio",
    title: "Studio Veld Portfolio",
    client: "Studio Veld",
    category: "Portfolio",
    year: "2023",
    description: "An award-winning portfolio site for a Rotterdam architecture firm, shortlisted for Awwwards Site of the Year.",
    challenge: "Architecture clients are visually sophisticated. Generic portfolio templates weren't communicating the firm's design philosophy.",
    solution: "Custom scroll-driven narrative that 'constructs' each project as you scroll, with WebGL-powered image transitions.",
    results: ["Shortlisted for Awwwards SOTY", "New project inquiries up 420%", "Average session duration: 8.4 minutes", "Press coverage in Dezeen and ArchDaily"],
    tags: ["Next.js", "Three.js", "GSAP", "Lenis", "Framer Motion"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
  },
  {
    slug: "crypto-exchange",
    title: "Nexus Exchange",
    client: "Nexus Financial",
    category: "FinTech",
    year: "2023",
    description: "A crypto trading platform that makes complex DeFi accessible to mainstream users through thoughtful UX design.",
    challenge: "Crypto UX is notoriously hostile to newcomers. The client was losing 70% of sign-ups before first trade.",
    solution: "Designed a tiered interface — beginner mode with guided flows, and an advanced mode with full trading tools — same codebase.",
    results: ["Sign-up to first trade rate up from 30% to 72%", "Trading volume 2.1× industry average", "$42M in first-month trading volume", "Zero critical security incidents"],
    tags: ["Next.js", "Web3.js", "TypeScript", "WebSocket", "Tailwind"],
    color: "#7C3AED",
    image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80",
  },
];
