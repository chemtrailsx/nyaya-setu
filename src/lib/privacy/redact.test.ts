import { test } from "node:test";
import assert from "node:assert/strict";
import { redactIdentifiers } from "./redact";

test("masks Aadhaar and keeps only last 4", () => {
  const { text, vault } = redactIdentifiers("Aadhaar 1234 5678 9012 of the applicant");
  assert.ok(!text.includes("1234 5678 9012"), "raw Aadhaar must be gone");
  assert.ok(text.includes("••••9012"));
  assert.equal(vault[0].type, "aadhaar");
  assert.equal(vault[0].last4, "9012");
  assert.ok(vault[0].token.startsWith("tok_"));
});

test("masks PAN", () => {
  const { text, vault } = redactIdentifiers("PAN: ABCDE1234F");
  assert.ok(!text.includes("ABCDE1234F"));
  assert.equal(vault.some((v) => v.type === "pan"), true);
});

test("masks Indian mobile number", () => {
  const { text, vault } = redactIdentifiers("call me on +91 98765 43210");
  assert.ok(text.includes("••••3210"));
  assert.equal(vault.some((v) => v.type === "phone"), true);
});

test("leaves ordinary text untouched", () => {
  const { text, vault } = redactIdentifiers("Appear before the Tehsildar on 14 August.");
  assert.equal(text, "Appear before the Tehsildar on 14 August.");
  assert.equal(vault.length, 0);
});
