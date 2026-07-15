"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCursor } from "@/components/providers/CursorProvider";

const TEAL = "oklch(0.75 0.15 195)";

export function CursorSwitcher() {
  const { variant, toggle } = useCursor();

  return (
    <motion.button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border bg-background/80 backdrop-blur-md text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200 shadow-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      title="Switch cursor style"
    >
      {/* Mini cursor preview */}
      <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
        {variant === "ring" ? (
          <RingPreview />
        ) : variant === "reticle" ? (
          <ReticlePreview />
        ) : (
          <DefaultPreview />
        )}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={variant}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {variant === "ring" ? "RING" : variant === "reticle" ? "RETICLE" : "DEFAULT"}
        </motion.span>
      </AnimatePresence>

      <span className="text-[10px] opacity-40">↕</span>
    </motion.button>
  );
}

function DefaultPreview() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 2.5L4 16.5L8 12.8L10.3 17.6L12.4 16.6L10.1 11.8L15 11.7L4 2.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RingPreview() {
  return (
    <svg width="20" height="20" viewBox="-10 -10 20 20" fill="none">
      <circle cx="0" cy="0" r="7" stroke="rgb(168 85 247 / 0.7)" strokeWidth="1" />
      <circle cx="0" cy="0" r="2" fill="rgb(192 132 252)" />
    </svg>
  );
}

function ReticlePreview() {
  return (
    <svg width="20" height="20" viewBox="-10 -10 20 20" fill="none">
      <line x1="0" y1="-3" x2="0" y2="-7" stroke={TEAL} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="0" y1="3" x2="0" y2="7" stroke={TEAL} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="-3" y1="0" x2="-7" y2="0" stroke={TEAL} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="3" y1="0" x2="7" y2="0" stroke={TEAL} strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="0" cy="0" r="1" fill={TEAL} />
    </svg>
  );
}
