/**
 * Loads the legal corpus from disk and caches it in memory. Prefers the
 * embedded build (with Voyage vectors) and falls back to the plain corpus.
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
  for (const file of ["legal-corpus.embedded.json", "legal-corpus.json"]) {
    try {
      const raw = readFileSync(join(dir, file), "utf-8");
      cache = JSON.parse(raw) as EmbeddedChunk[];
      return cache;
    } catch {
      // try next file
    }
  }
  cache = [];
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
