/**
 * Zero-knowledge of identifiers — the concrete version of the deck's privacy
 * claim. The moment a document is OCR'd, readable Indian identifiers (Aadhaar,
 * PAN, phone, voter ID) are detected and replaced with masked tokens, keeping
 * ONLY the last-4 + an opaque token. Readable identifiers therefore never:
 *   - propagate to the Strategy / Drafting agents,
 *   - appear in the event log or the UI,
 *   - get persisted.
 *
 * This runs server-side immediately after OCR (see the Document Agent). It is
 * free (pure regex), needs no external service, and is "verify, don't collect"
 * made real for the parts we control.
 */

export type IdType = "aadhaar" | "pan" | "phone" | "voter_id";

/** The only thing we retain for a detected identifier: its type + last 4 + a token. */
export interface VaultEntry {
  type: IdType;
  last4: string;
  token: string;
}

export interface RedactionResult {
  text: string; // identifiers replaced with masked placeholders
  vault: VaultEntry[]; // last-4 + token only — safe to store separately
}

const RULES: { type: IdType; label: string; re: RegExp }[] = [
  // Aadhaar: 12 digits (grouped or not). Checked before phone so it wins.
  { type: "aadhaar", label: "AADHAAR", re: /\b\d{4}\s?\d{4}\s?\d{4}\b/g },
  // PAN: 5 letters, 4 digits, 1 letter.
  { type: "pan", label: "PAN", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  // Voter ID (EPIC): 3 letters + 7 digits.
  { type: "voter_id", label: "VOTER ID", re: /\b[A-Z]{3}\d{7}\b/g },
  // Indian mobile: optional +91, then 6-9 and 9 more digits (allowing a
  // space/hyphen split, e.g. "98765 43210", as documents often write them).
  { type: "phone", label: "PHONE", re: /\b(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g },
];

function makeToken(): string {
  // Opaque, unlinkable handle. In production this maps to a value held in a
  // separate encrypted vault; here we only ever keep the last-4 alongside it.
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `tok_${rnd}`;
}

/** Detect and mask identifiers. Returns masked text + a minimal vault. */
export function redactIdentifiers(input: string): RedactionResult {
  const vault: VaultEntry[] = [];
  let text = input ?? "";

  for (const rule of RULES) {
    text = text.replace(rule.re, (match) => {
      const digits = match.replace(/\D/g, "");
      const last4 = (digits || match).slice(-4);
      const token = makeToken();
      vault.push({ type: rule.type, last4, token });
      return `[${rule.label} ••••${last4}]`;
    });
  }

  return { text, vault };
}
