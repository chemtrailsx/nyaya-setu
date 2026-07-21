/**
 * GET /api/tts?text=...&lang=hi — text-to-speech that actually works in Indian
 * languages on any device (browser Web Speech often lacks Indic voices).
 * The synthesis itself lives in @/lib/tts so WhatsApp voice notes reuse it.
 */
import { synthesizeSpeech } from "@/lib/tts";

export const runtime = "nodejs";

const MAX_CHARS = 900; // keep read-aloud snappy

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";
  const lang = searchParams.get("lang") ?? "en";
  if (!text.trim()) return new Response("text required", { status: 400 });

  try {
    const audio = await synthesizeSpeech(text, lang, MAX_CHARS);
    if (!audio) return new Response("tts unavailable", { status: 502 });
    return new Response(new Blob([audio as unknown as BlobPart], { type: "audio/mpeg" }), {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    return new Response(`tts error: ${err instanceof Error ? err.message : err}`, { status: 502 });
  }
}
