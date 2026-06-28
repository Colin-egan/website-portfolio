"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="h-full flex flex-col gap-3 overflow-hidden">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Parallax Layers</div>
      <div className="flex-1 relative rounded-xl overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900"
          style={{ y: y2 }}
        />
        <motion.div
          className="absolute inset-4 rounded-xl bg-gradient-to-br from-purple-600/40 to-violet-600/40 backdrop-blur-sm border border-white/10"
          style={{ y: y1, opacity }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]), opacity }}
        >
          <div className="text-center">
            <div className="text-white font-bold text-sm">Scroll to see</div>
            <div className="text-purple-200 text-xs">layers move</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
