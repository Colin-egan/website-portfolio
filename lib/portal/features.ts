export const FEATURES = ["files", "projects", "team", "crew", "new_this_week"] as const;

export type Feature = (typeof FEATURES)[number];

export const FEATURE_LABELS: Record<Feature, string> = {
  files: "Files",
  projects: "Projects",
  team: "Team",
  crew: "The Crew",
  new_this_week: "New This Week",
};

/** Display order, independent of the order stored in the database. */
export const TAB_ORDER: Feature[] = ["projects", "crew", "team", "new_this_week", "files"];

function isFeature(value: string): value is Feature {
  return (FEATURES as readonly string[]).includes(value);
}

/**
 * Unknown flags are dropped with a warning rather than thrown — a typo in SQL should
 * cost one tab, not the whole portal. An empty result falls back to Files so every
 * client always has a working tab.
 */
export function parseFeatures(raw: string[] | null): Feature[] {
  const known = new Set<Feature>();

  for (const value of raw ?? []) {
    if (isFeature(value)) {
      known.add(value);
    } else {
      console.warn(`parseFeatures: ignoring unknown feature "${value}"`);
    }
  }

  if (known.size === 0) return ["files"];

  return TAB_ORDER.filter((f) => known.has(f));
}
