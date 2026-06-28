"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeSwitcherTile() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Theme Switcher</div>
      <div className="flex rounded-xl border border-white/10 p-1 gap-1 bg-background/50">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className="relative px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <AnimatePresence>
              {theme === value && (
                <motion.div
                  layoutId="theme-pill"
                  className="absolute inset-0 bg-purple-600 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </AnimatePresence>
            <span className={`relative z-10 flex items-center gap-1.5 ${theme === value ? "text-white" : "text-muted-foreground"}`}>
              <Icon size={14} />
              {label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Try switching themes live</p>
    </div>
  );
}
