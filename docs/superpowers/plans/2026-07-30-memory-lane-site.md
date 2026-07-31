# Memory Lane Comics — Implementation Plan (Site Phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `mlcshop.com` read its crew, per-member picks, weekly video, and pics of the week from Supabase, so the portal edits built in the portal phase actually appear on the live site.

**Architecture:** A read-only Supabase client using the publishable key. Four data modules map DB rows onto the site's existing prop shapes, so page components change as little as possible. The seven picks routes keep their URLs and become thin wrappers over one shared component.

**Tech Stack:** Next **14.2.5** / React 18 (App Router) — *not* the portal's Next 16. Tailwind, existing `Container`/`Section`/`Heading`/`Button` primitives.

Spec: [2026-07-30-memory-lane-portal-design.md](../specs/2026-07-30-memory-lane-portal-design.md) (§ Site wiring)
Prerequisite: [2026-07-30-memory-lane-portal.md](2026-07-30-memory-lane-portal.md) — portal phase, complete.

## Global Constraints

- **Repo is `/Users/colinegan/Desktop/Claude/GitHub/memory-lane-comics`**, Next 14.2.5 / React 18. Read `node_modules/next/dist/docs/` there before writing code. Do not copy patterns from the portal repo — it is Next 16 / React 19.
- **Publishable/anon key only.** The service-role key must never appear in this repo.
- Memory Lane client id: `da08188d-b6de-4864-a5c5-7587101c64a8`. Supabase ref `vfjrqzdkctkhadcmyfpi`.
- **Preserve all seven existing picks URLs**, including the `/jakespics` vs `/benspicks` spelling inconsistency. `picks_url` in the database points at them.
- The site is statically built — edits are not live until Publish is clicked.
- Existing static arrays and `public/images/` stay in the repo, unused, as a safety net.
- Commit after every task.

## Resolved: the picks hero image

`/acespicks` renders a `PicksHero` using `IMAGES.acesHero` — a lifestyle photo distinct from the
pick covers — and the portal has no field for it.

**Decision: reuse the member's crew photo** (`team_members.photo`). No schema change, and the
portal already manages that image. Rejected: adding a `hero_image` column (reopens the finished
portal phase) and dropping the hero (loses the visual identity those pages have).

Consequence to expect: the crew photos are portrait headshots, so they will crop tighter in the
hero slot than the current wide shot of Ace. If that looks bad in practice, the fix is a
`hero_image` column, not a CSS workaround.

---

### Task 1: Read-only Supabase client

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/lib/supabase.ts`
- Modify: `.env.local`

**Interfaces:**
- Produces: `supabase` (read-only client), `CLIENT_ID: string`

- [ ] **Step 1: Install the client**

```bash
cd /Users/colinegan/Desktop/Claude/GitHub/memory-lane-comics
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create `src/lib/supabase.ts`**

Throws on missing env vars so a misconfigured build fails loudly rather than publishing an empty site.

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !anonKey) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')

export const supabase = createClient(url, anonKey)

export const CLIENT_ID = process.env.MLC_CLIENT_ID
if (!CLIENT_ID) throw new Error('Missing MLC_CLIENT_ID')
```

- [ ] **Step 3: Add env vars to `.env.local`**

```
SUPABASE_URL=https://vfjrqzdkctkhadcmyfpi.supabase.co
SUPABASE_ANON_KEY=<publishable key from the Supabase dashboard>
MLC_CLIENT_ID=da08188d-b6de-4864-a5c5-7587101c64a8
```

Confirm `.env.local` is gitignored before committing.

- [ ] **Step 4: Verify the key is read-only**

```bash
node --env-file=.env.local -e "
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY);
s.from('weekly_pics').insert({client_id:process.env.MLC_CLIENT_ID,image:'x',title:'x'})
 .then(({error})=>console.log('write blocked:', Boolean(error), error?.message));
"
```

Expected: `write blocked: true`. If a write succeeds, the tables are missing their no-write policy — stop and fix that before going further.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/supabase.ts
git commit -m "Add a read-only Supabase client"
```

---

### Task 2: Data modules

**Files:**
- Create: `src/lib/crew.ts`, `src/lib/picks.ts`, `src/lib/weekly.ts`, `src/lib/videoEmbed.ts`

**Interfaces:**
- Consumes: `supabase`, `CLIENT_ID`
- Produces:
  - `getCrew(): Promise<CrewMember[]>` where `CrewMember = { name, title, bio, picksUrl?, imageUrl?, imagePosition, location }` — the existing `CrewCard` prop shape
  - `getPicks(slug: string): Promise<{ member: CrewMember & { slug: string } | null; picks: { imageUrl: string; alt: string; title: string; href: string }[] }>`
  - `getWeeklyPics(): Promise<{ image: string; title: string; caption: string | null; href: string }[]>`
  - `getWeeklyVideoUrl(): Promise<string | null>`
  - `classifyVideoUrl(url: string | null): { kind: 'none' } | { kind: 'instagram'; url: string } | { kind: 'link'; url: string }`

- [ ] **Step 1: Write `src/lib/crew.ts`**

`shop_location` → brand colour mapping lives here, which is why the database stores semantics instead of `green`/`purple`.

```ts
import { supabase, CLIENT_ID } from '@/lib/supabase'

export type CrewMember = {
  slug: string
  name: string
  title: string
  bio: string
  picksUrl?: string
  imageUrl?: string
  imagePosition: 'top' | 'center'
  location: 'green' | 'purple'
}

const LOCATION_COLOR = { original: 'green', part_two: 'purple' } as const

type Row = {
  slug: string
  name: string
  title: string | null
  photo: string | null
  bio: string[] | null
  picks_url: string | null
  shop_location: 'original' | 'part_two' | null
  image_position: 'top' | 'center' | null
  sort_order: number
}

export function toCrewMember(row: Row): CrewMember {
  return {
    slug: row.slug,
    name: row.name,
    title: row.title ?? '',
    // The crew variant stores a single paragraph as a one-element array.
    bio: (row.bio ?? []).join(' '),
    picksUrl: row.picks_url ?? undefined,
    imageUrl: row.photo ?? undefined,
    imagePosition: row.image_position ?? 'center',
    location: row.shop_location ? LOCATION_COLOR[row.shop_location] : 'green',
  }
}

export async function getCrew(): Promise<CrewMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('slug, name, title, photo, bio, picks_url, shop_location, image_position, sort_order')
    .eq('client_id', CLIENT_ID)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to load crew: ${error.message}`)
  return (data as Row[]).map(toCrewMember)
}
```

- [ ] **Step 2: Write `src/lib/picks.ts`**

```ts
import { supabase, CLIENT_ID } from '@/lib/supabase'
import { toCrewMember, type CrewMember } from '@/lib/crew'
import { EXTERNAL_URLS } from '@/lib/tokens'

export type Pick = { imageUrl: string; alt: string; title: string; href: string }

export async function getPicks(
  slug: string
): Promise<{ member: CrewMember | null; picks: Pick[] }> {
  const { data: memberRow } = await supabase
    .from('team_members')
    .select('id, slug, name, title, photo, bio, picks_url, shop_location, image_position, sort_order')
    .eq('client_id', CLIENT_ID)
    .eq('slug', slug)
    .maybeSingle()

  if (!memberRow) return { member: null, picks: [] }

  const { data: pickRows } = await supabase
    .from('team_picks')
    .select('image, title, link_url, sort_order')
    .eq('client_id', CLIENT_ID)
    .eq('team_member_id', memberRow.id)
    .order('sort_order', { ascending: true })

  const member = toCrewMember(memberRow)

  return {
    member,
    picks: (pickRows ?? []).map((p) => ({
      imageUrl: p.image,
      // Alt text is derived, never hand-entered — this is why title is required.
      alt: `${p.title} — pick by ${member.name}`,
      title: p.title,
      // Per-item shop link when the crew set one, else the general storefront.
      href: p.link_url ?? EXTERNAL_URLS.comichub,
    })),
  }
}
```

- [ ] **Step 3: Write `src/lib/weekly.ts`**

```ts
import { supabase, CLIENT_ID } from '@/lib/supabase'
import { EXTERNAL_URLS } from '@/lib/tokens'

export type WeeklyPic = {
  image: string
  title: string
  caption: string | null
  alt: string
  href: string
}

export async function getWeeklyPics(): Promise<WeeklyPic[]> {
  const { data } = await supabase
    .from('weekly_pics')
    .select('image, title, caption, link_url, sort_order')
    .eq('client_id', CLIENT_ID)
    .order('sort_order', { ascending: true })

  return (data ?? []).map((p) => ({
    image: p.image,
    title: p.title,
    caption: p.caption,
    alt: `${p.title} — new this week at Memory Lane Comics`,
    href: p.link_url ?? EXTERNAL_URLS.comichub,
  }))
}

export async function getWeeklyVideoUrl(): Promise<string | null> {
  const { data } = await supabase
    .from('client_settings')
    .select('value')
    .eq('client_id', CLIENT_ID)
    .eq('key', 'weekly_video_url')
    .maybeSingle()

  return data?.value ?? null
}
```

- [ ] **Step 4: Write `src/lib/videoEmbed.ts`**

Classification happens at render time, not save time. The portal accepts any http(s) URL; only Instagram becomes a real embed, so an arbitrary URL never reaches an iframe.

```ts
export type VideoEmbed =
  | { kind: 'none' }
  | { kind: 'instagram'; url: string }
  | { kind: 'link'; url: string }

export function classifyVideoUrl(url: string | null): VideoEmbed {
  if (!url) return { kind: 'none' }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { kind: 'none' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { kind: 'none' }

  const host = parsed.hostname.replace(/^www\./, '')
  if (host === 'instagram.com') return { kind: 'instagram', url }

  return { kind: 'link', url }
}
```

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/lib/crew.ts src/lib/picks.ts src/lib/weekly.ts src/lib/videoEmbed.ts
git commit -m "Add Supabase-backed data modules for crew, picks, and weekly content"
```

---

### Task 3: Crew page reads from Supabase

**Files:**
- Modify: `src/app/the-crew/page.tsx`, `next.config.js`

- [ ] **Step 1: Allow Supabase images**

Add to `next.config.js` `images.remotePatterns`:

```js
      {
        protocol: 'https',
        hostname: 'vfjrqzdkctkhadcmyfpi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
```

- [ ] **Step 2: Rewrite the page**

Delete the hardcoded `crew` array (lines 13-66) and make the component async:

```tsx
import { getCrew } from '@/lib/crew'

export default async function TheCrewPage() {
  const crew = await getCrew()
```

The JSX below is unchanged — `CrewCard` already takes exactly these props. Add an empty-state guard so a crew-less build doesn't render a bare grid:

```tsx
          {crew.length === 0 ? (
            <p className="text-center font-body text-brand-grey">
              Crew bios are on their way — stop by either shop and meet them in person.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {crew.map((member) => (
                <CrewCard key={member.slug} {...member} />
              ))}
            </div>
          )}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build
```

Expected: builds clean. `/the-crew` will be empty until Task 6 migrates content — that is correct at this stage.

```bash
git add src/app/the-crew/page.tsx next.config.js
git commit -m "Read the crew from Supabase"
```

---

### Task 4: Shared picks page

**Files:**
- Create: `src/components/PicksPage.tsx`
- Modify: all seven of `src/app/{acespicks,jakespics,benspicks,petapicks,seanspicks,tylerspicks,ericspicks}/page.tsx`

- [ ] **Step 0: Make `ProductGrid` honour per-item links**

`src/components/ProductGrid.tsx:20` hardcodes every card to `EXTERNAL_URLS.comichub`, so
without this change the per-item ComicHub links stored in `team_picks.link_url` are ignored.

Add `href` to the `Product` type and use it, falling back to the storefront:

```tsx
type Product = {
  imageUrl: string
  alt: string
  title?: string
  href?: string
}
```

then in the map, replace `href={EXTERNAL_URLS.comichub}` with:

```tsx
          href={product.href ?? EXTERNAL_URLS.comichub}
```

The `aria-label` already reads "Shop {title} on ComicHub", which stays accurate.

- [ ] **Step 1: Write `src/components/PicksPage.tsx`**

One component, two states, keyed on whether the member has picks — reproducing both existing layouts. A dynamic `[slug]` route is deliberately avoided: a top-level catch-all would swallow every unmatched path on the site.

```tsx
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { PicksHero } from '@/components/PicksHero'
import { ProductGrid } from '@/components/ProductGrid'
import { getPicks } from '@/lib/picks'

export async function PicksPage({ slug }: { slug: string }) {
  const { member, picks } = await getPicks(slug)
  const name = member?.name ?? 'The Crew'

  if (!member || picks.length === 0) {
    return (
      <Section bg="off-white">
        <Container size="md">
          <div className="text-center py-12">
            <Heading level={1} size="2xl" className="text-brand-black mb-4">
              {name}&apos;s Picks
            </Heading>
            <div className="bg-white border-2 border-brand-black rounded-comic shadow-card p-8 mb-8">
              <p className="font-display tracking-comic text-brand-green text-xl mb-3">
                Coming Soon!
              </p>
              <p className="font-body text-brand-grey mb-4">
                {member?.bio ?? `Ask ${name} what's good in person.`}
              </p>
              <Button href="/the-crew" variant="secondary">
                Meet the Crew
              </Button>
            </div>
            <Link
              href="/"
              className="text-sm font-body text-brand-green underline hover:text-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded-comic"
            >
              &larr; Back to Home
            </Link>
          </div>
        </Container>
      </Section>
    )
  }

  return (
    <>
      {member.imageUrl && (
        <PicksHero name={member.name} imageUrl={member.imageUrl} imageAlt={`${member.name} at Memory Lane Comics`} />
      )}
      <Section bg="off-white">
        <Container size="md">
          {member.bio && (
            <div className="mb-8">
              <p className="font-body text-brand-grey text-lg">{member.bio}</p>
            </div>
          )}
          <ProductGrid products={picks} />
          <p className="text-sm font-body text-brand-grey mt-6 text-center">
            Want the context? Come talk to {member.name}.{' '}
            <Link href="/the-crew" className="text-brand-green underline hover:text-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded-comic">
              Meet the crew.
            </Link>
          </p>
        </Container>
      </Section>
    </>
  )
}
```

Note: `PicksHero` is guarded on `imageUrl` because a crew member without a photo would otherwise pass an empty `src` to `next/image` and crash the build.

- [ ] **Step 2: Replace each of the seven routes**

Each becomes a thin wrapper. `acespicks` (slug `ace`):

```tsx
import type { Metadata } from 'next'
import { PicksPage } from '@/components/PicksPage'
import { getPicks } from '@/lib/picks'

export async function generateMetadata(): Promise<Metadata> {
  const { member } = await getPicks('ace')
  const name = member?.name ?? 'Crew'
  return {
    title: `${name}'s Picks`,
    description: `${name}'s hand-picked comic book recommendations from Memory Lane Comics.`,
  }
}

export default function AcesPicksPage() {
  return <PicksPage slug="ace" />
}
```

Repeat for the other six, changing only the slug, the function name, and the metadata slug:

| Route | Slug | Component name |
|---|---|---|
| `src/app/jakespics/page.tsx` | `jake` | `JakesPicksPage` |
| `src/app/benspicks/page.tsx` | `ben` | `BensPicksPage` |
| `src/app/petapicks/page.tsx` | `jose` | `JosesPicksPage` |
| `src/app/seanspicks/page.tsx` | `sean` | `SeansPicksPage` |
| `src/app/ericspicks/page.tsx` | `eric` | `EricsPicksPage` |
| `src/app/tylerspicks/page.tsx` | `tyler` | `TylersPicksPage` |

Slugs must match what `slugify(name)` produced in the portal — lowercase, non-alphanumerics collapsed to hyphens. Confirm against the database after Task 6 and fix any mismatch there, not by renaming routes.

`/tylerspicks` has no crew member and will render Coming Soon indefinitely. That is the existing behaviour; deleting the route is out of scope.

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/components/PicksPage.tsx src/app/*picks/page.tsx src/app/*pics/page.tsx
git commit -m "Serve all seven picks pages from one Supabase-backed component"
```

---

### Task 5: Homepage — weekly video and pics

**Files:**
- Create: `src/components/WeeklyPics.tsx`
- Modify: `src/app/page.tsx:92-133` (the New This Week section)

- [ ] **Step 1: Write `src/components/WeeklyPics.tsx`**

```tsx
import Image from 'next/image'
import type { WeeklyPic } from '@/lib/weekly'

export function WeeklyPics({ pics }: { pics: WeeklyPic[] }) {
  if (pics.length === 0) return null

  return (
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10">
      {pics.map((pic) => (
        <li
          key={pic.image}
          className="border-2 border-brand-black rounded-comic overflow-hidden bg-white shadow-card"
        >
          <a
            href={pic.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            aria-label={`Shop ${pic.title} at Memory Lane Comics`}
          >
            <div className="relative aspect-[2/3] bg-brand-off-white">
              <Image
                src={pic.image}
                alt={pic.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="p-2">
              <p className="font-display tracking-comic text-brand-black text-xs uppercase truncate">
                {pic.title}
              </p>
              {pic.caption && (
                <p className="font-body text-brand-grey text-xs truncate">{pic.caption}</p>
              )}
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Make the homepage async and load both**

```tsx
import { getWeeklyPics, getWeeklyVideoUrl } from '@/lib/weekly'
import { classifyVideoUrl } from '@/lib/videoEmbed'
import { WeeklyPics } from '@/components/WeeklyPics'

export default async function HomePage() {
  const [weeklyPics, videoUrl] = await Promise.all([getWeeklyPics(), getWeeklyVideoUrl()])
  const video = classifyVideoUrl(videoUrl)
```

- [ ] **Step 3: Replace the hardcoded embed**

Swap the `<InstagramEmbed permalink={NEW_THIS_WEEK_REEL_URL} ... />` block (`src/app/page.tsx:108-110`) for:

```tsx
            {video.kind === 'instagram' && (
              <div className="mx-auto w-full max-w-[540px]">
                <InstagramEmbed permalink={video.url} fallbackLabel="View this Reel on Instagram" />
              </div>
            )}

            {video.kind === 'link' && (
              <div className="text-center">
                <Button href={video.url} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">
                  Watch this week&apos;s video
                </Button>
              </div>
            )}

            <WeeklyPics pics={weeklyPics} />
```

Remove `NEW_THIS_WEEK_REEL_URL` from the `@/lib/tokens` import. Leave the constant defined in `tokens.ts` as a fallback record.

**The section keeps its heading and both CTAs when video and pics are both empty** — the Shop New Releases button and the Instagram follow link live here, and an empty content week must not remove them from the homepage.

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add src/components/WeeklyPics.tsx src/app/page.tsx
git commit -m "Serve the weekly video and pics of the week from Supabase"
```

---

### Task 6: Migrate existing content

**Files:**
- Create: `scripts/migrate-mlc.mjs`

- [ ] **Step 1: Write the migration script**

Runs with the service-role key, which bypasses RLS — so it asserts the client id and refuses to touch anything else.

```js
// Usage: node --env-file=.env.migrate scripts/migrate-mlc.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const MLC = 'da08188d-b6de-4864-a5c5-7587101c64a8'
if (process.env.MLC_CLIENT_ID !== MLC) {
  console.error('Refusing to run: MLC_CLIENT_ID does not match Memory Lane Comics.')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const crew = [
  { slug: 'jake', name: 'Jake', title: 'Co-Owner', bio: 'Part time Reed Richards impersonator and Proud co-owner of MLC; Enjoys games and sports, music, reading comics, SELLING comics', picks_url: '/jakespics', photo: 'public/crew/jake.jpg', image_position: 'center', shop_location: 'original' },
  { slug: 'ben', name: 'Ben', title: 'Co-Owner', bio: "Ben is a lover and a fighter, which comes first you ask? I don't know. Ask him. Co-Owns with his obviously cooler & smarter older brother", picks_url: '/benspicks', photo: 'public/crew/ben.jpg', image_position: 'center', shop_location: 'original' },
  { slug: 'eric', name: 'Eric', title: 'Part II Manager', bio: "Running the show at Part II — ask Eric anything about the store and he'll have the answer. Probably.", picks_url: null, photo: 'public/crew/eric.jpg', image_position: 'top', shop_location: 'part_two' },
  { slug: 'ace', name: 'Ace', title: 'Crew Member', bio: 'The tenacious ace is ready to hit you with hit recommendation after hit recommendation', picks_url: '/acespicks', photo: 'public/crew/ace.jpg', image_position: 'top', shop_location: 'original' },
  { slug: 'jose', name: 'Jose', title: 'Part II Crew', bio: "Jose's positivity will make you believe that a guy like superman can actually exist. You. Will. Believe.", picks_url: '/petapicks', photo: 'public/crew/jose.jpg', image_position: 'center', shop_location: 'part_two' },
  { slug: 'sean', name: 'Sean', title: 'Part II Crew', bio: "Sean is the keeper of things that are rad...he'll make your shelf cooler...Mastered being a good dude. Mastered it, we say!", picks_url: null, photo: 'public/crew/sean.jpg', image_position: 'top', shop_location: 'part_two' },
]

async function uploadImage(bucket, path, localPath, contentType = 'image/jpeg') {
  const body = readFileSync(localPath)
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true })
  if (error) throw new Error(`Upload ${localPath} failed: ${error.message}`)
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

for (const [i, m] of crew.entries()) {
  const photoUrl = await uploadImage('team-media', `${MLC}/${m.slug}/${m.slug}.jpg`, m.photo)

  const { data, error } = await supabase
    .from('team_members')
    .upsert(
      {
        client_id: MLC,
        slug: m.slug,
        name: m.name,
        title: m.title,
        bio: [m.bio],
        picks_url: m.picks_url,
        shop_location: m.shop_location,
        image_position: m.image_position,
        sort_order: i,
        photo: photoUrl,
      },
      { onConflict: 'client_id,slug' }
    )
    .select('id')
    .single()

  if (error) throw new Error(`Upsert ${m.slug} failed: ${error.message}`)
  console.log(`crew: ${m.name} -> ${data.id}`)
}
```

Picks for Jake, Ben, and Ace come from the `IMAGES` tokens in `src/lib/tokens.ts` — those are **remote Wix URLs**, not local files, so fetch each and upload the bytes rather than reading from disk. Add after the crew loop:

```js
const picks = {
  jake: ['jakesProduct1', 'jakesProduct2'],
  ben: ['bensProduct1', 'bensProduct2'],
  ace: ['acesProduct1', 'acesProduct2'],
}

const { IMAGES } = await import('../src/lib/tokens.ts').catch(() => ({ IMAGES: null }))
if (!IMAGES) {
  console.error('Read the IMAGES token URLs out of src/lib/tokens.ts by hand — it is TypeScript and cannot be imported from a .mjs script.')
  process.exit(1)
}
```

**Note:** `tokens.ts` cannot be imported from a `.mjs` script. Copy the six product URLs into a literal object in the script before running it. Do not skip this — it is the step that makes Jake's, Ben's, and Ace's pages non-empty.

- [ ] **Step 2: Run it with a temporary env file**

```bash
cat > .env.migrate <<'EOF'
SUPABASE_URL=https://vfjrqzdkctkhadcmyfpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
MLC_CLIENT_ID=da08188d-b6de-4864-a5c5-7587101c64a8
EOF

node --env-file=.env.migrate scripts/migrate-mlc.mjs
rm .env.migrate
```

Confirm `.env.migrate` is deleted.

- [ ] **Step 3: Verify slugs match the routes**

```sql
select slug, name, picks_url from public.team_members
where client_id = 'da08188d-b6de-4864-a5c5-7587101c64a8' order by sort_order;
```

Every `slug` must match the slug passed to `PicksPage` in Task 4.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-mlc.mjs
git commit -m "Add the one-off content migration for the existing crew and picks"
```

---

### Task 7: Deploy hook, env vars, and go live

- [ ] **Step 1: Create the deploy hook**

```bash
cd /Users/colinegan/Desktop/Claude/GitHub/memory-lane-comics
vercel deploy-hooks create publish-from-portal --ref main
```

- [ ] **Step 2: Store it so the Publish button appears**

```sql
update public.clients
set deploy_hook_url = '<hook url>'
where domain = 'mlcshop.com';
```

**Also add `projects` to their features** — no. The Publish button lives in `ProjectsPanel`, which Memory Lane does not have. **Publishing needs a home in their portal:** either move the Publish button out of `ProjectsPanel` into the tab bar for any client with a `deploy_hook_url`, or add it to `NewThisWeekPanel`. This is a real gap in the portal phase; resolve it before telling the client their edits go live.

- [ ] **Step 3: Set Vercel env vars**

```bash
vercel env add SUPABASE_URL production --value "https://vfjrqzdkctkhadcmyfpi.supabase.co" --yes
vercel env add SUPABASE_ANON_KEY production --value "<publishable key>" --yes
vercel env add MLC_CLIENT_ID production --value "da08188d-b6de-4864-a5c5-7587101c64a8" --yes
vercel --prod
```

The build fails without these — this is the step most often forgotten.

- [ ] **Step 4: Verify the live site**

1. `/the-crew` shows all six with photos, titles, and correct shop colours.
2. `/acespicks`, `/jakespics`, `/benspicks` show two comics each with titles.
3. `/petapicks`, `/seanspicks`, `/ericspicks`, `/tylerspicks` show Coming Soon.
4. The homepage New This Week section shows the reel.
5. Edit something in the portal, click Publish, confirm it appears within a few minutes.

---

## Out of scope

- A `hero_image` field for picks pages (see the open decision above).
- Deleting the orphaned `/tylerspicks` route or the now-unused static arrays and `public/images/`.
- Any change to Mission Properties.
