/**
 * Shared text-to-speech. Proxies Google Translate's TTS (free) server-side,
 * chunked to its ~200-char limit and concatenated into a single MP3. Used by
 * the web read-aloud button AND by the WhatsApp voice notes, so a user who
 * cannot read still gets the whole plan spoken to them.
 *
 * In production this stands in for Bhashini TTS (needs government onboarding).
 */
const CHUNK = 190; // Google TTS per-request limit
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/** Split text into <=CHUNK pieces on word boundaries, capped at maxChars. */
export function chunkText(text: string, maxChars: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().slice(0, maxChars).split(" ");
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

/** Synthesise speech as a single MP3. Returns null if TTS is unavailable. */
export async function synthesizeSpeech(
  text: string,
  lang: string,
  maxChars = 900,
): Promise<Uint8Array | null> {
  const parts = chunkText(text, maxChars);
  const buffers: Uint8Array[] = [];
  for (const part of parts) {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=` +
      `${encodeURIComponent(lang.split("-")[0])}&q=${encodeURIComponent(part)}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) buffers.push(new Uint8Array(await res.arrayBuffer()));
    } catch {
      /* skip a failed chunk rather than losing the whole clip */
    }
  }
  if (buffers.length === 0) return null;

  const total = buffers.reduce((n, b) => n + b.length, 0);
  const audio = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    audio.set(b, offset);
    offset += b.length;
  }
  return audio;
}
