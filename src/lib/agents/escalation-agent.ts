/**
 * Agent 05 — Escalation Agent.
 * Runs on the low-confidence / sensitive branch. Routes the case to the free
 * statutory legal-aid ladder (NALSA → SLSA → DLSA) for the user's state — the
 * human review gate, layer 4 of "defence in depth". Same authority nationwide.
 */
import { escalation } from "@/lib/providers/escalation";
import type { Jurisdiction } from "@/lib/jurisdiction";
import type { CaseCategory, EscalationResult } from "@/lib/types";

export async function runEscalationAgent(input: {
  category: CaseCategory;
  reason: string;
  jurisdiction?: Jurisdiction;
}): Promise<EscalationResult> {
  return escalation().assign(input);
}
