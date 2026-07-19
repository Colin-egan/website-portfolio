"use client";

import { caseStudies } from "@/lib/case-studies";

const serviceItems = [
  "Custom Web Design", "Website Development", "E-Commerce Sites",
  "Business Automation", "Landing Pages", "Booking & CRM Setup",
  "Ongoing Support", "SEO & Performance",
];

// Repeated 3x so the "trusted by" row doesn't feel obviously short with
// only 5 real client names — the track doubles this again below.
const clientItems = [...caseStudies, ...caseStudies, ...caseStudies].map((s) => s.client);

const SECONDS_PER_ITEM = 4.5;

function MarqueeTrack({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  const duration = items.length * SECONDS_PER_ITEM;
  return (
    <div className="flex overflow-hidden">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `${reverse ? "marquee-reverse" : "marquee"} ${duration}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
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
        <MarqueeTrack items={serviceItems} />
        <MarqueeTrack items={clientItems} reverse />
      </div>
    </section>
  );
}
