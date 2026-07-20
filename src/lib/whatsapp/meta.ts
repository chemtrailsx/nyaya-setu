/**
 * Meta WhatsApp Cloud API helpers — the free, no-join-code channel. Panelists
 * message the business number directly; we reply within the 24-hour session
 * window via the Graph API. Send text, download inbound media, and (optionally)
 * verify the webhook signature.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { config, hasWhatsAppCloud } from "@/lib/config";
import type { DocMediaType, ImageInput } from "@/lib/types";

const graph = () => `https://graph.facebook.com/${config.whatsappCloud.apiVersion}`;
const bearer = () => ({ Authorization: `Bearer ${config.whatsappCloud.token}` });

/** Send a plain-text WhatsApp message to a phone number (e.g. "919812345678"). */
export async function sendWhatsAppCloud(to: string, body: string): Promise<void> {
  if (!hasWhatsAppCloud()) throw new Error("WhatsApp Cloud API is not configured.");
  const res = await fetch(`${graph()}/${config.whatsappCloud.phoneNumberId}/messages`, {
    method: "POST",
    headers: { ...bearer(), "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: body.slice(0, 4096) },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`);
}

const ALLOWED: DocMediaType[] = [
  "image/jpeg", "image/png", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Download an inbound media item by its media id (two hops: id → url → bytes). */
export async function downloadCloudMedia(mediaId: string): Promise<ImageInput> {
  const metaRes = await fetch(`${graph()}/${mediaId}`, { headers: bearer() });
  if (!metaRes.ok) throw new Error(`media lookup failed: ${metaRes.status}`);
  const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!meta.url) throw new Error("media url missing");

  const binRes = await fetch(meta.url, { headers: bearer() });
  if (!binRes.ok) throw new Error(`media download failed: ${binRes.status}`);
  const base64 = Buffer.from(await binRes.arrayBuffer()).toString("base64");
  const mime = (meta.mime_type ?? "image/jpeg").split(";")[0].trim() as DocMediaType;
  const mediaType: DocMediaType = ALLOWED.includes(mime) ? mime : "image/jpeg";
  return { base64, mediaType };
}

/** Optional: verify the X-Hub-Signature-256 header against the raw body. Returns
 *  true when no app secret is configured (so the check is opt-in). */
export function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = config.whatsappCloud.appSecret;
  if (!secret) return true; // not configured → skip
  if (!signature?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
