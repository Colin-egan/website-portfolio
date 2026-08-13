"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { getSetting, setSetting } from "@/lib/portal/settings";
import { parseLinkUrl } from "@/lib/portal/links";
import {
  extractStoragePath,
  prepareImageFile,
  sanitizeFileName,
} from "@/lib/portal/imageUpload";

const BUCKET = "weekly-media";
const VIDEO_KEY = "weekly_video_url";

export type WeeklyPic = {
  id: string;
  image: string;
  title: string;
  caption: string | null;
  link_url: string | null;
  sort_order: number;
};

export type WeeklyFormState = { error: string | null };
export type VideoFormState = { error: string | null; saved?: boolean };

export async function listWeeklyPics(): Promise<WeeklyPic[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("weekly_pics")
    .select("id, image, title, caption, link_url, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  return (data ?? []) as WeeklyPic[];
}

export async function getWeeklyVideoUrl(): Promise<string | null> {
  return getSetting(VIDEO_KEY);
}

/**
 * Any host is allowed — the crew can paste whatever they posted this week. The only
 * rule is that it parses as an http(s) URL, which keeps `javascript:` and `data:`
 * out. The site decides at render time whether a URL becomes a real embed or a link
 * card, so an arbitrary string never reaches an iframe.
 */
export async function setWeeklyVideoUrlAction(
  _prevState: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = String(formData.get("url") || "").trim();

  if (!raw) {
    await setSetting(VIDEO_KEY, null);
    revalidatePath("/portal");
    return { error: null, saved: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "That doesn't look like a link. Paste the full URL, starting with https://" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http:// and https:// links are allowed." };
  }

  await setSetting(VIDEO_KEY, raw);
  revalidatePath("/portal");
  return { error: null, saved: true };
}

export async function addWeeklyPicAction(
  _prevState: WeeklyFormState,
  formData: FormData
): Promise<WeeklyFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const title = String(formData.get("title") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const rawFile = formData.get("file");

  if (!title) return { error: "Comic title is required." };
  if (!(rawFile instanceof File) || rawFile.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const linkUrl = parseLinkUrl(formData.get("link_url"));
  if (linkUrl === false) {
    return { error: "That shop link doesn't look right. Paste the full URL, starting with https://" };
  }

  const prepared = await prepareImageFile(rawFile);
  if (!prepared.file) return { error: prepared.error };
  const file = prepared.file;

  const supabase = getSupabaseAdmin();
  const path = `${session.clientId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: last } = await supabase
    .from("weekly_pics")
    .select("sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("weekly_pics").insert({
    client_id: session.clientId,
    image: publicUrlData.publicUrl,
    title,
    caption,
    link_url: linkUrl,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: "Failed to add pic." };
  }

  revalidatePath("/portal");
  return { error: null };
}

/** Edit an existing pic's title, caption, or shop link. */
export async function updateWeeklyPicAction(
  _prevState: WeeklyFormState,
  formData: FormData
): Promise<WeeklyFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id) return { error: "Missing pic." };
  if (!title) return { error: "Comic title is required." };

  const linkUrl = parseLinkUrl(formData.get("link_url"));
  if (linkUrl === false) {
    return { error: "That shop link doesn't look right. Paste the full URL, starting with https://" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("weekly_pics")
    .update({
      title,
      caption: String(formData.get("caption") || "").trim() || null,
      link_url: linkUrl,
    })
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return { error: "Failed to save pic." };

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteWeeklyPicAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pic } = await supabase
    .from("weekly_pics")
    .select("image")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pic) return;

  await supabase.from("weekly_pics").delete().eq("id", id).eq("client_id", session.clientId);

  const path = extractStoragePath(BUCKET, pic.image);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}

export async function moveWeeklyPicAction(id: string, direction: "up" | "down") {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: list } = await supabase
    .from("weekly_pics")
    .select("id, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const pics = list ?? [];
  const index = pics.findIndex((p) => p.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= pics.length) return;

  const a = pics[index];
  const b = pics[swapWith];

  await supabase.from("weekly_pics").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("weekly_pics").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/portal");
}
