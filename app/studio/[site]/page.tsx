import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { getSession } from "@/lib/portal/session";
import { getDeveloperSession, getStudioSession } from "@/lib/studio/session";
import { getStudioSite } from "@/lib/studio/sites";
import { readDesignFile } from "@/lib/studio/repo";
import { fontsFor, parseSavedDesign } from "@/lib/studio/design";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

async function loadEditor(repo: string) {
  const file = await readDesignFile(repo);
  if ("error" in file) return { error: file.error };

  let raw: unknown;
  try {
    raw = JSON.parse(file.text);
  } catch {
    return { error: "design.json on GitHub isn't valid JSON. Fix it in VS Code, then reload." };
  }
  const parsed = parseSavedDesign(raw);
  if (!parsed.ok) return { error: `design.json on GitHub is invalid: ${parsed.error}` };
  return { design: parsed.design, sha: file.sha };
}

export default async function StudioSitePage({ params }: { params: Promise<{ site: string }> }) {
  // Same locks as /studio. Without the GitHub sign-in, /studio shows the gate.
  if (!(await getDeveloperSession())) {
    if (!(await getSession())) redirect("/portal");
    notFound();
  }
  if (!(await getStudioSession())) redirect("/studio");

  const site = getStudioSite((await params).site);
  if (!site) notFound();

  const editor = await loadEditor(site.repo);

  return (
    <>
      <div className="pt-24" />
      <section className="mx-auto max-w-[1600px] px-6 pb-10 flex flex-col gap-4">
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          All sites
        </Link>
        {"error" in editor ? (
          <Card className="p-2 max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Can&apos;t open {site.name}</CardTitle>
              <CardDescription>{editor.error}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ) : (
          <StudioEditor
            site={site}
            initialDesign={editor.design}
            initialSha={editor.sha}
            fonts={fontsFor(editor.design)}
          />
        )}
      </section>
    </>
  );
}
