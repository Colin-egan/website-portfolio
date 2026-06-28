"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

const cards = [
  { id: 1, color: "from-purple-600 to-indigo-700", label: "Drag me!" },
  { id: 2, color: "from-violet-600 to-purple-700", label: "Card 2" },
  { id: 3, color: "from-indigo-600 to-violet-700", label: "Card 3" },
];

function DraggableCard({ card, index, total }: { card: typeof cards[0]; index: number; total: number }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const offset = (total - 1 - index) * 6;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      data-cursor="drag"
      style={{
        x,
        rotate,
        y: -offset,
        zIndex: index,
      }}
      drag="x"
      dragConstraints={{ left: -150, right: 150 }}
      dragElastic={0.3}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      onDragEnd={() => {
        x.set(0);
      }}
    >
      <div
        className={`w-full h-full rounded-xl bg-gradient-to-br ${card.color} flex items-end p-4 shadow-xl`}
      >
        <span className="text-white/80 text-sm font-medium">{card.label}</span>
      </div>
    </motion.div>
  );
}

export function DraggableStack() {
  return (
    <div className="h-full flex flex-col">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest mb-4">Draggable Cards</div>
      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative w-full h-36">
          {cards.map((card, i) => (
            <DraggableCard key={card.id} card={card} index={i} total={cards.length} />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">Drag left or right</p>
    </div>
  );
}
