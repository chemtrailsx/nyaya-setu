/**
 * Calibrated confidence for the human-handoff decision.
 *
 * We never trust a single self-reported LLM number. Instead we combine three
 * independent signals with a *geometric* mean, which is deliberately
 * conservative: if any one signal is weak, the ensemble collapses and the
 * case escalates. This encodes the pitch's rule — "bias toward escalation,
 * not autonomy."
 */
import type { CaseCategory, ConfidenceSignals } from "@/lib/types";

/**
 * Case types where an error is safety-critical. These ALWAYS route to a human
 * lawyer regardless of the computed score — a falsely-confident wrong answer
 * to a domestic-violence or FIR-denial case can put someone in danger.
 */
const ALWAYS_ESCALATE: CaseCategory[] = ["domestic_violence"];

/** Weighted geometric mean of the three signals. */
export function ensembleConfidence(signals: ConfidenceSignals): number {
  const { ocr, classification, retrieval } = signals;
  // Retrieval is weighted highest: a strategy ungrounded in retrieved law is
  // the failure we fear most (hallucinated statute).
  const weights = { ocr: 0.3, classification: 0.3, retrieval: 0.4 };
  const clamp = (x: number) => Math.min(1, Math.max(0.001, x));
  const logMean =
    weights.ocr * Math.log(clamp(ocr)) +
    weights.classification * Math.log(clamp(classification)) +
    weights.retrieval * Math.log(clamp(retrieval));
  return Number(Math.exp(logMean).toFixed(3));
}

export interface GateDecision {
  ensemble: number;
  escalate: boolean;
  reason: string;
}

/** The confidence gate: decides autonomy vs. human handoff. */
export function evaluateGate(
  signals: ConfidenceSignals,
  category: CaseCategory | null,
  threshold: number,
  draftConfidence?: number,
): GateDecision {
  const ensemble = ensembleConfidence(signals);

  if (category && ALWAYS_ESCALATE.includes(category)) {
    return {
      ensemble,
      escalate: true,
      reason: `Sensitive case type (${category}) — human review is mandatory regardless of confidence.`,
    };
  }
  if (ensemble < threshold) {
    return {
      ensemble,
      escalate: true,
      reason: `Ensemble confidence ${ensemble} is below the ${threshold} threshold.`,
    };
  }
  if (draftConfidence !== undefined && draftConfidence < 0.72) {
    return {
      ensemble,
      escalate: true,
      reason: `Draft confidence ${draftConfidence} is below 0.72 — a lawyer must review the filing.`,
    };
  }
  return {
    ensemble,
    escalate: false,
    reason: `Ensemble confidence ${ensemble} clears the ${threshold} threshold; the user is still told to verify with the named office.`,
  };
}
