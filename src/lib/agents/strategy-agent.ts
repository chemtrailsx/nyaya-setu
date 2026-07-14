/**
 * Agent 02 — Strategy Agent (the grounded core).
 * Retrieves relevant statute via hybrid RAG, then generates a step-by-step
 * action plan that MUST be grounded in the retrieved passages. If retrieval
 * returns nothing usable, it refuses rather than inventing law — the first
 * layer of "defence in depth".
 */
import { llm } from "@/lib/llm";
import { retrieve } from "@/lib/rag/retrieve";
import { loadCorpus } from "@/lib/rag/corpus";
import type { CaseCategory, DocumentAgentResult, LegalCode, StrategyAgentResult } from "@/lib/types";

/** Human-readable names so the model cites confidently (and knows the code). */
const CODE_NAME: Record<LegalCode, string> = {
  BNS: "Bharatiya Nyaya Sanhita 2023",
  BNSS: "Bharatiya Nagarik Suraksha Sanhita 2023",
  BSA: "Bharatiya Sakshya Adhiniyam 2023",
  PERSONAL_LAW: "Hindu Succession Act 1956",
  NALSA: "Legal Services Authorities Act 1987 (NALSA)",
  RFCTLARR: "Land Acquisition Act 2013",
};

/** Which statute books actually govern each case type — used to bias retrieval. */
const CATEGORY_CODES: Record<CaseCategory, LegalCode[]> = {
  land_inheritance: ["PERSONAL_LAW", "NALSA", "RFCTLARR"],
  fir_denial: ["BNSS", "BNS", "NALSA"],
  domestic_violence: ["BNS", "BNSS", "NALSA"],
  rti: ["NALSA", "BNSS"],
  consumer: ["NALSA", "BNS"],
  other: ["BNS", "BNSS", "NALSA"],
};

/** Legal vocabulary injected into the retrieval query so the right substantive
 *  law surfaces even when the document itself is written procedurally. */
const CATEGORY_TERMS: Record<CaseCategory, string> = {
  land_inheritance:
    "succession inheritance intestate heirs devolution of property female Hindu widow daughter coparcenary absolute property free legal aid eligibility woman",
  fir_denial:
    "information in cognizable cases FIR registration officer in charge police station Magistrate order investigation refusal free legal aid",
  domestic_violence:
    "cruelty by husband or relative dowry protection of woman assault free legal aid woman",
  rti: "right to information public authority application free legal aid",
  consumer: "consumer dispute deficiency in service compensation free legal aid",
  other: "free legal aid eligibility",
};

const SYSTEM = `You are the Strategy Agent of NyayaSetu. You turn a classified legal
document into a concrete, procedurally-correct action plan for a rural Indian
user with no lawyer. You may ONLY rely on the retrieved statutory passages
provided; never cite a section that is not in the retrieved set. Prefer the
free NALSA legal-aid route wherever the user may be eligible. Be specific about
the office, the officer's title, the forms, and any statutory deadline.`;

function buildQuery(doc: DocumentAgentResult): string {
  // Category-specific legal vocabulary first (so the substantive law surfaces),
  // then the plain-language summary and document text. We omit the raw guessed
  // sections, which biased retrieval toward the wrong statute book.
  const terms = CATEGORY_TERMS[doc.category] ?? CATEGORY_TERMS.other;
  return `${terms} ${doc.summary} ${doc.extractedText}`.slice(0, 1400);
}

export async function runStrategyAgent(doc: DocumentAgentResult): Promise<StrategyAgentResult> {
  const chunks = await retrieve(buildQuery(doc), {
    topK: 6,
    preferCodes: CATEGORY_CODES[doc.category] ?? CATEGORY_CODES.other,
  });
  const retrievalScore = chunks.length ? chunks[0].score : 0;

  // Almost every rural user is NALSA-eligible, so always make the eligibility
  // provision (Legal Services Authorities Act §12) available to cite.
  if (!chunks.some((c) => c.code === "NALSA")) {
    const lsa12 = loadCorpus().find((c) => c.id === "lsa-12");
    if (lsa12) chunks.push({ ...lsa12, score: 0.5 });
  }

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
    .map(
      (c) =>
        `${CODE_NAME[c.code]}, Section ${c.section} — ${c.title}\n` +
        `(to cite this, use {"code":"${c.code}","section":"${c.section}"})\n${c.text.slice(0, 700)}`,
    )
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
- Every citation MUST use the exact {"code","section"} shown for a passage above; never cite anything not retrieved.
- The FIRST step should establish the user's substantive legal RIGHT or the authority's DUTY, grounded in a specific cited section (e.g. the succession right, or the duty to register an FIR).
- Include a step for free NALSA legal aid and cite the eligibility provision (Legal Services Authorities Act §12) when the user qualifies.
- Every step that rests on a legal right, duty, or eligibility MUST carry at least one citation.
- Be specific to THIS person's facts (names, plot/case numbers, dates from the document) — not generic boilerplate.
- 2 to 5 steps, in the order the user should act.`;

  const out = await llm.completeJSON<Omit<StrategyAgentResult, "retrievalScore" | "citedChunks">>(
    prompt,
    { system: SYSTEM, maxTokens: 3000, temperature: 0.2 },
  );

  // Normalise citations against the retrieved set: match by section number and
  // adopt the canonical code (so a model citing "HSA 8" maps to PERSONAL_LAW 8),
  // and drop anything that wasn't actually retrieved (anti-hallucination).
  const bySection = new Map(chunks.map((c) => [c.section, c.code]));
  const exact = new Set(chunks.map((c) => `${c.code}-${c.section}`));
  const steps = (out.steps ?? []).map((s) => {
    const citations = (s.citations ?? [])
      .map((c) => {
        const section = String(c.section);
        if (exact.has(`${c.code}-${section}`)) return { code: c.code, section };
        if (bySection.has(section)) return { code: bySection.get(section)!, section };
        return null;
      })
      .filter((c): c is { code: LegalCode; section: string } => c !== null);
    return { ...s, citations };
  });

  return {
    steps,
    nalsaEligible: Boolean(out.nalsaEligible),
    retrievalScore,
    citedChunks: chunks,
    rationale: out.rationale ?? "",
  };
}
