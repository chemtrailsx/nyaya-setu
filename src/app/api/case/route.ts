/**
 * POST /api/case — run the five-agent pipeline on an uploaded document and
 * stream every state-machine transition back to the client as SSE, so the UI
 * can render the agents working live.
 *
 * Body (JSON): { imageBase64: string, mediaType: "image/jpeg"|..., phone?: string }
 */
import { runPipeline } from "@/lib/agents/orchestrator";
import { hasLLM } from "@/lib/config";
import { SUPPORTED_LANGUAGES, type ImageInput, type LanguageCode, type StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
// Vercel Hobby (free) caps serverless functions at 60s. A normal run is
// ~15-30s (Groq is fast); this is the ceiling for pathological retry storms.
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!hasLLM()) {
    return Response.json(
      { error: "No LLM configured. Add a free GEMINI_API_KEY to .env.local (https://aistudio.google.com/apikey)." },
      { status: 503 },
    );
  }

  let body: { imageBase64?: string; mediaType?: string; phone?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { imageBase64, mediaType, phone, language } = body;
  if (!imageBase64 || !mediaType) {
    return Response.json({ error: "imageBase64 and mediaType are required." }, { status: 400 });
  }
  // "auto" (or unset) → follow the detected document language.
  const outputLanguage =
    language && language !== "auto" && language in SUPPORTED_LANGUAGES
      ? (language as LanguageCode)
      : undefined;

  const image: ImageInput = {
    base64: imageBase64.replace(/^data:[^,]+,/, ""), // tolerate data: URLs
    mediaType: mediaType as ImageInput["mediaType"],
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      };
      try {
        await runPipeline(image, { phone, outputLanguage }, emit);
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
