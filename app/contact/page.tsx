import type { Metadata } from "next";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start your project with Egan Lab. Free strategy call, response within 24 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Egan Lab",
    description: "Start your project with Egan Lab. Free strategy call, response within 24 hours.",
    url: "https://eganlab.com/contact",
  },
  twitter: {
    title: "Contact | Egan Lab",
    description: "Start your project with Egan Lab. Free strategy call, response within 24 hours.",
  },
};

export default function ContactPage() {
  return (
    <>
      <div className="pt-28" />
      <h1 className="sr-only">Contact Egan Lab — Start Your Web Design Project</h1>
      <Contact />
      <Footer />
    </>
  );
}
