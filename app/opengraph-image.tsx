import { renderOgImage } from "@/lib/og-image";

export const alt = "Egan Lab — Premium Web Design & Automation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "Premium Web Design & Automation",
    subtitle: "Websites that win clients — and automations that scale businesses.",
  });
}
