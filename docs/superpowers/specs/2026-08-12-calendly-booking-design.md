# Calendly booking in the Contact section

**Date:** 2026-08-12
**Status:** Approved, ready for implementation plan

## Problem

The Contact section's multi-step form ([Contact.tsx](../../../components/sections/Contact.tsx)) has no real submission — `handleSubmit` sets `submitted = true` and stops, with a literal `// Actual form submission would go here` TODO. Separately, there is no way for a visitor to book a call directly; the only path to a conversation is that form, or the mailto link. This spec covers adding real call scheduling via an embedded Calendly widget. Wiring up the message form's own submission is explicitly out of scope (see below) — it stays a no-op and gets its own spec later.

## Goal

Let a visitor book a call with Colin directly from the Contact section, without leaving the page, using Calendly to handle availability, timezones, confirmation emails, reminders, and calendar sync.

## Decisions

1. **Scheduling tool:** Calendly (over Cal.com) — most widely recognized by visitors, free tier is sufficient. Account setup (creating the Calendly account, configuring the event type and availability) is a manual step the site owner does outside this codebase; this spec only covers the embed.
2. **Placement:** alongside the existing form, not replacing it. The Contact card gets a two-way tab switcher — **Send a message** / **Book a call** — at the top. Only one is visible at a time.
3. **Embed style:** inline calendar (not a popup modal), so the visitor never leaves the page or loses the surrounding page context.
4. **Integration method:** Calendly's official embed script (`next/script` + `<div class="calendly-inline-widget">`), not the `react-calendly` npm package. Zero new dependencies, and it stays current with Calendly's own updates rather than a third-party wrapper's release cadence.
5. **Lazy load:** the Calendly script only loads the first time the visitor selects the "Book a call" tab, not on initial page load — visitors who never click it don't pay for Calendly's JS.
6. **No backend involvement:** bookings, reminders, reschedules, and cancellations are entirely Calendly's problem. Nothing round-trips through this site or Supabase. A Supabase record of bookings is explicitly deferred (see below).

## Component design

### `components/sections/CalendlyWidget.tsx` (new)

- `"use client"`.
- Props: none — reads the event URL from `process.env.NEXT_PUBLIC_CALENDLY_URL`.
- Renders `next/script` with `src="https://assets.calendly.com/assets/external/widget.js"` and `strategy="lazyOnload"`, mounted only when the component itself mounts (i.e., only when the parent renders it, which only happens once the "Book a call" tab is selected — see below).
- Renders `<div class="calendly-inline-widget" data-url={widgetUrl} style={{ minWidth: "320px", height: "700px" }} />`, matching Calendly's documented inline embed markup.
- `widgetUrl` is `NEXT_PUBLIC_CALENDLY_URL` with query params appended for theming: `background_color`, `text_color`, `primary_color` (hex, no `#`) tuned to the site's dark amber theme, and `hide_gdpr_banner=1`. Matching the widget precisely to light mode too is a stretch goal, not in this pass.
- While the script is loading, render a skeleton/pulse placeholder at the same `700px` height so the card doesn't jump when the iframe mounts.
- If `NEXT_PUBLIC_CALENDLY_URL` is unset or empty, skip the script entirely and render a plain fallback: "Booking is temporarily unavailable — email us instead," linking to the existing mailto address. This is the realistic failure mode (a preview/staging deploy without the env var configured), not a hypothetical.

### `components/sections/Contact.tsx`

- Add `const [mode, setMode] = useState<"message" | "book">("message")`.
- Add a small tab switcher above the step indicators, styled with the same amber active/inactive treatment already used elsewhere in this card (compare the existing step-indicator circles).
- When `mode === "book"`, render `<CalendlyWidget />` in place of the step indicators + form + nav buttons. The `submitted` confirmation state only applies to the message-form path.
- Left column copy (headline, the three checkmark bullets, the mailto fallback) is unchanged — it reads fine for either path.

### Env var

- `NEXT_PUBLIC_CALENDLY_URL` — the full Calendly event URL, e.g. `https://calendly.com/<username>/<event-type>`. Must be `NEXT_PUBLIC_`-prefixed since it's read client-side (this repo currently has no `NEXT_PUBLIC_` vars — its existing `.env.local` entries are all server-only — so this is the first of its kind here). Added to `.env.local` and to the Vercel project's env vars for all environments.

## Data flow

```
visitor clicks "Book a call" tab
  -> CalendlyWidget mounts
  -> next/script loads widget.js (lazyOnload)
  -> Calendly iframe mounts, calls Calendly's API directly
  -> visitor picks a time, books
  -> Calendly sends confirmation/reminder emails and calendar invites itself
```

Nothing in this flow touches this repo's server or Supabase.

## Error handling

- Missing/empty `NEXT_PUBLIC_CALENDLY_URL` → static fallback message + mailto link, not a broken empty box.
- Script load failure (network issue, ad blocker) → the skeleton placeholder simply never resolves to the iframe. Given Calendly's own reliability and that this is a non-critical enhancement alongside a working mailto fallback in the left column, no additional retry/error UI is built for this pass.
- Without JavaScript, the tab switcher and widget don't function; the message form (if selected by default) still works as it does today. Calendly's embed itself has no non-JS fallback, which is an accepted limitation of embedding a third-party widget.

## Testing

No test harness in this repo; verification is manual:

1. `npm run build` — typecheck passes.
2. Run dev server, confirm "Send a message" is the default tab and behaves exactly as today.
3. Click "Book a call," confirm the skeleton appears then the Calendly calendar loads.
4. Complete one real test booking end-to-end on the configured Calendly account; confirm a confirmation email arrives.
5. Unset `NEXT_PUBLIC_CALENDLY_URL` locally and confirm the fallback message renders instead of a broken widget.
6. Check mobile width (the embed's `minWidth: 320px` should not overflow the card on small screens).

## Out of scope (deferred, each gets its own spec)

- Wiring up the message form's actual submission (the pre-existing TODO).
- Any Supabase record of bookings, or a webhook from Calendly back into this site.
- Exact light-mode theming of the Calendly widget.
- The payments system (separate subsystem, separate spec).
