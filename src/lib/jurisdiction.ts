/**
 * Jurisdiction registry — what makes NyayaSetu NATIONAL, not Jharkhand-only.
 *
 * Land, land-records and revenue administration are State subjects: the mutation
 * process, the record's name, the office and even the officer's title differ from
 * state to state (Dakhil-Kharij in Jharkhand, 7/12 in Maharashtra, Patta-Chitta
 * in Tamil Nadu, Khatauni in UP…). Citing the wrong state's portal or officer is a
 * real, confident-but-wrong failure — so every state carries its own procedural
 * facts here, and the agents are told which state governs THIS case.
 *
 * What is UNIFORM across India — and therefore the safe human anchor everywhere —
 * is the statutory free-legal-aid ladder under the Legal Services Authorities Act,
 * 1987: NALSA → SLSA (state) → DLSA (district), helpline 15100, LSMS portal. Every
 * human handoff routes there (see escalation), so it works in all 28 states + UTs.
 */

/** The all-India free-legal-aid authority — same statute, same helpline, everywhere. */
export const NALSA = {
  helpline: "15100",
  portalName: "NALSA Legal Services (LSMS)",
  portalUrl: "https://scourtapp.nic.in/lsams",
  siteUrl: "https://nalsa.gov.in",
} as const;

export interface Jurisdiction {
  code: string; // ISO-ish state code, e.g. "JH", "UP", or "IN" for the national fallback
  name: string; // "Jharkhand"
  /** State land-records portal (for mutation / record-of-rights lookups). */
  landPortalName: string;
  landPortalUrl: string;
  /** Local name of the mutation process (transfer of title in revenue records). */
  mutationTerm: string;
  /** Local name of the record-of-rights document. */
  recordName: string;
  /** Where a mutation / land matter is filed. */
  revenueOffice: string;
  /** The officer who decides it. */
  revenueOfficer: string;
  /** State Legal Services Authority — the state rung of the NALSA ladder. */
  slsa: string;
}

const NATIONAL: Jurisdiction = {
  code: "IN",
  name: "India",
  landPortalName: "National Land Records (DILRMP)",
  landPortalUrl: "https://dilrmp.gov.in",
  mutationTerm: "mutation (transfer of land record)",
  recordName: "Record of Rights (RoR)",
  revenueOffice: "the local Tehsil / Taluk / Circle revenue office",
  revenueOfficer: "Tehsildar / Revenue Officer",
  slsa: "State Legal Services Authority (SLSA)",
};

/**
 * Per-state procedural facts. Land-record portals are the official state sites.
 * States not listed fall back to NATIONAL — the tool still works, it just uses
 * the generic revenue-office language instead of a state-specific portal.
 */
export const STATES: Record<string, Jurisdiction> = {
  AP: { code: "AP", name: "Andhra Pradesh", landPortalName: "Meebhoomi", landPortalUrl: "https://meebhoomi.ap.gov.in", mutationTerm: "mutation", recordName: "Adangal / 1-B", revenueOffice: "the Mandal Revenue Office (Tahsildar)", revenueOfficer: "Tahsildar", slsa: "Andhra Pradesh SLSA" },
  AS: { code: "AS", name: "Assam", landPortalName: "Dharitree", landPortalUrl: "https://revenueassam.nic.in/dharitree", mutationTerm: "Namjari (mutation)", recordName: "Jamabandi", revenueOffice: "the Circle Office", revenueOfficer: "Circle Officer", slsa: "Assam SLSA" },
  BR: { code: "BR", name: "Bihar", landPortalName: "Bihar Bhumi", landPortalUrl: "https://biharbhumi.bihar.gov.in", mutationTerm: "Dakhil-Kharij (mutation)", recordName: "Jamabandi", revenueOffice: "the Circle Office (Anchal Karyalaya)", revenueOfficer: "Circle Officer (Anchal Adhikari)", slsa: "Bihar SLSA" },
  CG: { code: "CG", name: "Chhattisgarh", landPortalName: "Bhuiyan", landPortalUrl: "https://bhuiyan.cg.nic.in", mutationTerm: "Namantaran (mutation)", recordName: "Khasra / B-1", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Chhattisgarh SLSA" },
  DL: { code: "DL", name: "Delhi", landPortalName: "DLRC (Bhu-Naksha Delhi)", landPortalUrl: "https://dlrc.delhi.gov.in", mutationTerm: "mutation (Intkaal)", recordName: "Khatauni", revenueOffice: "the office of the Sub-Divisional Magistrate (SDM)", revenueOfficer: "SDM / Tehsildar", slsa: "Delhi SLSA" },
  GA: { code: "GA", name: "Goa", landPortalName: "Goa Land Records (Dharani)", landPortalUrl: "https://egov.goa.nic.in", mutationTerm: "mutation", recordName: "Form I & XIV", revenueOffice: "the Mamlatdar's office", revenueOfficer: "Mamlatdar", slsa: "Goa SLSA" },
  GJ: { code: "GJ", name: "Gujarat", landPortalName: "AnyRoR", landPortalUrl: "https://anyror.gujarat.gov.in", mutationTerm: "mutation (Hakk Patrak entry)", recordName: "7/12 (Satbara)", revenueOffice: "the Mamlatdar's office", revenueOfficer: "Mamlatdar", slsa: "Gujarat SLSA" },
  HR: { code: "HR", name: "Haryana", landPortalName: "Jamabandi Haryana", landPortalUrl: "https://jamabandi.nic.in", mutationTerm: "Intkaal (mutation)", recordName: "Jamabandi", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Haryana SLSA" },
  HP: { code: "HP", name: "Himachal Pradesh", landPortalName: "Himbhoomi", landPortalUrl: "https://himbhoomi.hp.gov.in", mutationTerm: "Intkaal (mutation)", recordName: "Jamabandi", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Himachal Pradesh SLSA" },
  JH: { code: "JH", name: "Jharkhand", landPortalName: "JharBhoomi", landPortalUrl: "https://jharbhoomi.jharkhand.gov.in", mutationTerm: "Dakhil-Kharij (mutation)", recordName: "Khatiyan / RoR", revenueOffice: "the Circle Office (Anchal Karyalaya)", revenueOfficer: "Circle Officer (Anchal Adhikari)", slsa: "Jharkhand SLSA" },
  KA: { code: "KA", name: "Karnataka", landPortalName: "Bhoomi", landPortalUrl: "https://landrecords.karnataka.gov.in", mutationTerm: "mutation (MR)", recordName: "RTC / Pahani", revenueOffice: "the Taluk Office (Tahsildar)", revenueOfficer: "Tahsildar", slsa: "Karnataka SLSA" },
  KL: { code: "KL", name: "Kerala", landPortalName: "ReLIS / e-Rekha", landPortalUrl: "https://erekha.kerala.gov.in", mutationTerm: "Pokkuvaravu (mutation)", recordName: "Thandaper / RoR", revenueOffice: "the Village Office", revenueOfficer: "Village Officer / Tahsildar", slsa: "Kerala SLSA" },
  MP: { code: "MP", name: "Madhya Pradesh", landPortalName: "MP Bhulekh", landPortalUrl: "https://mpbhulekh.gov.in", mutationTerm: "Namantaran (mutation)", recordName: "Khasra / Khatauni", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Madhya Pradesh SLSA" },
  MH: { code: "MH", name: "Maharashtra", landPortalName: "Mahabhulekh (7/12)", landPortalUrl: "https://bhulekh.mahabhumi.gov.in", mutationTerm: "Pheri / mutation", recordName: "7/12 (Satbara) & 8-A", revenueOffice: "the Talathi / Tahsildar office", revenueOfficer: "Tahsildar", slsa: "Maharashtra SLSA" },
  MN: { code: "MN", name: "Manipur", landPortalName: "Louchapathap", landPortalUrl: "https://louchapathap.nic.in", mutationTerm: "mutation", recordName: "Jamabandi / RoR", revenueOffice: "the Circle Office", revenueOfficer: "Sub-Deputy Collector", slsa: "Manipur SLSA" },
  OD: { code: "OD", name: "Odisha", landPortalName: "Bhulekh Odisha", landPortalUrl: "https://bhulekh.ori.nic.in", mutationTerm: "mutation", recordName: "RoR", revenueOffice: "the Tahasil Office", revenueOfficer: "Tahasildar", slsa: "Odisha SLSA" },
  PB: { code: "PB", name: "Punjab", landPortalName: "Punjab Land Records (Fard)", landPortalUrl: "https://jamabandi.punjab.gov.in", mutationTerm: "Intkaal (mutation)", recordName: "Jamabandi / Fard", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Punjab SLSA" },
  RJ: { code: "RJ", name: "Rajasthan", landPortalName: "Apna Khata (e-Dharti)", landPortalUrl: "https://apnakhata.rajasthan.gov.in", mutationTerm: "Namantaran (mutation)", recordName: "Jamabandi / Nakal", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Rajasthan SLSA" },
  TN: { code: "TN", name: "Tamil Nadu", landPortalName: "Patta Chitta (TN e-Services)", landPortalUrl: "https://eservices.tn.gov.in", mutationTerm: "mutation (name transfer)", recordName: "Patta / Chitta / A-Register", revenueOffice: "the Taluk Office (Tahsildar)", revenueOfficer: "Tahsildar", slsa: "Tamil Nadu SLSA" },
  TS: { code: "TS", name: "Telangana", landPortalName: "Dharani", landPortalUrl: "https://dharani.telangana.gov.in", mutationTerm: "mutation", recordName: "Pattadar Passbook / RoR", revenueOffice: "the Mandal Revenue Office (Tahsildar)", revenueOfficer: "Tahsildar", slsa: "Telangana SLSA" },
  TR: { code: "TR", name: "Tripura", landPortalName: "Jami Tripura", landPortalUrl: "https://jami.tripura.gov.in", mutationTerm: "mutation", recordName: "Jamabandi / Khatian", revenueOffice: "the Revenue Circle Office", revenueOfficer: "Revenue Officer", slsa: "Tripura SLSA" },
  UP: { code: "UP", name: "Uttar Pradesh", landPortalName: "UP Bhulekh", landPortalUrl: "https://upbhulekh.gov.in", mutationTerm: "Dakhil-Kharij / Namantaran (mutation)", recordName: "Khatauni", revenueOffice: "the Tehsil Office (Lekhpal / Tehsildar)", revenueOfficer: "Tehsildar", slsa: "Uttar Pradesh SLSA" },
  UK: { code: "UK", name: "Uttarakhand", landPortalName: "Bhulekh Uttarakhand", landPortalUrl: "https://bhulekh.uk.gov.in", mutationTerm: "Namantaran (mutation)", recordName: "Khatauni", revenueOffice: "the Tehsil Office", revenueOfficer: "Tehsildar", slsa: "Uttarakhand SLSA" },
  WB: { code: "WB", name: "West Bengal", landPortalName: "Banglarbhumi", landPortalUrl: "https://banglarbhumi.gov.in", mutationTerm: "mutation", recordName: "RS / LR Khatian", revenueOffice: "the Block Land & Land Reforms Office (BL&LRO)", revenueOfficer: "BL&LRO / Revenue Officer", slsa: "West Bengal SLSA" },
};

/** Options for a state picker in the UI (national/auto handled by the caller). */
export const STATE_OPTIONS = Object.values(STATES)
  .map((s) => ({ code: s.code, name: s.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** State/UT name → code, plus a few high-signal cities/districts, for detection
 *  when the user did not pick a state. Kept lowercase; matched as word-ish. */
const NAME_HINTS: Record<string, string> = {
  // state names
  "andhra pradesh": "AP", assam: "AS", bihar: "BR", chhattisgarh: "CG", chattisgarh: "CG",
  delhi: "DL", goa: "GA", gujarat: "GJ", haryana: "HR", "himachal pradesh": "HP", himachal: "HP",
  jharkhand: "JH", karnataka: "KA", kerala: "KL", "madhya pradesh": "MP", maharashtra: "MH",
  manipur: "MN", odisha: "OD", orissa: "OD", punjab: "PB", rajasthan: "RJ", "tamil nadu": "TN",
  tamilnadu: "TN", telangana: "TS", tripura: "TR", "uttar pradesh": "UP", uttarakhand: "UK",
  uttaranchal: "UK", "west bengal": "WB",
  // frequently-appearing districts / cities (disambiguating hints)
  ranchi: "JH", khunti: "JH", gumla: "JH", dhanbad: "JH", jamshedpur: "JH",
  patna: "BR", gaya: "BR", muzaffarpur: "BR",
  lucknow: "UP", kanpur: "UP", varanasi: "UP", agra: "UP", prayagraj: "UP", allahabad: "UP",
  mumbai: "MH", pune: "MH", nagpur: "MH", nashik: "MH",
  chennai: "TN", madurai: "TN", coimbatore: "TN",
  kolkata: "WB", howrah: "WB", "24 parganas": "WB",
  hyderabad: "TS", bengaluru: "KA", bangalore: "KA", mysore: "KA", mysuru: "KA",
  jaipur: "RJ", jodhpur: "RJ", ahmedabad: "GJ", surat: "GJ",
  bhopal: "MP", indore: "MP", raipur: "CG", bhubaneswar: "OD", cuttack: "OD",
  guwahati: "AS", thiruvananthapuram: "KL", kochi: "KL", chandigarh: "PB", amritsar: "PB",
  vijayawada: "AP", visakhapatnam: "AP", dehradun: "UK",
};

/**
 * Best-effort detection of the governing state from document text (place names).
 * Returns the state code, or null if nothing matched — the caller then uses the
 * national fallback. This is a hint only; the user's explicit pick always wins.
 */
export function detectStateCode(text?: string): string | null {
  if (!text) return null;
  const hay = " " + text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " ";
  // Longer names first so "andhra pradesh" wins over a stray "andhra".
  const hints = Object.keys(NAME_HINTS).sort((a, b) => b.length - a.length);
  for (const hint of hints) {
    if (hay.includes(" " + hint + " ")) return NAME_HINTS[hint];
  }
  return null;
}

/**
 * Resolve the jurisdiction for a case. Precedence: the user's explicit pick →
 * detection from the document text → the national fallback (never throws).
 */
export function resolveJurisdiction(stateCode?: string | null, text?: string): Jurisdiction {
  const explicit = stateCode && stateCode.toUpperCase();
  if (explicit && explicit !== "IN" && STATES[explicit]) return STATES[explicit];
  if (explicit === "IN") return NATIONAL;
  const detected = detectStateCode(text);
  if (detected && STATES[detected]) return STATES[detected];
  return NATIONAL;
}

/** A compact block describing the jurisdiction, injected into agent prompts so
 *  the model uses the RIGHT state's portal, record name, office and officer. */
export function jurisdictionPromptBlock(j: Jurisdiction): string {
  return [
    `GOVERNING JURISDICTION: ${j.name}${j.code === "IN" ? " (state not identified — use generic revenue-office language, do NOT name a specific state's portal)" : ""}`,
    `- Land-records portal: ${j.landPortalName} (${j.landPortalUrl})`,
    `- Mutation process is called: ${j.mutationTerm}`,
    `- Record-of-rights is called: ${j.recordName}`,
    `- Land/mutation matters are filed at: ${j.revenueOffice}`,
    `- Deciding officer: ${j.revenueOfficer}`,
    `- State legal-aid authority: ${j.slsa}`,
  ].join("\n");
}
