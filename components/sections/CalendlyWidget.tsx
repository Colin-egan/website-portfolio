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
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (!CALENDLY_URL || !containerRef.current) return;
    const container = containerRef.current;
    const url = buildWidgetUrl(CALENDLY_URL);

    // Calendly signals nothing when the widget finishes rendering, and
    // initInlineWidget returning tells us only that the call was made — not
    // that a calendar actually appeared. Watch for the iframe it injects so
    // "ready" reflects something the visitor can genuinely see.
    const observer = new MutationObserver(() => {
      if (container.querySelector("iframe")) {
        window.clearInterval(poll);
        window.clearTimeout(timeout);
        observer.disconnect();
        setStatus("ready");
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const fail = () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      observer.disconnect();
      setStatus("failed");
    };

    // On first load the script's own auto-scan initializes the container (it
    // needs the data-url attribute set in the markup below — without it the
    // scan throws, and that exception aborts the script before it ever
    // assigns window.Calendly). It only scans once though, so a container
    // mounted later — switching tabs away and back — has to be initialized
    // by hand. Calendly stamps data-processed on anything its scan touched,
    // which distinguishes the two cases without double-initializing.
    const poll = window.setInterval(() => {
      if (container.dataset.processed === "true" || container.querySelector("iframe")) {
        window.clearInterval(poll);
        return;
      }
      if (window.Calendly?.initInlineWidget) {
        window.clearInterval(poll);
        try {
          window.Calendly.initInlineWidget({ url, parentElement: container });
        } catch {
          fail();
        }
      }
    }, POLL_INTERVAL_MS);

    // Covers ad blockers and privacy extensions, which commonly drop this
    // script outright — no load event, no error event, nothing to react to.
    const timeout = window.setTimeout(fail, LOAD_TIMEOUT_MS);

    if (!document.querySelector<HTMLScriptElement>(`script[src="${CALENDLY_SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = CALENDLY_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  if (!CALENDLY_URL) {
    return <UnavailableFallback message="Booking is temporarily unavailable." />;
  }

  if (status === "failed") {
    return <UnavailableFallback message="Having trouble loading the calendar." />;
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minHeight: WIDGET_HEIGHT }}>
      {status === "loading" && (
        <div className="absolute inset-0 z-0 bg-white/3 animate-pulse" aria-hidden />
      )}
      {/* data-url is required, not optional: Calendly's script auto-scans for
          .calendly-inline-widget on load and throws on any it finds without
          one — and that exception aborts the script before it assigns
          window.Calendly, so nothing can recover afterwards.

          relative z-10 keeps this above the skeleton: an absolutely positioned
          sibling paints in a later stage than a static one regardless of DOM
          order, so without its own stacking context this container (and
          Calendly's iframe inside it) renders *underneath* the overlay and the
          tab looks permanently stuck on the loading state. */}
      <div
        ref={containerRef}
        className="calendly-inline-widget relative z-10"
        data-url={buildWidgetUrl(CALENDLY_URL)}
        style={{ minWidth: "320px", height: WIDGET_HEIGHT }}
      />
    </div>
  );
}
