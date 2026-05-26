# Changelog

## 2026-05-25 — Tasha review edits (client feedback round)

Source: client video walkthrough + email with a PDF About-page reference.
Branch `fix/tasha-edits` → merged to `main`. Deployed to production
(`second-chance-records.netlify.app`) and verified live.

Commits: `384a2d1`, `864fb53`.

### Changes
- **Home hero CTAs** (`src/components/home/Hero.tsx`): "Upcoming Events" is now the
  highlighted (filled brick) button; "Shop on Discogs" is the secondary (outline)
  button. Button order unchanged (Discogs · Upcoming Events · Visit Us) — only the
  highlight was swapped, per the client's request.
- **Home "Latest News" card** (`src/app/page.tsx`): removed the 3-line `line-clamp`
  and added `whitespace-pre-line` so the full post body shows and the author's
  paragraph breaks render.
- **Reviews "Review on Google" link** (`src/app/reviews/page.tsx`): repointed from a
  generic Google Maps place search to the real write-review composer
  (`search.google.com/local/writereview?placeid=ChIJFeUOHbGhlVQREWaSjf9TUzk`).
- **About page photo** (`src/app/about/page.tsx`, `public/images/tasha.jpg`): added a
  photo of owner Tasha Brain as a `md:float-left` figure inserted immediately before
  the personal `tasha_story` content block, so that paragraph wraps to its right on
  desktop — matching the supplied PDF reference. Photo extracted from the client's PDF.

### Notes / context for future work
- **Paragraph breaks**: public prose renders via `ProseContent` (splits on `\n+`),
  already used on About / Mission / Shop description / Hero. The News card now uses
  `whitespace-pre-line`. To add a paragraph break in the admin editor: press Enter
  (use a blank line / double-Enter for a clear gap), then Cmd/Ctrl+Enter to save.
  Still rendering plain (would collapse newlines) if ever needed: the Shop "blurb"
  field and per-event `description` — left as-is (not requested).
- **Repo location**: active copy is `~/Developer/CODEBASES/integrateAPI/websites/tasha/second-chance-records`.
  The older `~/Desktop/...` copy is iCloud-synced and makes git operations hang —
  do not use it.
- **Deploy**: Netlify auto-builds on push to `main` (the production branch; the repo's
  default branch `redesign` is NOT what's deployed). Database is Neon project
  `super-unit-72722009`.
