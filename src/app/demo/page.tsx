import { BridgeMark } from "@/components/site-header";
import { DemoClient } from "./DemoClient";

export const metadata = {
  title: "NyayaSetu — Free Legal Help",
};

// The WhatsApp number people message. Override with NEXT_PUBLIC_WHATSAPP_NUMBER
// (digits only, with country code) when you move off the Meta test number.
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "15551508887";

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
          <span className="ml-auto hidden text-xs font-semibold text-ink-3 sm:inline">
            Free legal help · मुफ़्त कानूनी मदद
          </span>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi NyayaSetu")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1DA851] sm:ml-4"
            title="Send your document on WhatsApp and get the plan back — text and voice"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.44.13-.59.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.14.19 2.01 3.06 4.86 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z" />
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.02h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 01-1.25-4.35c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.21-8.24 8.21z" />
            </svg>
            WhatsApp
          </a>
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
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink-3">
              <span className="mt-0.5 text-[#25D366]">●</span>
              <span>
                <strong className="text-ink-2">Also on WhatsApp</strong> — in this prototype it works only for
                pre-registered numbers, built on the free <strong>Meta WhatsApp Cloud API</strong>. On
                commercialisation it moves to a verified <strong>WhatsApp Business</strong> number anyone can message
                directly.
              </span>
            </p>
          </div>
        </div>
        <DemoClient />
      </main>
    </>
  );
}
