"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const quotes = [
  { text: "Colin delivered in 5 days. The site is stunning.", author: "Sarah K.", role: "Founder, LuxeBoutique" },
  { text: "Best investment I made for my business this year.", author: "James M.", role: "CEO, Orbit Analytics" },
  { text: "The automation alone saved us 20 hours a week.", author: "Priya R.", role: "Ops Lead, Ember Group" },
];

export function TestimonialCarouselTile() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % quotes.length), 3000);
    return () => clearInterval(t);
  }, [paused]);

  const q = quotes[index];

  return (
    <div
      className="h-full flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Testimonial Carousel</div>
      <div className="flex-1 relative overflow-hidden rounded-xl bg-secondary/20 p-4 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <div className="text-2xl text-purple-400">"</div>
            <p className="text-sm text-foreground/80 leading-relaxed">"{q.text}"</p>
            <div className="mt-1">
              <div className="text-xs font-bold">{q.author}</div>
              <div className="text-xs text-muted-foreground">{q.role}</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1.5 mt-2">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all duration-300 ${i === index ? "bg-purple-400 w-6" : "bg-white/20 w-2"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Hover to pause · Click dots to jump</p>
    </div>
  );
}
