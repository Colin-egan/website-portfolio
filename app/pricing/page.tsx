import type { Metadata } from "next";
import { Pricing } from "@/components/sections/Pricing";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Transparent pricing for web design, development, and automation. No hidden fees.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Egan Lab",
    description: "Transparent pricing for web design, development, and automation. No hidden fees.",
    url: "https://eganlab.com/pricing",
  },
  twitter: {
    title: "Pricing | Egan Lab",
    description: "Transparent pricing for web design, development, and automation. No hidden fees.",
  },
};

export default function PricingPage() {
  return (
    <>
      <div className="pt-28" />
      <h1 className="sr-only">Pricing — Web Design, Development & Automation Packages</h1>
      <Pricing />
      <Contact />
      <Footer />
    </>
  );
}
