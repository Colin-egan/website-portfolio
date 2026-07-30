"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import {
  extractStoragePath,
  prepareImageFile,
  sanitizeFileName,
} from "@/lib/portal/imageUpload";

const BUCKET = "team-media";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  photo: string | null;
  bio: string[] | null;
  education: string[] | null;
  personal: string | null;
  sort_order: number;
  picks_url: string | null;
  shop_location: "original" | "part_two" | null;
  image_position: "top" | "center" | null;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseParagraphs(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  return (data ?? []) as TeamMember[];
}

export type TeamFormState = { error: string | null };

export async function upsertTeamMemberAction(
  _prevState: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = getSupabaseAdmin();

  const variant = String(formData.get("variant") || "team");

  // Only the keys this variant owns. A crew save must never touch education or
  // personal, and a team save must never touch picks_url or shop_location —
  // anything absent here is left alone rather than overwritten with an empty value.
  const shared = {
    name,
    title: String(formData.get("title") || "") || null,
    bio: parseParagraphs(formData.get("bio")),
  };

  const fields =
    variant === "crew"
      ? {
          ...shared,
          picks_url: String(formData.get("picks_url") || "") || null,
          shop_location: String(formData.get("shop_location") || "") || null,
          image_position: String(formData.get("image_position") || "") || null,
        }
      : {
          ...shared,
          education: parseList(formData.get("education")),
          personal: String(formData.get("personal") || "") || null,
        };

  if (id) {
    const { error } = await supabase
      .from("team_members")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("client_id", session.clientId);

    if (error) return { error: "Failed to update team member." };
  } else {
    const slug = slugify(name);
    const { error } = await supabase.from("team_members").insert({
      ...fields,
      client_id: session.clientId,
      slug,
    });

    if (error) {
      return {
        error:
          error.code === "23505"
            ? "A team member with that name already exists."
            : "Failed to add team member.",
      };
    }
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteTeamMemberAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("team_members")
    .select("photo")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (member?.photo) {
    const path = extractStoragePath(BUCKET, member.photo);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }

  // The FK cascade drops the pick rows, but not their storage objects.
  const { data: picks } = await supabase
    .from("team_picks")
    .select("image")
    .eq("team_member_id", id)
    .eq("client_id", session.clientId);

  const pickPaths = (picks ?? [])
    .map((p) => extractStoragePath(BUCKET, p.image))
    .filter((p): p is string => p !== null);

  if (pickPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(pickPaths);
  }

  await supabase.from("team_members").delete().eq("id", id).eq("client_id", session.clientId);

  revalidatePath("/portal");
}

export type UploadTeamPhotoState = { error: string | null };

export async function uploadTeamPhotoAction(
  _prevState: UploadTeamPhotoState,
  formData: FormData
): Promise<UploadTeamPhotoState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const memberId = String(formData.get("memberId") || "");
  const rawFile = formData.get("file");
  if (!memberId || !(rawFile instanceof File) || rawFile.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const prepared = await prepareImageFile(rawFile);
  if (!prepared.file) return { error: prepared.error };
  const file = prepared.file;

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("team_members")
    .select("slug, photo")
    .eq("id", memberId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!member) return { error: "Team member not found." };

  const previousPath = member.photo ? extractStoragePath(BUCKET, member.photo) : null;

  const safeName = sanitizeFileName(file.name);
  const path = `${session.clientId}/${member.slug}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  await supabase
    .from("team_members")
    .update({ photo: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function removeTeamPhotoAction(memberId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("team_members")
    .select("photo")
    .eq("id", memberId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!member?.photo) return;

  await supabase
    .from("team_members")
    .update({ photo: null, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  const path = extractStoragePath(BUCKET, member.photo);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}
