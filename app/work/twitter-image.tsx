import { renderOgImage } from "@/lib/og-image";

export const alt = "Selected Work — Egan Lab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "Selected Work",
    subtitle: "Case studies from real client projects.",
  });
}
