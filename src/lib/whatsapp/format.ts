/**
 * Render a completed case as a WhatsApp text reply — the plan a non-reader
 * receives after sending a photo. Kept compact and plain (WhatsApp has no rich
 * formatting beyond *bold* / _italic_).
 */
import type { CaseState } from "@/lib/types";

export function formatCaseForWhatsApp(state: CaseState): string {
  const parts: string[] = [];
  const d = state.document;

  parts.push("*NyayaSetu · न्याय सेतु*");

  if (d?.summary) parts.push(`\n📄 *What this means:*\n${d.summary}`);

  if (d?.redactions?.length) {
    parts.push(`\n🔒 ${d.redactions.length} personal ID(s) (Aadhaar/PAN/phone) were hidden for your safety.`);
  }

  if (state.strategy?.steps?.length) {
    parts.push("\n✅ *What to do:*");
    for (const s of state.strategy.steps) {
      const bits = [`*${s.order}.* ${s.action}`];
      if (s.office) bits.push(`   🏢 ${s.office}`);
      if (s.officeAddress) bits.push(`   📍 ${s.officeAddress}`);
      if (s.contact) bits.push(`   📞 ${s.contact}`);
      if (s.forms?.length) bits.push(`   📝 ${s.forms.join(", ")}`);
      if (s.fee) bits.push(`   💰 ${s.fee}`);
      parts.push(bits.join("\n"));
    }
    if (state.strategy.nalsaEligible) {
      parts.push("\n🆓 You likely qualify for *FREE* legal aid from NALSA.");
    }
  }

  if (state.escalated && state.escalation) {
    parts.push(
      `\n👩‍⚖️ Your case is being sent to a verified lawyer — *${state.escalation.advocate.name}* (${state.escalation.advocate.dlsaDistrict}). They will respond within ${state.escalation.slaHours} hours.`,
    );
  }

  if (state.tracking?.nextHearing) {
    parts.push(`\n📅 Next hearing / follow-up: ${state.tracking.nextHearing}`);
  }

  parts.push("\n☎️ *Free helplines:* Legal aid 15100 · Women 181 · Police 112");
  parts.push("\n_This is first-response guidance, not a final legal opinion. Please confirm with the office named above. A lawyer reviews anything filed in court._");

  // WhatsApp caps a message body around 1600 chars for the sandbox; trim safely.
  const text = parts.join("\n");
  return text.length > 1550 ? text.slice(0, 1540) + "…" : text;
}

export const WELCOME =
  "नमस्ते / Namaste 🙏\n\nI am *NyayaSetu*, your free legal-aid helper.\n\n📸 Just send me a *photo* of your legal document (an FIR, a court notice, a land paper, a legal letter) and I will tell you — in simple words — what it means and exactly what to do next.\n\n🗣️ Want the reply in your language? Send the word *hindi*, *tamil*, *telugu*, *bengali* or *marathi* along with your photo.";
