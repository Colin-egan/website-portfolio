"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import {
  extractStoragePath,
  prepareImageFile,
  sanitizeFileName,
} from "@/lib/portal/imageUpload";
import { parseLinkUrl } from "@/lib/portal/links";

const BUCKET = "team-media";

export type TeamPick = {
  id: string;
  team_member_id: string;
  image: string;
  title: string;
  link_url: string | null;
  sort_order: number;
};

export type PickFormState = { error: string | null };

/** All of this client's picks, grouped by member id. */
export async function listTeamPicks(): Promise<Record<string, TeamPick[]>> {
  const session = await getSession();
  if (!session) return {};

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("team_picks")
    .select("id, team_member_id, image, title, link_url, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const grouped: Record<string, TeamPick[]> = {};
  for (const pick of (data ?? []) as TeamPick[]) {
    (grouped[pick.team_member_id] ??= []).push(pick);
  }
  return grouped;
}

export async function addTeamPickAction(
  _prevState: PickFormState,
  formData: FormData
): Promise<PickFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const memberId = String(formData.get("memberId") || "");
  const title = String(formData.get("title") || "").trim();
  const rawFile = formData.get("file");

  if (!memberId) return { error: "Missing crew member." };
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

  const { data: member } = await supabase
    .from("team_members")
    .select("slug")
    .eq("id", memberId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!member) return { error: "Crew member not found." };

  const path = `${session.clientId}/picks/${member.slug}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: last } = await supabase
    .from("team_picks")
    .select("sort_order")
    .eq("team_member_id", memberId)
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("team_picks").insert({
    team_member_id: memberId,
    client_id: session.clientId,
    image: publicUrlData.publicUrl,
    title,
    link_url: linkUrl,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    // Don't leave an orphaned object behind when the row insert fails.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: "Failed to add pick." };
  }

  revalidatePath("/portal");
  return { error: null };
}

/** Edit an existing pick's title or shop link. The image is replaced by deleting
 *  and re-adding, which keeps this action simple. */
export async function updateTeamPickAction(
  _prevState: PickFormState,
  formData: FormData
): Promise<PickFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id) return { error: "Missing pick." };
  if (!title) return { error: "Comic title is required." };

  const linkUrl = parseLinkUrl(formData.get("link_url"));
  if (linkUrl === false) {
    return { error: "That shop link doesn't look right. Paste the full URL, starting with https://" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("team_picks")
    .update({ title, link_url: linkUrl })
    .eq("id", id)
    .eq("client_id", session.clientId);

  if (error) return { error: "Failed to save pick." };

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteTeamPickAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pick } = await supabase
    .from("team_picks")
    .select("image")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pick) return;

  await supabase.from("team_picks").delete().eq("id", id).eq("client_id", session.clientId);

  const path = extractStoragePath(BUCKET, pick.image);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}

export async function moveTeamPickAction(id: string, direction: "up" | "down") {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pick } = await supabase
    .from("team_picks")
    .select("id, team_member_id, sort_order")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pick) return;

  const { data: siblings } = await supabase
    .from("team_picks")
    .select("id, sort_order")
    .eq("team_member_id", pick.team_member_id)
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const list = siblings ?? [];
  const index = list.findIndex((p) => p.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await supabase.from("team_picks").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("team_picks").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/portal");
}
