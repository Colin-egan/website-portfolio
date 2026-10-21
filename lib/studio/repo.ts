/**
 * Reads and commits a site's design.json through the GitHub contents API, as the
 * owner of STUDIO_GITHUB_TOKEN (a fine-grained token: your site repos only, Contents
 * read/write). Server-only — the token never reaches the browser.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { studioDevMode } from "@/lib/studio/devMode";

const API = "https://api.github.com";
export const DESIGN_PATH = "design.json";
export const BRANCH = "main";

export type RepoFile = { text: string; sha: string };
export type CommitResult =
  | { ok: true; commitUrl: string; sha: string }
  | { ok: false; conflict: boolean; error: string };

function headers() {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!token) throw new Error("Missing STUDIO_GITHUB_TOKEN env var");
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function contentsUrl(repo: string) {
  return `${API}/repos/${repo}/contents/${DESIGN_PATH}`;
}

/** Local test mode: a design.json on disk stands in for the repo. */
function localDesignFile(): string | null {
  return studioDevMode() ? process.env.STUDIO_DEV_DESIGN_FILE || null : null;
}

const hashOf = (text: string) => createHash("sha1").update(text).digest("hex");

/** design.json on main, or an error message fit to show in the studio. */
export async function readDesignFile(repo: string): Promise<RepoFile | { error: string }> {
  const local = localDesignFile();
  if (local) {
    try {
      const text = await readFile(local, "utf8");
      return { text, sha: hashOf(text) };
    } catch {
      return { error: `Can't read STUDIO_DEV_DESIGN_FILE (${local}).` };
    }
  }

  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return { error: "STUDIO_GITHUB_TOKEN isn't set, so the studio can't read this repo." };
  }

  const res = await fetch(`${contentsUrl(repo)}?ref=${BRANCH}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) {
    return { error: `No ${DESIGN_PATH} on ${BRANCH} in ${repo}, or the token can't see the repo.` };
  }
  if (!res.ok) return { error: `GitHub returned ${res.status} reading ${repo}.` };

  const body = (await res.json()) as { content?: string; sha?: string };
  if (typeof body.content !== "string" || typeof body.sha !== "string") {
    return { error: `${DESIGN_PATH} in ${repo} isn't a file.` };
  }
  return { text: Buffer.from(body.content, "base64").toString("utf8"), sha: body.sha };
}

/**
 * Commits design.json to main. GitHub refuses the write unless `baseSha` is still
 * the file's current version, so a push made from VS Code in the meantime is never
 * overwritten.
 */
export async function commitDesignFile(
  repo: string,
  text: string,
  baseSha: string,
  message: string
): Promise<CommitResult> {
  const local = localDesignFile();
  if (local) {
    // Same no-overwrite rule as GitHub: refuse if the file changed since it was read.
    const current = await readFile(local, "utf8");
    if (hashOf(current) !== baseSha) {
      return { ok: false, conflict: true, error: `${DESIGN_PATH} changed on disk since you opened it. Reload, then save again.` };
    }
    await writeFile(local, text);
    return { ok: true, commitUrl: "", sha: hashOf(text) };
  }

  const res = await fetch(contentsUrl(repo), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(text, "utf8").toString("base64"),
      sha: baseSha,
      branch: BRANCH,
    }),
    cache: "no-store",
  });

  if (res.status === 409 || res.status === 422) {
    return {
      ok: false,
      conflict: true,
      error: `${DESIGN_PATH} changed on GitHub since you opened it. Reload to get the latest, then publish again.`,
    };
  }
  if (!res.ok) {
    return { ok: false, conflict: false, error: `GitHub returned ${res.status}; nothing was published.` };
  }

  const body = (await res.json()) as {
    content?: { sha?: string };
    commit?: { html_url?: string };
  };
  return { ok: true, commitUrl: body.commit?.html_url ?? "", sha: body.content?.sha ?? "" };
}
