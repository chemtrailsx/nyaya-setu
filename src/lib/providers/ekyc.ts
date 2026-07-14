/**
 * eKYC provider (DigiLocker / Aadhaar) — "verify, don't collect".
 *
 * SIMULATED: real eKYC needs AUA/KUA onboarding. The contract returns a signed
 * yes/no + only the last-4 of an identifier, never the raw number — encoding
 * the zero-knowledge-of-identifiers principle from the pitch, in the interface.
 */
import { config } from "@/lib/config";

export interface EkycResult {
  verified: boolean;
  last4: string;      // only the last 4 digits are ever retained
  token: string;      // opaque handle; the raw number never lands in our DB
  simulated: boolean;
}

export interface EkycProvider {
  readonly simulated: boolean;
  verify(input: { idType: "aadhaar" | "pan"; last4: string }): Promise<EkycResult>;
}

export const SimulatedEkyc: EkycProvider = {
  simulated: true,
  async verify({ last4 }) {
    return {
      verified: true,
      last4,
      token: `tok_${Math.random().toString(36).slice(2, 12)}`,
      simulated: true,
    };
  },
};

export function ekyc(): EkycProvider {
  return config.providers.ekyc === "live" ? SimulatedEkyc : SimulatedEkyc;
}
