/**
 * LLM entry point with per-ROLE routing. Agents import a role-appropriate
 * provider and never care which vendor is behind it:
 *
 *   - Text (reasoning, drafting, translation) → Groq if configured (fast,
 *     generous free tier), else Gemini, else Claude.
 *   - Vision (OCR) → Gemini (best multilingual/Indic OCR), else Claude, else
 *     Groq (which will report it can't).
 *
 * On commercialisation, set ANTHROPIC_API_KEY + LLM_PROVIDER=claude and both
 * roles route to Claude — no agent code changes.
 */
import { config, hasGroq, hasGemini, hasAnthropic } from "@/lib/config";
import { geminiProvider } from "./gemini";
import { claudeProvider } from "./claude";
import { groqProvider } from "./groq";
import type { CompletionOpts, ImageMediaType, LLMProvider } from "./types";

/**
 * Wrap several providers so a call tries each in order until one succeeds.
 * If the primary is rate-limited (e.g. Groq's daily token cap), the call
 * transparently falls back to the next provider — the pipeline never breaks
 * on a single provider's quota.
 */
function withFallback(providers: LLMProvider[]): LLMProvider {
  const run = async <T>(fn: (p: LLMProvider) => Promise<T>): Promise<T> => {
    let lastErr: unknown;
    for (const p of providers) {
      try {
        return await fn(p);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };
  return {
    name: providers.map((p) => p.name).join(" → "),
    complete: (prompt: string, opts?: CompletionOpts) => run((p) => p.complete(prompt, opts)),
    completeJSON: <T>(prompt: string, opts?: CompletionOpts) => run((p) => p.completeJSON<T>(prompt, opts)),
    completeVision: <T>(b: string, m: ImageMediaType, prompt: string, opts?: CompletionOpts) =>
      run((p) => p.completeVision<T>(b, m, prompt, opts)),
  };
}

/** The base provider chain (used when no role-specific preference applies). */
export function getLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  if (hasGemini()) return geminiProvider;
  if (hasGroq()) return groqProvider;
  return claudeProvider;
}

/** Text agents: Groq first (fast), then Gemini, then Claude — with fallback. */
export function getTextLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  const chain: LLMProvider[] = [];
  if (hasGroq()) chain.push(groqProvider);
  if (hasGemini()) chain.push(geminiProvider);
  if (hasAnthropic()) chain.push(claudeProvider);
  if (chain.length === 0) return claudeProvider;
  return chain.length === 1 ? chain[0] : withFallback(chain);
}

/** Free-form vernacular chat: prefer Gemini (most reliable Indic-script
 *  generation; Groq's smaller models can degenerate on Devanagari-heavy input),
 *  then Groq, then Claude — with fallback. */
export function getChatLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  const chain: LLMProvider[] = [];
  if (hasGemini()) chain.push(geminiProvider);
  if (hasGroq()) chain.push(groqProvider);
  if (hasAnthropic()) chain.push(claudeProvider);
  if (chain.length === 0) return claudeProvider;
  return chain.length === 1 ? chain[0] : withFallback(chain);
}

/** Vision/OCR: prefer Gemini (best Indic OCR). */
export function getVisionLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  if (hasGemini()) return geminiProvider;
  if (hasAnthropic()) return claudeProvider;
  return groqProvider; // will report vision isn't supported
}

/** Default singleton = text provider (used by strategy/drafting/tracking). */
export const llm = getTextLLM();

export type { LLMProvider, CompletionOpts } from "./types";
