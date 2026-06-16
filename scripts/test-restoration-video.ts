import assert from "node:assert";
// RELATIVE import: tsx running scripts/*.ts does NOT resolve the "@/" alias (matches test-parse-emails.ts).
import {
  resolveSettingValue,
  RESTORATION_VIDEO_URL_KEY,
  DEFAULT_RESTORATION_VIDEO_URL,
} from "../src/lib/restoration-video";

let passed = 0;
function check(name: string, actual: string, expected: string) {
  assert.strictEqual(actual, expected, `${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  passed++;
}

const KEY = RESTORATION_VIDEO_URL_KEY;
const FB = "FALLBACK";

// present & non-empty -> the stored value
check("present", resolveSettingValue([{ key: KEY, value: "https://x" }], KEY, FB), "https://x");
// key missing -> fallback
check("missing", resolveSettingValue([{ key: "other", value: "y" }], KEY, FB), FB);
// empty string -> fallback (never render an empty link)
check("empty", resolveSettingValue([{ key: KEY, value: "" }], KEY, FB), FB);
// whitespace only -> fallback
check("whitespace", resolveSettingValue([{ key: KEY, value: "   " }], KEY, FB), FB);
// surrounding whitespace is trimmed off a real value
check("trims", resolveSettingValue([{ key: KEY, value: "  https://x  " }], KEY, FB), "https://x");
// empty settings list -> fallback
check("empty-list", resolveSettingValue([], KEY, FB), FB);
// first matching row wins when duplicated (defensive)
check("first-wins", resolveSettingValue([{ key: KEY, value: "a" }, { key: KEY, value: "b" }], KEY, FB), "a");

// default url sanity
assert.ok(DEFAULT_RESTORATION_VIDEO_URL.startsWith("https://youtu.be/"), "default url is a youtu.be link");
assert.ok(!DEFAULT_RESTORATION_VIDEO_URL.includes("?si="), "default url has the tracking tail stripped");
passed += 2;

console.log(`restoration-video: all ${passed} assertions passed`);
