/**
 * Render a completed case as a WhatsApp text reply — the plan a non-reader
 * receives after sending a photo. Fully localised: both the AI-generated content
 * AND the fixed labels are in the user's language. WhatsApp supports only
 * *bold* / _italic_.
 */
import type { CaseState, LanguageCode } from "@/lib/types";

interface Labels {
  notLegal: string;
  meaning: string;
  whatToDo: string;
  idsMasked: (n: number) => string;
  nalsa: string;
  escalated: (name: string, district: string, hours: number) => string;
  nextHearing: (date: string) => string;
  helplines: string;
  disclaimer: string;
}

const LABELS: Record<LanguageCode, Labels> = {
  en: {
    notLegal: "⚠️ This doesn't look like a legal document. Please send a photo or PDF of an actual legal paper — an FIR, court notice, land paper, or legal letter.",
    meaning: "📄 *What this means:*",
    whatToDo: "✅ *What to do:*",
    idsMasked: (n) => `🔒 ${n} personal ID(s) (Aadhaar/PAN/phone) were hidden for your safety.`,
    nalsa: "🆓 You likely qualify for *FREE* legal aid from NALSA.",
    escalated: (name, district, hours) =>
      `👩‍⚖️ Your case is being sent to a verified lawyer — *${name}* (${district}). They will respond within ${hours} hours.`,
    nextHearing: (date) => `📅 Next hearing / follow-up: ${date}`,
    helplines: "☎️ *Free helplines:* Legal aid 15100 · Women 181 · Police 112",
    disclaimer:
      "_This is first-response guidance, not a final legal opinion. Please confirm with the office named above. A lawyer reviews anything filed in court._",
  },
  hi: {
    notLegal: "⚠️ यह कानूनी दस्तावेज़ नहीं लगता। कृपया किसी असली कानूनी कागज़ (FIR, कोर्ट नोटिस, ज़मीन का कागज़, या कानूनी पत्र) की फ़ोटो या PDF भेजें।",
    meaning: "📄 *इसका मतलब:*",
    whatToDo: "✅ *क्या करना है:*",
    idsMasked: (n) => `🔒 आपकी सुरक्षा के लिए ${n} व्यक्तिगत पहचान (आधार/पैन/फ़ोन) छिपाई गई।`,
    nalsa: "🆓 आप NALSA से *मुफ़्त* कानूनी सहायता के पात्र हो सकते हैं।",
    escalated: (name, district, hours) =>
      `👩‍⚖️ आपका मामला एक सत्यापित वकील — *${name}* (${district}) को भेजा जा रहा है। वे ${hours} घंटे में संपर्क करेंगे।`,
    nextHearing: (date) => `📅 अगली सुनवाई / कार्रवाई: ${date}`,
    helplines: "☎️ *मुफ़्त हेल्पलाइन:* कानूनी सहायता 15100 · महिला 181 · पुलिस 112",
    disclaimer:
      "_यह प्रारंभिक मार्गदर्शन है, अंतिम कानूनी राय नहीं। कृपया ऊपर बताए गए कार्यालय से पुष्टि करें। अदालत में दाखिल किसी भी दस्तावेज़ की समीक्षा एक वकील द्वारा की जाती है।_",
  },
  bn: {
    notLegal: "⚠️ এটি আইনি নথি বলে মনে হচ্ছে না। অনুগ্রহ করে একটি প্রকৃত আইনি কাগজ (FIR, আদালতের নোটিশ, জমির কাগজ, বা আইনি চিঠি)-এর ছবি বা PDF পাঠান।",
    meaning: "📄 *এর মানে কী:*",
    whatToDo: "✅ *কী করবেন:*",
    idsMasked: (n) => `🔒 আপনার নিরাপত্তার জন্য ${n}টি ব্যক্তিগত পরিচয় (আধার/প্যান/ফোন) লুকানো হয়েছে।`,
    nalsa: "🆓 আপনি সম্ভবত NALSA থেকে *বিনামূল্যে* আইনি সহায়তার যোগ্য।",
    escalated: (name, district, hours) =>
      `👩‍⚖️ আপনার মামলা একজন যাচাইকৃত আইনজীবী — *${name}* (${district})-এর কাছে পাঠানো হচ্ছে। তাঁরা ${hours} ঘণ্টার মধ্যে যোগাযোগ করবেন।`,
    nextHearing: (date) => `📅 পরবর্তী শুনানি / পদক্ষেপ: ${date}`,
    helplines: "☎️ *বিনামূল্যে হেল্পলাইন:* আইনি সহায়তা 15100 · নারী 181 · পুলিশ 112",
    disclaimer:
      "_এটি প্রাথমিক নির্দেশনা, চূড়ান্ত আইনি মতামত নয়। উপরে উল্লিখিত অফিসে নিশ্চিত করুন। আদালতে দাখিল করা যেকোনো নথি একজন আইনজীবী পর্যালোচনা করেন।_",
  },
  ta: {
    notLegal: "⚠️ இது சட்ட ஆவணமாகத் தெரியவில்லை. உண்மையான சட்ட ஆவணத்தின் (FIR, நீதிமன்ற அறிவிப்பு, நில ஆவணம், அல்லது சட்டக் கடிதம்) புகைப்படம் அல்லது PDF அனுப்பவும்.",
    meaning: "📄 *இதன் பொருள்:*",
    whatToDo: "✅ *என்ன செய்ய வேண்டும்:*",
    idsMasked: (n) => `🔒 உங்கள் பாதுகாப்பிற்காக ${n} தனிப்பட்ட அடையாளங்கள் (ஆதார்/பான்/தொலைபேசி) மறைக்கப்பட்டன.`,
    nalsa: "🆓 நீங்கள் NALSA மூலம் *இலவச* சட்ட உதவிக்கு தகுதி பெறலாம்.",
    escalated: (name, district, hours) =>
      `👩‍⚖️ உங்கள் வழக்கு சரிபார்க்கப்பட்ட வழக்கறிஞர் — *${name}* (${district})க்கு அனுப்பப்படுகிறது. அவர்கள் ${hours} மணி நேரத்தில் தொடர்பு கொள்வார்கள்.`,
    nextHearing: (date) => `📅 அடுத்த விசாரணை / நடவடிக்கை: ${date}`,
    helplines: "☎️ *இலவச உதவி எண்கள்:* சட்ட உதவி 15100 · பெண்கள் 181 · காவல்துறை 112",
    disclaimer:
      "_இது முதற்கட்ட வழிகாட்டுதல், இறுதி சட்ட ஆலோசனை அல்ல. மேலே குறிப்பிட்ட அலுவலகத்தில் உறுதிப்படுத்தவும். நீதிமன்றத்தில் தாக்கல் செய்யப்படும் ஆவணங்களை வழக்கறிஞர் சரிபார்ப்பார்._",
  },
  te: {
    notLegal: "⚠️ ఇది న్యాయ పత్రంలా అనిపించడం లేదు. దయచేసి అసలైన న్యాయ పత్రం (FIR, కోర్టు నోటీసు, భూమి పత్రం, లేదా న్యాయ లేఖ) ఫోటో లేదా PDF పంపండి.",
    meaning: "📄 *దీని అర్థం:*",
    whatToDo: "✅ *ఏమి చేయాలి:*",
    idsMasked: (n) => `🔒 మీ భద్రత కోసం ${n} వ్యక్తిగత గుర్తింపులు (ఆధార్/పాన్/ఫోన్) దాచబడ్డాయి.`,
    nalsa: "🆓 మీరు NALSA నుండి *ఉచిత* న్యాయ సహాయానికి అర్హులు కావచ్చు.",
    escalated: (name, district, hours) =>
      `👩‍⚖️ మీ కేసు ధృవీకరించబడిన న్యాయవాది — *${name}* (${district})కు పంపబడుతోంది. వారు ${hours} గంటల్లో సంప్రదిస్తారు.`,
    nextHearing: (date) => `📅 తదుపరి విచారణ / చర్య: ${date}`,
    helplines: "☎️ *ఉచిత హెల్ప్‌లైన్లు:* న్యాయ సహాయం 15100 · మహిళలు 181 · పోలీసు 112",
    disclaimer:
      "_ఇది ప్రాథమిక మార్గదర్శకం, తుది న్యాయ అభిప్రాయం కాదు. పైన పేర్కొన్న కార్యాలయంలో నిర్ధారించుకోండి. కోర్టులో దాఖలు చేసే ఏ పత్రాన్నైనా న్యాయవాది సమీక్షిస్తారు._",
  },
  mr: {
    notLegal: "⚠️ हे कायदेशीर कागदपत्र वाटत नाही. कृपया खऱ्या कायदेशीर कागदाची (FIR, कोर्ट नोटीस, जमिनीचा कागद, किंवा कायदेशीर पत्र) फोटो किंवा PDF पाठवा.",
    meaning: "📄 *याचा अर्थ:*",
    whatToDo: "✅ *काय करावे:*",
    idsMasked: (n) => `🔒 तुमच्या सुरक्षिततेसाठी ${n} वैयक्तिक ओळख (आधार/पॅन/फोन) लपवण्यात आल्या.`,
    nalsa: "🆓 तुम्ही NALSA कडून *मोफत* कायदेशीर मदतीसाठी पात्र असू शकता.",
    escalated: (name, district, hours) =>
      `👩‍⚖️ तुमचे प्रकरण सत्यापित वकील — *${name}* (${district}) यांच्याकडे पाठवले जात आहे. ते ${hours} तासांत संपर्क करतील.`,
    nextHearing: (date) => `📅 पुढील सुनावणी / कार्यवाही: ${date}`,
    helplines: "☎️ *मोफत हेल्पलाइन:* कायदेशीर मदत 15100 · महिला 181 · पोलीस 112",
    disclaimer:
      "_हे प्राथमिक मार्गदर्शन आहे, अंतिम कायदेशीर मत नाही. वरील कार्यालयात खात्री करा. न्यायालयात दाखल होणाऱ्या कोणत्याही कागदपत्राची वकील तपासणी करतात._",
  },
};

export function formatCaseForWhatsApp(state: CaseState): string {
  const L = LABELS[state.language] ?? LABELS.en;
  const d = state.document;

  // Not a legal document → warn instead of fabricating a plan.
  if (d && !d.isLegalDocument) {
    return `*NyayaSetu · न्याय सेतु*\n\n${L.notLegal}${d.summary ? `\n\n${d.summary}` : ""}`;
  }

  const parts: string[] = ["*NyayaSetu · न्याय सेतु*"];
  if (d?.summary) parts.push(`\n${L.meaning}\n${d.summary}`);
  if (d?.redactions?.length) parts.push(`\n${L.idsMasked(d.redactions.length)}`);

  if (state.strategy?.steps?.length) {
    parts.push(`\n${L.whatToDo}`);
    for (const s of state.strategy.steps) {
      const bits = [`*${s.order}.* ${s.action}`];
      if (s.office) bits.push(`   🏢 ${s.office}`);
      if (s.officeAddress) bits.push(`   📍 ${s.officeAddress}`);
      if (s.contact) bits.push(`   📞 ${s.contact}`);
      if (s.forms?.length) bits.push(`   📝 ${s.forms.join(", ")}`);
      if (s.fee) bits.push(`   💰 ${s.fee}`);
      parts.push(bits.join("\n"));
    }
    if (state.strategy.nalsaEligible) parts.push(`\n${L.nalsa}`);
  }

  if (state.escalated && state.escalation) {
    const a = state.escalation.authority;
    parts.push(`\n${L.escalated(a.name, a.scope, state.escalation.slaHours)}`);
  }
  if (state.tracking?.nextHearing) parts.push(`\n${L.nextHearing(state.tracking.nextHearing)}`);

  parts.push(`\n${L.helplines}`);
  parts.push(`\n${L.disclaimer}`);

  const text = parts.join("\n");
  return text.length > 1550 ? text.slice(0, 1540) + "…" : text;
}

/**
 * The same localised plan, cleaned up to be SPOKEN aloud — emoji, markdown,
 * URLs and bullet symbols stripped — so a user who cannot read gets the whole
 * thing as a WhatsApp voice note.
 */
export function speakableCase(state: CaseState): string {
  return formatCaseForWhatsApp(state)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_~`>#]/g, "")
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{20E3}]/gu, "")
    .replace(/[·•]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bilingual welcome shown when a user first texts (before any language is known). */
export const WELCOME =
  "नमस्ते / Namaste 🙏\n\nमैं *NyayaSetu* हूँ — आपकी मुफ़्त कानूनी मदद।\nI am *NyayaSetu*, your free legal-aid helper.\n\n📸 अपने कानूनी दस्तावेज़ (FIR, नोटिस, ज़मीन का कागज़) की *फ़ोटो* भेजें — मैं आसान भाषा में बताऊँगा कि इसका मतलब क्या है और आगे क्या करना है।\nSend a *photo* of your legal document and I'll tell you what it means and what to do.\n\n🗣️ जवाब हिंदी में चाहिए? फ़ोटो के साथ *hindi* लिखें (या tamil, telugu, bengali, marathi).";
