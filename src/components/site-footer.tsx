import { BridgeMark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-2">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BridgeMark className="h-7 w-7" />
            <span className="text-sm font-bold text-indigo">
              NyayaSetu <span className="deva font-medium text-ink-3">· न्याय सेतु</span>
            </span>
          </div>
          <p className="max-w-md text-sm text-ink-3">
            Building the infrastructure for equal justice in India — one document,
            one action, one life at a time.
          </p>
        </div>
        <p className="mt-6 text-xs text-ink-3">
          NyayaSetu · ScriptedBy&#123;Her&#125; 2.0 · Building for Bharat with Agentic AI.
          A prototype: first-response legal aid, not a substitute for a lawyer.
        </p>
      </div>
    </footer>
  );
}
