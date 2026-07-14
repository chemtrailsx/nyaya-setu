import { SiteHeader } from "@/components/site-header";
import { DemoClient } from "./DemoClient";

export const metadata = {
  title: "NyayaSetu — Live Demo",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-bg">
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              See a case resolved
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              Upload a photographed legal document — five agents read it, ground a
              strategy in the Bharatiya Nyaya Sanhita, draft the filing, and track
              the case, escalating to a human lawyer when confidence is low.
            </p>
          </div>
        </div>
        <DemoClient />
      </main>
    </>
  );
}
