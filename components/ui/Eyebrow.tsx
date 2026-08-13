"use client";

import { motion } from "framer-motion";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <motion.div
      className={`inline-flex items-center gap-2.5 mb-4 font-display italic lowercase text-lg text-amber-400 ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <span className="w-6 h-px bg-amber-400" aria-hidden />
      {children}
    </motion.div>
  );
}
