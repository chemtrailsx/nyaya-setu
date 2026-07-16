/**
 * POST /api/whatsapp — Twilio WhatsApp webhook. A user sends a photo of their
 * legal document; we acknowledge instantly (Twilio needs a fast reply), then
 * run the five-agent pipeline via `after()` and send the plan back to them on
 * WhatsApp in their language.
 *
 * Set this URL as the "When a message comes in" webhook in the Twilio WhatsApp
 * Sandbox (or your WhatsApp sender).
 */
import { after } from "next/server";
import { runPipeline } from "@/lib/agents/orchestrator";
import { hasTwilio } from "@/lib/config";
import { sendWhatsApp, downloadTwilioMedia } from "@/lib/whatsapp/twilio";
import { formatCaseForWhatsApp, WELCOME } from "@/lib/whatsapp/format";
import type { LanguageCode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LANG_WORDS: Record<string, LanguageCode> = {
  hindi: "hi", हिंदी: "hi", english: "en", tamil: "ta", telugu: "te", bengali: "bn", marathi: "mr",
};

function detectLang(body: string): LanguageCode | undefined {
  const b = body.toLowerCase();
  for (const [word, code] of Object.entries(LANG_WORDS)) if (b.includes(word)) return code;
  return undefined;
}

function twiml(message: string): Response {
  const esc = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );
}

export async function GET() {
  return new Response("NyayaSetu WhatsApp webhook is live. Point your Twilio sandbox here.", {
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: Request) {
  if (!hasTwilio()) {
    return twiml("This NyayaSetu number is not configured yet. Please try the web app.");
  }

  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const numMedia = Number(form.get("NumMedia") ?? 0);
  const body = String(form.get("Body") ?? "");

  // A photo was sent → process it in the background and reply when ready.
  if (numMedia > 0 && from) {
    const mediaUrl = String(form.get("MediaUrl0") ?? "");
    const outputLanguage = detectLang(body);

    after(async () => {
      try {
        const image = await downloadTwilioMedia(mediaUrl);
        const state = await runPipeline(image, { phone: from, outputLanguage }, () => {});
        await sendWhatsApp(from, formatCaseForWhatsApp(state));
      } catch {
        await sendWhatsApp(
          from,
          "Sorry, I couldn't read that document. Please send a clear, well-lit photo of the full page.",
        );
      }
    });

    return twiml(
      "🙏 दस्तावेज़ मिल गया! पढ़ रहा हूँ — कुछ ही सेकंड में आपकी पूरी योजना भेजता हूँ।\n(Got your document — sending your full plan in a few seconds.)",
    );
  }

  // Text only → welcome / instructions.
  return twiml(WELCOME);
}
