"use server";

import { revalidatePath } from "next/cache";
import convert from "heic-convert";
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

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

function isHeic(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await convert({ buffer: inputBuffer, format: "JPEG", quality: 0.92 });
  const newName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([new Uint8Array(outputBuffer)], newName, { type: "image/jpeg" });
}

async function prepareImageFile(file: File): Promise<{ file: File; error: null } | { file: null; error: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { file: null, error: "Image is too large (max 20MB)." };
  }
  if (isHeic(file)) {
    try {
      return { file: await convertHeicToJpeg(file), error: null };
    } catch (err) {
      console.error("prepareImageFile: HEIC conversion failed", err);
      return { file: null, error: "Couldn't convert this HEIC photo. Please export as JPEG and try again." };
    }
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { file: null, error: "Unsupported image format. Please use JPEG, PNG, WebP, or GIF." };
  }
  return { file, error: null };
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
