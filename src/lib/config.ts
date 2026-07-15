/**
 * Central, typed configuration. Reads once from the environment so the rest
 * of the codebase never touches `process.env` directly.
 *
 * FREE-FIRST: the default provider is Google Gemini (genuinely free tier via
 * AI Studio) for LLM + vision OCR + embeddings. The Anthropic/Claude path is
 * kept behind the same interface as the paid "commercialisation" swap — set
 * `ANTHROPIC_API_KEY` and it takes over with no other code change.
 */

function clean(name: string): string {
  const v = process.env[name];
  if (!v || v.includes("xxxx")) return "";
  return v;
}

const geminiKey = clean("GEMINI_API_KEY") || clean("GOOGLE_API_KEY");
const anthropicKey = clean("ANTHROPIC_API_KEY");
const groqKey = clean("GROQ_API_KEY");

// Prefer the free provider by default; Claude only if it is explicitly set
// AND the user opts in (LLM_PROVIDER=claude) or no Gemini key exists.
const provider: "gemini" | "claude" =
  process.env.LLM_PROVIDER === "claude" || (!geminiKey && anthropicKey)
    ? "claude"
    : "gemini";

export const config = {
  provider,
  gemini: {
    apiKey: geminiKey,
    model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    embedModel: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
  },
  anthropic: {
    apiKey: anthropicKey,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
  },
  groq: {
    apiKey: groqKey,
    model: process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  providers: {
    njdg: (process.env.NJDG_ECOURTS_MODE || "simulated") as "simulated" | "live",
    ekyc: (process.env.EKYC_MODE || "simulated") as "simulated" | "live",
    whatsapp: (process.env.WHATSAPP_MODE || "simulated") as "simulated" | "live",
  },
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || "0.72"),
} as const;

export const hasGemini = () => config.gemini.apiKey.length > 0;
export const hasAnthropic = () => config.anthropic.apiKey.length > 0;
export const hasGroq = () => config.groq.apiKey.length > 0;
/** Any LLM configured at all? */
export const hasLLM = () => hasGemini() || hasAnthropic() || hasGroq();
/** Embeddings available? (only Gemini free embeddings for now) */
export const hasEmbeddings = () => hasGemini();
export const hasSupabase = () =>
  config.supabase.url.length > 0 && config.supabase.serviceKey.length > 0;
