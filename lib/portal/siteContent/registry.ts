import type { SiteSpec } from "@/lib/portal/siteContent/spec";
import { tidelineSpec } from "@/lib/portal/siteContent/tideline";

/**
 * Which content spec a client edits, keyed by login domain. The `site_content`
 * feature flag turns the tab on; this decides what's in it. A client with the flag
 * but no entry here sees an explanatory empty state rather than another client's form.
 */
const SPECS: Record<string, SiteSpec> = {
  "tidelineliving.com": tidelineSpec,
};

export function getSiteSpec(domain: string): SiteSpec | null {
  return SPECS[domain] ?? null;
}
