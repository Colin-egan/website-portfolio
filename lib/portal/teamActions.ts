"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";

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

  const fields = {
    name,
    title: String(formData.get("title") || "") || null,
    bio: parseParagraphs(formData.get("bio")),
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
    const path = extractStoragePath(member.photo);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }

  await supabase.from("team_members").delete().eq("id", id).eq("client_id", session.clientId);

  revalidatePath("/portal");
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export type UploadTeamPhotoState = { error: string | null };

export async function uploadTeamPhotoAction(
  _prevState: UploadTeamPhotoState,
  formData: FormData
): Promise<UploadTeamPhotoState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const memberId = String(formData.get("memberId") || "");
  const file = formData.get("file");
  if (!memberId || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const supabase = getSupabaseAdmin();
  const { data: member } = await supabase
    .from("team_members")
    .select("slug, photo")
    .eq("id", memberId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!member) return { error: "Team member not found." };

  const previousPath = member.photo ? extractStoragePath(member.photo) : null;

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

  const path = extractStoragePath(member.photo);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}
