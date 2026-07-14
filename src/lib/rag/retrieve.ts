/**
 * Hybrid retrieval over the legal corpus: dense (Voyage vectors) fused with
 * keyword scoring. This grounds every legal claim in a real retrieved
 * passage — the first line of "defence in depth" against hallucinated law.
 *
 * Graceful degradation:
 *   - Voyage key present + embedded corpus → hybrid dense + keyword
 *   - otherwise                            → keyword-only (still grounded)
 */
import { hasEmbeddings } from "@/lib/config";
import { embed, cosine } from "@/lib/rag/embed";
import { loadCorpus, type EmbeddedChunk } from "@/lib/rag/corpus";
import type { LegalCode, RetrievedChunk } from "@/lib/types";

const STOP = new Set([
  "the", "a", "an", "of", "to", "in", "for", "and", "or", "is", "on", "my",
  "i", "he", "she", "her", "his", "was", "has", "have", "with", "by", "at",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s()]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

/** Keyword relevance in [0,1]: token overlap, with exact section-number boost. */
function keywordScore(query: string, chunk: EmbeddedChunk): number {
  const q = tokenize(query);
  if (q.length === 0) return 0;
  const hay = tokenize(`${chunk.code} ${chunk.section} ${chunk.title} ${chunk.text}`);
  const haySet = new Set(hay);
  let hits = 0;
  for (const t of q) if (haySet.has(t)) hits++;
  let score = hits / q.length;
  // Exact section reference in the query (e.g. "199", "173(4)") is a strong signal.
  if (query.includes(chunk.section)) score = Math.min(1, score + 0.4);
  return score;
}

export interface RetrieveOpts {
  topK?: number;
  codes?: LegalCode[]; // optionally restrict to certain statute books
}

export async function retrieve(query: string, opts: RetrieveOpts = {}): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? 6;
  let chunks = loadCorpus();
  if (opts.codes?.length) chunks = chunks.filter((c) => opts.codes!.includes(c.code));
  if (chunks.length === 0) return [];

  const keyword = chunks.map((c) => keywordScore(query, c));

  let dense: number[] | null = null;
  const haveVectors = chunks.some((c) => c.embedding?.length);
  if (hasEmbeddings() && haveVectors) {
    try {
      const [qv] = await embed([query], "query");
      dense = chunks.map((c) => (c.embedding?.length ? (cosine(qv, c.embedding) + 1) / 2 : 0));
    } catch {
      dense = null; // fall back to keyword-only on any embedding failure
    }
  }

  const scored = chunks.map((c, i) => {
    const kw = keyword[i];
    const dn = dense ? dense[i] : 0;
    // Weight dense higher when available; keyword keeps exact citations sharp.
    const score = dense ? 0.65 * dn + 0.35 * kw : kw;
    return { ...c, score: Number(score.toFixed(4)) } as RetrievedChunk;
  });

  return scored
    .filter((c) => c.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
