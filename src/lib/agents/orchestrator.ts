/**
 * The pipeline orchestrator — a deterministic, confidence-gated state machine.
 *
 *   Document → Strategy → Drafting → [gate] → Tracking            (autonomous)
 *                                          └─→ Escalation → human (escalated)
 *
 * Every transition appends a CaseEvent to an immutable log and is streamed to
 * the UI, so the whole run is observable and replayable. Agents are pure-ish
 * functions; this file owns sequencing, the confidence gate, and error safety.
 */
import { randomUUID } from "node:crypto";
import { config } from "@/lib/config";
import { evaluateGate } from "@/lib/agents/confidence";
import { runDocumentAgent } from "@/lib/agents/document-agent";
import { runStrategyAgent } from "@/lib/agents/strategy-agent";
import { runDraftingAgent } from "@/lib/agents/drafting-agent";
import { runTrackingAgent } from "@/lib/agents/tracking-agent";
import { runEscalationAgent } from "@/lib/agents/escalation-agent";
import type {
  AgentName,
  CaseEvent,
  CaseState,
  ImageInput,
  LanguageCode,
  StreamEvent,
} from "@/lib/types";

export type Emit = (e: StreamEvent) => void;

export interface PipelineOptions {
  phone?: string;
  /** Force output in this language regardless of the document's language.
   *  When omitted, output follows the detected document language. */
  outputLanguage?: LanguageCode;
}

export async function runPipeline(
  image: ImageInput,
  opts: PipelineOptions,
  emit: Emit,
): Promise<CaseState> {
  const state: CaseState = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    language: "en",
    category: null,
    confidence: { ocr: 0, classification: 0, retrieval: 0 },
    ensembleConfidence: null,
    threshold: config.confidenceThreshold,
    escalated: false,
    document: null,
    strategy: null,
    draft: null,
    tracking: null,
    escalation: null,
    events: [],
  };

  const log = (
    agent: AgentName | "gate" | "system",
    status: CaseEvent["status"],
    message: string,
    data?: unknown,
  ) => {
    const event: CaseEvent = { at: new Date().toISOString(), agent, status, message, data };
    state.events.push(event);
    emit({ type: "event", event });
  };

  try {
    log("system", "running", "Case received. Document queued for analysis.");

    // ── 01 Document ────────────────────────────────────────────────────────
    log("document", "running", "OCR, language detection and legal classification…");
    const document = await runDocumentAgent(image, opts.outputLanguage);
    state.document = document;
    // Output language: the user's explicit choice wins over the detected one,
    // so a non-reader gets everything in their own tongue.
    const outputLang: LanguageCode = opts.outputLanguage ?? document.language;
    state.language = outputLang;
    state.category = document.category;
    state.confidence.ocr = document.ocrConfidence;
    state.confidence.classification = document.classificationConfidence;
    log(
      "document",
      "done",
      `Classified as "${document.category}" in ${document.language} (OCR ${document.ocrConfidence}, class ${document.classificationConfidence}).`,
    );
    emit({ type: "agent_result", agent: "document", result: document });

    // ── Guard: only proceed for genuine legal documents ────────────────────
    if (!document.isLegalDocument) {
      log(
        "system",
        "done",
        "This doesn't look like a legal document. Please upload a photo, PDF or Word file of an FIR, court notice, land paper, or legal letter.",
      );
      emit({ type: "done", state });
      return state;
    }

    // ── 02 Strategy (grounded RAG) ─────────────────────────────────────────
    log("strategy", "running", "Retrieving statute and generating a grounded action plan…");
    const strategy = await runStrategyAgent(document, outputLang);
    state.strategy = strategy;
    state.confidence.retrieval = strategy.retrievalScore;
    log(
      "strategy",
      "done",
      `${strategy.steps.length} step(s) grounded in ${strategy.citedChunks.length} retrieved passage(s); NALSA-eligible: ${strategy.nalsaEligible}.`,
    );
    emit({ type: "agent_result", agent: "strategy", result: strategy });

    // ── 03 Drafting ────────────────────────────────────────────────────────
    let draftConfidence: number | undefined;
    if (strategy.steps.length > 0) {
      log("drafting", "running", "Drafting the filing in the user's language…");
      const draft = await runDraftingAgent(document, strategy, outputLang);
      state.draft = draft;
      draftConfidence = draft.draftConfidence;
      log("drafting", "done", `Draft "${draft.kind}" prepared (confidence ${draft.draftConfidence}).`);
      emit({ type: "agent_result", agent: "drafting", result: draft });
    }

    // ── Confidence gate ────────────────────────────────────────────────────
    const gate = evaluateGate(state.confidence, state.category, state.threshold, draftConfidence);
    state.ensembleConfidence = gate.ensemble;
    state.escalated = gate.escalate;
    emit({ type: "confidence", signals: state.confidence, ensemble: gate.ensemble });
    log("gate", gate.escalate ? "escalated" : "done", gate.reason, {
      ensemble: gate.ensemble,
      threshold: state.threshold,
    });

    // ── Branch ─────────────────────────────────────────────────────────────
    if (gate.escalate) {
      log("escalation", "running", "Routing to a Bar Council-verified advocate…");
      const esc = await runEscalationAgent({ category: state.category ?? "other", reason: gate.reason });
      state.escalation = esc;
      log(
        "escalation",
        "escalated",
        `Assigned to ${esc.advocate.name} (${esc.advocate.dlsaDistrict}); SLA ${esc.slaHours}h · ref ${esc.bookingRef}.`,
      );
      emit({ type: "agent_result", agent: "escalation", result: esc });
    } else {
      log("tracking", "running", "Filing tracked; scheduling proactive alerts…");
      const tracking = await runTrackingAgent({
        category: state.category ?? "other",
        language: state.language,
        phone: opts.phone,
      });
      state.tracking = tracking;
      log(
        "tracking",
        "done",
        `Tracking as CNR ${tracking.cnr}; next hearing ${tracking.nextHearing}; ${tracking.alertsSent.length} alert(s) sent.`,
      );
      emit({ type: "agent_result", agent: "tracking", result: tracking });
    }

    log("system", "done", "Pipeline complete.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("system", "error", `Pipeline halted: ${message}`);
    emit({ type: "error", message });
  }

  emit({ type: "done", state });
  return state;
}
