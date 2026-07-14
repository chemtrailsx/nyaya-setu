/**
 * GET /api/tts?text=...&lang=hi — text-to-speech that actually works in Indian
 * languages on any device (browser Web Speech often lacks Indic voices).
 *
 * Proxies Google Translate's TTS (free) server-side — chunked to its ~200-char
 * limit and concatenated into a single MP3. In production this stands in for
 * Bhashini TTS (the deck's production choice, which needs government onboarding).
 */
export const runtime = "nodejs";

const MAX_CHARS = 900; // keep read-aloud snappy
const CHUNK = 190; // Google TTS per-request limit
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/** Split text into <=CHUNK pieces on sentence/word boundaries. */
function chunk(text: string): string[] {
  const words = text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS).split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > CHUNK) {
      if (cur) out.push(cur.trim());
      cur = w;
    } else {
      cur += " " + w;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") ?? "";
  const lang = (searchParams.get("lang") ?? "en").split("-")[0];
  if (!text.trim()) return new Response("text required", { status: 400 });

  try {
    const parts = chunk(text);
    const buffers: Uint8Array[] = [];
    for (const part of parts) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
        lang,
      )}&q=${encodeURIComponent(part)}`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) buffers.push(new Uint8Array(await res.arrayBuffer()));
    }
    if (buffers.length === 0) return new Response("tts unavailable", { status: 502 });

    const total = buffers.reduce((n, b) => n + b.length, 0);
    const audio = new Uint8Array(total);
    let offset = 0;
    for (const b of buffers) {
      audio.set(b, offset);
      offset += b.length;
    }
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response(`tts error: ${err instanceof Error ? err.message : err}`, { status: 502 });
  }
}
