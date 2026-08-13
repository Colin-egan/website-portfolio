# Calendly Booking Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Book a call" tab to the Contact section that embeds a live Calendly scheduler, alongside the existing (unchanged) message form.

**Architecture:** A new client component, `CalendlyWidget`, lazy-loads Calendly's own embed script and renders their documented inline-widget markup. `Contact.tsx` gains a two-way tab switcher (`"message" | "book"`) that swaps between the existing form and this new component. No backend, no Supabase, no new npm dependency.

**Tech Stack:** Next.js `next/script`, React `useState`, Tailwind v4 utility classes (existing design tokens only).

## Global Constraints

- No new npm dependency — use Calendly's official embed script via `next/script`, not `react-calendly`. (Spec decision 4.)
- Env var name is exactly `NEXT_PUBLIC_CALENDLY_URL`. (Spec: Env var section.)
- Script loads only when the "Book a call" tab is first rendered, via `strategy="lazyOnload"` — not on initial page load. (Spec decision 5.)
- Widget container: `height: "700px"`, `minWidth: "320px"`, per Calendly's documented inline embed markup. (Spec: Component design.)
- Missing/empty env var → static fallback message + existing mailto link (`colinthomasegan5@gmail.com`), never a broken empty box. (Spec: Error handling.)
- Tab labels are exactly "Send a message" and "Book a call". (Spec: Component design.)
- This repo has no test harness — verification throughout is manual (`npm run build` + browser check), matching the existing spec's Testing section and this repo's established precedent (no Jest/Playwright config present).
- Out of scope, do not touch: the message form's submit handler, any Supabase booking record, light-mode-exact widget theming, payments. (Spec: Out of scope.)

---

### Task 1: Calendly booking embed

**Files:**
- Create: `components/sections/CalendlyWidget.tsx`
- Modify: `components/sections/Contact.tsx`
- Modify: `README.md` (Environment Variables section)
- Modify (local only, not committed — already gitignored via `.env*`): `.env.local`

**Interfaces:**
- Produces: `CalendlyWidget` — a default-export-free named component, `export function CalendlyWidget(): JSX.Element`, taking no props, reading `process.env.NEXT_PUBLIC_CALENDLY_URL` internally.
- Consumes (from existing code): nothing new — `Contact.tsx` already imports `Eyebrow` from `@/components/ui/Eyebrow`; `CalendlyWidget` is imported the same way component-to-component (`./CalendlyWidget`, since both live in `components/sections/`).

- [x] **Step 1: Add the env var placeholder to `.env.local`**

Open `.env.local` and add a line (use your real Calendly event URL from the account you already created — the format is `https://calendly.com/<your-username>/<event-type>`):

```env
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username/your-event-type
```

This file is gitignored (`.env*` in `.gitignore`), so this step has no commit.

- [x] **Step 2: Create `components/sections/CalendlyWidget.tsx`**

```tsx
"use client";

import Script from "next/script";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const WIDGET_HEIGHT = "700px";

function buildWidgetUrl(baseUrl: string) {
  const params = new URLSearchParams({
    background_color: "1a1815",
    text_color: "f7f7f7",
    primary_color: "d97706",
    hide_gdpr_banner: "1",
  });
  return `${baseUrl}?${params.toString()}`;
}

export function CalendlyWidget() {
  if (!CALENDLY_URL) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm mb-3">
          Booking is temporarily unavailable.
        </p>
        <a
          href="mailto:colinthomasegan5@gmail.com"
          className="text-amber-400 hover:text-amber-300 transition-colors font-medium text-sm"
        >
          Email us instead
        </a>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minHeight: WIDGET_HEIGHT }}>
      <div className="absolute inset-0 bg-white/3 animate-pulse" aria-hidden />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
      <div
        className="calendly-inline-widget"
        data-url={buildWidgetUrl(CALENDLY_URL)}
        style={{ minWidth: "320px", height: WIDGET_HEIGHT }}
      />
    </div>
  );
}
```

Why the skeleton needs no load-state tracking: the pulsing placeholder is `absolute inset-0`, painted first; the `calendly-inline-widget` div is a normal-flow sibling painted after it in DOM order, so once Calendly's script populates that div with an iframe, the iframe paints on top and visually covers the skeleton. No `onLoad` callback or extra state needed.

- [x] **Step 3: Verify the component compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `CalendlyWidget.tsx`.

- [x] **Step 4: Import `CalendlyWidget` in `Contact.tsx`**

In `components/sections/Contact.tsx`, change the import block at the top:

```tsx
import { Eyebrow } from "@/components/ui/Eyebrow";
```

to:

```tsx
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CalendlyWidget } from "./CalendlyWidget";
```

- [x] **Step 5: Add the `mode` tab state**

In `Contact.tsx`, inside `export function Contact() {`, change:

```tsx
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
```

to:

```tsx
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"message" | "book">("message");
```

- [x] **Step 6: Add the tab switcher and route rendering by `mode`**

In `Contact.tsx`, find the card opening:

```tsx
          <div>
            <div className="bg-card border border-white/8 rounded-2xl p-8">
              {!submitted ? (
```

Replace it with:

```tsx
          <div>
            <div className="bg-card border border-white/8 rounded-2xl p-8">
              <div className="flex items-center gap-1 mb-8 p-1 rounded-xl bg-white/3 border border-white/8 w-fit">
                <button
                  onClick={() => setMode("message")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === "message"
                      ? "bg-amber-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Send a message
                </button>
                <button
                  onClick={() => setMode("book")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === "book"
                      ? "bg-amber-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Book a call
                </button>
              </div>

              {mode === "book" ? (
                <CalendlyWidget />
              ) : !submitted ? (
```

Nothing else in the file changes — the rest of the existing `!submitted ? ( ... ) : ( ... )` block (the step indicators, the four form steps, the nav buttons, and the "Message sent!" confirmation) stays exactly as it is. The new `mode === "book" ? (<CalendlyWidget />) : !submitted ? (...) : (...)` is a single valid chained ternary, so the file's existing closing `)}` two lines above `</div>` (which currently closes the `!submitted` ternary) still closes correctly — no other line needs to change.

- [x] **Step 7: Verify the component compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `Contact.tsx`.

- [x] **Step 8: Update `README.md`'s Environment Variables section**

Change:

```md
## Environment Variables

No env vars required for local development. For production form handling, add:

```env
# Optional: wire up actual form submission
RESEND_API_KEY=your_key_here
CONTACT_EMAIL=colinthomasegan5@gmail.com
```
```

to:

```md
## Environment Variables

No env vars are required for local development to run, but two optional integrations use them:

```env
# Calendly booking embed (Contact section "Book a call" tab)
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username/your-event-type

# Optional: wire up actual form submission
RESEND_API_KEY=your_key_here
CONTACT_EMAIL=colinthomasegan5@gmail.com
```

Without `NEXT_PUBLIC_CALENDLY_URL` set, the "Book a call" tab shows a fallback message with a mailto link instead of the calendar.
```

- [x] **Step 9: Full build check**

Run: `npm run build`
Expected: build completes with no type or lint errors.

- [x] **Step 10: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:3000/#contact` (or `/contact`).

Check each of these:
1. [x] "Send a message" is selected by default; the existing 4-step form behaves exactly as before (this must be unchanged).
2. [x] Click "Book a call" — a pulsing skeleton appears briefly, then the real Calendly calendar (your actual event type) loads in its place. Verified live against `https://calendly.com/eganlab`.
3. [ ] **Not done — requires your own Calendly account/inbox.** Pick a time slot and complete one real test booking; confirm a confirmation email arrives at your Calendly account's address.
4. [x] Click back to "Send a message" and back to "Book a call" again — the calendar still loads correctly on the second view. Found broken (Calendly's script only auto-scans the DOM once on load, so a container that remounts later was never initialized) and fixed by calling `Calendly.initInlineWidget()` explicitly — see `CalendlyWidget.tsx`.
5. [x] Resize the browser to a narrow mobile width (~375px) — the widget should not overflow the card horizontally. Found broken (the widget's `min-width: 320px` was propagating through the CSS Grid track, forcing the whole two-column layout wider than the viewport) and fixed with `min-w-0` on the grid item — see `Contact.tsx`.
6. [x] Temporarily comment out the `NEXT_PUBLIC_CALENDLY_URL` line in `.env.local`, restart `npm run dev`, reload, click "Book a call" — confirm the fallback message + "Email us instead" link renders instead of a broken widget. Uncomment the line and restart `npm run dev` again afterward.

- [x] **Step 11: Commit**

```bash
git add components/sections/CalendlyWidget.tsx components/sections/Contact.tsx README.md
git commit -m "$(cat <<'EOF'
Add Calendly booking tab to the Contact section

Lets visitors book a call inline without leaving the page, alongside
the existing message form. Lazy-loads Calendly's own embed script
only when the tab is selected; falls back to a mailto link if
NEXT_PUBLIC_CALENDLY_URL isn't configured.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

`.env.local` is gitignored and is not part of this commit — confirm with `git status` that only the three files above are staged.

## Post-implementation notes

- Two bugs found during Step 10 testing (remount reinit, mobile overflow) required code changes beyond this plan's original snippets — fixed and committed separately (`8a3a650`). See `CalendlyWidget.tsx` and `Contact.tsx` for the current source; the snippets in Step 2 and the container markup above are now superseded by the actual files.
- The `background_color`/`text_color` query params in `buildWidgetUrl` don't apply to a Calendly account-root URL (`calendly.com/<username>`, listing multiple event types) — Calendly only honors them on a specific event-type URL. Until `NEXT_PUBLIC_CALENDLY_URL` points at a single event type (e.g. `calendly.com/eganlab/30min`), the embed renders with Calendly's default white theme regardless of the site's dark mode. This falls under the spec's existing "light-mode-exact widget theming" deferral, not a new gap — flagged here since it's a full mismatch (not just imprecise) in dark mode.
