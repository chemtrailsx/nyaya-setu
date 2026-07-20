import "./_loadenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runDocumentAgent } from "@/lib/agents/document-agent";

const FILES = [
  "public/examples/real/fir-0056.pdf",
  "public/examples/real/fir-0129.pdf",
  "public/examples/real/fir-0151.pdf",
];

async function main() {
  console.log("Extracting summaries from the remaining Delhi Police FIRs...");
  for (const f of FILES) {
    try {
      const base64 = readFileSync(join(process.cwd(), f)).toString("base64");
      const res = await runDocumentAgent({ base64, mediaType: "application/pdf" }, "en");
      console.log(`\n=== FILE: ${f} ===`);
      console.log(`SUMMARY: ${res.summary}`);
      console.log(`SECTIONS: ${JSON.stringify(res.sections)}`);
    } catch (e) {
      console.error(`Error reading ${f}:`, e);
    }
  }
}

main().catch(console.error);
