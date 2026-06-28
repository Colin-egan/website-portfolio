import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { caseStudies } from "@/lib/case-studies";
import { Footer } from "@/components/layout/Footer";
import { Contact } from "@/components/sections/Contact";

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
  return {
    title: study.title,
    description: study.description,
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) notFound();

  const currentIndex = caseStudies.findIndex((s) => s.slug === slug);
  const nextStudy = caseStudies[(currentIndex + 1) % caseStudies.length];

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 max-w-7xl mx-auto px-6">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          All work
        </Link>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium">
                {study.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs">
                {study.year}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black leading-tight mb-6">
              {study.title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {study.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="bg-card border border-white/8 rounded-2xl p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-6">Results</h2>
            <ul className="space-y-4">
              {study.results.map((result) => (
                <li key={result} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{result}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Placeholder hero image */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-900/40 via-indigo-900/20 to-violet-900/40 border border-white/8 overflow-hidden relative grid-pattern flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-display font-black text-gradient mb-2">{study.client}</div>
            <div className="text-muted-foreground">{study.category} · {study.year}</div>
          </div>
        </div>
      </div>

      {/* Challenge + Solution */}
      <div className="max-w-7xl mx-auto px-6 mb-24 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">The Challenge</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">{study.challenge}</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">The Solution</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">{study.solution}</p>
        </div>
      </div>

      {/* Next project */}
      <div className="border-t border-white/5 py-16 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Next Project</div>
            <h3 className="text-3xl font-display font-bold">{nextStudy.title}</h3>
          </div>
          <Link
            href={`/work/${nextStudy.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-purple-500/30 hover:bg-purple-500/10 text-purple-300 font-medium transition-all group"
          >
            View case study
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <Contact />
      <Footer />
    </>
  );
}
