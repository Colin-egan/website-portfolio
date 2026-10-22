import type { Metadata } from "next";
import { PresentationChat } from "@/components/presentation/PresentationChat";

export const metadata: Metadata = {
  title: "Presentation",
  robots: { index: false, follow: false },
};

export default function PresentationPage() {
  return (
    <>
      <div className="pt-28" />
      <h1 className="sr-only">Presentation chat</h1>
      <PresentationChat />
    </>
  );
}
