# Memory Lane Comics Portal — Implementation Plan (Portal Phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Memory Lane Comics a portal with The Crew (including per-member comic picks), New This Week (weekly video + shop pics), and Files — and no Projects tab — without changing anything Mission Properties sees or owns.

**Architecture:** A `features text[]` column on `clients` drives which panels render, replacing the hardcoded tab list. `team_members` gains three nullable columns and `TeamPanel` gains a required `variant` prop so one panel serves both clients with different field sets. Picks, weekly pics, and per-client scalars get their own tables and action files.

**Tech Stack:** Next 16.2.9 (App Router), React 19.2.4, TypeScript, Supabase (`egan-client-portal`, ref `vfjrqzdkctkhadcmyfpi`), Tailwind, shadcn-style UI primitives in `components/ui/`.

Spec: [2026-07-30-memory-lane-portal-design.md](../specs/2026-07-30-memory-lane-portal-design.md)

## Global Constraints

- **This repo is Next 16.2.9 / React 19.2.4.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before writing code. APIs differ from older Next.
- **No test runner exists.** Verification for every task is `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus the named manual check. Do not add a test framework.
- **Mission Properties is live** (`missionprop.com`, client `829776c3-f8f3-49e5-978e-157f06dfaa05`). No task may corrupt, overwrite, or delete their rows or storage objects.
- **Memory Lane client id is `da08188d-b6de-4864-a5c5-7587101c64a8`** (`mlcshop.com`).
- Every server action: `getSession()` first, return `{ error: "Not authenticated." }` when absent, scope every query by `session.clientId`, `revalidatePath("/portal")` on success.
- Service-role key is server-only. Never `NEXT_PUBLIC_`.
- New RLS policies go on new tables only. Never modify the policies on `projects` or `team_members`.
- Commit after every task.

---

### Task 1: Back up the live portal data

A local dump makes a bad `UPDATE` a two-minute fix. Do this before any migration.

**Files:**
- Create: `scripts/dump-portal-data.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: a timestamped JSON dump outside the repo; no code other tasks import

- [ ] **Step 1: Write the dump script**

```js
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
```

- [ ] **Step 2: Run it, writing outside the repo**

```bash
node --env-file=.env.local scripts/dump-portal-data.mjs ~/portal-backup-2026-07-30.json
```

Expected: three row counts printed (`clients: 3`, plus team_members and projects counts), then `Wrote /Users/.../portal-backup-2026-07-30.json`.

- [ ] **Step 3: Confirm the dump is real**

```bash
node -e "const d=require(process.env.HOME+'/portal-backup-2026-07-30.json'); console.log(Object.keys(d), d.clients.map(c=>c.domain))"
```

Expected: `[ 'clients', 'team_members', 'projects' ] [ 'missionprop.com', 'test.com', 'mlcshop.com' ]`

- [ ] **Step 4: Commit**

```bash
git add scripts/dump-portal-data.mjs
git commit -m "Add a portal data dump script for pre-migration backups"
```

---

### Task 2: Extract shared image helpers

The largest risk in this plan. `projectActions.ts:214-261` and `teamActions.ts:134-181` are byte-identical apart from the `BUCKET` each closes over, and `sanitizeFileName` also exists in `actions.ts:52`. Two new action files need all of it. Extract first, change no behavior.

**Files:**
- Create: `lib/portal/imageUpload.ts`
- Modify: `lib/portal/actions.ts:52-54`, `lib/portal/projectActions.ts:214-261`, `lib/portal/teamActions.ts:134-181`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `MAX_IMAGE_BYTES: number`
  - `ALLOWED_IMAGE_TYPES: Set<string>`
  - `sanitizeFileName(name: string): string`
  - `extractStoragePath(bucket: string, publicUrl: string): string | null`
  - `prepareImageFile(file: File): Promise<{ file: File; error: null } | { file: null; error: string }>`

- [ ] **Step 1: Create the shared module**

`extractStoragePath` takes `bucket` as its first parameter — the current copies close over a module-level constant, and that is exactly the difference to get right.

```ts
import convert from "heic-convert";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

/**
 * Recover the storage object path from a public Supabase URL. Returns null when the
 * URL doesn't belong to `bucket` — callers must skip the delete rather than guess a
 * path, or they risk removing the wrong object.
 */
export function extractStoragePath(bucket: string, publicUrl: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

function isHeic(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await convert({ buffer: inputBuffer, format: "JPEG", quality: 0.92 });
  const newName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([new Uint8Array(outputBuffer)], newName, { type: "image/jpeg" });
}

export async function prepareImageFile(
  file: File
): Promise<{ file: File; error: null } | { file: null; error: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { file: null, error: "Image is too large (max 20MB)." };
  }
  if (isHeic(file)) {
    try {
      return { file: await convertHeicToJpeg(file), error: null };
    } catch (err) {
      console.error("prepareImageFile: HEIC conversion failed", err);
      return {
        file: null,
        error: "Couldn't convert this HEIC photo. Please export as JPEG and try again.",
      };
    }
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { file: null, error: "Unsupported image format. Please use JPEG, PNG, WebP, or GIF." };
  }
  return { file, error: null };
}
```

- [ ] **Step 2: Update `teamActions.ts`**

Delete lines 134-181 (`sanitizeFileName` through `prepareImageFile`, including `MAX_IMAGE_BYTES`, `ALLOWED_IMAGE_TYPES`, `isHeic`, `convertHeicToJpeg`) and the now-unused `import convert from "heic-convert"` at line 4. Add to the imports:

```ts
import { extractStoragePath, prepareImageFile, sanitizeFileName } from "@/lib/portal/imageUpload";
```

Update both `extractStoragePath` call sites to pass the bucket — line 125 and line 257 become:

```ts
const path = extractStoragePath(BUCKET, member.photo);
```

and line 212:

```ts
const previousPath = member.photo ? extractStoragePath(BUCKET, member.photo) : null;
```

- [ ] **Step 3: Update `projectActions.ts`**

Delete lines 214-261 and the `import convert from "heic-convert"` line. Add the same import. Update every `extractStoragePath(x)` call to `extractStoragePath(BUCKET, x)`.

```bash
grep -n "extractStoragePath" lib/portal/projectActions.ts
```

Expected after edit: every call has two arguments.

- [ ] **Step 4: Update `actions.ts`**

Delete `sanitizeFileName` at lines 52-54 and import it instead:

```ts
import { sanitizeFileName } from "@/lib/portal/imageUpload";
```

- [ ] **Step 5: Verify no copies remain**

```bash
grep -rn "function sanitizeFileName\|function extractStoragePath\|function prepareImageFile\|function isHeic\|function convertHeicToJpeg" lib/ | grep -v imageUpload.ts
```

Expected: no output.

```bash
grep -rn "extractStoragePath(" lib/ | grep -v "bucket: string"
```

Expected: every call site passes two arguments.

- [ ] **Step 6: Typecheck, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: all three clean.

- [ ] **Step 7: Mission Properties regression pass**

Run `npm run dev`, log into `/portal` as `missionprop.com`.

1. Projects, Team, Files tabs all load with the same rows as before.
2. Upload a project photo, confirm it appears, delete it, confirm it is gone **and every other project image still renders**.
3. Upload a team headshot, confirm it appears, remove it, confirm gone and other headshots still render.

This is the step that catches a wrong-bucket bug. Do not skip it.

- [ ] **Step 8: Commit**

```bash
git add lib/portal/imageUpload.ts lib/portal/actions.ts lib/portal/projectActions.ts lib/portal/teamActions.ts
git commit -m "Extract the duplicated portal image helpers into one module"
```

---

### Task 3: Database migrations

**Files:**
- Create: `supabase/migrations/20260730_memory_lane_portal.sql` (record of what was applied)

**Interfaces:**
- Consumes: nothing
- Produces: `clients.features`; `team_members.picks_url`, `.shop_location`, `.image_position`; tables `team_picks`, `weekly_pics`, `client_settings`; bucket `weekly-media`

- [ ] **Step 1: Write the migration SQL**

The `ALTER` and both backfills are one transaction — a separate backfill would leave a window where Mission Properties parses to `{files}` and loses their tabs. `image_position` has **no** DB default, because `ADD COLUMN ... DEFAULT` writes into every existing row.

```sql
-- clients.features, added and backfilled atomically
begin;

alter table public.clients
  add column if not exists features text[] not null default '{}';

update public.clients
  set features = '{files,projects,team}'
  where domain = 'missionprop.com';

update public.clients
  set features = '{files,crew,new_this_week}'
  where domain = 'mlcshop.com';

commit;

-- team_members: three nullable columns. NULL satisfies CHECK in Postgres, so
-- existing Mission Properties rows are untouched and still valid.
alter table public.team_members
  add column if not exists picks_url text,
  add column if not exists shop_location text,
  add column if not exists image_position text;

alter table public.team_members
  add constraint team_members_shop_location_check
  check (shop_location is null or shop_location in ('original', 'part_two'));

alter table public.team_members
  add constraint team_members_image_position_check
  check (image_position is null or image_position in ('top', 'center'));

-- Composite-FK target, so a pick can never point at another client's member.
alter table public.team_members
  add constraint team_members_id_client_id_key unique (id, client_id);

create table if not exists public.team_picks (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null,
  client_id uuid not null references public.clients(id),
  image text not null,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint team_picks_member_fk
    foreign key (team_member_id, client_id)
    references public.team_members(id, client_id)
    on delete cascade
);

create index if not exists team_picks_member_idx
  on public.team_picks (team_member_id, sort_order);

create table if not exists public.weekly_pics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  image text not null,
  title text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists weekly_pics_client_idx
  on public.weekly_pics (client_id, sort_order);

create table if not exists public.client_settings (
  client_id uuid not null references public.clients(id),
  key text not null,
  value text,
  primary key (client_id, key)
);

-- Public read, no write policy. Writes go through the service role, which
-- bypasses RLS. Existing policies on projects and team_members are untouched.
alter table public.team_picks enable row level security;
alter table public.weekly_pics enable row level security;
alter table public.client_settings enable row level security;

create policy "public read team_picks" on public.team_picks for select using (true);
create policy "public read weekly_pics" on public.weekly_pics for select using (true);
create policy "public read client_settings" on public.client_settings for select using (true);
```

- [ ] **Step 2: Apply it**

Apply via the Supabase MCP `apply_migration` tool against project ref `vfjrqzdkctkhadcmyfpi`, name `memory_lane_portal`.

- [ ] **Step 3: Verify features backfilled and nothing else changed**

```sql
select domain, features from public.clients order by domain;
```

Expected exactly:

```
missionprop.com  {files,projects,team}
mlcshop.com      {files,crew,new_this_week}
test.com         {}
```

```sql
select count(*) filter (where picks_url is not null) as picks_url_set,
       count(*) filter (where shop_location is not null) as shop_set,
       count(*) filter (where image_position is not null) as pos_set,
       count(*) as total
from public.team_members;
```

Expected: `0 | 0 | 0 | <total>` — every new column null on every existing row. A non-zero `pos_set` means a DEFAULT slipped in and wrote to Mission Properties' rows.

- [ ] **Step 4: Create the public `weekly-media` bucket**

Create bucket `weekly-media`, **public**, in the Supabase dashboard or via the storage API. Confirm it is public — the client's site must be able to render these images.

- [ ] **Step 5: Commit the migration record**

```bash
git add supabase/migrations/20260730_memory_lane_portal.sql
git commit -m "Add migrations for feature flags, crew columns, picks, weekly pics, settings"
```

---

### Task 4: Feature flag module

**Files:**
- Create: `lib/portal/features.ts`, `lib/portal/client.ts`

**Interfaces:**
- Consumes: `getSession()` from `lib/portal/session.ts`, `getSupabaseAdmin()` from `lib/supabase/admin.ts`
- Produces:
  - `type Feature = "files" | "projects" | "team" | "crew" | "new_this_week"`
  - `FEATURE_LABELS: Record<Feature, string>`
  - `TAB_ORDER: Feature[]`
  - `parseFeatures(raw: string[] | null): Feature[]`
  - `getClientFeatures(): Promise<Feature[]>`

- [ ] **Step 1: Write `lib/portal/features.ts`**

```ts
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
```

- [ ] **Step 2: Write `lib/portal/client.ts`**

Read per request rather than baking into the session JWT, so a flag change takes effect without a re-login.

```ts
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { parseFeatures, type Feature } from "@/lib/portal/features";

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
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/portal/features.ts lib/portal/client.ts
git commit -m "Add per-client portal feature flags"
```

---

### Task 5: Feature-driven tabs and conditional data loading

Mission Properties must be indistinguishable from before at the end of this task.

**Files:**
- Modify: `components/portal/PortalTabs.tsx` (whole file), `app/portal/page.tsx` (whole file)

**Interfaces:**
- Consumes: `Feature`, `FEATURE_LABELS`, `TAB_ORDER`, `getClientFeatures()`
- Produces: `type PortalData` exported from `components/portal/PortalTabs.tsx`

- [ ] **Step 1: Rewrite `components/portal/PortalTabs.tsx`**

The ternary chain does not scale to five panels; a record keyed by feature does. `new_this_week` renders `null` for now — Task 9 replaces that one line once the panel exists.

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { ProjectsPanel } from "@/components/portal/ProjectsPanel";
import { TeamPanel } from "@/components/portal/TeamPanel";
import { FEATURE_LABELS, type Feature } from "@/lib/portal/features";
import type { Project } from "@/lib/portal/projectActions";
import type { TeamMember } from "@/lib/portal/teamActions";

type FileEntry = { name: string; size: number; updatedAt: string | null };

export type PortalData = {
  files: FileEntry[];
  projects: Project[];
  team: TeamMember[];
  publishEnabled: boolean;
};

export function PortalTabs({ features, data }: { features: Feature[]; data: PortalData }) {
  const [tab, setTab] = useState<Feature>(features[0] ?? "files");
  const active = features.includes(tab) ? tab : (features[0] ?? "files");

  const panels: Record<Feature, () => React.ReactNode> = {
    files: () => <PortalDashboard files={data.files} />,
    projects: () => (
      <ProjectsPanel projects={data.projects} publishEnabled={data.publishEnabled} />
    ),
    team: () => <TeamPanel members={data.team} variant="team" />,
    crew: () => <TeamPanel members={data.team} variant="crew" />,
    new_this_week: () => null,
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Client Portal</h1>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut size={14} />
              Log out
            </Button>
          </form>
        </div>

        <div className="flex gap-1 border-b border-border">
          {features.map((f) => (
            <button
              key={f}
              onClick={() => setTab(f)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                active === f
                  ? "border-purple-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {FEATURE_LABELS[f]}
            </button>
          ))}
        </div>

        {panels[active]()}
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `app/portal/page.tsx`**

Load features first, then only the datasets the flags call for. Memory Lane never queries `projects`; Mission Properties never queries weekly data.

```tsx
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { getClientFeatures } from "@/lib/portal/client";
import { listProjects, canPublish } from "@/lib/portal/projectActions";
import { listTeamMembers } from "@/lib/portal/teamActions";
import { PortalLogin } from "@/components/portal/PortalLogin";
import { PortalTabs, type PortalData } from "@/components/portal/PortalTabs";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Upload and manage files for your website project.",
};

const BUCKET = "client-files";

export default async function PortalPage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <div className="pt-28" />
        <PortalLogin />
        <Footer />
      </>
    );
  }

  const features = await getClientFeatures();
  const supabase = getSupabaseAdmin();

  const [files, projects, team, publishEnabled] = await Promise.all([
    features.includes("files")
      ? supabase.storage
          .from(BUCKET)
          .list(session.clientId, { sortBy: { column: "created_at", order: "desc" } })
          .then(({ data }) =>
            (data ?? []).map((f) => ({
              name: f.name,
              size: f.metadata?.size ?? 0,
              updatedAt: f.updated_at ?? null,
            }))
          )
      : Promise.resolve([]),
    features.includes("projects") ? listProjects() : Promise.resolve([]),
    features.includes("team") || features.includes("crew")
      ? listTeamMembers()
      : Promise.resolve([]),
    features.includes("projects") ? canPublish() : Promise.resolve(false),
  ]);

  const data: PortalData = { files, projects, team, publishEnabled };

  return (
    <>
      <div className="pt-28" />
      <PortalTabs features={features} data={data} />
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Add the required `variant` prop to `TeamPanel`**

Minimal change now so the build passes; Task 6 uses it. In `components/portal/TeamPanel.tsx`, change the signature:

```tsx
export type TeamVariant = "team" | "crew";

export function TeamPanel({
  members,
  variant,
}: {
  members: TeamMember[];
  variant: TeamVariant;
}) {
```

and make the heading reflect it, replacing the `<h2>` and its `<p>`:

```tsx
<h2 className="text-lg font-display font-bold">
  {variant === "crew" ? "The Crew" : "Team"}
</h2>
<p className="text-sm text-muted-foreground mt-1">
  {variant === "crew"
    ? "Add crew members, edit bios, and upload photos."
    : "Add team members, edit bios, and upload headshots."}
</p>
```

`variant` is required with no default: a missing value is a TypeScript error, not a silent fallback into the wrong field set.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: all clean.

- [ ] **Step 5: Mission Properties regression pass**

`npm run dev`, log in as `missionprop.com`:

1. Tabs read **Projects, Team, Files** — same three, same order as before.
2. Every project and team row is present.
3. Team bios still show multiple paragraphs; Education and Personal fields still populated.
4. The Publish button still appears.

Then log in as `mlcshop.com`: tabs read **The Crew, New This Week, Files**, with **no Projects tab**. The Crew is empty, New This Week is blank (built in Task 9).

- [ ] **Step 6: Commit**

```bash
git add components/portal/PortalTabs.tsx app/portal/page.tsx components/portal/TeamPanel.tsx
git commit -m "Render portal tabs from per-client feature flags"
```

---

### Task 6: Crew variant fields and a variant-scoped upsert

**Files:**
- Modify: `lib/portal/teamActions.ts` (the `TeamMember` type and `upsertTeamMemberAction`), `components/portal/TeamPanel.tsx` (`TeamMemberForm`)

**Interfaces:**
- Consumes: `TeamVariant` from `components/portal/TeamPanel.tsx`
- Produces: `TeamMember` gains `picks_url`, `shop_location`, `image_position`; `upsertTeamMemberAction` reads a `variant` form field

- [ ] **Step 1: Extend the `TeamMember` type**

In `lib/portal/teamActions.ts`:

```ts
export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  photo: string | null;
  bio: string[] | null;
  education: string[] | null;
  personal: string | null;
  sort_order: number;
  picks_url: string | null;
  shop_location: "original" | "part_two" | null;
  image_position: "top" | "center" | null;
};
```

- [ ] **Step 2: Make the upsert variant-scoped**

This is a correctness requirement. Today the action rebuilds every field on every save, so a form omitting `education` writes `[]` over it. Replace the `fields` block in `upsertTeamMemberAction` with:

```ts
  const variant = String(formData.get("variant") || "team");

  // Only the keys this variant owns. A crew save must never touch education or
  // personal; a team save must never touch picks_url or shop_location. Anything
  // absent from this object is left alone by the update.
  const shared = {
    name,
    title: String(formData.get("title") || "") || null,
  };

  const fields =
    variant === "crew"
      ? {
          ...shared,
          bio: parseParagraphs(formData.get("bio")),
          picks_url: String(formData.get("picks_url") || "") || null,
          shop_location: String(formData.get("shop_location") || "") || null,
          image_position: String(formData.get("image_position") || "") || null,
        }
      : {
          ...shared,
          bio: parseParagraphs(formData.get("bio")),
          education: parseList(formData.get("education")),
          personal: String(formData.get("personal") || "") || null,
        };
```

The rest of the function (the `if (id)` update / else insert) is unchanged.

- [ ] **Step 3: Add the crew fields to `TeamMemberForm`**

In `components/portal/TeamPanel.tsx`, thread `variant` through both call sites — `<TeamMemberForm onDone={...} variant={variant} />` and `<TeamMemberForm member={member} variant={variant} />` (the latter is inside `TeamMemberRow`, so add `variant` to its props too and pass it down from `TeamPanel`).

Then update the form:

```tsx
function TeamMemberForm({
  member,
  variant,
  onDone,
}: {
  member?: TeamMember;
  variant: TeamVariant;
  onDone?: () => void;
}) {
```

Add the hidden variant field immediately after the `id` field:

```tsx
      <input type="hidden" name="variant" value={variant} />
```

Change the bio label so the crew sees the right instruction:

```tsx
        <label className={label}>
          {variant === "crew" ? "Bio" : "Bio (separate paragraphs with a blank line)"}
        </label>
```

Replace the Education/Personal grid with a variant switch:

```tsx
      {variant === "crew" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Which shop</label>
            <select
              name="shop_location"
              defaultValue={member?.shop_location ?? ""}
              className={field}
            >
              <option value="">Not set</option>
              <option value="original">201 Princess St.</option>
              <option value="part_two">222 Princess St. (Part II)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Picks page link</label>
            <input
              name="picks_url"
              defaultValue={member?.picks_url ?? ""}
              placeholder="/acespicks"
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Photo crop</label>
            <select
              name="image_position"
              defaultValue={member?.image_position ?? ""}
              className={field}
            >
              <option value="">Center</option>
              <option value="top">Top</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Education (one per line)</label>
            <textarea
              name="education"
              defaultValue={member?.education?.join("\n") ?? ""}
              rows={3}
              className={textarea}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Personal note</label>
            <textarea
              name="personal"
              defaultValue={member?.personal ?? ""}
              rows={3}
              className={textarea}
            />
          </div>
        </div>
      )}
```

Also change the submit button copy:

```tsx
        {pending ? "Saving..." : member ? "Save changes" : variant === "crew" ? "Add crew member" : "Add team member"}
```

and the "Add team member" button at the top of `TeamPanel`, plus the empty state text, to use `variant === "crew" ? "crew member" : "team member"`.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 5: Verify the field isolation manually**

As `mlcshop.com`: add a crew member with a shop and picks link. Then in SQL:

```sql
select name, bio, education, personal, picks_url, shop_location
from public.team_members where client_id = 'da08188d-b6de-4864-a5c5-7587101c64a8';
```

Expected: `education` and `personal` are **null**, not `[]` or `''`.

As `missionprop.com`: open a team member with education entries, change only their title, save. Re-check that member's `education` and `personal` in SQL — both must be **unchanged**. This is the corruption case; verify it.

- [ ] **Step 6: Commit**

```bash
git add lib/portal/teamActions.ts components/portal/TeamPanel.tsx
git commit -m "Add the crew variant to TeamPanel with a variant-scoped upsert"
```

---

### Task 7: Comic picks per crew member

**Files:**
- Create: `lib/portal/pickActions.ts`, `components/portal/TeamPicksEditor.tsx`
- Modify: `lib/portal/teamActions.ts` (delete a member's pick images with them), `app/portal/page.tsx` (load picks), `components/portal/PortalTabs.tsx` (pass picks), `components/portal/TeamPanel.tsx` (render the editor)

**Interfaces:**
- Consumes: `prepareImageFile`, `sanitizeFileName`, `extractStoragePath` from `lib/portal/imageUpload.ts`
- Produces:
  - `type TeamPick = { id: string; team_member_id: string; image: string; title: string; sort_order: number }`
  - `listTeamPicks(): Promise<Record<string, TeamPick[]>>` keyed by `team_member_id`
  - `addTeamPickAction(prev: PickFormState, formData: FormData): Promise<PickFormState>`
  - `deleteTeamPickAction(id: string): Promise<void>`
  - `moveTeamPickAction(id: string, direction: "up" | "down"): Promise<void>`
  - `type PickFormState = { error: string | null }`

- [ ] **Step 1: Write `lib/portal/pickActions.ts`**

Reordering swaps `sort_order` with the neighbour — no drag-and-drop dependency, works on touch.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { extractStoragePath, prepareImageFile, sanitizeFileName } from "@/lib/portal/imageUpload";

const BUCKET = "team-media";

export type TeamPick = {
  id: string;
  team_member_id: string;
  image: string;
  title: string;
  sort_order: number;
};

export type PickFormState = { error: string | null };

/** All of this client's picks, grouped by member id. */
export async function listTeamPicks(): Promise<Record<string, TeamPick[]>> {
  const session = await getSession();
  if (!session) return {};

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("team_picks")
    .select("id, team_member_id, image, title, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const grouped: Record<string, TeamPick[]> = {};
  for (const pick of (data ?? []) as TeamPick[]) {
    (grouped[pick.team_member_id] ??= []).push(pick);
  }
  return grouped;
}

export async function addTeamPickAction(
  _prevState: PickFormState,
  formData: FormData
): Promise<PickFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const memberId = String(formData.get("memberId") || "");
  const title = String(formData.get("title") || "").trim();
  const rawFile = formData.get("file");

  if (!memberId) return { error: "Missing crew member." };
  if (!title) return { error: "Comic title is required." };
  if (!(rawFile instanceof File) || rawFile.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const prepared = await prepareImageFile(rawFile);
  if (!prepared.file) return { error: prepared.error };
  const file = prepared.file;

  const supabase = getSupabaseAdmin();

  const { data: member } = await supabase
    .from("team_members")
    .select("slug")
    .eq("id", memberId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!member) return { error: "Crew member not found." };

  const path = `${session.clientId}/picks/${member.slug}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: last } = await supabase
    .from("team_picks")
    .select("sort_order")
    .eq("team_member_id", memberId)
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("team_picks").insert({
    team_member_id: memberId,
    client_id: session.clientId,
    image: publicUrlData.publicUrl,
    title,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: "Failed to add pick." };
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteTeamPickAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pick } = await supabase
    .from("team_picks")
    .select("image")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pick) return;

  await supabase.from("team_picks").delete().eq("id", id).eq("client_id", session.clientId);

  const path = extractStoragePath(BUCKET, pick.image);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}

export async function moveTeamPickAction(id: string, direction: "up" | "down") {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pick } = await supabase
    .from("team_picks")
    .select("id, team_member_id, sort_order")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pick) return;

  const { data: siblings } = await supabase
    .from("team_picks")
    .select("id, sort_order")
    .eq("team_member_id", pick.team_member_id)
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const list = siblings ?? [];
  const index = list.findIndex((p) => p.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await supabase.from("team_picks").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("team_picks").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/portal");
}
```

- [ ] **Step 2: Delete pick images when a crew member is deleted**

In `deleteTeamMemberAction` in `lib/portal/teamActions.ts`, before the row delete (the DB cascade removes the rows but not the storage objects):

```ts
  const { data: picks } = await supabase
    .from("team_picks")
    .select("image")
    .eq("team_member_id", id)
    .eq("client_id", session.clientId);

  const pickPaths = (picks ?? [])
    .map((p) => extractStoragePath(BUCKET, p.image))
    .filter((p): p is string => p !== null);

  if (pickPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(pickPaths);
  }
```

- [ ] **Step 3: Write `components/portal/TeamPicksEditor.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import {
  addTeamPickAction,
  deleteTeamPickAction,
  moveTeamPickAction,
  type TeamPick,
  type PickFormState,
} from "@/lib/portal/pickActions";
import { Button } from "@/components/ui/button";

const initialState: PickFormState = { error: null };

export function TeamPicksEditor({
  memberId,
  memberName,
  picks,
}: {
  memberId: string;
  memberName: string;
  picks: TeamPick[];
}) {
  const [state, formAction, pending] = useActionState(addTeamPickAction, initialState);

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">
        {memberName}&apos;s picks
        <span className="text-muted-foreground font-normal"> ({picks.length})</span>
      </h4>

      {picks.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-3">
          No picks yet — this page shows &ldquo;Coming Soon&rdquo; on the site until one is added.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4">
          {picks.map((pick, i) => (
            <li key={pick.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pick.image}
                alt=""
                className="size-12 rounded object-cover shrink-0"
              />
              <span className="flex-1 min-w-0 text-sm truncate">{pick.title}</span>
              <form action={moveTeamPickAction.bind(null, pick.id, "up")}>
                <Button type="submit" variant="ghost" size="icon-sm" disabled={i === 0} aria-label="Move up">
                  <ArrowUp size={14} />
                </Button>
              </form>
              <form action={moveTeamPickAction.bind(null, pick.id, "down")}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === picks.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </Button>
              </form>
              <form action={deleteTeamPickAction.bind(null, pick.id)}>
                <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete pick">
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* React 19 resets uncontrolled fields itself once a form action resolves. */}
      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <input type="hidden" name="memberId" value={memberId} />
        <input
          name="title"
          required
          placeholder="Comic title"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
        />
        <Button type="submit" size="sm" disabled={pending}>
          <ImagePlus size={14} />
          {pending ? "Adding..." : "Add pick"}
        </Button>
      </form>

      {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Thread picks through the page and panel**

In `app/portal/page.tsx`, import `listTeamPicks` and add to the `Promise.all` array:

```ts
    features.includes("crew") ? listTeamPicks() : Promise.resolve({}),
```

destructure it as `picks`, and add `picks` to the `PortalData` object.

In `components/portal/PortalTabs.tsx`, add to `PortalData`:

```ts
  picks: Record<string, TeamPick[]>;
```

with `import type { TeamPick } from "@/lib/portal/pickActions";`, and pass it in the crew panel:

```tsx
    crew: () => <TeamPanel members={data.team} variant="crew" picks={data.picks} />,
```

`team: () => <TeamPanel members={data.team} variant="team" />` stays as-is.

In `components/portal/TeamPanel.tsx`, accept an optional `picks` prop on `TeamPanel` and `TeamMemberRow`, and render the editor inside the expanded row, after the photo block, only for the crew variant:

```tsx
          {variant === "crew" && (
            <TeamPicksEditor
              memberId={member.id}
              memberName={member.name}
              picks={picks?.[member.id] ?? []}
            />
          )}
```

- [ ] **Step 5: Typecheck, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 6: Manual check**

As `mlcshop.com`: expand a crew member, add two picks, reorder them with the arrows, delete one. Confirm the remaining pick's image still renders. Delete the crew member entirely, then confirm in Supabase storage that their `picks/` folder is gone.

As `missionprop.com`: confirm the Team tab shows **no** picks editor.

- [ ] **Step 7: Commit**

```bash
git add lib/portal/pickActions.ts components/portal/TeamPicksEditor.tsx lib/portal/teamActions.ts app/portal/page.tsx components/portal/PortalTabs.tsx components/portal/TeamPanel.tsx
git commit -m "Let the crew manage their own comic picks"
```

---

### Task 8: Settings and weekly actions

**Files:**
- Create: `lib/portal/settings.ts`, `lib/portal/weeklyActions.ts`

**Interfaces:**
- Consumes: `prepareImageFile`, `sanitizeFileName`, `extractStoragePath`
- Produces:
  - `getSetting(key: string): Promise<string | null>`, `setSetting(key: string, value: string | null): Promise<void>`
  - `type WeeklyPic = { id: string; image: string; title: string; caption: string | null; sort_order: number }`
  - `listWeeklyPics(): Promise<WeeklyPic[]>`
  - `addWeeklyPicAction`, `deleteWeeklyPicAction(id)`, `moveWeeklyPicAction(id, direction)`
  - `getWeeklyVideoUrl(): Promise<string | null>`, `setWeeklyVideoUrlAction`
  - `type WeeklyFormState = { error: string | null }`, `type VideoFormState = { error: string | null; saved?: boolean }`

- [ ] **Step 1: Write `lib/portal/settings.ts`**

```ts
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";

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
```

- [ ] **Step 2: Write `lib/portal/weeklyActions.ts`**

The only URL rule is that it parses as `http:`/`https:`. No host allowlist — the crew can paste anything, and the site decides at render time whether it embeds or shows a link card. This is what keeps an arbitrary string out of an `<iframe>`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/portal/session";
import { getSetting, setSetting } from "@/lib/portal/settings";
import { extractStoragePath, prepareImageFile, sanitizeFileName } from "@/lib/portal/imageUpload";

const BUCKET = "weekly-media";
const VIDEO_KEY = "weekly_video_url";

export type WeeklyPic = {
  id: string;
  image: string;
  title: string;
  caption: string | null;
  sort_order: number;
};

export type WeeklyFormState = { error: string | null };
export type VideoFormState = { error: string | null; saved?: boolean };

export async function listWeeklyPics(): Promise<WeeklyPic[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("weekly_pics")
    .select("id, image, title, caption, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  return (data ?? []) as WeeklyPic[];
}

export async function getWeeklyVideoUrl(): Promise<string | null> {
  return getSetting(VIDEO_KEY);
}

export async function setWeeklyVideoUrlAction(
  _prevState: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const raw = String(formData.get("url") || "").trim();

  if (!raw) {
    await setSetting(VIDEO_KEY, null);
    revalidatePath("/portal");
    return { error: null, saved: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "That doesn't look like a link. Paste the full URL, starting with https://" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http:// and https:// links are allowed." };
  }

  await setSetting(VIDEO_KEY, raw);
  revalidatePath("/portal");
  return { error: null, saved: true };
}

export async function addWeeklyPicAction(
  _prevState: WeeklyFormState,
  formData: FormData
): Promise<WeeklyFormState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const title = String(formData.get("title") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const rawFile = formData.get("file");

  if (!title) return { error: "Comic title is required." };
  if (!(rawFile instanceof File) || rawFile.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const prepared = await prepareImageFile(rawFile);
  if (!prepared.file) return { error: prepared.error };
  const file = prepared.file;

  const supabase = getSupabaseAdmin();
  const path = `${session.clientId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: last } = await supabase
    .from("weekly_pics")
    .select("sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("weekly_pics").insert({
    client_id: session.clientId,
    image: publicUrlData.publicUrl,
    title,
    caption,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: "Failed to add pic." };
  }

  revalidatePath("/portal");
  return { error: null };
}

export async function deleteWeeklyPicAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: pic } = await supabase
    .from("weekly_pics")
    .select("image")
    .eq("id", id)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!pic) return;

  await supabase.from("weekly_pics").delete().eq("id", id).eq("client_id", session.clientId);

  const path = extractStoragePath(BUCKET, pic.image);
  if (path) await supabase.storage.from(BUCKET).remove([path]);

  revalidatePath("/portal");
}

export async function moveWeeklyPicAction(id: string, direction: "up" | "down") {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const supabase = getSupabaseAdmin();
  const { data: list } = await supabase
    .from("weekly_pics")
    .select("id, sort_order")
    .eq("client_id", session.clientId)
    .order("sort_order", { ascending: true });

  const pics = list ?? [];
  const index = pics.findIndex((p) => p.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= pics.length) return;

  const a = pics[index];
  const b = pics[swapWith];

  await supabase.from("weekly_pics").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("weekly_pics").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/portal");
}
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add lib/portal/settings.ts lib/portal/weeklyActions.ts
git commit -m "Add weekly pics and per-client settings actions"
```

---

### Task 9: The New This Week panel

**Files:**
- Create: `components/portal/NewThisWeekPanel.tsx`, `components/portal/WeeklyPicsGrid.tsx`
- Modify: `app/portal/page.tsx`, `components/portal/PortalTabs.tsx`

**Interfaces:**
- Consumes: everything from `lib/portal/weeklyActions.ts`
- Produces: `PortalData` gains `weeklyPics: WeeklyPic[]` and `weeklyVideoUrl: string | null`

- [ ] **Step 1: Write `components/portal/WeeklyPicsGrid.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import {
  addWeeklyPicAction,
  deleteWeeklyPicAction,
  moveWeeklyPicAction,
  type WeeklyPic,
  type WeeklyFormState,
} from "@/lib/portal/weeklyActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const initialState: WeeklyFormState = { error: null };

export function WeeklyPicsGrid({ pics }: { pics: WeeklyPic[] }) {
  const [state, formAction, pending] = useActionState(addWeeklyPicAction, initialState);

  return (
    <div>
      <h3 className="text-sm font-medium mb-1">Pics of the week</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Photos of the new comics that came in. These show on the homepage under the video.
      </p>

      {pics.length === 0 ? (
        <Card className="p-2 mb-4">
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">
              No pics yet. The homepage section still shows the video and the shop links.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {pics.map((pic, i) => (
            <li key={pic.id} className="flex gap-3 rounded-lg border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pic.image} alt="" className="size-16 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pic.title}</p>
                {pic.caption && (
                  <p className="text-xs text-muted-foreground truncate">{pic.caption}</p>
                )}
                <div className="flex gap-1 mt-1">
                  <form action={moveWeeklyPicAction.bind(null, pic.id, "up")}>
                    <Button type="submit" variant="ghost" size="icon-sm" disabled={i === 0} aria-label="Move up">
                      <ArrowUp size={14} />
                    </Button>
                  </form>
                  <form action={moveWeeklyPicAction.bind(null, pic.id, "down")}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      disabled={i === pics.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </Button>
                  </form>
                  <form action={deleteWeeklyPicAction.bind(null, pic.id)}>
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete pic">
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* React 19 resets uncontrolled fields itself once a form action resolves. */}
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="title"
            required
            placeholder="Comic title"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            name="caption"
            placeholder="Caption (optional)"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium hover:file:bg-purple-500 file:transition-colors"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <ImagePlus size={14} />
            {pending ? "Adding..." : "Add pic"}
          </Button>
        </div>
      </form>

      {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write `components/portal/NewThisWeekPanel.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { setWeeklyVideoUrlAction, type VideoFormState, type WeeklyPic } from "@/lib/portal/weeklyActions";
import { Button } from "@/components/ui/button";
import { WeeklyPicsGrid } from "@/components/portal/WeeklyPicsGrid";

const initialState: VideoFormState = { error: null };

export function NewThisWeekPanel({
  pics,
  videoUrl,
}: {
  pics: WeeklyPic[];
  videoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(setWeeklyVideoUrlAction, initialState);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-display font-bold">New This Week</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The video and comic pics shown in the New This Week section of your homepage.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Weekly video</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Paste the link to this week&apos;s video. Instagram reels play right on the page;
          anything else shows as a button linking to it.
        </p>
        <form action={formAction} className="flex flex-col sm:flex-row gap-3">
          <input
            name="url"
            type="url"
            defaultValue={videoUrl ?? ""}
            placeholder="https://www.instagram.com/reel/..."
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save video"}
          </Button>
        </form>
        {state.error && <p className="text-sm text-destructive mt-2">{state.error}</p>}
        {!state.error && state.saved && (
          <p className="text-sm text-muted-foreground mt-2">Saved.</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Leave it empty to remove the video from the homepage.
        </p>
      </div>

      <WeeklyPicsGrid pics={pics} />
    </div>
  );
}
```

- [ ] **Step 3: Wire it into the page and tabs**

In `app/portal/page.tsx`, import `listWeeklyPics` and `getWeeklyVideoUrl` and add to `Promise.all`:

```ts
    features.includes("new_this_week") ? listWeeklyPics() : Promise.resolve([]),
    features.includes("new_this_week") ? getWeeklyVideoUrl() : Promise.resolve(null),
```

Destructure as `weeklyPics` and `weeklyVideoUrl`, add both to `data`.

In `components/portal/PortalTabs.tsx`, add to `PortalData`:

```ts
  weeklyPics: WeeklyPic[];
  weeklyVideoUrl: string | null;
```

import `NewThisWeekPanel` and `type WeeklyPic`, and replace the placeholder:

```tsx
    new_this_week: () => (
      <NewThisWeekPanel pics={data.weeklyPics} videoUrl={data.weeklyVideoUrl} />
    ),
```

- [ ] **Step 4: Typecheck, lint, build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 5: Manual check**

As `mlcshop.com`, on New This Week:

1. Paste an Instagram reel URL, save. Expect "Saved."
2. Paste `javascript:alert(1)`, save. Expect the inline error and **no change** in the database.
3. Paste a YouTube URL, save. Expect it to save — classification happens on the site.
4. Clear the field, save. Expect the setting cleared to null.
5. Add three pics, reorder with the arrows, delete one.

- [ ] **Step 6: Commit**

```bash
git add components/portal/NewThisWeekPanel.tsx components/portal/WeeklyPicsGrid.tsx app/portal/page.tsx components/portal/PortalTabs.tsx
git commit -m "Add the New This Week panel for the weekly video and shop pics"
```

---

### Task 10: End-to-end verification and documentation

**Files:**
- Modify: `CLIENTPORTALADDITION.md`

**Interfaces:**
- Consumes: everything above
- Produces: nothing code depends on

- [ ] **Step 1: Full manual pass as Memory Lane**

Log in as `mlcshop.com`:

1. Tabs are exactly **The Crew, New This Week, Files** — no Projects.
2. Add a crew member with name, title, bio, shop, picks link, and photo.
3. Add two picks, reorder, delete one.
4. Set a weekly video and add two pics.
5. Log out and back in — everything persists.

- [ ] **Step 2: Full Mission Properties regression pass**

Log in as `missionprop.com`:

1. Tabs are exactly **Projects, Team, Files**, with the Publish button present.
2. All projects and team members present with correct data.
3. Team bios are still multi-paragraph; Education and Personal intact.
4. Edit a team member's title only, save, and confirm in SQL their `education` and `personal` are unchanged.
5. No picks editor and no New This Week tab anywhere.

- [ ] **Step 3: Diff against the backup**

```bash
node --env-file=.env.local scripts/dump-portal-data.mjs ~/portal-after-2026-07-30.json
```

Then compare Mission Properties' rows:

```bash
node -e "
const a=require(process.env.HOME+'/portal-backup-2026-07-30.json');
const b=require(process.env.HOME+'/portal-after-2026-07-30.json');
const mp='829776c3-f8f3-49e5-978e-157f06dfaa05';
const pick=d=>({team:d.team_members.filter(r=>r.client_id===mp),proj:d.projects.filter(r=>r.client_id===mp)});
const x=pick(a),y=pick(b);
console.log('team same:', JSON.stringify(x.team)===JSON.stringify(y.team));
console.log('projects same:', JSON.stringify(x.proj)===JSON.stringify(y.proj));
"
```

Expected: both `true`. A `false` means something wrote to their rows — investigate before continuing.

- [ ] **Step 4: Document feature flags in the runbook**

Add to `CLIENTPORTALADDITION.md`, after the "How it works" section:

```markdown
### Per-client tabs

Which tabs a client sees comes from `clients.features`, a `text[]`. The mapping from flag to
panel lives in [lib/portal/features.ts](lib/portal/features.ts) — add a flag there and to
`TAB_ORDER`, then enable it per client with SQL:

```sql
update public.clients set features = '{files,crew,new_this_week}' where domain = '<domain>';
```

| Flag | Panel |
|---|---|
| `files` | File drop (all clients) |
| `projects` | Projects, with the Publish button |
| `team` | Team — bios, education, personal (Mission Properties) |
| `crew` | Team panel, retail variant — shop, picks link, per-member comic picks (Memory Lane) |
| `new_this_week` | Weekly video URL + shop pics of the week (Memory Lane) |

Unknown flags are ignored with a warning; an empty list falls back to `{files}`, so a client
always has at least one working tab.
```

- [ ] **Step 5: Commit**

```bash
git add CLIENTPORTALADDITION.md
git commit -m "Document per-client portal feature flags in the runbook"
```

---

## Not in this plan

The site phase — wiring `mlcshop.com` to read from Supabase, the content migration script, the
deploy hook, and the Vercel env vars — is spec steps 8-11 and gets its own plan. Until then the
MLC site keeps serving its hardcoded crew, picks, and reel URL; portal edits are stored but not
yet visible on the live site.
