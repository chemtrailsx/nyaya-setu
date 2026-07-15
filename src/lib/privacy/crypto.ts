/**
 * Client-side end-to-end encryption using the browser's native Web Crypto API
 * (AES-256-GCM). Sensitive values the user enters are encrypted ON THEIR DEVICE
 * before anything could be sent or stored — the server only ever holds
 * ciphertext, and only a holder of the key can read it. Free, no dependency.
 *
 * Honest scope: the uploaded document image itself is NOT E2E — our OCR must
 * read it (then it is purged). This protects user-entered data and any record
 * we would persist.
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Generate a fresh AES-256-GCM key (kept only on the device). */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Derive a key from a passphrase (PBKDF2) — e.g. a user PIN. */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ENC.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt a string → base64 payload of iv + ciphertext. Never leaves plaintext. */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENC.encode(plaintext)),
  );
  const payload = new Uint8Array(iv.length + ct.length);
  payload.set(iv, 0);
  payload.set(ct, iv.length);
  return toB64(payload);
}

/** Decrypt a base64 payload produced by {@link encrypt}. */
export async function decrypt(payloadB64: string, key: CryptoKey): Promise<string> {
  const payload = fromB64(payloadB64);
  const iv = payload.slice(0, 12);
  const ct = payload.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct as BufferSource);
  return DEC.decode(pt);
}
