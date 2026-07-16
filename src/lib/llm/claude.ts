/**
 * Anthropic Claude provider — the commercialisation swap. Not used while
 * running on the free tier; it activates only when ANTHROPIC_API_KEY is set
 * (and LLM_PROVIDER=claude, or no Gemini key exists). Same interface as
 * Gemini, so no agent code changes when swapping.
 */
import Anthropic from "@anthropic-ai/sdk";
import { config, hasAnthropic } from "@/lib/config";
import {
  parseJSON,
  type CompletionOpts,
  type ImageMediaType,
  type LLMProvider,
} from "./types";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!hasAnthropic()) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  client ??= new Anthropic({ apiKey: config.anthropic.apiKey });
  return client;
}

async function text(
  content: Anthropic.MessageParam["content"],
  opts: CompletionOpts,
  json: boolean,
): Promise<string> {
  const res = await getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.2,
    system:
      (opts.system ? opts.system + "\n\n" : "") +
      (json ? "Respond with ONLY a single valid JSON object. No prose, no fences." : ""),
    messages: [{ role: "user", content }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export const claudeProvider: LLMProvider = {
  name: `claude:${config.anthropic.model}`,

  async complete(prompt, opts = {}) {
    return text(prompt, opts, false);
  },

  async completeJSON<T>(prompt: string, opts: CompletionOpts = {}) {
    return parseJSON<T>(await text(prompt, opts, true));
  },

  async completeVision<T>(
    imageBase64: string,
    mediaType: ImageMediaType,
    prompt: string,
    opts: CompletionOpts = {},
  ) {
    // Anthropic takes PDFs via a document block, images via an image block.
    const block: Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam =
      mediaType === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
        : { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } };
    const raw = await text([block, { type: "text", text: prompt }], { temperature: 0, ...opts }, true);
    return parseJSON<T>(raw);
  },
};
