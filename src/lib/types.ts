/**
 * NyayaSetu — core domain model.
 *
 * The whole system is a deterministic, confidence-gated state machine:
 *
 *   upload → Document → Strategy → Drafting → [confidence gate]
 *              → Tracking            (high confidence)
 *              → Escalation → Human  (low confidence / sensitive)
 *
 * Every transition appends a {@link CaseEvent} to an immutable log, so any
 * case is fully replayable and auditable — the "defence in depth" the pitch
 * promises. These types are the contract every agent and provider speaks.
 */

// ─── Languages ────────────────────────────────────────────────────────────
// A subset of the 22 scheduled Indian languages; the corpus + drafting are
// validated on these first, and the list expands on measured OCR accuracy.
export const SUPPORTED_LANGUAGES = {
  hi: { name: "Hindi", native: "हिन्दी", script: "Devanagari" },
  en: { name: "English", native: "English", script: "Latin" },
  bn: { name: "Bengali", native: "বাংলা", script: "Bengali" },
  ta: { name: "Tamil", native: "தமிழ்", script: "Tamil" },
  te: { name: "Telugu", native: "తెలుగు", script: "Telugu" },
  mr: { name: "Marathi", native: "मराठी", script: "Devanagari" },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// ─── Legal domain ─────────────────────────────────────────────────────────
/** The statute books the corpus is built from. */
export type LegalCode =
  | "BNS" // Bharatiya Nyaya Sanhita, 2023 (was IPC)
  | "BNSS" // Bharatiya Nagarik Suraksha Sanhita, 2023 (was CrPC)
  | "BSA" // Bharatiya Sakshya Adhiniyam, 2023 (was Evidence Act)
  | "RFCTLARR" // Land Acquisition Act, 2013
  | "NALSA" // NALSA free legal-aid rules
  | "PERSONAL_LAW"; // succession / marriage / inheritance

/** A retrieved, citable passage of law — the unit of RAG retrieval. */
export interface LegalChunk {
  id: string;
  code: LegalCode;
  section: string; // e.g. "199", "173(4)"
  title: string; // section heading
  text: string; // the statutory text
  sourceUrl: string; // provenance — where the bare act text was sourced
}

/** A retrieval hit, i.e. a chunk plus its similarity score. */
export interface RetrievedChunk extends LegalChunk {
  score: number; // 0..1 hybrid dense + keyword relevance
}

/** The two golden-path case archetypes the demo fully supports. */
export type CaseCategory =
  | "land_inheritance" // Radha: succession / mutation dispute
  | "fir_denial" // women-first: refusal to register an FIR
  | "domestic_violence"
  | "rti"
  | "consumer"
  | "other";

/** An uploaded document image, base64-encoded, fed to the Document Agent. */
export interface ImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

// ─── Agents ───────────────────────────────────────────────────────────────
export type AgentName =
  | "document"
  | "strategy"
  | "drafting"
  | "tracking"
  | "escalation";

export type AgentStatus = "pending" | "running" | "done" | "escalated" | "error";

/**
 * The three independent signals that combine into one calibrated
 * confidence score. We deliberately do NOT trust a single self-reported
 * LLM number — a wrong answer to a vulnerable user is the worst failure.
 */
export interface ConfidenceSignals {
  ocr: number; // Document Agent: OCR / extraction certainty
  classification: number; // Document Agent: legal-domain classification certainty
  retrieval: number; // Strategy Agent: best RAG retrieval score
}

// ─── Agent outputs ────────────────────────────────────────────────────────
export interface DocumentAgentResult {
  extractedText: string;
  language: LanguageCode;
  languageConfidence: number;
  category: CaseCategory;
  summary: string; // plain-language summary in the user's tongue
  sections: { code: LegalCode; section: string; why: string }[];
  ocrConfidence: number;
  classificationConfidence: number;
  /** Identifiers (Aadhaar/PAN/phone) masked at OCR time — only type + last-4
   *  are retained; readable numbers never propagate or persist. */
  redactions: { type: string; last4: string; token: string }[];
}

export interface ActionStep {
  order: number;
  action: string; // what to do
  office: string; // where — the specific office/authority
  officeAddress: string; // how to find/reach that office (in plain terms)
  officer: string; // whom — officer title
  contact: string; // who to contact / helpline number for this step
  forms: string[]; // form numbers/names required
  documents: string[]; // supporting documents to attach
  deadlineDays: number | null; // statutory window, if any
  fee: string; // fee, or "Free (NALSA)"
  citations: { code: LegalCode; section: string }[];
}

export interface StrategyAgentResult {
  steps: ActionStep[];
  nalsaEligible: boolean; // free legal aid entitlement
  retrievalScore: number;
  citedChunks: RetrievedChunk[];
  rationale: string;
}

export type DraftKind =
  | "rti_application"
  | "nalsa_form_1"
  | "fir_complaint" // BNSS 173(4)/175(3) + BNS 199
  | "mutation_objection"
  | "womens_commission_letter";

export interface DraftAgentResult {
  kind: DraftKind;
  title: string;
  body: string; // the full draft, in the user's language
  language: LanguageCode;
  fieldsFilled: Record<string, string>;
  draftConfidence: number;
}

export interface TrackingUpdate {
  cnr: string | null; // eCourts Case Number Record (simulated)
  status: string;
  nextHearing: string | null;
  alertsSent: { channel: "whatsapp" | "sms"; message: string; at: string }[];
  simulated: boolean;
}

export interface EscalationResult {
  reason: string;
  advocate: { name: string; barId: string; dlsaDistrict: string };
  slaHours: number;
  bookingRef: string;
  simulated: boolean;
}

// ─── Case state machine ───────────────────────────────────────────────────
export interface CaseEvent {
  at: string; // ISO timestamp
  agent: AgentName | "gate" | "system";
  status: AgentStatus;
  message: string;
  data?: unknown; // structured payload for replay
}

export interface CaseState {
  id: string;
  createdAt: string;
  language: LanguageCode;
  category: CaseCategory | null;
  confidence: ConfidenceSignals;
  ensembleConfidence: number | null; // combined, calibrated score
  threshold: number;
  escalated: boolean;

  document: DocumentAgentResult | null;
  strategy: StrategyAgentResult | null;
  draft: DraftAgentResult | null;
  tracking: TrackingUpdate | null;
  escalation: EscalationResult | null;

  events: CaseEvent[];
}

// ─── Streaming protocol (server → UI) ─────────────────────────────────────
/** Server-sent event payloads that drive the live agent trace in the UI. */
export type StreamEvent =
  | { type: "event"; event: CaseEvent }
  | { type: "agent_result"; agent: AgentName; result: unknown }
  | { type: "confidence"; signals: ConfidenceSignals; ensemble: number }
  | { type: "state"; state: CaseState }
  | { type: "error"; message: string }
  | { type: "done"; state: CaseState };
