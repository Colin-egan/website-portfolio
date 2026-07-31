import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { parseFeatures, type Feature } from "@/lib/portal/features";

/**
 * Read per request rather than baking into the session JWT, so changing a client's
 * flags takes effect without forcing them to log in again.
 */
export async function getClientFeatures(): Promise<Feature[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("clients")
    .select("features")
    .eq("id", session.clientId)
    .maybeSingle();

  return parseFeatures(data?.features ?? null);
}
