"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { caseStudies } from "@/lib/case-studies";

interface WorkCardProps {
  study: typeof caseStudies[0];
  index: number;
}

function WorkCard({ study, index }: WorkCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={study.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
          {/* Real photo */}
          <Image
            src={study.image}
            alt={study.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient overlay — always present for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-white/80 font-medium tracking-wide">
              {study.category}
            </span>
          </div>

          {/* Title — visible by default, fades on hover */}
          <div
            className="absolute bottom-0 left-0 right-0 p-5 transition-opacity duration-300"
            style={{ opacity: hovered ? 0 : 1 }}
          >
            <h3 className="font-display font-bold text-xl text-white leading-tight">{study.title}</h3>
            <div className="text-white/50 text-xs mt-1">{study.client} · {study.year}</div>
          </div>

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-amber-900/80 backdrop-blur-[2px]"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <div className="text-center px-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-amber-900 font-semibold text-sm mb-4">
                View Project <ArrowUpRight size={14} />
              </div>
              <p className="text-white/80 text-sm leading-relaxed max-w-[220px] mx-auto">
                {study.description.slice(0, 85)}…
              </p>
            </div>
          </div>
        </div>

        {/* Below-card meta */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg group-hover:text-amber-300 transition-colors">
              {study.title}
            </h3>
            <div className="text-muted-foreground text-sm mt-1">{study.category} · {study.year}</div>
          </div>
          <ArrowUpRight
            size={18}
            className="text-muted-foreground group-hover:text-amber-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all mt-0.5"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {study.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

export function Work() {
  return (
    <section id="work" className="py-32 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div className="max-w-xl">
          <motion.div
            className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2 tracking-[0.12em] uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-6 h-px bg-amber-400" />
            Selected work
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-display font-black leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Results that
            <span className="text-gradient block">speak louder.</span>
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            View all work
            <ArrowUpRight size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((study, i) => (
          <WorkCard key={study.slug} study={study} index={i} />
        ))}
      </div>
    </section>
  );
}
