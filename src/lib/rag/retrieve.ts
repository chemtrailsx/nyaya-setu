/**
 * Hybrid retrieval over the legal corpus: BM25 lexical ranking fused with an
 * optional dense (embedding) bonus. This grounds every legal claim in a real
 * retrieved passage — the first line of "defence in depth" against
 * hallucinated law.
 *
 * BM25 is the always-on base (free, no quota, serverless-friendly). When
 * embeddings exist for a chunk, a semantic bonus refines the ranking.
 */
import { hasEmbeddings } from "@/lib/config";
import { embed, cosine } from "@/lib/rag/embed";
import { loadCorpus } from "@/lib/rag/corpus";
import { bm25Search } from "@/lib/rag/bm25";
import type { LegalCode, RetrievedChunk } from "@/lib/types";

export interface RetrieveOpts {
  topK?: number;
  codes?: LegalCode[]; // optionally restrict to certain statute books
  preferCodes?: LegalCode[]; // boost (don't filter) these books — category-aware
}

/** Squash a raw score into a meaningful 0..1 relevance (top isn't forced to 1). */
const saturate = (x: number) => x / (x + 12);

export async function retrieve(query: string, opts: RetrieveOpts = {}): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? 6;
  const chunks = loadCorpus();
  if (chunks.length === 0) return [];

  const lexical = bm25Search(query);
  if (lexical.length === 0) return [];

  // Dense bonus over the top lexical candidates that have embeddings.
  const denseBonus = new Map<number, number>();
  const candidates = lexical.slice(0, 40);
  if (hasEmbeddings() && candidates.some((h) => chunks[h.idx].embedding?.length)) {
    try {
      const [qv] = await embed([query], "query");
      for (const h of candidates) {
        const emb = chunks[h.idx].embedding;
        if (emb?.length) denseBonus.set(h.idx, ((cosine(qv, emb) + 1) / 2) * 8); // 0..8 bonus
      }
    } catch {
      /* keep BM25-only on any embedding failure */
    }
  }

  const prefer = new Set(opts.preferCodes ?? []);
  let scored: RetrievedChunk[] = candidates.map((h) => {
    const raw = h.score + (denseBonus.get(h.idx) ?? 0);
    // Category-aware boost: we know the case type, so up-weight the statute
    // books that actually govern it (e.g. succession law for an inheritance case).
    const boosted = prefer.has(chunks[h.idx].code) ? raw * 1.7 : raw;
    return { ...chunks[h.idx], score: Number(saturate(boosted).toFixed(4)) };
  });

  if (opts.codes?.length) scored = scored.filter((c) => opts.codes!.includes(c.code));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
