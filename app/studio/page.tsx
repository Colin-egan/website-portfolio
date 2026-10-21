import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, KeyRound, LogOut, Paintbrush } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/portal/session";
import { getDeveloperSession, getStudioSession } from "@/lib/studio/session";
import { studioSignOutAction } from "@/lib/studio/actions";
import { STUDIO_SITES } from "@/lib/studio/sites";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  expired: "That sign-in link expired or didn't match. Try again.",
  github: "GitHub didn't confirm the sign-in. Try again.",
  account: "That GitHub account isn't allowed into the studio.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Reached only from the developer portal account: no portal login goes back to
  // the portal, and a client login gets a plain 404.
  if (!(await getSession())) redirect("/portal");
  if (!(await getDeveloperSession())) notFound();

  const studio = await getStudioSession();
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <>
      <div className="pt-28" />
      <section className="max-w-3xl mx-auto px-6 py-20 flex flex-col gap-6">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          Back to portal
        </Link>

        {studio ? (
          <StudioHome githubLogin={studio.githubLogin} />
        ) : (
          <GitHubGate errorMessage={errorMessage} />
        )}
      </section>
      <Footer />
    </>
  );
}

function GitHubGate({ errorMessage }: { errorMessage?: string }) {
  return (
    <Card className="p-2 max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Paintbrush size={18} className="text-purple-500" />
          <CardTitle className="text-xl">Studio</CardTitle>
        </div>
        <CardDescription>
          Confirm it&apos;s you with GitHub. The studio commits to your site repos, so the
          portal password alone isn&apos;t enough.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* A plain link, not next/link: this route handler redirects off-site to GitHub. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/studio/auth/github" className={buttonVariants({ className: "w-full" })}>
          <KeyRound size={14} />
          Sign in with GitHub
        </a>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}

function StudioHome({ githubLogin }: { githubLogin: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Studio</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">@{githubLogin}</span>
          <form action={studioSignOutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut size={14} />
              Sign out of GitHub
            </Button>
          </form>
        </div>
      </div>

      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-base">Sites ({STUDIO_SITES.length})</CardTitle>
          <CardDescription>
            Sites built from the starter template. Add one in lib/studio/sites.ts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {STUDIO_SITES.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No sites yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {STUDIO_SITES.map((site) => (
                <li key={site.repo} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{site.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{site.repo}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                      aria-label={`Open ${site.name}`}
                    >
                      <ExternalLink size={15} />
                    </a>
                    <Link href={`/studio/${site.slug}`} className={buttonVariants({ size: "sm" })}>
                      Edit design
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
