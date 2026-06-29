"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof history !== "undefined") {
      history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Double RAF ensures we run after the browser's own scroll restoration on mobile
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetScroll();
        lenis.scrollTo(0, { immediate: true });
      });
    });

    // Handle bfcache navigation (back/forward) on mobile
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetScroll();
        lenis.scrollTo(0, { immediate: true });
      }
    };
    window.addEventListener("pageshow", onPageShow);

    // Sync Lenis with GSAP ticker for ScrollTrigger
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
