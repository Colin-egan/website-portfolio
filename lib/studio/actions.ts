"use server";

import { revalidatePath } from "next/cache";
import { destroyStudioSession, getStudioSession } from "@/lib/studio/session";
import { getStudioSite } from "@/lib/studio/sites";
import { describeChanges, formatDesign, parseDesign, parseSavedDesign } from "@/lib/studio/design";
import { commitDesignFile, readDesignFile } from "@/lib/studio/repo";

export async function studioSignOutAction() {
  await destroyStudioSession();
  revalidatePath("/studio");
}

export type PublishResult =
  | { ok: true; sha: string; commitUrl: string; changes: string[] }
  | { ok: false; conflict?: boolean; error: string };

const CONFLICT =
  "design.json changed on GitHub since you opened it. Reload to get the latest, then publish again.";

/**
 * Commits a design to the site's main branch. Everything that matters is decided
 * here, not in the browser: the session, which repo (looked up from the slug, never
 * taken from the request), the design's shape, and the change list in the commit.
 */
export async function publishDesignAction(
  slug: string,
  baseSha: string,
  rawDesign: unknown
): Promise<PublishResult> {
  const studio = await getStudioSession();
  if (!studio) return { ok: false, error: "Your studio sign-in expired. Reload and sign in again." };

  const site = getStudioSite(slug);
  if (!site) return { ok: false, error: "Unknown site." };

  const current = await readDesignFile(site.repo);
  if ("error" in current) return { ok: false, error: current.error };
  if (current.sha !== baseSha) return { ok: false, conflict: true, error: CONFLICT };

  let saved;
  try {
    saved = parseSavedDesign(JSON.parse(current.text));
  } catch {
    return { ok: false, error: "The design.json on GitHub isn't valid JSON. Fix it in VS Code first." };
  }
  if (!saved.ok) return { ok: false, error: `The design.json on GitHub is invalid: ${saved.error}` };

  const next = parseDesign(rawDesign, [saved.design.theme.fonts.heading, saved.design.theme.fonts.body]);
  if (!next.ok) return { ok: false, error: next.error };

  const changes = describeChanges(saved.design, next.design);
  if (changes.length === 0) return { ok: false, error: "Nothing has changed since the last publish." };

  const message = [
    `Studio: ${changes.length === 1 ? changes[0] : `${changes.length} design changes`}`,
    "",
    ...changes.map((c) => `- ${c}`),
    "",
    `Published from Egan Lab Studio by @${studio.githubLogin}.`,
  ].join("\n");

  const result = await commitDesignFile(site.repo, formatDesign(next.design), baseSha, message);
  if (!result.ok) return { ok: false, conflict: result.conflict, error: result.error };
  return { ok: true, sha: result.sha, commitUrl: result.commitUrl, changes };
}
