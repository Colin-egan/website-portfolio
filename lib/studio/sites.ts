/**
 * Sites the studio can edit. Add one line per site created from the starter
 * template (Colin-egan/eganlab-starter); the studio only ever touches repos listed here.
 */
import { studioDevMode } from "@/lib/studio/devMode";

export type StudioSite = {
  /** Used in the studio URL: /studio/<slug>. */
  slug: string;
  name: string;
  /** owner/repo on GitHub. */
  repo: string;
  /** The live site, opened in the preview. */
  url: string;
};

export const STUDIO_SITES: StudioSite[] = [
  {
    slug: "starter-test",
    name: "Starter test",
    repo: "Colin-egan/starter-test",
    url: "https://starter-test-kappa.vercel.app",
  },
];

export function getStudioSite(slug: string): StudioSite | null {
  const site = STUDIO_SITES.find((s) => s.slug === slug) ?? null;
  // Local test mode can preview a site running on your machine instead.
  const devUrl = process.env.STUDIO_DEV_SITE_URL;
  if (site && devUrl && studioDevMode()) return { ...site, url: devUrl };
  return site;
}
