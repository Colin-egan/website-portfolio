"use client";

import { MousePointer2 } from "lucide-react";

export function CustomCursorTile() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Custom Cursor</div>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-purple-500/60 animate-ping absolute opacity-30" />
        <div className="w-10 h-10 rounded-full border border-purple-400 flex items-center justify-center relative">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
        </div>
        <MousePointer2 size={18} className="absolute -right-2 -bottom-2 text-purple-300" />
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[140px]">
        Morphing cursor active on this entire page
      </p>
    </div>
  );
}
