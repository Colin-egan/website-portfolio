"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function LottieTile() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Lottie Animation</div>
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Simulated Lottie with CSS animations */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-purple-500/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-purple-400/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-purple-600"
            animate={{ scale: [1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          </motion.div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Lottie JSON animation support</p>
    </div>
  );
}
