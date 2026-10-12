"use strict";
const assert = require("assert");
const crypto = require("crypto");
const hash = require("./multihasher.js");

for (const value of ["", "abc", "hello 🌍"]) {
  assert.strictEqual(hash.sha256(value), crypto.createHash("sha256").update(value).digest("hex"));
  assert.strictEqual(hash.sha3_512(value), crypto.createHash("sha3-512").update(value).digest("hex"));
}
hash.sha512("abc").then((digest) => {
  assert.strictEqual(digest, crypto.createHash("sha512").update("abc").digest("hex"));
  return hash.hashFile(new TextEncoder().encode("abc").buffer, "sha-512");
}).then((digest) => {
  assert.strictEqual(digest, crypto.createHash("sha512").update("abc").digest("hex").toUpperCase());
  console.log("All MultiHasherJS tests passed.");
});
assert.strictEqual(hash.multiHashLines("a\nb", { repeats: 2, levels: 3 }).length, 2);
assert.match(hash.multiHash("hello"), /^[0-9A-F]{128}$/);
assert.match(hash.multiHash("hello", { truncate: true }), /^[0-9A-F]{1,16}$/);
