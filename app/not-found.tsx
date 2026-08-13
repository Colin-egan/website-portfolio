import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has moved.",
};

export default function NotFound() {
  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden px-6 pt-20">
      <div className="absolute inset-0 gradient-mesh noise -z-10" aria-hidden />

      <div className="relative text-center max-w-lg">
        <div className="font-display font-black text-[clamp(6rem,20vw,11rem)] leading-none text-gradient mb-2">
          404
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mb-4 text-balance">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-muted-foreground text-base mb-10 leading-relaxed">
          It was moved, renamed, or never here to begin with. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-foreground/15 hover:border-amber-500/50 hover:bg-amber-500/10 font-semibold text-base transition-all duration-300 hover:-translate-y-0.5"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
