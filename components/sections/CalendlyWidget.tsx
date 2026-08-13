"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const WIDGET_HEIGHT = "700px";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

function buildWidgetUrl(baseUrl: string) {
  const params = new URLSearchParams({
    background_color: "1a1815",
    text_color: "f7f7f7",
    primary_color: "d97706",
    hide_gdpr_banner: "1",
  });
  return `${baseUrl}?${params.toString()}`;
}

export function CalendlyWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CALENDLY_URL || !containerRef.current) return;
    // The widget script only auto-scans the DOM once, on its own load — it
    // won't discover a container that mounts later (e.g. switching tabs
    // away and back). If it's already loaded from a prior mount, init
    // explicitly instead of waiting for a load event that will never fire.
    window.Calendly?.initInlineWidget({
      url: buildWidgetUrl(CALENDLY_URL),
      parentElement: containerRef.current,
    });
  }, []);

  if (!CALENDLY_URL) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm mb-3">
          Booking is temporarily unavailable.
        </p>
        <a
          href="mailto:colinthomasegan5@gmail.com"
          className="text-amber-400 hover:text-amber-300 transition-colors font-medium text-sm"
        >
          Email us instead
        </a>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minHeight: WIDGET_HEIGHT }}>
      <div className="absolute inset-0 bg-white/3 animate-pulse" aria-hidden />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (containerRef.current) {
            window.Calendly?.initInlineWidget({
              url: buildWidgetUrl(CALENDLY_URL),
              parentElement: containerRef.current,
            });
          }
        }}
      />
      <div
        ref={containerRef}
        className="calendly-inline-widget"
        style={{ minWidth: "320px", height: WIDGET_HEIGHT }}
      />
    </div>
  );
}
