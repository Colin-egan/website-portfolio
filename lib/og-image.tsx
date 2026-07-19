import { ImageResponse } from "next/og";

const BG = "#0b0a09";
const AMBER = "#f59e0b";
const AMBER_LIGHT = "#fbbf24";
const WHITE = "#fafafa";
const MUTED = "#a3a3a3";

export function renderOgImage({ title, subtitle }: { title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: AMBER, display: "flex" }} />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: MUTED, display: "flex" }}>
            EGAN LAB
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: WHITE,
              lineHeight: 1.05,
              display: "flex",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 32, color: AMBER_LIGHT, display: "flex", maxWidth: 900 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", width: "100%", height: 4, backgroundColor: "rgba(245,158,11,0.3)" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
