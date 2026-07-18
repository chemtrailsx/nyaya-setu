"""
Generate realistic real-world-FORMAT sample legal documents (PDFs) for the
"Sample real-world legal docs" picker in the demo. Names/addresses are fictional
(no real person's data), but each follows the genuine format of that document
type so judges can test the engine on varied, realistic inputs across states and
case categories. Run: python scripts/make_samples.py
"""
import fitz  # PyMuPDF
from pathlib import Path

OUT = Path("public/examples")
OUT.mkdir(parents=True, exist_ok=True)

DOCS = {
    "fir-theft-up.pdf": """FIRST INFORMATION REPORT
(Under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023)

Police Station: Hazratganj        District: Lucknow, Uttar Pradesh
FIR No.: 0214/2026                Date: 12/03/2026
Offence u/s: 303(2) Bharatiya Nyaya Sanhita, 2023 (Theft)

1. Complainant/Informant: Sri Ramesh Kumar Verma, S/o Sri Mahesh Verma,
   R/o House No. 45, Aliganj, Lucknow, Uttar Pradesh.

2. Date and time of occurrence: 11/03/2026 at about 21:30 hours.

3. Place of occurrence: Near Hazratganj main market, Lucknow.

4. Brief facts of the case:
   The complainant states that his motorcycle bearing registration
   number UP32 AB 1234, parked outside the Hazratganj market, was
   stolen by unknown person(s) on the night of 11/03/2026. Despite
   search, the vehicle could not be traced. The complainant requests
   that the case be registered and the vehicle recovered.

Action taken: The above report reveals commission of a cognizable
offence. Case registered and investigation taken up.

Sd/- Station House Officer
Police Station Hazratganj, Lucknow (U.P.)
""",

    "dv-cruelty-rajasthan.pdf": """COMPLAINT TO THE STATION HOUSE OFFICER / PROTECTION OFFICER

To,
The Station House Officer,
Mahila Police Station, Vaishali Nagar, Jaipur, Rajasthan.

Subject: Complaint of cruelty and dowry harassment under Sections 85
and 86 of the Bharatiya Nyaya Sanhita, 2023, and request for protection.

Respected Sir/Madam,

I, Smt. Sunita Sharma, W/o Sri Rakesh Sharma, aged 27 years, R/o
Vaishali Nagar, Jaipur, most respectfully state that since my marriage
on 10/02/2023, my husband and my mother-in-law have subjected me to
continuous physical and mental cruelty. They have repeatedly demanded
additional dowry of Rs. 5,00,000 and gold ornaments from my parents.

On 08/03/2026, when the demand was not met, I was beaten and threatened
that I would be thrown out of the matrimonial home. I am in fear for my
safety and the safety of my child.

I therefore request you to kindly register my complaint, take action
against the said persons, and provide me protection as per law.

Yours faithfully,
Smt. Sunita Sharma
Jaipur, Rajasthan
""",

    "legal-notice-property-maharashtra.pdf": """LEGAL NOTICE
(Through Advocate)

Adv. Prakash R. Deshmukh, B.A., LL.B.
Enrolment No. MAH/1234/2011, Bar Council of Maharashtra & Goa
Chambers No. 7, District & Sessions Court, Pune - 411001

Ref: LN/218/2026                                    Date: 15/03/2026

To,
Shri Anil Patil,
R/o Baramati, Taluka Baramati, District Pune, Maharashtra.

Subject: Legal notice to vacate illegal encroachment upon ancestral
agricultural land, Gat/Survey No. 214, situated at Baramati, Taluka
Baramati, District Pune (recorded in the 7/12 extract in the name of
my client), and to hand over peaceful possession.

Sir,

Under instructions from and on behalf of my client, Smt. Kavita Jadhav,
R/o Baramati, District Pune, I hereby serve upon you the following notice:

That my client is the lawful successor to the above-mentioned ancestral
agricultural land. That you have, without any right, title or interest,
illegally occupied a portion of the said land and have refused to vacate
the same despite repeated oral requests.

You are hereby called upon to vacate the said land and hand over peaceful
possession to my client within FIFTEEN (15) DAYS of receipt of this notice,
failing which my client shall be constrained to initiate appropriate civil
and criminal proceedings against you, entirely at your risk as to costs and
consequences.

Sd/-
Advocate for Smt. Kavita Jadhav
""",

    "cheating-complaint-karnataka.pdf": """COMPLAINT

To,
The Station House Officer,
Police Station Kadugodi, Whitefield, Bengaluru, Karnataka.

Subject: Complaint for the offence of cheating punishable under
Section 318 of the Bharatiya Nyaya Sanhita, 2023, and request to
register an FIR.

Sir,

I, Sri Manjunath Gowda, S/o Sri Krishne Gowda, R/o Whitefield,
Bengaluru, Karnataka, submit as follows:

That on 05/01/2026, one Sri Suresh Nair, claiming to be a property
agent, induced me to pay a sum of Rs. 2,00,000 towards the allotment
of a residential site. He issued me a forged allotment letter to gain
my trust. On subsequent enquiry I learnt that no such site exists and
that the allotment letter is fabricated. The said person has since
been absconding and is not responding to my calls.

I have been cheated and have suffered wrongful loss. I therefore request
you to kindly register a First Information Report against the said person,
investigate the matter, and assist in recovery of my money.

Yours faithfully,
Sri Manjunath Gowda
Bengaluru, Karnataka
""",
}

MARGIN = 56
RECT = fitz.Rect(MARGIN, MARGIN, 595 - MARGIN, 842 - MARGIN)

for name, text in DOCS.items():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    # A faint top rule so it reads like an official document.
    page.draw_line(fitz.Point(MARGIN, MARGIN - 12), fitz.Point(595 - MARGIN, MARGIN - 12),
                   color=(0.6, 0.6, 0.6), width=0.8)
    page.insert_textbox(RECT, text, fontsize=10.5, fontname="times-roman",
                        align=fitz.TEXT_ALIGN_LEFT, lineheight=1.25)
    doc.save(str(OUT / name))
    doc.close()
    print("wrote", OUT / name)

print("done:", len(DOCS), "sample PDFs")
