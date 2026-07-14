/**
 * Court-tracking provider (NJDG / eCourts CNR lookup).
 *
 * HONEST NOTE: NJDG exposes no public developer API and the eCourts portal is
 * CAPTCHA-gated (see the pitch deck's "what's hard" section). So this ships as
 * a clearly-labelled SIMULATED provider. The interface is the real contract —
 * on an eCommittee data-sharing agreement, only `LiveCourtTracking` changes.
 */
import { config } from "@/lib/config";
import type { CaseCategory, TrackingUpdate } from "@/lib/types";

export interface CourtTrackingProvider {
  readonly simulated: boolean;
  /** Register a filed matter and return its initial tracking state. */
  track(input: { category: CaseCategory; district?: string }): Promise<TrackingUpdate>;
}

function genCNR(district = "JH"): string {
  // eCourts CNR format: 16 chars — STATE(2)+DIST(2)+... we fake a plausible one.
  const n = Math.floor(100000000 + Math.random() * 899999999);
  return `${district}RH01${n}2026`;
}

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export const SimulatedCourtTracking: CourtTrackingProvider = {
  simulated: true,
  async track({ category }) {
    const hearingIn = 25 + Math.floor(Math.random() * 20);
    const status =
      category === "fir_denial"
        ? "Complaint registered · awaiting Magistrate direction under BNSS §175(3)"
        : "Filed · listed for first hearing";
    return {
      cnr: genCNR(),
      status,
      nextHearing: futureDate(hearingIn),
      alertsSent: [],
      simulated: true,
    };
  },
};

/** Placeholder for the real integration (post data-sharing agreement). */
export const LiveCourtTracking: CourtTrackingProvider = {
  simulated: false,
  async track() {
    throw new Error("Live NJDG/eCourts integration requires an eCommittee data-sharing agreement.");
  },
};

export function courtTracking(): CourtTrackingProvider {
  return config.providers.njdg === "live" ? LiveCourtTracking : SimulatedCourtTracking;
}
