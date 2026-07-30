// Usage: node --env-file=.env.local scripts/dump-portal-data.mjs <output-path>
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: node --env-file=.env.local scripts/dump-portal-data.mjs <output-path>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const dump = {};
for (const table of ["clients", "team_members", "projects"]) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.error(`Failed to read ${table}:`, error.message);
    process.exit(1);
  }
  dump[table] = data;
  console.log(`${table}: ${data.length} rows`);
}

writeFileSync(outPath, JSON.stringify(dump, null, 2));
console.log("Wrote", outPath);
