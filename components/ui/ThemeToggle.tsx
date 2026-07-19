"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className={cn(
        "p-2 rounded-lg hover:bg-foreground/5 transition-colors",
        className
      )}
    >
      {mounted ? (
        isDark ? <Sun size={18} /> : <Moon size={18} />
      ) : (
        <span className="block size-[18px]" />
      )}
    </button>
  );
}
