import type { Metadata } from "next";
import { Work } from "@/components/sections/Work";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies from Egan Lab — real results for real clients.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Selected Work | Egan Lab",
    description: "Selected case studies from Egan Lab — real results for real clients.",
    url: "https://eganlab.com/work",
  },
  twitter: {
    title: "Selected Work | Egan Lab",
    description: "Selected case studies from Egan Lab — real results for real clients.",
  },
};

export default function WorkPage() {
  return (
    <>
      <div className="pt-28" />
      <h1 className="sr-only">Selected Work — Web Design & Development Case Studies</h1>
      <Work />
      <Contact />
      <Footer />
    </>
  );
}
