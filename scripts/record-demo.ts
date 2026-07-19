/**
 * Record ONE real pipeline run and freeze it into src/lib/demo/canned-run.json,
 * which /api/case replays on ?demo=1. This is what makes the live demo
 * offline-safe: a quota/429 error can never kill the "Play sample case" path.
 *
 * Run:  npx tsx scripts/record-demo.ts        (needs an LLM key in .env.local)
 * Re-run whenever the pipeline output shape changes.
 */
import "./_loadenv"; // MUST be first — loads .env.local before config.ts reads it
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runPipeline } from "@/lib/agents/orchestrator";
import type { ImageInput, StreamEvent } from "@/lib/types";

// A GENUINE scanned FIR from the Delhi Police public portal, so even the
// offline-safe replay runs on a real document (nothing synthetic anywhere).
const EXAMPLE = "public/examples/real/fir-0149.pdf";
const OUT = "src/lib/demo/canned-run.json";

(async () => {
  const base64 = readFileSync(join(process.cwd(), EXAMPLE)).toString("base64");
  const image: ImageInput = { base64, mediaType: "application/pdf" };

  const events: StreamEvent[] = [];
  console.log("Recording a real run of a genuine Delhi Police FIR…");
  await runPipeline(image, { outputLanguage: "en" }, (e) => {
    events.push(e);
    if (e.type === "event") console.log(`  · ${e.event.agent} ${e.event.status}`);
  });

  writeFileSync(
    join(process.cwd(), OUT),
    JSON.stringify({ recordedAt: new Date().toISOString(), events }, null, 0),
  );
  const kinds = events.reduce<Record<string, number>>((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {});
  console.log(`\n✓ wrote ${events.length} events to ${OUT}`, kinds);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
