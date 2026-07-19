"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface BrandShot {
  src: string;
  alt: string;
  label: string;
  credit: string;
  rotate: number;
  offset: number;
}

const shots: BrandShot[] = [
  {
    src: "/images/brand-real-estate.jpg",
    alt: "Sunlit front porch of a craftsman-style home",
    label: "Real Estate",
    credit: "Robin Jonathan Deutsch",
    rotate: -3,
    offset: 14,
  },
  {
    src: "/images/brand-community.jpg",
    alt: "A community farmers market table beneath shade trees",
    label: "Community",
    credit: "Kyle Nieber",
    rotate: 2,
    offset: -20,
  },
  {
    src: "/images/brand-hospitality.jpg",
    alt: "Warm, plant-filled café interior with a wooden bar",
    label: "Hospitality",
    credit: "Ruben Ramirez",
    rotate: -2,
    offset: 18,
  },
  {
    src: "/images/brand-legal.jpg",
    alt: "Rows of leather-bound law books on a library shelf",
    label: "Legal",
    credit: "Thomas Bormans",
    rotate: 3,
    offset: -14,
  },
  {
    src: "/images/brand-retail.jpg",
    alt: "Independent boutique clothing racks under pendant lights",
    label: "Retail",
    credit: "Clark Street Mercantile",
    rotate: -4,
    offset: 10,
  },
];

function Photo({ shot, index }: { shot: BrandShot; index: number }) {
  return (
    <motion.div
      className="relative flex-shrink-0 w-56 sm:w-60 md:w-auto md:flex-1 snap-center"
      style={{ marginTop: shot.offset }}
      initial={{ opacity: 0, y: 50, rotate: shot.rotate }}
      whileInView={{ opacity: 1, y: 0, rotate: shot.rotate }}
      whileHover={{ rotate: 0, y: -10, scale: 1.05 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Washi tape */}
      <div
        aria-hidden
        className="absolute -top-2.5 left-1/2 z-10 w-16 h-5 bg-amber-400/80 shadow-sm"
        style={{ transform: "translateX(-50%) rotate(-6deg)" }}
      />

      <div className="bg-white p-3 pb-9 rounded-sm shadow-xl shadow-black/30">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1px]">
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 18vw"
          />
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="font-display text-sm font-bold tracking-wide text-neutral-800">
            {shot.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function BrandGallery() {
  return (
    <section className="relative py-28 border-y border-white/5 bg-secondary/15 overflow-hidden">
      <div className="absolute -z-10 top-0 left-1/4 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
      <div className="absolute -z-10 bottom-0 right-1/4 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" aria-hidden />

      <div className="max-w-3xl mx-auto px-6 text-center mb-16">
        <motion.div
          className="text-sm font-semibold text-amber-600 mb-4 flex items-center justify-center gap-2 tracking-[0.12em] uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="w-6 h-px bg-amber-600" />
          Who we build for
          <span className="w-6 h-px bg-amber-600" />
        </motion.div>
        <motion.h2
          className="text-4xl md:text-5xl font-display font-black leading-tight mb-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          We design for
          <span className="text-gradient block">Main Street businesses.</span>
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Cafés, boutiques, law firms, real estate offices, and the community groups that hold a town together.
        </motion.p>
      </div>

      <div className="flex gap-6 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none px-6 md:px-0 max-w-7xl mx-auto pb-6 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shots.map((shot, i) => (
          <Photo key={shot.label} shot={shot} index={i} />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground/50 mt-10 px-6">
        Photos via Unsplash — {shots.map((s) => s.credit).join(" · ")}
      </p>
    </section>
  );
}
