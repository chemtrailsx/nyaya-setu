"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Scale, PenLine, BellRing, UserCheck, ShieldCheck, Loader2, Download, Volume2, Square } from "lucide-react";
import { useCaseStream, type CaseResults } from "@/lib/use-case-stream";
import { SUPPORTED_LANGUAGES, type AgentName, type CaseEvent, type LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

// Output-language options (the user picks per run; "auto" follows the document).
const LANG_OPTIONS: { code: string; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  ...Object.entries(SUPPORTED_LANGUAGES).map(([code, l]) => ({ code, label: `${l.native} (${l.name})` })),
];

const BCP47: Record<string, string> = {
  hi: "hi-IN", en: "en-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", auto: "en-IN",
};

// One-click sample documents so judges can test instantly.
const EXAMPLES = [
  { url: "/examples/radha-land-notice.png", name: "radha-land-notice.png", label: "Land / inheritance dispute", hint: "Widow's mutation case" },
  { url: "/examples/fir-denial-notice.png", name: "fir-denial-notice.png", label: "FIR denial (women-first)", hint: "Dense advocate's legal notice" },
];

/** Read text aloud in the user's language — the core non-reader affordance. */
function speak(text: string, langCode: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[langCode] ?? "en-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
function stopSpeaking() {
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
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      setImage({ dataUrl: reader.result as string, mediaType: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const start = () => {
    if (!image) return;
    stopSpeaking();
    run(image.dataUrl, image.mediaType, lang);
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
    run(img.dataUrl, img.mediaType, lang);
  };
  // The BCP-47 tag to read results aloud with: the chosen language, or the
  // document's detected language when on auto.
  const speakLang = lang !== "auto" ? lang : state.results.document?.language ?? "en";

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
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3">Upload a document</h2>
          {!image ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2 px-4 py-8 text-center transition hover:border-saffron"
            >
              <Upload className="h-6 w-6 text-ink-3" />
              <span className="text-sm font-semibold text-ink-2">Choose a photo</span>
              <span className="text-xs text-ink-3">FIR, land deed, notice, summons — JPG/PNG</span>
            </button>
          ) : (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt={image.name} className="max-h-56 w-full rounded-lg border border-border object-contain bg-surface-2" />
              <p className="mt-2 truncate text-xs text-ink-3">{image.name}</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />

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
          </div>

          <label className="mt-4 block">
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
        {state.results.document && <DocumentPanel results={state.results} speakLang={speakLang} />}
        {state.results.signals && <ConfidencePanel results={state.results} />}
        {state.results.strategy && <PlanPanel results={state.results} speakLang={speakLang} />}
        {state.results.draft && <DraftPanel results={state.results} speakLang={speakLang} />}
        {state.results.tracking && <TrackingPanel results={state.results} />}
        {state.results.escalation && <EscalationPanel results={state.results} />}
      </div>
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
    <Card title="Calibrated confidence" badge={<Chip tone={escalated ? "amber" : "green"}>{escalated ? "Escalated to human" : "Cleared threshold"}</Chip>}>
      <div className="grid grid-cols-3 gap-3">
        {([["OCR", s.ocr], ["Classification", s.classification], ["Retrieval", s.retrieval]] as const).map(([k, v]) => (
          <Meter key={k} label={k} value={v} />
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Meter label={`Ensemble (threshold ${(0.72).toFixed(2)})`} value={ens} big tone={escalated ? "amber" : "green"} />
      </div>
    </Card>
  );
}

function Meter({ label, value, big, tone = "indigo" }: { label: string; value: number; big?: boolean; tone?: "indigo" | "green" | "amber" }) {
  const pct = Math.round(value * 100);
  const color = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--indigo)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-3">{label}</span>
        <span className={cn("font-bold", big ? "text-lg" : "text-sm")} style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function PlanPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const st = results.strategy!;
  const spoken = [st.rationale, ...st.steps.map((s) => `${s.order}. ${s.action}`)].filter(Boolean).join(". ");
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
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-2">
                  <Info k="Office" v={s.office} />
                  <Info k="Officer" v={s.officer} />
                  {s.forms?.length ? <Info k="Forms" v={s.forms.join(", ")} /> : null}
                  <Info k="Fee" v={s.fee} />
                  {s.deadlineDays != null && <Info k="Deadline" v={`${s.deadlineDays} days`} />}
                </dl>
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

function DraftPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const d = results.draft!;
  const download = () => {
    const blob = new Blob([d.body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.kind}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card
      title="Drafted filing"
      badge={
        <div className="flex items-center gap-2">
          <ListenButton text={`${d.title}. ${d.body}`} lang={speakLang} />
          <button onClick={download} className="flex items-center gap-1 rounded-lg bg-indigo px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-600"><Download className="h-3 w-3" />Download</button>
        </div>
      }
    >
      <p className="mb-2 deva font-bold text-ink break-words" lang={speakLang}>{d.title}</p>
      <pre className="deva max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-2 p-4 text-sm leading-relaxed text-ink" lang={speakLang}>{d.body}</pre>
      <p className="mt-2 text-xs text-ink-3">⚠ A Bar Council-verified advocate reviews any filing before it goes to court. Verify with the named office before acting.</p>
    </Card>
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
  return (
    <Card title="Human review gate" badge={<Chip tone="amber">SLA {e.slaHours}h</Chip>}>
      <p className="text-sm text-ink-2">{e.reason}</p>
      <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-indigo" />
          <span className="font-bold text-ink">{e.advocate.name}</span>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
          <Info k="Bar ID" v={e.advocate.barId} />
          <Info k="DLSA" v={e.advocate.dlsaDistrict} />
          <Info k="Booking" v={e.bookingRef} />
        </dl>
      </div>
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
function Chip({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo" | "green" | "amber" }) {
  const map = { indigo: "bg-indigo-50 text-indigo", green: "bg-green-50 text-green", amber: "bg-amber-50 text-amber" };
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", map[tone])}>{children}</span>;
}

/** Reads text aloud in the user's language — the core non-reader affordance. */
function ListenButton({ text, lang }: { text: string; lang: string }) {
  const [on, setOn] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported || !text) return null;
  const toggle = () => {
    if (on) {
      window.speechSynthesis.cancel();
      setOn(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang] ?? "en-IN";
    u.rate = 0.95;
    u.onend = () => setOn(false);
    u.onerror = () => setOn(false);
    window.speechSynthesis.speak(u);
    setOn(true);
  };
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo transition hover:bg-indigo-100"
      aria-label={on ? "Stop reading aloud" : "Read aloud"}
    >
      {on ? <Square className="h-3 w-3" /> : <Volume2 className="h-3.5 w-3.5" />}
      {on ? "Stop" : "Listen"}
    </button>
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
