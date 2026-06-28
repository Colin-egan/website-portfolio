import type { Metadata } from "next";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start your project with Egan Labs. Free strategy call, response within 24 hours.",
};

export default function ContactPage() {
  return (
    <>
      <div className="pt-28" />
      <Contact />
      <Footer />
    </>
  );
}
