import { renderOgImage } from "@/lib/og-image";

export const alt = "Contact Egan Lab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "Let's Build Something Great",
    subtitle: "Free strategy call. Response within 24 hours.",
  });
}
