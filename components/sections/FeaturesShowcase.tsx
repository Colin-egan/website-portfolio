"use client";

import { motion } from "framer-motion";
import { CounterTile } from "@/components/features/CounterTile";
import { DraggableStack } from "@/components/features/DraggableStack";
import { ConfettiButton } from "@/components/features/ConfettiButton";
import { BlobMorph } from "@/components/features/BlobMorph";
import { ImageComparison } from "@/components/features/ImageComparison";
import { ChatbotWidget } from "@/components/features/ChatbotWidget";
import { ValidationDemo } from "@/components/features/ValidationDemo";
import { ThemeSwitcherTile } from "@/components/features/ThemeSwitcherTile";
import { ParallaxReveal } from "@/components/features/ParallaxReveal";
import { SVGPathDraw } from "@/components/features/SVGPathDraw";
import { CustomCursorTile } from "@/components/features/CustomCursorTile";
import { LottieTile } from "@/components/features/LottieTile";
import { ScrollStoryTile } from "@/components/features/ScrollStoryTile";
import { TestimonialCarouselTile } from "@/components/features/TestimonialCarouselTile";

interface TileProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function Tile({ children, className = "", delay = 0 }: TileProps) {
  return (
    <motion.div
      className={`rounded-2xl border border-white/8 bg-card p-5 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-32 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="max-w-2xl mb-16">
        <motion.div
          className="text-xs font-semibold text-purple-400 mb-4 flex items-center gap-2 tracking-[0.18em] uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="w-6 h-px bg-purple-400" />
          Live demos
        </motion.div>
        <motion.h2
          className="text-4xl md:text-5xl font-display font-black mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Every feature
          <span className="text-gradient block">working right now.</span>
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          This isn't a gallery of screenshots. Every tile below is a live, interactive demo of a feature we can build into your site.
        </motion.p>
      </div>

      {/* Bento Grid
          Mobile:  1 column — everything full-width, stacked
          Desktop: 4 columns — bento layout
      */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
        {/* Row 1 */}
        <Tile className="md:col-span-2 row-span-1" delay={0.05}>
          <CounterTile />
        </Tile>
        <Tile className="md:col-span-1 row-span-2" delay={0.1}>
          <DraggableStack />
        </Tile>
        <Tile className="md:col-span-1 row-span-1" delay={0.15}>
          <ConfettiButton />
        </Tile>

        {/* Row 2 */}
        <Tile className="md:col-span-1 row-span-1" delay={0.2}>
          <BlobMorph />
        </Tile>
        <Tile className="md:col-span-1 row-span-1" delay={0.15}>
          <CustomCursorTile />
        </Tile>

        {/* Row 3 */}
        <Tile className="md:col-span-2 row-span-2" delay={0.25}>
          <ImageComparison />
        </Tile>
        <Tile className="md:col-span-2 row-span-2" delay={0.3}>
          <ChatbotWidget />
        </Tile>

        {/* Row 5 */}
        <Tile className="md:col-span-1 row-span-2" delay={0.35}>
          <ValidationDemo />
        </Tile>
        <Tile className="md:col-span-1 row-span-1" delay={0.4}>
          <ThemeSwitcherTile />
        </Tile>
        <Tile className="md:col-span-1 row-span-1" delay={0.45}>
          <LottieTile />
        </Tile>
        <Tile className="md:col-span-1 row-span-2" delay={0.5}>
          <SVGPathDraw />
        </Tile>

        {/* Row 6 */}
        <Tile className="md:col-span-1 row-span-1" delay={0.55}>
          <ParallaxReveal />
        </Tile>

        {/* Row 7 */}
        <Tile className="md:col-span-2 row-span-2" delay={0.35}>
          <ScrollStoryTile />
        </Tile>
        <Tile className="md:col-span-2 row-span-2" delay={0.4}>
          <TestimonialCarouselTile />
        </Tile>
      </div>
    </section>
  );
}
