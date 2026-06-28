import type { Metadata } from "next";
import { Pricing } from "@/components/sections/Pricing";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent pricing for web design, development, and automation. No hidden fees.",
};

export default function PricingPage() {
  return (
    <>
      <div className="pt-28" />
      <Pricing />
      <Contact />
      <Footer />
    </>
  );
}
