import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface LegalArticleProps {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalArticle({ eyebrow, title, updated, children }: LegalArticleProps) {
  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight tracking-tight mb-3 text-balance">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mb-14">Last updated {updated}</p>
      <div className="legal-copy">{children}</div>
    </article>
  );
}
