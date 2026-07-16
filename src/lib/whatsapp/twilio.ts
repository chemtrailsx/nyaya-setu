/**
 * Twilio WhatsApp helpers — the prototype channel. Twilio's free WhatsApp
 * Sandbox lets a user message the tool with no app install and no Meta business
 * verification, which is exactly the last-mile access the pitch wants.
 */
import { config, hasTwilio } from "@/lib/config";
import type { ImageInput } from "@/lib/types";

const API = "https://api.twilio.com/2010-04-01";

function authHeader(): string {
  const raw = `${config.twilio.accountSid}:${config.twilio.authToken}`;
  return "Basic " + Buffer.from(raw).toString("base64");
}

/** Send a WhatsApp message to `to` (must be a "whatsapp:+…" address). */
export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!hasTwilio()) throw new Error("Twilio is not configured.");
  const form = new URLSearchParams({ From: config.twilio.from, To: to, Body: body });
  const res = await fetch(`${API}/Accounts/${config.twilio.accountSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Twilio send failed: ${res.status} ${await res.text()}`);
}

/** Download an inbound media item (Twilio media URLs require auth). */
export async function downloadTwilioMedia(url: string): Promise<ImageInput> {
  const res = await fetch(url, { headers: { Authorization: authHeader() } });
  if (!res.ok) throw new Error(`Twilio media download failed: ${res.status}`);
  const ct = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  const mediaType: ImageInput["mediaType"] =
    ct.includes("png") ? "image/png" : ct.includes("webp") ? "image/webp" : "image/jpeg";
  return { base64, mediaType };
}
