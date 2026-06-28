"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type State = "default" | "link" | "drag";

const TEAL = "oklch(0.75 0.15 195)";
const TEAL_DIM = "oklch(0.75 0.15 195 / 0.45)";

const sequence: { state: State; duration: number }[] = [
  { state: "default", duration: 1200 },
  { state: "link", duration: 1500 },
  { state: "default", duration: 700 },
  { state: "drag", duration: 1500 },
];

export function CustomCursorTile2() {
  const [state, setState] = useState<State>("default");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = (idx + 1) % sequence.length;
      setIdx(next);
      setState(sequence[next].state);
    }, sequence[idx].duration);
    return () => clearTimeout(t);
  }, [idx]);

  const bracketInset = state === "link" ? 6 : 0;
  const rotation = state === "drag" ? 45 : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: TEAL }}
      >
        Reticle Cursor
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
        {/* Ambient glow */}
        <div
          className="absolute w-20 h-20 rounded-full blur-xl opacity-20"
          style={{ background: TEAL }}
        />

        <motion.div
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
        >
          <svg width="80" height="80" viewBox="-30 -30 60 60" fill="none" overflow="visible">
            {/* Crosshair arms */}
            <line x1="0" y1="-8" x2="0" y2="-20" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
            <line x1="0" y1="8" x2="0" y2="20" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
            <line x1="-8" y1="0" x2="-20" y2="0" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
            <line x1="8" y1="0" x2="20" y2="0" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />

            {/* Brackets — top-left */}
            <motion.g
              animate={{ x: bracketInset, y: bracketInset }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <path d="M -20 -13 L -20 -20 L -13 -20" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>

            {/* Brackets — top-right */}
            <motion.g
              animate={{ x: -bracketInset, y: bracketInset }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <path d="M 13 -20 L 20 -20 L 20 -13" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>

            {/* Brackets — bottom-right */}
            <motion.g
              animate={{ x: -bracketInset, y: -bracketInset }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <path d="M 20 13 L 20 20 L 13 20" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>

            {/* Brackets — bottom-left */}
            <motion.g
              animate={{ x: bracketInset, y: -bracketInset }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <path d="M -13 20 L -20 20 L -20 13" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>

            {/* Center dot */}
            <motion.circle
              cx="0"
              cy="0"
              fill={TEAL}
              animate={{ r: state === "link" ? 3 : 1.5 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            />
          </svg>
        </motion.div>

        {/* State label */}
        <motion.span
          className="absolute text-[8px] tracking-[0.18em] font-mono font-medium"
          style={{ color: TEAL, bottom: 6 }}
          animate={{ opacity: state !== "default" ? 1 : 0, y: state !== "default" ? 0 : 4 }}
          transition={{ duration: 0.2 }}
        >
          {state === "link" ? "LOCK ON" : state === "drag" ? "GRAB" : ""}
        </motion.span>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-[140px]">
        Precision reticle — alternate cursor style
      </p>
    </div>
  );
}
