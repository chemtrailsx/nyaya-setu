/**
 * Agent 03 — Drafting Agent.
 * Turns the action plan into an actual, ready-to-submit document (RTI, NALSA
 * Form 1, FIR complaint, mutation objection, women's-commission letter) in the
 * user's language. Uses constrained, structured drafts — labelled placeholders
 * for anything personal it doesn't know — never free-floating invented facts.
 */
import { llm } from "@/lib/llm";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type {
  DocumentAgentResult,
  DraftAgentResult,
  DraftKind,
  LanguageCode,
  StrategyAgentResult,
} from "@/lib/types";

const KIND_BY_CATEGORY: Record<string, DraftKind> = {
  fir_denial: "fir_complaint",
  domestic_violence: "womens_commission_letter",
  land_inheritance: "mutation_objection",
  rti: "rti_application",
  consumer: "rti_application",
  other: "rti_application",
};

const SYSTEM = `You are the Drafting Agent of NyayaSetu. You produce a formal, correctly
structured legal document that a rural user can print and submit. Write in the
user's language. Use clearly-marked placeholders like [नाम / NAME], [पता / ADDRESS],
[दिनांक / DATE] for any personal detail you do not know — never fabricate names,
numbers, or facts. Cite the correct statutory provisions the plan relies on.`;

export async function runDraftingAgent(
  doc: DocumentAgentResult,
  strategy: StrategyAgentResult,
  outputLang: LanguageCode,
): Promise<DraftAgentResult> {
  const kind = KIND_BY_CATEGORY[doc.category] ?? "rti_application";
  const langName = SUPPORTED_LANGUAGES[outputLang].name;
  const citations = Array.from(
    new Set(strategy.steps.flatMap((s) => s.citations.map((c) => `${c.code} ${c.section}`))),
  ).join(", ");

  const prompt = `Draft a "${kind}" document for this case.

CASE SUMMARY: ${doc.summary}
ACTION PLAN: ${strategy.steps.map((s) => `${s.order}. ${s.action} (${s.office})`).join("; ")}
RELEVANT PROVISIONS TO CITE: ${citations || "as per the retrieved statute"}

Return this exact JSON:
{
  "kind": "${kind}",
  "title": "<document title in ${langName}>",
  "body": "<the full formal document text in ${langName}, with [PLACEHOLDER] fields, addressed to the correct authority, citing the provisions, ready to print and sign>",
  "fieldsFilled": { "<field>": "<value you were able to infer, else omit>" },
  "draftConfidence": <0..1 how confident you are this draft is procedurally correct and complete>
}
Write the whole document in ${langName}. The body must be a complete document (salutation, subject, body, prayer/request, signature block), not a description of one.`;

  const out = await llm.completeJSON<DraftAgentResult>(prompt, {
    system: SYSTEM,
    maxTokens: 3000,
    temperature: 0.3,
  });

  const clamp = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));
  return {
    kind: (out.kind as DraftKind) ?? kind,
    title: out.title ?? "",
    body: out.body ?? "",
    language: outputLang,
    fieldsFilled: out.fieldsFilled ?? {},
    draftConfidence: clamp(out.draftConfidence),
  };
}
