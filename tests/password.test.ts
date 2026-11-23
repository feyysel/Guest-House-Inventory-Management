import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

test("hashPassword produces a salted scrypt hash", () => {
  const first = hashPassword("correct horse battery staple");
  const second = hashPassword("correct horse battery staple");

  assert.match(first, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.notEqual(first, second);
});

test("verifyPassword accepts the matching password only", () => {
  const stored = hashPassword("Admin@123");

  assert.equal(verifyPassword("Admin@123", stored), true);
  assert.equal(verifyPassword("Admin@124", stored), false);
  assert.equal(verifyPassword("admin@123", stored), false);
});

test("verifyPassword rejects malformed stored values", () => {
  assert.equal(verifyPassword("anything", "plaintext"), false);
  assert.equal(verifyPassword("anything", "scrypt:salt"), false);
  assert.equal(verifyPassword("anything", "bcrypt:salt:hash"), false);
});
