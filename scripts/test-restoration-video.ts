import assert from "node:assert";
// RELATIVE import: tsx running scripts/*.ts does NOT resolve the "@/" alias (matches test-parse-emails.ts).
import {
  resolveSettingValue,
  resolveVideoUrl,
  isHttpUrl,
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

// isHttpUrl: only absolute http(s) URLs are valid
function checkBool(name: string, actual: boolean, expected: boolean) {
  assert.strictEqual(actual, expected, `${name}: expected ${expected}, got ${actual}`);
  passed++;
}
checkBool("https ok", isHttpUrl("https://youtu.be/wWO2m3AEWFA"), true);
checkBool("http ok", isHttpUrl("http://example.com"), true);
checkBool("scheme-less rejected", isHttpUrl("youtu.be/wWO2m3AEWFA"), false);
checkBool("javascript rejected", isHttpUrl("javascript:alert(1)"), false);
checkBool("garbage rejected", isHttpUrl("not a url"), false);
checkBool("empty rejected", isHttpUrl(""), false);

// resolveVideoUrl: stored value only when it is a valid http(s) URL, else the default
check("video valid stored", resolveVideoUrl([{ key: KEY, value: "https://youtu.be/abc" }]), "https://youtu.be/abc");
check("video scheme-less -> default", resolveVideoUrl([{ key: KEY, value: "youtu.be/abc" }]), DEFAULT_RESTORATION_VIDEO_URL);
check("video javascript -> default", resolveVideoUrl([{ key: KEY, value: "javascript:alert(1)" }]), DEFAULT_RESTORATION_VIDEO_URL);
check("video missing -> default", resolveVideoUrl([]), DEFAULT_RESTORATION_VIDEO_URL);
check("video empty -> default", resolveVideoUrl([{ key: KEY, value: "" }]), DEFAULT_RESTORATION_VIDEO_URL);

console.log(`restoration-video: all ${passed} assertions passed`);
