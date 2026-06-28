"use client";

import { createContext, useContext, useEffect, useState } from "react";

type CursorVariant = "ring" | "reticle";

interface CursorContextValue {
  variant: CursorVariant;
  setVariant: (v: CursorVariant) => void;
  toggle: () => void;
}

const CursorContext = createContext<CursorContextValue | null>(null);

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<CursorVariant>("ring");

  useEffect(() => {
    const saved = localStorage.getItem("cursor-variant") as CursorVariant | null;
    if (saved === "ring" || saved === "reticle") setVariantState(saved);
  }, []);

  const setVariant = (v: CursorVariant) => {
    setVariantState(v);
    localStorage.setItem("cursor-variant", v);
  };

  const toggle = () => setVariant(variant === "ring" ? "reticle" : "ring");

  return (
    <CursorContext.Provider value={{ variant, setVariant, toggle }}>
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error("useCursor must be used inside CursorProvider");
  return ctx;
}
