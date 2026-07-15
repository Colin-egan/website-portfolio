"use client";

import { useRef, useState, type MouseEvent } from "react";
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
    color: "from-purple-600/20 to-purple-900/5",
    borderColor: "group-hover:border-purple-500/40",
  },
  {
    icon: Code2,
    title: "Web Development",
    price: "From $800",
    description:
      "Production-ready Next.js sites with performance scores that make clients brag. Built to scale, designed to last.",
    features: ["Next.js / React builds", "Headless CMS integration", "E-commerce (Shopify)", "API development", "Lighthouse 95+"],
    color: "from-violet-600/20 to-violet-900/5",
    borderColor: "group-hover:border-violet-500/40",
  },
  {
    icon: Zap,
    title: "Automation",
    price: "From $450",
    description:
      "Eliminate repetitive work with smart automations. From lead routing to AI-powered email sequences — we connect your entire stack.",
    features: ["Zapier / Make / n8n", "CRM integration", "Email sequences", "Booking systems", "AI workflow design"],
    color: "from-indigo-600/20 to-indigo-900/5",
    borderColor: "group-hover:border-indigo-500/40",
  },
];

interface TiltCardProps {
  service: typeof services[0];
  index: number;
}

function TiltCard({ service, index }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setTilt({ x, y });
  };

  const Icon = service.icon;

  return (
    <motion.div
      ref={ref}
      className="group relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      animate={{ rotateX: tilt.y, rotateY: tilt.x }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div
        className={`relative rounded-2xl border border-white/8 bg-card p-8 h-full transition-all duration-500 ${service.borderColor} overflow-hidden`}
        style={{
          boxShadow: hovered
            ? "0 30px 60px -15px oklch(0.42 0.22 293 / 25%)"
            : "0 4px 20px -4px oklch(0 0 0 / 30%)",
          transform: "translateZ(0)",
        }}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        {/* 3D inner glow layer */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: hovered ? 1 : 0 }}
          style={{
            background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(0.59 0.22 293 / 8%) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
            <Icon size={22} className="text-purple-400" />
          </div>

          <div className="text-xs font-medium text-purple-400 mb-2">{service.price}</div>
          <h3 className="text-2xl font-display font-bold mb-3">{service.title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">{service.description}</p>

          <ul className="space-y-2.5 mb-8">
            {service.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-purple-400" aria-hidden>
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {feat}
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 group/link transition-colors"
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
          className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2 tracking-[0.12em] uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="w-8 h-px bg-purple-400" />
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
      <div className="grid md:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
        {services.map((service, i) => (
          <TiltCard key={service.title} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
