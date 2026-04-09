# Brief: Frontend Redesign — Portland Warm Grit Aesthetic

## Why
The initial frontend build has no styling (Tailwind v4 CSS not rendering properly) and uses generic placeholder branding. The site needs a complete visual redesign that matches Tasha Brain's punk/DIY Portland record store identity — warm, community-driven, with attitude.

## Context

### Current State
- 96+ source files, all functional (TypeScript compiles, DB seeded, deployed to Netlify)
- Backend is solid: admin dashboard, server actions, Netlify DB (Postgres), Netlify Blobs for images
- Frontend styling is completely broken — no Tailwind classes rendering
- All components exist but need restyling from scratch
- Site is live at https://second-chance-records.netlify.app

### Files That Need Restyling (NOT rewriting logic — just visual layer)
- `src/app/globals.css` — complete rewrite with new palette, fonts, textures
- `src/app/layout.tsx` — update fonts, structured data stays
- `src/components/layout/Header.tsx` — dark sticky header, punk typography
- `src/components/layout/Footer.tsx` — community bulletin board style
- `src/components/layout/MobileMenu.tsx` — dark overlay, punk styling
- `src/components/layout/BackToTop.tsx` — match new palette
- `src/components/ui/*` — all UI components restyled to new palette
- `src/components/home/*` — Hero, FeaturedRecords, InstagramFeed, NewsletterSignup, QuickLinks
- `src/components/shop/DiscogsSection.tsx`
- `src/components/events/EventCard.tsx`
- `src/components/reviews/ReviewCard.tsx`
- `src/components/visit/GoogleMap.tsx`
- `src/components/contact/ContactForm.tsx`
- All 9 public page files (`src/app/page.tsx`, `about/page.tsx`, etc.)
- `src/app/not-found.tsx`, `src/app/error.tsx`
- Admin pages get clean functional styling (not punk — just professional dark theme)

### Key Brand Elements
- Store: Second Chance Records, Portland OR, Mt. Tabor neighborhood
- Logo: Open cell door motif (Instagram profile pic — need file from Tasha, use placeholder for now)
- Tagline: "Second chances for humans & hi-fi"
- Mission: Criminal justice reform, reentry advocacy
- Partner: Portland Cherry Bombs FC (riot grrrl soccer team)
- Opened: July 2025
- Owner: Tasha Brain — lived experience, 15 years free since parole

## Decisions

### Color Palette — "Warm Grit"
- Base/dark: `#1A1A1A` (off-black) — hero sections, header, footer
- Background: `#E8DCC8` (kraft paper) — content sections, warm readability
- Primary accent: `#C2452D` (brick red) — CTAs, links, logo color, punk energy
- Secondary accent: `#D4A03C` (mustard gold) — highlights, second chance/hope symbolism
- Tertiary: `#4A6741` (forest green) — Pacific NW, subtle accents
- Text on dark: `#F5E6D0` (cream) — warm white, not sterile
- Text on light: `#1A1A1A` (off-black)

### Typography
- Headlines: Compressed bold sans-serif via Google Fonts — poster energy, uppercase
  - Primary pick: **Oswald** (widely available, compressed, bold weights) or **Bebas Neue** (free, very compressed)
  - Apply: all h1, h2, section headings
- Subheads/UI: **Space Mono** (monospace, typewriter/zine feel)
  - Apply: nav links, labels, metadata, dates, categories
- Body: **Work Sans** (clean, readable, no-nonsense)
  - Apply: paragraphs, descriptions, form fields
- Accent: **Permanent Marker** (Google Fonts, hand-scrawled)
  - Apply: sparingly — callouts, pull quotes, "NEW" badges, annotations

### Layout Architecture
- **Hero (dark):** Off-black background with subtle grain/noise texture overlay. Bold compressed headline. Mission tagline. CTA buttons in brick red. Transition to kraft paper below.
- **Content sections (kraft):** Kraft paper background with subtle paper texture. Clean single-column for editorial (about, mission). Grid for collections.
- **Section dividers:** Torn paper edge effect or rough line (CSS/SVG) between sections
- **Texture overlays:** Subtle grain/noise on hero and dark sections. Paper texture on kraft sections. Halftone dot pattern as decorative element.
- **Cards:** Dark cards (`#1A1A1A`) on kraft background with cream text, brick red accents. Slight rotation or offset for "stacked records" feel.
- **Footer:** Dark, community bulletin board style. Newsletter, events preview, social links.

### Punk Level: 6/10
Professional enough for a real business, but with genuine texture, hand-drawn elements, and attitude. Not a template — has personality. Key signals:
- Compressed uppercase headlines
- Monospace for UI elements
- Grain/texture overlays
- Torn paper dividers
- Dark+kraft contrast
- Asymmetric layout moments
- Cherry Bombs FC section with berry accent pop

### Page-by-Page Direction

**Home:** Dark hero with store name in massive compressed type → kraft section with featured records as dark cards → Instagram feed grid → newsletter signup with mustard gold accent → quick links → latest news

**About:** Kraft background, editorial single-column, Tasha's story with pull quote in Permanent Marker, press logos

**Shop:** Dark header section with "Browse on Discogs" CTA, curated collection grids below on kraft

**Events:** Kraft background, event cards with date in monospace, artist links in brick red

**Mission:** Dark hero with mission statement, kraft section with advocacy pillars, community resources as a grid

**Visit:** Map embed, store info in dark card, kraft background for parking notes

**Contact:** Split layout — form on left, store info card on right, kraft background

**Reviews:** Dark cards with large pull quotes, platform badges, star ratings in mustard gold

**Community:** Social links with icon treatments, Cherry Bombs FC feature section with berry/riot grrrl accent

**Admin:** Clean dark theme (#1A1A1A base, #2D2D2D cards, cream text). Functional, not punk. Professional dashboard aesthetic.

### Logo Placeholder
Until Tasha provides the actual logo file: create an SVG open cell door icon in brick red (#C2452D) on transparent/dark background. Simple geometric lines — prison cell door with one side swung open. Matches the known Instagram profile pic description.

## Rejected Alternatives
- **Full dark mode throughout** — too heavy for content-heavy pages, kraft paper provides reading relief
- **Punk level 8-10** — would look like a MySpace page, not professional enough for a real business
- **Pastel/modern minimal** — too generic, doesn't capture Portland punk identity at all
- **Standard Shopify template look** — research showed these are forgettable for indie stores

## Direction
Complete frontend visual overhaul using the "Warm Grit" palette, compressed punk typography, texture overlays, and dark-to-kraft layout transitions. Fix the Tailwind v4 rendering issue first, then restyle every component. Backend logic stays untouched — this is purely a visual layer rewrite. Admin gets a clean dark professional theme, not punk styling.
