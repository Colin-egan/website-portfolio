import type { Metadata } from "next";
import { Work } from "@/components/sections/Work";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies from Egan Labs — real results for real clients.",
};

export default function WorkPage() {
  return (
    <>
      <div className="pt-28" />
      <Work />
      <Contact />
      <Footer />
    </>
  );
}
