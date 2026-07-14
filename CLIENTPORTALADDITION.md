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

### Shared schema (already exists — don't recreate)

| Object | Purpose |
|---|---|
| `clients` | `id`, `domain` (login), `password_hash`, `name`, `deploy_hook_url` |
| `projects` | Per-client content rows. `status` is `'current'` or `'completed'` — flipping it moves the project between the two sections of the client's site. |
| `client-files` bucket | **Private.** Arbitrary file drop (Files tab). Served via signed URLs. |
| `project-media` bucket | **Public.** Project photos — must be publicly readable so they render on the client's live site. |

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
2. **Projects** tab — add/edit projects, upload photos, toggle Current ↔ Completed. Saves to
   Supabase immediately.
3. **Publish** — triggers a rebuild of their site; changes go live in a few minutes.
4. **Files** tab — drop arbitrary files for you (private, not shown on their site).

No git, no involvement from you.

## Notes

- The client's old static data files and `public/images/` are left in the repo after
  migration, unused. They're a safety net — deleting them is optional cleanup.
- Because the sites are statically built, edits are **not** live until Publish is clicked.
  If a client expects instant updates, switch their pages to dynamic rendering instead.
- Every part of this is generic — nothing is special-cased to Mission Properties. A second
  site with a different content shape would need its own table (or extra columns), but the
  auth, storage, and publish plumbing all carry over as-is.
