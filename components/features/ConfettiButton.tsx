"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";

export function ConfettiButton() {
  const [fired, setFired] = useState(false);

  const fire = useCallback(async () => {
    setFired(true);
    setTimeout(() => setFired(false), 3000);

    const confetti = (await import("canvas-confetti")).default;
    const end = Date.now() + 1500;

    const colors = ["#7C3AED", "#A78BFA", "#DDD6FE", "#ffffff", "#4C1D95"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors,
    });
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Confetti on Click</div>
      <button
        onClick={fire}
        className={`relative group px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 overflow-hidden ${
          fired
            ? "bg-purple-400 scale-95"
            : "bg-purple-600 hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/30"
        }`}
      >
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles size={16} className={fired ? "animate-spin" : ""} />
          {fired ? "🎉 Woohoo!" : "Click me!"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <p className="text-xs text-muted-foreground">Fires a confetti burst</p>
    </div>
  );
}
