/**
 * Meta WhatsApp Cloud API webhook — the free, no-join-code channel.
 *
 *  GET  → webhook verification handshake (Meta sends hub.challenge once).
 *  POST → an inbound message. A photo/PDF of a legal document runs the five-agent
 *         pipeline and the plan is sent back on WhatsApp in the user's language.
 *
 * Config (env): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN,
 * and optionally WHATSAPP_APP_SECRET. Point the Meta app's webhook (field
 * "messages") at:  https://<your-app>/api/whatsapp
 */
import { after } from "next/server";
import { runPipeline } from "@/lib/agents/orchestrator";
import { config, hasWhatsAppCloud } from "@/lib/config";
import { sendWhatsAppCloud, downloadCloudMedia, verifySignature } from "@/lib/whatsapp/meta";
import { formatCaseForWhatsApp, WELCOME } from "@/lib/whatsapp/format";
import type { LanguageCode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LANG_WORDS: Record<string, LanguageCode> = {
  hindi: "hi", हिंदी: "hi", english: "en", tamil: "ta", telugu: "te", bengali: "bn", marathi: "mr",
};
function detectLang(text: string): LanguageCode | undefined {
  const b = (text || "").toLowerCase();
  for (const [word, code] of Object.entries(LANG_WORDS)) if (b.includes(word)) return code;
  return undefined;
}

// ── GET: Meta webhook verification handshake ───────────────────────────────
export function GET(request: Request) {
  const u = new URL(request.url);
  const mode = u.searchParams.get("hub.mode");
  const token = u.searchParams.get("hub.verify_token");
  const challenge = u.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === config.whatsappCloud.verifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("NyayaSetu WhatsApp (Meta Cloud API) webhook is live.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ── POST: inbound message ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("bad signature", { status: 403 });
  }

  let value: WaValue | undefined;
  try {
    const body = JSON.parse(raw) as WaWebhook;
    value = body.entry?.[0]?.changes?.[0]?.value;
  } catch {
    return new Response("bad json", { status: 200 }); // ack malformed to avoid retries
  }

  const msg = value?.messages?.[0];
  // Not a user message (delivery/read receipts, status updates) → just acknowledge.
  if (!msg?.from) return new Response("OK", { status: 200 });

  if (!hasWhatsAppCloud()) {
    after(() => sendWhatsAppCloud(msg.from, "This NyayaSetu number is not configured yet. Please try the web app.").catch(() => {}));
    return new Response("OK", { status: 200 });
  }

  const from = msg.from;
  const media = msg.image ?? msg.document; // photo or PDF/Word document
  if (media?.id) {
    const caption = msg.image?.caption ?? "";
    const outputLanguage = detectLang(caption);
    after(async () => {
      try {
        await sendWhatsAppCloud(
          from,
          "🙏 दस्तावेज़ मिल गया! पढ़ रहा हूँ — कुछ ही सेकंड में आपकी पूरी योजना भेजता हूँ।\n(Got your document — sending your full plan in a few seconds.)",
        );
        const image = await downloadCloudMedia(media.id);
        const state = await runPipeline(image, { phone: from, outputLanguage }, () => {});
        await sendWhatsAppCloud(from, formatCaseForWhatsApp(state));
      } catch {
        await sendWhatsAppCloud(
          from,
          "Sorry, I couldn't read that document. Please send a clear, well-lit photo of the full page.",
        ).catch(() => {});
      }
    });
    return new Response("OK", { status: 200 });
  }

  // Text only → welcome / instructions.
  after(() => sendWhatsAppCloud(from, WELCOME).catch(() => {}));
  return new Response("OK", { status: 200 });
}

// ── Minimal shapes of the Meta webhook payload we use ──────────────────────
interface WaMedia { id: string; caption?: string; mime_type?: string }
interface WaMessage { from: string; type: string; text?: { body: string }; image?: WaMedia; document?: WaMedia }
interface WaValue { messages?: WaMessage[]; statuses?: unknown[] }
interface WaWebhook { entry?: { changes?: { value?: WaValue }[] }[] }
