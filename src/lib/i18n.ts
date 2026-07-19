/**
 * UI string localisation for the demo result panels. The AGENT content (summary,
 * plan, forms) is already generated in the user's language; this covers the
 * static UI chrome (labels, buttons, card titles) so that when a user picks a
 * language, EVERYTHING they see is in that language — not just the AI text.
 */
import type { LanguageCode } from "@/lib/types";

export interface UIStrings {
  listen: string;
  progressTitle: string;
  progReading: string;
  progFinding: string;
  progPreparing: string;
  progSettingUp: string;
  progConnecting: string;
  pleaseWait: string;

  docTitle: string;

  planTitle: string;
  whereToGo: string;
  whomToMeet: string;
  howToReach: string;
  whoToContact: string;
  whatToFile: string;
  fee: string;
  openInMaps: string;
  actWithin: (n: number) => string;
  nalsaChip: string;

  docsTitle: string;
  docsIntro: string;

  formsTitle: (n: number) => string;
  fillByVoice: string;
  formsIntro: string;
  fillDetails: string;
  yourForm: string;
  fillsAsYouType: string;
  formReady: string;
  toFill: (n: number) => string;
  ready: string;
  fileOnline: string;
  printSubmit: string;
  submitYourself: string;
  fillOnPortal: string;
  openOfficial: (portal: string) => string;
  download: string;
  printAt: (office: string) => string;
  fillFirst: (n: number) => string;
  giveTo: string;
  whereSubmit: string;
  contactLabel: string;
  whatNext: string;
  formsDisclaimer: string;

  helplinesTitle: string;
  escTitle: string;

  eligTitle: string;
  eligIntro: string;
  eligGrounds: string[];
  eligQuestion: string;
  eligYes: string;
  eligNo: string;
  eligibleMsg: string;
  notEligibleMsg: string;
  eligBadgeLikely: string;
  eligBadgeCheck: string;
}

const en: UIStrings = {
  listen: "Listen",
  progressTitle: "Progress",
  progReading: "Reading your document",
  progFinding: "Finding the law that applies to you",
  progPreparing: "Preparing your plan and forms",
  progSettingUp: "Setting up your case",
  progConnecting: "Connecting you to a free lawyer",
  pleaseWait: "Please wait a moment…",
  docTitle: "What the document says",
  planTitle: "Action plan",
  whereToGo: "Where to go",
  whomToMeet: "Whom to meet",
  howToReach: "How to reach",
  whoToContact: "Who to contact",
  whatToFile: "What to file",
  fee: "Fee",
  openInMaps: "Open in Maps",
  actWithin: (n) => `Act within ${n} days — missing this deadline can bar your case`,
  nalsaChip: "NALSA free aid",
  docsTitle: "Documents to collect first",
  docsIntro: "Gather these before you file. If you don't have one, here's where to get it made.",
  formsTitle: (n) => `Forms to fill (${n})`,
  fillByVoice: "Fill by voice",
  formsIntro: "The real forms for your case. Open each, fill your details by typing or speaking — your form fills in live below — then submit it yourself.",
  fillDetails: "Fill in your details — type, or tap the mic and speak",
  yourForm: "Your form",
  fillsAsYouType: "(fills in as you type)",
  formReady: "— ready",
  toFill: (n) => `${n} to fill`,
  ready: "ready",
  fileOnline: "File online",
  printSubmit: "Print & submit",
  submitYourself: "Submit it yourself — we never send it for you:",
  fillOnPortal: "Fill your details into the real form on the official portal:",
  openOfficial: (p) => `Open the official form on ${p}`,
  download: "Download filled form",
  printAt: (o) => `Download it, print, sign, and submit at ${o}.`,
  fillFirst: (n) => `Fill the ${n} field(s) above first so your form is complete.`,
  giveTo: "Give the form to",
  whereSubmit: "Where to submit",
  contactLabel: "Contact / helpline",
  whatNext: "What happens next",
  formsDisclaimer: "We help you fill the real form; you submit it yourself on the official portal or at the office — nothing is auto-sent. For anything filed in court, free NALSA legal aid (helpline 15100) reviews it first.",
  helplinesTitle: "Free helplines — tap to call",
  escTitle: "Human review — free NALSA legal aid",
  eligTitle: "Are you eligible for FREE legal aid?",
  eligIntro: "Under §12 of the Legal Services Authorities Act, 1987, legal aid is FREE if any one of these applies to you:",
  eligGrounds: [
    "A woman or a child",
    "A member of a Scheduled Caste or Scheduled Tribe (SC/ST)",
    "A person with a disability",
    "A victim of trafficking, or of violence (incl. domestic violence)",
    "A victim of a mass disaster, caste atrocity, flood, drought or earthquake",
    "An industrial workman",
    "A person in custody / a protective home / a juvenile home",
    "Annual income below your State's legal-aid ceiling",
  ],
  eligQuestion: "Does any one of the above apply to you?",
  eligYes: "Yes, one applies to me",
  eligNo: "No, none apply",
  eligibleMsg: "✅ You qualify for FREE legal aid. Call the NALSA helpline 15100 to register — a lawyer will be given to you at no cost.",
  notEligibleMsg: "You may still qualify based on your income. Call the free NALSA helpline 15100 to check — it costs nothing to ask.",
  eligBadgeLikely: "Likely eligible",
  eligBadgeCheck: "Check below",
};

const hi: UIStrings = {
  listen: "सुनें",
  progressTitle: "प्रगति",
  progReading: "आपका दस्तावेज़ पढ़ा जा रहा है",
  progFinding: "आप पर लागू कानून खोजा जा रहा है",
  progPreparing: "आपकी योजना और फ़ॉर्म तैयार किए जा रहे हैं",
  progSettingUp: "आपका मामला तैयार किया जा रहा है",
  progConnecting: "आपको मुफ़्त वकील से जोड़ा जा रहा है",
  pleaseWait: "कृपया थोड़ा प्रतीक्षा करें…",
  docTitle: "दस्तावेज़ में क्या लिखा है",
  planTitle: "कार्य योजना",
  whereToGo: "कहाँ जाएँ",
  whomToMeet: "किससे मिलें",
  howToReach: "कैसे पहुँचें",
  whoToContact: "किससे संपर्क करें",
  whatToFile: "क्या जमा करें",
  fee: "शुल्क",
  openInMaps: "नक्शे में खोलें",
  actWithin: (n) => `${n} दिनों के भीतर कार्रवाई करें — यह समय-सीमा चूकने पर आपका मामला रुक सकता है`,
  nalsaChip: "NALSA मुफ़्त सहायता",
  docsTitle: "पहले ये दस्तावेज़ इकट्ठा करें",
  docsIntro: "जमा करने से पहले ये इकट्ठा करें। यदि कोई आपके पास नहीं है, तो यहाँ बनवाएँ।",
  formsTitle: (n) => `भरने के लिए फ़ॉर्म (${n})`,
  fillByVoice: "बोलकर भरें",
  formsIntro: "आपके मामले के असली फ़ॉर्म। हर एक खोलें, अपनी जानकारी लिखकर या बोलकर भरें — आपका फ़ॉर्म नीचे तुरंत भरता जाएगा — फिर आप स्वयं जमा करें।",
  fillDetails: "अपनी जानकारी भरें — लिखें, या माइक दबाकर बोलें",
  yourForm: "आपका फ़ॉर्म",
  fillsAsYouType: "(जैसे-जैसे आप लिखेंगे, भरता जाएगा)",
  formReady: "— तैयार",
  toFill: (n) => `${n} भरना बाकी`,
  ready: "तैयार",
  fileOnline: "ऑनलाइन जमा करें",
  printSubmit: "प्रिंट कर जमा करें",
  submitYourself: "आप स्वयं जमा करें — हम आपकी ओर से नहीं भेजते:",
  fillOnPortal: "आधिकारिक पोर्टल पर असली फ़ॉर्म में अपनी जानकारी भरें:",
  openOfficial: (p) => `${p} पर आधिकारिक फ़ॉर्म खोलें`,
  download: "भरा हुआ फ़ॉर्म डाउनलोड करें",
  printAt: (o) => `इसे डाउनलोड करें, प्रिंट करें, हस्ताक्षर करें, और ${o} में जमा करें।`,
  fillFirst: (n) => `पहले ऊपर के ${n} खाने भरें ताकि आपका फ़ॉर्म पूरा हो।`,
  giveTo: "फ़ॉर्म किसे दें",
  whereSubmit: "कहाँ जमा करें",
  contactLabel: "संपर्क / हेल्पलाइन",
  whatNext: "आगे क्या होगा",
  formsDisclaimer: "हम आपको असली फ़ॉर्म भरने में मदद करते हैं; आप इसे स्वयं आधिकारिक पोर्टल पर या कार्यालय में जमा करें — कुछ भी अपने आप नहीं भेजा जाता। अदालत में दाखिल किसी भी दस्तावेज़ की समीक्षा पहले मुफ़्त NALSA कानूनी सहायता (हेल्पलाइन 15100) करती है।",
  helplinesTitle: "मुफ़्त हेल्पलाइन — दबाकर कॉल करें",
  escTitle: "मानवीय समीक्षा — मुफ़्त NALSA कानूनी सहायता",
  eligTitle: "क्या आप मुफ़्त कानूनी सहायता के पात्र हैं?",
  eligIntro: "कानूनी सेवा प्राधिकरण अधिनियम, 1987 की धारा 12 के तहत, यदि इनमें से कोई एक भी आप पर लागू होता है तो कानूनी सहायता मुफ़्त है:",
  eligGrounds: [
    "महिला या बच्चा",
    "अनुसूचित जाति या अनुसूचित जनजाति (SC/ST) का सदस्य",
    "दिव्यांग व्यक्ति",
    "मानव तस्करी या हिंसा (घरेलू हिंसा सहित) का पीड़ित",
    "सामूहिक आपदा, जातीय अत्याचार, बाढ़, सूखा या भूकंप का पीड़ित",
    "औद्योगिक कामगार",
    "हिरासत / सुरक्षा गृह / बाल गृह में रहने वाला व्यक्ति",
    "आपके राज्य की आय-सीमा से कम वार्षिक आय",
  ],
  eligQuestion: "क्या ऊपर में से कोई एक भी आप पर लागू होता है?",
  eligYes: "हाँ, एक लागू होता है",
  eligNo: "नहीं, कोई नहीं",
  eligibleMsg: "✅ आप मुफ़्त कानूनी सहायता के पात्र हैं। रजिस्टर करने के लिए NALSA हेल्पलाइन 15100 पर कॉल करें — आपको मुफ़्त में वकील दिया जाएगा।",
  notEligibleMsg: "आप अपनी आय के आधार पर फिर भी पात्र हो सकते हैं। जाँचने के लिए मुफ़्त NALSA हेल्पलाइन 15100 पर कॉल करें — पूछने में कोई शुल्क नहीं।",
  eligBadgeLikely: "संभवतः पात्र",
  eligBadgeCheck: "नीचे जाँचें",
};

const bn: UIStrings = {
  listen: "শুনুন",
  progressTitle: "অগ্রগতি",
  progReading: "আপনার নথি পড়া হচ্ছে",
  progFinding: "আপনার জন্য প্রযোজ্য আইন খোঁজা হচ্ছে",
  progPreparing: "আপনার পরিকল্পনা ও ফর্ম তৈরি হচ্ছে",
  progSettingUp: "আপনার মামলা প্রস্তুত হচ্ছে",
  progConnecting: "আপনাকে বিনামূল্যে আইনজীবীর সাথে যুক্ত করা হচ্ছে",
  pleaseWait: "একটু অপেক্ষা করুন…",
  docTitle: "নথিতে যা লেখা আছে",
  planTitle: "কর্ম পরিকল্পনা",
  whereToGo: "কোথায় যাবেন",
  whomToMeet: "কার সাথে দেখা করবেন",
  howToReach: "কীভাবে পৌঁছাবেন",
  whoToContact: "কার সাথে যোগাযোগ করবেন",
  whatToFile: "কী জমা দেবেন",
  fee: "ফি",
  openInMaps: "মানচিত্রে খুলুন",
  actWithin: (n) => `${n} দিনের মধ্যে ব্যবস্থা নিন — এই সময়সীমা মিস করলে আপনার মামলা আটকে যেতে পারে`,
  nalsaChip: "NALSA বিনামূল্যে সহায়তা",
  docsTitle: "প্রথমে এই নথিগুলি সংগ্রহ করুন",
  docsIntro: "জমা দেওয়ার আগে এগুলি সংগ্রহ করুন। যদি কোনোটি না থাকে, এখানে তৈরি করান।",
  formsTitle: (n) => `পূরণের ফর্ম (${n})`,
  fillByVoice: "বলে পূরণ করুন",
  formsIntro: "আপনার মামলার আসল ফর্ম। প্রতিটি খুলুন, টাইপ করে বা বলে আপনার তথ্য দিন — নিচে ফর্মটি সাথে সাথে পূরণ হবে — তারপর নিজে জমা দিন।",
  fillDetails: "আপনার তথ্য দিন — টাইপ করুন, বা মাইকে বলুন",
  yourForm: "আপনার ফর্ম",
  fillsAsYouType: "(টাইপ করার সাথে সাথে পূরণ হয়)",
  formReady: "— প্রস্তুত",
  toFill: (n) => `${n}টি বাকি`,
  ready: "প্রস্তুত",
  fileOnline: "অনলাইনে জমা দিন",
  printSubmit: "প্রিন্ট করে জমা দিন",
  submitYourself: "নিজে জমা দিন — আমরা আপনার হয়ে পাঠাই না:",
  fillOnPortal: "সরকারি পোর্টালে আসল ফর্মে আপনার তথ্য দিন:",
  openOfficial: (p) => `${p}-এ সরকারি ফর্ম খুলুন`,
  download: "পূরণ করা ফর্ম ডাউনলোড করুন",
  printAt: (o) => `এটি ডাউনলোড করুন, প্রিন্ট করুন, স্বাক্ষর করুন, এবং ${o}-এ জমা দিন।`,
  fillFirst: (n) => `আগে উপরের ${n}টি ঘর পূরণ করুন যাতে ফর্মটি সম্পূর্ণ হয়।`,
  giveTo: "ফর্মটি কাকে দেবেন",
  whereSubmit: "কোথায় জমা দেবেন",
  contactLabel: "যোগাযোগ / হেল্পলাইন",
  whatNext: "এরপর কী হবে",
  formsDisclaimer: "আমরা আসল ফর্ম পূরণে সাহায্য করি; আপনি নিজে সরকারি পোর্টালে বা অফিসে জমা দেন — কিছুই স্বয়ংক্রিয়ভাবে পাঠানো হয় না। আদালতে জমা দেওয়া যেকোনো নথি প্রথমে বিনামূল্যে NALSA আইনি সহায়তা (হেল্পলাইন 15100) পর্যালোচনা করে।",
  helplinesTitle: "বিনামূল্যে হেল্পলাইন — চেপে কল করুন",
  escTitle: "মানবিক পর্যালোচনা — বিনামূল্যে NALSA আইনি সহায়তা",
  eligTitle: "আপনি কি বিনামূল্যে আইনি সহায়তার যোগ্য?",
  eligIntro: "আইনি পরিষেবা কর্তৃপক্ষ আইন, ১৯৮৭-এর ধারা ১২ অনুযায়ী, এর মধ্যে যেকোনো একটি আপনার ক্ষেত্রে প্রযোজ্য হলে আইনি সহায়তা বিনামূল্যে:",
  eligGrounds: [
    "একজন নারী বা শিশু",
    "তফসিলি জাতি বা তফসিলি উপজাতি (SC/ST)-এর সদস্য",
    "একজন প্রতিবন্ধী ব্যক্তি",
    "পাচার বা সহিংসতার (গার্হস্থ্য সহিংসতা সহ) শিকার",
    "গণ-দুর্যোগ, জাতিগত অত্যাচার, বন্যা, খরা বা ভূমিকম্পের শিকার",
    "একজন শিল্প-শ্রমিক",
    "হেফাজত / সুরক্ষা গৃহ / শিশু গৃহে থাকা ব্যক্তি",
    "আপনার রাজ্যের আয়-সীমার নিচে বার্ষিক আয়",
  ],
  eligQuestion: "উপরের যেকোনো একটি কি আপনার ক্ষেত্রে প্রযোজ্য?",
  eligYes: "হ্যাঁ, একটি প্রযোজ্য",
  eligNo: "না, কোনোটিই নয়",
  eligibleMsg: "✅ আপনি বিনামূল্যে আইনি সহায়তার যোগ্য। নিবন্ধনের জন্য NALSA হেল্পলাইন 15100-এ কল করুন — বিনামূল্যে একজন আইনজীবী দেওয়া হবে।",
  notEligibleMsg: "আপনার আয়ের ভিত্তিতে আপনি এখনও যোগ্য হতে পারেন। জানতে বিনামূল্যে NALSA হেল্পলাইন 15100-এ কল করুন — জিজ্ঞাসা করতে কোনো খরচ নেই।",
  eligBadgeLikely: "সম্ভবত যোগ্য",
  eligBadgeCheck: "নিচে দেখুন",
};

const ta: UIStrings = {
  listen: "கேளுங்கள்",
  progressTitle: "முன்னேற்றம்",
  progReading: "உங்கள் ஆவணம் படிக்கப்படுகிறது",
  progFinding: "உங்களுக்குப் பொருந்தும் சட்டம் தேடப்படுகிறது",
  progPreparing: "உங்கள் திட்டமும் படிவங்களும் தயாராகின்றன",
  progSettingUp: "உங்கள் வழக்கு அமைக்கப்படுகிறது",
  progConnecting: "இலவச வழக்கறிஞருடன் இணைக்கப்படுகிறீர்கள்",
  pleaseWait: "தயவுசெய்து சிறிது காத்திருங்கள்…",
  docTitle: "ஆவணத்தில் என்ன உள்ளது",
  planTitle: "செயல் திட்டம்",
  whereToGo: "எங்கு செல்ல வேண்டும்",
  whomToMeet: "யாரை சந்திக்க வேண்டும்",
  howToReach: "எப்படி அடைவது",
  whoToContact: "யாரை தொடர்பு கொள்ள வேண்டும்",
  whatToFile: "எதைத் தாக்கல் செய்ய வேண்டும்",
  fee: "கட்டணம்",
  openInMaps: "வரைபடத்தில் திற",
  actWithin: (n) => `${n} நாட்களுக்குள் நடவடிக்கை எடுங்கள் — இந்த காலக்கெடுவைத் தவறவிட்டால் உங்கள் வழக்கு தடைபடலாம்`,
  nalsaChip: "NALSA இலவச உதவி",
  docsTitle: "முதலில் இந்த ஆவணங்களைச் சேகரிக்கவும்",
  docsIntro: "தாக்கல் செய்வதற்கு முன் இவற்றைச் சேகரிக்கவும். ஏதேனும் இல்லாவிட்டால், இங்கே பெறலாம்.",
  formsTitle: (n) => `நிரப்ப வேண்டிய படிவங்கள் (${n})`,
  fillByVoice: "பேசி நிரப்பவும்",
  formsIntro: "உங்கள் வழக்கின் உண்மையான படிவங்கள். ஒவ்வொன்றையும் திறந்து, தட்டச்சு செய்தோ பேசியோ உங்கள் விவரங்களை நிரப்பவும் — உங்கள் படிவம் கீழே உடனுக்குடன் நிரம்பும் — பிறகு நீங்களே தாக்கல் செய்யவும்.",
  fillDetails: "உங்கள் விவரங்களை நிரப்பவும் — தட்டச்சு செய்யவும், அல்லது மைக்கைத் தட்டி பேசவும்",
  yourForm: "உங்கள் படிவம்",
  fillsAsYouType: "(நீங்கள் தட்டச்சு செய்யும்போது நிரம்பும்)",
  formReady: "— தயார்",
  toFill: (n) => `${n} நிரப்ப வேண்டும்`,
  ready: "தயார்",
  fileOnline: "ஆன்லைனில் தாக்கல் செய்",
  printSubmit: "அச்சிட்டு சமர்ப்பி",
  submitYourself: "நீங்களே சமர்ப்பிக்கவும் — நாங்கள் உங்களுக்காக அனுப்புவதில்லை:",
  fillOnPortal: "அதிகாரப்பூர்வ போர்ட்டலில் உண்மையான படிவத்தில் உங்கள் விவரங்களை நிரப்பவும்:",
  openOfficial: (p) => `${p} இல் அதிகாரப்பூர்வ படிவத்தைத் திற`,
  download: "நிரப்பிய படிவத்தைப் பதிவிறக்கு",
  printAt: (o) => `அதைப் பதிவிறக்கி, அச்சிட்டு, கையொப்பமிட்டு, ${o} இல் சமர்ப்பிக்கவும்.`,
  fillFirst: (n) => `படிவம் முழுமையாக இருக்க முதலில் மேலே உள்ள ${n} புலங்களை நிரப்பவும்.`,
  giveTo: "படிவத்தை யாரிடம் கொடுக்க வேண்டும்",
  whereSubmit: "எங்கு சமர்ப்பிக்க வேண்டும்",
  contactLabel: "தொடர்பு / உதவி எண்",
  whatNext: "அடுத்து என்ன நடக்கும்",
  formsDisclaimer: "உண்மையான படிவத்தை நிரப்ப நாங்கள் உதவுகிறோம்; நீங்களே அதை அதிகாரப்பூர்வ போர்ட்டலில் அல்லது அலுவலகத்தில் சமர்ப்பிக்கவும் — எதுவும் தானாக அனுப்பப்படாது. நீதிமன்றத்தில் தாக்கல் செய்யப்படும் எந்த ஆவணத்தையும் முதலில் இலவச NALSA சட்ட உதவி (உதவி எண் 15100) பரிசீலிக்கிறது.",
  helplinesTitle: "இலவச உதவி எண்கள் — தட்டி அழைக்கவும்",
  escTitle: "மனித பரிசீலனை — இலவச NALSA சட்ட உதவி",
  eligTitle: "நீங்கள் இலவச சட்ட உதவிக்குத் தகுதியுடையவரா?",
  eligIntro: "சட்டச் சேவை ஆணைய சட்டம், 1987 இன் பிரிவு 12 இன் கீழ், இவற்றில் ஏதேனும் ஒன்று உங்களுக்குப் பொருந்தினால் சட்ட உதவி இலவசம்:",
  eligGrounds: [
    "ஒரு பெண் அல்லது குழந்தை",
    "பட்டியல் சாதி அல்லது பழங்குடியினர் (SC/ST) உறுப்பினர்",
    "மாற்றுத்திறனாளி",
    "கடத்தல் அல்லது வன்முறை (குடும்ப வன்முறை உட்பட) பாதிக்கப்பட்டவர்",
    "பேரிடர், சாதி அட்டூழியம், வெள்ளம், வறட்சி அல்லது நிலநடுக்கத்தால் பாதிக்கப்பட்டவர்",
    "ஒரு தொழிலாளி",
    "காவலில் / பாதுகாப்பு இல்லம் / சிறுவர் இல்லத்தில் உள்ளவர்",
    "உங்கள் மாநிலத்தின் வருமான வரம்பிற்குக் குறைவான ஆண்டு வருமானம்",
  ],
  eligQuestion: "மேலே உள்ளவற்றில் ஏதேனும் ஒன்று உங்களுக்குப் பொருந்துகிறதா?",
  eligYes: "ஆம், ஒன்று பொருந்துகிறது",
  eligNo: "இல்லை, எதுவும் இல்லை",
  eligibleMsg: "✅ நீங்கள் இலவச சட்ட உதவிக்குத் தகுதியுடையவர். பதிவு செய்ய NALSA உதவி எண் 15100 ஐ அழைக்கவும் — இலவசமாக ஒரு வழக்கறிஞர் வழங்கப்படுவார்.",
  notEligibleMsg: "உங்கள் வருமானத்தின் அடிப்படையில் நீங்கள் இன்னும் தகுதி பெறலாம். சரிபார்க்க இலவச NALSA உதவி எண் 15100 ஐ அழைக்கவும் — கேட்பதற்கு எந்தக் கட்டணமும் இல்லை.",
  eligBadgeLikely: "தகுதி இருக்கலாம்",
  eligBadgeCheck: "கீழே சரிபார்க்கவும்",
};

const te: UIStrings = {
  listen: "వినండి",
  progressTitle: "పురోగతి",
  progReading: "మీ పత్రం చదవబడుతోంది",
  progFinding: "మీకు వర్తించే చట్టం వెతకబడుతోంది",
  progPreparing: "మీ ప్రణాళిక మరియు ఫారమ్‌లు సిద్ధమవుతున్నాయి",
  progSettingUp: "మీ కేసు సిద్ధం చేయబడుతోంది",
  progConnecting: "మిమ్మల్ని ఉచిత న్యాయవాదితో కలుపుతున్నాము",
  pleaseWait: "దయచేసి కొంచెం వేచి ఉండండి…",
  docTitle: "పత్రంలో ఏముంది",
  planTitle: "కార్యాచరణ ప్రణాళిక",
  whereToGo: "ఎక్కడికి వెళ్లాలి",
  whomToMeet: "ఎవరిని కలవాలి",
  howToReach: "ఎలా చేరుకోవాలి",
  whoToContact: "ఎవరిని సంప్రదించాలి",
  whatToFile: "ఏమి దాఖలు చేయాలి",
  fee: "రుసుము",
  openInMaps: "మ్యాప్‌లో తెరవండి",
  actWithin: (n) => `${n} రోజుల్లోపు చర్య తీసుకోండి — ఈ గడువు తప్పితే మీ కేసు నిలిచిపోవచ్చు`,
  nalsaChip: "NALSA ఉచిత సహాయం",
  docsTitle: "ముందుగా ఈ పత్రాలను సేకరించండి",
  docsIntro: "దాఖలు చేయడానికి ముందు వీటిని సేకరించండి. ఏదైనా లేకపోతే, ఇక్కడ చేయించుకోండి.",
  formsTitle: (n) => `పూరించవలసిన ఫారమ్‌లు (${n})`,
  fillByVoice: "మాట్లాడి పూరించండి",
  formsIntro: "మీ కేసు అసలైన ఫారమ్‌లు. ప్రతిదాన్ని తెరిచి, టైప్ చేసి లేదా మాట్లాడి మీ వివరాలు పూరించండి — మీ ఫారమ్ కింద వెంటనే నింపబడుతుంది — తర్వాత మీరే దాఖలు చేయండి.",
  fillDetails: "మీ వివరాలు పూరించండి — టైప్ చేయండి, లేదా మైక్ నొక్కి మాట్లాడండి",
  yourForm: "మీ ఫారమ్",
  fillsAsYouType: "(మీరు టైప్ చేస్తుండగా నింపబడుతుంది)",
  formReady: "— సిద్ధం",
  toFill: (n) => `${n} పూరించాలి`,
  ready: "సిద్ధం",
  fileOnline: "ఆన్‌లైన్‌లో దాఖలు చేయండి",
  printSubmit: "ప్రింట్ చేసి సమర్పించండి",
  submitYourself: "మీరే సమర్పించండి — మేము మీ తరపున పంపము:",
  fillOnPortal: "అధికారిక పోర్టల్‌లో అసలైన ఫారమ్‌లో మీ వివరాలు పూరించండి:",
  openOfficial: (p) => `${p}లో అధికారిక ఫారమ్ తెరవండి`,
  download: "పూరించిన ఫారమ్‌ను డౌన్‌లోడ్ చేయండి",
  printAt: (o) => `దీన్ని డౌన్‌లోడ్ చేసి, ప్రింట్ చేసి, సంతకం చేసి, ${o}లో సమర్పించండి.`,
  fillFirst: (n) => `ఫారమ్ పూర్తయ్యేలా ముందుగా పైన ఉన్న ${n} గడులను పూరించండి.`,
  giveTo: "ఫారమ్‌ను ఎవరికి ఇవ్వాలి",
  whereSubmit: "ఎక్కడ సమర్పించాలి",
  contactLabel: "సంప్రదింపు / హెల్ప్‌లైన్",
  whatNext: "తర్వాత ఏమి జరుగుతుంది",
  formsDisclaimer: "అసలైన ఫారమ్ పూరించడంలో మేము సహాయం చేస్తాము; మీరే దాన్ని అధికారిక పోర్టల్‌లో లేదా కార్యాలయంలో సమర్పించండి — ఏదీ స్వయంచాలకంగా పంపబడదు. కోర్టులో దాఖలు చేసే ఏ పత్రాన్నైనా ముందుగా ఉచిత NALSA న్యాయ సహాయం (హెల్ప్‌లైన్ 15100) సమీక్షిస్తుంది.",
  helplinesTitle: "ఉచిత హెల్ప్‌లైన్లు — నొక్కి కాల్ చేయండి",
  escTitle: "మానవ సమీక్ష — ఉచిత NALSA న్యాయ సహాయం",
  eligTitle: "మీరు ఉచిత న్యాయ సహాయానికి అర్హులా?",
  eligIntro: "న్యాయ సేవల ప్రాధికార చట్టం, 1987లోని సెక్షన్ 12 ప్రకారం, వీటిలో ఏ ఒక్కటి మీకు వర్తించినా న్యాయ సహాయం ఉచితం:",
  eligGrounds: [
    "మహిళ లేదా పిల్లవాడు",
    "షెడ్యూల్డ్ కులం లేదా షెడ్యూల్డ్ తెగ (SC/ST) సభ్యుడు",
    "వికలాంగుడు",
    "అక్రమ రవాణా లేదా హింస (గృహ హింస సహా) బాధితుడు",
    "సామూహిక విపత్తు, కుల దౌర్జన్యం, వరదలు, కరువు లేదా భూకంప బాధితుడు",
    "పారిశ్రామిక కార్మికుడు",
    "కస్టడీ / రక్షణ గృహం / బాలల గృహంలో ఉన్న వ్యక్తి",
    "మీ రాష్ట్ర ఆదాయ పరిమితి కంటే తక్కువ వార్షిక ఆదాయం",
  ],
  eligQuestion: "పైవాటిలో ఏ ఒక్కటైనా మీకు వర్తిస్తుందా?",
  eligYes: "అవును, ఒకటి వర్తిస్తుంది",
  eligNo: "లేదు, ఏదీ వర్తించదు",
  eligibleMsg: "✅ మీరు ఉచిత న్యాయ సహాయానికి అర్హులు. నమోదు చేసుకోవడానికి NALSA హెల్ప్‌లైన్ 15100కి కాల్ చేయండి — ఉచితంగా న్యాయవాది ఇవ్వబడతారు.",
  notEligibleMsg: "మీ ఆదాయం ఆధారంగా మీరు ఇంకా అర్హులు కావచ్చు. తెలుసుకోవడానికి ఉచిత NALSA హెల్ప్‌లైన్ 15100కి కాల్ చేయండి — అడగడానికి ఎటువంటి రుసుము లేదు.",
  eligBadgeLikely: "అర్హులు కావచ్చు",
  eligBadgeCheck: "కింద తనిఖీ చేయండి",
};

const mr: UIStrings = {
  listen: "ऐका",
  progressTitle: "प्रगती",
  progReading: "तुमचा दस्तऐवज वाचला जात आहे",
  progFinding: "तुम्हाला लागू होणारा कायदा शोधला जात आहे",
  progPreparing: "तुमची योजना आणि फॉर्म तयार केले जात आहेत",
  progSettingUp: "तुमचे प्रकरण तयार केले जात आहे",
  progConnecting: "तुम्हाला मोफत वकिलाशी जोडले जात आहे",
  pleaseWait: "कृपया थोडा वेळ थांबा…",
  docTitle: "दस्तऐवजात काय आहे",
  planTitle: "कृती योजना",
  whereToGo: "कुठे जायचे",
  whomToMeet: "कोणाला भेटायचे",
  howToReach: "कसे पोहोचायचे",
  whoToContact: "कोणाशी संपर्क साधायचा",
  whatToFile: "काय दाखल करायचे",
  fee: "शुल्क",
  openInMaps: "नकाशात उघडा",
  actWithin: (n) => `${n} दिवसांत कारवाई करा — ही मुदत चुकल्यास तुमचे प्रकरण अडकू शकते`,
  nalsaChip: "NALSA मोफत मदत",
  docsTitle: "आधी हे कागदपत्रे गोळा करा",
  docsIntro: "दाखल करण्यापूर्वी हे गोळा करा. एखादे नसेल तर येथे बनवा.",
  formsTitle: (n) => `भरायचे फॉर्म (${n})`,
  fillByVoice: "बोलून भरा",
  formsIntro: "तुमच्या प्रकरणाचे खरे फॉर्म. प्रत्येक उघडा, टाइप करून किंवा बोलून तुमची माहिती भरा — तुमचा फॉर्म खाली लगेच भरत जाईल — मग तुम्ही स्वतः दाखल करा.",
  fillDetails: "तुमची माहिती भरा — टाइप करा, किंवा माइक दाबून बोला",
  yourForm: "तुमचा फॉर्म",
  fillsAsYouType: "(तुम्ही टाइप करताच भरत जाते)",
  formReady: "— तयार",
  toFill: (n) => `${n} भरायचे बाकी`,
  ready: "तयार",
  fileOnline: "ऑनलाइन दाखल करा",
  printSubmit: "प्रिंट करून सादर करा",
  submitYourself: "तुम्ही स्वतः सादर करा — आम्ही तुमच्या वतीने पाठवत नाही:",
  fillOnPortal: "अधिकृत पोर्टलवर खऱ्या फॉर्ममध्ये तुमची माहिती भरा:",
  openOfficial: (p) => `${p} वर अधिकृत फॉर्म उघडा`,
  download: "भरलेला फॉर्म डाउनलोड करा",
  printAt: (o) => `तो डाउनलोड करा, प्रिंट करा, सही करा, आणि ${o} येथे सादर करा.`,
  fillFirst: (n) => `फॉर्म पूर्ण होण्यासाठी आधी वरील ${n} रकाने भरा.`,
  giveTo: "फॉर्म कोणाला द्यायचा",
  whereSubmit: "कुठे सादर करायचा",
  contactLabel: "संपर्क / हेल्पलाइन",
  whatNext: "पुढे काय होईल",
  formsDisclaimer: "आम्ही खरा फॉर्म भरण्यास मदत करतो; तुम्ही स्वतः तो अधिकृत पोर्टलवर किंवा कार्यालयात सादर करा — काहीही आपोआप पाठवले जात नाही. न्यायालयात दाखल होणाऱ्या कोणत्याही कागदपत्राची आधी मोफत NALSA कायदेशीर मदत (हेल्पलाइन 15100) तपासणी करते.",
  helplinesTitle: "मोफत हेल्पलाइन — दाबून कॉल करा",
  escTitle: "मानवी पुनरावलोकन — मोफत NALSA कायदेशीर मदत",
  eligTitle: "तुम्ही मोफत कायदेशीर मदतीसाठी पात्र आहात का?",
  eligIntro: "कायदेशीर सेवा प्राधिकरण अधिनियम, 1987 च्या कलम 12 अंतर्गत, यापैकी कोणतेही एक तुम्हाला लागू होत असल्यास कायदेशीर मदत मोफत आहे:",
  eligGrounds: [
    "महिला किंवा मूल",
    "अनुसूचित जाती किंवा अनुसूचित जमाती (SC/ST) चा सदस्य",
    "दिव्यांग व्यक्ती",
    "मानवी तस्करी किंवा हिंसाचाराचा (घरगुती हिंसाचारासह) बळी",
    "सामूहिक आपत्ती, जातीय अत्याचार, पूर, दुष्काळ किंवा भूकंपाचा बळी",
    "औद्योगिक कामगार",
    "कोठडी / संरक्षण गृह / बाल गृहात असलेली व्यक्ती",
    "तुमच्या राज्याच्या उत्पन्न-मर्यादेपेक्षा कमी वार्षिक उत्पन्न",
  ],
  eligQuestion: "वरीलपैकी कोणतेही एक तुम्हाला लागू होते का?",
  eligYes: "होय, एक लागू होते",
  eligNo: "नाही, कोणतेही नाही",
  eligibleMsg: "✅ तुम्ही मोफत कायदेशीर मदतीसाठी पात्र आहात. नोंदणीसाठी NALSA हेल्पलाइन 15100 वर कॉल करा — तुम्हाला मोफत वकील दिला जाईल.",
  notEligibleMsg: "तुमच्या उत्पन्नाच्या आधारे तुम्ही अजूनही पात्र असू शकता. तपासण्यासाठी मोफत NALSA हेल्पलाइन 15100 वर कॉल करा — विचारण्यासाठी कोणतेही शुल्क नाही.",
  eligBadgeLikely: "बहुधा पात्र",
  eligBadgeCheck: "खाली तपासा",
};

const TABLE: Record<LanguageCode, UIStrings> = { en, hi, bn, ta, te, mr };

/** Get the UI strings for a language code (falls back to English). */
export function ui(lang: string): UIStrings {
  return TABLE[(lang as LanguageCode)] ?? en;
}
