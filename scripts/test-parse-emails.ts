import assert from "node:assert/strict";
import { parseEmails } from "../src/lib/parse-emails"; // RELATIVE: matches scripts/seed.ts, no @/ alias reliance

let failures = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures++;
    console.error(`FAIL  ${name}\n`, e instanceof Error ? e.message : String(e));
  }
}

// Verbatim 16-row fixture Tasha sent: header row + mostly email-only + two named rows (names in
// their own tab columns) + the jairmtaylor@gmail.con typo. Real \t and \n.
const TASHA_SHEET = [
  "Reference ID\tFirst Name\tLast Name\tEmail Address",
  "\t\t\tanita.wente@gmail.com",
  "\t\t\tarchie.tera97@gmail.com",
  "\t\t\tcrazythey246810@gmail.com",
  "\t\t\tdileepfrog@gmail.com",
  "\t\t\tdlavarda@gensco.com",
  "\t\t\tfrogrod@gmail.com",
  "\t\t\tjairmtaylor@gmail.con",
  "\t\t\tkeithremmons@gmail.com",
  "\t\t\tkyle.psychnp@gmail.com",
  "\tAlexander\tJohnson\tmassagepower@yahoo.com",
  "\t\t\trninpdx@gmail.com",
  "\t\t\tsoniapham3@gmail.com",
  "\tSteven\tNorthcutt\tstv@mac.com",
  "\t\t\tvandykbusiness@gmail.com",
  "\t\t\tvictor.le@tuta.io",
  "\t\t\tzurivrivera@gmail.com",
].join("\n");

check("tasha sheet: 15 valid + 1 flagged + 0 invalid, header & names & RefID dropped", () => {
  const r = parseEmails(TASHA_SHEET);
  assert.equal(r.valid.length, 15);
  assert.equal(r.flagged.length, 1);
  assert.equal(r.invalid.length, 0);
  assert.equal(r.valid.length + r.flagged.length + r.invalid.length, 16); // nothing leaked, nothing dropped
  assert.equal(r.flagged[0].email, "jairmtaylor@gmail.con");
  assert.match(r.flagged[0].reason, /com/); // TLD-typo path won (.con→.com)
  assert.ok(r.valid.includes("massagepower@yahoo.com")); // named row → email only
  // negative typo assertions: real fixture domains must NOT be flagged (fail-closes the allowlist)
  assert.ok(r.valid.includes("stv@mac.com"));
  assert.ok(r.valid.includes("dlavarda@gensco.com"));
  assert.ok(r.valid.includes("victor.le@tuta.io"));
});

check("single column (one per line)", () => {
  const r = parseEmails("a@x.com\nb@y.com\nc@z.com");
  assert.deepEqual(r.valid, ["a@x.com", "b@y.com", "c@z.com"]);
});
check("comma list", () => {
  const r = parseEmails("a@x.com, b@y.com,c@z.com");
  assert.deepEqual(r.valid, ["a@x.com", "b@y.com", "c@z.com"]);
});
check("multiple emails on one line (tabs + spaces)", () => {
  const r = parseEmails("a@x.com\tb@y.com c@z.com");
  assert.deepEqual(r.valid, ["a@x.com", "b@y.com", "c@z.com"]);
});
check("Name <email> angle brackets", () => {
  const r = parseEmails("Foo Bar <foo@bar.com>");
  assert.deepEqual(r.valid, ["foo@bar.com"]);
});
check("glued prefix Email:addr and (addr)", () => {
  const r = parseEmails("Email:a@b.com\nName(c@d.com)");
  assert.deepEqual(r.valid, ["a@b.com", "c@d.com"]);
});
check("plus-addressing and subdomain ccTLD stay valid, not flagged", () => {
  const r = parseEmails("a+tag@x.com\nuser@sub.example.co.uk");
  assert.deepEqual(r.valid, ["a+tag@x.com", "user@sub.example.co.uk"]);
  assert.equal(r.flagged.length, 0);
});
check("mixed-case dedupe → one valid", () => {
  const r = parseEmails("A@X.com\na@x.com");
  assert.deepEqual(r.valid, ["a@x.com"]);
});
check("trailing punctuation / wrappers stripped", () => {
  const r = parseEmails('"a@b.com", <c@d.com>; e@f.com.');
  assert.deepEqual(r.valid, ["a@b.com", "c@d.com", "e@f.com"]);
});
check("malformed → invalid (no dot, empty labels, trailing dot, short TLD)", () => {
  const r = parseEmails("foo@bar\nx@y..com\nx@.y.com\nx@y.");
  assert.deepEqual(r.invalid.sort(), ["foo@bar", "x@y", "x@y..com", "x@.y.com"].sort());
  assert.equal(r.valid.length, 0);
});
check("paste noise (lone @, x@, @y) dropped, not counted invalid", () => {
  const r = parseEmails("O'Brien @ Front Desk\nx@\n@y");
  assert.equal(r.valid.length, 0);
  assert.equal(r.flagged.length, 0);
  assert.equal(r.invalid.length, 0);
});
check("apostrophe in local part preserved (Irish names not silently truncated)", () => {
  const r = parseEmails("o'connor@gmail.com\nMary O'Brien <mob@example.com>");
  assert.deepEqual(r.valid, ["o'connor@gmail.com", "mob@example.com"]);
});
check("quote-wrapped email cleaned; possessive 's not mis-bucketed as valid", () => {
  const r = parseEmails("'a@b.com'\nfoo@bar.com's list");
  assert.ok(r.valid.includes("a@b.com")); // wrapper apostrophes stripped → clean
  assert.ok(!r.valid.includes("foo@bar.com's")); // possessive suffix → not valid
  assert.ok(r.invalid.includes("foo@bar.com's")); // apostrophe in domain → invalid
});
check("leading-dot local is invalid, not silently mangled to a different mailbox", () => {
  const r = parseEmails(".john@x.com");
  assert.equal(r.valid.length, 0);
  assert.deepEqual(r.invalid, [".john@x.com"]);
});
check("real lookalike domains (ymail.com, email.com) are NOT flagged", () => {
  const r = parseEmails("a@ymail.com\nb@email.com");
  assert.deepEqual(r.valid, ["a@ymail.com", "b@email.com"]);
  assert.equal(r.flagged.length, 0);
});
check("underscore / non-hostname char in domain is invalid", () => {
  const r = parseEmails("a@b_c.com");
  assert.deepEqual(r.invalid, ["a@b_c.com"]);
});
check("empty / whitespace-only → all buckets empty", () => {
  for (const t of ["", "   \n\t  "]) {
    const r = parseEmails(t);
    assert.equal(r.valid.length + r.flagged.length + r.invalid.length, 0);
  }
});
check("typo flagging: con-TLD + OSA transposition/substitution/deletion", () => {
  for (const e of ["a@gmail.con", "a@gmial.com", "a@gnail.com", "a@gmai.com", "a@hotmial.com", "a@yaho.com", "a@outlok.com"]) {
    const r = parseEmails(e);
    assert.equal(r.flagged.length, 1, `${e} should be flagged`);
    assert.equal(r.valid.length, 0, `${e} should not be valid`);
  }
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nall parse-emails tests passed");
