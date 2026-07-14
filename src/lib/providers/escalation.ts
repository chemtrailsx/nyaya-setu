/**
 * Escalation provider — routes a case to a Bar Council-verified DLSA advocate
 * with a calendar booking (Calendly in production).
 *
 * SIMULATED: uses a small panel of illustrative advocates. The real system
 * queries the empanelled DLSA / Bar Council roster and a scheduling API.
 */
import type { CaseCategory, EscalationResult } from "@/lib/types";

interface Advocate {
  name: string;
  barId: string;
  dlsaDistrict: string;
  specialities: CaseCategory[];
}

// Illustrative panel (simulated). A live roster would come from the DLSA DB.
const PANEL: Advocate[] = [
  { name: "Adv. Sunita Devi", barId: "JH/1123/2016", dlsaDistrict: "Ranchi DLSA", specialities: ["fir_denial", "domestic_violence"] },
  { name: "Adv. Rakesh Mahto", barId: "JH/0847/2012", dlsaDistrict: "Khunti DLSA", specialities: ["land_inheritance"] },
  { name: "Adv. Farhana Khatun", barId: "JH/1590/2019", dlsaDistrict: "Ranchi DLSA", specialities: ["domestic_violence", "fir_denial"] },
  { name: "Adv. Praveen Kumar", barId: "JH/0655/2010", dlsaDistrict: "Gumla DLSA", specialities: ["land_inheritance", "consumer", "rti"] },
];

export interface EscalationProvider {
  readonly simulated: boolean;
  assign(input: { category: CaseCategory; reason: string }): Promise<EscalationResult>;
}

export const SimulatedEscalation: EscalationProvider = {
  simulated: true,
  async assign({ category, reason }) {
    const match = PANEL.find((a) => a.specialities.includes(category)) ?? PANEL[0];
    const ref = `NS-ESC-${Date.now().toString(36).toUpperCase()}`;
    return {
      reason,
      advocate: { name: match.name, barId: match.barId, dlsaDistrict: match.dlsaDistrict },
      slaHours: 2,
      bookingRef: ref,
      simulated: true,
    };
  },
};

export function escalation(): EscalationProvider {
  return SimulatedEscalation;
}
