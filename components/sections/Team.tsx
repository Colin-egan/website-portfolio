"use client";

import { motion } from "framer-motion";
import { Sparkles, Globe, Bot } from "lucide-react";

const passions = [
  { icon: Globe, label: "Web Design" },
  { icon: Bot, label: "AI Agent Creation" },
  { icon: Sparkles, label: "Automation" },
];

export function Team() {
  return (
    <section className="py-32 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            className="text-sm font-medium text-purple-400 mb-4 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-8 h-px bg-purple-400" />
            The team
            <span className="w-8 h-px bg-purple-400" />
          </motion.div>
          <motion.h2
            className="text-5xl md:text-6xl font-display font-black leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            Built by one person,
            <span className="text-gradient block">obsessed with quality.</span>
          </motion.h2>
        </div>

        {/* Card */}
        <motion.div
          className="relative rounded-3xl border border-white/10 bg-secondary/30 p-10 md:p-14 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row gap-10 items-start md:items-center">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-4xl font-display font-black text-white shadow-lg shadow-purple-900/40">
                CE
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-display font-bold">Colin Egan</h3>
                <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium">
                  Founder · 2026
                </span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                I founded Egan Labs in 2026 and immediately fell in love with the intersection of
                web design, AI agent creation, and automation. What started as a curiosity became a
                mission: build beautiful, intelligent digital products that actually move the needle
                for the people behind them.
              </p>

              {/* Passions */}
              <div className="flex flex-wrap gap-3">
                {passions.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/80"
                  >
                    <Icon size={14} className="text-purple-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
