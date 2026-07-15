/**
 * Agent 01 — Document Agent.
 * OCRs the uploaded photo, detects the language, classifies the legal domain,
 * and maps candidate BNS/BNSS sections. Vision + NLP in a single grounded call.
 * Its section guesses are *candidates* — the Strategy Agent re-grounds them
 * against retrieved statute, so a wrong guess here cannot become filed law.
 */
import { getVisionLLM } from "@/lib/llm";
import { redactIdentifiers } from "@/lib/privacy/redact";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type { DocumentAgentResult, ImageInput, LanguageCode } from "@/lib/types";

const SYSTEM = `You are the Document Agent of NyayaSetu, a legal-aid engine for rural India.
You read a photographed legal document (FIR, land deed, court notice, summons,
complaint, ration card, etc.) and produce a precise, structured analysis.
Be conservative: report genuine uncertainty in the confidence fields rather than
guessing. Never invent text that is not visible in the image.`;

const PROMPT = `Analyse the attached document image and return this exact JSON shape:
{
  "extractedText": "<full text you can read from the image, verbatim, original script>",
  "language": "<one of: hi, en, bn, ta, te, mr>",
  "languageConfidence": <0..1>,
  "category": "<one of: land_inheritance, fir_denial, domestic_violence, rti, consumer, other>",
  "summary": "<2-3 sentence plain-language summary IN THE SAME LANGUAGE as the document, explaining what this document is and what it means for the person>",
  "sections": [ { "code": "<BNS|BNSS|BSA|RFCTLARR|NALSA|PERSONAL_LAW>", "section": "<number>", "why": "<one line: why this section may apply>" } ],
  "ocrConfidence": <0..1 how clearly you could read the text>,
  "classificationConfidence": <0..1 how sure you are of the category>
}
Rules:
- "sections" are your best candidates (max 4); they will be verified against the statute later.
- If the image is unreadable, set ocrConfidence low and extractedText to what little you see.
- summary MUST be in the document's own language so the user understands it.`;

export async function runDocumentAgent(
  image: ImageInput,
  preferredLang?: LanguageCode,
): Promise<DocumentAgentResult> {
  // If the user chose an output language, write the summary in it (so a
  // non-reader hears the document explained in their own tongue).
  const prompt = preferredLang
    ? `${PROMPT}\n\nIMPORTANT: write the "summary" field in ${SUPPORTED_LANGUAGES[preferredLang].name}, in simple words.`
    : PROMPT;
  const result = await getVisionLLM().completeVision<DocumentAgentResult>(
    image.base64,
    image.mediaType,
    prompt,
    { system: SYSTEM, maxTokens: 4096, temperature: 0 },
  );

  // ZERO-KNOWLEDGE OF IDENTIFIERS: mask Aadhaar/PAN/phone the instant they are
  // read, before the text flows to any other agent, the log, or the UI.
  const redactedText = redactIdentifiers(result.extractedText ?? "");
  const redactedSummary = redactIdentifiers(result.summary ?? "");

  // Defensive normalisation — clamp confidences and default missing fields.
  const clamp = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));
  return {
    extractedText: redactedText.text,
    language: (["hi", "en", "bn", "ta", "te", "mr"].includes(result.language)
      ? result.language
      : "en") as DocumentAgentResult["language"],
    languageConfidence: clamp(result.languageConfidence),
    category: result.category ?? "other",
    summary: redactedSummary.text,
    sections: Array.isArray(result.sections) ? result.sections.slice(0, 4) : [],
    ocrConfidence: clamp(result.ocrConfidence),
    classificationConfidence: clamp(result.classificationConfidence),
    redactions: [...redactedText.vault, ...redactedSummary.vault],
  };
}
