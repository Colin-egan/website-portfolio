"use client";

import { useEffect, useRef, useState } from "react";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const WIDGET_HEIGHT = "700px";
const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const LOAD_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 150;

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

function UnavailableFallback({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-sm mb-3">{message}</p>
      <a
        href="mailto:colinthomasegan5@gmail.com"
        className="text-amber-400 hover:text-amber-300 transition-colors font-medium text-sm"
      >
        Email us instead
      </a>
    </div>
  );
}

export function CalendlyWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!CALENDLY_URL || !containerRef.current) return;
    const container = containerRef.current;
    const url = buildWidgetUrl(CALENDLY_URL);

    // The script's own "load" event fires once its top-level code has run,
    // but window.Calendly isn't assigned until an async step after that —
    // calling initInlineWidget right on "load" can race ahead of it and
    // silently no-op. Poll for window.Calendly instead of trusting "load"
    // timing. The overall timeout also covers ad blockers/privacy
    // extensions that drop the request entirely (no load, no error).
    const poll = window.setInterval(() => {
      // Check for initInlineWidget itself, not just window.Calendly — Calendly
      // sets window.Calendly to a placeholder before the method is attached,
      // so matching on the bare object risks calling a method that isn't
      // there yet. That throws inside this callback, and since the throw
      // happens after the clears below, it would silently kill both the
      // widget init AND the fallback timeout, leaving the skeleton stuck
      // forever with no error visible to the visitor.
      if (window.Calendly?.initInlineWidget) {
        window.clearInterval(poll);
        window.clearTimeout(timeout);
        try {
          window.Calendly.initInlineWidget({ url, parentElement: container });
        } catch {
          setLoadFailed(true);
        }
      }
    }, POLL_INTERVAL_MS);
    const timeout = window.setTimeout(() => {
      window.clearInterval(poll);
      setLoadFailed(true);
    }, LOAD_TIMEOUT_MS);

    if (!document.querySelector<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = CALENDLY_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
    };
  }, []);

  if (!CALENDLY_URL) {
    return <UnavailableFallback message="Booking is temporarily unavailable." />;
  }

  if (loadFailed) {
    return <UnavailableFallback message="Having trouble loading the calendar." />;
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minHeight: WIDGET_HEIGHT }}>
      <div className="absolute inset-0 bg-white/3 animate-pulse" aria-hidden />
      <div
        ref={containerRef}
        className="calendly-inline-widget"
        style={{ minWidth: "320px", height: WIDGET_HEIGHT }}
      />
    </div>
  );
}
