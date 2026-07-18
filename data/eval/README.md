# NyayaSetu — Lawyer-Adjudicated Evaluation Set

This is how NyayaSetu turns *"we're grounded, we don't hallucinate"* from a **claim**
into a **measurement**. It is the single most important thing separating a legal-aid
demo from a system you can put in front of a vulnerable person: a lawyer-signed gold
set + a reproducible harness that scores the pipeline against it.

```
npm run eval          # retrieval recall@k — offline, no API key, fully reproducible
npm run eval:full     # + citation precision, wrong-law, forum, escalation (needs an LLM key)
```

Current headline (v0.1.0, 8 seed cases):

| Metric | Score | What it proves |
|---|---|---|
| Retrieval recall@8 (mustCite) | **100%** (11/11) | The grounding layer surfaces the sections a lawyer said are the legal basis. |
| Citation precision (plan) | **82%** (14/17) | Of what the generated plan cited, how much a lawyer approved. |
| Wrong-law citations (mustNotCite) | **0** | The plan never cited a section a lawyer flagged as inapplicable. |
| Escalation accuracy | **100%** (7/7) | The confidence gate escalates exactly the cases it should (e.g. all DV). |

> These numbers are only as trustworthy as the gold set. Today it is **author-adjudicated
> and lawyer-reviewable** (8 cases). Section 4 is the plan to make it lawyer-*signed* at scale.

---

## 1. Why this exists

In law the downside is asymmetric: a confidently-wrong answer — a wrong forum, a missed
limitation period, the wrong succession rule — can cost a person their land or bar their
case. So we don't measure "does it sound good." We measure, per case, against ground truth:

1. **Retrieval recall** — did we even surface the right law? (grounding)
2. **Citation precision / wrong-law** — did the plan cite only applicable law? (no hallucinated/misapplied statute)
3. **Forum correctness** — did it send the person to the right office?
4. **Escalation correctness** — did it hand off to a human exactly when it should?

The harness already earned its keep on the seed set: it caught that the operative
succession sections (HSA §8, §14) weren't in the top-8 retrieval, and that the model
over-cited HSA §15 (a *female's* succession) for a *male's* estate. Both were fixed —
recall went 55% → 100%, wrong-law went 1 → 0 — because the eval made them visible.

## 2. The gold-set schema (`gold-set.json`)

Each case is one archetype. The `expect` block is the ground truth an advocate signs.

```jsonc
{
  "id": "land-widow-up-01",          // stable slug: <topic>-<state>-<n>
  "state": "UP",                      // governing state (land/revenue is a State subject)
  "category": "land_inheritance",
  "language": "hi",                   // language the user gets output in
  "inputText": "Tehsil office notice … widow Sunita Devi … left out of the Khatauni …",
                                      //  ↑ lets the harness run without an OCR image
  "expect": {
    "category": "land_inheritance",
    "mustCite":    [ {"code":"PERSONAL_LAW","section":"8"}, {"code":"PERSONAL_LAW","section":"14"} ],
    "shouldCite":  [ {"code":"NALSA","section":"12"} ],       // credit, not required
    "mustNotCite": [ {"code":"PERSONAL_LAW","section":"15"} ],// wrong-law TRAP
    "forumKeywords": ["tehsil","mutation","khatauni"],        // right office/record
    "portalHost": "upbhulekh.gov.in",                          // right state portal
    "escalate": false                                          // expected gate decision
  },
  "adjudication": { "by":"", "barId":"", "date":"", "notes":"why this is the correct basis" }
}
```

Field meanings:

- **`mustCite`** — the provisions that *are* the legal basis. Missing one is a grounding failure.
- **`shouldCite`** — reasonable supporting provisions (e.g. NALSA §12 eligibility). Credited, never required.
- **`mustNotCite`** — the **traps**: plausible-but-wrong sections a weak model reaches for
  (female-succession law for a male's estate; a matrimonial-cruelty section for a theft FIR).
  Citing one is the failure mode that matters most.
- **`forumKeywords` / `portalHost`** — the correct office/record and the correct *state* portal.
- **`escalate`** — the expected human-handoff decision (sensitive categories are always `true`).
- **`knownCorpusGap`** (optional) — marks a case where the right statute isn't in the corpus yet
  (e.g. the RTI Act). Correct behaviour is to **refuse to invent a section**, not to guess.

## 3. The adjudication protocol — how a lawyer builds a case

This is the actual workflow to grow the set from 8 cases to a defensible 200+.

**Step 0 — Sampling.** Draw real archetypes, not toy prompts. Sources: DLSA/NALSA intake
logs (anonymised), Nyaya Bandhu queries, common-cause categories (land mutation, FIR refusal,
DV, maintenance, wages, pension/RTI, consumer). Stratify across **state × category × language**
so the set reflects Bharat, not one district.

**Step 1 — De-identify.** Strip real names/IDs; replace with realistic placeholders. Keep the
*legal* facts (relationship of parties, gender of the deceased, cause of action, state).

**Step 2 — Adjudicate (the advocate's job).** For each case the empanelled advocate records:
- the **correct category**;
- the **`mustCite`** sections that are the legal basis, and **why** (in `notes`);
- **`mustNotCite`** traps — the wrong-but-tempting sections, from experience;
- the **correct forum** (office, officer, record name) *for that state*, and the state portal;
- whether it **should escalate** to a human.
- Sign it: `by`, `barId`, `date`.

**Step 3 — Double-adjudication + tie-break.** Two advocates label independently. Measure
inter-annotator agreement (Cohen's κ on category and on the mustCite set). Disagreements go to
a senior advocate. Only **κ ≥ 0.8** cases enter the "signed" set; the rest are logged for review.

**Step 4 — Version & freeze.** Bump `version`, tag the corpus version it was signed against
(statutes change — the set is re-validated whenever the corpus is amended). Never edit a signed
case in place; supersede it with a new id.

**Step 5 — Gate CI.** Wire `npm run eval:full` into CI. It exits non-zero below the adjudicated
thresholds (`mustCiteRecall ≥ 0.9`, `wrong-law = 0`). A prompt/model/corpus change that regresses
legal accuracy then **fails the build** — accuracy becomes a guardrail, not a hope.

## 4. Roadmap to a top-tier gold set

- **Scale:** 200+ signed cases; publish per-category and per-state breakdowns.
- **Calibration:** use the set to *calibrate the confidence threshold* against real correctness
  (reliability curve), instead of the current heuristic 0.72.
- **OCR track:** add scanned/handwritten images with transcription ground truth to measure the
  Document Agent, not just Strategy (today `inputText` bypasses OCR).
- **Adversarial track:** jailbreak attempts on the scope guard, poisoned documents, prompt
  injection inside the uploaded text.
- **Forum matching:** transliteration-aware office/record matching so the forum metric works for
  non-English plans (today it is measured only on English cases).
- **Outcome linkage:** where possible, tie an archetype to real filed-case outcomes to validate
  that "correct on paper" tracks "worked in practice."

## 5. Files

| File | What |
|---|---|
| `gold-set.json` | The adjudicated cases (ground truth). |
| `../../scripts/eval.ts` | The harness (`npm run eval` / `eval:full`). |
| `README.md` | This document — schema + adjudication protocol. |
