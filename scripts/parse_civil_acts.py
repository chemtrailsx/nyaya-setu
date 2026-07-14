"""
Parse the Hindu Succession Act 1956 + Legal Services Authorities Act 1987
(indiacode PDFs) into corpus chunks, and MERGE them into legal-corpus.json.

These older acts use INLINE headings ("8. General rules ...―<body>") with
footnotes at ~9pt vs body at ~11pt, so we keep only body-size text (dropping
footnotes + superscript markers) and split on inline section headings.

Run:  python scripts/parse_civil_acts.py
"""
import fitz
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ACTS = [
    {
        "code": "PERSONAL_LAW",
        "short": "hsa",
        "pdf": "data/sources/hindu-succession-act-1956.pdf",
        "sourceUrl": "https://www.indiacode.nic.in/bitstream/123456789/1713/1/AAA1956suc___30.pdf",
    },
    {
        "code": "NALSA",
        "short": "lsa",
        "pdf": "data/sources/legal-services-authorities-act-1987.pdf",
        "sourceUrl": "https://www.indiacode.nic.in/bitstream/123456789/19023/1/legal_service_authorities_act,_1987.pdf",
    },
]

MIN_SIZE = 10  # body is 11pt; footnotes/superscripts are <=9pt

# An OPERATIVE section heading is a number + title + em-dash + body. The
# arrangement-of-sections INDEX lists titles with NO em-dash, so requiring the
# dash cleanly skips the index (which otherwise hijacks the monotonic run).
SECTION_RE = re.compile(r"(?:^|\n)(\d{1,3}[A-Z]?)\.\s+([^―—]{3,150}?)\s*[―—]\s*")


def clean(t: str) -> str:
    t = t.replace("―", "-").replace("—", "-").replace("–", "-")
    t = t.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    t = re.sub(r"\d+\[", "[", t)         # drop footnote-ref numbers before "["
    t = re.sub(r"[\[\]]", "", t)          # drop amendment brackets
    t = re.sub(r"\s*\n\s*", " ", t)
    t = re.sub(r"([a-z])-\s+([a-z])", r"\1-\2", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t.strip()


def body_text(pdf_path: str) -> str:
    doc = fitz.open(os.path.join(ROOT, pdf_path))
    parts = []
    for page in doc:
        for b in page.get_text("dict")["blocks"]:
            if "lines" not in b:
                continue
            for line in b["lines"]:
                spans = [s for s in line["spans"] if s["size"] >= MIN_SIZE]
                text = "".join(s["text"] for s in spans)
                if text.strip():
                    parts.append(text)
    full = "\n".join(parts)
    m = re.search(r"BE it enacted", full)
    return full[m.start():] if m else full


def parse(act):
    text = body_text(act["pdf"])
    matches = list(SECTION_RE.finditer(text))

    # Monotonic run (numeric part), tolerating letter suffixes (11A) + gaps.
    filtered = []
    last = 0
    for m in matches:
        n = int(re.match(r"\d+", m.group(1)).group())
        if (not filtered and n <= 2) or (filtered and last <= n <= last + 4):
            filtered.append(m)
            last = n

    chunks = []
    for i, m in enumerate(filtered):
        sec = m.group(1)
        title = clean(m.group(2)).rstrip(". ")
        bstart = m.end()
        bend = filtered[i + 1].start() if i + 1 < len(filtered) else len(text)
        body = clean(text[bstart:bend])
        if len(body) < 20:
            continue
        chunks.append({
            "id": f'{act["short"]}-{sec}',
            "code": act["code"],
            "section": sec,
            "title": title[:120],
            "text": body,
            "sourceUrl": act["sourceUrl"],
        })
    return chunks


def main():
    corpus_path = os.path.join(ROOT, "data", "corpus", "legal-corpus.json")
    existing = json.load(open(corpus_path, encoding="utf-8"))
    existing = [c for c in existing if c["code"] not in ("PERSONAL_LAW", "NALSA")]  # replace on re-run

    added = []
    for act in ACTS:
        chunks = parse(act)
        added.extend(chunks)
        print(f'{act["short"].upper()} ({act["code"]}): {len(chunks)} sections')
        for anchor in (["8", "14"] if act["short"] == "hsa" else ["12", "13"]):
            hit = next((c for c in chunks if c["section"] == anchor), None)
            if hit:
                print(f'   [{anchor}] "{hit["title"][:45]}" :: {hit["text"][:70]}')

    merged = existing + added
    json.dump(merged, open(corpus_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nMerged: {len(existing)} criminal + {len(added)} civil = {len(merged)} total chunks")


if __name__ == "__main__":
    main()
