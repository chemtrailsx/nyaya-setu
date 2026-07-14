/**
 * Loads the legal corpus. `legal-corpus.json` is the source of truth for which
 * sections exist (BNS/BNSS/HSA/NALSA). If `legal-corpus.embedded.json` exists,
 * its vectors are overlaid onto matching sections by id — so embeddings are an
 * optional enhancement, never a gate on which law is available.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LegalChunk } from "@/lib/types";

export interface EmbeddedChunk extends LegalChunk {
  embedding?: number[];
}

let cache: EmbeddedChunk[] | null = null;

export function loadCorpus(): EmbeddedChunk[] {
  if (cache) return cache;
  const dir = join(process.cwd(), "data", "corpus");

  let base: EmbeddedChunk[] = [];
  try {
    base = JSON.parse(readFileSync(join(dir, "legal-corpus.json"), "utf-8"));
  } catch {
    cache = [];
    return cache;
  }

  // Overlay any available embeddings by id.
  try {
    const embedded: EmbeddedChunk[] = JSON.parse(
      readFileSync(join(dir, "legal-corpus.embedded.json"), "utf-8"),
    );
    const vecById = new Map(embedded.filter((c) => c.embedding?.length).map((c) => [c.id, c.embedding]));
    if (vecById.size) {
      base = base.map((c) => (vecById.has(c.id) ? { ...c, embedding: vecById.get(c.id) } : c));
    }
  } catch {
    /* no embeddings yet — lexical retrieval still works */
  }

  cache = base;
  return cache;
}

export function corpusStats() {
  const chunks = loadCorpus();
  const embedded = chunks.filter((c) => c.embedding?.length).length;
  const byCode = chunks.reduce<Record<string, number>>((acc, c) => {
    acc[c.code] = (acc[c.code] || 0) + 1;
    return acc;
  }, {});
  return { total: chunks.length, embedded, byCode };
}
