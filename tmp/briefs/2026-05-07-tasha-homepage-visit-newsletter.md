# Brief: Tasha homepage cleanup + visit suite + newsletter mailto workflow

## Why
Tasha sent a Loom video walking through the homepage with a list of changes. She wants the homepage simplified (remove the empty/placeholder Featured Records section), wants the Follow-the-Groove subtitle to clearly say "Instagram" instead of the vague "feed", wants Suite 104 added to her address on the Visit page, and asked what actually happens when someone signs up to "Stay in the Loop" — her husband filled it out and got no email.

The core insight from the discovery: the newsletter form just inserts into a Postgres `subscribers` table and shows "You're in! Check your inbox." but **nothing is sent**. There's no outbound mailer wired up. Tasha doesn't want to set one up — too much work — she wants to send newsletters from her own existing business email, and just needs the website to make it easy to grab everyone's address at once.

## Context

**Homepage composition** (`src/app/page.tsx`):
- `<Hero />` — keep
- `<FeaturedRecords />` (line 29) — **remove**, references `src/components/home/FeaturedRecords.tsx` (currently shows 3 placeholder cards: "Check Our Latest Arrivals" w/ Discogs link, "Staff Picks This Month", "Local Portland Artists"). Has 1 lint warning (`<img>` instead of `next/image`) — removing kills the warning.
- `latestNews` block (lines 31-58) — keep
- `<InstagramFeed />` (line 60) — keep, but rename subtitle. Source: `src/components/home/InstagramFeed.tsx:17` — `<SectionHeading subtitle="Latest from our feed">`. Change to `subtitle="Latest from our Instagram"`. Has 1 lint warning (`<img>`) — leave it (not in scope).
- Stay-in-the-Loop section (lines 62-76) — keep (Tasha only flagged the duplication as part of a question, not a removal request)
- `<QuickLinks />` (line 78) — **keep** (per latest user direction; she didn't explicitly say delete in the audio even though she pointed at it)

**Stay-in-the-Loop appears 2× per page**: homepage section (`page.tsx:62-76`) AND footer (`Footer.tsx:9-16`). Footer is global. We're not touching the duplication this round.

**Subscribe flow** (verified):
- Form: `src/components/home/NewsletterSignup.tsx` (used in both homepage section + footer)
- API: `src/app/api/newsletter/route.ts` — Zod-validates email, `INSERT ... ON CONFLICT DO NOTHING`. **No outbound email.**
- Admin view: `src/app/admin/subscribers/AdminSubscribersClient.tsx` — Tasha can see the list at `/admin/subscribers`.
- Schema: `subscribers` table has `id, email, subscribedAt, isActive` (`src/lib/db/schema.ts:106-111`).

**Visit page address** (`src/app/visit/page.tsx`):
- Line 23: `const address = settingsMap["store_address"] || "5744 E Burnside St 97215";` — pulls from `site_settings` row, code fallback if not set.
- Lines 9-15: metadata description hardcodes the same string.
- Verified live: page currently shows `"5744 E Burnside St 97215"` — no suite.

**Footer address** (`src/components/layout/Footer.tsx:24-25`): hardcoded `<p>5744 E Burnside St</p><p>97215</p>` — no settings lookup. Needs direct edit.

**Verification still pending before this PR ships**: confirm whether the `store_address` row exists in `site_settings`; if it does, update it (DB) so the Visit page picks it up automatically. If it doesn't, the code fallback is sufficient. Either way, the Footer is hardcoded and must be edited.

## Decisions

- **Remove `<FeaturedRecords />` only** — Tasha explicitly said eliminate the section. Delete `<FeaturedRecords />` import + usage in `page.tsx`. Delete the component file `src/components/home/FeaturedRecords.tsx` since it has no other callers. Net: −1 lint warning.
- **Rename Instagram subtitle** — one-line change to `InstagramFeed.tsx:17`.
- **Keep `<QuickLinks />`** — user override; Tasha didn't explicitly say delete in the audio.
- **Suite 104 in three places** — (a) update fallback string in `visit/page.tsx:23` to `"5744 E Burnside St, Suite 104, 97215"`; (b) update metadata description in `visit/page.tsx:9-15`; (c) update hardcoded footer in `Footer.tsx:24-25` (split lines: `5744 E Burnside St, Suite 104` / `Portland, OR 97215`); (d) if `store_address` row exists in `site_settings`, UPDATE it via Neon SQL editor.
- **Newsletter = mailto workflow, no provider integration** — keep current `subscribers` insert behavior unchanged. Add a "Compose Newsletter" button on `/admin/subscribers` that builds a `mailto:tasha-from-address?bcc=email1@x.com,email2@x.com,...` link. Clicking opens her default mail app with every active subscriber in **BCC** (privacy — never CC). She types the subject + body and sends from her own business email. No backend integration, no Resend/Postmark, no broadcast UI.
- **Fix the misleading success message** — `NewsletterSignup.tsx` shows "You're in! Check your inbox." This is a lie since nothing is sent. Change to something honest like `"Thanks! We'll be in touch with the next newsletter."`
- **Privacy gate on the mailto button** — only include subscribers where `isActive = true`. If subscriber count is zero, button is disabled with a "No subscribers yet" hint. If count is huge (>200ish), warn that some mail clients truncate; show the count up front.

## Rejected Alternatives

- **Wire up Resend/Postmark/Mailchimp for real welcome + broadcast emails** — Tasha said too much work; she has a business email already and wants to send from there. Cleanest answer: don't build an integration we don't need.
- **Build an in-admin broadcast composer** — same reason. Mailto is enough.
- **Remove `<QuickLinks />` (3-card row at bottom)** — user override on what initially looked like a removal in the transcript. Keep as-is.
- **Drop the homepage Stay-in-the-Loop section to dedupe with the footer** — Tasha only asked about it, didn't ask to remove. Don't touch.
- **Bundle env-drift fix + `events.image_url` migration into this PR** — kept separate; their verification (Neon queries to confirm the column/rows still match expectations) happens in their own follow-up PR, not bundled here.
- **Use CC instead of BCC for mailto** — leaks every subscriber email to every other subscriber. Hard no.

## Direction

One PR off `main` named `feat/homepage-cleanup-visit-suite-newsletter-mailto`. Five edits: remove FeaturedRecords, rename Instagram subtitle, fix Visit address (3 spots in code + maybe 1 DB update), add Compose Newsletter mailto button to `/admin/subscribers`, fix the misleading newsletter success message. Verify the `store_address` settings row before touching DB. Smoke-test on prod via the established chrome-devtools loop after merge — verify the homepage no longer shows Featured Records, "Latest from our Instagram" reads correctly, Visit page shows Suite 104, and the admin Compose Newsletter button opens a mail client with BCC populated.

Open thread: ping Tasha for the contact-submissions question her email subject mentioned but the audio didn't cover.
