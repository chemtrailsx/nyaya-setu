/**
 * Build the RAG vector index: embed every legal chunk with Gemini's free
 * `gemini-embedding-001` and write `legal-corpus.embedded.json`, which the app
 * loads for semantic retrieval.
 *
 * The free tier caps at ~100 requests/min, so we embed ONE chunk at a time,
 * paced under the limit, with 429 backoff and incremental saves (a crash keeps
 * whatever was embedded so far). If no key is present the app still works via
 * keyword-only retrieval.
 *
 * Run:  npm run ingest      (requires GEMINI_API_KEY in .env.local)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const PACE_MS = 4500; // gentle — the free embedding tier caps RPM low
const DIMS = 768;

// Embed the sections both golden paths rely on FIRST, so semantic retrieval
// works for the demo even before the full corpus finishes.
const PRIORITY = new Set([
  "bnss-173", "bnss-174", "bnss-175", "bnss-176", "bnss-187", "bnss-193", "bnss-196",
  "bnss-223", "bnss-35", "bnss-482", "bns-198", "bns-199", "bns-74", "bns-75", "bns-79",
  "bns-85", "bns-115", "bns-117", "bns-118", "bns-318", "bns-336", "bns-338", "bns-351", "bns-352",
]);

interface Chunk {
  id: string;
  code: string;
  section: string;
  title: string;
  text: string;
  sourceUrl: string;
  embedding?: number[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedOne(text: string, attempt = 1): Promise<number[] | null> {
  const model = `models/${MODEL}`;
  const res = await fetch(`${BASE}/${model}:embedContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: DIMS,
    }),
  });
  if (!res.ok) {
    if (res.status === 429 || res.status >= 500) {
      if (attempt > 10) return null; // give up on this one; keyword covers it
      const wait = Math.min(60000, attempt * 8000);
      console.warn(`  ${res.status} — backing off ${wait}ms (attempt ${attempt})`);
      await sleep(wait);
      return embedOne(text, attempt + 1);
    }
    throw new Error(`Gemini embeddings failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { embedding: { values: number[] } };
  return json.embedding.values.map((v) => Number(v.toFixed(5)));
}

async function main() {
  const dir = join(process.cwd(), "data", "corpus");
  const outPath = join(dir, "legal-corpus.embedded.json");
  const chunks: Chunk[] = JSON.parse(readFileSync(join(dir, "legal-corpus.json"), "utf-8"));

  if (!API_KEY || API_KEY.includes("your-free")) {
    console.error("No GEMINI_API_KEY in .env.local. The app still runs on keyword retrieval.");
    process.exit(1);
  }

  // Resume support: reuse embeddings already computed in a previous run.
  let done = 0;
  try {
    const prev: Chunk[] = JSON.parse(readFileSync(outPath, "utf-8"));
    const byId = new Map(prev.map((c) => [c.id, c.embedding]));
    for (const c of chunks) {
      if (byId.get(c.id)?.length) {
        c.embedding = byId.get(c.id);
        done++;
      }
    }
    if (done) console.log(`Resuming: ${done} chunks already embedded.`);
  } catch {
    /* no previous run */
  }

  // Demo-critical sections first, so semantic retrieval works early.
  const order = [...chunks].sort(
    (a, b) => (PRIORITY.has(b.id) ? 1 : 0) - (PRIORITY.has(a.id) ? 1 : 0),
  );

  console.log(`Embedding ${chunks.length - done} of ${chunks.length} chunks (${DIMS}-dim)…`);
  let processed = 0;
  for (const c of order) {
    if (c.embedding?.length) continue;
    const vec = await embedOne(`${c.code} Section ${c.section}: ${c.title}. ${c.text}`);
    if (vec) c.embedding = vec;
    processed++;
    done += vec ? 1 : 0;
    if (processed % 15 === 0) {
      writeFileSync(outPath, JSON.stringify(chunks)); // incremental save
      console.log(`  embedded ${done}/${chunks.length} (${processed} processed)`);
    }
    await sleep(PACE_MS);
  }

  writeFileSync(outPath, JSON.stringify(chunks));
  console.log(`\n✓ Wrote ${chunks.length} embedded chunks (${DIMS}-dim) to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
