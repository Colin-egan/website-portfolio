/**
 * Sites the studio can edit. Add one line per site created from the starter
 * template (Colin-egan/eganlab-starter); the studio only ever touches repos listed here.
 */
export type StudioSite = {
  name: string;
  /** owner/repo on GitHub. */
  repo: string;
  /** The live site, opened in the preview. */
  url: string;
};

export const STUDIO_SITES: StudioSite[] = [];
