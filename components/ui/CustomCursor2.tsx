"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorState = "default" | "link" | "drag";

const TEAL = "oklch(0.75 0.15 195)";

export function CustomCursor2() {
  const [state, setState] = useState<CursorState>("default");

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const x = useSpring(mouseX, { stiffness: 260, damping: 20 });
  const y = useSpring(mouseY, { stiffness: 260, damping: 20 });

  const dotX = useSpring(mouseX, { stiffness: 900, damping: 32 });
  const dotY = useSpring(mouseY, { stiffness: 900, damping: 32 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a") || t.closest("button")) setState("link");
      else if (t.closest("[data-cursor='drag']")) setState("drag");
      else setState("default");
    };
    const out = () => setState("default");

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
  }, [mouseX, mouseY]);

  const bracketInset = state === "link" ? 6 : 0;
  const rotation = state === "drag" ? 45 : 0;

  return (
    <>
      {/* Reticle assembly — trails cursor with heavy spring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        <svg width="60" height="60" viewBox="-30 -30 60 60" fill="none" overflow="visible">
          {/* Crosshair arms */}
          <line x1="0" y1="-8" x2="0" y2="-20" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
          <line x1="0" y1="8" x2="0" y2="20" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
          <line x1="-8" y1="0" x2="-20" y2="0" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />
          <line x1="8" y1="0" x2="20" y2="0" stroke={TEAL} strokeWidth="0.75" strokeLinecap="round" />

          {/* Corner bracket — top-left */}
          <motion.g
            animate={{ x: bracketInset, y: bracketInset }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <path d="M -20 -13 L -20 -20 L -13 -20" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.g>

          {/* Corner bracket — top-right */}
          <motion.g
            animate={{ x: -bracketInset, y: bracketInset }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <path d="M 13 -20 L 20 -20 L 20 -13" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.g>

          {/* Corner bracket — bottom-right */}
          <motion.g
            animate={{ x: -bracketInset, y: -bracketInset }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <path d="M 20 13 L 20 20 L 13 20" stroke={TEAL} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.g>

          {/* Corner bracket — bottom-left */}
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

        {/* GRAB label — visible on drag elements */}
        {state === "drag" && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] tracking-[0.2em] font-mono font-medium"
            style={{ color: TEAL }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            GRAB
          </motion.div>
        )}
      </motion.div>

      {/* Dot — snaps directly to cursor, no lag */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 3,
          height: 3,
          background: TEAL,
        }}
      />
    </>
  );
}
