"use client";

const techItems = [
  "React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion",
  "GSAP", "Three.js", "Supabase", "Vercel", "Shopify", "Webflow",
  "Figma", "Node.js", "Stripe", "OpenAI", "n8n", "Zapier", "Make",
];

const skillItems = [
  "Web Design", "UI/UX", "E-Commerce", "SaaS Dashboards", "Landing Pages",
  "Automation", "CRM Integration", "SEO Optimization", "Performance Tuning",
  "Animation", "3D Experiences", "Headless CMS",
];

function MarqueeTrack({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} 35s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section className="py-16 border-y border-white/5 bg-secondary/20 overflow-hidden">
      <div className="space-y-4">
        <MarqueeTrack items={techItems} />
        <MarqueeTrack items={skillItems} reverse />
      </div>
    </section>
  );
}
