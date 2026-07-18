"use client";

import { useRef, useState } from "react";
import { Camera, Images, FileText, Scale, PenLine, BellRing, UserCheck, ShieldCheck, Loader2, Download, Volume2, Square, Phone, Mic, Send, MessageCircle, X, MapPin, ExternalLink, Printer, CheckCircle2, ClipboardList } from "lucide-react";
import { useCaseStream, type CaseResults } from "@/lib/use-case-stream";
import { SUPPORTED_LANGUAGES, type AgentName, type CaseEvent, type DraftDocument, type LanguageCode } from "@/lib/types";
import { STATE_OPTIONS } from "@/lib/jurisdiction";
import { cn } from "@/lib/utils";

// Output-language options (the user picks per run; "auto" follows the document).
const LANG_OPTIONS: { code: string; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  ...Object.entries(SUPPORTED_LANGUAGES).map(([code, l]) => ({ code, label: `${l.native} (${l.name})` })),
];

const BCP47: Record<string, string> = {
  hi: "hi-IN", en: "en-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", auto: "en-IN",
};

// Real, free national helplines — tappable to dial on a phone.
const HELPLINES = [
  { label: "Free legal aid (NALSA)", num: "15100" },
  { label: "Women in distress", num: "181" },
  { label: "Police emergency", num: "112" },
  { label: "Child helpline", num: "1098" },
];

/** A Google Maps search link for an office + address. */
function mapLink(office?: string, address?: string): string {
  const q = encodeURIComponent([office, address].filter(Boolean).join(", ") + ", India");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// One-click sample documents so judges can test instantly.
const EXAMPLES = [
  { url: "/examples/radha-land-notice.png", name: "radha-land-notice.png", label: "Land / inheritance dispute", hint: "Widow's mutation case" },
  { url: "/examples/fir-denial-notice.png", name: "fir-denial-notice.png", label: "FIR denial (women-first)", hint: "Dense advocate's legal notice" },
];

// A single shared audio channel so starting one read-aloud stops any other.
let currentAudio: HTMLAudioElement | null = null;
function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

const AGENT_META: Record<AgentName, { label: string; icon: typeof FileText }> = {
  document: { label: "Document Agent", icon: FileText },
  strategy: { label: "Strategy Agent", icon: Scale },
  drafting: { label: "Drafting Agent", icon: PenLine },
  tracking: { label: "Tracking Agent", icon: BellRing },
  escalation: { label: "Escalation Agent", icon: UserCheck },
};

export function DemoClient() {
  const { state, run, reset } = useCaseStream();
  const [image, setImage] = useState<{ dataUrl: string; mediaType: string; name: string } | null>(null);
  const [lang, setLang] = useState("auto");
  // The user's state drives state-correct offices/portals (land is a State
  // subject). "auto" → detect from the document, else national fallback.
  const [stateCode, setStateCode] = useState("auto");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      setImage({ dataUrl: reader.result as string, mediaType: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const start = () => {
    if (!image) return;
    stopSpeaking();
    run(image.dataUrl, image.mediaType, lang, stateCode === "auto" ? undefined : stateCode);
  };

  // Load a bundled example image and run it in one click.
  const loadExample = async (url: string, name: string) => {
    stopSpeaking();
    const blob = await (await fetch(url)).blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
    const img = { dataUrl, mediaType: blob.type || "image/png", name };
    setImage(img);
    run(img.dataUrl, img.mediaType, lang, stateCode === "auto" ? undefined : stateCode);
  };
  // The BCP-47 tag to read results aloud with: the chosen language, or the
  // document's detected language when on auto.
  const speakLang = lang !== "auto" ? lang : state.results.document?.language ?? "en";

  // Offline-safe sample run — replays a pre-recorded case, so a live demo can
  // never be killed by an API/quota error. No image or LLM call needed.
  const playSample = () => {
    stopSpeaking();
    setImage(null);
    run("", "", "auto", undefined, undefined, true);
  };

  const startOver = () => {
    reset();
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const hasRun = state.running || state.done || state.events.length > 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[380px_1fr]">
      {/* Left: input + agent trace */}
      <div className="space-y-6">
        <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-ink">Take a photo of your document</h2>
          <p className="mt-0.5 text-xs text-ink-3">FIR, land paper, court notice, legal letter — photo, PDF or Word, any language.</p>
          {!image ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl bg-saffron px-4 py-6 text-white shadow-sm transition hover:bg-saffron-600"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-bold">Take a photo</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-surface-2 px-4 py-6 text-ink-2 transition hover:border-saffron"
              >
                <Images className="h-8 w-8 text-ink-3" />
                <span className="text-sm font-bold">From gallery</span>
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {image.mediaType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.dataUrl} alt={image.name} className="max-h-56 w-full rounded-lg border border-border object-contain bg-surface-2" />
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-4">
                  <FileText className="h-8 w-8 text-indigo" />
                  <span className="min-w-0 truncate text-sm font-semibold text-ink">{image.name}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs font-semibold text-indigo hover:underline"
              >
                Choose a different document
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <input ref={fileRef} type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,.doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <p className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-ink-3">
            <FileText className="h-3 w-3" /> Supported: Photo (JPG/PNG) · PDF · Word (.docx)
          </p>

          <div className="mt-4">
            <span className="text-xs font-semibold text-ink-3">Or try an example</span>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => loadExample(ex.url, ex.name)}
                  disabled={state.running}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left transition hover:border-saffron disabled:opacity-40"
                >
                  <span className="block text-sm font-bold text-ink">{ex.label}</span>
                  <span className="block text-xs text-ink-3">{ex.hint}</span>
                </button>
              ))}
            </div>
            <button
              onClick={playSample}
              disabled={state.running}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo/30 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo transition hover:border-indigo disabled:opacity-40"
              title="Replays a pre-recorded case — works even with no internet or API quota"
            >
              ▶ Play sample case (works offline)
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink-3">Answer me in</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm font-semibold text-ink"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-3">My state</span>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm font-semibold text-ink"
              >
                <option value="auto">Auto-detect</option>
                {STATE_OPTIONS.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-1 text-[11px] text-ink-3">Land &amp; revenue rules differ by state — this picks the right office &amp; portal.</p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={start}
              disabled={!image || state.running}
              className="flex-1 rounded-xl bg-saffron px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state.running ? "Running…" : "Run the 5 agents →"}
            </button>
            {hasRun && (
              <button onClick={startOver} className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                Reset
              </button>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
            <ShieldCheck className="h-3.5 w-3.5 text-green" />
            Image is analysed transiently; the demo stores nothing.
          </p>
        </div>

        {hasRun && <AgentTrace events={state.events} escalated={!!state.results.escalation} running={state.running} />}
      </div>

      {/* Right: results */}
      <div className="space-y-5">
        {state.error && (
          <div className="rounded-card border border-red/30 bg-red-50 p-4 text-sm text-red">{state.error}</div>
        )}
        {!hasRun && <EmptyState />}
        {state.results.document && !state.results.document.isLegalDocument && (
          <NotLegalCard results={state.results} speakLang={speakLang} />
        )}
        {state.results.document?.isLegalDocument && <DocumentPanel results={state.results} speakLang={speakLang} />}
        {state.results.strategy && <PlanPanel results={state.results} speakLang={speakLang} />}
        {state.results.strategy && <EligibilityCard eligible={state.results.strategy.nalsaEligible} />}
        {state.results.draft?.documentsToCollect?.length ? <DocsToCollectCard results={state.results} /> : null}
        {state.results.draft && <DraftPanel results={state.results} speakLang={speakLang} />}
        {state.results.strategy && <HelplinesCard speakLang={speakLang} />}
        {state.results.tracking && <TrackingPanel results={state.results} />}
        {state.results.escalation && <EscalationPanel results={state.results} />}
        {state.results.signals && <ConfidencePanel results={state.results} />}
      </div>
      <FloatingChat
        results={state.results}
        speakLang={speakLang}
        caseReady={state.done && !!state.results.document?.isLegalDocument}
      />
    </div>
  );
}

/* ── Agent trace ────────────────────────────────────────────────────────── */
function AgentTrace({ events, escalated, running }: { events: CaseEvent[]; escalated: boolean; running: boolean }) {
  const flow: AgentName[] = ["document", "strategy", "drafting", escalated ? "escalation" : "tracking"];
  const statusOf = (a: AgentName) => {
    const evs = events.filter((e) => e.agent === a);
    if (evs.some((e) => e.status === "done" || e.status === "escalated")) return "done";
    if (evs.some((e) => e.status === "running")) return "running";
    return "pending";
  };
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3">Live agent trace</h2>
      <ol className="mt-4 space-y-1">
        {flow.map((a) => {
          const st = statusOf(a);
          const { label, icon: Icon } = AGENT_META[a];
          const msg = [...events].reverse().find((e) => e.agent === a)?.message;
          return (
            <li key={a} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border", st === "done" ? "border-green bg-green-50 text-green" : st === "running" ? "border-saffron bg-saffron-50 text-saffron-600" : "border-border bg-surface-2 text-ink-3")}>
                  {st === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="my-0.5 h-full w-px flex-1 bg-border last:hidden" />
              </div>
              <div className="pb-4">
                <div className={cn("text-sm font-bold", st === "pending" ? "text-ink-3" : "text-ink")}>{label}</div>
                {msg && st !== "pending" && <p className="mt-0.5 text-xs leading-snug text-ink-2">{msg}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {running && <p className="text-xs italic text-ink-3">Working…</p>}
    </div>
  );
}

/* ── Result panels ──────────────────────────────────────────────────────── */
function Card({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-3">{title}</h3>
        {badge}
      </div>
      {children}
    </section>
  );
}

function DocumentPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const d = results.document!;
  return (
    <Card
      title="What the document says"
      badge={
        <div className="flex items-center gap-2">
          <ListenButton text={d.summary} lang={speakLang} />
          <Chip>{d.category.replace("_", " ")}</Chip>
        </div>
      }
    >
      <p className="deva text-ink" lang={speakLang}>{d.summary}</p>
      {d.redactions?.length ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-green/30 bg-green-50 p-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" />
          <p className="text-xs text-ink-2">
            <span className="font-bold text-green">{d.redactions.length} identifier{d.redactions.length > 1 ? "s" : ""} masked</span>{" "}
            ({Array.from(new Set(d.redactions.map((r) => r.type.replace("_", " ")))).join(", ")}). Readable Aadhaar / PAN / phone numbers are never stored, shown, or sent to the other agents — only the last 4 digits are kept.
          </p>
        </div>
      ) : null}
      {d.extractedText && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-3">Show extracted text (OCR)</summary>
          <pre className="deva mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-xs text-ink-2" lang={d.language}>{d.extractedText}</pre>
        </details>
      )}
    </Card>
  );
}

function ConfidencePanel({ results }: { results: CaseResults }) {
  const s = results.signals!;
  const ens = results.ensemble ?? 0;
  const escalated = !!results.escalation;
  return (
    <Card
      title="How sure is the AI?"
      badge={<Chip tone={escalated ? "amber" : "green"}>{escalated ? "Sent to a lawyer" : "Confident enough"}</Chip>}
    >
      <p className="mb-4 text-xs leading-relaxed text-ink-2">
        Before it trusts itself, NyayaSetu scores <strong>three independent checks</strong> — how clearly it
        read your document, how sure it is of the case type, and how well it matched <em>real</em> law. They
        combine into one score. If that score falls below <strong>0.72</strong>, the case is automatically
        handed to a <strong>human lawyer</strong> instead of guessing. That&apos;s the safety switch.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Meter label="Reading the document" value={s.ocr} />
        <Meter label="Understanding the case" value={s.classification} />
        <Meter label="Matching real law" value={s.retrieval} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Meter label="Overall score (needs 0.72+)" value={ens} big tone={escalated ? "amber" : "green"} />
        <p className="mt-2 text-xs text-ink-3">
          {escalated
            ? "Below the safety line — routed to free NALSA legal aid (helpline 15100); a DLSA panel lawyer reviews this case instead."
            : "Above the safety line, so the plan is shown. You're still told to confirm with the office named above."}
        </p>
      </div>
    </Card>
  );
}

function Meter({ label, value, big, tone = "indigo" }: { label: string; value: number; big?: boolean; tone?: "indigo" | "green" | "amber" }) {
  const pct = Math.round(value * 100);
  const color = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--indigo)";
  return (
    <div className="min-w-0">
      <div className="text-xs leading-tight text-ink-3">{label}</div>
      <div className={cn("mt-0.5 font-bold", big ? "text-2xl" : "text-lg")} style={{ color }}>{value.toFixed(2)}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PlanPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const st = results.strategy!;
  const spoken = [
    st.rationale,
    ...st.steps.map((s) => [`${s.order}. ${s.action}`, s.officeAddress, s.contact].filter(Boolean).join(". ")),
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <Card
      title="Action plan"
      badge={
        <div className="flex items-center gap-2">
          <ListenButton text={spoken} lang={speakLang} />
          {st.nalsaEligible ? <Chip tone="green">NALSA free aid</Chip> : null}
        </div>
      }
    >
      {st.rationale && <p className="deva mb-3 text-sm text-ink-2">{st.rationale}</p>}
      <ol className="space-y-3">
        {st.steps.map((s) => (
          <li key={s.order} className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">{s.order}</span>
              <div className="min-w-0">
                <p className="deva font-semibold text-ink">{s.action}</p>
                {s.deadlineDays != null && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber/30 bg-amber-50 px-2 py-1 text-xs font-bold text-amber">
                    ⏳ Act within {s.deadlineDays} days — missing this deadline can bar your case
                  </p>
                )}
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-2">
                  <Info k="Where to go" v={s.office} />
                  <Info k="Whom to meet" v={s.officer} />
                  {s.officeAddress ? <InfoWide k="How to reach" v={s.officeAddress} /> : null}
                  {s.contact ? <InfoWide k="Who to contact" v={s.contact} /> : null}
                  {s.forms?.length ? <Info k="What to file" v={s.forms.join(", ")} /> : null}
                  <Info k="Fee" v={s.fee} />
                </dl>
                {s.office ? (
                  <a
                    href={mapLink(s.office, s.officeAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-indigo hover:border-saffron"
                  >
                    <MapPin className="h-3 w-3" /> Open in Maps ↗
                  </a>
                ) : null}
                {s.citations?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.citations.map((c, i) => (
                      <span key={i} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo">{c.code} §{c.section}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {st.citedChunks?.length ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-3">Grounding — {st.citedChunks.length} retrieved passages</summary>
          <ul className="mt-2 space-y-1 text-xs text-ink-2">
            {st.citedChunks.map((c) => (
              <li key={c.id}><span className="font-semibold text-indigo">{c.code} §{c.section}</span> {c.title} <span className="text-ink-3">({c.score.toFixed(2)})</span></li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}

/** Supporting documents to collect before filing, and where to get them. */
function DocsToCollectCard({ results }: { results: CaseResults }) {
  const list = results.draft?.documentsToCollect ?? [];
  if (!list.length) return null;
  return (
    <Card title="Documents to collect first" badge={<ClipboardList className="h-4 w-4 text-indigo" />}>
      <p className="mb-3 text-xs text-ink-2">Gather these before you file. If you don&apos;t have one, here&apos;s where to get it made.</p>
      <ul className="space-y-2">
        {list.map((c, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-ink-3">{i + 1}</span>
            <div className="min-w-0">
              <p className="deva text-sm font-semibold text-ink">{c.name}</p>
              {c.whereToGet && <p className="deva text-xs text-ink-2">📍 {c.whereToGet}</p>}
              {c.contact && <p className="deva text-xs text-ink-3">📞 {c.contact}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The packet of real forms the user must fill and file, in order. */
function DraftPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const d = results.draft!;
  if (!d.documents?.length) return null;
  return (
    <Card title={`Forms to fill (${d.documents.length})`} badge={<Chip tone="green">Fill by voice</Chip>}>
      <p className="mb-3 text-xs text-ink-2">
        The real forms for your case. Open each, fill your details by <strong>typing or speaking</strong>,
        then file it online or print &amp; submit at the office.
      </p>
      <div className="space-y-3">
        {d.documents.map((doc, i) => (
          <FormCard key={i} doc={doc} index={i} speakLang={speakLang} />
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-3">⚠ Filling is real; submission here is a safe simulation — nothing is sent to a government portal. For anything filed in court, free NALSA legal aid (helpline 15100) reviews it first.</p>
    </Card>
  );
}

/** One fillable form: structured fields (voice/typed), live preview, the real
 *  portal link, and a SAFE simulated submission (nothing is sent to a gov site). */
function FormCard({ doc, index, speakLang }: { doc: DraftDocument; index: number; speakLang: string }) {
  const [open, setOpen] = useState(index === 0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [ref, setRef] = useState<string | null>(null);
  const fields = doc.fields ?? [];

  const fill = (text: string) => {
    let out = text;
    for (const f of fields) {
      const v = values[f.label]?.trim();
      if (v) out = out.split(`[${f.label}]`).join(v);
    }
    return out;
  };
  const filledTitle = fill(doc.title);
  const filledBody = fill(doc.body);
  const remaining = fields.filter((f) => !values[f.label]?.trim()).length;
  const online = doc.submissionMode === "online" && !!doc.portalUrl;

  const download = () => {
    const blob = new Blob([`${filledTitle}\n\n${filledBody}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${doc.kind}.txt`; a.click();
    URL.revokeObjectURL(url);
  };
  const submit = () =>
    setRef(`NS-${(doc.kind.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "DOC")}-${Date.now().toString(36).slice(-6).toUpperCase()}`);

  return (
    <div className="rounded-lg border border-border bg-surface-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-2 p-3 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="deva block text-sm font-bold text-ink" lang={speakLang}>{doc.title || doc.kind}</span>
          {doc.purpose && <span className="deva block text-xs text-ink-2" lang={speakLang}>{doc.purpose}</span>}
          {doc.office && <span className="mt-0.5 block text-xs text-ink-3">🏢 {doc.office}</span>}
        </span>
        <span className="shrink-0 text-right text-xs font-semibold">
          <span className={cn("block rounded px-1.5 py-0.5", online ? "bg-green-50 text-green" : "bg-amber-50 text-amber")}>{online ? "Online" : "Print"}</span>
          <span className="mt-1 block text-indigo">{ref ? "filed ✓" : remaining > 0 ? `${remaining} to fill` : "ready"}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-3">
          {fields.length > 0 && !ref && (
            <div className="mb-3 rounded-lg border border-saffron/30 bg-saffron-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-saffron-600">
                <Mic className="h-3.5 w-3.5" /> Fill the form — type, or tap the mic and speak
              </div>
              <div className="mt-2 space-y-2.5">
                {fields.map((f) => (
                  <FillField key={f.label} label={f.label} hint={f.hint} value={values[f.label] ?? ""} lang={speakLang} onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))} />
                ))}
              </div>
            </div>
          )}

          <details className="mb-3">
            <summary className="cursor-pointer text-xs font-semibold text-ink-3">Preview the filled form</summary>
            <pre className="deva mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-ink" lang={speakLang}>{filledBody}</pre>
          </details>

          {ref ? (
            <div className="rounded-lg border border-green/30 bg-green-50 p-3">
              <div className="flex items-center gap-1.5 text-sm font-bold text-green"><CheckCircle2 className="h-4 w-4" /> Submitted (simulation)</div>
              <p className="mt-1 text-xs text-ink-2">Reference: <span className="font-bold text-ink">{ref}</span> · Status: <strong>Received, under review</strong></p>
              <p className="mt-2 text-xs text-ink-3">This is a safe demo — nothing was sent to a government website. To file for real:</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {online ? (
                  <a href={doc.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-indigo px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-600"><ExternalLink className="h-3 w-3" /> File on {doc.portalName || "the portal"}</a>
                ) : (
                  <button onClick={download} className="flex items-center gap-1 rounded-lg bg-indigo px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-600"><Printer className="h-3 w-3" /> Print &amp; submit at {doc.office || "the office"}</button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={submit} disabled={remaining > 0} className="flex items-center gap-1 rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-600 disabled:opacity-40">
                <Send className="h-3 w-3" /> Submit form{remaining > 0 ? ` (${remaining} left)` : ""}
              </button>
              {online && <a href={doc.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-indigo hover:border-saffron"><ExternalLink className="h-3 w-3" /> {doc.portalName || "Portal"}</a>}
              <button onClick={download} className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2"><Download className="h-3 w-3" /> Download</button>
              <ListenButton text={`${filledTitle}. ${filledBody}`} lang={speakLang} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** A microphone button: tap to record, tap to stop → server-side transcription
 *  (Groq Whisper). Uses MediaRecorder so it works on Brave, Safari and Firefox,
 *  where the browser's built-in Web Speech API is blocked or absent. */
function VoiceMic({ lang, onResult }: { lang: string; onResult: (t: string) => void }) {
  const [status, setStatus] = useState<"idle" | "recording" | "transcribing">("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus("transcribing");
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob, "audio.webm");
          if (lang && lang !== "auto") fd.append("language", lang);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) onResult(data.text);
        } catch {
          /* ignore — user can type */
        }
        setStatus("idle");
      };
      rec.start();
      recRef.current = rec;
      setStatus("recording");
    } catch {
      setStatus("idle"); // mic permission denied
    }
  };

  const toggle = () => {
    if (status === "recording") {
      recRef.current?.stop();
      recRef.current = null;
    } else if (status === "idle") {
      void start();
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={status === "transcribing"}
      aria-label={status === "recording" ? "Stop recording" : "Speak"}
      title={status === "recording" ? "Tap to stop" : "Tap and speak"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
        status === "recording"
          ? "border-red bg-red text-white animate-pulse-dot"
          : "border-border bg-surface text-indigo hover:bg-indigo-50",
      )}
    >
      {status === "transcribing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}

/** One fillable form field: label + text input + voice (ASR) mic. */
function FillField({ label, value, lang, hint, onChange }: { label: string; value: string; lang: string; hint?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="deva mb-0.5 block text-xs font-semibold text-ink-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint || "type or speak"}
          className="deva min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1.5 text-sm text-ink"
        />
        <VoiceMic lang={lang} onResult={onChange} />
      </div>
    </div>
  );
}

/** Floating help chat: a bottom-right button that opens grounded follow-up Q&A
 *  (typed or voice) about the user's case, in their language. */
function FloatingChat({ results, speakLang, caseReady }: { results: CaseResults; speakLang: string; caseReady: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || loading || !caseReady) return;
    setInput("");
    const next = [...messages, { role: "user" as const, text: question }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language: speakLang,
          context: {
            summary: results.document?.summary,
            category: results.document?.category,
            steps: results.strategy?.steps?.map((s) => ({ order: s.order, action: s.action, office: s.office, fee: s.fee })),
            nalsaEligible: results.strategy?.nalsaEligible,
          },
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", text: data.answer ?? data.error ?? "Sorry, please try again." }]);
    } catch {
      setMessages([...next, { role: "assistant", text: "Sorry, please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex max-h-[70vh] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-card border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo" />
              <span className="text-sm font-bold text-ink">Ask about your case</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 text-ink-3 hover:bg-surface-2">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {!caseReady && (
              <div className="rounded-lg border border-amber/30 bg-amber-50 p-3 text-sm text-ink-2">
                <p className="font-semibold text-amber">Upload your document first 📄</p>
                <p className="mt-1">I answer questions about <em>your</em> legal document. Upload a photo, PDF or Word file above and run it — then ask me anything about it, in your language.</p>
                <p className="deva mt-1 text-ink-3">पहले अपना दस्तावेज़ ऊपर अपलोड करें — फिर मुझसे उसके बारे में पूछें।</p>
              </div>
            )}
            {caseReady && messages.length === 0 && (
              <p className="text-sm text-ink-3">
                Ask in your own language — type or tap the mic. E.g. &ldquo;Do I have to pay?&rdquo;, &ldquo;Which documents do I need?&rdquo;
              </p>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="deva ml-8 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-ink">{m.text}</div>
              ) : (
                <div key={i} className="mr-8 rounded-lg bg-surface-2 px-3 py-2">
                  <p className="deva text-sm text-ink" lang={speakLang}>{m.text}</p>
                  <div className="mt-1"><ListenButton text={m.text} lang={speakLang} /></div>
                </div>
              ),
            )}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-3">
                <Loader2 className="h-4 w-4 animate-spin" /> …
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={!caseReady}
              placeholder={caseReady ? "Type your question…" : "Upload a document first…"}
              className="deva min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink disabled:opacity-60"
            />
            {caseReady && <VoiceMic lang={speakLang} onResult={(t) => send(t)} />}
            <button
              onClick={() => send()}
              disabled={loading || !input.trim() || !caseReady}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo text-white hover:bg-indigo-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Ask a question"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-lg transition hover:bg-indigo-600"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}

function TrackingPanel({ results }: { results: CaseResults }) {
  const t = results.tracking!;
  return (
    <Card title="Case tracking" badge={t.simulated ? <Chip tone="amber">Simulated NJDG/eCourts</Chip> : undefined}>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Info k="CNR" v={t.cnr ?? "—"} />
        <Info k="Status" v={t.status} />
        <Info k="Next hearing" v={t.nextHearing ?? "—"} />
      </dl>
      {t.alertsSent.map((a, i) => (
        <div key={i} className="mt-3 rounded-lg border border-green/30 bg-green-50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-green"><BellRing className="h-3.5 w-3.5" />WhatsApp alert sent</div>
          <p className="deva mt-1 text-sm text-ink">{a.message}</p>
        </div>
      ))}
    </Card>
  );
}

function EscalationPanel({ results }: { results: CaseResults }) {
  const e = results.escalation!;
  const a = e.authority;
  return (
    <Card title="Human review — free NALSA legal aid" badge={<Chip tone="amber">Within {e.slaHours}h</Chip>}>
      <p className="text-sm text-ink-2">{e.reason}</p>
      <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-indigo" />
          <span className="font-bold text-ink">{a.name}</span>
        </div>
        <p className="mt-1 text-xs text-ink-2">{a.howToReach}</p>
        <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
          <Info k="Covers" v={a.scope} />
          <Info k="Reference" v={e.bookingRef} />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`tel:${a.helpline}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-saffron px-3 py-2 text-xs font-bold text-white transition hover:bg-saffron-600"
          >
            <Phone className="h-3.5 w-3.5" /> Call {a.helpline} (free)
          </a>
          <a
            href={a.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-indigo transition hover:bg-surface"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Register on {a.portalName}
          </a>
        </div>
        <p className="mt-2 text-[11px] text-ink-3">
          Registering files the {e.registrationForm.title} — free legal aid under the Legal Services Authorities Act, 1987.
        </p>
      </div>
    </Card>
  );
}

/** Free legal aid eligibility under §12 of the Legal Services Authorities Act,
 *  1987 — the concrete grounds a person qualifies on. Self-check, no submission. */
const LSA12_GROUNDS = [
  "A woman or a child",
  "A member of a Scheduled Caste or Scheduled Tribe (SC/ST)",
  "A person with a disability",
  "A victim of trafficking, or of violence (incl. domestic violence)",
  "A victim of a mass disaster, caste atrocity, flood, drought or earthquake",
  "An industrial workman",
  "A person in custody / a protective home / a juvenile home",
  "Annual income below your State's legal-aid ceiling",
];
function EligibilityCard({ eligible }: { eligible?: boolean }) {
  return (
    <Card
      title="Are you eligible for FREE legal aid?"
      badge={eligible ? <Chip tone="green">Likely eligible</Chip> : <Chip tone="indigo">Check below</Chip>}
    >
      <p className="text-sm text-ink-2">
        Under §12 of the Legal Services Authorities Act, 1987, legal aid is <span className="font-bold text-ink">free</span> if
        <span className="font-semibold"> any one</span> of these applies to you:
      </p>
      <ul className="mt-2 space-y-1.5">
        {LSA12_GROUNDS.map((g) => (
          <li key={g} className="flex items-start gap-2 text-sm text-ink-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            <span className="deva">{g}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-3">
        The income ceiling is set by each State (higher for cases before the Supreme Court). To confirm and register, call the
        free NALSA helpline <a href="tel:15100" className="font-bold text-indigo">15100</a>.
      </p>
    </Card>
  );
}

/* ── small bits ─────────────────────────────────────────────────────────── */
function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-3">{k}</dt>
      <dd className="deva truncate font-semibold text-ink" title={v}>{v}</dd>
    </div>
  );
}
function HelplinesCard({ speakLang }: { speakLang: string }) {
  const spoken = HELPLINES.map((h) => `${h.label}, ${h.num.split("").join(" ")}`).join(". ");
  return (
    <Card title="Free helplines — tap to call" badge={<ListenButton text={spoken} lang={speakLang} />}>
      <div className="grid grid-cols-2 gap-2">
        {HELPLINES.map((h) => (
          <a
            key={h.num}
            href={`tel:${h.num}`}
            className="rounded-lg border border-border bg-surface-2 p-3 transition hover:border-saffron"
          >
            <div className="text-xs text-ink-3">{h.label}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-lg font-extrabold text-indigo">
              <Phone className="h-4 w-4" />
              {h.num}
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
/** Full-width field that wraps (for addresses / contact details). */
function InfoWide({ k, v }: { k: string; v: string }) {
  return (
    <div className="col-span-2 min-w-0">
      <dt className="text-ink-3">{k}</dt>
      <dd className="deva font-semibold text-ink break-words">{v}</dd>
    </div>
  );
}
function Chip({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo" | "green" | "amber" }) {
  const map = { indigo: "bg-indigo-50 text-indigo", green: "bg-green-50 text-green", amber: "bg-amber-50 text-amber" };
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", map[tone])}>{children}</span>;
}

/** Reads text aloud in the user's language — the core non-reader affordance.
 *  Uses the /api/tts proxy (reliable multilingual audio on any device) and
 *  falls back to the browser's own speech engine if that ever fails. */
function ListenButton({ text, lang }: { text: string; lang: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  if (!text) return null;

  const speakViaBrowser = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text.slice(0, 900));
    u.lang = BCP47[lang] ?? "en-IN";
    u.rate = 0.95;
    u.onend = () => setStatus("idle");
    u.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(u);
    setStatus("playing");
  };

  const toggle = async () => {
    if (status !== "idle") {
      stopSpeaking();
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text.slice(0, 900))}`);
      if (!res.ok) throw new Error("tts");
      const url = URL.createObjectURL(await res.blob());
      stopSpeaking();
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => setStatus("idle");
      audio.onerror = () => speakViaBrowser();
      await audio.play();
      setStatus("playing");
    } catch {
      speakViaBrowser();
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo transition hover:bg-indigo-100 disabled:opacity-60"
      aria-label={status === "playing" ? "Stop reading aloud" : "Read aloud"}
    >
      {status === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "playing" ? (
        <Square className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {status === "playing" ? "Stop" : status === "loading" ? "…" : "Listen"}
    </button>
  );
}
function NotLegalCard({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const d = results.document!;
  return (
    <section className="rounded-card border border-amber/40 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-amber" />
        <h3 className="text-sm font-bold text-amber">This doesn&apos;t look like a legal document</h3>
        <div className="ml-auto"><ListenButton text={d.summary} lang={speakLang} /></div>
      </div>
      {d.summary && <p className="deva mt-2 text-sm text-ink-2" lang={speakLang}>{d.summary}</p>}
      <p className="mt-3 text-sm text-ink-2">
        Please upload a photo, PDF or Word file of an actual legal document — an
        <strong> FIR, court notice, land/property paper, summons, or legal letter</strong>. I can only
        help with legal documents, and I won&apos;t guess a plan for anything else.
      </p>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-10 text-center">
      <Scale className="h-8 w-8 text-ink-3" />
      <p className="mt-3 font-bold text-ink">Document in. Justice out.</p>
      <p className="mt-1 max-w-sm text-sm text-ink-3">Upload a legal document and watch five agents read it, ground a strategy in real statute, draft the filing, and track the case — live.</p>
    </div>
  );
}
