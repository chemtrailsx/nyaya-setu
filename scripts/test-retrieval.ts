/** Quick manual check of retrieval. Usage: npx tsx scripts/test-retrieval.ts "query" */
import { retrieve } from "@/lib/rag/retrieve";
import { corpusStats } from "@/lib/rag/corpus";

(async () => {
  console.log("corpus:", corpusStats());
  const q = process.argv[2] || "the police refused to register my FIR complaint about my land";
  console.log(`\nquery: "${q}"\n`);
  const hits = await retrieve(q, { topK: 6 });
  for (const h of hits) {
    console.log(`${h.score.toFixed(3)}  ${h.code} §${h.section} — ${h.title}`);
  }
})();
