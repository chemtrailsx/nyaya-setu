/**
 * POST /api/transcribe — speech-to-text that works on EVERY browser.
 *
 * The browser's built-in Web Speech API is blocked on Brave and unavailable on
 * Safari/Firefox. So instead the client records audio and posts it here, and we
 * transcribe it server-side with Groq's free Whisper (whisper-large-v3), which
 * handles Indian languages well.
 *
 * Body: multipart/form-data { file: <audio>, language?: <iso-639-1> }
 */
import { config, hasGroq } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!hasGroq()) {
    return Response.json({ error: "Speech-to-text is not configured." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "An audio 'file' is required." }, { status: 400 });
  }
  const language = String(form.get("language") ?? "").trim();

  const groqForm = new FormData();
  groqForm.append("file", file, "audio.webm");
  groqForm.append("model", "whisper-large-v3");
  groqForm.append("response_format", "json");
  if (language && language !== "auto") groqForm.append("language", language);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.groq.apiKey}` },
      body: groqForm,
    });
    if (!res.ok) {
      return Response.json({ error: `Transcription failed: ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as { text?: string };
    return Response.json({ text: (data.text ?? "").trim() });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Transcription failed." },
      { status: 502 },
    );
  }
}
