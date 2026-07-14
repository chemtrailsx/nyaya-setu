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
import type { LLMProvider } from "./types";

/** The base provider chain (used when no role-specific preference applies). */
export function getLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  if (hasGemini()) return geminiProvider;
  if (hasGroq()) return groqProvider;
  return claudeProvider;
}

/** Text agents: prefer Groq for speed + generous quota. */
export function getTextLLM(): LLMProvider {
  if (config.provider === "claude") return claudeProvider;
  if (hasGroq()) return groqProvider;
  if (hasGemini()) return geminiProvider;
  return claudeProvider;
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
