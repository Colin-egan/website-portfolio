"use client";

import { motion } from "framer-motion";
import { Code2, Palette, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Palette,
    title: "Web Design",
    price: "From $800",
    description:
      "Award-worthy designs that convert visitors into customers. Every pixel is intentional — from micro-interactions to full brand systems.",
    features: ["Custom UI/UX design", "Mobile-first responsive", "Design system creation", "Figma prototypes", "Animation direction"],
    color: "from-amber-600/20 to-amber-900/5",
    borderColor: "group-hover:border-amber-500/40",
    accent: "amber",
  },
  {
    icon: Code2,
    title: "Web Development",
    price: "From $800",
    description:
      "Production-ready Next.js sites with performance scores that make clients brag. Built to scale, designed to last.",
    features: ["Next.js / React builds", "Headless CMS integration", "E-commerce (Shopify)", "API development", "Lighthouse 95+"],
    color: "from-teal-600/20 to-teal-900/5",
    borderColor: "group-hover:border-teal-500/40",
    accent: "teal",
  },
  {
    icon: Zap,
    title: "Automation",
    price: "From $450",
    description:
      "Eliminate repetitive work with smart automations. From lead routing to automated email sequences — we connect your entire stack.",
    features: ["Zapier / Make / n8n", "CRM integration", "Email sequences", "Booking systems", "Custom workflow design"],
    color: "from-amber-600/20 to-amber-900/5",
    borderColor: "group-hover:border-amber-500/40",
    accent: "amber",
  },
] as const;

interface ServiceCardProps {
  service: (typeof services)[number];
}

function ServiceCard({ service }: ServiceCardProps) {
  const Icon = service.icon;
  const isTeal = service.accent === "teal";

  return (
    <motion.div
      className="group relative hover:-translate-y-1 transition-transform duration-300"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div
        className={`relative rounded-2xl border border-white/8 bg-card p-8 h-full shadow-md hover:shadow-xl transition-shadow duration-500 ${service.borderColor} ${isTeal ? "hover:shadow-teal-900/10" : "hover:shadow-amber-900/10"} overflow-hidden`}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${isTeal ? "bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20" : "bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20"}`}>
            <Icon size={22} className={isTeal ? "text-teal-500" : "text-amber-500"} />
          </div>

          <div className={`text-xs font-medium mb-2 ${isTeal ? "text-teal-500" : "text-amber-600"}`}>{service.price}</div>
          <h3 className="text-2xl font-display font-bold mb-3">{service.title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">{service.description}</p>

          <ul className="space-y-2.5 mb-8">
            {service.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`flex-shrink-0 ${isTeal ? "text-teal-500" : "text-amber-500"}`} aria-hidden>
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {feat}
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className={`inline-flex items-center gap-2 text-sm font-medium group/link transition-colors ${isTeal ? "text-teal-500 hover:text-teal-400" : "text-amber-600 hover:text-amber-500"}`}
          >
            Learn more
            <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function Services() {
  return (
    <section id="services" className="py-32 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="max-w-2xl mb-16">
        <motion.div
          className="text-sm font-semibold text-amber-600 mb-4 flex items-center gap-2 tracking-[0.12em] uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="w-8 h-px bg-amber-600" />
          What we do
        </motion.div>
        <motion.h2
          className="text-5xl md:text-6xl font-display font-black mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Everything your
          <span className="text-gradient block">digital presence needs.</span>
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Three focused services. One partner who understands how they work together to grow your business.
        </motion.p>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </div>
    </section>
  );
}
