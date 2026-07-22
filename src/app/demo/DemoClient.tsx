"use client";

import { useRef, useState } from "react";
import { Camera, Images, FileText, Scale, PenLine, BellRing, UserCheck, ShieldCheck, Loader2, Download, Volume2, Square, Phone, Mic, Send, MessageCircle, X, MapPin, ExternalLink, Printer, CheckCircle2, ClipboardList } from "lucide-react";
import { useCaseStream, type CaseResults } from "@/lib/use-case-stream";
import { SUPPORTED_LANGUAGES, type AgentName, type CaseEvent, type DraftDocument } from "@/lib/types";
import { STATE_OPTIONS } from "@/lib/jurisdiction";
import { ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Output-language options (the user picks per run; "auto" follows the document).
const LANG_OPTIONS: { code: string; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  ...Object.entries(SUPPORTED_LANGUAGES).map(([code, l]) => ({ code, label: `${l.native} (${l.name})` })),
];

const BCP47: Record<string, string> = {
  hi: "hi-IN", en: "en-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", kn: "kn-IN", auto: "en-IN",
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

/** Pull a dialable number (phone/helpline) out of free text, if present. */
function phoneOf(s?: string): string | null {
  const m = s?.match(/\+?\d[\d\s-]{2,}\d/);
  const digits = m?.[0].replace(/[^\d+]/g, "") ?? "";
  return digits.length >= 3 ? digits : null;
}
/** Pull a URL out of free text, if present. */
function urlOf(s?: string): string | null {
  return s?.match(/https?:\/\/[^\s)]+/i)?.[0] ?? null;
}

// Phrases that are NOT a place ("you already have it", "not applicable", etc.),
// across the supported languages — these must never become a Maps link.
const NON_PLACE = /\b(yourself|you (already )?have|already (have|with)|in your possession|at home|self|not applicable|n\/?a|none|online)\b|स्वयं|अपने पास|आपके पास|घर पर|पहले से|নিজের কাছে|আপনার কাছে|উপলব্ধ|உங்களிடம்|கையில்|మీ వద్ద|మీ దగ్గర|స్వయం|स्वतःकडे|तुमच्याकडे/i;

/** A contact/location line. A portal URL becomes a link and a phone/helpline a
 *  tap-to-call link. With mapsFallback, a genuine place name becomes a Maps
 *  search — but a "you already have it"-type phrase stays as plain text. */
function LinkyLine({ icon, text, mapsFallback = false }: { icon: string; text: string; mapsFallback?: boolean }) {
  const url = urlOf(text);
  const tel = phoneOf(text);
  const link = "deva block text-xs text-indigo hover:underline";
  if (url) return <a href={url} target="_blank" rel="noopener noreferrer" className={link}>{icon} {text}</a>;
  if (tel) return <a href={`tel:${tel}`} className={link}>{icon} {text}</a>;
  if (mapsFallback && !NON_PLACE.test(text)) return <a href={mapLink(text)} target="_blank" rel="noopener noreferrer" className={link}>{icon} {text}</a>;
  return <p className="deva block text-xs text-ink-3">{icon} {text}</p>;
}

// GENUINE FIRs pulled live from the Delhi Police public FIR portal
// (cctns.delhipolice.gov.in) — real scanned government documents, so reviewers
// can test the engine on authentic real-world inputs. Personal identifiers are
// masked by the Document Agent at OCR time. Files live in /public/examples/real.
const REAL_CASES: { file: string; mediaType: string; label: string; hint: string }[] = [
  { file: "/examples/real/fir-0149.pdf", mediaType: "application/pdf", label: "Real FIR — street food-cart vendor", hint: "Obstruction of public way · Civil Lines, Delhi" },
  { file: "/examples/real/fir-0056.pdf", mediaType: "application/pdf", label: "Real FIR — defacement of public property", hint: "Govt. school · Civil Lines, Delhi" },
  { file: "/examples/real/fir-0129.pdf", mediaType: "application/pdf", label: "Real FIR — public nuisance (BNS §285)", hint: "Civil Lines, Delhi" },
  { file: "/examples/real/fir-0151.pdf", mediaType: "application/pdf", label: "Real FIR — footpath stall obstruction", hint: "Civil Lines, Delhi" },
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

  // Load a bundled real-world-format sample and run it through the live pipeline.
  const runSampleDoc = async (file: string, mediaType: string) => {
    stopSpeaking();
    const blob = await (await fetch(file)).blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
    const type = blob.type || mediaType;
    setImage({ dataUrl, mediaType: type, name: file.split("/").pop() ?? "sample" });
    run(dataUrl, type, lang, stateCode === "auto" ? undefined : stateCode);
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
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
              <ClipboardList className="h-3.5 w-3.5" /> Or test on a real published FIR
            </span>
            <div className="mt-1.5 grid grid-cols-1 gap-2">
              {REAL_CASES.map((c) => (
                <button
                  key={c.file}
                  onClick={() => runSampleDoc(c.file, c.mediaType)}
                  disabled={state.running}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left transition hover:border-saffron disabled:opacity-40"
                >
                  <span className="block text-sm font-bold text-ink">{c.label}</span>
                  <span className="block text-xs text-ink-3">{c.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-3">
              Genuine scanned FIRs from the{" "}
              <a href="https://cctns.delhipolice.gov.in/citizen/firSearch.htm" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo hover:underline">Delhi Police public FIR portal ↗</a>{" "}
              — personal IDs are masked automatically.
            </p>
            <button
              onClick={playSample}
              disabled={state.running}
              className="mt-2 text-xs font-semibold text-indigo hover:underline disabled:opacity-40"
            >
              or play an offline sample (works with no internet) →
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
              {state.running ? "Working…" : "Get my help →"}
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

        {hasRun && <AgentTrace events={state.events} escalated={!!state.results.escalation} running={state.running} lang={speakLang} />}
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
        {state.results.strategy && <EligibilityCard eligible={state.results.strategy.nalsaEligible} speakLang={speakLang} />}
        {state.results.draft?.documentsToCollect?.length ? <DocsToCollectCard results={state.results} speakLang={speakLang} /> : null}
        {state.results.draft && <DraftPanel results={state.results} speakLang={speakLang} />}
        {state.results.strategy && <HelplinesCard speakLang={speakLang} />}
        {state.results.escalation && <EscalationPanel results={state.results} speakLang={speakLang} />}
      </div>
      <FloatingChat
        results={state.results}
        speakLang={speakLang}
        caseReady={state.done && !!state.results.document?.isLegalDocument}
      />
    </div>
  );
}

/* ── Progress ───────────────────────────────────────────────────────────── */
// Plain-language steps a user understands — no internal agent jargon. Labels are
// localised via i18n; icons are static.
const PROGRESS_ICON: Record<AgentName, typeof FileText> = {
  document: FileText, strategy: Scale, drafting: PenLine, tracking: BellRing, escalation: UserCheck,
};
function AgentTrace({ events, escalated, running, lang }: { events: CaseEvent[]; escalated: boolean; running: boolean; lang: string }) {
  const S = ui(lang);
  const LABEL: Record<AgentName, string> = {
    document: S.progReading, strategy: S.progFinding, drafting: S.progPreparing,
    tracking: S.progSettingUp, escalation: S.progConnecting,
  };
  const flow: AgentName[] = ["document", "strategy", "drafting", escalated ? "escalation" : "tracking"];
  const statusOf = (a: AgentName) => {
    const evs = events.filter((e) => e.agent === a);
    if (evs.some((e) => e.status === "done" || e.status === "escalated")) return "done";
    if (evs.some((e) => e.status === "running")) return "running";
    return "pending";
  };
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-3">{S.progressTitle}</h2>
      <ol className="mt-4 space-y-1">
        {flow.map((a) => {
          const st = statusOf(a);
          const label = LABEL[a];
          const Icon = PROGRESS_ICON[a];
          return (
            <li key={a} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border", st === "done" ? "border-green bg-green-50 text-green" : st === "running" ? "border-saffron bg-saffron-50 text-saffron-600" : "border-border bg-surface-2 text-ink-3")}>
                  {st === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : st === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="my-0.5 h-full w-px flex-1 bg-border last:hidden" />
              </div>
              <div className="pb-4">
                <div className={cn("text-sm font-bold", st === "pending" ? "text-ink-3" : "text-ink")}>{label}</div>
              </div>
            </li>
          );
        })}
      </ol>
      {running && <p className="text-xs italic text-ink-3">{S.pleaseWait}</p>}
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
      title={ui(speakLang).docTitle}
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
    </Card>
  );
}

function PlanPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const st = results.strategy!;
  const S = ui(speakLang);
  const spoken = [
    st.rationale,
    ...st.steps.map((s) => [`${s.order}. ${s.action}`, s.officeAddress, s.contact].filter(Boolean).join(". ")),
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <Card
      title={S.planTitle}
      badge={
        <div className="flex items-center gap-2">
          <ListenButton text={spoken} lang={speakLang} />
          {st.nalsaEligible ? <Chip tone="green">{S.nalsaChip}</Chip> : null}
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
                    ⏳ {S.actWithin(s.deadlineDays)}
                  </p>
                )}
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-2">
                  <Info k={S.whereToGo} v={s.office} />
                  <Info k={S.whomToMeet} v={s.officer} />
                  {s.officeAddress ? <InfoWide k={S.howToReach} v={s.officeAddress} /> : null}
                  {s.contact ? <InfoWide k={S.whoToContact} v={s.contact} /> : null}
                  {s.forms?.length ? <Info k={S.whatToFile} v={s.forms.join(", ")} /> : null}
                  <Info k={S.fee} v={s.fee} />
                </dl>
                {s.office ? (
                  <a
                    href={mapLink(s.office, s.officeAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-indigo hover:border-saffron"
                  >
                    <MapPin className="h-3 w-3" /> {S.openInMaps} ↗
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** Supporting documents to collect before filing, and where to get them. */
function DocsToCollectCard({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const list = results.draft?.documentsToCollect ?? [];
  const S = ui(speakLang);
  if (!list.length) return null;
  return (
    <Card title={S.docsTitle} badge={<ClipboardList className="h-4 w-4 text-indigo" />}>
      <p className="mb-3 text-xs text-ink-2">{S.docsIntro}</p>
      <ul className="space-y-2">
        {list.map((c, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-ink-3">{i + 1}</span>
            <div className="min-w-0">
              <p className="deva text-sm font-semibold text-ink">{c.name}</p>
              {c.whereToGet && <LinkyLine icon="📍" text={c.whereToGet} mapsFallback />}
              {c.contact && <LinkyLine icon="📞" text={c.contact} />}
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
  const S = ui(speakLang);
  if (!d.documents?.length) return null;
  return (
    <Card title={S.formsTitle(d.documents.length)} badge={<Chip tone="green">{S.fillByVoice}</Chip>}>
      <p className="mb-3 text-xs text-ink-2">{S.formsIntro}</p>
      <div className="space-y-3">
        {d.documents.map((doc, i) => (
          <FormCard key={i} doc={doc} index={i} speakLang={speakLang} />
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-3">⚠ {S.formsDisclaimer}</p>
    </Card>
  );
}

/** One fillable form: structured fields (voice/typed), live preview, the real
 *  portal link, and a SAFE simulated submission (nothing is sent to a gov site). */
function FormCard({ doc, index, speakLang }: { doc: DraftDocument; index: number; speakLang: string }) {
  const [open, setOpen] = useState(index === 0);
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = doc.fields ?? [];
  const S = ui(speakLang);

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
          <span className={cn("block rounded px-1.5 py-0.5", online ? "bg-green-50 text-green" : "bg-amber-50 text-amber")}>{online ? S.fileOnline : S.printSubmit}</span>
          <span className="mt-1 block text-indigo">{remaining > 0 ? S.toFill(remaining) : S.ready}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-3">
          {fields.length > 0 && (
            <div className="mb-3 rounded-lg border border-saffron/30 bg-saffron-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-saffron-600">
                <Mic className="h-3.5 w-3.5" /> {S.fillDetails}
              </div>
              <div className="mt-2 space-y-2.5">
                {fields.map((f) => (
                  <FillField key={f.label} label={f.label} hint={f.hint} value={values[f.label] ?? ""} lang={speakLang} onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))} />
                ))}
              </div>
            </div>
          )}

          {/* The actual form, filling in live as the user types — this IS the document they submit. */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-ink-3">{S.yourForm} {remaining > 0 ? S.fillsAsYouType : S.formReady}</span>
              <ListenButton text={`${filledTitle}. ${filledBody}`} lang={speakLang} />
            </div>
            <pre className="deva max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-ink" lang={speakLang}>{filledBody}</pre>
          </div>

          {/* Where/whom to give it to, a contact, and what happens next. */}
          <dl className="mb-3 grid grid-cols-1 gap-1.5 rounded-lg border border-border bg-surface p-3 text-xs">
            {(doc.submitTo || doc.office) && (
              <div><dt className="text-ink-3">{S.giveTo}</dt><dd className="deva font-semibold text-ink">{doc.submitTo || doc.office}</dd></div>
            )}
            {doc.office && (
              <div><dt className="text-ink-3">{S.whereSubmit}</dt><dd><a href={mapLink(doc.office, doc.officeAddress)} target="_blank" rel="noopener noreferrer" className="deva font-semibold text-indigo hover:underline">📍 {doc.officeAddress || doc.office} ↗</a></dd></div>
            )}
            {doc.contact && (
              <div><dt className="text-ink-3">{S.contactLabel}</dt><dd><LinkyLine icon="📞" text={doc.contact} /></dd></div>
            )}
            {doc.afterSubmit && (
              <div><dt className="text-ink-3">{S.whatNext}</dt><dd className="deva text-ink-2">{doc.afterSubmit}</dd></div>
            )}
          </dl>

          {/* Real next step — the user submits it themselves. Nothing is auto-sent. */}
          <div className="rounded-lg border border-indigo/20 bg-indigo-50 p-3">
            <p className="text-xs font-bold text-ink">{S.submitYourself}</p>
            {online ? (
              <p className="mt-1 text-xs text-ink-2">{S.fillOnPortal}</p>
            ) : (
              <p className="mt-1 flex items-start gap-1 text-xs text-ink-2"><Printer className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {S.printAt(doc.office || "")}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {online && (
                <a href={doc.portalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-indigo px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-600">
                  <ExternalLink className="h-3.5 w-3.5" /> {S.openOfficial(doc.portalName || "the portal")}
                </a>
              )}
              <button onClick={download} className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2">
                <Download className="h-3.5 w-3.5" /> {S.download}
              </button>
            </div>
            {remaining > 0 && <p className="mt-2 text-[11px] text-amber">{S.fillFirst(remaining)}</p>}
          </div>
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

function EscalationPanel({ results, speakLang }: { results: CaseResults; speakLang: string }) {
  const e = results.escalation!;
  const a = e.authority;
  return (
    <Card title={ui(speakLang).escTitle} badge={<Chip tone="amber">Within {e.slaHours}h</Chip>}>
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
 *  1987 — an interactive self-check: the user says whether any ground applies,
 *  and is told, in their language, whether they qualify. */
function EligibilityCard({ eligible, speakLang }: { eligible?: boolean; speakLang: string }) {
  const S = ui(speakLang);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  return (
    <Card
      title={S.eligTitle}
      badge={eligible ? <Chip tone="green">{S.eligBadgeLikely}</Chip> : <Chip tone="indigo">{S.eligBadgeCheck}</Chip>}
    >
      <p className="deva text-sm text-ink-2">{S.eligIntro}</p>
      <ul className="mt-2 space-y-1.5">
        {S.eligGrounds.map((g) => (
          <li key={g} className="flex items-start gap-2 text-sm text-ink-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            <span className="deva">{g}</span>
          </li>
        ))}
      </ul>
      <p className="deva mt-3 text-sm font-bold text-ink">{S.eligQuestion}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setAnswer("yes")}
          className={cn("deva rounded-lg border px-3 py-1.5 text-sm font-bold transition", answer === "yes" ? "border-green bg-green-50 text-green" : "border-border text-ink-2 hover:border-green")}
        >
          {S.eligYes}
        </button>
        <button
          onClick={() => setAnswer("no")}
          className={cn("deva rounded-lg border px-3 py-1.5 text-sm font-bold transition", answer === "no" ? "border-amber bg-amber-50 text-amber" : "border-border text-ink-2 hover:border-amber")}
        >
          {S.eligNo}
        </button>
      </div>
      {answer && (
        <div className={cn("mt-3 flex items-start justify-between gap-2 rounded-lg border p-3", answer === "yes" ? "border-green/30 bg-green-50" : "border-amber/30 bg-amber-50")}>
          <p className={cn("deva text-sm font-semibold", answer === "yes" ? "text-green" : "text-ink-2")}>
            {answer === "yes" ? S.eligibleMsg : S.notEligibleMsg}
          </p>
          <a href="tel:15100" className="shrink-0 rounded-lg bg-saffron px-2.5 py-1.5 text-xs font-bold text-white hover:bg-saffron-600">15100</a>
        </div>
      )}
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
  const S = ui(speakLang);
  const spoken = HELPLINES.map((h) => `${h.label}, ${h.num.split("").join(" ")}`).join(". ");
  return (
    <Card title={S.helplinesTitle} badge={<ListenButton text={spoken} lang={speakLang} />}>
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
      <p className="mt-3 font-bold text-ink">Your help will appear here</p>
      <p className="mt-1 max-w-sm text-sm text-ink-3">Take a photo of your legal document to get a simple, step-by-step plan in your language — what it means, where to go, and which forms to fill.</p>
    </div>
  );
}
