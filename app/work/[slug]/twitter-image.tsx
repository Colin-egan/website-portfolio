import { renderOgImage } from "@/lib/og-image";
import { caseStudies } from "@/lib/case-studies";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return caseStudies.map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);

  return renderOgImage({
    title: study ? `${study.title} — Case Study` : "Case Study",
    subtitle: study?.description ?? "A recent Egan Lab project.",
  });
}
