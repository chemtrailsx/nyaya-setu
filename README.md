# NyayaSetu · न्याय सेतु

**An agentic legal-aid engine for rural India.** Photograph a legal document →
five specialised AI agents read it, ground a strategy in the actual Bharatiya
Nyaya Sanhita, draft the filing in the user's own language, and track the case —
escalating to a human lawyer whenever confidence is low.

> Built for the Meesho **ScriptedBy{Her} 2.0** hackathon.

🔗 **Live demo:** https://nyaya-setu-nine.vercel.app
📸 Upload a document at [`/demo`](https://nyaya-setu-nine.vercel.app/demo) and watch the five agents work live.

---

## The problem

In India, if you cannot read legalese, you have no rights in practice. 80% of
rural legal issues go unresolved; 73% of women facing domestic violence or FIR
denial never get legal help. NALSA guarantees **free** legal aid — but in most
rural districts, no one has heard of it. Tele-law and chatbots *inform* people;
none close the loop from a **photographed document** to a **filed, lawyer-checked
action in the user's own language**. That loop is the gap NyayaSetu fills.

## What it does

1. **Document in** — a photo of an FIR, land deed, court notice or legal letter (web, no app install).
2. **Five agents reason over it** — OCR + language detection + legal classification → RAG-grounded action plan → drafted filing → case tracking, with a confidence gate that routes hard cases to a human.
3. **Justice out** — a step-by-step plan citing real statute, a ready-to-submit draft in the user's language, all **readable aloud** for someone who cannot read.

## Try it (two example documents)

Both live under [`data/sources/`](data/sources):

| File | Scenario |
|---|---|
| `demo-radha-notice.png` | A widow's land/inheritance (mutation) dispute — grounds in the Hindu Succession Act + NALSA |
| `demo-complex-firdenial.png` | A dense advocate's legal notice: a woman's FIR-denial + dowry cruelty — grounds in BNSS §173/§175 + NALSA |

Pick a language in **"Answer me in"**, upload, and click **Run the 5 agents**. Use the **🔊 Listen** buttons to hear the result read aloud.

---

## Architecture

A deterministic, **confidence-gated state machine**. Every transition is logged
to an immutable event log and streamed live to the UI, so the whole run is
observable and replayable.

```
upload → Document → Strategy → Drafting → [confidence gate]
           → Tracking             (clears threshold → autonomous)
           → Escalation → human   (below threshold / sensitive case)
```

| Agent | Role |
|---|---|
| **Document** | Vision OCR, language detection, legal-domain classification, candidate sections |
| **Strategy** | Hybrid RAG over 929 real statute sections → grounded, cited action plan; NALSA eligibility |
| **Drafting** | Generates the RTI / complaint / objection in the user's language, with labelled placeholders |
| **Tracking** | Case-status tracking + proactive WhatsApp-style alerts (localised) |
| **Escalation** | Routes low-confidence / sensitive cases to a Bar Council-verified DLSA advocate |

**Confidence gate** — a weighted *geometric mean* of OCR, classification and
retrieval scores (biased toward escalation), plus a hard rule that sensitive
case types always get a human. See [`src/lib/agents/confidence.ts`](src/lib/agents/confidence.ts).

**Grounding ("no hallucinated law")** — the Strategy Agent may only cite passages
actually retrieved from the corpus; citations are normalised against the retrieved
set and anything ungrounded is dropped. Retrieval is **BM25 lexical** (free, no
quota) fused with an optional semantic-embedding bonus.

### What's real vs. simulated (by design)

The whole AI loop is **real**: OCR, language detection, RAG over real statute,
grounded reasoning, vernacular drafting, the orchestration and the confidence
gate. Only the government integrations that have **no public developer API**
(NJDG/eCourts, DigiLocker eKYC, WhatsApp Cloud API, Bhashini) run as clearly-
labelled **simulated providers** behind clean interfaces (`src/lib/providers/`) —
the "honest fallbacks" from the pitch. Swapping in a live provider is a drop-in.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **LLM layer is provider-agnostic** (`src/lib/llm/`), routed per role:
  - **Vision / OCR → Google Gemini** (`gemini-flash-lite-latest`) — strong multilingual/Indic OCR
  - **Reasoning + drafting → Groq** (`llama-3.3-70b-versatile`) — fast, generous free tier
  - **Embeddings → Gemini** (`gemini-embedding-001`); **Anthropic Claude** wired as the commercialisation swap
- **Voice** — browser Web Speech API (read-aloud in the user's language)
- **Deploy** — Vercel

Everything runs on **free tiers**. One free [Google AI Studio](https://aistudio.google.com/apikey) key + one free [Groq](https://console.groq.com/keys) key is all you need.

---

## Run locally

**Prerequisites:** Node.js ≥ 20.9, and (free) API keys — a [Google AI Studio](https://aistudio.google.com/apikey) key and a [Groq](https://console.groq.com/keys) key.

```bash
# 1. Clone
git clone https://github.com/chemtrailsx/nyaya-setu.git
cd nyaya-setu

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
#   then edit .env.local and paste your two free keys:
#     GEMINI_API_KEY=...      GROQ_API_KEY=...

# 4. Run
npm run dev
#   open http://localhost:3000  →  go to /demo  →  upload a document
```

That's it — the app ships with the pre-built legal corpus, so no ingestion is
required to run the demo. Retrieval uses BM25 out of the box.

### Verify it works

1. Open `http://localhost:3000/demo`.
2. Upload `data/sources/demo-radha-notice.png` (or your own document photo).
3. Pick a language, click **Run the 5 agents**, and watch the live agent trace
   produce a grounded plan, a draft, and a tracking timeline.

### Optional

- **Semantic RAG:** `npm run ingest` embeds the corpus with Gemini (free tier;
  rate-limited — resumable). Without it, retrieval falls back to BM25 (works well).
- **Rebuild the corpus from source PDFs:** `npm run corpus` (requires Python +
  `pip install pymupdf`).
- **Commercialisation swap to Claude:** set `ANTHROPIC_API_KEY` and `LLM_PROVIDER=claude`.

---

## Project structure

```
src/
  app/
    page.tsx              landing / pitch
    demo/                 the interactive demo (client + UI)
    api/case/route.ts     streaming pipeline endpoint (SSE)
  lib/
    types.ts              the domain contract (state machine, agents, streaming)
    agents/               document · strategy · drafting · tracking · escalation · orchestrator · confidence
    llm/                  provider-agnostic LLM layer (gemini · groq · claude)
    rag/                  corpus loader · BM25 · embeddings · hybrid retrieve
    providers/            simulated gov integrations behind interfaces
data/
  corpus/                 the legal corpus (JSON) — 929 sections
  sources/                official act PDFs + example documents (provenance)
scripts/                  corpus parsers, ingestion, retrieval test
```

---

## Legal corpus & data provenance

The corpus (**929 sections**) is parsed directly from **official** government /
parliamentary PDFs — never written from memory — with a `sourceUrl` on every
chunk:

| Statute | Sections | Source |
|---|---|---|
| Bharatiya Nyaya Sanhita, 2023 (BNS) | 346 | [PRS Legislative Research](https://prsindia.org) |
| Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) | 521 | [PRS Legislative Research](https://prsindia.org) |
| Hindu Succession Act, 1956 | 31 | [India Code](https://www.indiacode.nic.in) |
| Legal Services Authorities Act, 1987 (NALSA) | 31 | [India Code](https://www.indiacode.nic.in) |

Indian legislation is Government of India material. **This is a prototype and not
legal advice**; a Bar Council-verified advocate reviews any filing, and the user
is always told to verify with the named office.

---

## Open-source attribution

Every third-party library, tool and service used, with its role and license:

### Runtime libraries
| Name | Version | License | Role |
|---|---|---|---|
| [Next.js](https://github.com/vercel/next.js) | 16.2.10 | MIT | App framework (App Router, API routes, SSR) |
| [React](https://github.com/facebook/react) / react-dom | 19.2.4 | MIT | UI library |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | 4.x | MIT | Styling / design system |
| [lucide-react](https://github.com/lucide-icons/lucide) | 1.24.0 | ISC | Icons |
| [clsx](https://github.com/lukeed/clsx) | 2.1.1 | MIT | Conditional classNames |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 3.6.0 | MIT | Merge Tailwind classes |
| [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) | 0.111.0 | MIT | Claude provider (commercialisation swap) |
| [@supabase/supabase-js](https://github.com/supabase/supabase-js) | 2.110.3 | MIT | Optional persistence/storage client |

### Build / dev tooling
| Name | Version | License | Role |
|---|---|---|---|
| [TypeScript](https://github.com/microsoft/TypeScript) | 5.x | Apache-2.0 | Language / type checking |
| [ESLint](https://github.com/eslint/eslint) + eslint-config-next | 9.x / 16.2.10 | MIT | Linting |
| [tsx](https://github.com/privatenumber/tsx) | 4.23.1 | MIT | Run TS scripts (ingestion, tests) |
| [dotenv](https://github.com/motdotla/dotenv) | 17.4.2 | BSD-2-Clause | Load env for scripts |
| [rimraf](https://github.com/isaacs/rimraf) | 6.1.3 | ISC | `clean` script |
| [PyMuPDF (fitz)](https://github.com/pymupdf/PyMuPDF) | 1.x | AGPL-3.0 | **Build-time only** — parse act PDFs into the corpus |
| [Pillow](https://github.com/python-pillow/Pillow) | 11.x | HPND | **Build-time only** — render example documents |

### AI services (APIs, not bundled)
| Name | Model | Terms | Role |
|---|---|---|---|
| [Google Gemini API](https://ai.google.dev) | `gemini-flash-lite-latest`, `gemini-embedding-001` | [Gemini API Terms](https://ai.google.dev/gemini-api/terms) (free tier) | Vision OCR + embeddings |
| [Groq API](https://groq.com) | `llama-3.3-70b-versatile` ([Llama 3.3 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE)) | [Groq Terms](https://groq.com/terms-of-use/) (free tier) | Reasoning + drafting |
| [Web Speech API](https://developer.mozilla.org/docs/Web/API/Web_Speech_API) | — | W3C standard (browser-native) | Read-aloud (TTS) |

### Data sources
Official statute PDFs from **[PRS Legislative Research](https://prsindia.org)** and
**[India Code](https://www.indiacode.nic.in)** (Government of India). See
[Legal corpus & data provenance](#legal-corpus--data-provenance).

*Conceptual inspiration for the government-integration roadmap (NJDG/eCourts,
DigiLocker eKYC, Bhashini, WhatsApp Cloud API) is credited to those public
platforms; they are simulated in this prototype, not integrated.*

---

## Safety & limitations

- **Not legal advice, not a lawyer replacement.** Scope = first-response legal
  aid that gets people to the right office and the right human, faster.
- RAG reduces hallucination but never eliminates it — hence the five-layer
  "defence in depth" (grounded retrieval → refuse-on-doubt → structured drafts →
  human review gate → user verification).
- Government integrations are **simulated** (labelled in the UI) because no
  public developer API exists for them yet.

---

*NyayaSetu · ScriptedBy{Her} 2.0 · Building for Bharat with Agentic AI.*
