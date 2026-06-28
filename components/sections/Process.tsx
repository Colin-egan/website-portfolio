"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We start with a 45-minute strategy call to understand your goals, audience, and what success looks like. No cookie-cutter templates here.",
    duration: "Day 1",
  },
  {
    number: "02",
    title: "Strategy",
    description:
      "We map out your sitemap, user flows, and content architecture. You get a clear roadmap before a single pixel is designed.",
    duration: "Day 1–2",
  },
  {
    number: "03",
    title: "Design",
    description:
      "High-fidelity Figma mockups with your branding, animations, and interactions. First draft in 48 hours. Revisions are unlimited.",
    duration: "Day 2–5",
  },
  {
    number: "04",
    title: "Build",
    description:
      "Clean, performant Next.js code. Every feature is tested across devices and browsers before you see it. Lighthouse scores matter.",
    duration: "Day 5–10",
  },
  {
    number: "05",
    title: "Launch",
    description:
      "Deployed to Vercel with custom domain, SSL, analytics, and SEO configured. We stay on call for 48 hours post-launch.",
    duration: "Day 10–14",
  },
];

export function Process() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section id="process" ref={ref} className="py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <motion.div
            className="text-xs font-semibold text-purple-400 mb-4 flex items-center gap-2 tracking-[0.18em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-6 h-px bg-purple-400" />
            How it works
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-display font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            From idea to launch
            <span className="text-gradient block">in 14 days.</span>
          </motion.h2>
        </div>

        {/* Steps — horizontal on desktop, vertical timeline on mobile */}
        <div className="relative">
          {/* Desktop horizontal connector line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          {/* Mobile vertical connector line */}
          <div className="md:hidden absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-purple-500/20 to-transparent" />

          <div className="grid md:grid-cols-5 gap-0 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="relative group flex md:block gap-6 pb-10 md:pb-0 last:pb-0"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Step number dot */}
                <div className="w-16 h-16 rounded-full border border-purple-500/30 bg-card flex items-center justify-center mb-0 md:mb-6 relative z-10 group-hover:border-purple-500/60 group-hover:bg-purple-500/10 transition-all duration-300 flex-shrink-0">
                  <span className="font-display font-black text-xl text-gradient">{step.number}</span>
                </div>

                <div className="pt-2 md:pt-0">
                  <div className="text-xs text-purple-400 font-medium mb-2 tracking-wide">{step.duration}</div>
                  <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <a
            href="/contact"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Start your project
          </a>
          <p className="text-muted-foreground text-sm mt-4">Free strategy call · No commitment</p>
        </motion.div>
      </div>
    </section>
  );
}
