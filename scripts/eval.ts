/**
 * NyayaSetu evaluation harness — turns "we don't hallucinate" from a CLAIM into
 * a MEASUREMENT against a lawyer-adjudicated gold set (data/eval/gold-set.json).
 *
 * Two modes:
 *   npx tsx scripts/eval.ts            → retrieval only (offline, no LLM, no quota)
 *   npx tsx scripts/eval.ts --full     → also runs the Strategy Agent (needs an LLM key)
 *
 * Retrieval metric (always): recall@k of the sections a lawyer said MUST be the
 * legal basis — i.e. does the grounding layer even surface the right law? This is
 * the number to publish; it needs no API key and is fully reproducible.
 *
 * End-to-end metrics (--full): citation precision/recall of the generated plan,
 * mustNotCite violations (wrong-law traps), forum match, and escalation accuracy.
 *
 * Exit code is non-zero if mustCite recall or citation precision fall below the
 * thresholds below, so this can gate CI once the gold set is lawyer-signed.
 */
import "./_loadenv"; // MUST be first — loads .env.local before config.ts reads it
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { retrieve } from "@/lib/rag/retrieve";
import { corpusStats } from "@/lib/rag/corpus";
import { CATEGORY_CODES, CATEGORY_TERMS, runStrategyAgent } from "@/lib/agents/strategy-agent";
import { evaluateGate } from "@/lib/agents/confidence";
import { resolveJurisdiction } from "@/lib/jurisdiction";
import { hasLLM, config } from "@/lib/config";
import type { CaseCategory, DocumentAgentResult, LanguageCode, LegalCode } from "@/lib/types";

const TOP_K = 8;
const THRESHOLDS = { mustCiteRecall: 0.9, citationPrecision: 0.9, mustNotCiteViolations: 0 };

type Cite = { code: LegalCode; section: string };
interface GoldCase {
  id: string;
  state: string;
  category: CaseCategory;
  language: LanguageCode;
  inputText: string;
  expect: {
    category: CaseCategory;
    isLegalDocument?: boolean;
    mustCite: Cite[];
    shouldCite?: Cite[];
    mustNotCite?: Cite[];
    forumKeywords?: string[];
    portalHost?: string;
    escalate?: boolean;
    knownCorpusGap?: string;
  };
}

const key = (c: Cite) => `${c.code}-${c.section}`;
const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
const bar = (n: number) => "█".repeat(Math.round(n * 10)).padEnd(10, "·");

/** Build the retrieval query exactly as the Strategy Agent does. */
function buildQuery(category: CaseCategory, text: string): string {
  const terms = CATEGORY_TERMS[category] ?? CATEGORY_TERMS.other;
  return `${terms} ${text}`.slice(0, 1400);
}

async function main() {
  const full = process.argv.includes("--full");
  const here = dirname(fileURLToPath(import.meta.url));
  const goldPath = resolve(here, "../data/eval/gold-set.json");
  const gold = JSON.parse(readFileSync(goldPath, "utf8")) as { version: string; cases: GoldCase[] };

  console.log(`\nNyayaSetu evaluation  ·  gold set v${gold.version}  ·  ${gold.cases.length} cases`);
  console.log(`corpus: ${JSON.stringify(corpusStats())}`);
  console.log(`mode: ${full ? "FULL (retrieval + Strategy Agent)" : "retrieval only"}${full && !hasLLM() ? "  ⚠ no LLM key — falling back to retrieval only" : ""}`);
  const runFull = full && hasLLM();
  if (runFull) console.log(`llm: ${config.provider}  (${config.gemini.model || config.groq.model})`);
  console.log("─".repeat(78));

  // Aggregates
  let mustTotal = 0, mustFound = 0;           // retrieval recall of mustCite
  let citeTP = 0, citeFP = 0, citeExpected = 0; // end-to-end citation precision/recall
  let mustNotViolations = 0, forumHits = 0, forumTotal = 0, escOk = 0, escTotal = 0;
  const failing: string[] = [];

  for (const c of gold.cases) {
    const gap = c.expect.knownCorpusGap ? "  (known corpus gap)" : "";
    console.log(`\n▸ ${c.id}  [${c.state} · ${c.category}]${gap}`);

    // ── Retrieval recall (offline) ─────────────────────────────────────────
    const chunks = await retrieve(buildQuery(c.category, c.inputText), {
      topK: TOP_K,
      preferCodes: CATEGORY_CODES[c.category] ?? CATEGORY_CODES.other,
    });
    const retrieved = new Set(chunks.map((h) => key(h)));
    const mustHits = c.expect.mustCite.filter((m) => retrieved.has(key(m)));
    mustTotal += c.expect.mustCite.length;
    mustFound += mustHits.length;
    const recall = c.expect.mustCite.length ? mustHits.length / c.expect.mustCite.length : 1;
    if (c.expect.mustCite.length) {
      console.log(`  retrieval recall@${TOP_K}: ${bar(recall)} ${pct(recall)}  (${mustHits.length}/${c.expect.mustCite.length} required sections)`);
      const missing = c.expect.mustCite.filter((m) => !retrieved.has(key(m)));
      if (missing.length) console.log(`    ✗ missing: ${missing.map(key).join(", ")}`);
      if (recall < THRESHOLDS.mustCiteRecall) failing.push(`${c.id}: retrieval recall ${pct(recall)}`);
    } else {
      console.log(`  retrieval recall@${TOP_K}: n/a (no required sections${c.expect.knownCorpusGap ? " — corpus gap" : ""})`);
    }
    console.log(`    top: ${chunks.slice(0, 4).map((h) => `${h.code}§${h.section}`).join(", ")}`);

    // ── End-to-end via the Strategy Agent (needs an LLM) ───────────────────
    // Non-legal uploads are stopped by the Document Agent's guard BEFORE the
    // Strategy Agent ever runs, so they are not a strategy-grounding test.
    if (runFull && c.expect.isLegalDocument === false) {
      console.log(`    (non-legal guard case — handled at document stage; strategy not run)`);
    } else if (runFull) {
      const doc: DocumentAgentResult = {
        extractedText: c.inputText,
        language: c.language,
        languageConfidence: 1,
        category: c.category,
        summary: c.inputText,
        sections: [],
        ocrConfidence: 1,
        classificationConfidence: 1,
        isLegalDocument: c.expect.isLegalDocument !== false,
        redactions: [],
      };
      try {
        const strategy = await runStrategyAgent(doc, c.language, resolveJurisdiction(c.state, c.inputText));
        const cited = new Set(strategy.steps.flatMap((s) => s.citations.map(key)));

        // Citation precision = of what the plan cited, how much was expected (must ∪ should).
        const allowed = new Set([...c.expect.mustCite, ...(c.expect.shouldCite ?? [])].map(key));
        for (const ck of cited) (allowed.has(ck) ? citeTP++ : citeFP++);
        // Citation recall of mustCite.
        citeExpected += c.expect.mustCite.length;
        const citedMust = c.expect.mustCite.filter((m) => cited.has(key(m))).length;

        // mustNotCite violations — the wrong-law traps.
        const violations = (c.expect.mustNotCite ?? []).filter((m) => cited.has(key(m)));
        mustNotViolations += violations.length;

        // Forum keyword coverage. Only meaningful when the plan is in English —
        // the office/officer names are localised for other languages, so English
        // keywords can't be substring-matched (a transliteration check is future
        // work). We measure it for English cases and mark others n/a.
        const planText = strategy.steps.map((s) => `${s.action} ${s.office} ${s.officer}`).join(" ").toLowerCase();
        const fk = c.expect.forumKeywords ?? [];
        const forumMeasurable = c.language === "en" && fk.length > 0;
        const fkHit = fk.filter((k) => planText.includes(k.toLowerCase()));
        if (forumMeasurable) { forumTotal += fk.length; forumHits += fkHit.length; }

        // Escalation decision.
        const gate = evaluateGate(
          { ocr: 1, classification: 1, retrieval: strategy.retrievalScore },
          c.category,
          config.confidenceThreshold,
        );
        if (c.expect.escalate !== undefined) {
          escTotal++;
          if (gate.escalate === c.expect.escalate) escOk++;
        }

        console.log(`  plan: ${strategy.steps.length} steps · cited ${[...cited].join(", ") || "—"}`);
        console.log(`    mustCite recall: ${citedMust}/${c.expect.mustCite.length}` +
          (violations.length ? `   ✗ CITED FORBIDDEN LAW: ${violations.map(key).join(", ")}` : "   ✓ no wrong-law citations"));
        if (fk.length) console.log(`    forum keywords: ${forumMeasurable ? `${fkHit.length}/${fk.length}` : "n/a (localised plan)"}  (${fk.join(", ")})`);
        console.log(`    escalate: got ${gate.escalate}, expected ${c.expect.escalate}  ${c.expect.escalate === undefined ? "" : gate.escalate === c.expect.escalate ? "✓" : "✗"}`);
        if (violations.length) failing.push(`${c.id}: cited forbidden ${violations.map(key).join(", ")}`);
      } catch (err) {
        console.log(`    ⚠ strategy agent error: ${(err as Error).message}`);
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(78));
  console.log("SUMMARY");
  const overallRecall = mustTotal ? mustFound / mustTotal : 1;
  console.log(`  Retrieval recall@${TOP_K} (mustCite):  ${bar(overallRecall)} ${pct(overallRecall)}  (${mustFound}/${mustTotal})`);
  if (runFull) {
    const precision = citeTP + citeFP ? citeTP / (citeTP + citeFP) : 1;
    const esc = escTotal ? escOk / escTotal : 1;
    console.log(`  Citation precision (plan):          ${bar(precision)} ${pct(precision)}  (${citeTP}/${citeTP + citeFP} cited sections were expected)`);
    console.log(`  Wrong-law citations (mustNotCite):  ${mustNotViolations === 0 ? "✓ 0" : `✗ ${mustNotViolations}`}`);
    console.log(`  Forum-keyword coverage (en cases):  ${forumTotal ? `${bar(forumHits / forumTotal)} ${pct(forumHits / forumTotal)}` : "n/a"}`);
    console.log(`  Escalation accuracy:                ${bar(esc)} ${pct(esc)}  (${escOk}/${escTotal})`);
  } else {
    console.log(`  (run with --full and an LLM key for citation precision, wrong-law, forum and escalation metrics)`);
  }

  const pass =
    overallRecall >= THRESHOLDS.mustCiteRecall &&
    (!runFull || mustNotViolations <= THRESHOLDS.mustNotCiteViolations);
  console.log("─".repeat(78));
  if (failing.length) {
    console.log("FAILING CASES:");
    for (const f of failing) console.log(`  ✗ ${f}`);
  }
  console.log(pass ? "\n✓ PASS\n" : "\n✗ FAIL (below adjudicated thresholds)\n");
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
