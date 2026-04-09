# Brief: Second Chance Records — Production Website

## Why
Building a production website for Second Chance Records, an independent vinyl record store in Portland's Mt. Tabor neighborhood owned by Tasha Brain. Contracted project under Integrate API / Zahrai Selling LLC. Phase 1 scope: informational site + Discogs integration + admin dashboard + newsletter. 30-day delivery from March 30, 2026. Domains: secondchancerecords.com, secondchancerecordspdx.com. Hosting on Netlify.

## Context

### The Business
- **Second Chance Records LLC** — 5744 E Burnside St, Suite 104, Portland, OR 97215 (Mt. Tabor)
- **Owner:** Tasha Brain — lived experience with justice system (paroled May 19, 2010), advocates for reentry/reform
- **Hours:** Thu–Sun, Noon–8 PM
- **Phone:** (503) 997-2729
- **Email:** secondchancerecords@gmail.com
- **Opened:** July 2025
- **Logo:** Open cell door motif (Instagram profile pic is the logo, need source files)
- **Tagline:** "Second chances for humans & hi-fi"
- **Sells:** Restored used vinyl records, affordable band t-shirts
- **Record prep process:** Spin-Clean → HumminGuru ultrasonic → listened to → fresh sleeve → condition notes
- **Genre bins:** Indie, Prog, Yacht
- **Rotating artist displays** on walls
- **Only selling platform:** Discogs — [SecondChance_Records](https://www.discogs.com/seller/SecondChance_Records/profile)
- **Only partner:** Portland Cherry Bombs FC

### Online Presence
- Instagram: @second_chance_recordspdx (1,509 followers, 141 posts)
- Facebook: Second Chance Records Portland
- Yelp: 5.0 stars
- LinkedIn: Tasha Brain — "Second Chances for hi-fi AND humans!"
- No website yet (this is the project)

### Press
- Willamette Week (Sept 2025), KMHD Jazz Radio (Jan 2026), Travel Portland official guide

### Community Resources (Researched, Tasha to Confirm)
- Oregon Justice Resource Center, Fresh Out CBRP, NWRRC, SE Works/PDX Reentry, 211info, Oregon DOC Reentry

### Pending from Tasha
- Logo source files (vector/high-res) + color palette + fonts
- High-res photos (store interior, exterior, herself, records, events)
- Events calendar content
- Building exterior photo for Visit page illustration
- Confirmation of which reentry orgs to feature

### Full research doc
`./tmp/research/2026-04-08-second-chance-records-research.md`

## Decisions

### Tech Stack
- **Next.js** (App Router) — confirmed by user
- **SQLite** (via better-sqlite3 or Turso) — self-contained, no external DB dependency
- **Tailwind CSS** — for responsive, production-quality styling
- **NextAuth.js** — admin authentication (email/password, 2 users: Nick + Tasha)
- **Netlify** — hosting and deployment
- **Netlify Forms** or custom form handler — for contact form
- **No external CMS** — custom admin dashboard built into the app

### Admin Dashboard
- **2 admin users only** (Nick + Tasha)
- **Edit text content within existing page layouts** — not drag-and-drop page builder
- **Reorder items in lists** (events, featured records, reviews, etc.)
- Sections the admin can manage:
  - All page text and headings
  - Events (add, edit, delete, reorder)
  - News posts (add, edit, delete)
  - About section content
  - Featured records / Discogs links (Staff Picks, New Arrivals, Local Artists)
  - Reviews (curated quotes from Google + Yelp)
  - Partners (logos + links)
  - Newsletter subscribers (view, export CSV, remove)
  - Site settings (hours, phone, address, social links)

### Newsletter
- **Collect and organize only** — no sending functionality in Phase 1
- Email capture form in footer + home page
- Stored in SQLite `subscribers` table with timestamp
- Admin can view list, export to CSV, delete entries
- For sending: Tasha uses external tool (Mailchimp, etc.) with exported CSV

### Pages
| Page | Content |
|------|---------|
| **Home** | Hero with SCR branding, featured records/promos, CTAs to Shop/Events/Visit, newsletter signup |
| **Shop** | "Browse on Discogs" CTA, curated sections with handpicked Discogs links |
| **Events** | Calendar/list of in-store events, links to artist/musician sites |
| **Mission & Values** | Tasha's advocacy story, reentry mission, community org links |
| **About** | Tasha's story, shop history, "second chance" philosophy |
| **Visit / Map** | Embedded Google Map, hours, parking/entry notes, building illustration placeholder |
| **Contact** | Form (→ secondchancerecords@gmail.com) + email/phone/address/hours |
| **Reviews** | Curated quotes from Google & Yelp |
| **Social & Partners** | Instagram, Facebook links; Cherry Bombs FC partner section |

### UX Requirements
- Mobile-responsive (mobile-first design)
- "Back to top" floating button (bottom-right)
- External links open in new tab (scroll position preserved)
- ADA accessible
- Fast load times, optimized images (Next.js Image component)
- SEO: meta tags, Open Graph, LocalBusiness structured data
- SSL/HTTPS (Netlify handles this)
- Google Analytics (or Plausible for privacy-friendly alternative)

### Reviews Strategy
- Pull from **both Google and Yelp**
- Curated manually (stored in DB, managed via admin dashboard)

## Rejected Alternatives
- **Supabase** — user prefers self-contained SQLite, no external dependencies
- **Astro** — Next.js preferred for familiarity and Phase 2 e-commerce path
- **External CMS (Payload, Sanity, Contentful)** — user wants custom admin dashboard built in
- **Drag-and-drop page builder** — too complex; edit-in-place within fixed layouts is sufficient
- **Newsletter sending built-in** — collect and organize only; external tool for actual sends
- **Static export** — admin dashboard requires server-side functionality (API routes, auth, DB)

## Direction
Build a Next.js full-stack application with SQLite, Tailwind CSS, and NextAuth. The public-facing site is a multi-page informational website for Second Chance Records with Discogs integration via links. Behind a login, a custom admin dashboard lets Nick and Tasha edit all page content, manage events/news/reviews/partners/featured records, and manage newsletter subscribers. Deploy to Netlify. Start building now with placeholder branding; swap in real assets when Tasha provides them.
