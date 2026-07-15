import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKey, encrypt, decrypt } from "./crypto";

test("AES-GCM round-trips (client-side E2E)", async () => {
  const key = await generateKey();
  const secret = "Aadhaar 1234 5678 9012 — Radha Devi";
  const payload = await encrypt(secret, key);
  assert.notEqual(payload, secret, "ciphertext must not equal plaintext");
  assert.ok(!payload.includes("1234"), "ciphertext must not leak the value");
  const back = await decrypt(payload, key);
  assert.equal(back, secret);
});

test("different keys cannot decrypt each other's ciphertext", async () => {
  const k1 = await generateKey();
  const k2 = await generateKey();
  const payload = await encrypt("secret", k1);
  await assert.rejects(() => decrypt(payload, k2));
});
