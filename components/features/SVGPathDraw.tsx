"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function SVGPathDraw() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-50px" });

  return (
    <div ref={ref} className="h-full flex flex-col gap-3">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">SVG Path Draw</div>
      <div className="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-[200px]" fill="none">
          {/* Checkmark */}
          <motion.path
            d="M20 60 L80 100 L180 20"
            stroke="#7C3AED"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
          />
          {/* Circle */}
          <motion.circle
            cx="100"
            cy="60"
            r="55"
            stroke="#A78BFA"
            strokeWidth="3"
            opacity={0.3}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">Scroll-triggered draw animation</p>
    </div>
  );
}
