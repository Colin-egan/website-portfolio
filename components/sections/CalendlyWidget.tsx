"use client";

import Script from "next/script";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const WIDGET_HEIGHT = "700px";

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
      />
      <div
        className="calendly-inline-widget"
        data-url={buildWidgetUrl(CALENDLY_URL)}
        style={{ minWidth: "320px", height: WIDGET_HEIGHT }}
      />
    </div>
  );
}
