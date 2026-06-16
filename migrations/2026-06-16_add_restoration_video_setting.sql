-- 2026-06-16: seed the Community "Record Care" video link as an editable site setting.
-- The Community page renders a hardcoded fallback when this row is absent/empty; seeding it here makes
-- the URL editable in /admin/settings (updateSetting is UPDATE-only, so the row must exist first).
-- Idempotent: ON CONFLICT (key) DO NOTHING so re-running never overwrites Tasha's later edits.
-- "group" is double-quoted because it is a SQL reserved word (the column is literally named group).
INSERT INTO site_settings (key, value, label, "group")
VALUES (
  'community_restoration_video_url',
  'https://youtu.be/wWO2m3AEWFA',
  'Record cleaning video link (Community page)',
  'general'
)
ON CONFLICT (key) DO NOTHING;
