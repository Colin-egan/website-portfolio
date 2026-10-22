/** Shared by the Presentation panel (browser) and the server. No server imports here. */

/** Gemini takes at most 20MB of inline data per request, prompt included. */
export const MAX_TOTAL_BYTES = 18 * 1024 * 1024;

export const DEFAULT_PROMPT =
  "You are a friendly, concise assistant on the Egan Lab website (eganlab.com), answering audience questions during a live presentation by Colin Egan. Keep answers short and clear.";

/** Sent to Gemini as-is. */
export const INLINE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};
/** Read as UTF-8 text. */
export const TEXT_TYPES = new Set(["txt", "md", "csv", "html", "htm", "json"]);
/** Office files: the text is pulled out of their XML. */
export const OFFICE_TYPES = new Set(["pptx", "docx"]);

export const ACCEPTED_EXTENSIONS = [...Object.keys(INLINE_TYPES), ...TEXT_TYPES, ...OFFICE_TYPES];

export function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Strips the upload timestamp prefix. */
export function displayName(name: string) {
  return name.replace(/^\d+-/, "");
}
