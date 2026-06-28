"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CounterProps {
  end: number;
  suffix?: string;
  label: string;
}

function Counter({ end, suffix = "", label }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-display font-black text-gradient">
        {count}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function CounterTile() {
  return (
    <div className="h-full flex flex-col justify-center gap-6 p-2">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">Animated Counters</div>
      <div className="grid grid-cols-2 gap-6">
        <Counter end={50} suffix="+" label="Projects" />
        <Counter end={98} suffix="%" label="Satisfaction" />
        <Counter end={340} suffix="%" label="Avg. Revenue" />
        <Counter end={48} suffix="h" label="First Draft" />
      </div>
    </div>
  );
}
