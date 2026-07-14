/**
 * Groq provider — fast, generous free tier. Used for the TEXT agents
 * (Strategy, Drafting, translation). Vision stays on Gemini, so this
 * provider's completeVision intentionally defers.
 *
 * Groq exposes an OpenAI-compatible API.
 */
import { config, hasGroq } from "@/lib/config";
import {
  parseJSON,
  type CompletionOpts,
  type ImageMediaType,
  type LLMProvider,
} from "./types";

const URL = "https://api.groq.com/openai/v1/chat/completions";
const JSON_INSTRUCTION =
  "\n\nRespond with ONLY a single valid JSON object. No prose, no markdown fences.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Msg {
  role: "system" | "user";
  content: string;
}

async function chat(messages: Msg[], opts: CompletionOpts, attempt = 1): Promise<string> {
  if (!hasGroq()) throw new Error("GROQ_API_KEY is not set.");
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.groq.model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 2048,
      }),
    });
  } catch (networkErr) {
    if (attempt <= 5) {
      await sleep(Math.min(20000, attempt * 3000));
      return chat(messages, opts, attempt + 1);
    }
    throw networkErr;
  }
  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
      await sleep(Math.min(20000, attempt * 3000));
      return chat(messages, opts, attempt + 1);
    }
    throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content ?? "";
}

function messages(prompt: string, system?: string): Msg[] {
  return system ? [{ role: "system", content: system }, { role: "user", content: prompt }] : [{ role: "user", content: prompt }];
}

export const groqProvider: LLMProvider = {
  name: `groq:${config.groq.model}`,

  async complete(prompt, opts = {}) {
    return chat(messages(prompt, opts.system), opts);
  },

  async completeJSON<T>(prompt: string, opts: CompletionOpts = {}) {
    return parseJSON<T>(await chat(messages(prompt + JSON_INSTRUCTION, opts.system), opts));
  },

  async completeVision<T>(
    _imageBase64: string,
    _mediaType: ImageMediaType,
    _prompt: string,
    _opts: CompletionOpts = {},
  ): Promise<T> {
    throw new Error("Groq text provider does not do vision — use the vision provider (Gemini).");
  },
};
