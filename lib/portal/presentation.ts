import { unzipSync, strFromU8 } from "fflate";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  INLINE_TYPES,
  MAX_TOTAL_BYTES,
  OFFICE_TYPES,
  TEXT_TYPES,
  displayName,
  extensionOf,
} from "@/lib/portal/presentationShared";

export const PRESENTATION_BUCKET = "presentation-files";

export type PresentationFile = { name: string; size: number; updatedAt: string | null };
export type PresentationSettings = { systemPrompt: string; chatEnabled: boolean };

export async function readPresentationSettings(): Promise<PresentationSettings> {
  const { data } = await getSupabaseAdmin()
    .from("presentation_settings")
    .select("system_prompt, chat_enabled")
    .eq("id", 1)
    .maybeSingle();

  return {
    systemPrompt: data?.system_prompt ?? "",
    chatEnabled: data?.chat_enabled ?? true,
  };
}

export async function listPresentationFiles(): Promise<PresentationFile[]> {
  const { data } = await getSupabaseAdmin()
    .storage.from(PRESENTATION_BUCKET)
    .list("", { sortBy: { column: "created_at", order: "asc" } });

  return (data ?? [])
    .filter((f) => f.id) // folders and placeholders have no id
    .map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      updatedAt: f.updated_at ?? null,
    }));
}

/** Text of every slide (pptx) or the body (docx), in order. */
function officeText(bytes: Uint8Array, ext: string) {
  const entries = unzipSync(bytes, {
    filter: (f) =>
      ext === "pptx"
        ? /^ppt\/(slides|notesSlides)\/\w+\d+\.xml$/.test(f.name)
        : f.name === "word/document.xml",
  });

  const tag = ext === "pptx" ? "a:t" : "w:t";
  const pattern = new RegExp(`<${tag}(?: [^>]*)?>([^<]*)</${tag}>`, "g");
  const decode = (s: string) =>
    s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");

  // Slide 1, its notes, slide 2, its notes, ...
  const slideNumber = (name: string) => Number(name.match(/(\d+)\.xml$/)?.[1] ?? 0);
  const isNotes = (name: string) => name.includes("notesSlides");
  const names = Object.keys(entries).sort(
    (a, b) => slideNumber(a) - slideNumber(b) || Number(isNotes(a)) - Number(isNotes(b))
  );

  return names
    .map((name) => {
      const xml = strFromU8(entries[name]);
      const text = [...xml.matchAll(pattern)].map((m) => decode(m[1])).join(" ");
      if (ext !== "pptx") return text;
      const label = isNotes(name) ? "Speaker notes" : "Slide";
      return `${label} ${slideNumber(name)}: ${text}`;
    })
    .join("\n");
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

let cache: { key: string; parts: GeminiPart[] } | null = null;

/**
 * Every uploaded file as Gemini parts. Cached per server instance until the file
 * list changes, so a busy Q&A doesn't re-download the deck on every question.
 */
export async function loadPresentationParts(): Promise<GeminiPart[]> {
  const files = await listPresentationFiles();
  const key = files.map((f) => `${f.name}:${f.size}:${f.updatedAt}`).join("|");
  if (cache?.key === key) return cache.parts;

  const storage = getSupabaseAdmin().storage.from(PRESENTATION_BUCKET);
  const parts: GeminiPart[] = [];
  let total = 0;

  for (const file of files) {
    const ext = extensionOf(file.name);
    const { data, error } = await storage.download(file.name);
    if (error || !data) {
      console.error(`loadPresentationParts: couldn't download ${file.name}`, error);
      continue;
    }
    const bytes = new Uint8Array(await data.arrayBuffer());

    let part: GeminiPart;
    try {
      if (INLINE_TYPES[ext]) {
        part = {
          inline_data: {
            mime_type: INLINE_TYPES[ext],
            data: Buffer.from(bytes).toString("base64"),
          },
        };
      } else if (OFFICE_TYPES.has(ext)) {
        part = { text: officeText(bytes, ext) };
      } else if (TEXT_TYPES.has(ext)) {
        part = { text: new TextDecoder().decode(bytes) };
      } else {
        continue;
      }
    } catch (err) {
      console.error(`loadPresentationParts: couldn't read ${file.name}`, err);
      continue;
    }

    const size = "text" in part ? part.text.length : bytes.length;
    if (total + size > MAX_TOTAL_BYTES) {
      console.warn(`loadPresentationParts: skipping ${file.name}, over the size budget`);
      continue;
    }
    total += size;
    parts.push({ text: `File: ${displayName(file.name)}` }, part);
  }

  cache = { key, parts };
  return parts;
}
