/**
 * Agent 01 — Document Agent.
 * Reads the uploaded document (photo, PDF, or Word), detects the language,
 * classifies the legal domain, and maps candidate sections. It also decides
 * whether the upload is actually a legal document at all — if not, the pipeline
 * stops and warns rather than fabricating a plan.
 *
 * Section guesses are *candidates* — the Strategy Agent re-grounds them against
 * retrieved statute, so a wrong guess here cannot become filed law.
 */
import mammoth from "mammoth";
import { getVisionLLM, getTextLLM } from "@/lib/llm";
import { redactIdentifiers } from "@/lib/privacy/redact";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type { DocumentAgentResult, ImageInput, LanguageCode } from "@/lib/types";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SYSTEM = `You are the Document Agent of NyayaSetu, a legal-aid engine for rural India.
You read a legal document (FIR, land deed, court notice, summons, complaint,
government form, ID, ration card, etc.) and produce a precise, structured
analysis. Be conservative: report genuine uncertainty rather than guessing, and
never invent text that is not present.`;

const SHAPE = `{
  "isLegalDocument": <true ONLY if this is a genuine legal/official/government document — an FIR, court notice, summons, legal notice, land or property record, government form, ID card, ration card, affidavit, or similar. Set FALSE for anything else: a diagram, chart, screenshot, photo of a person or place, receipt, advertisement, blank page, or random text.>,
  "extractedText": "<the text content, verbatim, in its original script>",
  "language": "<one of: hi, en, bn, ta, te, mr>",
  "languageConfidence": <0..1>,
  "category": "<one of: land_inheritance, fir_denial, domestic_violence, rti, consumer, other>",
  "summary": "<2-3 sentence plain-language summary IN THE DOCUMENT'S OWN LANGUAGE. If isLegalDocument is false, briefly say what the upload appears to be and that it is not a legal document.>",
  "sections": [ { "code": "<BNS|BNSS|BSA|RFCTLARR|NALSA|PERSONAL_LAW>", "section": "<number>", "why": "<one line>" } ],
  "ocrConfidence": <0..1 how clearly you could read the content>,
  "classificationConfidence": <0..1 how sure you are of the category>
}
Rules:
- If isLegalDocument is false, set category to "other" and sections to [].
- "sections" are best-effort candidates (max 4); they are verified later.
- summary MUST be in the document's own language.`;

async function analyse(prompt: string, image?: ImageInput): Promise<DocumentAgentResult> {
  if (image) {
    // Vision path is only ever reached for images + PDF (not docx).
    const mediaType = image.mediaType as "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
    return getVisionLLM().completeVision<DocumentAgentResult>(image.base64, mediaType, prompt, {
      system: SYSTEM,
      maxTokens: 4096,
      temperature: 0,
    });
  }
  return getTextLLM().completeJSON<DocumentAgentResult>(prompt, {
    system: SYSTEM,
    maxTokens: 4096,
    temperature: 0,
  });
}

export async function runDocumentAgent(
  input: ImageInput,
  preferredLang?: LanguageCode,
): Promise<DocumentAgentResult> {
  const langHint = preferredLang
    ? `\n\nIMPORTANT: write the "summary" field in ${SUPPORTED_LANGUAGES[preferredLang].name}, in simple words.`
    : "";

  let result: DocumentAgentResult;
  if (input.mediaType === DOCX) {
    // Word: extract the text first, then analyse it (no vision needed).
    const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(input.base64, "base64") });
    result = await analyse(
      `Analyse this document text and return this exact JSON shape:\n${SHAPE}\n\nDOCUMENT TEXT:\n${text.slice(0, 6000)}${langHint}`,
    );
  } else {
    // Photo or PDF — Gemini reads both natively.
    result = await analyse(`Analyse the attached document and return this exact JSON shape:\n${SHAPE}${langHint}`, input);
  }

  // ZERO-KNOWLEDGE OF IDENTIFIERS: mask Aadhaar/PAN/phone the instant they are
  // read, before the text flows to any other agent, the log, or the UI.
  const redactedText = redactIdentifiers(result.extractedText ?? "");
  const redactedSummary = redactIdentifiers(result.summary ?? "");

  const clamp = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));
  const isLegalDocument = result.isLegalDocument !== false; // default true unless the model says no
  return {
    extractedText: redactedText.text,
    language: (["hi", "en", "bn", "ta", "te", "mr"].includes(result.language)
      ? result.language
      : "en") as DocumentAgentResult["language"],
    languageConfidence: clamp(result.languageConfidence),
    category: isLegalDocument ? result.category ?? "other" : "other",
    summary: redactedSummary.text,
    sections: isLegalDocument && Array.isArray(result.sections) ? result.sections.slice(0, 4) : [],
    ocrConfidence: clamp(result.ocrConfidence),
    classificationConfidence: clamp(result.classificationConfidence),
    isLegalDocument,
    redactions: [...redactedText.vault, ...redactedSummary.vault],
  };
}
