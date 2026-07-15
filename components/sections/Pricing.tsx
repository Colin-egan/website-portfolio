"use client";

import { motion } from "framer-motion";
import { Check, Zap, Star } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Website Build",
    price: "$800",
    period: "starting at",
    description: "A fully custom, production-ready website that converts visitors into customers.",
    features: [
      "Custom design (no templates)",
      "Fully responsive, mobile-first",
      "Up to 5 pages",
      "SEO basics + sitemap",
      "Contact form integration",
      "Deployment on Vercel",
      "48-hour first draft",
      "Unlimited revisions",
    ],
    cta: "Start a Project",
    featured: false,
    icon: Zap,
  },
  {
    name: "Ongoing Management",
    price: "$30",
    period: "/month",
    description: "We handle everything so you can focus on running your business.",
    features: [
      "Hosting oversight",
      "Client portal access",
      "Content updates (up to 4/mo)",
      "Security monitoring",
      "Performance checks",
      "Minor design edits",
      "Monthly analytics report",
      "Priority support",
      "Plugin/dependency updates",
    ],
    cta: "Start Subscription",
    featured: true,
    badge: "Most Popular",
    icon: Star,
  },
  {
    name: "Automation Package",
    price: "$450",
    period: "one-time",
    description: "Stop doing repetitive work manually. Let AI and automation handle it.",
    features: [
      "Workflow automation (Zapier/Make/n8n)",
      "Client portal setup",
      "Remote data storage on Supabase",
      "Form-to-CRM integration",
      "Email sequence setup",
      "Booking system integration",
      "Lead routing automation",
      "Custom integrations",
      "Documentation included",
      "1-hour training call",
    ],
    cta: "Automate Your Business",
    featured: false,
    icon: Zap,
  },
];

const faqs = [
  {
    q: "How quickly can you start?",
    a: "Usually within 24–48 hours of our first call. We block out time specifically for your project so there's no waiting in a queue.",
  },
  {
    q: "Do I need to provide copy and images?",
    a: "You can, but you don't have to. We write compelling placeholder copy and source professional stock images. Most clients provide a rough brief and let us handle the rest.",
  },
  {
    q: "Can I add the Ongoing Management plan later?",
    a: "Absolutely. Many clients start with a Website Build and add management once they see how much time it saves. There's no lock-in period.",
  },
  {
    q: "What happens if I need more than 5 pages?",
    a: "Additional pages are $50 each. Complex pages (e-commerce, dashboards, booking systems) are quoted individually based on scope.",
  },
  {
    q: "Do you work with existing websites?",
    a: "Yes! Redesigns, migrations, and performance audits are all available. Book a call and we'll assess your current site and recommend the best approach.",
  },
  {
    q: "Is the Automation Package compatible with any CRM?",
    a: "We work with HubSpot, Notion, Airtable, Monday.com, GoHighLevel, Salesforce, and most tools that have a public API or Zapier/Make integration.",
  },
  {
    q: "What's your revision policy?",
    a: "Unlimited revisions on design and copy before final approval. Post-launch changes are covered under Ongoing Management, or billed at $60/hour for one-off requests.",
  },
  {
    q: "Can you build e-commerce stores?",
    a: "Yes. Shopify, WooCommerce, and custom Next.js + Stripe stores. E-commerce is quoted separately as it varies significantly by product count and feature requirements.",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            className="text-sm font-medium text-purple-400 mb-4 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-8 h-px bg-purple-400" />
            Pricing
            <span className="w-8 h-px bg-purple-400" />
          </motion.div>
          <motion.h2
            className="text-5xl md:text-6xl font-display font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Transparent pricing.
            <span className="text-gradient block">No surprises.</span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Three focused packages designed to grow with your business.
          </motion.p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 ${
                plan.featured
                  ? "bg-purple-600 glow"
                  : "bg-card border border-white/8 hover:border-purple-500/30"
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-purple-900 text-xs font-bold">
                  {plan.badge}
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${plan.featured ? "bg-white/20" : "bg-purple-500/10 border border-purple-500/20"}`}>
                <plan.icon size={18} className={plan.featured ? "text-white" : "text-purple-400"} />
              </div>

              <div className={`text-sm font-medium mb-2 ${plan.featured ? "text-purple-200" : "text-purple-400"}`}>
                {plan.name}
              </div>
              <div className="flex items-end gap-1 mb-4">
                <span className={`text-5xl font-display font-black ${plan.featured ? "text-white" : ""}`}>
                  {plan.price}
                </span>
                <span className={`text-sm mb-2 ${plan.featured ? "text-purple-200" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-8 leading-relaxed ${plan.featured ? "text-purple-100" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className={`flex-shrink-0 mt-0.5 ${plan.featured ? "text-purple-200" : "text-purple-400"}`} />
                    <span className={plan.featured ? "text-purple-100" : "text-muted-foreground"}>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.featured
                    ? "bg-white text-purple-700 hover:bg-purple-50"
                    : "border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/60"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <motion.h3
            className="text-3xl font-display font-bold text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Frequently asked questions
          </motion.h3>
          <Accordion multiple={false} className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="border border-white/8 rounded-xl px-5 bg-card data-[state=open]:border-purple-500/30"
                >
                  <AccordionTrigger className="text-sm font-medium hover:no-underline hover:text-purple-300 transition-colors py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
