/**
 * Agent 05 — Escalation Agent.
 * Runs on the low-confidence / sensitive branch. Routes the case to a Bar
 * Council-verified DLSA advocate via the escalation provider, with a 2-hour
 * SLA. The human review gate — layer 4 of "defence in depth".
 */
import { escalation } from "@/lib/providers/escalation";
import type { CaseCategory, EscalationResult } from "@/lib/types";

export async function runEscalationAgent(input: {
  category: CaseCategory;
  reason: string;
}): Promise<EscalationResult> {
  return escalation().assign({ category: input.category, reason: input.reason });
}
