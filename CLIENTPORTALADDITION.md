# Adding a Site to the Client Portal

Runbook for onboarding a new client site so the client can edit content and publish
without going through you. Mission Properties (`missionproperties.vercel.app`) is the
reference implementation — copy its pattern.

## How it works

The portal lives in **this repo** (`website-portfolio`) at `/portal`. It is backed by the
Supabase project **`egan-client-portal`** (ref `vfjrqzdkctkhadcmyfpi`), which is shared by
all clients. The client's own site repo stays separate — it just *reads* from Supabase at
build time.

- **Auth**: client logs in with their domain + a password you assign. Custom JWT cookie
  session (not Supabase Auth) — see [lib/portal/session.ts](lib/portal/session.ts).
- **Isolation**: every query and storage path is scoped by `client_id` taken from the
  verified session cookie, never from user input. All writes happen server-side with the
  service-role key, which never reaches the browser.
- **Publish**: a Vercel deploy hook per client, stored in `clients.deploy_hook_url`. The
  **Publish** button in the Projects tab POSTs to it, rebuilding the client's site so it
  picks up the latest Supabase content.

### Per-client tabs

Which tabs a client sees comes from `clients.features`, a `text[]`. The flag-to-panel mapping
lives in [lib/portal/features.ts](lib/portal/features.ts) — add a flag there and to
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
| `site_content` | Spec-driven editor for (almost) every word, price and photo on the site (TideLine Living) — see below |
| `studio` | **Developer account only.** Studio button — see "Studio (developer only)" below. Never give this to a client |

`team` and `crew` render the same `TeamPanel` with different field sets; the flag names the
panel *and* its variant. Unknown flags are ignored with a warning, and an empty list falls back
to `{files}`, so a client always has at least one working tab.

`upsertTeamMemberAction` writes only the columns its variant owns — a crew save never touches
`education` or `personal`, and a team save never touches `picks_url` or `shop_location`. Keep
that property if you add a third variant, or one client's form will wipe another's fields.

### Project stages

The client picks one of three stages per project in the Projects tab. The portal stores
this across two columns, because the client's site queries them separately:

| Portal stage | `status` | `phase` | Where it lands on the site |
|---|---|---|---|
| In the Pipeline | `current` | `in_pipeline` | `/current-projects`, "In the Pipeline" section |
| Under Construction | `current` | `under_construction` | `/current-projects`, "Under Construction" section |
| Completed | `completed` | `null` | `/completed-projects` |

The mapping lives in one place — `stageOf()` and `columnsForStage()` in
[lib/portal/projectStages.ts](lib/portal/projectStages.ts). The portal's `STAGE_LABELS` and
the client site's `PHASE_LABELS` each own their own wording; keep them in sync by hand.

Invariant: a `current` row always has a non-null `phase`, and a `completed` row always has
`phase = null`. A new client's rows satisfy this automatically since the stage picker writes
both columns together.

### Shared schema (already exists — don't recreate)

| Object | Purpose |
|---|---|
| `clients` | `id`, `domain` (login), `password_hash`, `name`, `deploy_hook_url` |
| `projects` | Per-client content rows. `status` (`'current'`/`'completed'`) and `phase` (`'under_construction'`/`'in_pipeline'`, null when completed) together form the three **stages** the client picks from — see below. `hero_image` is the key image (thumbnail/cover photo); it defaults to the first uploaded photo but the client can pick any photo from `images[]` as the key image from the Projects tab. |
| `team_members` | Per-client team bios (`name`, `title`, `photo`, `bio[]`, `education[]`, `personal`, `sort_order`). Added for Mission Properties as the first example of a second content shape — see note below. |
| `client-files` bucket | **Private.** Arbitrary file drop (Files tab). Served via signed URLs. |
| `project-media` bucket | **Public.** Project photos — must be publicly readable so they render on the client's live site. |
| `team-media` bucket | **Public.** Team headshots, one per `team_members` row. |
| `site_content` | One JSON document per client (`client_id` primary key, `content jsonb`) for the Site Content tab. Public read, like the other content tables. |
| `site-media` bucket | **Public.** Photos uploaded from the Site Content tab, under `{client_id}/`. |

### Site Content tab (`site_content`)

For a site whose copy lives in code rather than in rows — no projects, no team — the whole
site is one editable JSON document. The client edits it page by page in a generated form and
presses Publish.

- **The spec** ([lib/portal/siteContent/](lib/portal/siteContent/)) describes the form:
  sections (one per page, plus Business info and Prices), and fields of kind `text`,
  `number`, `list`, `paragraphs`, `image`, `group` and `repeat`. `sanitizeSection()` in
  [spec.ts](lib/portal/siteContent/spec.ts) enforces it on save — unknown keys are dropped,
  empty required fields and over-long text are rejected (never silently cut), image URLs
  must be the site's own `/…` paths or uploads in this client's `site-media` folder, and
  `format: "email"` fields must hold one address. The save returns what it stored, and
  the editor compares sections with `canonicalSection()` — the same normalisation — so
  "199" retyped over 199 is not an unsaved change.
- **Treat saved text as untrusted on the site.** React escapes it in markup, but anything
  written into a `<script>` (JSON-LD) must escape `<` — TideLine's `StructuredData` does.
- **Which spec a client gets** is keyed by login domain in
  [registry.ts](lib/portal/siteContent/registry.ts). The flag turns the tab on; the registry
  decides what's in it. A flagged client with no spec sees an empty state.
- **The client's site** owns the matching schema and defaults. TideLine's are
  `src/content/schema.ts` and `src/content/defaults.ts` in the tidelineliving repo, read at
  build time by `src/content/load.ts`. Keys must agree between the two; a mismatch costs a
  field (the site falls back to its default), not the build.
- **Seed the row** when onboarding, so the form opens on the site's real content: export the
  site's defaults to JSON, run them through `sanitizeSection` so they're in the exact shape a
  save would produce, and insert one `site_content` row for the client.

- **Going live:** TideLine has no deploy hook. Its pages set `revalidate = 60`, so they
  regenerate from Supabase in the background and a save is live within a couple of
  minutes. The spec's `liveOnSave` flag switches the panel's wording to match. A site that
  rebuilds on Publish instead leaves the flag off and gets a deploy hook as usual.
- **No Vercel env vars needed:** TideLine commits its Supabase URL, publishable key and
  client id (`src/content/portal.ts`) — none are secret — with env vars as overrides.

> **Read Supabase without `fetch`.** Next persists `fetch` responses in its data cache, and
> Vercel restores that cache on every build — including the deploy-hook rebuild behind
> Publish — so a `fetch` (or supabase-js, which uses it) can republish the previous build's
> content. TideLine's loader uses `node:https` for this reason. Verified locally: two
> consecutive builds with `fetch` served the first build's data.

### Studio (developer only)

`/studio` is your own design editor for sites built from the starter template,
[Colin-egan/eganlab-starter](https://github.com/Colin-egan/eganlab-starter) (see its README). It isn't a
client feature: it's reachable only from the portal, only by the developer account, and only
after a GitHub sign-in. Every check runs on the server
([lib/studio/session.ts](lib/studio/session.ts)), so hiding the button isn't what keeps it closed:

| Who | `/studio` |
|---|---|
| Not logged in | Redirects to `/portal` |
| Any client login | 404 |
| Developer login, no GitHub sign-in | "Sign in with GitHub" |
| Developer login + GitHub user `STUDIO_GITHUB_USER_ID` | The studio |

The GitHub sign-in sets a separate 8-hour `studio_session` cookie, tied to the developer
portal account that started it. Logging out of the portal clears it too. The OAuth app
requests no scopes, and its token is used once to check who you are, then thrown away.

**Setup, once:**

1. Create the developer account and give it only the `studio` flag:
   ```bash
   node --env-file=.env.local scripts/add-client.mjs <your-domain> <long-unique-password> "Egan Lab (dev)"
   ```
   ```sql
   update public.clients set features = '{studio}' where domain = '<your-domain>';
   ```
2. Create a GitHub OAuth app (GitHub → Settings → Developer settings → OAuth Apps), with
   callback URL `https://eganlab.com/studio/auth/github/callback`. An OAuth app has one
   callback URL, so make a second app for local dev with
   `http://localhost:3000/studio/auth/github/callback`.
3. Find your numeric GitHub user id: `https://api.github.com/users/<username>`, field `id`.
   It's checked instead of your username because the id never changes.
4. Create a fine-grained GitHub token (Settings → Developer settings → Fine-grained tokens):
   repository access **only your client site repos**, permission **Contents: Read and write**.
   The studio commits as you with it.
5. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `STUDIO_GITHUB_USER_ID` and
   `STUDIO_GITHUB_TOKEN` (see "Env vars, by repo").

**Adding a site:** create it from the template, deploy it on Vercel, give the token access
to its repo, and add a line to [lib/studio/sites.ts](lib/studio/sites.ts) with its live URL.

**Editing:** `/studio/<slug>` shows the live site in a frame beside the controls (colors,
fonts, corner radius, section spacing, section order and visibility). Changes preview
instantly and only for you. **Publish to GitHub** commits `design.json` to `main` with a
message listing each change, and Vercel deploys it. Publishing is refused if:

- the preview hasn't connected, or the site rejected the design — the site's own rules decide;
- `design.json` changed on GitHub since the editor loaded (e.g. you pushed from VS Code) —
  reload and publish again, so nothing is overwritten.

The font list lives in [lib/studio/design.ts](lib/studio/design.ts) and mirrors `FONTS` in
the template; add a font to both.

**Testing locally, with no setup** ([lib/studio/devMode.ts](lib/studio/devMode.ts)): run the
site and the portal side by side. `STUDIO_DEV_BYPASS=1` skips both sign-ins and, with
`STUDIO_DEV_DESIGN_FILE`, Publish writes that file instead of committing to GitHub. It only
works under `npm run dev`; a production build ignores it.

```bash
# Terminal 1, in the site's repo (e.g. starter-test):
NEXT_PUBLIC_STUDIO_ORIGIN=http://localhost:3000 npm run dev -- -p 3001

# Terminal 2, in this repo:
STUDIO_DEV_BYPASS=1 \
STUDIO_DEV_SITE_URL=http://localhost:3001 \
STUDIO_DEV_DESIGN_FILE=../starter-test/design.json \
npm run dev
```

Then open http://localhost:3000/studio. Saved changes land in the site's `design.json`
(the site reloads with them) and show up in `git diff` there.

---

## Steps to onboard a new site

### 1. Create the client account

From this repo, with `.env.local` populated:

```bash
node --env-file=.env.local scripts/add-client.mjs <domain> <password> "<Client Name>"
```

Save the returned `id` — that's the `client_id` the client's site will need.

### 2. Create a deploy hook for their site

In the **client's site repo** (must already be linked to a Vercel project):

```bash
vercel deploy-hooks create publish-from-portal --ref main
```

Store the returned URL on their client row so the Publish button appears for them:

```sql
update public.clients
set deploy_hook_url = '<hook url>'
where domain = '<domain>';
```

The Publish button is gated on this field (`canPublish()` in
[lib/portal/projectActions.ts](lib/portal/projectActions.ts)) — clients without a hook simply
don't see it.

### 3. Point the client's site at Supabase

In the client's repo:

```bash
npm install @supabase/supabase-js
```

Add `lib/supabase.ts` (read-only client — **anon/publishable key only, never service-role**):

```ts
import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !anonKey) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY")

export const supabase = createClient(url, anonKey)
export const CLIENT_ID = process.env.<SITE>_CLIENT_ID
```

Replace the site's hardcoded content arrays with Supabase queries filtered by
`client_id` + `status`. See
[missionproperties/lib/completed-projects.ts](../missionproperties/lib/completed-projects.ts)
for the pattern — it keeps the original TypeScript interface and maps DB rows onto it, so the
page components barely change.

Gotchas:
- Image fields become **full Supabase URLs**, not local filenames. Drop any
  `/images/${slug}/${filename}` path-building.
- Add the Supabase storage host to `next.config` `images.remotePatterns`:
  `vfjrqzdkctkhadcmyfpi.supabase.co`
- Data fetches become `async` — `await` them in pages, `generateStaticParams`, and
  `generateMetadata`.
- Guard `next/image` against an empty `src` (a project with no photos yet will crash the
  build otherwise).

### 4. Migrate the site's existing content

Write a one-off script (see
[missionproperties/scripts/migrate-projects.mjs](../missionproperties/scripts/migrate-projects.mjs))
that reads the old static arrays, uploads each local image to `project-media` under
`{client_id}/{slug}/`, and upserts one `projects` row per item with the right `status`.

Run it with a **temporary** env file holding the service-role key, then delete that file:

```bash
node --env-file=.env.migrate scripts/migrate-projects.mjs
rm .env.migrate
```

This seeds the client's portal with everything already on their site, so they start from
their real content rather than a blank slate.

### 5. Set env vars on the client's Vercel project

```bash
vercel env add SUPABASE_URL production --value "https://vfjrqzdkctkhadcmyfpi.supabase.co" --yes
vercel env add SUPABASE_ANON_KEY production --value "<publishable key>" --yes
vercel env add <SITE>_CLIENT_ID production --value "<client id>" --yes
vercel --prod
```

**This is the step that's easy to forget** — the build will fail without it, and the portal
page will 500 if the *portal's* own env vars are missing too.

---

## Env vars, by repo

**website-portfolio** (the portal) — needs write access, so it holds the secret key:

```
SUPABASE_URL=https://vfjrqzdkctkhadcmyfpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret — server-only, never NEXT_PUBLIC_>
SESSION_SECRET=<random 32+ bytes>

# Studio (developer only) — see "Studio (developer only)"
GITHUB_CLIENT_ID=<OAuth app client id>
GITHUB_CLIENT_SECRET=<OAuth app client secret — server-only>
STUDIO_GITHUB_USER_ID=<your numeric GitHub user id>
STUDIO_GITHUB_TOKEN=<fine-grained token: site repos only, Contents read/write — server-only>
```

**Client's site** — read-only, so the publishable key is fine (the `projects` table has a
public-read RLS policy and no write policy):

```
SUPABASE_URL=https://vfjrqzdkctkhadcmyfpi.supabase.co
SUPABASE_ANON_KEY=<publishable key>
<SITE>_CLIENT_ID=<uuid from step 1>
```

Set these in **both** `.env.local` *and* the Vercel project settings. Vercel does not read
`.env.local`.

---

## The client's workflow, once set up

1. Log into `/portal` with their domain + password.
2. **Projects** tab — add/edit projects, upload photos, and set each project's stage
   (In the Pipeline / Under Construction / Completed) from the segmented control. Hovering
   a photo shows a star button to set it as the key image (used as the project's
   thumbnail/cover photo); the current key image is marked with a purple ring and a
   "Key image" badge. Saves to Supabase immediately.
3. **Publish** — triggers a rebuild of their site; changes go live in a few minutes.
4. **Files** tab — drop arbitrary files for you (private, not shown on their site).
5. **Site Content** tab (where enabled) — pick a page, edit, **Save**. For TideLine that's
   it (live within a couple of minutes); a site without `liveOnSave` also needs **Publish**.
   Save sits at the top and bottom of each page. Unsaved pages are marked with a dot, and
   leaving with unsaved changes asks first — closing the tab, the site nav, or Log out.
   Switching portal tabs keeps them.

No git, no involvement from you.

## Notes

- The client's old static data files and `public/images/` are left in the repo after
  migration, unused. They're a safety net — deleting them is optional cleanup.
- Because the sites are statically built, edits are **not** live until Publish is clicked.
  If a client expects instant updates, switch their pages to dynamic rendering instead.
- Every part of this is generic — nothing is special-cased to Mission Properties. A second
  site with a different content shape would need its own table (or extra columns), but the
  auth, storage, and publish plumbing all carry over as-is.
- The `team_members` table/tab is the first example of this: a content shape (bios + a single
  headshot per row) that doesn't fit the `projects` table, so it got its own table, its own
  public storage bucket (`team-media`), its own server actions
  ([lib/portal/teamActions.ts](lib/portal/teamActions.ts)), and its own panel
  ([components/portal/TeamPanel.tsx](components/portal/TeamPanel.tsx)) — copy this pattern for
  the next new content shape rather than copying `projects`.
