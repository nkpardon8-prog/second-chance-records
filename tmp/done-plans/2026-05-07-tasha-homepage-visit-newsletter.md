# Plan: Tasha homepage cleanup + Visit Suite 104 + Newsletter mailto workflow

> Source brief: `./tmp/briefs/2026-05-07-tasha-homepage-visit-newsletter.md`

## Goal

Ship four scoped edits to address Tasha's Loom-walkthrough fixes plus the newsletter-flow gap her husband uncovered:

1. Remove the **FEATURED RECORDS** section from the homepage entirely (component + import + usage).
2. Rename the **FOLLOW THE GROOVE** subtitle from "Latest from our feed" → "Latest from our Instagram".
3. Add **Suite 104** to the store address everywhere it appears in code (Visit page fallback + metadata, Footer hardcoded copy) and update the `store_address` row in the `site_settings` Postgres table if it exists.
4. Replace the misleading newsletter success message (`"You're in! Check your inbox."`) with an honest one, and add a **Compose Newsletter** button to `/admin/subscribers` that opens Tasha's default mail client with every active subscriber pre-populated in **BCC** so she can send the next newsletter from her own business email.

## Why

- Tasha has placeholder Featured Records cards on prod and wants them gone now (no replacement content yet).
- "Latest from our feed" is ambiguous; specifying "Instagram" matches her brand and sets correct user expectation.
- Her physical store is in Suite 104 — the website omits the suite, which can mis-route foot traffic + delivery drivers.
- The newsletter form lies to subscribers ("check your inbox" — there's nothing in their inbox; the system only inserts a row). Tasha doesn't want to wire up an outbound email provider; she wants the website to just hand her an addressed draft so she sends from her own gmail.

## What

User-visible behavior after this PR:

- Homepage no longer shows the FEATURED RECORDS section. Section order becomes: Hero → Latest News → Follow the Groove → Stay in the Loop → Quick Links (3-card row, kept) → Footer.
- FOLLOW THE GROOVE subtitle reads "Latest from our Instagram".
- Visit page Address card shows `5744 E Burnside St, Suite 104, 97215`.
- Footer (every page) shows the same address with Suite 104.
- Public newsletter form, on success, shows: `Thanks! We'll be in touch with the next newsletter.` (or similar honest copy).
- `/admin/subscribers` has a new **Compose Newsletter** button next to **Export CSV**. Clicking it opens the user's default mail client with: `to` = Tasha's business email, `bcc` = comma-joined list of every **active** subscriber's email, `subject` = `Newsletter from Second Chance Records`. Disabled when there are zero active subscribers; warns when over the safe URL-length limit.

### Success Criteria

- [ ] Homepage on prod no longer renders FEATURED RECORDS heading or any of the 3 cards.
- [ ] Homepage on prod renders "Latest from our Instagram" under FOLLOW THE GROOVE.
- [ ] Visit page on prod renders "5744 E Burnside St, Suite 104, 97215" in the Address card.
- [ ] Footer on prod renders the address with Suite 104.
- [ ] Newsletter signup on prod shows honest success copy after submit.
- [ ] `/admin/subscribers` Compose Newsletter button opens mail app with Tasha's email in TO and active subscribers in BCC.
- [ ] `npx tsc --noEmit` clean.
- [ ] Lint count = baseline 12 (no regression). Removing `FeaturedRecords.tsx` removes 1 lint warning, so post-PR may be 11.

## All Needed Context

### Documentation & References

```yaml
- url: https://datatracker.ietf.org/doc/html/rfc6068
  why: mailto: URI scheme — header field encoding rules. Multiple bcc recipients
       are comma-separated, header values are percent-encoded (RFC 3986).

- file: src/app/page.tsx
  why: Homepage composition. Lines 2 (import) + 29 (usage) — both removed.

- file: src/components/home/InstagramFeed.tsx
  why: Line 17 has the SectionHeading subtitle to rename.

- file: src/app/visit/page.tsx
  why: Lines 9-15 (metadata description) and line 23 (address fallback).
       The "store_address" site_settings row OVERRIDES line 23 if present —
       must check Neon + update DB row if it exists.

- file: src/components/layout/Footer.tsx
  why: Lines 24-25 hardcoded address — no settings lookup, must edit.

- file: src/components/home/NewsletterSignup.tsx
  why: Line 26 has the misleading message to replace.

- file: src/app/admin/subscribers/AdminSubscribersClient.tsx
  why: Existing Compose-Newsletter mount point. Already has the
       subscribers[] array — derive active emails client-side.
       Header row at lines 64-76 is where the button goes.

- file: src/components/ui/Button.tsx
  why: Use this for the new Compose Newsletter button (matches existing
       Export CSV styling — variant="outline", size="sm").

- file: src/types/index.ts (or wherever Subscriber type lives)
  why: Confirm Subscriber.isActive boolean — already used in column render.

- file: src/lib/db/schema.ts
  why: subscribers table reference. id/email/subscribedAt/isActive.

- file: src/app/admin/page.tsx
  why: Pattern for reading site_settings via getSettingsByGroup — used by
       Visit page; nothing to change here, just reference for understanding.

- file: src/lib/actions/settings.ts (verify path)
  why: getSettingsByGroup("store") returns the site_settings rows that may
       override hardcoded fallbacks.
```

### Current Codebase Tree (relevant slice)

```bash
src/
  app/
    page.tsx                              # MODIFIED: drop FeaturedRecords import + usage
    visit/page.tsx                        # MODIFIED: address fallback + metadata
    admin/subscribers/
      page.tsx                            # unchanged
      AdminSubscribersClient.tsx          # MODIFIED: add Compose Newsletter button
    api/newsletter/route.ts               # unchanged
  components/
    home/
      FeaturedRecords.tsx                 # DELETED
      InstagramFeed.tsx                   # MODIFIED: subtitle rename
      NewsletterSignup.tsx                # MODIFIED: success message text
      QuickLinks.tsx                      # unchanged (kept per user override)
    layout/
      Footer.tsx                          # MODIFIED: address with Suite 104
  lib/
    actions/
      subscribers.ts                      # unchanged
    db/schema.ts                          # unchanged
migrations/                                # no new migration; SQL is a one-row UPDATE
```

### Desired Codebase Tree

```bash
src/
  app/
    page.tsx                              # ← MODIFIED
    visit/page.tsx                        # ← MODIFIED
    admin/subscribers/
      AdminSubscribersClient.tsx          # ← MODIFIED
  components/
    home/
      InstagramFeed.tsx                   # ← MODIFIED
      NewsletterSignup.tsx                # ← MODIFIED
      # FeaturedRecords.tsx               # ← DELETED
    layout/
      Footer.tsx                          # ← MODIFIED
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: mailto URL length limits.
//   - Outlook caps mailto links around 2048 chars total.
//   - Gmail-as-handler is more forgiving but still bounded by browser URL handler.
//   - Apple Mail handles ~32KB.
// At ~25 chars/email average and overhead, ~75 BCC entries is the safe
// breakpoint for the lowest-common-denominator (Outlook). Tasha currently has
// well under 20 active subscribers — fine — but the button must warn before
// generating a too-long URL so we don't silently truncate.

// CRITICAL: BCC, never CC. CC leaks every subscriber email to every other
// subscriber. Plan must enforce BCC in the constructed mailto URL.

// CRITICAL: Next.js 16 — `address` field encoding. Use encodeURIComponent on
// each header value (subject, bcc list) when building the mailto URL. RFC 6068
// requires header values to be percent-encoded.

// CRITICAL: Active filter. Only include subscribers where isActive === true.
// Inactive = the user toggled them off (likely unsubscribed or test row).

// CRITICAL: `mailto:` requires either a `to` field OR a `bcc` field in the URL.
// Most clients also need a non-empty `to` to avoid edge-case behavior. Use
// Tasha's business email (secondchancerecordsllc@gmail.com) as the `to` so the
// sent email lands in her own inbox as a record and BCC fans out to subscribers.

// CRITICAL: TypeScript baseline. Project enforces `npx tsc --noEmit` clean.
// New code must add 0 errors. Lint baseline is 12 problems — also must not
// regress (deleting FeaturedRecords.tsx will likely DROP it to 11, that's fine).

// CRITICAL: Tasha's prod admin session lives ONLY at secondchancerecords.com
// (production). Deploy preview URLs do NOT carry the cookie. Smoke tests must
// hit prod after merge, not the Netlify deploy preview.

// CRITICAL: `client-only` boundary. AdminSubscribersClient is "use client" —
// the Compose Newsletter button can be a plain anchor or button rendered there.
// No need for a server action.

// CRITICAL: The Visit page reads address from site_settings via
// getSettingsByGroup("store"). If a row exists with key="store_address", the
// HARDCODED FALLBACK IS NEVER SHOWN. Must check Neon for that row before
// shipping; if it exists, UPDATE it instead of (or in addition to) editing the
// fallback string. The Footer is unconditional code — always edit it.
```

## Production-Safety Considerations

This site is in active production use by Tasha. Treat every change as load-bearing.

### Database surface area (verified)

- `featured_records` table — **KEEP**, do NOT drop or alter. Even though we're removing the homepage `<FeaturedRecords />` consumer, the table is **still actively used** by:
  - `src/app/shop/page.tsx:20-22` — categorized reads (`new_arrivals` / `staff_picks` / `local_artists`).
  - `src/app/admin/records/page.tsx` — admin CRUD UI.
  - `src/lib/actions/records.ts` — service layer (insert/update/delete/reorder).
  - `scripts/seed.ts` — seed data.
  - The `FeaturedRecord` TypeScript type (`src/types/index.ts:9`) is `$inferSelect` from the schema — keep both.
- `subscribers` table — **KEEP**, no shape changes. We only READ from it client-side via the existing prop pipeline.
- `site_settings` table, `store_address` row — **MAY UPDATE** one row's value. Single-row, idempotent UPDATE keyed by primary key. No new keys, no schema change.

### What this PR does NOT touch

- No new migration file. No DDL.
- No edits to `/shop`, `/admin/records`, `scripts/seed.ts`, or any `featured_records` writer.
- No edits to `/api/newsletter`. Subscriber capture flow is unchanged.
- No edits to `<QuickLinks />`. Per user override.
- No bundling of the deferred env-drift fix or `events.image_url` migration.

### Production rollout safeguards

- **Neon snapshot before DB UPDATE.** Before running Task 6's `UPDATE site_settings`, create a Neon branch (point-in-time) named `pre-store-address-update-2026-05-07` from the prod branch (`br-jolly-credit-amg0d71n`). If the UPDATE turns out wrong, restore from that branch. Cost: zero (Neon branches are CoW).
- **Idempotent DB write.** Task 6 is `UPDATE site_settings SET value = ... WHERE key = 'store_address'`. Running it twice produces the same result. Running it on a missing row affects 0 rows (no error).
- **DB-vs-code ordering depends on whether a row exists** (this is the actual rule, corrected from the prior version):
  - **Row EXISTS in `site_settings`**: `getSettingsByGroup` returns the OLD value, so the `||` fallback in `visit/page.tsx:23` NEVER fires. If we deploy code first, the Visit page keeps rendering the OLD address until the DB UPDATE runs — that's a real inconsistency window. **In this branch, run the DB UPDATE BEFORE merging the PR.** New value satisfies both old and new code. Footer + metadata are pure code, so they flip at deploy time as expected.
  - **Row does NOT exist**: code fallback is the source of truth. Deploy code first; no DB UPDATE needed (Task 6 skipped).
  - Task 1a's SELECT determines which branch we're in.
- **Next.js caching VERIFIED uncached.** Confirmed by reading `src/lib/actions/settings.ts`: `getSettingsByGroup` is a plain `db.select(...).from(siteSettings).where(...)` — no `unstable_cache`, no `cache()`, no ISR. DB writes reflect on the next request. Note: the `updateSetting` server action calls `revalidatePath("/")` and `revalidatePath("/visit")`, but those only fire when the action runs through the admin UI; a direct Neon SQL UPDATE does NOT trigger them. With `getSettingsByGroup` uncached, this is fine — but if we want belt-and-suspenders, use the admin UI path (see Task 6 alternative).
- **Footer renders on every page** (mounted in root `src/app/layout.tsx`). Verified via grep: `grep -rn "<Footer" src/app/` returns only the layout file. No per-page footer override exists. The Suite-104 change propagates everywhere.
- **Deploy-preview vs prod cookie.** Tasha's iron-session admin cookie is bound to `secondchancerecords.com`. Deploy-preview hostnames (`deploy-preview-N--second-chance-records.netlify.app`) do NOT receive the cookie. Admin-side smoke tests MUST happen on prod after merge. Public-side smoke tests (homepage no longer shows FEATURED RECORDS, Visit page shows Suite 104) CAN be done on the deploy preview before merge — and should be, as a pre-merge gate.
- **Server-action ID staleness — pre-warn Tasha.** Known issue (CLAUDE.local.md Open Issue #4): any admin tab she had open before deploy will throw "Server Action ... was not found" on its first action after deploy. The new Compose Newsletter button is a plain `<a href>`, not a server action — unaffected. But Toggle Active / Delete on the same page ARE server actions and will fail until reload. Smoke recipe MUST tell Tasha to hard-reload `/admin/subscribers` once after deploy.
- **Atomic PR.** All 5 user-visible changes ship in one PR so prod sees a consistent state. Splitting creates intermediate states (e.g., Visit page has Suite 104 but Footer doesn't).
- **Deploy window.** Netlify auto-deploys on merge to `main` in ~2-3 min. Run the merge during low-traffic hours if possible.
- **Rollback plan.** If smoke test surfaces a regression: `git revert <merge-sha> && git push origin main`. The DB UPDATE from Task 6 is independently revertible — re-run with the previous value (recorded in Task 1a output) or restore the Neon snapshot branch.
- **`NEXT_PUBLIC_SITE_URL` env-drift (latent issue, not introduced by this PR).** Per CLAUDE.local.md, the Netlify env points at the netlify.app subdomain instead of apex. Since none of the changes in this PR emit absolute URLs from that env (Visit metadata uses relative descriptions; newsletter form uses relative `/api/newsletter`; mailto URL uses a hardcoded literal email), this PR is unaffected. Verified via `grep -rn "NEXT_PUBLIC_SITE_URL" src/` and inspecting consumers — they're in `image-store.ts`, not in our changed surface.
- **Lint baseline measurement.** Before commit: `npm run lint 2>&1 | tail -1` — capture the count. After commit (post-FeaturedRecords-deletion): same command. Both numbers go in the PR description so reviewers can verify removed-only-warnings, no-new-warnings.

### Privacy & data handling

- Subscriber emails enter the user's browser as part of the rendered admin page (already true today via the existing list). The Compose Newsletter button **does not send them anywhere new**. The mailto URL is handled locally by the OS mail-handler. No third-party intermediary.
- BCC enforcement is non-negotiable. CC would broadcast every subscriber's address to every other subscriber.
- No PII is logged or persisted as a result of this PR.

### Lint + TS guardrails

- `npx tsc --noEmit` MUST be 0 errors before commit.
- `npm run lint` MUST be ≤ 12 problems (current baseline). Removing `FeaturedRecords.tsx` removes 1 lint warning (its bare `<img>`), so post-PR may legitimately be 11.
- Do not add new lint warnings in any new code.

## Implementation Blueprint

### Architecture Overview

This is a thin, mostly-cosmetic PR with one new piece of behavior: the **Compose Newsletter** mailto button. Everything else is text/JSX edits.

**Compose Newsletter button — flow**:

```
AdminSubscribersClient (server-rendered list passed in via prop)
        │
        │ derives at render-time:
        │   activeEmails = subscribers.filter(s => s.isActive).map(s => s.email)
        │
        ▼
ComposeNewsletterButton (new helper, lives inline or as a small subcomponent)
        │
        │ builds: mailto:secondchancerecordsllc@gmail.com?bcc=<encoded>&subject=<encoded>
        │
        │ handles 3 states:
        │   - 0 active subscribers → button disabled, hint text
        │   - normal (under URL-length limit) → renders as <a href="mailto:...">
        │   - over limit → renders disabled with a warning + suggests CSV export
        │
        ▼
User clicks → browser hands URL to default mail handler → mail app opens
              with TO populated, BCC populated, SUBJECT populated, BODY blank.
```

No client-side fetch, no new API route, no DB migration for the newsletter feature itself. The address-with-Suite work might involve one DB UPDATE depending on what Neon contains — see Task 6.

### Data Models and Structure

No schema changes. Existing `subscribers` table is sufficient:

```typescript
// src/lib/db/schema.ts:106-111 (UNCHANGED)
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});
```

`site_settings` table for the address override (unchanged shape; we may UPDATE one row):

```typescript
// src/lib/db/schema.ts:10-15 (UNCHANGED)
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  ...
});
```

### Tasks (in implementation order)

```yaml
Task 1 — Verify Neon state + create safety snapshot:
SUBTASK 1a — Query current state:
  In Neon SQL editor (project super-unit-72722009, branch br-jolly-credit-amg0d71n, db neondb):
    SELECT key, value FROM site_settings WHERE key = 'store_address';
  - If 0 rows: code fallback is the only source of truth — Task 6's DB UPDATE is skipped.
  - If 1 row: note the current value. Task 6 will UPDATE it.
SUBTASK 1b — Branch as snapshot (only if 1 row was returned):
  In Neon console, create a branch named `pre-store-address-update-2026-05-07`
  from `br-jolly-credit-amg0d71n`. This is a free, instantaneous CoW snapshot —
  acts as a one-click rollback target if Task 6 produces an unexpected result.
SUBTASK 1c — Confirm featured_records consumers still work:
  Sanity grep:
    grep -rn "getFeaturedRecords\|featuredRecords" src/ scripts/ | grep -v FeaturedRecords.tsx
  Expect EXACTLY these files in the output: src/app/shop/page.tsx,
    src/app/admin/records/page.tsx, src/lib/actions/records.ts,
    src/types/index.ts, scripts/seed.ts, src/lib/db/schema.ts.
  - If `getFeaturedRecords` is missing from the expected files: STOP.
    The table may have unexpected coupling — deletion may be unsafe.
  - If the grep includes any file outside this list: STOP and audit it
    before proceeding.
  This confirms the table stays load-bearing after the homepage component
  is deleted, and that no unknown consumer is silently relying on the
  homepage component's render side effects.
RECORD the Task 1a result + 1b branch name inline in the PR description.

Task 2 — Remove FeaturedRecords from homepage:
MODIFY src/app/page.tsx:
  - DELETE line 2: `import FeaturedRecords from "@/components/home/FeaturedRecords";`
  - DELETE line 29: `<FeaturedRecords />`
DELETE src/components/home/FeaturedRecords.tsx entirely.
GREP src/ for any other reference to FeaturedRecords; expect zero.

Task 3 — Rename Instagram subtitle:
MODIFY src/components/home/InstagramFeed.tsx:17
  - CHANGE: `<SectionHeading subtitle="Latest from our feed">`
  - TO:     `<SectionHeading subtitle="Latest from our Instagram">`

Task 4 — Update Visit page address (code):
**CANONICAL ADDRESS STRING (used in code fallback, footer, and DB UPDATE — single source of truth):**
  `5744 E Burnside St, Suite 104, 97215`
  This matches Tasha's verbatim email request and avoids scope-creep additions
  (no "Portland, OR" — keeps consistency with original phrasing). Metadata
  descriptions stay sentences and may include "Portland, OR" for SEO clarity.

MODIFY src/app/visit/page.tsx:
  - Line 10 metadata.description: replace
      "Visit Second Chance Records at 5744 E Burnside St, Portland, OR 97215. Open Thu-Sun 12-8pm."
    with
      "Visit Second Chance Records at 5744 E Burnside St, Suite 104, Portland, OR 97215. Open Thu-Sun 12-8pm."
  - Line 14 openGraph.description: replace
      "Find us at 5744 E Burnside St, Portland, OR. Open Thu-Sun 12-8pm."
    with
      "Find us at 5744 E Burnside St, Suite 104, Portland, OR. Open Thu-Sun 12-8pm."
    (Same Suite 104 insertion; structurally different from line 10 because
    line 14 omits the zip — preserve that shape.)
  - Line 23 fallback string: replace
      "5744 E Burnside St 97215"
    with
      "5744 E Burnside St, Suite 104, 97215"  // CANONICAL

Task 5 — Update Footer address (code):
MODIFY src/components/layout/Footer.tsx:24-25
  - REPLACE:
      <p>5744 E Burnside St</p>
      <p>97215</p>
    WITH:
      <p>5744 E Burnside St, Suite 104</p>
      <p>97215</p>
  - Rationale: keeps the existing two-line shape (line 1 = street, line 2 = zip)
    and matches the canonical string "5744 E Burnside St, Suite 104, 97215"
    when read top-to-bottom. Does NOT add "Portland, OR" because that's
    scope creep beyond Tasha's verbatim request.

Task 6 — Update site_settings.store_address (DB):
IF Task 1a returned 1 row → DB row exists, this MUST run BEFORE PR merge:

  6.0 DRIFT CHECK — re-SELECT immediately before UPDATE to detect concurrent edits:
    SELECT key, value FROM site_settings WHERE key = 'store_address';
    Compare against Task 1a's recorded value. If different, STOP — ask Tasha
    if she edited it via /admin/settings between then and now; reconcile
    before proceeding.

  6.1 Snapshot exists (Task 1b created `pre-store-address-update-2026-05-07`).

  6.2 PREFERRED PATH — use the admin UI, not raw SQL:
    VERIFIED: `src/app/admin/settings/AdminSettingsClient.tsx:13` defines
    `groupOrder = ["Contact Info", "Hours", "Social Media", "General"]`.
    `store_address` has `group="store"` (per `getSettingsByGroup("store")`
    consumer in `visit/page.tsx`), so it does NOT appear under any of those
    headings. It DOES appear at the bottom under the auto-generated "Other"
    group (lines 29-34 push ungrouped items into a final group). The field
    IS editable; it's just not in the first bucket. This is fine — Tasha
    can find it under "Other".
    PRE-STEP — Hard-reload `/admin/settings` in chrome-devtools tab 18 BEFORE
    clicking save. `updateSetting` is itself a server action; if Tasha's tab
    is stale from a prior deploy, the first save will throw "Server Action
    not found" and the value will not change. Reload first, THEN save.
    Tasha (or me via chrome-devtools tab 18) navigates to /admin/settings,
    finds the `store_address` field under the "Other" group, edits the value
    to the CANONICAL string `5744 E Burnside St, Suite 104, 97215`, saves.
    The `updateSetting` server action automatically calls
    `revalidatePath("/")` and `revalidatePath("/visit")` — guaranteed cache
    bust. This is the documented mutation path; matches single-pattern principle.

  6.3 FALLBACK PATH — direct Neon SQL (only if /admin/settings is unreachable):
    UPDATE site_settings
    SET value = '5744 E Burnside St, Suite 104, 97215'
    WHERE key = 'store_address' AND value <> '5744 E Burnside St, Suite 104, 97215'
    RETURNING key, value;
    - The `AND value <> ...` clause makes idempotent re-runs return 0 rows
      (visibly no-op) instead of pretending a redundant write succeeded.
    - First run: expect 1 row returned (the new value).
    - Subsequent runs: 0 rows = already applied = success.
    - Any other row count: ABORT and investigate.
    - After raw SQL, manually trigger Netlify redeploy to bust any RSC caches
      (none observed, but belt-and-suspenders).

  6.4 SEQUENCING vs the PR (precision-corrected):
    - Run Task 6 FIRST (admin UI or SQL). Old code reads the new DB value;
      Visit page Address card flips to "Suite 104, 97215" immediately.
    - THEN merge the PR and let it deploy. The hardcoded Footer + metadata
      flip at deploy time.
    - RESIDUAL WINDOW: between Task 6 completing and the prod deploy
      finishing (~3-5 min for Netlify to build and swap), the Visit page
      Address card already shows the new value, but the Footer (hardcoded in
      the OLD bundle) still shows the old value. This is a tiny visual
      mismatch on a low-traffic site. Acceptable.
    - This is *not* eliminating the inconsistency window entirely; it's
      shrinking it to a Footer-only mismatch and confining it to the deploy
      duration. The alternative (merge first, then Task 6) creates the
      symmetric problem (Footer shows new, Address card shows old). Pick the
      lesser; the Footer mismatch is less visible than the Address card.
    - Lower-traffic mitigation: pick a deploy window when Tasha can monitor.

  ROLLBACK if Task 6 result is wrong:
    Either: re-run with original value via /admin/settings (preferred) or
    `UPDATE site_settings SET value = '<original-value-from-task-1a>'
       WHERE key = 'store_address' RETURNING key, value;`
    Or: restore from the `pre-store-address-update-2026-05-07` Neon branch.

ELSE Task 1a returned 0 rows → DB row does NOT exist:
  Skip Task 6 entirely. Code fallback in `visit/page.tsx:23` is the source of
  truth, and the deploy alone will make the Visit page render Suite 104.
  No DB write happens this PR. No drift-check needed.

Task 7 — Honest newsletter success message:
PRE-STEP: re-read src/components/home/NewsletterSignup.tsx in full and
`grep -n "Check your inbox" src/` to confirm there's exactly ONE occurrence
(at line 26, captured this plan). If multiple occurrences exist (e.g., a
hardcoded string in a separate success-card JSX block was added since this
plan was written), update ALL of them to the new copy.

MODIFY src/components/home/NewsletterSignup.tsx:26
  - CHANGE: `setMessage("You're in! Check your inbox.");`
  - TO:     `setMessage("Thanks! We'll be in touch with the next newsletter.");`
  - DO NOT alter the success-view JSX structure (lines 34-40) or the form
    JSX. Only the string at line 26.

Task 8 — Add Compose Newsletter button to admin/subscribers:
MODIFY src/app/admin/subscribers/AdminSubscribersClient.tsx:

  8.0 Extend the React import. Currently `AdminSubscribersClient.tsx:3` is:
        import { useTransition } from "react";
      Change to:
        import { useState, useTransition } from "react";
      (Required by 8.4's `copyState`. Forgetting this is the most likely
      first-pass TS error.)

  8.1 Add constants near the top of the component (above the function):
      // Verified: matches the contact email at src/components/layout/Footer.tsx:30
      const TASHA_EMAIL = "secondchancerecordsllc@gmail.com";
      const SUBJECT = "Newsletter from Second Chance Records";
      // Tasha's default mail handler is Gmail (her business email is gmail.com).
      // Gmail web compose silently truncates large BCC lists well below the
      // browser URL cap. 1500 is a conservative cap that accounts for both
      // Gmail's handler limit AND the worst-case browser URL cap (Outlook 2048
      // after percent-encoding overhead).
      const MAILTO_MAX = 1500;

  8.2 Derive inside the component (BEFORE columns/actions):
      const activeEmails = subscribers
        .filter(s => s.isActive)
        .map(s => s.email);
      // CRITICAL — RFC 6068 mailto encoding:
      // Per-address percent-encode FIRST, then join with literal `,`.
      // Wrapping the joined string in encodeURIComponent (the wrong way)
      // turns the address-separator commas into %2C, which RFC 6068 §5
      // does not guarantee will be parsed as separators by all clients
      // (Apple Mail in particular has historically failed on %2C-separated
      // BCC lists). This per-address encoding is also the only correct
      // way to handle quoted-local-parts containing literal commas
      // (e.g., "foo,bar"@example.com — rare but valid per RFC 5322).
      const bccEncoded = activeEmails.map(encodeURIComponent).join(",");
      const subjectEncoded = encodeURIComponent(SUBJECT);
      const noActive = activeEmails.length === 0;
      // Build URL only if we have recipients; gate length-check on real URL.
      const mailtoUrl = noActive
        ? null
        : `mailto:${TASHA_EMAIL}?bcc=${bccEncoded}&subject=${subjectEncoded}&body=`;
      // body= empty string included so iOS Mail places cursor in body, not To.
      const tooLong = mailtoUrl !== null && mailtoUrl.length > MAILTO_MAX;
      const composeDisabled = noActive || tooLong;
      const composeReason = noActive
        ? "No active subscribers yet."
        : tooLong
        ? `Subscriber list (${activeEmails.length}) too long for one mailto link. Use Copy BCC List below, then paste into your mail app's BCC field.`
        : null;

  8.3 Render alongside Export CSV. The existing header at
      AdminSubscribersClient.tsx:64-76 is:
        <div className="flex items-center justify-between mb-6">
          <div>... title + count block ...</div>
          <a href="/api/admin/subscribers/export" ...><Button>Export CSV</Button></a>
        </div>
      DO NOT alter the outer `flex items-center justify-between mb-6` div or
      the title block. ONLY replace the single Export-CSV `<a>...</a>` child
      with a NEW `<div className="flex items-center gap-2">` containing, in
      order: (1) Compose Newsletter, (2) optional Copy BCC List (only if
      tooLong), (3) Export CSV (the existing anchor moves inside this new
      div). This keeps the title block on the left and the button group on
      the right.

      Match the existing <a><Button/></a> pattern that Export CSV uses
      (Button.tsx is non-polymorphic — verified — so wrapping is the
      established repo precedent; nested-interactive HTML technically invalid
      but consistent with the repo).

      Active state:
        <a href={mailtoUrl}>
          <Button size="sm" variant="outline">
            Compose Newsletter ({activeEmails.length})
          </Button>
        </a>

      Disabled state — keep the disabled button INLINE with the rest of the
      button group (don't break the flex row alignment); render the helper
      text BENEATH the entire header row using a sibling div placed AFTER the
      `flex items-center justify-between mb-6` parent:

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled
          aria-describedby="compose-hint"
        >
          Compose Newsletter
        </Button>
        ... (rest of button group, including Export CSV) ...

      Then, OUTSIDE the header div but BEFORE the table card, add:
        {composeDisabled && composeReason && (
          <p id="compose-hint" className="text-xs text-kraft/70 mb-4 font-mono">
            {composeReason}
          </p>
        )}

      (Visible helper text replaces title=, which screen readers don't
      reliably announce. Placing it below the header avoids breaking
      `items-center` alignment of the button row.)

  8.4 Add a "Copy BCC List" fallback button next to Compose Newsletter,
      shown only when over-limit. Lets Tasha grab the comma-separated email
      list and paste into Gmail web compose's BCC field manually. Must
      handle clipboard-permission denial (Safari/iOS may reject the call):

        const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
        const handleCopyBcc = async () => {
          try {
            await navigator.clipboard.writeText(activeEmails.join(", "));
            setCopyState("copied");
          } catch {
            setCopyState("failed");
          }
          setTimeout(() => setCopyState("idle"), 2000);
        };

      Render conditionally INSIDE the button group div from 8.3:
        {tooLong && (
          <Button size="sm" variant="outline" type="button" onClick={handleCopyBcc} aria-live="polite">
            {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy BCC List"}
          </Button>
        )}

  8.5 Note for Tasha (preserve as JSDoc on the component):
      "Mailto opens with TO=Tasha so the newsletter copy lands in your own
       inbox/Sent as an audit trail; subscribers receive it via BCC. Do not
       remove the TO field — clients require it."

Task 9 — Verify TypeScript + lint:
  - Run `npx tsc --noEmit` from repo root. Expect ZERO errors.
  - Run `npm run lint`. Expect ≤ 12 problems (baseline). Removing
    FeaturedRecords.tsx may reduce it to 11 — that's a win.
  - If new errors/warnings introduced: stop and fix before commit.

Task 10 — PR + ordered prod rollout:
  10.1 Branch from main: `git checkout -b feat/homepage-cleanup-visit-suite-newsletter-mailto`
  10.2 LINT BASELINE — capture pre-change count:
       `npm run lint 2>&1 | tail -1` → record in PR description.
  10.3 Apply Tasks 2–8. Commit with HEREDOC body, push.
  10.4 LINT POST-CHANGE — capture and verify:
       `npm run lint 2>&1 | tail -1` → record in PR description. Expect ≤ baseline (the FeaturedRecords.tsx removal kills 1 `<img>` warning).
       `npx tsc --noEmit` → expect 0 errors.
  10.5 `gh pr create --base main` — title: "Homepage cleanup + Visit Suite 104 + Newsletter mailto"
  10.6 Watch Netlify deploy:
       - `gh pr checks <N>` polled via Monitor until green.
       - Open the deploy-preview hostname. Public-side smoke (no admin needed):
         - Homepage: no FEATURED RECORDS section.
         - Homepage: "Latest from our Instagram" subtitle present.
         - /visit: Address card shows `5744 E Burnside St, Suite 104, 97215`.
         - Footer: shows Suite 104.
         - Submit newsletter form with `smoketest@example.invalid`. Confirm new success message.
         (Admin-side smoke can't run on preview — admin cookie is bound to apex.)
  10.7 IF DB ROW EXISTS (Task 1a returned 1 row):
       Run Task 6 NOW — BEFORE merging the PR. Use the /admin/settings UI
       (Task 6.2 preferred path) so revalidation fires automatically. Confirm
       on prod: hard-reload /visit; address still renders correctly (old code
       reading new DB value — must be a graceful read of any string).
  10.8 Merge: `gh pr merge <N> --squash --delete-branch`
  10.9 Wait for Netlify prod deploy to go green (~2-3 min).
  10.10 PROD SMOKE — sequenced so the cleanup runs unconditionally:
       a) Hard reload secondchancerecords.com/. Confirm no FEATURED RECORDS;
          confirm "Latest from our Instagram".
       b) Hard reload secondchancerecords.com/visit. Confirm Address card
          shows `5744 E Burnside St, Suite 104, 97215`; view-source meta
          description contains "Suite 104".
       c) Footer (any page): confirm Suite 104 line.
       d) Submit newsletter form with a per-run unique address. Tasha's
          contact email is `secondchancerecordsllc@gmail.com` (Gmail, not a
          custom domain), so use Gmail's `+` aliasing — passes Zod's email
          validator AND lands cleanly in her own inbox if she ever wants to
          confirm receipt:
             secondchancerecordsllc+smoketest<unix-timestamp>@gmail.com
             (e.g., `secondchancerecordsllc+smoketest1714752000@gmail.com`)
          Per-run timestamp avoids the `subscribers.email` UNIQUE constraint
          on retries.

          POSITIVE assertion (preferred — has real diagnostic power):
            evaluate_script in tab 11 (or whichever public tab):
              const successText = document.body.innerText;
              return {
                hasNewMessage: successText.includes(
                  "Thanks! We'll be in touch with the next newsletter."
                ),
                hasOldMessage: successText.includes("Check your inbox"),
              };
            Assert: hasNewMessage === true AND hasOldMessage === false.
            (Asserting positive presence of the new string catches a stale
            CDN bundle; absence-only assertion would pass even if nothing
            shipped, which is why both checks together are required.)
       e) Tasha pre-warning: tell her to hard-reload /admin/subscribers
          before clicking anything (server-action ID staleness). Then she
          (or me via chrome-devtools tab 18) opens the page.

          AUTOMATED VERIFICATION (preferred — does not require launching
          a mail client):
            evaluate_script in tab 18:
              const a = document.querySelector('a[href^="mailto:secondchancerecordsllc@gmail.com"]');
              return {
                exists: !!a,
                href: a?.href,
                hasBcc: a?.href.includes('?bcc=') || a?.href.includes('&bcc='),
                hasSubject: a?.href.includes('subject=Newsletter%20from%20Second%20Chance%20Records'),
                bccCount: (a?.href.match(/%40/g) || []).length, // %40 = @
              };
            Assert: exists=true, hasBcc=true, hasSubject=true, bccCount
            equals the visible active-subscriber count in the table.

          MANUAL VERIFICATION (only if Tasha is available):
            She clicks Compose Newsletter. Mail app opens with:
              - TO = secondchancerecordsllc@gmail.com
              - BCC populated; visually verify count equals active subs
              - Subject = "Newsletter from Second Chance Records"
              - Body = blank
            She closes the draft (does NOT send).
       f) ALWAYS RUN cleanup of the test subscriber row, regardless of (e)
          outcome. Run cleanup BEFORE retrying step (d) on any retry — the
          UNIQUE constraint on `subscribers.email` would otherwise reject
          the second submit.
          The cleanup LIKE pattern MUST match the email pattern actually
          used in step (d). If you change (d), change (f) in lockstep.

          In Neon SQL editor (or via /admin/subscribers UI):
            SELECT id, email FROM subscribers
              WHERE email LIKE 'secondchancerecordsllc+smoketest%@gmail.com';
            DELETE FROM subscribers
              WHERE email LIKE 'secondchancerecordsllc+smoketest%@gmail.com';
            -- LIKE-with-prefix is safe here because the local-part starts
            -- with the literal "secondchancerecordsllc+smoketest" prefix.
            -- This will NOT match real subscribers signing up via Gmail
            -- (their local-part would not begin with that exact prefix).
            -- Run SELECT first to eyeball before DELETE.
  10.11 If Task 1a returned 0 rows (DB row didn't exist), nothing more to do
        on the DB side.
  10.12 ROLLBACK if ANY of 10.10 (a-e) fails:
        - `git revert <merge-sha> && git push origin main` — restores prior code.
        - If Task 6 already ran (DB row existed branch): re-run with original
          value via /admin/settings, OR restore from the
          `pre-store-address-update-2026-05-07` Neon snapshot branch.
        - Investigate locally, open a fix PR.

```

## Follow-ups (NOT part of this PR)

- **Ask Tasha about the "Contact Submissions" question** — her email subject mentioned it but the audio walkthrough never specified what she wanted. Out-of-band conversation; could become a follow-up PR.
- **DRY the canonical address** — extract `5744 E Burnside St, Suite 104, 97215` to `src/lib/constants.ts` and have Footer + Visit fallback + DB UPDATE all reference the same constant. Defer to a small cleanup PR; this PR keeps the strings inline so the diff stays focused.
- **DRY Tasha's contact email** — `secondchancerecordsllc@gmail.com` appears in Footer, Contact page, and now AdminSubscribersClient. Extract to a shared constant. Defer.
- **`<a><Button/></a>` repo-wide cleanup** — Button.tsx is non-polymorphic, so existing Export CSV (and the new Compose Newsletter) wrap a real `<a>` around a `<button>` (technically invalid nested-interactive HTML). A future PR can either (a) make `Button` polymorphic with an `as` prop or (b) add an `AnchorButton` variant. Out of scope here.
- **Restoring FeaturedRecords if Tasha changes her mind** — prefer a fresh implementation against current `featured_records` table contents over reverting this commit, since the placeholder cards she saw weren't backed by curated data.
- **Newsletter cadence copy in Footer (`Footer.tsx:12-14`)** — current text "New arrivals, events, and community news delivered to your inbox." implies a regular cadence the mailto-driven workflow won't fulfill. Leaving as-is per user direction (the "honest message" change was scoped to post-submit confirmation specifically), but worth revisiting if Tasha sends fewer than ~3 newsletters/year.

### Per-Task Pseudocode (only the non-obvious bit)

```typescript
// Task 8 — Compose Newsletter button (inside AdminSubscribersClient.tsx)
// Verified: Button.tsx is non-polymorphic, renders <button>, forwards
// `disabled` via {...props}. Existing Export CSV uses <a><Button/></a>.

const TASHA_EMAIL = "secondchancerecordsllc@gmail.com"; // matches Footer.tsx:30
const SUBJECT = "Newsletter from Second Chance Records";
const MAILTO_MAX = 1500; // conservative for Gmail-as-handler

// Inside the component, BEFORE columns/actions:
const activeEmails = subscribers
  .filter(s => s.isActive)
  .map(s => s.email);

const noActive = activeEmails.length === 0;

// CRITICAL — RFC 6068: percent-encode each address, then join with literal `,`.
// Wrapping the whole joined string in encodeURIComponent turns separators
// into %2C, which clients are not required to parse as separators.
// Compute mailtoUrl ONLY when we have recipients so we never need a non-null
// assertion in JSX (avoids @typescript-eslint/no-non-null-assertion lint hit).
let mailtoUrl: string | null = null;
let tooLong = false;
if (!noActive) {
  const bccEncoded = activeEmails.map(encodeURIComponent).join(",");
  const subjectEncoded = encodeURIComponent(SUBJECT);
  mailtoUrl = `mailto:${TASHA_EMAIL}?bcc=${bccEncoded}&subject=${subjectEncoded}&body=`;
  tooLong = mailtoUrl.length > MAILTO_MAX;
}
const composeDisabled = noActive || tooLong;
const composeReason = noActive
  ? "No active subscribers yet."
  : tooLong
  ? `Subscriber list (${activeEmails.length}) too long for one mailto link. Use Copy BCC List, then paste into your mail app's BCC field.`
  : null;

const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
const handleCopyBcc = async () => {
  try {
    await navigator.clipboard.writeText(activeEmails.join(", "));
    setCopyState("copied");
  } catch {
    setCopyState("failed");
  }
  setTimeout(() => setCopyState("idle"), 2000);
};

// In the header row JSX — keep the existing outer flex justify-between div,
// keep the title/count block on the LEFT, replace ONLY the existing
// Export CSV anchor child with this new button-group div on the RIGHT:
<div className="flex items-center gap-2">
  {composeDisabled ? (
    <Button
      size="sm"
      variant="outline"
      type="button"
      disabled
      aria-describedby="compose-hint"
    >
      Compose Newsletter
    </Button>
  ) : (
    <a href={mailtoUrl ?? "#"}>
      <Button size="sm" variant="outline" type="button">
        Compose Newsletter ({activeEmails.length})
      </Button>
    </a>
  )}
  {tooLong && (
    <Button
      size="sm"
      variant="outline"
      type="button"
      onClick={handleCopyBcc}
      aria-live="polite"
    >
      {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy BCC List"}
    </Button>
  )}
  {/* existing Export CSV anchor + Button — keep verbatim as last child */}
</div>

// Then OUTSIDE the header div (above the table card), render helper text:
{composeDisabled && composeReason && (
  <p id="compose-hint" className="text-xs text-kraft/70 mb-4 font-mono">
    {composeReason}
  </p>
)}
```

```typescript
// Task 1 — Neon verification query (run in Neon SQL editor, copy result into PR description)
SELECT key, value FROM site_settings WHERE key = 'store_address';
-- expected: either 0 rows or 1 row containing some variant of
--   "5744 E Burnside St 97215"
```

### Integration Points

```yaml
DATABASE:
  - schema:    No changes.
  - migration: No new SQL file. Task 6 is a one-row UPDATE run manually in Neon
               SQL editor (project super-unit-72722009, branch
               br-jolly-credit-amg0d71n, db neondb), only if Task 1 found a row.

ROUTES:
  - No new routes. The mailto button is a plain <a href> rendered client-side.

FRONTEND:
  - Pages affected: /, /visit, /admin/subscribers
  - Global affected: Footer (every page)
  - No new components beyond the inline Compose Newsletter button.

DEPLOY:
  - One PR off main → Netlify auto-deploys → smoke test on prod.
```

## Validation Loop

```bash
# From repo root, before commit:
npx tsc --noEmit                # MUST be 0 errors
npm run lint                    # MUST be ≤ 12 problems (baseline)

# After PR merges (Tasha's session-cookie domain):
curl -sS https://secondchancerecords.com/ | grep -i "FEATURED RECORDS"
  # expect: no output (section gone)
curl -sS https://secondchancerecords.com/ | grep -i "Latest from our Instagram"
  # expect: match present
curl -sS https://secondchancerecords.com/visit | grep -i "Suite 104"
  # expect: match present (in metadata at minimum; address card too)

# DB verification (Neon SQL editor):
SELECT key, value FROM site_settings WHERE key = 'store_address';
  # if a row exists, value should equal the CANONICAL string:
  # '5744 E Burnside St, Suite 104, 97215'
  # (no "Portland, OR" — matches Tasha's verbatim request and avoids scope creep)
```

## Final Validation Checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` shows ≤ 12 problems
- [ ] FeaturedRecords.tsx file deleted; no remaining imports
- [ ] InstagramFeed subtitle exact-string match: `"Latest from our Instagram"`
- [ ] Visit page address (rendered + metadata) contains `Suite 104`
- [ ] Footer address contains `Suite 104`
- [ ] NewsletterSignup success message no longer says "Check your inbox"
- [ ] Compose Newsletter button present in `/admin/subscribers` header row
- [ ] Compose Newsletter URL uses `bcc=` (not `cc=`); TO is Tasha's email
- [ ] Disabled state when 0 active subscribers (visible helper text via `aria-describedby`, not `title=`)
- [ ] Disabled state with visible helper text when URL exceeds 1500 chars (Gmail-handler conservative cap)
- [ ] Compose Newsletter URL built per RFC 6068: per-address `encodeURIComponent` then literal `,` join (NOT `encodeURIComponent` of the joined string)
- [ ] Both new buttons (Compose Newsletter, Copy BCC List) have `type="button"` to defuse any future form-wrap submit-on-Enter
- [ ] Smoke test on prod: all 5 success-criteria items above pass
- [ ] DB row updated in Neon (if it existed)
- [ ] Asked Tasha about her contact-submissions question (separate thread)

## Deprecated Code Removal

Removed by this PR:

- `src/components/home/FeaturedRecords.tsx` — entire file deleted. Verified only caller is `src/app/page.tsx` (the homepage). The /shop page reads the same `featured_records` table via `getFeaturedRecords()` directly — it does NOT import this component.
- Import of `FeaturedRecords` in `src/app/page.tsx`.

**EXPLICITLY KEPT (do NOT delete or alter):**

- `featured_records` Postgres table — still actively read by `/shop`, `/admin/records`, `scripts/seed.ts`, and `src/lib/actions/records.ts`.
- `src/lib/actions/records.ts` — service layer for CRUD on featured_records. Used by `/shop` and `/admin/records`.
- `src/app/admin/records/page.tsx` — admin UI to edit featured records. Tasha may want to populate them later.
- `src/app/shop/page.tsx` — public consumer of featured_records (categorized).
- `FeaturedRecord` type in `src/types/index.ts:9` — `$inferSelect` from schema.
- `featuredRecords` table definition in `src/lib/db/schema.ts`.

No other dead code surfaces from these edits.

## Anti-Patterns to Avoid

- Don't add a server action for the mailto button; a plain `<a href>` is correct and `mailto:` is a browser-native protocol handler.
- Don't use CC. Always BCC. CC leaks every subscriber's email to every other subscriber.
- Don't include INACTIVE subscribers in the mailto BCC; respect the existing `isActive` flag.
- Don't try to send the newsletter from the server. Tasha explicitly does not want an outbound email integration.
- Don't bundle the deferred env-drift fix or `events.image_url` migration into this PR. Those have separate verification + their own PR.
- Don't remove `<QuickLinks />` — user explicitly overrode the original removal idea.
- Don't `--no-verify` if a precommit hook fails. Investigate.
- Don't push without watching the Netlify build go green.
- **Don't wrap the joined BCC string in `encodeURIComponent`** — that turns separator commas into `%2C` and breaks multi-recipient parsing in some clients (RFC 6068). Encode each address, then join with literal `,`.
- **Don't deploy code first when the `site_settings.store_address` row exists** — the DB value masks the code fallback, so the Visit page would render the OLD address until the DB UPDATE runs. Run Task 6 BEFORE merging in that branch.
- **Don't run raw SQL when the admin /admin/settings UI is available** — using the documented `updateSetting` server action triggers `revalidatePath` automatically, eliminating any RSC-cache risk.
- **Don't drop the `featured_records` table.** The homepage `<FeaturedRecords />` is the only consumer being removed; `/shop`, `/admin/records`, and `scripts/seed.ts` all still read it. Schema stays.
- **Don't let the test subscriber leak into production data** — use `smoketest@example.invalid` (RFC 2606 reserved TLD), and clean up unconditionally in step (f), regardless of whether the admin smoke step succeeded.
- **Don't forget to pre-warn Tasha about server-action-ID staleness** — her loaded admin tab will throw on first server action after deploy. Reload fixes it. The new Compose Newsletter button is unaffected (plain `<a>`), but Toggle/Delete on the same page ARE affected.
- **Don't change the `<a><Button/></a>` nesting pattern in this PR** — it's an existing repo precedent (Export CSV uses it). Fixing it is a separate cleanup PR; doing it here would expand scope.
- **Don't rewrite the NewsletterSignup success-view JSX** — only edit the string at line 26. The error path uses `{message}` from the same state; rewriting the JSX risks breaking error rendering.

## Confidence Score

**9/10** — High confidence this is one-pass implementable after the second review pass.

Reasoning: 4 of the 5 changes are pure text/JSX edits with verified file:line targets. The newsletter button is the only piece of new behavior — now hardened against the actual correctness bug (RFC 6068 per-address encoding), Gmail handler's tighter BCC ceiling (1500 cap), accessibility (visible helper text replaces title=), and the over-limit fallback (Copy BCC List). DB ordering is now explicit and conditional on Task 1a's row-existence check. Button.tsx and settings.ts are now read-and-verified rather than assumed.

Deduction: −1 because the smoke test still depends on a real mail-app launch for full visual verification (the automated `evaluate_script` path catches structural regressions but not handler-specific quirks like Gmail truncation behavior at unusual sizes — which won't bite at Tasha's current ~20 active subs but is a known unknown).

[NEEDS CLARIFICATION] — None. All decisions are settled.
