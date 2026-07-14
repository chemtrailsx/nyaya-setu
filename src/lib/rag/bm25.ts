/**
 * BM25 lexical retrieval over the legal corpus. This is the free, serverless-
 * friendly ranker that works with no embedding quota. It's a large quality
 * jump over naive token-overlap: rare, discriminating terms (e.g. "mutation",
 * "intestate", "cognizable") are weighted up via IDF, and common words down.
 */
import { loadCorpus, type EmbeddedChunk } from "./corpus";

const K1 = 1.5;
const B = 0.75;

const STOP = new Set([
  "the", "a", "an", "of", "to", "in", "for", "and", "or", "is", "on", "my", "i",
  "he", "she", "her", "his", "was", "has", "have", "with", "by", "at", "as", "be",
  "any", "such", "shall", "which", "that", "this", "under", "from", "are", "not",
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s()]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

interface Bm25Index {
  chunks: EmbeddedChunk[];
  tf: Map<string, number>[]; // per-doc term frequencies
  idf: Map<string, number>;
  avgLen: number;
  docLen: number[];
}

let index: Bm25Index | null = null;

function build(): Bm25Index {
  const chunks = loadCorpus();
  const tf: Map<string, number>[] = [];
  const df = new Map<string, number>();
  const docLen: number[] = [];

  for (const c of chunks) {
    const toks = tokenize(`${c.code} ${c.section} ${c.title} ${c.text}`);
    docLen.push(toks.length);
    const counts = new Map<string, number>();
    for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1);
    tf.push(counts);
    for (const t of counts.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const N = chunks.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log(1 + (N - d + 0.5) / (d + 0.5)));
  const avgLen = docLen.reduce((a, b) => a + b, 0) / (N || 1);

  return { chunks, tf, idf, avgLen, docLen };
}

export interface LexicalHit {
  idx: number;
  score: number; // raw BM25 (+ exact-reference boost)
}

/** Ranked lexical hits by raw BM25 (+ exact section-number boost). */
export function bm25Search(query: string): LexicalHit[] {
  index ??= build();
  const { chunks, tf, idf, avgLen, docLen } = index;
  const qTerms = tokenize(query);
  if (qTerms.length === 0) return [];

  const hits: LexicalHit[] = [];
  for (let d = 0; d < chunks.length; d++) {
    let score = 0;
    const norm = K1 * (1 - B + (B * docLen[d]) / avgLen);
    for (const t of qTerms) {
      const f = tf[d].get(t);
      if (!f) continue;
      score += (idf.get(t) ?? 0) * ((f * (K1 + 1)) / (f + norm));
    }
    // Exact statutory reference in the query is a strong signal.
    if (chunks[d].section && query.includes(chunks[d].section) && /\d/.test(chunks[d].section)) {
      score += 4;
    }
    if (score > 0.01) hits.push({ idx: d, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}
