/**
 * Embeddings via Gemini's free `text-embedding-004` (same AI Studio key as the
 * LLM — no extra signup, no cost). Used at ingest time to build the index and
 * at query time to embed the question. If no key is present, retrieval falls
 * back to keyword search.
 */
import { config, hasEmbeddings } from "@/lib/config";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Embed a batch of texts. `query` uses a retrieval-optimised task type. */
export async function embed(
  texts: string[],
  kind: "document" | "query" = "document",
): Promise<number[][]> {
  if (!hasEmbeddings()) throw new Error("No embeddings provider configured (set GEMINI_API_KEY)");
  const model = `models/${config.gemini.embedModel}`;
  const taskType = kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";

  const res = await fetch(
    `${BASE}/${model}:batchEmbedContents?key=${config.gemini.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((t) => ({
          model,
          content: { parts: [{ text: t }] },
          taskType,
          outputDimensionality: 768,
        })),
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini embeddings failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { embeddings: { values: number[] }[] };
  return json.embeddings.map((e) => e.values);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
