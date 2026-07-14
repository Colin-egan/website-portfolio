// Usage: node --env-file=.env.local scripts/add-client.mjs <domain> <password> ["Client Name"]
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [domain, password, name] = process.argv.slice(2);

if (!domain || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/add-client.mjs <domain> <password> ["Client Name"]'
  );
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const passwordHash = await bcrypt.hash(password, 10);
const normalizedDomain = domain.trim().toLowerCase();

const { data, error } = await supabase
  .from("clients")
  .insert({ domain: normalizedDomain, password_hash: passwordHash, name: name ?? null })
  .select("id, domain, name")
  .single();

if (error) {
  console.error("Failed to create client:", error.message);
  process.exit(1);
}

console.log("Client created:", data);
