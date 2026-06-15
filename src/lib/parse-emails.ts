/** Popular consumer providers we typo-check against. Intentionally short — these cover the
 *  overwhelming majority of a record store's subscribers. Flagging is best-effort: a typo of
 *  an off-list domain is NOT flagged, so "flagged" means "some typos caught", never "all". */
const POPULAR_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];

/** Real domains that happen to sit OSA-distance-1 from a popular provider — never flag these as
 *  typos. ymail.com is Yahoo's own alternate domain; email.com is a real ESP. Both are a single
 *  edit from gmail.com and would otherwise false-flag real subscribers. */
const LOOKALIKE_ALLOWLIST = new Set(["ymail.com", "email.com"]);

/** Unambiguous TLD typos → intended TLD. Conservative: .co (Colombia) and .cm (Cameroon) are real
 *  TLDs so they are NOT mapped here — though the OSA pass may still flag e.g. gmail.co as an
 *  advisory lookalike of gmail.com (which is, in practice, almost always a typo). */
const TLD_TYPOS: Record<string, string> = { con: "com", comm: "com", ocm: "com", vom: "com", xom: "com", cmo: "com" };

/** Runs of anything that cannot appear in the addr-spec we care about. Splitting on this
 *  extracts email-shaped tokens from ANY layout (tab/comma/newline/angle-bracket/glued-prefix).
 *  The apostrophe is IN the alphabet so an Irish-style local part (o'connor@x.com) survives whole
 *  — splitting on it would silently yield a different, valid-looking address (connor@x.com). */
const NON_EMAIL_CHARS = /[^a-z0-9._%+\-'@]+/i;

/** Coarse shape gate: one @, non-empty local, a dot in the domain. Refined by isValidFormat. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface FlaggedEmail {
  email: string;
  reason: string;
}

export interface EmailParseResult {
  valid: string[];
  flagged: FlaggedEmail[];
  invalid: string[];
}

/**
 * Turns whatever Tasha pastes (Excel rows, a single column, a comma list, `Name <email>` lines,
 * `Email:` glued prefixes) into three disjoint buckets: { valid, flagged, invalid }. This is the
 * load-bearing extraction core that Part 2's preview and import both hang off.
 *
 * Extraction works by splitting on runs of non-email characters, which makes it layout-agnostic
 * AND closes the glued-prefix hole (`Email:a@b.com`, `Name(a@b.com)`) for free — the `:` / `(`
 * are non-email chars, so they become split boundaries. Every email returned is normalized
 * (lowercased, wrapper-free) and deduped first-seen-wins across the whole result.
 *
 * `valid` and `flagged` are DISJOINT; the importable set in Part 2 is valid ∪ flagged emails.
 * isValidFormat is a PRE-FILTER only — the insert boundary's z.string().email() is authoritative.
 */
export function parseEmails(text: string): EmailParseResult {
  const result: EmailParseResult = { valid: [], flagged: [], invalid: [] };
  const seen = new Set<string>();

  for (const token of text.split(NON_EMAIL_CHARS)) {
    if (!token.includes("@")) continue; // not an email attempt → ignore
    // strip wrapper apostrophes ('a@b.com') and trailing sentence dots (a@b.com.). NOT leading
    // dots: a leading-dot local (.john@x.com) is malformed and must fall to `invalid`, not be
    // silently rewritten into a different valid-looking mailbox (john@x.com).
    const email = token.replace(/^'+/, "").replace(/['.]+$/, "").toLowerCase();
    const at = email.indexOf("@");
    if (at <= 0 || at >= email.length - 1) continue; // "@x" / "x@" → paste noise, drop
    if (seen.has(email)) continue; // dedupe within paste, first-seen wins
    seen.add(email);

    if (!isValidFormat(email)) {
      result.invalid.push(email);
      continue;
    }
    const reason = typoReason(email);
    if (reason) result.flagged.push({ email, reason });
    else result.valid.push(email);
  }
  return result;
}

/**
 * Pre-filter (NOT a full RFC validator — Part 2's z.string().email() is authoritative at the
 * insert boundary). Rejects the malformed shapes a paste commonly produces: empty domain labels
 * (a@b..com, a@.b.com), leading/trailing/double dot in local, and 1-char TLDs (a@b.c).
 */
function isValidFormat(email: string): boolean {
  if (!EMAIL_RE.test(email)) return false;
  const at = email.indexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const labels = domain.split(".");
  // every domain label must be a hostname label: rejects empty labels (leading/trailing/double dot)
  // AND non-hostname chars that are legal in a LOCAL part but not a domain (apostrophe, underscore).
  if (labels.some((l) => !/^[a-z0-9-]+$/.test(l))) return false;
  if (labels[labels.length - 1].length < 2) return false; // TLD must be ≥2 chars
  return true;
}

/**
 * Human-friendly typo reason, or null. (1) known TLD typo (.con→.com) checked FIRST so its
 * clearer message wins over the OSA path for e.g. gmail.con; (2) OSA-distance-1 from a popular
 * domain. OSA (not plain Levenshtein) so an adjacent transposition like gmial↔gmail is 1, not 2.
 */
function typoReason(email: string): string | null {
  const domain = email.slice(email.indexOf("@") + 1);
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (TLD_TYPOS[tld]) return `domain ends in .${tld} — did you mean .${TLD_TYPOS[tld]}?`;
  if (LOOKALIKE_ALLOWLIST.has(domain)) return null; // real domain near a popular one — don't false-flag
  for (const popular of POPULAR_DOMAINS) {
    if (domain !== popular && osaDistance(domain, popular) === 1) return `looks like a typo of ${popular}`;
  }
  return null;
}

/**
 * Optimal String Alignment distance: Levenshtein + adjacent transposition as ONE op. The
 * transposition clause is what makes gmial↔gmail distance 1 instead of 2. Iterative DP; types
 * explicit so tsc strict stays clean (noUncheckedIndexedAccess is OFF, so d[i][j] is number).
 */
function osaDistance(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}
