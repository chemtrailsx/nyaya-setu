/**
 * POST /api/case — run the five-agent pipeline on an uploaded document and
 * stream every state-machine transition back to the client as SSE, so the UI
 * can render the agents working live.
 *
 * Body (JSON): { imageBase64, mediaType, phone?, language?, stateCode? }
 * Query:
 *   ?demo=1    → replay a pre-recorded golden run (no LLM call) so a live demo
 *                can NEVER be killed by a quota/429 error. Offline-safe.
 *   ?record=1  → (dev) run for real AND write the emitted events to the canned
 *                file, to re-seed the offline demo. Local use only.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runPipeline } from "@/lib/agents/orchestrator";
import { hasLLM } from "@/lib/config";
import { SUPPORTED_LANGUAGES, type ImageInput, type LanguageCode, type StreamEvent } from "@/lib/types";
import cannedRun from "@/lib/demo/canned-run.json";

export const runtime = "nodejs";
// Vercel Hobby (free) caps serverless functions at 60s. A normal run is
// ~15-30s (Groq is fast); this is the ceiling for pathological retry storms.
export const maxDuration = 60;

const CANNED = (cannedRun as { events: StreamEvent[] }).events ?? [];

// Lightweight per-IP rate limit — protects free-tier LLM quota from being drained
// (e.g. a judge hammering the button, or abuse). Per-instance in-memory window;
// good enough for a demo, and it signals intent. A production build would use a
// shared store (Upstash/Redis). Real runs are gated; the offline replay is not.
const RATE = { windowMs: 60_000, max: 8 };
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bound memory
  return recent.length > RATE.max;
}

const sseHeaders = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

/** Replay the recorded golden run, paced so it still feels like live agents. */
function replayCanned(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      if (CANNED.length === 0) {
        send({ type: "error", message: "No sample run has been recorded yet." });
        controller.close();
        return;
      }
      for (const e of CANNED) {
        send(e);
        // Pace agent transitions so the trace animates; results/done flush fast.
        if (e.type === "event") await new Promise((r) => setTimeout(r, 350));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  // Offline-safe demo: never touches an LLM, so a 429 cannot kill it on stage.
  if (url.searchParams.get("demo") === "1") return replayCanned();

  const record = url.searchParams.get("record") === "1";

  if (!hasLLM()) {
    return Response.json(
      { error: "No LLM configured. Add a free GEMINI_API_KEY to .env.local (https://aistudio.google.com/apikey)." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many requests in a short time. Please wait a minute, or use the offline sample case." },
      { status: 429 },
    );
  }

  let body: { imageBase64?: string; mediaType?: string; phone?: string; language?: string; stateCode?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { imageBase64, mediaType, phone, language, stateCode } = body;
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
  const recorded: StreamEvent[] = [];
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StreamEvent) => {
        if (record) recorded.push(e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      };
      try {
        await runPipeline(image, { phone, outputLanguage, stateCode }, emit);
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        if (record && recorded.length) {
          try {
            writeFileSync(
              join(process.cwd(), "src/lib/demo/canned-run.json"),
              JSON.stringify({ recordedAt: new Date().toISOString(), events: recorded }, null, 0),
            );
          } catch {
            /* dev-only convenience; ignore on read-only filesystems */
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
