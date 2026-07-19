import { renderOgImage } from "@/lib/og-image";

export const alt = "Transparent Pricing — Egan Lab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "Transparent Pricing",
    subtitle: "Web design, development & automation. No hidden fees.",
  });
}
