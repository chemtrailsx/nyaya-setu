/**
 * Escalation provider — the human review gate (layer 4 of "defence in depth").
 *
 * Whenever confidence is low or the matter is sensitive, we do NOT guess at a
 * private lawyer. We route to the statutory free-legal-aid ladder that already
 * exists in every district of India under the Legal Services Authorities Act,
 * 1987: NALSA → State LSA → District LSA. It is free for eligible users, it is
 * uniform nationwide, and the user formally registers by filing the NALSA legal-
 * aid application (nalsa_form_1) on the LSMS portal or at the DLSA front office.
 *
 * SIMULATED: we generate a booking reference locally. The live system would POST
 * the request to the DLSA / NALSA LSMS API and return the real acknowledgement.
 */
import { NALSA, resolveJurisdiction, type Jurisdiction } from "@/lib/jurisdiction";
import type { CaseCategory, EscalationResult } from "@/lib/types";

export interface EscalationProvider {
  readonly simulated: boolean;
  assign(input: { category: CaseCategory; reason: string; jurisdiction?: Jurisdiction }): Promise<EscalationResult>;
}

export const SimulatedEscalation: EscalationProvider = {
  simulated: true,
  async assign({ reason, jurisdiction }) {
    const j = jurisdiction ?? resolveJurisdiction();
    const scope =
      j.code === "IN"
        ? "your District Legal Services Authority (in your district court complex)"
        : `the District Legal Services Authority in your district of ${j.name}`;
    const ref = `NS-NALSA-${Date.now().toString(36).toUpperCase()}`;
    return {
      reason,
      authority: {
        name: "District Legal Services Authority (DLSA)",
        scope,
        helpline: NALSA.helpline,
        portalName: NALSA.portalName,
        portalUrl: NALSA.portalUrl,
        howToReach: `Call the free legal-aid helpline ${NALSA.helpline}, or visit ${scope}. A panel lawyer is assigned to you free of charge.`,
      },
      registrationForm: {
        kind: "nalsa_form_1",
        title: "Free Legal Aid Application (NALSA)",
        submissionMode: "online",
        portalUrl: NALSA.portalUrl,
      },
      slaHours: 48, // DLSA typically allots a panel lawyer within ~2 working days
      bookingRef: ref,
      simulated: true,
    };
  },
};

export function escalation(): EscalationProvider {
  return SimulatedEscalation;
}
