"use client";

import { useCursor } from "@/components/providers/CursorProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { CustomCursor2 } from "@/components/ui/CustomCursor2";

export function ActiveCursor() {
  const { variant } = useCursor();
  if (variant === "default") return null;
  return variant === "reticle" ? <CustomCursor2 /> : <CustomCursor />;
}
