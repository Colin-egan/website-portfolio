/**
 * Shop links are optional and may point anywhere the crew sells — ComicHub, eBay,
 * elsewhere — so there's no host allowlist. Only http(s) is accepted, which keeps
 * a bad paste from becoming a `javascript:` or `data:` link on the live site.
 *
 * Returns the URL, null when empty, or false when invalid. This lives outside the
 * action files because a "use server" module may only export async functions.
 */
export function parseLinkUrl(value: FormDataEntryValue | null): string | null | false {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return raw;
  } catch {
    return false;
  }
}
