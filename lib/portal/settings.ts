import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";

/** Per-client scalar settings, so the next one doesn't need a schema migration. */
export async function getSetting(key: string): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("client_settings")
    .select("value")
    .eq("client_id", session.clientId)
    .eq("key", key)
    .maybeSingle();

  return data?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  await supabase
    .from("client_settings")
    .upsert({ client_id: session.clientId, key, value }, { onConflict: "client_id,key" });
}
