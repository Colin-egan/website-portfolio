"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = ["Discover", "Design", "Build", "Launch"];

export function ScrollStoryTile() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <div ref={ref} className="h-full flex flex-col gap-3 overflow-hidden">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Scroll Storytelling</div>
      <div className="flex-1 relative overflow-hidden rounded-xl bg-secondary/20">
        <motion.div className="flex h-full" style={{ x }}>
          {steps.map((step, i) => (
            <div
              key={step}
              className="flex-none w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ minWidth: "100%" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: `oklch(${0.59 - i * 0.06} 0.22 293)` }}
              >
                {i + 1}
              </div>
              <div className="text-sm font-bold">{step}</div>
            </div>
          ))}
        </motion.div>
        {/* Progress dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Scroll-driven horizontal narrative</p>
    </div>
  );
}
