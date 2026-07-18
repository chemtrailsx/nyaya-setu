import { BridgeMark } from "@/components/site-header";
import { DemoClient } from "./DemoClient";

export const metadata = {
  title: "NyayaSetu — Free Legal Help",
};

export default function DemoPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2.5 px-5">
          <BridgeMark />
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-indigo">NyayaSetu</span>
            <span className="deva text-sm font-semibold text-saffron">न्याय सेतु</span>
          </span>
          <span className="ml-auto text-xs font-semibold text-ink-3">Free legal help · मुफ़्त कानूनी मदद</span>
        </div>
      </header>
      <main className="flex-1 bg-bg">
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Understand your legal document
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              Take a photo of any legal paper — FIR, land document, court notice or letter — and
              get simple, step-by-step help in your own language, free.
            </p>
          </div>
        </div>
        <DemoClient />
      </main>
    </>
  );
}
