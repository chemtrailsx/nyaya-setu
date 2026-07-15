import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Pillars />
        <Privacy />
        <Trust />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-indigo-50 to-bg">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-saffron-600">
          Agentic Legal Aid Engine · Rural India
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          If you cannot read legalese,
          <br />
          you have no rights in practice.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          NyayaSetu turns a photographed FIR, land deed or court notice into a
          grounded legal strategy, a drafted filing, and a tracked case — in the
          user&apos;s own language, with a lawyer in the loop.
          <span className="mt-2 block font-bold text-indigo">
            3 years pending. 3 days with NyayaSetu.
          </span>
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/demo"
            className="rounded-xl bg-saffron px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-saffron-600"
          >
            See a case resolved →
          </Link>
          <Link
            href="/#how"
            className="rounded-xl border border-border bg-surface px-6 py-3.5 text-base font-bold text-ink-2 transition hover:bg-surface-2"
          >
            How the 5 agents work
          </Link>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat n="80%" l="of rural legal issues go unresolved" />
          <Stat n="50M+" l="cases pending in Indian courts" />
          <Stat n="₹0" l="awareness of free NALSA legal aid" />
          <Stat n="0→1" l="accessible AI legal agents for Bharat" accent />
        </dl>
      </div>
    </section>
  );
}

function Stat({ n, l, accent }: { n: string; l: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-3xl font-extrabold ${accent ? "text-saffron" : "text-indigo"}`}>{n}</div>
      <div className="mt-1 text-sm leading-snug text-ink-3">{l}</div>
    </div>
  );
}

function Problem() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div>
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
            Justice is a privilege, not a right.
          </h2>
          <p className="mt-4 text-ink-2">
            73% of women facing domestic violence or FIR denial never get legal
            help. NALSA guarantees free legal aid — but in most rural districts,
            no one has heard of it. Tele-law and chatbots inform people; none
            close the loop from a photographed document to a filed, lawyer-checked
            action in the user&apos;s own language. <strong>That loop is the gap.</strong>
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-saffron-600">
            Meet Radha
          </div>
          <div className="mt-1 text-sm font-semibold text-ink-3">
            Widow · Farmer · Jharkhand
          </div>
          <p className="mt-4 text-ink-2">
            Her late husband&apos;s land deed is disputed by relatives. A notice
            arrived in legal Hindi she cannot read. The nearest lawyer is 80 km
            away and charges ₹5,000 just to read it. The local police refuse to
            file her complaint.
          </p>
          <p className="mt-4 border-l-2 border-saffron pl-4 text-sm italic text-ink-3">
            She is not exceptional. She is the rule. What if Radha had a lawyer in
            her pocket?
          </p>
        </div>
      </div>
    </section>
  );
}

const AGENTS = [
  {
    n: "01",
    name: "Document Agent",
    desc: "OCRs the photo, detects the language across 22 scheduled tongues, and classifies the legal domain — mapping the relevant BNS / BNSS / personal-law sections.",
    stack: "Gemini Vision · OCR · language detect",
  },
  {
    n: "02",
    name: "Strategy Agent",
    desc: "Generates a step-by-step action plan grounded in retrieved statute: what to file, which office, the deadline window, and the documents checklist.",
    stack: "Groq Llama 3.3 · BM25 RAG (BNS/BNSS/HSA/NALSA)",
  },
  {
    n: "03",
    name: "Drafting Agent",
    desc: "Auto-generates the RTI, NALSA Form 1, or BNS-199 police complaint in the user's own language, pre-filled and ready to submit.",
    stack: "Groq · vernacular drafting · TTS",
  },
  {
    n: "04",
    name: "Tracking Agent",
    desc: "Polls NJDG / eCourts CNR for case status and proactively alerts the user on hearing dates and required actions via WhatsApp.",
    stack: "NJDG / eCourts · WhatsApp",
  },
  {
    n: "05",
    name: "Escalation Agent",
    desc: "When confidence drops below a calibrated threshold, routes the case to a Bar Council-verified DLSA advocate — SLA: within 2 hours.",
    stack: "Complexity classifier · Bar Council DB",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-b border-border bg-surface-2 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>The solution</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          Document in. Justice out.
        </h2>
        <p className="mt-3 max-w-2xl text-ink-2">
          Five specialised agents, one unified pipeline — a deterministic,
          confidence-gated state machine where every transition is logged and
          replayable.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.n} className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-saffron">{a.n}</span>
                <h3 className="text-lg font-bold text-ink">{a.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{a.desc}</p>
              <div className="mt-4 text-xs font-semibold text-indigo-400">{a.stack}</div>
            </div>
          ))}
          <div className="flex flex-col justify-center rounded-card border border-dashed border-indigo-400/40 bg-indigo-50 p-6">
            <p className="text-sm font-semibold text-indigo">
              Below a calibrated confidence threshold, the case never guesses — it
              escalates to a human. A Bar Council lawyer signs anything filed in
              court.
            </p>
            <Link href="/demo" className="mt-4 text-sm font-bold text-saffron-600 hover:underline">
              Watch the agents run live →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    t: "Vernacular-First",
    d: "Zero manual language selection. Bhashini auto-detects the language from any document, and every plan, draft and letter is generated in the user's own script — voice-first, so even a non-reader completes the whole journey.",
  },
  {
    t: "Live Government Rails",
    d: "NJDG / eCourts CNR lookup for case status, NALSA eligibility checks, DigiLocker / Aadhaar eKYC to verify without physical visits — with honest fallbacks where no official API exists yet.",
  },
  {
    t: "Human-in-the-Loop",
    d: "Some cases resolve end-to-end by AI. Complex or sensitive ones route automatically to an empanelled DLSA / Bar Council advocate, with a 2-hour response SLA.",
  },
];

function Pillars() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>What makes it different</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          Built for Bharat — not just for metros.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <h3 className="text-lg font-bold text-indigo">{p.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const LAYERS = [
  ["Grounded retrieval", "Every legal claim must cite a retrieved BNS / BNSS / NALSA passage.", "Catches: invented law"],
  ["Refuse on doubt", "Below the confidence threshold or outside the corpus, it declines and escalates — never guesses.", "Catches: low-confidence guesses"],
  ["Structured drafts", "Constrained templates with validated fields — office, form, deadline — not free text.", "Catches: malformed procedure"],
  ["Human review gate", "A Bar Council-verified advocate reviews every filing and every sensitive case before it leaves.", "Catches: whatever automation missed"],
  ["User verification", "Shows the source and tells the user, in their language, to confirm with the named office before acting.", "Catches: blind over-reliance"],
];

function Privacy() {
  const voice = [
    ["Voice output", "Every screen and generated document is read aloud in the user's language — usable even by someone who cannot read at all."],
    ["Voice intake + auto-fill", "The user answers by speaking; speech-to-text fills every form field — they never type a word."],
    ["Spoken read-back before submit", "The completed form is read back aloud to confirm — the safeguard that lets a non-reader still catch an error."],
  ];
  const zk = [
    ["Verify, don't collect", "Government returns a signed yes/no or document via DigiLocker / Aadhaar eKYC; the raw Aadhaar / PAN number never lands in our database."],
    ["Client-side E2E encryption", "Sensitive fields are encrypted on the user's device before they reach us — plaintext never exists on our servers."],
    ["Envelope encryption at rest", "Data keys wrapped by a master key held separately (KMS / Vault) — a stolen DB dump alone is useless."],
    ["Tokenise, mask & expire", "Store only last-4 + a token; the raw document image is purged in 72h — only the non-sensitive case record persists."],
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>Privacy &amp; accessibility</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          Privacy &amp; Accessibility by Design
        </h2>
        <p className="mt-3 max-w-3xl text-ink-2">
          Voice-first, so someone who cannot read uses it end to end — on an
          architecture where even we never hold readable Aadhaar, PAN or bank numbers.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-lg font-bold text-saffron-600">Voice-First Access</h3>
            <p className="text-xs font-semibold text-ink-3">a non-reader can complete the whole journey</p>
            <ul className="mt-4 space-y-3">
              {voice.map(([t, d]) => (
                <li key={t}>
                  <div className="text-sm font-bold text-ink">{t}</div>
                  <p className="text-sm text-ink-2">{d}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-lg font-bold text-green">Zero-Knowledge of Identifiers</h3>
            <p className="text-xs font-semibold text-ink-3">the platform never stores readable Aadhaar / PAN / bank data</p>
            <ul className="mt-4 space-y-3">
              {zk.map(([t, d]) => (
                <li key={t}>
                  <div className="text-sm font-bold text-ink">{t}</div>
                  <p className="text-sm text-ink-2">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 rounded-card border border-amber/30 bg-amber-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber">The honest limit</div>
          <p className="mt-1 text-sm text-ink-2">
            True zero-knowledge has bounds: when a Bar Council lawyer reviews a filing,
            that human sees the document at that moment. So the precise claim is — the
            platform never <em>stores</em> readable sensitive identifiers; access is
            scoped, consented and fully logged. This is DPDPA data-minimisation, made concrete.
          </p>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section id="trust" className="border-b border-border bg-indigo text-white scroll-mt-16">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-xs font-bold uppercase tracking-wider text-saffron">
          Trust &amp; safety — defence in depth
        </div>
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight">
          RAG reduces hallucination. It never eliminates it.
        </h2>
        <p className="mt-3 max-w-2xl text-indigo-50/80">
          So no single layer is trusted. An error must slip past all five — and a
          Bar Council lawyer still signs anything filed. We optimise for
          &ldquo;caught early&rdquo;, not &ldquo;never wrong&rdquo;.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LAYERS.map(([t, d, c], i) => (
            <div key={t} className="rounded-card border border-white/15 bg-white/5 p-5">
              <div className="text-xs font-bold text-saffron">LAYER 0{i + 1}</div>
              <h3 className="mt-2 font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-50/75">{d}</p>
              <p className="mt-3 text-xs font-semibold text-white/50">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-surface-2">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Justice shouldn&apos;t require a postcode.
        </h2>
        <p className="mt-4 text-ink-2">
          Try the working prototype: upload a document, watch five agents reason
          over real statute, and get a filed-ready draft in your language.
        </p>
        <Link
          href="/demo"
          className="mt-8 inline-block rounded-xl bg-saffron px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-saffron-600"
        >
          Open the demo →
        </Link>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-wider text-saffron-600">{children}</div>
  );
}
