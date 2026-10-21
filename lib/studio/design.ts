/**
 * The studio's copy of the starter template's design.json rules (lib/design.ts in
 * Colin-egan/eganlab-starter). Shared by the editor and the publish action.
 *
 * Section ids aren't fixed here: each site defines its own. The site is the final
 * judge — its preview bridge re-validates every design with the site's own parser,
 * the editor won't publish one the preview rejected, and an invalid design.json
 * fails the site's build, so it can never go live.
 */

export const COLOR_KEYS = [
  "background",
  "foreground",
  "muted",
  "surface",
  "border",
  "accent",
  "accentForeground",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_LABELS: Record<ColorKey, string> = {
  background: "Background",
  foreground: "Text",
  muted: "Muted text",
  surface: "Cards",
  border: "Borders",
  accent: "Accent",
  accentForeground: "Text on accent",
};

/** Keep in sync with FONTS in the starter template. */
export const FONTS = [
  "Inter",
  "DM Sans",
  "Manrope",
  "Space Grotesk",
  "Outfit",
  "IBM Plex Sans",
  "Fraunces",
  "Playfair Display",
  "Lora",
  "Libre Baskerville",
] as const;

export const SPACINGS = ["compact", "comfortable", "spacious"] as const;
export type Spacing = (typeof SPACINGS)[number];

export const RADIUS_MAX = 32;

export type Design = {
  theme: {
    colors: Record<ColorKey, string>;
    fonts: { heading: string; body: string };
    radius: number;
    spacing: Spacing;
  };
  sections: { id: string; visible: boolean }[];
};

type Result = { ok: true; design: Design } | { ok: false; error: string };

const HEX = /^#[0-9a-fA-F]{6}$/;
const SECTION_ID = /^[a-z][a-z0-9-]{0,39}$/;
const MAX_SECTIONS = 40;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validates a design's shape. Fonts must be on the studio's list or in `keepFonts` —
 * the fonts the site already uses — so a site with a custom font can still be edited.
 */
export function parseDesign(raw: unknown, keepFonts: readonly string[] = []): Result {
  const allowedFonts: readonly string[] = [...FONTS, ...keepFonts];
  const fail = (error: string): Result => ({ ok: false, error });

  if (!isObject(raw) || !isObject(raw.theme)) return fail("design.json has no theme.");
  const { theme } = raw;

  if (!isObject(theme.colors)) return fail("design.json has no colors.");
  const colors = {} as Record<ColorKey, string>;
  for (const key of COLOR_KEYS) {
    const value = theme.colors[key];
    if (typeof value !== "string" || !HEX.test(value)) {
      return fail(`${COLOR_LABELS[key]} must be a hex color like #1A2B3C.`);
    }
    colors[key] = value.toUpperCase();
  }

  if (!isObject(theme.fonts)) return fail("design.json has no fonts.");
  const { heading, body } = theme.fonts;
  if (typeof heading !== "string" || !allowedFonts.includes(heading)) return fail("Pick a heading font from the list.");
  if (typeof body !== "string" || !allowedFonts.includes(body)) return fail("Pick a body font from the list.");

  const { radius } = theme;
  if (typeof radius !== "number" || !Number.isInteger(radius) || radius < 0 || radius > RADIUS_MAX) {
    return fail(`Corner radius must be a whole number from 0 to ${RADIUS_MAX}.`);
  }

  const { spacing } = theme;
  if (typeof spacing !== "string" || !(SPACINGS as readonly string[]).includes(spacing)) {
    return fail(`Spacing must be one of: ${SPACINGS.join(", ")}.`);
  }

  if (!Array.isArray(raw.sections) || raw.sections.length > MAX_SECTIONS) {
    return fail("design.json has an invalid section list.");
  }
  const sections: Design["sections"] = [];
  for (const entry of raw.sections) {
    if (!isObject(entry) || typeof entry.id !== "string" || !SECTION_ID.test(entry.id)) {
      return fail("design.json has an invalid section.");
    }
    if (typeof entry.visible !== "boolean") return fail(`Section "${entry.id}" needs visible: true/false.`);
    if (sections.some((s) => s.id === entry.id)) return fail(`Section "${entry.id}" is listed twice.`);
    sections.push({ id: entry.id, visible: entry.visible });
  }

  return {
    ok: true,
    design: {
      theme: { colors, fonts: { heading, body }, radius, spacing: spacing as Spacing },
      sections,
    },
  };
}

/** The design.json as committed: any font it already names is accepted. */
export function parseSavedDesign(raw: unknown): Result {
  const fonts = isObject(raw) && isObject(raw.theme) && isObject(raw.theme.fonts) ? raw.theme.fonts : {};
  const used = [fonts.heading, fonts.body].filter((f): f is string => typeof f === "string");
  return parseDesign(raw, used);
}

/** The fonts a site may pick: the studio's list plus any the site already uses. */
export function fontsFor(design: Design): string[] {
  return [...new Set([...FONTS, design.theme.fonts.heading, design.theme.fonts.body])];
}

/**
 * Serialises like the template's own design.json — two-space indent, one section per
 * line, trailing newline — so a commit's diff shows only what actually changed.
 */
export function formatDesign(design: Design): string {
  return (
    JSON.stringify(design, null, 2).replace(
      /\{\s+"id": ("[^"]*"),\s+"visible": (true|false)\s+\}/g,
      '{ "id": $1, "visible": $2 }'
    ) + "\n"
  );
}

/** Plain-English list of what changed, for the commit message and the Publish button. */
export function describeChanges(before: Design, after: Design): string[] {
  const changes: string[] = [];

  for (const key of COLOR_KEYS) {
    const a = before.theme.colors[key];
    const b = after.theme.colors[key];
    if (a !== b) changes.push(`${COLOR_LABELS[key].toLowerCase()} color ${a} → ${b}`);
  }
  if (before.theme.fonts.heading !== after.theme.fonts.heading) {
    changes.push(`heading font ${before.theme.fonts.heading} → ${after.theme.fonts.heading}`);
  }
  if (before.theme.fonts.body !== after.theme.fonts.body) {
    changes.push(`body font ${before.theme.fonts.body} → ${after.theme.fonts.body}`);
  }
  if (before.theme.radius !== after.theme.radius) {
    changes.push(`corner radius ${before.theme.radius}px → ${after.theme.radius}px`);
  }
  if (before.theme.spacing !== after.theme.spacing) {
    changes.push(`spacing ${before.theme.spacing} → ${after.theme.spacing}`);
  }

  const order = (d: Design) => d.sections.map((s) => s.id).join(",");
  if (order(before) !== order(after)) {
    changes.push(`section order → ${after.sections.map((s) => s.id).join(", ")}`);
  }
  for (const section of after.sections) {
    const was = before.sections.find((s) => s.id === section.id);
    if (!was && !section.visible) changes.push(`hid ${section.id}`);
    else if (was && was.visible !== section.visible) {
      changes.push(`${section.visible ? "showed" : "hid"} ${section.id}`);
    }
  }

  return changes;
}
