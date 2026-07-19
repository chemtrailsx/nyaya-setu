/**
 * Agent 03 — Drafting Agent.
 * Acts as a legal + procedural expert. Turns the plan into the ACTUAL packet of
 * forms the user must file for their case — each with the real form's fields,
 * where/how to submit it (an official online portal, or print-and-submit), and
 * the supporting documents she must collect first (and where to get them).
 *
 * Filling is real (the user's own details); submission is simulated in the app —
 * we deep-link to the real government portal but never auto-submit on it.
 */
import { getTextLLM } from "@/lib/llm";
import { jurisdictionPromptBlock, resolveJurisdiction, type Jurisdiction } from "@/lib/jurisdiction";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type {
  CollectDoc,
  DocumentAgentResult,
  DraftAgentResult,
  DraftDocument,
  LanguageCode,
  StrategyAgentResult,
} from "@/lib/types";

/** The packet each case type typically needs, in filing order. */
const PACKET_BY_CATEGORY: Record<string, string> = {
  land_inheritance:
    "1) free legal-aid application to the District Legal Services Authority (nalsa_form_1); 2) Legal Heir Certificate / affidavit of heirship (legal_heir_certificate); 3) the land mutation application / written objection-reply for the revenue officer, using the local mutation term for this state (mutation_objection)",
  fir_denial:
    "1) written complaint to the Superintendent of Police seeking FIR registration under BNSS (fir_complaint); 2) free legal-aid application to the District Legal Services Authority (nalsa_form_1)",
  domestic_violence:
    "1) complaint to the Women's Commission / Protection Officer (womens_commission_letter); 2) free legal-aid application (nalsa_form_1)",
  rti: "1) the RTI application to the Public Information Officer (rti_application)",
  consumer: "1) the consumer complaint (other); 2) free legal-aid application (nalsa_form_1)",
  other: "1) the main application for this matter (other); 2) free legal-aid application (nalsa_form_1)",
};

/** Real official portals. The model may ONLY mark a form "online" if it maps to
 *  one of these; anything else is "print" (print, sign, submit / notarise). The
 *  land-records portal is state-specific, so it is injected per jurisdiction. */
function portalsFor(j: Jurisdiction): string {
  const land =
    j.code === "IN"
      ? `- Land mutation / records (national): "${j.landPortalName}" — ${j.landPortalUrl}`
      : `- Land mutation / records, ${j.name}: "${j.landPortalName}" — ${j.landPortalUrl}`;
  return `${land}
- Free legal aid (NALSA, all-India): "NALSA LSMS" — https://scourtapp.nic.in/lsams/nologin/applicationFiling.action?requestLocale=en
- RTI, central government: "RTI Online" — https://rtionline.gov.in
- Consumer complaint (all-India): "e-Daakhil" — https://edaakhil.nic.in
- Women's complaint (all-India): "NCW Online" — https://ncwapps.nic.in/onlinecomplaintsv2
- Birth/Death certificate: "CRS" — https://crsorgi.gov.in`;
}

const SYSTEM = `You are the Drafting Agent of NyayaSetu — a legal and procedural expert for
rural India. You produce the real forms a person must file for their case, each
with the actual fields of that form, where and how to submit it, and the
supporting documents they must gather first. Write everything in the user's
language. Use [Square Bracket] placeholders that EXACTLY match each form field's
label. Never fabricate personal names, numbers, or facts.`;

export async function runDraftingAgent(
  doc: DocumentAgentResult,
  strategy: StrategyAgentResult,
  outputLang: LanguageCode,
  jurisdiction: Jurisdiction = resolveJurisdiction(),
): Promise<DraftAgentResult> {
  const langName = SUPPORTED_LANGUAGES[outputLang].name;
  const packet = PACKET_BY_CATEGORY[doc.category] ?? PACKET_BY_CATEGORY.other;
  const citations = Array.from(
    new Set(strategy.steps.flatMap((s) => s.citations.map((c) => `${c.code} ${c.section}`))),
  ).join(", ");

  const prompt = `Prepare the real forms this person must file, and the documents they must collect first.

CASE SUMMARY: ${doc.summary}
ACTION PLAN: ${strategy.steps.map((s) => `${s.order}. ${s.action} (${s.office})`).join("; ")}
PROVISIONS TO CITE: ${citations || "as per the retrieved statute"}
NALSA free legal aid eligible: ${strategy.nalsaEligible ? "yes" : "unknown"}

For this case type the packet should be: ${packet}

${jurisdictionPromptBlock(jurisdiction)}

OFFICIAL PORTALS (mark a form "online" ONLY if it maps to one of these; else "print"):
${portalsFor(jurisdiction)}

Return this exact JSON:
{
  "documentsToCollect": [
    { "name": "<supporting doc, in ${langName}>", "whereToGet": "<where/how to obtain it, in ${langName}>", "contact": "<office / helpline / portal>" }
  ],
  "documents": [
    {
      "kind": "<nalsa_form_1|legal_heir_certificate|mutation_objection|fir_complaint|womens_commission_letter|rti_application|appeal|civil_suit|other>",
      "title": "<real form name in ${langName}>",
      "purpose": "<one short sentence in ${langName}: why she needs this and when to file it>",
      "office": "<exactly where to submit>",
      "officeAddress": "<plain-language location in ${langName}, e.g. 'Circle Office at Khunti block headquarters'>",
      "submissionMode": "<online|print>",
      "portalName": "<portal name if online, else omit>",
      "portalUrl": "<the exact portal URL from the list if online, else omit>",
      "fields": [ { "label": "<real field label of THIS form, in ${langName}>", "hint": "<short example/format>" } ],
      "body": "<the COMPLETE formal form/letter in ${langName} — salutation, subject, body, prayer, signature block — with a [Label] placeholder for EACH field above, ready to print and sign>",
      "submitTo": "<in ${langName}: exactly WHO to hand this form to — the desk/officer/clerk, e.g. 'the Circle Officer's reader (peshkar)' or 'the front desk / receiving counter'>",
      "contact": "<a real helpline or office phone to call about this filing, e.g. 'NALSA 15100' or 'the Circle Office'>",
      "afterSubmit": "<in ${langName}, 1-2 simple sentences: what happens NEXT in her case after she submits this — e.g. a receipt/acknowledgement number, a hearing/inquiry date, or an officer's inspection — so she knows what to expect>"
    }
  ],
  "draftConfidence": <0..1 how procedurally correct this packet is>
}
Rules:
- For any land/revenue form, address it to ${jurisdiction.revenueOffice} / ${jurisdiction.revenueOfficer}, use the local mutation term (${jurisdiction.mutationTerm}), and if online use ONLY the ${jurisdiction.name} land portal above — never another state's.
- 2 to 3 forms, ordered by what to file FIRST. 3 to 8 real fields per form.
- Every [Label] placeholder in a body MUST match a field label exactly.
- Everything (names, purposes, fields, bodies) in ${langName}.
- Use "online" + the real portal URL only for forms that genuinely map to a listed portal; heir certificates, affidavits, police complaints and court filings are "print".`;

  const out = await getTextLLM().completeJSON<{
    documents?: Partial<DraftDocument>[];
    documentsToCollect?: CollectDoc[];
    draftConfidence?: number;
  }>(prompt, { system: SYSTEM, maxTokens: 8000, temperature: 0.3 });

  const clamp = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));
  const documents: DraftDocument[] = (Array.isArray(out.documents) ? out.documents : [])
    .filter((d) => d && typeof d.body === "string" && d.body.length > 40)
    .slice(0, 3)
    .map((d) => ({
      kind: (d.kind ?? "other") as DraftDocument["kind"],
      title: d.title ?? "",
      purpose: d.purpose ?? "",
      office: d.office ?? "",
      officeAddress: d.officeAddress ?? "",
      submissionMode: d.submissionMode === "online" && d.portalUrl ? "online" : "print",
      portalName: d.submissionMode === "online" ? d.portalName : undefined,
      portalUrl: d.submissionMode === "online" ? d.portalUrl : undefined,
      fields: Array.isArray(d.fields) ? d.fields.filter((f) => f?.label).slice(0, 8) : [],
      body: d.body!,
      submitTo: d.submitTo || undefined,
      contact: d.contact || undefined,
      afterSubmit: d.afterSubmit || undefined,
    }));

  const documentsToCollect: CollectDoc[] = (Array.isArray(out.documentsToCollect) ? out.documentsToCollect : [])
    .filter((c) => c?.name)
    .slice(0, 6)
    .map((c) => ({ name: c.name, whereToGet: c.whereToGet ?? "", contact: c.contact }));

  return {
    documents,
    documentsToCollect,
    language: outputLang,
    draftConfidence: clamp(out.draftConfidence),
  };
}
