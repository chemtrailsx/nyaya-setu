/**
 * Agent 04 — Tracking Agent.
 * Registers the matter with the court-tracking provider (simulated NJDG/CNR)
 * and sends the user a proactive, localised WhatsApp alert about the next
 * hearing. Runs on the autonomous (high-confidence) branch of the pipeline.
 */
import { llm } from "@/lib/llm";
import { courtTracking } from "@/lib/providers/court-tracking";
import { messaging } from "@/lib/providers/whatsapp";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type { CaseCategory, LanguageCode, TrackingUpdate } from "@/lib/types";

async function localisedAlert(nextHearing: string, language: LanguageCode): Promise<string> {
  const base = `Your case hearing is scheduled for ${nextHearing}. Please bring your original documents to the court.`;
  if (language === "en") return base;
  try {
    return await llm.complete(
      `Translate this SMS/WhatsApp alert into ${SUPPORTED_LANGUAGES[language].name}. Reply with only the translation:\n"${base}"`,
      { maxTokens: 200, temperature: 0 },
    );
  } catch {
    return base; // localisation is best-effort; never block the alert
  }
}

export async function runTrackingAgent(input: {
  category: CaseCategory;
  language: LanguageCode;
  phone?: string;
}): Promise<TrackingUpdate> {
  const tracking = await courtTracking().track({ category: input.category });
  if (tracking.nextHearing) {
    const msg = await localisedAlert(tracking.nextHearing, input.language);
    const sent = await messaging().send({ to: input.phone ?? "+91XXXXXXXXXX", message: msg });
    tracking.alertsSent.push(sent);
  }
  return tracking;
}
