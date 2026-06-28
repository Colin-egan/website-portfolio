"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorType, setCursorType] = useState<"default" | "hover" | "link" | "drag">("default");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 500, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 28 });

  const dotX = useSpring(mouseX, { stiffness: 1000, damping: 35 });
  const dotY = useSpring(mouseY, { stiffness: 1000, damping: 35 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a") || target.closest("button")) {
        setCursorType("link");
      } else if (target.closest("[data-cursor='drag']")) {
        setCursorType("drag");
      } else if (target.closest("[data-cursor='hover']")) {
        setCursorType("hover");
      }
    };

    const handleLeave = () => setCursorType("default");

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", handleEnter);
    window.addEventListener("mouseout", handleLeave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", handleEnter);
      window.removeEventListener("mouseout", handleLeave);
    };
  }, [mouseX, mouseY]);

  const ringSize = cursorType === "link" ? 48 : cursorType === "drag" ? 56 : cursorType === "hover" ? 40 : 32;
  const dotSize = cursorType === "link" ? 6 : 8;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border border-purple-500/60 mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          width: ringSize,
          height: ringSize,
        }}
        animate={{ width: ringSize, height: ringSize }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-purple-400"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: dotSize,
          height: dotSize,
        }}
        animate={{ width: dotSize, height: dotSize }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
      {/* Drag label */}
      {cursorType === "drag" && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] text-xs text-white font-medium"
          style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          DRAG
        </motion.div>
      )}
    </>
  );
}
