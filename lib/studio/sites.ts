/**
 * Sites the studio can edit. Add one line per site created from the starter
 * template (Colin-egan/eganlab-starter); the studio only ever touches repos listed here.
 */
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
  return STUDIO_SITES.find((site) => site.slug === slug) ?? null;
}
