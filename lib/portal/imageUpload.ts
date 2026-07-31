import convert from "heic-convert";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

/**
 * Recover the storage object path from a public Supabase URL. Returns null when the
 * URL doesn't belong to `bucket` — callers must skip the delete rather than guess a
 * path, or they risk removing the wrong object.
 */
export function extractStoragePath(bucket: string, publicUrl: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

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

export async function prepareImageFile(
  file: File
): Promise<{ file: File; error: null } | { file: null; error: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { file: null, error: "Image is too large (max 20MB)." };
  }
  if (isHeic(file)) {
    try {
      return { file: await convertHeicToJpeg(file), error: null };
    } catch (err) {
      console.error("prepareImageFile: HEIC conversion failed", err);
      return {
        file: null,
        error: "Couldn't convert this HEIC photo. Please export as JPEG and try again.",
      };
    }
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { file: null, error: "Unsupported image format. Please use JPEG, PNG, WebP, or GIF." };
  }
  return { file, error: null };
}
