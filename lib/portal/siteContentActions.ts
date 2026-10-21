"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { parseFeatures } from "@/lib/portal/features";
import { prepareImageFile, sanitizeFileName } from "@/lib/portal/imageUpload";
import { getSiteSpec } from "@/lib/portal/siteContent/registry";
import { sanitizeSection, type SiteSpec } from "@/lib/portal/siteContent/spec";

const BUCKET = "site-media";

export type SiteContent = Record<string, unknown>;
export type SiteContentEditor = { spec: SiteSpec; content: SiteContent };
/** On success, `value` is the section exactly as stored, for the editor to show. */
export type SiteSaveState = { error: string | null; value?: unknown };
export type SiteImageState = { error: string | null; url?: string };

/**
 * The spec for the signed-in client, or null when they don't have the
 * `site_content` flag or no spec is registered for their domain. Every action
 * below goes through this, so a client can't write content their tab doesn't show.
 */
async function getEditableSpec(clientId: string): Promise<SiteSpec | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("clients")
    .select("domain, features")
    .eq("id", clientId)
    .maybeSingle();

  if (!data || !parseFeatures(data.features).includes("site_content")) return null;
  return getSiteSpec(data.domain);
}

function uploadPrefix(clientId: string) {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${clientId}/`;
}

async function readContent(clientId: string): Promise<SiteContent> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("client_id", clientId)
    .maybeSingle();

  const content = data?.content;
  return content && typeof content === "object" && !Array.isArray(content)
    ? (content as SiteContent)
    : {};
}

export async function getSiteContentEditor(): Promise<SiteContentEditor | null> {
  const session = await getSession();
  if (!session) return null;

  const spec = await getEditableSpec(session.clientId);
  if (!spec) return null;

  return { spec, content: await readContent(session.clientId) };
}

/**
 * Saves one section. When it reaches the live site depends on the client's site:
 * on the next Publish for a build-time reader, or within its revalidate window for
 * one that regenerates itself (`liveOnSave`).
 *
 * Read-modify-write on a single JSON document: fine for one editor per client, and
 * each save only replaces its own section key.
 */
export async function saveSiteSectionAction(
  sectionKey: string,
  value: unknown
): Promise<SiteSaveState> {
  const session = await getSession();
  if (!session) return { error: "Your session expired. Log in again to save." };

  const spec = await getEditableSpec(session.clientId);
  const section = spec?.sections.find((s) => s.key === sectionKey);
  if (!section) return { error: "This section can't be edited." };

  const result = sanitizeSection(section, value, { uploadPrefix: uploadPrefix(session.clientId) });
  if (!result.ok) return { error: result.error };

  const content = await readContent(session.clientId);
  content[sectionKey] = result.value;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("site_content")
    .upsert(
      { client_id: session.clientId, content, updated_at: new Date().toISOString() },
      { onConflict: "client_id" }
    );

  if (error) {
    console.error("saveSiteSectionAction: upsert failed", error);
    return { error: "Couldn't save. Please try again." };
  }

  revalidatePath("/portal");
  return { error: null, value: result.value };
}

/**
 * Uploads a photo and returns its public URL for the form to hold until the section
 * is saved. The previous photo is deliberately left in storage: the live site keeps
 * pointing at it until it next rebuilds or regenerates, and deleting it now would
 * break that page.
 */
export async function uploadSiteImageAction(formData: FormData): Promise<SiteImageState> {
  const session = await getSession();
  if (!session) return { error: "Your session expired. Log in again to upload." };

  if (!(await getEditableSpec(session.clientId))) {
    return { error: "Photo uploads aren't enabled for this account." };
  }

  const raw = formData.get("file");
  if (!(raw instanceof File) || raw.size === 0) return { error: "Choose a photo to upload." };

  const prepared = await prepareImageFile(raw);
  if (prepared.error !== null) return { error: prepared.error };
  const file = prepared.file;

  const path = `${session.clientId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("uploadSiteImageAction: upload failed", error);
    return { error: "Upload failed. Please try again." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}
