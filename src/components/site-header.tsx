import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BridgeMark />
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-indigo">NyayaSetu</span>
            <span className="deva text-sm font-semibold text-saffron">न्याय सेतु</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/#how"
            className="hidden rounded-lg px-3 py-2 text-ink-2 hover:bg-surface-2 sm:block"
          >
            How it works
          </Link>
          <Link
            href="/#trust"
            className="hidden rounded-lg px-3 py-2 text-ink-2 hover:bg-surface-2 sm:block"
          >
            Trust &amp; safety
          </Link>
          <Link
            href="/demo"
            className="rounded-lg bg-indigo px-4 py-2 text-white shadow-sm transition hover:bg-indigo-600"
          >
            Try the demo
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** The "Setu" (bridge) brand mark — a bridge arc over a river. */
export function BridgeMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--indigo)" />
      <path
        d="M6 22c4.5 0 6-8 10-8s5.5 8 10 8"
        stroke="var(--saffron)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M6 22v-3M26 22v-3M13 22v-4M19 22v-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
