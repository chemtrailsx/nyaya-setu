/**
 * Google Gemini provider — the FREE default (AI Studio key, generous free
 * tier). Handles text, JSON-structured output, and vision OCR via the REST
 * API, so no vendor SDK dependency is required.
 */
import { config, hasGemini } from "@/lib/config";
import {
  parseJSON,
  type CompletionOpts,
  type ImageMediaType,
  type LLMProvider,
} from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

// NOTE: we deliberately do NOT use `responseMimeType: application/json`. On
// longer generations that mode emitted malformed JSON with this model; plain
// text + a "JSON only" instruction + robust fence-stripping parse is reliable.
const JSON_INSTRUCTION =
  "\n\nRespond with ONLY a single valid JSON object. No prose, no markdown fences, and escape all newlines inside string values.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generate(parts: GeminiPart[], opts: CompletionOpts, attempt = 1): Promise<string> {
  if (!hasGemini()) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and add it to .env.local.",
    );
  }
  const body = {
    contents: [{ role: "user", parts }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 2048,
    },
  };
  let res: Response;
  try {
    res = await fetch(
      `${BASE}/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } catch (networkErr) {
    // fetch() itself threw (dropped connection / TLS blip / "fetch failed") —
    // this is transient, so back off and retry rather than failing the run.
    if (attempt <= 5) {
      await sleep(Math.min(20000, attempt * 3000));
      return generate(parts, opts, attempt + 1);
    }
    throw networkErr;
  }
  if (!res.ok) {
    // 429 (rate) / 503 (overloaded) / 5xx are transient — back off and retry.
    if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
      await sleep(Math.min(20000, attempt * 3000));
      return generate(parts, opts, attempt + 1);
    }
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  );
}

export const geminiProvider: LLMProvider = {
  name: `gemini:${config.gemini.model}`,

  async complete(prompt, opts = {}) {
    return generate([{ text: prompt }], opts);
  },

  async completeJSON<T>(prompt: string, opts: CompletionOpts = {}) {
    const raw = await generate([{ text: prompt + JSON_INSTRUCTION }], opts);
    return parseJSON<T>(raw);
  },

  async completeVision<T>(
    imageBase64: string,
    mediaType: ImageMediaType,
    prompt: string,
    opts: CompletionOpts = {},
  ) {
    const raw = await generate(
      [
        { inline_data: { mime_type: mediaType, data: imageBase64 } },
        { text: prompt + JSON_INSTRUCTION },
      ],
      { temperature: 0, ...opts },
    );
    return parseJSON<T>(raw);
  },
};
