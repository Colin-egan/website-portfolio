"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

function AnimatedStat({ end, suffix, label, teal, startDelay = 0 }: { end: number; suffix: string; label: string; teal: boolean; startDelay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      const duration = 1800;
      const steps = 60;
      const increment = end / steps;
      let current = 0;
      timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [end, startDelay]);

  const display = `${count}${suffix}`;

  return (
    <div>
      <div
        className="text-4xl font-display font-bold"
        style={teal ? { color: "oklch(0.75 0.15 195)" } : undefined}
      >
        {teal ? display : <span className="text-gradient">{display}</span>}
      </div>
      <div className="text-base text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-start sm:items-center overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 sm:pt-32 pb-24 w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
        {/* Text column */}
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles size={14} />
            Web design & business automation
          </motion.div>

          {/* Headline — word by word reveal */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl xl:text-8xl leading-[0.9] tracking-tight mb-8 overflow-hidden">
            {["Build websites", "that"].map((line, lineIdx) => (
              <div key={lineIdx} className="overflow-hidden">
                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.4 + lineIdx * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.div>
              </div>
            ))}
            <div className="overflow-hidden">
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-black dark:text-white"
              >
                win clients.
              </motion.div>
            </div>
          </h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            Websites and automation, built with care.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/pricing"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              View Pricing
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-foreground/15 hover:border-amber-500/50 hover:bg-amber-500/10 font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Book a Call
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-60" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-8 mt-16 pt-16 border-t border-foreground/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            {[
              { end: 50, suffix: "+", label: "Projects Delivered", teal: false },
              { end: 98, suffix: "%", label: "Client Satisfaction", teal: true },
              { end: 3, suffix: "×", label: "Avg. Revenue Increase", teal: false },
              { end: 48, suffix: "h", label: "First Draft", teal: true },
            ].map((stat) => (
              <AnimatedStat key={stat.label} {...stat} startDelay={1800} />
            ))}
          </motion.div>
        </div>

        {/* Photo column */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-900/10">
            <Image
              src="/images/hero-photo.jpg"
              alt="A small business owner working at a sunlit desk"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
          </div>
          <div className="absolute -z-10 -top-8 -right-8 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
          <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 rounded-full bg-teal-400/15 blur-3xl" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}
