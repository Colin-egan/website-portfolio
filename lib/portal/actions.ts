"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSession, destroySession, getSession } from "@/lib/portal/session";

const BUCKET = "client-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const domain = String(formData.get("domain") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!domain || !password) {
    return { error: "Enter your domain and password." };
  }

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("id, password_hash")
    .eq("domain", domain)
    .maybeSingle();

  if (!client) {
    return { error: "Invalid domain or password." };
  }

  const valid = await bcrypt.compare(password, client.password_hash);
  if (!valid) {
    return { error: "Invalid domain or password." };
  }

  await createSession(client.id);
  revalidatePath("/portal");
  return { error: null };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/portal");
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export type UploadState = { error: string | null };

export async function uploadAction(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large (max 50MB)." };
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${session.clientId}/${Date.now()}-${safeName}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    return { error: "Upload failed. Please try again." };
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteAction(fileName: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const safeName = sanitizeFileName(fileName);
  const path = `${session.clientId}/${safeName}`;

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}
