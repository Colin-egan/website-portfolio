import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { caseStudies } from "@/lib/case-studies";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return caseStudies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) return {};

  const title = `${study.title} — Case Study`;
  return {
    title,
    description: study.description,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: {
      title: `${title} | Egan Lab`,
      description: study.description,
      url: `https://eganlab.com/work/${study.slug}`,
    },
    twitter: {
      title: `${title} | Egan Lab`,
      description: study.description,
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) notFound();

  return (
    <>
      <div className="pt-28" />
      <article className="max-w-5xl mx-auto px-6 py-16">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          All work
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2 tracking-[0.12em] uppercase">
            <span className="w-6 h-px bg-amber-400" />
            {study.category}
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-tight mb-6">
            {study.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mb-6">
            {study.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>{study.client}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" aria-hidden />
            <span>{study.year}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="flex flex-wrap gap-1.5">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl mb-6">
          <Image
            src={study.image}
            alt={study.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 900px"
            priority
          />
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap gap-4 mb-20">
          <Link
            href={study.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
          >
            Visit live site
            <ArrowUpRight
              size={15}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-foreground/15 hover:border-amber-500/50 hover:bg-amber-500/10 font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            Start your project
          </Link>
        </div>

        {/* Before / after */}
        {study.beforeImage && (
          <section className="mb-20">
            <h2 className="font-display font-bold text-2xl mb-2">Before → after</h2>
            <p className="text-muted-foreground mb-6">
              Drag to compare the old site against the {study.client} rebuild.
            </p>
            <BeforeAfterSlider beforeSrc={study.beforeImage} afterSrc={study.image} alt={study.title} />
          </section>
        )}

        {/* Before / after video walkthrough */}
        {study.videoBefore && study.videoAfter && (
          <section className="mb-20">
            <h2 className="font-display font-bold text-2xl mb-2">Old site vs. new site</h2>
            <p className="text-muted-foreground mb-6">
              Side-by-side walkthroughs of the old {study.client} site and the rebuild.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="inline-block mb-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-medium tracking-wide text-muted-foreground">
                  Old site
                </span>
                <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                  <video
                    src={study.videoBefore}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div>
                <span className="inline-block mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium tracking-wide text-amber-600 dark:text-amber-400">
                  New site
                </span>
                <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                  <video
                    src={study.videoAfter}
                    controls
                    playsInline
                    preload="metadata"
                    poster={study.image}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Video */}
        {study.video && (
          <section className="mb-20">
            <h2 className="font-display font-bold text-2xl mb-6">See it in action</h2>
            <div className="relative w-full overflow-hidden rounded-2xl bg-black">
              <video
                src={study.video}
                controls
                playsInline
                preload="metadata"
                poster={study.image}
                className="w-full h-auto"
              />
            </div>
          </section>
        )}

        {/* Gallery */}
        {study.gallery && study.gallery.length > 0 && (
          <section className="mb-20">
            <h2 className="font-display font-bold text-2xl mb-6">More screens</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {study.gallery.map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image src={src} alt={study.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      <Contact />
      <Footer />
    </>
  );
}
