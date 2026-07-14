<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Next.js 16 gotchas that bit us / to remember
- `params` and `searchParams` are **async** (Promises) — always `await` them.
- Turbopack is default; no `--turbopack` flag needed. `next lint` is removed (use `eslint`).
- Route Handlers use native `Request`/`Response`. Stream with a `ReadableStream`.
- POST route handlers are never cached — good for our agent pipeline endpoint.

# NyayaSetu — project notes

**What it is:** An agentic legal-aid engine for rural India, built for the
Meesho *ScriptedBy{Her} 2.0* hackathon. Document photo in → grounded legal
strategy, a drafted filing, and case tracking out — in the user's language,
with a lawyer in the loop.

## Stack (FREE-first)
Next.js 16 (App Router) · React 19 · TS · Tailwind v4. LLM + vision OCR +
embeddings all via **Google Gemini free tier** (`gemini-2.0-flash` +
`text-embedding-004`, one free AI Studio key). Supabase free tier optional.
Voice via browser Web Speech API. Deploy on Vercel Hobby.

**LLM is behind a provider interface** (`src/lib/llm/*`): `getLLM()` returns
Gemini by default, Claude when `ANTHROPIC_API_KEY` + `LLM_PROVIDER=claude` are
set (the commercialisation swap). Agents import `{ llm }` and never touch a
vendor SDK. Do NOT hardcode a vendor — always go through `@/lib/llm`.

## Architecture — deterministic, confidence-gated state machine
```
upload → Document → Strategy → Drafting → [confidence gate]
           → Tracking             (clears threshold)
           → Escalation → human   (below threshold / sensitive case)
```
Every transition appends a `CaseEvent` to an immutable log → replayable/auditable.
- Domain contract: `src/lib/types.ts`
- Agents + orchestrator: `src/lib/agents/*`
- Confidence gate (ensemble geometric mean, biases to escalation): `src/lib/agents/confidence.ts`
- RAG (corpus loader, Voyage embed, hybrid retrieve): `src/lib/rag/*`
- Simulated gov integrations behind interfaces: `src/lib/providers/*`
- Legal corpus (real BNS/BNSS/BSA/NALSA text + provenance): `data/corpus/*.json`

## Graceful degradation (so judges can run it)
One free Gemini key → full loop incl. semantic RAG. No key → keyword-only RAG +
demo mode. +Supabase → persistence + encrypted storage. Gov APIs have no real
public API → clearly-labelled simulated providers (the deck's "honest fallbacks").

## Cost constraint (hard rule)
Everything must run on FREE tiers for the demo. No paid API keys. Anthropic is
reserved for post-selection commercialisation only.

## ⚠️ OneDrive gotcha
Repo lives under OneDrive → corrupts `.next` → blank pages. Fix: `npm run clean`
then `npm run dev`. If it recurs, relocate outside OneDrive.

## Commands
`npm run dev` · `npm run clean` (nuke .next) · `npm run ingest` (build corpus) ·
`npm run seed` (demo cases) · `npm test`.
