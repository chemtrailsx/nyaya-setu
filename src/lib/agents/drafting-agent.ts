/**
 * Agent 03 — Drafting Agent.
 * Turns the action plan into the actual PACKET of documents the user must file
 * — not just one letter. E.g. for an inheritance dispute that's typically the
 * free legal-aid (DLSA/NALSA) application, a legal-heir certificate request,
 * and the written objection itself.
 *
 * Uses constrained drafts with clearly-marked [PLACEHOLDER] fields for anything
 * personal it doesn't know — the user fills those in by voice or typing. It
 * never fabricates names, numbers, or facts.
 */
import { llm } from "@/lib/llm";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type {
  DocumentAgentResult,
  DraftAgentResult,
  DraftDocument,
  LanguageCode,
  StrategyAgentResult,
} from "@/lib/types";

/** The packet each case type typically needs, in filing order. */
const PACKET_BY_CATEGORY: Record<string, string> = {
  land_inheritance:
    "1) the free legal-aid application to the District Legal Services Authority (nalsa_form_1), 2) an application for a Legal Heir Certificate to the Tehsildar (legal_heir_certificate), 3) the written objection/reply to the mutation notice for the Circle Officer (mutation_objection)",
  fir_denial:
    "1) the written complaint to the Superintendent of Police seeking FIR registration (fir_complaint), 2) the free legal-aid application to the District Legal Services Authority (nalsa_form_1)",
  domestic_violence:
    "1) the complaint to the Women's Commission / Protection Officer (womens_commission_letter), 2) the free legal-aid application to the District Legal Services Authority (nalsa_form_1)",
  rti: "1) the RTI application (rti_application)",
  consumer: "1) the complaint application (other), 2) the free legal-aid application (nalsa_form_1)",
  other: "1) the main application for this matter (other), 2) the free legal-aid application (nalsa_form_1)",
};

const SYSTEM = `You are the Drafting Agent of NyayaSetu. You produce formal, correctly
structured legal documents that a rural user can print and submit. Write in the
user's language. Use clearly-marked placeholders in square brackets like [NAME],
[ADDRESS], [DATE], [FATHER'S NAME] for any personal detail you do not know —
never fabricate names, numbers, or facts. Cite the statutory provisions the plan
relies on.`;

export async function runDraftingAgent(
  doc: DocumentAgentResult,
  strategy: StrategyAgentResult,
  outputLang: LanguageCode,
): Promise<DraftAgentResult> {
  const langName = SUPPORTED_LANGUAGES[outputLang].name;
  const packet = PACKET_BY_CATEGORY[doc.category] ?? PACKET_BY_CATEGORY.other;
  const citations = Array.from(
    new Set(strategy.steps.flatMap((s) => s.citations.map((c) => `${c.code} ${c.section}`))),
  ).join(", ");

  const prompt = `Draft the packet of documents this person must actually file.

CASE SUMMARY: ${doc.summary}
ACTION PLAN: ${strategy.steps.map((s) => `${s.order}. ${s.action} (${s.office})`).join("; ")}
PROVISIONS TO CITE: ${citations || "as per the retrieved statute"}
NALSA free legal aid eligible: ${strategy.nalsaEligible ? "yes" : "unknown"}

For this case type, the packet should be: ${packet}

Return this exact JSON:
{
  "documents": [
    {
      "kind": "<nalsa_form_1|legal_heir_certificate|mutation_objection|fir_complaint|womens_commission_letter|rti_application|appeal|civil_suit|other>",
      "title": "<document title in ${langName}>",
      "purpose": "<one short sentence in ${langName}: why she needs this and when to file it>",
      "office": "<exactly where to submit it>",
      "body": "<the COMPLETE formal document in ${langName} — salutation, subject, body, prayer/request, signature block — with [PLACEHOLDER] fields for personal details, ready to print and sign>"
    }
  ],
  "draftConfidence": <0..1 how confident you are the packet is procedurally correct>
}
Rules:
- Produce 2 to 3 documents, ordered by what she should file FIRST.
- Write EVERYTHING (titles, purpose, bodies) in ${langName}.
- Each body must be a complete document, not a description of one.
- Use [SQUARE BRACKET] placeholders for every personal detail you don't know.`;

  const out = await llm.completeJSON<{ documents?: DraftDocument[]; draftConfidence?: number }>(prompt, {
    system: SYSTEM,
    maxTokens: 6000,
    temperature: 0.3,
  });

  const clamp = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));
  const documents = (Array.isArray(out.documents) ? out.documents : [])
    .filter((d) => d && typeof d.body === "string" && d.body.length > 40)
    .slice(0, 3)
    .map((d) => ({
      kind: (d.kind ?? "other") as DraftDocument["kind"],
      title: d.title ?? "",
      purpose: d.purpose ?? "",
      office: d.office ?? "",
      body: d.body,
    }));

  return {
    documents,
    language: outputLang,
    draftConfidence: clamp(out.draftConfidence),
  };
}
