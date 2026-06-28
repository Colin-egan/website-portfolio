"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Working with Egan Labs was the best investment I made for my business this year. Colin delivered a site in 8 days that would've taken an agency 3 months and 10× the budget. Our conversion rate doubled in the first week.",
    author: "Sarah Kim",
    role: "Founder & CEO",
    company: "LuxeBoutique",
    avatar: "SK",
    metric: "2× conversion rate",
  },
  {
    quote: "I was skeptical about the AI-powered workflow but the results speak for themselves. The automation package alone saved my team 20 hours a week. We redirected that time to growth and hit our revenue target 2 months early.",
    author: "James Müller",
    role: "Operations Director",
    company: "Ember Restaurant Group",
    avatar: "JM",
    metric: "20hrs/week saved",
  },
  {
    quote: "Our old site was embarrassing us in client meetings. Egan Labs gave us something we're genuinely proud to show. Three clients mentioned our site in their first email to us — that never happened before.",
    author: "Priya Ramanathan",
    role: "Managing Partner",
    company: "Studio Veld",
    avatar: "PR",
    metric: "420% more inquiries",
  },
  {
    quote: "The speed is unreal. I gave a brief on Monday and had a full design to review by Wednesday. By the following Friday we were live. Previous agency took 4 months for something half as good.",
    author: "Marcus Chen",
    role: "Co-Founder",
    company: "APEX Fitness",
    avatar: "MC",
    metric: "Live in 9 days",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const t = testimonials[active];

  return (
    <section
      className="py-32 bg-secondary/20 border-y border-white/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            className="text-sm font-medium text-purple-400 mb-4 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-8 h-px bg-purple-400" />
            Social proof
            <span className="w-8 h-px bg-purple-400" />
          </motion.div>
          <motion.h2
            className="text-5xl md:text-6xl font-display font-black leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            Clients who
            <span className="text-gradient block">actually got results.</span>
          </motion.h2>
        </div>

        {/* Testimonial */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <Quote size={48} className="text-purple-500/40 mx-auto mb-8" />
            <blockquote className="text-2xl md:text-3xl font-display font-medium leading-relaxed mb-10 max-w-3xl mx-auto">
              "{t.quote}"
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-lg">
                {t.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold">{t.author}</div>
                <div className="text-sm text-muted-foreground">{t.role}, {t.company}</div>
              </div>
              <div className="ml-4 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-sm font-medium">
                {t.metric}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-center gap-2 mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${
                i === active ? "w-8 h-2 bg-purple-400" : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
