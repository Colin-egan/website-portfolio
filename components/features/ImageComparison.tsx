"use client";

import { useRef, useState, type MouseEvent, type TouchEvent } from "react";

export function ImageComparison() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPosition(x);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) updatePosition(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    updatePosition(e.touches[0].clientX);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Before / After Slider</div>
      <div
        ref={containerRef}
        className="relative flex-1 rounded-xl overflow-hidden cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={() => setDragging(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setDragging(false)}
      >
        {/* "After" — right */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white font-bold text-lg">After</div>
            <div className="text-purple-200 text-xs">Redesigned ✨</div>
          </div>
        </div>

        {/* "Before" — left, clipped */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <div className="absolute inset-0 min-w-[calc(100vw*0.25)] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-300 font-bold text-lg">Before</div>
              <div className="text-gray-500 text-xs">Old design 😐</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-xl z-10 flex items-center justify-center"
          style={{ left: `${position}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center absolute">
            <div className="flex gap-0.5">
              <span className="w-px h-3 bg-gray-800" />
              <span className="w-px h-3 bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Drag to compare</p>
    </div>
  );
}
