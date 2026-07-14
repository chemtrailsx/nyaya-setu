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

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";

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

  for (const attempt of [candidate, repairControlChars(candidate)]) {
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
