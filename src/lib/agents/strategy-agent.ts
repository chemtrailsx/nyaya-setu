/**
 * Agent 02 — Strategy Agent (the grounded core).
 * Retrieves relevant statute via hybrid RAG, then generates a step-by-step
 * action plan that MUST be grounded in the retrieved passages. If retrieval
 * returns nothing usable, it refuses rather than inventing law — the first
 * layer of "defence in depth".
 */
import { llm } from "@/lib/llm";
import { retrieve } from "@/lib/rag/retrieve";
import type { DocumentAgentResult, StrategyAgentResult } from "@/lib/types";

const SYSTEM = `You are the Strategy Agent of NyayaSetu. You turn a classified legal
document into a concrete, procedurally-correct action plan for a rural Indian
user with no lawyer. You may ONLY rely on the retrieved statutory passages
provided; never cite a section that is not in the retrieved set. Prefer the
free NALSA legal-aid route wherever the user may be eligible. Be specific about
the office, the officer's title, the forms, and any statutory deadline.`;

function buildQuery(doc: DocumentAgentResult): string {
  const cand = doc.sections.map((s) => `${s.code} ${s.section}`).join(" ");
  return `${doc.category} ${doc.summary} ${cand} ${doc.extractedText}`.slice(0, 1200);
}

export async function runStrategyAgent(doc: DocumentAgentResult): Promise<StrategyAgentResult> {
  const chunks = await retrieve(buildQuery(doc), { topK: 6 });
  const retrievalScore = chunks.length ? chunks[0].score : 0;

  // Refuse-on-no-retrieval: do not fabricate a plan with no legal grounding.
  if (chunks.length === 0) {
    return {
      steps: [],
      nalsaEligible: false,
      retrievalScore: 0,
      citedChunks: [],
      rationale:
        "No statutory passage could be retrieved for this document, so no grounded plan was generated. The case is escalated to a human advocate.",
    };
  }

  const context = chunks
    .map((c) => `[${c.code} §${c.section} — ${c.title}] (relevance ${c.score})\n${c.text.slice(0, 700)}`)
    .join("\n\n");

  const prompt = `RETRIEVED STATUTE (your only permitted source of law):
${context}

DOCUMENT ANALYSIS:
- Category: ${doc.category}
- Summary: ${doc.summary}
- Extracted text (excerpt): ${doc.extractedText.slice(0, 800)}
- User's language: ${doc.language}

Produce a grounded action plan as this exact JSON:
{
  "steps": [
    {
      "order": <1-based>,
      "action": "<what to do, in the user's language ${doc.language}>",
      "office": "<the specific office/authority>",
      "officer": "<officer title, e.g. Station House Officer, Tehsildar>",
      "forms": ["<form name/number>"],
      "documents": ["<supporting document to attach>"],
      "deadlineDays": <number or null>,
      "fee": "<amount, or 'Free (NALSA)'>",
      "citations": [ { "code": "<code>", "section": "<number>" } ]
    }
  ],
  "nalsaEligible": <true if the user (e.g. woman, SC/ST, low income) likely qualifies for free NALSA aid>,
  "rationale": "<2-3 sentences, in the user's language, on why this is the right path>"
}
Rules:
- Every citation MUST reference a section present in the retrieved statute above.
- 2 to 5 steps. Order them in the sequence the user should act.
- If a first-response step is filing an FIR or seeking legal aid, put it first.`;

  const out = await llm.completeJSON<Omit<StrategyAgentResult, "retrievalScore" | "citedChunks">>(
    prompt,
    { system: SYSTEM, maxTokens: 3000, temperature: 0.2 },
  );

  // Keep only citations that really exist in the retrieved set.
  const allowed = new Set(chunks.map((c) => `${c.code}-${c.section}`));
  const steps = (out.steps ?? []).map((s) => ({
    ...s,
    citations: (s.citations ?? []).filter((c) => allowed.has(`${c.code}-${c.section}`)),
  }));

  return {
    steps,
    nalsaEligible: Boolean(out.nalsaEligible),
    retrievalScore,
    citedChunks: chunks,
    rationale: out.rationale ?? "",
  };
}
