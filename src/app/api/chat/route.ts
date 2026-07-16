/**
 * POST /api/chat — grounded follow-up Q&A about the user's case. The user can
 * ask anything about their document ("do I have to pay?", "which papers do I
 * need?") in their language. Answers are grounded in the document summary, the
 * generated plan, and freshly-retrieved statute — never free-invented law.
 */
import { getChatLLM } from "@/lib/llm";
import { retrieve } from "@/lib/rag/retrieve";
import { hasLLM } from "@/lib/config";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import type { LanguageCode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatBody {
  question: string;
  language?: string;
  context?: {
    summary?: string;
    category?: string;
    steps?: { order: number; action: string; office?: string; fee?: string }[];
    nalsaEligible?: boolean;
  };
  history?: { role: "user" | "assistant"; text: string }[];
}

export async function POST(request: Request) {
  if (!hasLLM()) {
    return Response.json({ error: "No LLM configured." }, { status: 503 });
  }

  let body: ChatBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) return Response.json({ error: "question is required." }, { status: 400 });

  const lang = (body.language && body.language in SUPPORTED_LANGUAGES ? body.language : "en") as LanguageCode;
  const langName = SUPPORTED_LANGUAGES[lang].name;

  // Ground the answer in law relevant to the question + the case.
  const chunks = await retrieve(`${body.context?.category ?? ""} ${question}`, { topK: 4 });
  const law = chunks
    .map((c) => `${c.code} §${c.section} — ${c.title}: ${c.text.slice(0, 350)}`)
    .join("\n");
  const plan = (body.context?.steps ?? [])
    .map((s) => `${s.order}. ${s.action}${s.office ? ` (${s.office})` : ""}${s.fee ? ` — ${s.fee}` : ""}`)
    .join("; ");
  const history = (body.history ?? [])
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "You"}: ${h.text}`)
    .join("\n");

  const prompt = `You are NyayaSetu, a friendly legal-aid helper for a rural Indian user.

THEIR CASE
Summary: ${body.context?.summary ?? "(a legal document)"}
Their action plan: ${plan || "(see the plan already shown)"}
NALSA free legal aid eligible: ${body.context?.nalsaEligible ? "yes" : "unknown"}

RELEVANT LAW (your only source for legal specifics)
${law || "(no specific section retrieved)"}

${history ? `CONVERSATION SO FAR\n${history}\n` : ""}
The user now asks: "${question}"

Answer in ${langName}, in simple words a non-lawyer understands, in 2-4 short sentences.
Rules:
- Ground your answer in their document, the plan, and the law above.
- Do NOT invent section numbers or law that isn't provided.
- If it's outside this case or you're unsure, say so honestly and suggest calling NALSA (15100) or a lawyer.
- Be warm and reassuring. Remind them free legal aid may be available if relevant.`;

  try {
    const answer = await getChatLLM().complete(prompt, { maxTokens: 500, temperature: 0.3 });
    return Response.json({ answer: answer.trim() });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Chat failed." },
      { status: 502 },
    );
  }
}
