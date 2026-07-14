"""
Parse the official BNS / BNSS 2023 act PDFs into a clean, section-wise legal
corpus with real statutory text + provenance.

These Gazette PDFs print the section TITLE as a note in the right margin
(x0 ~486) and the operative TEXT in the main column (x0 ~117), with running
headers/footers. Each section's operative text begins at the start of a block
("198. Whoever ..."), so we detect sections at the block level and associate
each right-margin title to the section start nearest it (same page, closest y).

Run:  python scripts/parse_acts.py
Out:  data/corpus/legal-corpus.json  (array of {id, code, section, title, text, sourceUrl})
"""
import fitz  # PyMuPDF
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ACTS = [
    {
        "code": "BNS",
        "pdf": "data/sources/bns-2023.pdf",
        "sourceUrl": "https://prsindia.org/files/bills_acts/acts_parliament/2023/The Bharatiya Nyaya Sanhita, 2023.pdf",
        "maxSection": 358,
    },
    {
        "code": "BNSS",
        "pdf": "data/sources/bnss-2023.pdf",
        "sourceUrl": "https://prsindia.org/files/bills_acts/acts_parliament/2023/The Bharatiya Nagarik Suraksha Sanhita, 2023.pdf",
        "maxSection": 531,
    },
]

SECTION_RE = re.compile(r"^(\d{1,3})\.\s")


def clean(text: str) -> str:
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-").replace("―", "-")
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    text = re.sub(r"_{3,}", " ", text)                          # underscore rules
    text = re.sub(r"\(\s*([a-zA-Z0-9]{1,4})\s*\)", r"(\1)", text)  # "( a )" -> "(a)"
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*\n\s*", " ", text)                       # unwrap lines
    text = re.sub(r"([a-z])-\s+([a-z])", r"\1-\2", text)        # rejoin hyphenated line breaks
    return text.strip()


def is_footnote(t: str) -> bool:
    """Right-margin footnotes (old-act citations, markers) — not section titles."""
    if re.match(r"^\d", t):                       # "25 of 1867", "1. ...", page nos
        return True
    if re.search(r"\bof\s+1[89]\d{2}\b", t):      # "... of 1867"
        return True
    if len(t) < 6:
        return True
    return False


def is_noise(t: str) -> bool:
    """Running headers, footers, page numbers, chapter headings — not body."""
    t = t.strip()
    if not t:
        return True
    if set(t) <= set("_ "):
        return True
    if re.match(r"^\d{1,4}$", t):                               # page number
        return True
    u = t.upper()
    if "THE GAZETTE OF INDIA" in u:
        return True
    if re.match(r"^THE BHARATIYA .*(SANHITA|ADHINIYAM), 2023$", u):
        return True
    if u.startswith("SEC.") and "GAZETTE" in u:
        return True
    # Chapter headings / section-group titles are fully uppercase lines.
    letters = re.sub(r"[^A-Za-z]", "", t)
    if letters and t == u and not SECTION_RE.match(t) and len(t) < 80:
        return True
    return False


def parse_act(act):
    doc = fitz.open(os.path.join(ROOT, act["pdf"]))
    body = []      # ordered [{page, y0, text}]
    titles = []    # [{page, y0, text}]

    # Section TITLES are printed as ~8pt margin notes (they alternate between
    # the left and right margin by page parity). Section TEXT is ~10pt in the
    # main column. So we classify by FONT SIZE, not x-position.
    for pno, page in enumerate(doc):
        for b in page.get_text("dict")["blocks"]:
            if "lines" not in b:
                continue
            spans = [s for ln in b["lines"] for s in ln["spans"]]
            if not spans:
                continue
            text = " ".join("".join(s["text"] for s in ln["spans"]) for ln in b["lines"]).strip()
            if not text:
                continue
            size = max(s["size"] for s in spans)
            y0 = b["bbox"][1]
            if size < 9.0:  # margin note / footnote / footer
                note = " ".join(text.split())
                if not is_noise(note) and not is_footnote(note):
                    titles.append({"page": pno, "y0": y0, "text": note})
            elif not is_noise(text):  # body (10pt), minus chapter headings
                body.append({"page": pno, "y0": y0, "text": text})

    # Group body blocks into sections. A section starts at a block beginning
    # with "N. "; subsequent blocks belong to it until the next start.
    sections = []
    cur = None
    for blk in body:
        m = SECTION_RE.match(blk["text"].lstrip())
        num = int(m.group(1)) if m else None
        if num is None or not (1 <= num <= act["maxSection"]):
            starts = False
        elif cur is None:
            starts = num == 1                       # seed only on real section 1
        else:
            starts = cur["num"] < num <= cur["num"] + 20  # strictly increasing, tolerate gaps
        if starts:
            if cur:
                sections.append(cur)
            cur = {"num": num, "page": blk["page"], "y0": blk["y0"], "parts": [blk["text"]]}
        elif cur:
            cur["parts"].append(blk["text"])
    if cur:
        sections.append(cur)

    # Associate a right-margin title to each section by nearest position.
    def nearest_title(sec):
        # The side-note sits at ~the same vertical level as the section's first
        # line, on the same page. Require close vertical proximity.
        same = [t for t in titles if t["page"] == sec["page"]]
        if not same:
            return ""
        best = min(same, key=lambda t: abs(t["y0"] - sec["y0"]))
        return best["text"] if abs(best["y0"] - sec["y0"]) <= 40 else ""

    chunks = []
    for sec in sections:
        text = clean(" ".join(sec["parts"]))
        text = re.sub(rf'^{sec["num"]}\.\s*', "", text)  # strip leading "N."
        if len(text) < 15:
            continue
        chunks.append({
            "id": f'{act["code"].lower()}-{sec["num"]}',
            "code": act["code"],
            "section": str(sec["num"]),
            "title": nearest_title(sec).rstrip(". "),
            "text": text,
            "sourceUrl": act["sourceUrl"],
        })
    return chunks


def main():
    all_chunks = []
    for act in ACTS:
        chunks = parse_act(act)
        all_chunks.extend(chunks)
        print(f'{act["code"]}: {len(chunks)} sections')
        for anchor in (["198", "199"] if act["code"] == "BNS" else ["173", "175"]):
            hit = next((c for c in chunks if c["section"] == anchor), None)
            if hit:
                print(f'  [{anchor}] "{hit["title"][:50]}" :: {hit["text"][:75]}...')

    out = os.path.join(ROOT, "data", "corpus", "legal-corpus.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=1)
    print(f"\nWrote {len(all_chunks)} chunks to data/corpus/legal-corpus.json")


if __name__ == "__main__":
    main()
