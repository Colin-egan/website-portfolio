"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { getClientFeatures } from "@/lib/portal/client";
import { sanitizeFileName } from "@/lib/portal/imageUpload";
import { ACCEPTED_EXTENSIONS, MAX_TOTAL_BYTES, extensionOf } from "@/lib/portal/presentationShared";
import {
  PRESENTATION_BUCKET,
  listPresentationFiles,
  readPresentationSettings,
  type PresentationFile,
  type PresentationSettings,
} from "@/lib/portal/presentation";

export type PresentationEditor = PresentationSettings & { files: PresentationFile[] };
export type PresentationState = { error: string | null };

const MAX_PROMPT_CHARS = 20000;

/** Only the developer account has the `presentation` flag. */
async function canEdit() {
  return !!(await getSession()) && (await getClientFeatures()).includes("presentation");
}

export async function getPresentationEditor(): Promise<PresentationEditor | null> {
  if (!(await canEdit())) return null;
  const [settings, files] = await Promise.all([readPresentationSettings(), listPresentationFiles()]);
  return { ...settings, files };
}

export async function savePresentationSettingsAction(
  settings: PresentationSettings
): Promise<PresentationState> {
  if (!(await canEdit())) return { error: "Your session expired. Log in again to save." };

  const systemPrompt = String(settings.systemPrompt ?? "").slice(0, MAX_PROMPT_CHARS);
  const { error } = await getSupabaseAdmin()
    .from("presentation_settings")
    .upsert({
      id: 1,
      system_prompt: systemPrompt,
      chat_enabled: settings.chatEnabled === true,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("savePresentationSettingsAction: upsert failed", error);
    return { error: "Couldn't save. Please try again." };
  }

  revalidatePath("/portal");
  return { error: null };
}

/**
 * A one-time URL the browser uploads straight to Supabase with, since Vercel caps
 * a function's request body at 4.5MB — too small for most slide decks.
 */
export async function createPresentationUploadAction(
  fileName: string,
  size: number
): Promise<{ error: string } | { error: null; signedUrl: string }> {
  if (!(await canEdit())) return { error: "Your session expired. Log in again to upload." };

  if (!ACCEPTED_EXTENSIONS.includes(extensionOf(fileName))) {
    return { error: `Unsupported file type. Use ${ACCEPTED_EXTENSIONS.join(", ")}.` };
  }
  if (size > MAX_TOTAL_BYTES) return { error: "File is too large (max 18MB)." };

  const path = `${Date.now()}-${sanitizeFileName(fileName)}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(PRESENTATION_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("createPresentationUploadAction: failed", error);
    return { error: "Couldn't start the upload. Please try again." };
  }
  return { error: null, signedUrl: data.signedUrl };
}

export async function deletePresentationFileAction(fileName: string): Promise<PresentationState> {
  if (!(await canEdit())) return { error: "Your session expired. Log in again." };

  const { error } = await getSupabaseAdmin()
    .storage.from(PRESENTATION_BUCKET)
    .remove([sanitizeFileName(fileName)]);

  if (error) return { error: "Couldn't delete. Please try again." };
  revalidatePath("/portal");
  return { error: null };
}

export async function refreshPresentationAction() {
  revalidatePath("/portal");
}
