/**
 * A declarative description of a client site's editable content, rendered as a form
 * by SiteContentPanel and enforced on save by `sanitizeSection`. Plain data only —
 * it crosses the server/client boundary as a prop.
 *
 * The client's own repo holds the matching schema and the defaults; the spec here
 * only has to agree with it on keys and value types.
 */

type Base = {
  key: string;
  label: string;
  hint?: string;
};

export type FieldSpec =
  | (Base & {
      kind: "text";
      /** Renders a textarea instead of a single-line input. */
      multiline?: boolean;
      /** Allows an empty value. Off by default — an empty heading looks like a bug. */
      optional?: boolean;
    })
  | (Base & {
      kind: "number";
      /** Blank saves as null — the site's convention for "request a quote". */
      optional?: boolean;
    })
  /** string[], one item per line. */
  | (Base & { kind: "list"; optional?: boolean })
  /** string[], one paragraph per blank-line-separated block. */
  | (Base & { kind: "paragraphs" })
  /** { src, alt }. `decorative` images carry no alt text, by design. */
  | (Base & { kind: "image"; decorative?: boolean })
  | (Base & { kind: "group"; fields: FieldSpec[] })
  | (Base & {
      kind: "repeat";
      /** Singular noun for one entry, e.g. "Price". */
      itemLabel: string;
      fields: FieldSpec[];
      min?: number;
      max?: number;
    });

export type SectionSpec = {
  key: string;
  title: string;
  description?: string;
  fields: FieldSpec[];
};

export type SiteSpec = {
  /** Where root-relative image paths (the site's built-in photos) resolve for previews. */
  previewOrigin: string;
  sections: SectionSpec[];
};

const TEXT_MAX = 300;
const LONG_TEXT_MAX = 4000;
const LIST_ITEM_MAX = 300;
const LIST_MAX_ITEMS = 60;
const NUMBER_MAX = 1_000_000;

type Ctx = {
  /** The only prefix an uploaded image URL may start with — this client's own folder. */
  uploadPrefix: string;
};

type Result = { ok: true; value: unknown } | { ok: false; error: string };

function fail(path: string[], message: string): Result {
  return { ok: false, error: `${path.join(" › ")}: ${message}` };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cleanList(raw: unknown, maxItem: number): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, maxItem));
}

function sanitizeField(field: FieldSpec, raw: unknown, path: string[], ctx: Ctx): Result {
  const here = [...path, field.label];

  switch (field.kind) {
    case "text": {
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value && !field.optional) return fail(here, "can't be empty.");
      const max = field.multiline ? LONG_TEXT_MAX : TEXT_MAX;
      if (value.length > max) return fail(here, `keep it under ${max} characters.`);
      return { ok: true, value };
    }

    case "number": {
      const str = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
      if (!str) {
        return field.optional ? { ok: true, value: null } : fail(here, "enter a number.");
      }
      const n = Number(str.replace(/[$,\s]/g, ""));
      if (!Number.isFinite(n) || n < 0 || n > NUMBER_MAX) {
        return fail(here, "enter a number like 175 or 12.50.");
      }
      return { ok: true, value: Math.round(n * 100) / 100 };
    }

    case "list":
    case "paragraphs": {
      const maxItem = field.kind === "paragraphs" ? LONG_TEXT_MAX : LIST_ITEM_MAX;
      const items = cleanList(raw, maxItem);
      if (!items) return fail(here, "invalid list.");
      if (items.length === 0 && !(field.kind === "list" && field.optional)) {
        return fail(here, "add at least one line.");
      }
      if (items.length > LIST_MAX_ITEMS) return fail(here, `keep it to ${LIST_MAX_ITEMS} lines.`);
      return { ok: true, value: items };
    }

    case "image": {
      if (!isObject(raw) || typeof raw.src !== "string") return fail(here, "invalid image.");
      const src = raw.src.trim();
      // Root-relative paths are the site's own built-in photos; anything else must
      // be an upload into this client's folder. Never an arbitrary URL.
      const builtIn = src.startsWith("/") && !src.startsWith("//") && !src.includes("..");
      if (!builtIn && !src.startsWith(ctx.uploadPrefix)) return fail(here, "invalid image.");
      const alt = field.decorative ? "" : typeof raw.alt === "string" ? raw.alt.trim() : "";
      if (!field.decorative && !alt) {
        return fail(here, "describe the photo in a few words, for screen readers.");
      }
      if (alt.length > TEXT_MAX) return fail(here, `keep the description under ${TEXT_MAX} characters.`);
      return { ok: true, value: { src, alt } };
    }

    case "group": {
      return sanitizeFields(field.fields, raw, here, ctx);
    }

    case "repeat": {
      if (!Array.isArray(raw)) return fail(here, "invalid list.");
      const min = field.min ?? 0;
      if (raw.length < min) return fail(here, `needs at least ${min} ${field.itemLabel.toLowerCase()}.`);
      if (field.max !== undefined && raw.length > field.max) {
        return fail(here, `keep it to ${field.max} or fewer.`);
      }
      const items: unknown[] = [];
      for (let i = 0; i < raw.length; i++) {
        const item = sanitizeFields(field.fields, raw[i], [...here, `${field.itemLabel} ${i + 1}`], ctx);
        if (!item.ok) return item;
        items.push(item.value);
      }
      return { ok: true, value: items };
    }
  }
}

function sanitizeFields(fields: FieldSpec[], raw: unknown, path: string[], ctx: Ctx): Result {
  const source = isObject(raw) ? raw : {};
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const result = sanitizeField(field, source[field.key], path, ctx);
    if (!result.ok) return result;
    out[field.key] = result.value;
  }
  return { ok: true, value: out };
}

/**
 * Validates and normalises one section exactly as the spec describes it. Keys the
 * spec doesn't name are dropped, so the browser can only ever write fields that
 * appear in the form.
 */
export function sanitizeSection(section: SectionSpec, raw: unknown, ctx: Ctx): Result {
  return sanitizeFields(section.fields, raw, [section.title], ctx);
}

/** A blank value for a field, used when adding a new entry to a repeat. */
export function emptyValue(field: FieldSpec): unknown {
  switch (field.kind) {
    case "text":
      return "";
    case "number":
      return "";
    case "list":
    case "paragraphs":
      return [];
    case "image":
      return { src: "", alt: "" };
    case "group":
      return Object.fromEntries(field.fields.map((f) => [f.key, emptyValue(f)]));
    case "repeat":
      return [];
  }
}
