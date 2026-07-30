# Memory Lane Comics in the Client Portal

Give the Memory Lane Comics crew (`mlcshop.com`) self-serve control of three things on their
site: the crew roster and each member's comic picks, the shop's pics of the week, and the
weekly video embed. They do not get the Projects tab — it is a construction-industry shape
that means nothing to a comic shop.

This is the first client whose portal differs from Mission Properties', so it introduces
per-client feature flags.

## Context

The portal lives in `website-portfolio` at `/portal`, backed by the shared Supabase project
`egan-client-portal` (ref `vfjrqzdkctkhadcmyfpi`). See `CLIENTPORTALADDITION.md` for the
onboarding runbook and the auth/isolation model, which this design does not change.

The client row already exists:

| Field | Value |
|---|---|
| `client_id` | `da08188d-b6de-4864-a5c5-7587101c64a8` |
| `domain` | `mlcshop.com` |
| `name` | Memory Lane Comics |
| `deploy_hook_url` | `null` — set in step 8 below |

What exists today that this work changes:

- `components/portal/PortalTabs.tsx:17` hardcodes `["Files", "Projects", "Team"]` for every
  client, and picks a panel with a ternary chain.
- `app/portal/page.tsx` loads files, projects, team, and publish state unconditionally, for
  every client, regardless of which tabs they can see.
- `team_members` is shaped for Mission Properties: `bio[]`, `education[]`, `personal`.
- The MLC site hardcodes a 6-member crew array in `src/app/the-crew/page.tsx`, seven picks
  pages under `src/app/*picks/`, and a single reel URL constant `NEW_THIS_WEEK_REEL_URL`
  consumed at `src/app/page.tsx:109`.

Version constraint — the two repos are on different Next majors, and code cannot be copied
between them without checking APIs:

| Repo | Next | React |
|---|---|---|
| `website-portfolio` (portal) | 16.2.9 | 19.2.4 |
| `memory-lane-comics` (site) | 14.2.5 | 18 |

Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` of the repo being
edited before writing code in it. This applies separately to each repo.

## Architecture: per-client feature flags

`clients` gains a `features text[]` column. `PortalTabs` renders only the panels listed, in a
fixed display order. Enabling a tab for a client becomes a SQL update, not a deploy.

| Client | `features` |
|---|---|
| Mission Properties | `{files, projects, team}` |
| Memory Lane Comics | `{files, crew, new_this_week}` |

`team` and `crew` render the same `TeamPanel` with different field sets — the flag names the
panel and its variant. Rejected alternatives: a `template` column (rigid — a client wanting
Projects *and* weekly video needs a new template, i.e. a code change for config), and deriving
tabs from data presence (circular — a new client has no rows, so no tabs, so no way to add
rows).

Failure modes are contained by design:

- An unrecognized flag is dropped at parse time with a `console.warn`. A typo in SQL degrades
  one tab; it never crashes the portal.
- An empty or null `features` list falls back to `{files}`, so every client always has at
  least one working tab. This also makes the column safe to add before backfilling.

### New: `lib/portal/features.ts`

Single source of truth, in the spirit of `lib/portal/projectStages.ts`:

```ts
export const FEATURES = ["files", "projects", "team", "crew", "new_this_week"] as const
export type Feature = (typeof FEATURES)[number]

export const FEATURE_LABELS: Record<Feature, string> = {
  files: "Files",
  projects: "Projects",
  team: "Team",
  crew: "The Crew",
  new_this_week: "New This Week",
}

// Display order, independent of the order stored in the DB.
export const TAB_ORDER: Feature[] = ["projects", "crew", "team", "new_this_week", "files"]

export function parseFeatures(raw: string[] | null): Feature[]
```

`parseFeatures` filters unknown strings, dedupes, sorts by `TAB_ORDER`, and returns
`["files"]` when the result is empty.

### New: `lib/portal/client.ts`

`getClientFeatures(): Promise<Feature[]>` reads `clients.features` for the session's
`client_id` and runs it through `parseFeatures`. Features are read per request rather than
baked into the session JWT, so a flag change takes effect without forcing a re-login.

## Schema

All new tables: RLS enabled, public read policy, **no write policy** — writes go through the
service role only, matching `projects`.

### `clients` (altered)

| Column | Type | Notes |
|---|---|---|
| `features` | `text[] not null default '{}'` | Empty is valid; parses to `{files}` |

### `team_members` (altered — three nullable columns)

| Column | Type | Notes |
|---|---|---|
| `picks_url` | `text` | e.g. `/acespicks`. Null = crew card renders no picks link |
| `shop_location` | `text` | `check (shop_location in ('original','part_two'))` |
| `image_position` | `text` | `check (image_position in ('top','center')) default 'center'` |

`shop_location` stores semantics, not the `green`/`purple` the site currently passes to
`CrewCard`. The mapping (`original` → green, `part_two` → purple) lives on the site, so brand
colors stay out of the database.

Bio reuses the existing `bio text[]`. The crew variant shows one textarea and writes a
single-element array. No new column, no data migration for Mission Properties.

### `team_picks` (new)

One comic per row, nested under a crew member.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `team_member_id` | `uuid not null` | `on delete cascade` |
| `client_id` | `uuid not null references clients(id)` | Denormalized on purpose — see below |
| `image` | `text not null` | Full public Supabase URL |
| `title` | `text not null` | Comic title; also the basis for alt text |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz default now()` | |

`client_id` is redundant with the parent's, but every portal query is scoped by `client_id`
taken from the verified session, and picks should not be the one table that breaks that
pattern. To stop the two drifting apart, add `unique (id, client_id)` on `team_members` and
make `team_picks` use a composite foreign key `(team_member_id, client_id)`. A mismatched pair
is then rejected by the database, not merely by careful application code.

### `weekly_pics` (new)

The shop pics of the week — photos of new comic books. One current set, replaced whenever the
crew likes. No dates, no archive.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id)` | |
| `image` | `text not null` | |
| `title` | `text not null` | Comic title, e.g. "Ultimate Spider-Man #12" |
| `caption` | `text` | Optional single line |
| `sort_order` | `int not null default 0` | |
| `created_at` | `timestamptz default now()` | |

### `client_settings` (new)

Key/value for per-client scalars, so the next one needs no migration.

| Column | Type | Notes |
|---|---|---|
| `client_id` | `uuid not null references clients(id)` | |
| `key` | `text not null` | |
| `value` | `text` | |
| | | `primary key (client_id, key)` |

One key today: `weekly_video_url`.

### Storage buckets

| Bucket | Visibility | Path | Status |
|---|---|---|---|
| `team-media` | public | `{client_id}/{slug}/` headshots, `{client_id}/picks/{slug}/` picks | exists |
| `weekly-media` | public | `{client_id}/` | **new** |

Picks reuse `team-media` under a `picks/` prefix — they are team-owned images and do not
warrant a second bucket.

## Portal implementation

### Shared image helpers — `lib/portal/imageUpload.ts` (new)

`sanitizeFileName` exists three times (`actions.ts:52`, `projectActions.ts:214`,
`teamActions.ts:134`). `extractStoragePath`, `MAX_IMAGE_BYTES`, `ALLOWED_IMAGE_TYPES`,
`isHeic`, `convertHeicToJpeg`, and `prepareImageFile` each exist twice, identical in
`projectActions.ts:214-260` and `teamActions.ts:134-181`. This design adds two more action
files that need all of it; extracting first prevents a third and fourth copy.

Exports: `MAX_IMAGE_BYTES`, `ALLOWED_IMAGE_TYPES`, `sanitizeFileName`,
`extractStoragePath(bucket, publicUrl)`, `prepareImageFile(file)`, and
`uploadPublicImage(bucket, path, file)`. `extractStoragePath` takes the bucket as a parameter
since the current copies close over a module-level `BUCKET` constant.

Refactor `actions.ts`, `projectActions.ts`, and `teamActions.ts` to import from it. Behavior
is unchanged — this is a pure extraction, verified by the existing Files/Projects/Team flows
still working.

### Server actions

| File | Status | Contents |
|---|---|---|
| `lib/portal/settings.ts` | new | `getSetting(key)`, `setSetting(key, value)` over `client_settings`, scoped by session |
| `lib/portal/pickActions.ts` | new | `listTeamPicks(memberId)`, `addTeamPickAction`, `updateTeamPickAction`, `deleteTeamPickAction`, `reorderTeamPicksAction` |
| `lib/portal/weeklyActions.ts` | new | `listWeeklyPics`, `addWeeklyPicAction`, `updateWeeklyPicAction`, `deleteWeeklyPicAction`, `reorderWeeklyPicsAction`, `getWeeklyVideoUrl`, `setWeeklyVideoUrlAction` |
| `lib/portal/teamActions.ts` | edited | Accept `picks_url`, `shop_location`, `image_position` on upsert; delete a member's picks images from storage on delete |

Picks live in their own file rather than in `teamActions.ts` (already 261 lines) because they
are a distinct shape with their own CRUD surface. `weeklyActions.ts` owns everything behind
the New This Week tab, delegating the scalar to `settings.ts`.

Every action follows the established pattern: `getSession()` first, return
`{ error: "Not authenticated." }` when absent, scope every query by `session.clientId`, and
`revalidatePath("/portal")` on success.

### Video URL handling

The crew can paste any URL — no host allowlist. The only validation is that it parses as a
URL with an `http:` or `https:` protocol; anything else (including `javascript:` and `data:`)
is rejected inline. The raw string is stored as pasted.

Classification happens at render time on the site, not at save time, so re-rendering never
depends on how a URL was categorized when it was saved:

- Host is `instagram.com` / `www.instagram.com` → the existing `InstagramEmbed` component.
- Anything else → a link card: the comic-styled panel with the URL as a labeled outbound
  link.

This keeps the crew's freedom to paste anything while ensuring no arbitrary URL is ever
injected into an `<iframe>`, and a URL from an unexpected host degrades to a working link
instead of a broken embed box.

### Page data loading — `app/portal/page.tsx`

Load features first, then load only the datasets the client's flags call for, in parallel.
Today the page queries projects and team for every client; after this change Memory Lane never
queries `projects` and Mission Properties never queries `weekly_pics`.

Shape passed down:

```ts
type PortalData = {
  files: FileEntry[]
  projects?: Project[]
  team?: TeamMember[]          // with picks attached when the crew variant is active
  weeklyPics?: WeeklyPic[]
  weeklyVideoUrl?: string | null
  publishEnabled: boolean
}
```

### Components

| File | Status | Notes |
|---|---|---|
| `components/portal/PortalTabs.tsx` | edited | Takes `features` + `PortalData`. Renders tabs from `TAB_ORDER`; default tab is the first feature. Replaces the ternary chain with a feature → panel record, which does not scale to five panels. |
| `components/portal/TeamPanel.tsx` | edited | New `variant: "team" \| "crew"` prop driving field visibility |
| `components/portal/TeamPicksEditor.tsx` | new | Per-member picks: upload, title, reorder, delete |
| `components/portal/NewThisWeekPanel.tsx` | new | Video URL field + save, above the pics grid |
| `components/portal/WeeklyPicsGrid.tsx` | new | Upload, title, caption, reorder, delete |

`TeamPanel` field visibility by variant:

| Field | `team` | `crew` |
|---|---|---|
| Name, title, photo | shown | shown |
| Bio | multi-paragraph | single paragraph |
| Education, Personal | shown | hidden |
| Which shop, Picks link | hidden | shown |
| Picks grid | hidden | shown |

Picks editing is kept in its own component rather than inlined into `TeamPanel`, and the
weekly grid separate from its panel, because `ProjectsPanel.tsx` is already 437 lines and is
the cautionary example.

Reordering — both picks and weekly pics — uses **move up / move down controls, not
drag-and-drop**. Each click writes the affected `sort_order` values through the relevant
reorder action. This avoids adding a drag-and-drop dependency to the portal, and works on
touch without extra handling.

Alt text is derived, never hand-entered: a pick renders as `` `${title} — pick by ${member
name}` `` and a weekly pic as `` `${title} — new this week at Memory Lane Comics` ``. This is
why `title` is required on both tables.

## Site wiring — `memory-lane-comics`

### Read-only Supabase client

`npm install @supabase/supabase-js`, then `src/lib/supabase.ts` with the **publishable/anon
key only** — never the service role — and `CLIENT_ID` from `MLC_CLIENT_ID`, throwing on
missing env vars so a misconfigured build fails loudly rather than publishing an empty site.

### Data modules

| File | Exports |
|---|---|
| `src/lib/crew.ts` | `getCrew()` → rows mapped onto the existing `CrewCard` props, including `shop_location` → `location` color |
| `src/lib/picks.ts` | `getPicks(slug)` → that member's picks, ordered |
| `src/lib/weekly.ts` | `getWeeklyPics()`, `getWeeklyVideoUrl()` |
| `src/lib/videoEmbed.ts` | `classifyVideoUrl(url)` → `{ kind: "instagram" \| "link" }` |

Each keeps the existing TypeScript interfaces and maps DB rows onto them, so page components
change as little as possible — the `missionproperties/lib/completed-projects.ts` pattern.

### Page changes

- `src/app/the-crew/page.tsx` — delete the hardcoded `crew` array, `await getCrew()`.
- The seven `src/app/*picks/` routes — keep all seven files and their URLs (note the existing
  `/jakespics` vs `/benspicks` spelling inconsistency, which must be preserved; `picks_url` in
  the database is the source of truth for what the crew card links to). Each becomes a thin
  wrapper rendering a shared `src/components/PicksPage.tsx` with its slug — a dynamic
  `[slug]` route is deliberately avoided, since a top-level catch-all would swallow every
  unmatched path on the site. A member with zero picks renders the existing "Coming Soon!"
  layout, which is what four of these pages are by hand today.
- `src/app/page.tsx` — replace `NEW_THIS_WEEK_REEL_URL` with `getWeeklyVideoUrl()`, and add
  the weekly pics grid below the embed inside the existing "New This Week" section.
- `next.config.js` — add `vfjrqzdkctkhadcmyfpi.supabase.co` to `images.remotePatterns`.
- Guard every `next/image` against an empty `src`.

Data fetches become `async`; await them in pages and `generateMetadata`.

### Content migration

`scripts/migrate-mlc.mjs` in the MLC repo, run once with a temporary `.env.migrate` holding
the service-role key, deleted immediately after:

1. Six `team_members` rows from the existing crew array, uploading `public/crew/*.jpg` to
   `team-media`, preserving `title`, bio, `picks_url`, `image_position`, and mapping
   `green`/`purple` → `original`/`part_two`.
2. `team_picks` rows for Jake, Ben, and Ace (2 comics each) from the `IMAGES` tokens. Jose,
   Sean, Eric, and Tyler get none — their pages stay "Coming Soon" until the crew fills them
   in, which is the point of the feature.
3. `client_settings.weekly_video_url` = the current `NEW_THIS_WEEK_REEL_URL`.

`weekly_pics` starts empty; there is no existing content for it. The homepage must therefore
render correctly with zero pics from day one.

Tyler is in neither the crew array nor the migration — `/tylerspicks` is an orphan route. Left
as-is; deleting it is out of scope.

## Error handling

| Condition | Behavior |
|---|---|
| Unknown feature flag | Dropped at parse, `console.warn`, other tabs unaffected |
| Empty/null `features` | Falls back to `{files}` |
| No weekly video set | Homepage section renders without the embed block |
| No weekly pics | Section renders video only |
| Neither video nor pics | Section keeps its heading and both CTAs, omits the media. It is **not** hidden outright — the "Shop New Releases" button and the Instagram follow link live in this section, and an empty content week should not remove them from the homepage. |
| Member has no picks | Existing "Coming Soon!" page |
| Member has no photo | `CrewCard` already falls back to a placeholder SVG |
| Video URL not http(s) | Rejected inline in the portal, nothing saved |
| Video URL from unknown host | Renders as a link card |
| Image upload / HEIC failure | Inline error, existing `prepareImageFile` messages |
| Supabase unreachable at build | Throw — fail the build rather than deploy an empty site |

## Verification

Neither repo has a test runner (`lint` and `build` only), so this specifies verification
rather than a test suite. Introducing a framework is out of scope; if that is wanted it should
be its own piece of work.

Automated, per repo: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

Manual, after deploying the portal and before wiring the site:

1. Log into `/portal` as `mlcshop.com` — see Files, The Crew, New This Week. **No Projects tab.**
2. Log in as `missionprop.com` — see Files, Projects, Team, unchanged, with Education and
   Personal fields still present.
3. Add a crew member, upload a photo, set shop and picks link, add two picks, reorder, delete one.
4. Paste an Instagram reel URL, then a YouTube URL, then `javascript:alert(1)` — expect embed,
   link card, and inline rejection respectively.
5. Upload weekly pics, reorder, delete all of them, confirm the homepage section hides cleanly.
6. Confirm one client's session cannot read or write the other's rows.

## Sequencing

1. Read the Next docs in each repo per `AGENTS.md`.
2. Extract `lib/portal/imageUpload.ts`; confirm existing tabs still work.
3. Migrations: `clients.features`, `team_members` columns, `team_picks`, `weekly_pics`,
   `client_settings`, `weekly-media` bucket, RLS policies.
4. Backfill `features` for both existing clients.
5. `features.ts`, `client.ts`, feature-driven `PortalTabs` and `page.tsx`. Mission Properties
   must be unchanged at this point.
6. `TeamPanel` crew variant + `TeamPicksEditor` + `pickActions.ts`.
7. `NewThisWeekPanel` + `WeeklyPicsGrid` + `weeklyActions.ts` + `settings.ts`.
8. Deploy hook for the MLC Vercel project; set `clients.deploy_hook_url`.
9. MLC site: Supabase client, data modules, page rewrites, `next.config.js`.
10. Run the migration script; delete `.env.migrate`.
11. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MLC_CLIENT_ID` on the MLC Vercel project, deploy.
12. Update `CLIENTPORTALADDITION.md` to document feature flags as the way a client gets a
    different tab set.

Steps 2-7 are portal-only and independently shippable; the site keeps serving hardcoded
content until step 9. This is a natural seam: the work can be split into two implementation
plans (portal, then site + migration) rather than one long one, and step 5 is the point to
confirm Mission Properties is genuinely unaffected before building anything new on top.

## Out of scope

- Any change to Mission Properties' tabs, fields, or data.
- A weekly-pics archive — the set is replaced, not versioned.
- Per-pic buy links or prices.
- Video hosts beyond Instagram rendering as true embeds.
- Deleting the orphaned `/tylerspicks` route or the MLC repo's now-unused static arrays and
  `public/images`, which are left as a safety net per the runbook.
- Introducing a test framework to either repo.
