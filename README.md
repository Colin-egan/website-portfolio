# Egan Lab — Premium Web Design & Automation

> Websites and automation, built with care.

A production-ready marketing website for [Egan Lab](https://eganlab.com) that functions as a live portfolio — every section demonstrates a feature we can build into client projects.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion + GSAP + ScrollTrigger |
| Scroll | Lenis (smooth scroll, synced with GSAP) |
| 3D | React Three Fiber + Drei |
| Components | shadcn/ui |
| Icons | Lucide React |
| Deployment | Vercel |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Project Structure

```
app/
  layout.tsx          — Root layout, fonts, providers, navbar
  page.tsx            — Home page (all sections)
  pricing/page.tsx    — Standalone pricing page
  contact/page.tsx    — Standalone contact page
  work/
    page.tsx          — Portfolio grid
    [slug]/page.tsx   — Individual case study
  sitemap.ts          — Auto-generated sitemap
  robots.ts           — robots.txt

components/
  layout/             — Navbar, Footer
  providers/          — LenisProvider, ThemeProvider
  sections/           — Hero, Marquee, Services, FeaturesShowcase,
                        Process, Work, Pricing, Testimonials, Contact
  features/           — 14 individual bento tile components
  ui/                 — shadcn components + CustomCursor, MagneticButton

lib/
  utils.ts            — cn() helper
  case-studies.ts     — Portfolio data
```

## Premium Features

See [FEATURES.md](./FEATURES.md) for the full list of 25+ premium features with deep-link anchors — ideal for sales conversations.

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or via CLI:
```bash
npx vercel --prod
```

## Contact

**Colin Egan** — colinthomasegan5@gmail.com
