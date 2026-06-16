/**
 * Constants + a pure resolver for the Community page "Record Care" video card.
 *
 * The video URL is overridable via a `site_settings` row (so Tasha can re-point the video without a
 * deploy); the title/blurb are overridable via `page_content` / InlineEditor. Everything here is the
 * HARDCODED fallback so the card always renders even with zero DB state. This module is intentionally
 * pure (no imports, no `"use server"`, no DB) so it is safe to import from a server component AND from
 * a tsx unit-test script.
 */

/** site_settings key holding the (admin-editable) record-cleaning video URL. */
export const RESTORATION_VIDEO_URL_KEY = "community_restoration_video_url";

/** Cleaned share link (the `?si=` tracking tail is intentionally stripped). */
export const DEFAULT_RESTORATION_VIDEO_URL = "https://youtu.be/wWO2m3AEWFA";
export const DEFAULT_RESTORATION_VIDEO_TITLE = "How to Clean a Record";
export const DEFAULT_RESTORATION_VIDEO_BLURB =
  "Watch our quick guide to cleaning and caring for your vinyl.";

/**
 * Returns the trimmed value of `key` from a settings list when it exists and is non-empty, otherwise
 * the fallback. This is the load-bearing safety net: if the row is missing, empty, or whitespace, the
 * card silently falls back to the hardcoded default instead of rendering a broken/empty link.
 *
 * Param type is the structural minimum (`{ key, value }`) so the full `SiteSetting[]` from
 * `getSettings()` assigns to it without coupling this pure helper to the Drizzle row type.
 */
export function resolveSettingValue(
  settings: { key: string; value: string }[],
  key: string,
  fallback: string,
): string {
  const value = settings.find((s) => s.key === key)?.value.trim();
  return value ? value : fallback;
}
