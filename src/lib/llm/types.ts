/**
 * The LLM provider interface. Every agent talks to this, never to a vendor
 * SDK directly — so switching from free Gemini to commercial Claude (or any
 * other model) is a single swap in `getLLM()`.
 */
export interface CompletionOpts {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

export interface LLMProvider {
  readonly name: string;
  /** Plain text completion. */
  complete(prompt: string, opts?: CompletionOpts): Promise<string>;
  /** Structured completion — returns parsed JSON of type T. */
  completeJSON<T>(prompt: string, opts?: CompletionOpts): Promise<T>;
  /** Vision + OCR: an image plus a prompt, returns parsed JSON of type T. */
  completeVision<T>(
    imageBase64: string,
    mediaType: ImageMediaType,
    prompt: string,
    opts?: CompletionOpts,
  ): Promise<T>;
}

/** Robust JSON extraction that survives stray code fences, leading prose, and
 *  the occasional unescaped newline/tab inside a string value. */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
  // From the first "{" onwards — used for the truncation-salvage path, where the
  // output was cut off before its closing brace so `end` is unreliable.
  const fromStart = start !== -1 ? cleaned.slice(start) : cleaned;

  const attempts = [candidate, repairControlChars(candidate), salvageTruncated(fromStart)];
  for (const attempt of attempts) {
    if (!attempt) continue;
    try {
      return JSON.parse(attempt) as T;
    } catch {
      /* try next */
    }
  }
  throw new Error("Model did not return valid JSON:\n" + raw.slice(0, 400));
}

/** Replace raw control chars (unescaped newlines/tabs inside strings) with spaces. */
function repairControlChars(s: string): string {
  return s.replace(/[\n\r\t\f\v]+/g, " ");
}

/**
 * Salvage a JSON object that was truncated mid-output (common when a token-heavy
 * script overruns the model's max output tokens). Keeps every complete element
 * up to the last clean boundary, drops the incomplete tail, and closes the still
 * open braces/brackets. Returns null if nothing usable can be recovered.
 */
function salvageTruncated(s: string): string | null {
  // Safe truncation points are only where a nested container just CLOSED (a
  // complete element), while at least one container is still open. Cutting after
  // a bare key or a half-written value would produce invalid JSON, so we don't.
  let inStr = false, esc = false, cut = -1;
  const openers: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") openers.push(c);
    else if (c === "}" || c === "]") {
      openers.pop();
      if (openers.length >= 1) cut = i + 1; // a complete inner element; root still open
    }
  }
  if (cut <= 0) return null;
  const head = s.slice(0, cut);
  // Recompute which containers are still open in `head`, then close them (LIFO).
  const need: string[] = [];
  let inS = false, es = false;
  for (const ch of head) {
    if (inS) { if (es) es = false; else if (ch === "\\") es = true; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true;
    else if (ch === "{") need.push("}");
    else if (ch === "[") need.push("]");
    else if (ch === "}" || ch === "]") need.pop();
  }
  return head + need.reverse().join("");
}
