# Plan: Frontend Redesign — Portland Warm Grit Aesthetic

> **Brief:** `./tmp/briefs/2026-04-09-frontend-redesign.md`
> **Confidence:** 9/10

---

## Architecture Overview

Visual-only rewrite of the entire frontend. **No backend logic changes.** Every component keeps its existing data fetching, server actions, and DB queries — we only change the JSX structure, Tailwind classes, CSS, and fonts.

The design follows a "Portland Warm Grit" aesthetic: dark hero sections with grain texture, kraft paper content sections, compressed punk typography, and warm earth-tone accents. Punk level 6/10 — professional with genuine personality.

**Root cause of current styling failure:** The current `globals.css` has a circular reference in `@theme inline`: `--color-primary: var(--color-primary)` which creates a self-referencing loop. Tailwind v4's `@theme` block resolves at build time, so `var()` references to runtime CSS variables don't work there for colors. **Fix: put hex literals directly in `@theme inline`.**

**PREREQUISITE:** Before starting, read `node_modules/next/dist/docs/` for any Next.js 16 breaking changes to font loading or metadata APIs, as instructed by AGENTS.md.

---

## Variable Migration Mapping

Every file using the old `[var(--color-*)]` arbitrary values must be migrated to proper Tailwind classes:

| Old Pattern | New Tailwind Class |
|---|---|
| `[var(--color-primary)]` or `text-primary` | `text-base` / `bg-base` |
| `[var(--color-accent)]` or `text-accent` | `text-brick` / `bg-brick` |
| `[var(--color-background)]` or `bg-background` | `bg-kraft` |
| `[var(--color-secondary)]` or `text-secondary` | `text-forest` / `bg-forest` |
| `[var(--color-white)]` | `text-cream` / `bg-cream` |
| `border-[var(--color-accent)]` | `border-brick` |
| `focus:ring-[var(--color-accent)]` | `focus:ring-brick` |

This applies across **all ~40+ files** including the 23 admin files.

---

## Files Being Changed

```
src/
├── app/
│   ├── globals.css                     ← MODIFIED (complete rewrite)
│   ├── layout.tsx                      ← MODIFIED (new fonts)
│   ├── page.tsx                        ← MODIFIED (restyled home)
│   ├── not-found.tsx                   ← MODIFIED
│   ├── error.tsx                       ← MODIFIED
│   ├── about/page.tsx                  ← MODIFIED
│   ├── shop/page.tsx                   ← MODIFIED
│   ├── events/page.tsx                 ← MODIFIED
│   ├── events/PastEventsToggle.tsx     ← MODIFIED
│   ├── mission/page.tsx                ← MODIFIED
│   ├── visit/page.tsx                  ← MODIFIED
│   ├── contact/page.tsx                ← MODIFIED
│   ├── reviews/page.tsx                ← MODIFIED
│   ├── community/page.tsx              ← MODIFIED
│   │
│   └── admin/
│       ├── layout.tsx                  ← MODIFIED (dark professional theme)
│       ├── AdminLayoutClient.tsx       ← MODIFIED
│       ├── loading.tsx                 ← MODIFIED
│       ├── login/page.tsx              ← MODIFIED
│       ├── page.tsx                    ← MODIFIED (dashboard stats)
│       ├── events/page.tsx             ← MODIFIED
│       ├── events/AdminEventsClient.tsx ← MODIFIED
│       ├── news/page.tsx               ← MODIFIED
│       ├── news/AdminNewsClient.tsx    ← MODIFIED
│       ├── records/page.tsx            ← MODIFIED
│       ├── records/AdminRecordsClient.tsx ← MODIFIED
│       ├── reviews/page.tsx            ← MODIFIED
│       ├── reviews/AdminReviewsClient.tsx ← MODIFIED
│       ├── partners/page.tsx           ← MODIFIED
│       ├── partners/AdminPartnersClient.tsx ← MODIFIED
│       ├── resources/page.tsx          ← MODIFIED
│       ├── resources/AdminResourcesClient.tsx ← MODIFIED
│       ├── subscribers/page.tsx        ← MODIFIED
│       ├── subscribers/AdminSubscribersClient.tsx ← MODIFIED
│       ├── contact-submissions/page.tsx ← MODIFIED
│       ├── contact-submissions/AdminContactClient.tsx ← MODIFIED
│       ├── instagram/page.tsx          ← MODIFIED
│       ├── instagram/AdminInstagramClient.tsx ← MODIFIED
│       ├── settings/page.tsx           ← MODIFIED
│       ├── settings/AdminSettingsClient.tsx ← MODIFIED
│       └── pages/[slug]/page.tsx       ← MODIFIED
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  ← MODIFIED
│   │   ├── MobileMenu.tsx              ← MODIFIED
│   │   ├── Footer.tsx                  ← MODIFIED
│   │   └── BackToTop.tsx               ← MODIFIED
│   ├── ui/
│   │   ├── Button.tsx                  ← MODIFIED
│   │   ├── Card.tsx                    ← MODIFIED
│   │   ├── Input.tsx                   ← MODIFIED
│   │   ├── Textarea.tsx                ← MODIFIED
│   │   ├── ExternalLink.tsx            ← MODIFIED
│   │   └── SectionHeading.tsx          ← MODIFIED
│   ├── home/
│   │   ├── Hero.tsx                    ← MODIFIED
│   │   ├── FeaturedRecords.tsx         ← MODIFIED
│   │   ├── InstagramFeed.tsx           ← MODIFIED
│   │   ├── NewsletterSignup.tsx        ← MODIFIED
│   │   └── QuickLinks.tsx              ← MODIFIED
│   ├── shop/DiscogsSection.tsx         ← MODIFIED
│   ├── events/EventCard.tsx            ← MODIFIED
│   ├── reviews/ReviewCard.tsx          ← MODIFIED
│   ├── visit/GoogleMap.tsx             ← MODIFIED
│   ├── contact/ContactForm.tsx         ← MODIFIED
│   └── admin/
│       ├── AdminSidebar.tsx            ← MODIFIED
│       ├── ContentEditor.tsx           ← MODIFIED
│       ├── SortableList.tsx            ← MODIFIED
│       ├── ItemForm.tsx                ← MODIFIED
│       └── DataTable.tsx               ← MODIFIED
│
└── public/images/
    ├── placeholder-logo.svg            ← MODIFIED (brick red open cell door)
    ├── placeholder-hero.svg            ← MODIFIED (match new palette)
    ├── placeholder-store.svg           ← MODIFIED (match new palette)
    └── placeholder-tasha.svg           ← MODIFIED (match new palette)
```

**Total: ~60 files modified**

---

## Design Tokens (globals.css)

```css
@import "tailwindcss";

@theme inline {
  /* Fonts — resolved at runtime via Next.js font loader CSS variables */
  --font-heading: var(--font-bebas-neue);
  --font-mono: var(--font-space-mono);
  --font-sans: var(--font-work-sans);
  --font-accent: var(--font-permanent-marker);

  /* Warm Grit Palette — MUST be hex literals, NOT var() references */
  --color-base: #1A1A1A;
  --color-kraft: #E8DCC8;
  --color-brick: #C2452D;
  --color-gold: #D4A03C;
  --color-forest: #4A6741;
  --color-cream: #F5E6D0;
  --color-card: #242424;
  --color-muted: #8B8478;
}
```

**No `:root` block for colors.** All color values go directly in `@theme inline` as hex literals. This is the fix for the circular reference bug.

---

## Typography (layout.tsx)

```tsx
import { Bebas_Neue, Space_Mono, Work_Sans, Permanent_Marker } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", variable: "--font-bebas-neue", subsets: ["latin"], display: "swap" });
const spaceMono = Space_Mono({ weight: ["400", "700"], variable: "--font-space-mono", subsets: ["latin"], display: "swap" });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], display: "swap" });
const permanentMarker = Permanent_Marker({ weight: "400", variable: "--font-permanent-marker", subsets: ["latin"], display: "swap" });
```

Apply all 4 variables to `<html>`: `className={`${bebasNeue.variable} ${spaceMono.variable} ${workSans.variable} ${permanentMarker.variable}`}`

---

## Tasks

### Task 0: Branch + Feasibility Test (SEQUENTIAL — must complete before all others)
1. Create git branch: `git checkout -b redesign`
2. Read `node_modules/next/dist/docs/` for Next.js 16 font/metadata changes
3. Modify ONLY `globals.css` and `layout.tsx` with new fonts and `@theme inline` (hex literals)
4. Run `npx next build` to confirm `font-heading`, `bg-base`, `text-brick` etc. resolve correctly
5. If build fails, debug the TW4 theme registration before proceeding

### Task 1: globals.css Complete Rewrite (SEQUENTIAL — depends on Task 0)
Rewrite `globals.css` with:
- `@theme inline` block with all Warm Grit colors as hex literals + font variables
- Grain texture utility: `.grain-overlay` using CSS `::after` with SVG noise pattern, `opacity: 0.04`, `mix-blend-mode: overlay`
- Torn paper edge: `.torn-edge` and `.torn-edge-reverse` using wavy `clip-path` or SVG background
- Base typography: body = Work Sans, headings = Bebas Neue uppercase tracking-tight
- Selection color: `::selection { background: #C2452D; color: #F5E6D0 }`
- Smooth scroll on `html`
- Link base: `a { color: #C2452D }` with hover gold transition
- Form defaults for dark and kraft contexts
- Thin dark scrollbar styling

### Task 2: Layout Components (PARALLEL with Task 3 — both depend on Task 1)
Restyle Header, Footer, MobileMenu, BackToTop per brief design specs.

**Header:** `bg-base` sticky, logo SVG in brick red + "SECOND CHANCE RECORDS" in `font-heading uppercase tracking-widest text-cream`, nav in `font-mono uppercase text-sm tracking-wide text-cream/70 hover:text-brick`

**Footer:** `bg-base text-cream`, 3-column grid (contact info, quick links, social), newsletter section with gold accent, tagline in Permanent Marker, monospace for all labels

**MobileMenu:** Full-screen `bg-base/95 backdrop-blur`, large Bebas Neue nav links, brick red active

**BackToTop:** `bg-brick text-cream rounded-full`

### Task 3: UI Components (PARALLEL with Task 2)
Restyle Button (5 variants: primary/secondary/outline/ghost/dark), Card (dark/kraft variants), Input/Textarea (dark-on-kraft and cream-on-dark contexts), ExternalLink (brick red + arrow), SectionHeading (Bebas Neue uppercase + monospace subtitle)

### Task 4: Home Page Components (SEQUENTIAL — depends on Tasks 2+3)
Restyle Hero (dark bg, massive compressed type, grain overlay, 3 CTAs), FeaturedRecords (kraft bg, dark cards grid), InstagramFeed (kraft bg, image grid), NewsletterSignup (gold accent section), QuickLinks (dark cards on kraft)

### Task 5: Public Pages (PARALLEL — all 9 pages can be done simultaneously, depends on Task 4)
Restyle all 9 public pages per the brief's page-by-page direction. Preserve all data fetching logic. Only change JSX structure and Tailwind classes.

Pages: Home, About, Shop, Events, Mission, Visit, Contact, Reviews, Community + PastEventsToggle + not-found + error

### Task 6: Admin Theme (PARALLEL with Task 5 — independent)
Restyle ALL admin files with clean dark professional theme:
- `admin/layout.tsx` + `AdminLayoutClient.tsx` — `bg-base` body, `bg-card` sidebar
- `admin/login/page.tsx` — dark centered login form
- `admin/page.tsx` — dark stat cards
- `admin/loading.tsx` — brick red spinner on dark bg
- `AdminSidebar.tsx` — dark bg, cream links, brick red active, monospace
- `ContentEditor.tsx`, `SortableList.tsx`, `ItemForm.tsx`, `DataTable.tsx` — dark inputs, cream text, brick red focus
- ALL 11 `*Client.tsx` files — migrate `var(--color-*)` to proper Tailwind classes per mapping table
- ALL admin `page.tsx` files — same migration

### Task 7: Placeholder SVGs (PARALLEL — independent of everything)
Update all 4 SVGs in `public/images/`:
- `placeholder-logo.svg` — open cell door icon, brick red `#C2452D`, 48x48 viewbox, line art
- `placeholder-hero.svg` — dark gradient `#1A1A1A` to `#242424`, "SECOND CHANCE RECORDS" text
- `placeholder-store.svg` — kraft bg `#E8DCC8`, "Store Photo Coming Soon" in base color
- `placeholder-tasha.svg` — kraft bg, "Photo Coming Soon" in base color

### Task 8: Build + Deploy (SEQUENTIAL — final)
1. `npx tsc --noEmit` — verify types
2. `DATABASE_URL=<prod_url> npx next build` — verify build
3. `NETLIFY_AUTH_TOKEN=<token> netlify deploy --prod --dir=.` — deploy
4. Take screenshot via Chrome DevTools MCP to verify live site

---

## Execution Order

```
Task 0 (branch + test)     ──sequential──▶ Task 1 (globals.css)
                                              │
                                    ┌─────────┼─────────┐
                                    ▼         ▼         ▼
                              Task 2      Task 3     Task 7
                             (layout)     (UI)       (SVGs)
                                    │         │
                                    └────┬────┘
                                         ▼
                                    Task 4 (home components)
                                         │
                                    ┌────┴────┐
                                    ▼         ▼
                              Task 5      Task 6
                             (pages)     (admin)
                                    │         │
                                    └────┬────┘
                                         ▼
                                    Task 8 (build + deploy)
```

---

## Deprecated Code
- Remove old `Inter` and `Playfair_Display` font imports from layout.tsx
- Remove all `var(--color-primary)`, `var(--color-accent)`, `var(--color-background)`, `var(--color-secondary)`, `var(--color-white)` CSS variable references (replaced by Tailwind theme classes)
