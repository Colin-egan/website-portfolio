"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";

const BUCKET = "project-media";

export type ProjectStatus = "current" | "completed";

export type Project = {
  id: string;
  slug: string;
  status: ProjectStatus;
  name: string;
  location: string | null;
  address: string | null;
  units: string | null;
  unit_types: string | null;
  square_footage: string | null;
  year_completed: string | null;
  description: string | null;
  amenities: string[] | null;
  features: string[] | null;
  hero_image: string | null;
  images: string[];
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
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listProjects(): Promise<Project[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  return (data ?? []) as Project[];
}

export async function canPublish(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("clients")
    .select("deploy_hook_url")
    .eq("id", session.clientId)
    .maybeSingle();

  return Boolean(data?.deploy_hook_url);
}

export type PublishState = { error: string | null; success: boolean };

export async function publishAction(
  _prevState: PublishState
): Promise<PublishState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated.", success: false };

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("deploy_hook_url")
    .eq("id", session.clientId)
    .maybeSingle();

  if (!client?.deploy_hook_url) {
    return { error: "Publishing isn't set up for this account yet.", success: false };
  }

  try {
    const res = await fetch(client.deploy_hook_url, { method: "POST" });
    if (!res.ok) return { error: "Failed to trigger publish. Please try again.", success: false };
  } catch {
    return { error: "Failed to trigger publish. Please try again.", success: false };
  }

  return { error: null, success: true };
}

export type ProjectFormState = { error: string | null };

export async function upsertProjectAction(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Project name is required." };

  const supabase = getSupabaseAdmin();

  const fields = {
    name,
    location: String(formData.get("location") || "") || null,
    address: String(formData.get("address") || "") || null,
    status: (String(formData.get("status") || "current") as ProjectStatus),
    units: String(formData.get("units") || "") || null,
    unit_types: String(formData.get("unit_types") || "") || null,
    square_footage: String(formData.get("square_footage") || "") || null,
    year_completed: String(formData.get("year_completed") || "") || null,
    description: String(formData.get("description") || "") || null,
    amenities: parseList(formData.get("amenities")),
    features: parseList(formData.get("features")),
  };

  if (id) {
    const { error } = await supabase
      .from("projects")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("client_id", session.clientId);

    if (error) return { error: "Failed to update project." };
  } else {
    const slug = slugify(name);
    const { error } = await supabase.from("projects").insert({
      ...fields,
      client_id: session.clientId,
      slug,
    });

    if (error) {
      return {
        error: error.code === "23505" ? "A project with that name already exists." : "Failed to create project.",
      };
    }
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteProjectAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("projects")
    .select("images")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (project?.images?.length) {
    const paths = project.images
      .map((url: string) => extractStoragePath(url))
      .filter((p: string | null): p is string => Boolean(p));
    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }

  await supabase.from("projects").delete().eq("id", id).eq("client_id", session.clientId);

  revalidatePath("/portal");
}

export async function setProjectStatusAction(id: string, status: ProjectStatus) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", session.clientId);

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

export type UploadProjectImageState = { error: string | null };

export async function uploadProjectImageAction(
  _prevState: UploadProjectImageState,
  formData: FormData
): Promise<UploadProjectImageState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const projectId = String(formData.get("projectId") || "");
  const file = formData.get("file");
  if (!projectId || !(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const supabase = getSupabaseAdmin();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, images, hero_image")
    .eq("id", projectId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!project) return { error: "Project not found." };

  const safeName = sanitizeFileName(file.name);
  const path = `${session.clientId}/${project.slug}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const nextImages = [...(project.images ?? []), publicUrl];
  await supabase
    .from("projects")
    .update({
      images: nextImages,
      hero_image: project.hero_image ?? publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  revalidatePath("/portal");
  return { error: null };
}

export async function setHeroImageAction(projectId: string, imageUrl: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  await supabase
    .from("projects")
    .update({ hero_image: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("client_id", session.clientId);

  revalidatePath("/portal");
}

export async function removeProjectImageAction(projectId: string, imageUrl: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: project } = await supabase
    .from("projects")
    .select("images, hero_image")
    .eq("id", projectId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!project) return;

  const nextImages = (project.images ?? []).filter((url: string) => url !== imageUrl);
  const nextHero = project.hero_image === imageUrl ? nextImages[0] ?? null : project.hero_image;

  await supabase
    .from("projects")
    .update({ images: nextImages, hero_image: nextHero, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  const path = extractStoragePath(imageUrl);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  revalidatePath("/portal");
}
