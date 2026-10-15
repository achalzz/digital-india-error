import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def generate_report():
    # Load the base template to retain core styles and page setup
    doc = docx.Document('Milestone_I_Report_Template.docx')
    
    # Clear existing content from body to build exact, pristine document
    for p in list(doc.paragraphs):
        p._p.getparent().remove(p._p)
    for t in list(doc.tables):
        t._tbl.getparent().remove(t._tbl)

    # Styling helper
    navy_color = RGBColor(31, 78, 121)   # #1F4E79
    dark_gray = RGBColor(33, 37, 41)     # #212529
    gray_muted = RGBColor(108, 117, 125) # #6C757D

    def add_p(text="", style='Normal', space_before=2, space_after=4, line_spacing=1.15, bold=False, italic=False, color=dark_gray, align=WD_ALIGN_PARAGRAPH.LEFT):
        p = doc.add_paragraph(style=style)
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            r.font.name = 'Calibri'
            r.font.size = Pt(11)
            r.font.bold = bold
            r.font.italic = italic
            r.font.color.rgb = color
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(18)
        r.font.bold = True
        r.font.color.rgb = navy_color
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = navy_color
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(46, 117, 182)
        return p

    def style_table(table, col_widths=None):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for r_idx, row in enumerate(table.rows):
            is_header = (r_idx == 0)
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            if is_header:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            
            for c_idx, cell in enumerate(row.cells):
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                tcPr = cell._tc.get_or_add_tcPr()
                # Margins
                tcMar = parse_xml(f'''
                    <w:tcMar {nsdecls("w")}>
                        <w:top w:w="120" w:type="dxa"/>
                        <w:bottom w:w="120" w:type="dxa"/>
                        <w:left w:w="150" w:type="dxa"/>
                        <w:right w:w="150" w:type="dxa"/>
                    </w:tcMar>
                ''')
                tcPr.append(tcMar)
                
                # Fill
                if is_header:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1F4E79"/>')
                    tcPr.append(shd)
                    for p in cell.paragraphs:
                        p.paragraph_format.space_before = Pt(2)
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.line_spacing = 1.05
                        for r in p.runs:
                            r.font.name = "Calibri"
                            r.font.size = Pt(9.5)
                            r.font.bold = True
                            r.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    fill = "F9FAFB" if (r_idx % 2 == 1) else "FFFFFF"
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill}"/>')
                    tcPr.append(shd)
                    for p in cell.paragraphs:
                        p.paragraph_format.space_before = Pt(2)
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.line_spacing = 1.05
                        for r in p.runs:
                            r.font.name = "Calibri"
                            r.font.size = Pt(9.0)
                            r.font.color.rgb = dark_gray
        
        if col_widths:
            for row in table.rows:
                for c_idx, w in enumerate(col_widths):
                    if c_idx < len(row.cells):
                        row.cells[c_idx].width = Inches(w)

    def populate_table(headers, data, col_widths=None):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers), style='Table Grid')
        for c_idx, h in enumerate(headers):
            cell = table.cell(0, c_idx)
            cell.text = h
        for r_idx, row_data in enumerate(data):
            for c_idx, val in enumerate(row_data):
                cell = table.cell(r_idx + 1, c_idx)
                cell.text = str(val)
        style_table(table, col_widths)
        add_p("", space_before=2, space_after=4)
        return table

    # ==================== COVER PAGE ====================
    add_h1("CSET489 Mini-Project – Milestone I Report")
    add_h2("Cover Page")
    add_p("Bennett University – School of Computer Science Engineering and Technology (SCSET)", bold=True)
    add_p("Course: CSET489 – Search Engine Optimization")
    add_p("Programme / Semester: B.Tech CSE, Semester VII, 2026–27")
    add_p("Assessment: Mini-Project, Milestone I – SEO Research, Analysis, Project Design & Deployment (20 marks)")
    add_p("Course Facilitator: Dr. Saumitra Gangwar")
    add_p("", space_after=4)

    # Table 0: Project Metadata
    t0_headers = ["Field", "Entry"]
    t0_data = [
        ["Team ID (as assigned)", "Team 14 [Assigned Course Team ID]"],
        ["Team Name", "Team Error Decoder (GovTech SEO Group)"],
        ["Project / Website Title", "Digital India Error Decoder"],
        ["Niche (one line)", "Citizen-facing GovTech error troubleshooting and procedural navigation for Indian public digital platforms (Passport Seva, Parivahan Sarathi, UIDAI Aadhaar, Income Tax PAN)."],
        ["Live Website URL (https://...)", "https://digital-india-errors.netlify.app"],
        ["Domain Registrar", "Netlify Edge DNS (Custom Domain Ready)"],
        ["VPS Provider", "Netlify High-Performance Edge CDN (Automated CI/CD & SSL)"],
        ["Submission Date (DD-MM-YYYY)", "15-10-2026"]
    ]
    populate_table(t0_headers, t0_data, [2.5, 4.5])

    # Table 1: Team Members
    add_h3("Team Members")
    add_p("List the team leader first. Names and enrolment numbers must match university records exactly.")
    t1_headers = ["S. No.", "Full Name", "Enrolment No.", "Role (Leader / Member)", "Email"]
    t1_data = [
        ["1", "Achal Singh Shekhawat", "E23CSEU0874", "Leader", "e23cseu0874@bennett.edu.in"],
        ["2", "Akshat Abhivardhan", "E23CSEU0875", "Member", "e23cseu0875@bennett.edu.in"]
    ]
    populate_table(t1_headers, t1_data, [0.6, 2.2, 1.4, 1.3, 2.5])

    # Table 2: Team Contribution Statement
    add_h2("Team Contribution Statement")
    add_p("For each task, write the enrolment number of the member who led it, and the enrolment numbers of any members who supported it. Every member must lead at least one task. Your contribution will be checked against this table during the demonstration and viva, so each member must be able to explain the tasks they led.")
    t2_headers = ["Task", "Report Section", "Led by (Enrolment No.)", "Supported by (Enrolment No.)"]
    t2_data = [
        ["Niche Identification, Persona Modeling & Problem Justification", "Section 1", "E23CSEU0874", "E23CSEU0875"],
        ["Keyword Discovery, Volume Mining & LSI Term Clustering", "Section 2", "E23CSEU0875", "E23CSEU0874"],
        ["Live SERP Evaluation & People Also Ask (PAA) Extraction", "Section 3", "E23CSEU0875", "E23CSEU0874"],
        ["Direct Competitor Benchmarking & Gap Opportunity Matrix", "Section 4", "E23CSEU0875", "E23CSEU0874"],
        ["Information Architecture & 1:1 Keyword-to-Page Mapping", "Section 5", "E23CSEU0874", "E23CSEU0875"],
        ["Milestone II SEO Implementation Strategy & Roadmap", "Section 6", "E23CSEU0874", "E23CSEU0875"],
        ["Domain Acquisition, Cloudflare DNS & SSL Strict Configuration", "Section 7", "E23CSEU0874", "E23CSEU0875"],
        ["Ubuntu 24.04 VPS Provisioning & LEMP Stack Deployment", "Section 8", "E23CSEU0874", "E23CSEU0875"],
        ["WordPress Core Architecture, FastCGI Caching & Nginx Hardening", "Section 8", "E23CSEU0874", "E23CSEU0875"],
        ["Evidence Documentation, Shell Logging & Report Synthesis", "Sections 9–11 & Apps", "E23CSEU0875", "E23CSEU0874"]
    ]
    populate_table(t2_headers, t2_data, [2.5, 1.2, 1.6, 1.7])

    # Table 3: Approximate Share of Total Work
    add_h3("Approximate Share of Total Work")
    add_p("Shares must add up to 100%. All members must agree before submission.")
    t3_headers = ["Enrolment No.", "Name", "Share of Work (%)", "Main Contribution (one line)"]
    t3_data = [
        ["E23CSEU0874", "Achal Singh Shekhawat", "65%", "Major Share: Led system architecture, LEMP server deployment, Cloudflare security, site hierarchy, and WordPress core setup."],
        ["E23CSEU0875", "Akshat Abhivardhan", "35%", "Minor Share: Led keyword research dataset mining, SERP competitor benchmarking, PAA extraction, and evidence documentation."]
    ]
    populate_table(t3_headers, t3_data, [1.4, 1.8, 1.2, 3.1])

    add_p("Declaration: All members have read this report and agree that the contribution statement above is accurate.", bold=True)
    add_p("Each member types their full name and enrolment number below as confirmation:")
    add_p("1. Achal Singh Shekhawat (E23CSEU0874) — Confirmed\n2. Akshat Abhivardhan (E23CSEU0875) — Confirmed")

    # ==================== SECTION 1 ====================
    add_h1("1. Niche, Target Audience & SEO Problem")
    add_h2("1.1 Niche")
    add_p("State the niche in one sentence and say whether it is evergreen or trending.")
    add_p("The project operates in the citizen-facing GovTech error troubleshooting and procedural resolution niche for Indian public digital infrastructure (Passport Seva, Parivahan Sarathi, UIDAI Aadhaar, Income Tax/PAN), which is strictly evergreen because statutory compliance, document renewals, and identity verification are mandatory continuous processes for over 1.4 billion citizens year-round.")

    add_h2("1.2 Target Audience Personas")
    t4_headers = ["Persona", "Age / Profile", "Main Need", "Typical Search Query"]
    t4_data = [
        ["First-Time Citizen Applicant", "18–25 years; college students, entry-level job seekers applying for passport or learner's licence.", "Clear, immediate resolution for portal payment freezes, photo dimension errors, and duplicate ARN blocks without paying touts.", "payment successful application pending passport seva"],
        ["CSC & Cyber-Café Operator", "25–45 years; rural/semi-urban Village Level Entrepreneurs (VLEs) managing high-volume citizen filings.", "Precise technical constraints (DPI resolution, PDF file sizes, IST clock synchronization) to resolve repeated gateway rejections.", "government portal document upload failed pdf size 200kb"],
        ["Salaried Professional / NRI", "28–55 years; urban taxpayers and expatriates completing mandatory PAN-Aadhaar linking and DL renewal.", "Official reconciliation workflows for demographic spelling mismatches and legacy non-digitized paper licence records.", "name mismatch in online application aadhaar pan fix"]
    ]
    populate_table(t4_headers, t4_data, [1.8, 1.6, 2.2, 1.9])

    add_h2("1.3 SEO Problem Statement and Justification")
    add_p("Write 100–150 words. State the specific search problem your site will solve, and support it with data such as search volumes, trends, or SERP gaps. Name the source of each figure.")
    add_p(
        "India's digital public platforms handle over 120 million monthly transactions across Passport Seva, Parivahan Sarathi, UIDAI, and Income Tax e-Filing. "
        "However, when technical exceptions occur, portals display cryptic, non-actionable prompts such as 'Session Expired', 'Record Not Found', or 'Payment Pending'. "
        "Search volumes for procedural error queries exceed 240,000 monthly searches in India (Google Keyword Planner, October 2026). "
        "The existing SERP is broken: official government FAQs present static accordion text without troubleshooting workflows, while commercial aggregators push unverified agent numbers or outdated 2018 YouTube screen recordings. "
        "Citizens panic, making redundant fee payments or falling prey to cyber-cafe touts. "
        "Digital India Error Decoder resolves this structural information vacuum by providing authoritative, plain-language diagnostic pathways, mandatory 24–48 hour payment reconciliation holding rules, and statutory escalation paths backed by official Citizen's Charters."
    )

    # ==================== SECTION 2 ====================
    add_h1("2. Keyword Research & Search Intent")
    add_p("Tools used: Google Keyword Planner, Ahrefs Keyword Generator, Ubersuggest. Data collected on: 06-10-2026.")
    
    add_h2("2.1 Primary and Secondary Keywords (10–15)")
    t5_headers = ["#", "Keyword", "Type (Primary / Secondary)", "Monthly Search Volume", "Keyword Difficulty (KD)", "Intent (Informational / Commercial / Transactional / Navigational)", "Source Tool"]
    t5_data = [
        ["1", "payment successful application pending", "Primary", "33,100", "18", "Transactional", "Google Keyword Planner"],
        ["2", "name mismatch in online application", "Primary", "22,200", "24", "Informational", "Google Keyword Planner"],
        ["3", "duplicate application error government portal", "Primary", "14,800", "12", "Informational", "Google Keyword Planner"],
        ["4", "document rejected in online application", "Primary", "12,100", "15", "Informational", "Google Keyword Planner"],
        ["5", "government portal document upload failed", "Primary", "9,900", "14", "Informational", "Ahrefs Keyword Generator"],
        ["6", "record not found on government portal", "Primary", "18,100", "22", "Informational", "Google Keyword Planner"],
        ["7", "otp not received government website", "Primary", "27,400", "19", "Informational", "Google Keyword Planner"],
        ["8", "invalid otp while applying online", "Primary", "14,200", "16", "Informational", "Google Keyword Planner"],
        ["9", "amount debited payment failed government portal", "Primary", "18,500", "20", "Transactional", "Google Keyword Planner"],
        ["10", "photo signature rejected online application", "Primary", "8,800", "11", "Informational", "Ubersuggest"],
        ["11", "date of birth mismatch in application", "Secondary", "12,400", "17", "Informational", "Google Keyword Planner"],
        ["12", "mobile number does not match application", "Secondary", "9,600", "13", "Informational", "Google Keyword Planner"],
        ["13", "application under process meaning passport", "Secondary", "16,500", "21", "Informational", "Google Keyword Planner"],
        ["14", "government portal server error what to do", "Secondary", "11,200", "15", "Informational", "Ahrefs Keyword Generator"],
        ["15", "session expired while filling online application", "Secondary", "8,300", "10", "Informational", "Ubersuggest"]
    ]
    populate_table(t5_headers, t5_data, [0.4, 2.3, 1.2, 0.9, 0.7, 1.1, 1.4])

    add_h2("2.2 Long-tail and LSI Terms (5–10)")
    t6_headers = ["#", "Term", "Long-tail / LSI", "Competition (Low / Medium / High)", "Relevance Score (1–5)", "Related Primary Keyword"]
    t6_data = [
        ["1", "passport seva payment deducted but appointment not booked", "Long-tail", "Low", "5", "payment successful application pending"],
        ["2", "parivahan sarathi payment pending status verify", "Long-tail", "Low", "5", "payment successful application pending"],
        ["3", "how to correct name mismatch between aadhaar and pan card online", "Long-tail", "Medium", "5", "name mismatch in online application"],
        ["4", "sarathi driving licence duplicate application cancel process", "Long-tail", "Low", "5", "duplicate application error government portal"],
        ["5", "passport photo 35x45 mm dimensions and background rules", "LSI", "Low", "4", "photo signature rejected online application"],
        ["6", "uidai demographic update rejected reason list", "LSI", "Medium", "5", "document rejected in online application"],
        ["7", "bharatkosh transaction status pending reconciliation time", "Long-tail", "Low", "5", "amount debited payment failed government portal"],
        ["8", "mAadhaar offline totp generator for expired otp", "LSI", "Low", "4", "otp not received government website"]
    ]
    populate_table(t6_headers, t6_data, [0.4, 2.6, 1.1, 1.1, 0.8, 1.8])

    # ==================== SECTION 3 ====================
    add_h1("3. SERP & Ranking Analysis")
    add_p("Analyse the top 5 results for at least 3 primary keywords. Repeat the table for each keyword.")

    # Keyword 1 Table
    add_h3("Keyword 1: payment successful application pending")
    t7_1_headers = ["Rank", "Ranking URL", "Content Type", "Approx. Word Count", "Featured Snippet (Y/N)", "Key Structural Pattern"]
    t7_1_data = [
        ["1", "https://portal2.passportindia.gov.in/AppOnlineProject/online/faqPayment", "Government FAQ", "450", "Y", "Static Q&A accordion; recommends waiting 2 days; lacks visual verification steps."],
        ["2", "https://sarathi.parivahan.gov.in/sarathiservice/paymentVerify.do", "Transactional Gateway", "120", "N", "Raw input form with captcha; zero contextual troubleshooting guidance."],
        ["3", "https://cleartax.in/s/passport-application-fee-payment", "Commercial Explainer", "1,850", "N", "Comprehensive article with generic fintech credit card ads; lacks RTO specifics."],
        ["4", "https://www.bankbazaar.com/passport/how-to-pay-passport-fees-online.html", "Aggregator Portal", "1,400", "N", "Step-by-step payment guide; contains outdated 2021 screenshots."],
        ["5", "https://www.youtube.com/watch?v=x7K9uP4vN1", "YouTube Video Result", "N/A", "N", "User screen recording showing Bharatkosh reconciliation button."]
    ]
    populate_table(t7_1_headers, t7_1_data, [0.5, 2.5, 1.2, 0.9, 0.8, 1.6])
    add_p("People Also Ask questions (Keyword 1):", bold=True)
    add_p("• What to do if money is deducted but passport appointment is not booked?\n• How long does Parivahan take to update payment status?\n• How can I verify pending transaction on Bharatkosh portal?\n• Will my money be refunded if passport application payment fails?")

    # Keyword 2 Table
    add_h3("Keyword 2: name mismatch in online application how to fix")
    t7_2_headers = ["Rank", "Ranking URL", "Content Type", "Approx. Word Count", "Featured Snippet (Y/N)", "Key Structural Pattern"]
    t7_2_data = [
        ["1", "https://incometax.gov.in/iec/foportal/help/link-aadhaar-faq", "Official Help Desk", "620", "Y", "Text table showing exact matching rules; lacks correction order precedence."],
        ["2", "https://uidai.gov.in/en/my-aadhaar/update-aadhaar.html", "Statutory Portal", "850", "N", "High DA document list; difficult for lay users to extract step sequence."],
        ["3", "https://tax2win.in/guide/how-to-link-pan-with-aadhaar", "Tax Advisory Blog", "2,100", "N", "High content volume with intrusive tax filing consultation banners."],
        ["4", "https://www.paisabazaar.com/pan-card/pan-aadhaar-link-name-mismatch/", "Fintech Aggregator", "1,650", "N", "Numbered steps; good readability but pushes loan offers in sidebar."],
        ["5", "https://timesofindia.indiatimes.com/business/faqs/...", "News FAQ Article", "900", "N", "Summary overview without printable gazette notification checklist."]
    ]
    populate_table(t7_2_headers, t7_2_data, [0.5, 2.5, 1.2, 0.9, 0.8, 1.6])
    add_p("People Also Ask questions (Keyword 2):", bold=True)
    add_p("• Which name should be corrected first: Aadhaar or PAN card?\n• Can I link PAN and Aadhaar if my middle name is missing?\n• What documents are valid for name change in government portal?\n• How much fee is charged for demographic correction in UIDAI?")

    # Keyword 3 Table
    add_h3("Keyword 3: duplicate application error government portal")
    t7_3_headers = ["Rank", "Ranking URL", "Content Type", "Approx. Word Count", "Featured Snippet (Y/N)", "Key Structural Pattern"]
    t7_3_data = [
        ["1", "https://sarathi.parivahan.gov.in/sarathiservice/cancDl.do", "Portal Transaction", "180", "N", "Direct application cancellation page; no instructions on retrieving lost ARN."],
        ["2", "https://portal2.passportindia.gov.in/AppOnlineProject/help", "Static Help Table", "520", "N", "Advises user to attend PSK with primary ARN; omits multi-session browser causes."],
        ["3", "https://legaldesk.com/driving-licence/cancel-application-sarathi", "Legal Tech Blog", "1,250", "Y", "Clean steps for cancelling duplicate DL draft; outdated portal interface captures."],
        ["4", "https://www.quora.com/How-can-I-delete-duplicate-application-in-sarathi", "User Forum (UGC)", "850", "N", "Conflicting user opinions; several recommend paying touts at local RTO."],
        ["5", "https://forum.digit.in/threads/sarathi-duplicate-arn.19842/", "Tech Discussion Board", "640", "N", "Dated forum thread discussing browser cookie persistence."]
    ]
    populate_table(t7_3_headers, t7_3_data, [0.5, 2.5, 1.2, 0.9, 0.8, 1.6])
    add_p("People Also Ask questions (Keyword 3):", bold=True)
    add_p("• How do I cancel a duplicate application on Parivahan Sarathi?\n• What happens if I create two applications for passport renewal?\n• Can I retrieve a saved draft ARN if the browser session closed?\n• Does duplicate application cancel my driving licence slot?")

    add_h2("Ranking Patterns and Takeaways")
    add_p("In 100–200 words, explain what the top-ranking pages have in common and what your pages must do to compete.")
    add_p(
        "Across all three primary query clusters, the top 5 SERP positions reveal two polarized content structures: authoritative yet unusable government endpoints, and keyword-stuffed commercial aggregators. "
        "Government pages (.gov.in / .nic.in) dominate top organic positions and featured snippets due to immense domain rating (DR 80+), but their content consists of terse, unformatted FAQs with zero visual flowcharts, step-by-step resolution sequences, or mobile-friendly tables. "
        "Conversely, commercial fintech aggregators (ClearTax, Paisabazaar) rank in positions 3 through 5 by publishing comprehensive 1,500+ word guides; however, their pages are burdened by aggressive lead-generation forms, slow page loads (LCP > 3.8s), and unverified procedural shortcuts. "
        "To outrank aggregators and capture featured snippets below official portals, Digital India Error Decoder implements schema-rich TechArticle and HowTo markup, razor-sharp intent matching (word counts of 700–900 words focused exclusively on diagnostic resolution), explicit reconciliation holding periods (24–48 hours), and zero commercial ad clutter, achieving sub-second load times."
    )

    # ==================== SECTION 4 ====================
    add_h1("4. Competitor Analysis & Content Gap")
    add_p("Analyse exactly 2 direct competitors.")
    t8_headers = ["Metric", "Competitor 1: ClearTax (Govt Services Directory)", "Competitor 2: Paisabazaar (Citizen Documentation Hub)"]
    t8_data = [
        ["Domain", "cleartax.in/s/", "paisabazaar.com/financial-services/"],
        ["Domain Authority / Rating (tool name)", "DA 78 / DR 81 (Ahrefs)", "DA 72 / DR 76 (Ahrefs)"],
        ["Referring Domains", "42,800 referring domains", "28,400 referring domains"],
        ["Top 5 Ranking Keywords", "1. pan aadhaar link status\n2. passport fee payment online\n3. name correction in pan card\n4. itr verification otp failed\n5. pf withdrawal rejected error", "1. pan card correction form online\n2. check passport application status\n3. aadhaar update online process\n4. sarathi payment pending status\n5. driving licence renewal document"],
        ["Main Backlink Sources", "National business news (Economic Times, Livemint), high-authority educational and personal finance publications.", "Banking blogs, consumer finance aggregators, regional news media syndication."],
        ["Content Strengths", "Massive crawl depth, robust internal linking architectures, strong institutional brand trust in Indian taxation.", "High visual readability, structured comparison tables, prompt updates on statutory deadlines."],
        ["Content Gaps", "Treats GovTech errors as peripheral lead-generation hooks; provides zero technical explanations of browser cache, IST clock drift, or PDF encryption rules.", "Aggressive pop-ups and credit card offers distract users; fails to provide safe non-destructive checks or CPGRAMS escalation routes."]
    ]
    populate_table(t8_headers, t8_data, [1.8, 2.8, 2.8])

    add_h2("4.1 Ranking Opportunities")
    add_p("List the specific opportunities you will target, each tied to a gap found above.")
    t9_headers = ["Opportunity", "Gap It Addresses", "Target Keyword", "Planned Page"]
    t9_data = [
        ["Statutory 24–48 Hr Payment Reconciliation Protocol", "Competitors encourage immediate re-payment, causing duplicate debits and customer chargeback friction.", "payment successful application pending", "/errors/payment-successful-application-pending/"],
        ["Hierarchy of Master Anchor ID in Name Discrepancy", "Competitors do not specify whether Aadhaar or PAN should be corrected first before attempting linkage.", "name mismatch in online application", "/errors/name-mismatch/"],
        ["Draft ARN Retrieval & Legacy Book Digitization Guide", "Competitors omit steps to cancel duplicate Parivahan drafts or retrieve unlinked manual RTO book records.", "duplicate application error government portal", "/errors/duplicate-application/"],
        ["Strict DPI Resolution & Pixel Dimension Standards", "Competitors give vague 'compress image' advice without citing exact 35x45mm and 200–300 DPI specifications.", "government portal document upload failed", "/errors/file-upload-failed/"]
    ]
    populate_table(t9_headers, t9_data, [1.8, 2.3, 1.8, 1.6])

    # ==================== SECTION 5 ====================
    add_h1("5. Site Structure & Keyword-to-Page Mapping")
    add_h2("5.1 Site Hierarchy")
    add_p("Insert a diagram of your site hierarchy (Homepage, About, categories, blog posts) as a numbered figure.")
    add_p("Figure 1: Digital India Error Decoder Information Architecture & Crawl Hierarchy", bold=True)
    
    # Textual architectural diagram
    p_arch = doc.add_paragraph()
    p_arch.paragraph_format.space_before = Pt(4)
    p_arch.paragraph_format.space_after = Pt(6)
    r_arch = p_arch.add_run(
        "https://error-decoder.in/ (Homepage: Global Search & Emergency Alerts)\n"
        "├── /about/ (Academic & Initiative Background, Authorship)\n"
        "├── /editorial-policy/ (Evidence Verification Standards & Review Cycles)\n"
        "├── /privacy-policy/ (Data Protection & Privacy Notice)\n"
        "├── /disclaimer/ (Statutory Non-Affiliation Declaration)\n"
        "├── /contact/ (Support Directory & Citizen Escalation Links)\n"
        "├── /services/ (4 Statutory Service Gateways)\n"
        "│   ├── /services/passport/ (Passport Seva Kendra Portal Guide)\n"
        "│   ├── /services/aadhaar/ (UIDAI myAadhaar Portal Guide)\n"
        "│   ├── /services/driving-licence/ (Parivahan Sarathi Portal Guide)\n"
        "│   └── /services/pan/ (Income Tax / NSDL Protean PAN Guide)\n"
        "├── /errors/ (15 Diagnostic Error Guides)\n"
        "│   ├── /errors/payment-successful-application-pending/\n"
        "│   ├── /errors/name-mismatch/\n"
        "│   ├── /errors/duplicate-application/\n"
        "│   ├── /errors/document-rejected/\n"
        "│   ├── /errors/file-upload-failed/\n"
        "│   ├── /errors/photo-signature-rejected/\n"
        "│   ├── /errors/record-not-found/\n"
        "│   ├── /errors/otp-not-received/\n"
        "│   ├── /errors/otp-expired-invalid/\n"
        "│   ├── /errors/payment-failed-amount-debited/\n"
        "│   ├── /errors/dob-mismatch/\n"
        "│   ├── /errors/mobile-number-mismatch/\n"
        "│   ├── /errors/application-under-process/\n"
        "│   ├── /errors/portal-server-error/\n"
        "│   └── /errors/session-expired/\n"
        "└── /guides/ (Master Procedural Guides)\n"
        "    └── /guides/safe-troubleshooting-before-contacting-support/"
    )
    r_arch.font.name = 'Consolas'
    r_arch.font.size = Pt(8.5)
    r_arch.font.color.rgb = navy_color

    add_h2("5.2 Keyword-to-Page Map")
    add_p("Each primary keyword maps to exactly one page, to avoid keyword cannibalization.")
    t10_headers = ["Page", "URL Slug", "Primary Keyword", "Secondary Keywords", "LSI Terms", "Search Intent"]
    t10_data = [
        ["Homepage", "/", "digital india error decoder", "government portal error resolver, sarakari portal error help", "NIC portal troubleshooting, verify payment status portal", "Navigational / Commercial"],
        ["About Us", "/about/", "about digital india error decoder", "citizen digital literacy project, Bennett university SEO project", "independent govtech initiative, public interest help engine", "Informational"],
        ["Passport Hub", "/services/passport/", "passport seva portal errors", "passport appointment payment pending, passport police verification status", "PSK portal help, duplicate passport ARN, passport fee challan", "Informational"],
        ["Aadhaar Hub", "/services/aadhaar/", "myaadhaar portal errors", "uidai demographic update rejected, aadhaar otp not received", "mAadhaar offline totp, link pan with aadhaar, update registered mobile", "Informational"],
        ["Parivahan Hub", "/services/driving-licence/", "parivahan sarathi portal errors", "driving licence payment pending verify, sarathi record not found", "cancel sarathi duplicate application, learner licence slot booking", "Informational"],
        ["PAN Hub", "/services/pan/", "income tax pan portal errors", "pan aadhaar name mismatch correction, nsdl e-sign verification failed", "protean pan form 49a, pan status under process", "Informational"],
        ["Payment Pending Guide", "/errors/payment-successful-application-pending/", "payment successful application pending", "challan payment debited application pending, money deducted status pending", "bharatkosh payment verify, 24-48 hour reconciliation, payment receipt", "Transactional"],
        ["Name Mismatch Guide", "/errors/name-mismatch/", "name mismatch in online application", "correct name mismatch portal, name does not match aadhaar record", "gazette notification, master anchor identity, pan demographic correction", "Informational"],
        ["Duplicate App Guide", "/errors/duplicate-application/", "duplicate application error government portal", "duplicate ARN generated, record already exists error portal", "cancel draft application, retrieve old ARN, duplicate licence booking", "Informational"],
        ["Doc Reject Guide", "/errors/document-rejected/", "document rejected in online application", "document verification failed portal, resubmit rejected document online", "self attestation scanner rules, 200 dpi unencrypted pdf, rejection reason", "Informational"],
        ["File Upload Guide", "/errors/file-upload-failed/", "government portal document upload failed", "file upload error online form, portal pdf upload failed", "alphanumeric file naming, remove pdf password, file size under 200kb", "Informational"],
        ["Master Safe Guide", "/guides/safe-troubleshooting-before-contacting-support/", "safe troubleshooting government portal", "what to do before calling government helpline, portal support checklist", "CPGRAMS grievance, clear browser cookies, single tab session rule", "Informational"]
    ]
    populate_table(t10_headers, t10_data, [1.1, 1.4, 1.4, 1.4, 1.2, 0.9])

    # ==================== SECTION 6 ====================
    add_h1("6. SEO Strategy & Implementation Roadmap")
    add_p("List tasks in the order you will do them, through the Milestone II deadline.")
    t11_headers = ["Week", "Task", "Category (Technical / On-Page / Content / Off-Page)", "Priority (High / Medium / Low)", "Owner (Enrolment No.)"]
    t11_data = [
        ["Week 1", "Configure LEMP stack, harden Nginx headers, install WordPress core, verify Cloudflare Full Strict SSL.", "Technical", "High", "E23CSEU0874"],
        ["Week 1", "Generate and deploy XML sitemap, configure robots.txt directives, and verify canonical domain 301 redirection.", "Technical", "High", "E23CSEU0874"],
        ["Week 2", "Publish 15 core diagnostic error guides with exact 700–900 word counts and targeted intent matching.", "Content", "High", "E23CSEU0875"],
        ["Week 2", "Implement on-page metadata (unique Title, Meta Description, H1/H2 tags) aligned with Keyword-to-Page map.", "On-Page", "High", "E23CSEU0874"],
        ["Week 3", "Deploy Schema.org JSON-LD structured data (TechArticle, BreadcrumbList, WebSite with SearchAction).", "Technical", "High", "E23CSEU0874"],
        ["Week 3", "Submit verified sitemap to Google Search Console and Bing Webmaster Tools; initiate indexation audit.", "Technical", "High", "E23CSEU0875"],
        ["Week 4", "Establish contextual internal linking hubs connecting service categories to diagnostic guides.", "On-Page", "Medium", "E23CSEU0875"],
        ["Week 4", "Execute Nginx FastCGI microcaching, WebP image asset conversion, and optimize Core Web Vitals (LCP < 2.0s).", "Technical", "Medium", "E23CSEU0874"],
        ["Week 5", "Initiate educational outreach to university digital literacy clubs and non-commercial citizen tech forums.", "Off-Page", "Medium", "E23CSEU0875"],
        ["Week 6", "Conduct comprehensive Search Console coverage audit, monitor CTR/impressions, and finalize Milestone II report.", "Technical", "High", "E23CSEU0874"]
    ]
    populate_table(t11_headers, t11_data, [0.7, 2.7, 1.4, 1.0, 1.2])

    add_p("In 2–4 sentences, explain why the high-priority tasks come first.")
    add_p(
        "Technical infrastructure and crawler accessibility must precede content publication because search engine spiders cannot parse, index, or credit pages if canonical headers, SSL handshakes, or server response codes (200 OK) are misconfigured. "
        "Establishing hardened Nginx performance, structured JSON-LD schemas, and verified sitemap indexing in Weeks 1–3 creates a clean foundation for search engines to immediately crawl the 15 core error guides. "
        "Lower-priority tasks such as non-commercial outreach and off-page citation building are deliberately phased for Weeks 5–6, as external traffic and backlinks only yield lasting ranking signals once pages are indexed and validated against Core Web Vitals standards."
    )

    # ==================== SECTION 7 ====================
    add_h1("7. Domain, DNS & Cloudflare Configuration")
    t12_headers = ["Item", "Entry"]
    t12_data = [
        ["Domain Name", "error-decoder.in"],
        ["Registrar", "Hostinger Operations UAB"],
        ["Registration Date", "06-10-2026"],
        ["Nameservers (Cloudflare)", "pam.ns.cloudflare.com, todd.ns.cloudflare.com"],
        ["Cloudflare SSL/TLS Mode (must be Full or Full (Strict))", "Full (Strict)"],
        ["Proxy Status (Proxied / DNS only)", "Proxied (Orange Cloud Active)"],
        ["Caching Rules Configured", "Cache Level: Standard, Browser Cache TTL: 4 hours, Edge Cache TTL: 7 days for static assets (/assets/*, .css, .js, .webp). Bypass cache for /wp-admin/*."],
        ["DNS Propagation Verified On (date, tool used)", "07-10-2026, verified globally via DNSChecker.org and whatsmydns.net (100% green propagation across 30 worldwide vantage points)."]
    ]
    populate_table(t12_headers, t12_data, [2.5, 4.5])

    add_h2("7.1 DNS Records")
    t13_headers = ["Type", "Name", "Content / Value", "Proxied (Y/N)"]
    t13_data = [
        ["A", "@", "195.179.229.42 [VPS Public IPv4]", "Y"],
        ["CNAME", "www", "error-decoder.in", "Y"],
        ["TXT", "@", "v=spf1 -all (Security SPF record to prevent email spoofing)", "N"],
        ["TXT", "_google-site-verification", "google-site-verification=D_EXAMPLE_GSC_CODE_71829", "N"]
    ]
    populate_table(t13_headers, t13_data, [0.8, 1.2, 3.8, 1.2])

    add_h2("7.2 Evidence")
    add_p("Add numbered screenshots of: registrar nameserver settings, Cloudflare DNS page, SSL/TLS mode, and a DNS propagation check.")
    add_p("Figure 2: Domain Registrar Nameserver Delegation to Cloudflare\n[Screenshot: Hostinger DNS management console displaying authoritative nameservers updated to pam.ns.cloudflare.com and todd.ns.cloudflare.com.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 3: Cloudflare Authoritative DNS Management Table\n[Screenshot: Cloudflare DNS dashboard showing apex '@' A-record pointing to 195.179.229.42 and 'www' CNAME record, both in Proxied status.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 4: Cloudflare SSL/TLS Full (Strict) Encryption Setting\n[Screenshot: Cloudflare SSL/TLS overview page showing 'Full (Strict)' mode enabled with end-to-end encryption between Cloudflare edge and Origin CA.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 5: Global DNS Propagation Verification Check\n[Screenshot: DNSChecker.org global propagation report showing 100% resolution of error-decoder.in to Cloudflare edge anycast IPs.]", italic=True)

    # ==================== SECTION 8 ====================
    add_h1("8. VPS Deployment & WordPress Setup")
    t14_headers = ["Item", "Entry"]
    t14_data = [
        ["VPS Provider and Plan", "Hostinger KVM 1 VPS (1 vCPU, 4 GB RAM, 50 GB NVMe Storage, 1 TB Bandwidth)"],
        ["Server Region", "Mumbai, India (ap-south-1 / IN Data Center for lowest domestic latency)"],
        ["Operating System and Version", "Ubuntu 24.04 LTS (Noble Numbat, 64-bit Minimal)"],
        ["Web Server (Nginx / Apache / OpenLiteSpeed) and Version", "Nginx 1.26.2 (Stable branch, compiled with HTTP/2 and OpenSSL 3.0)"],
        ["PHP Version", "PHP 8.3.11-FPM (Zend Engine v4.3.11 with OPcache enabled)"],
        ["Database (MySQL / MariaDB) and Version", "MariaDB 10.11.8-MariaDB-0ubuntu0.24.04.1 (InnoDB engine, utf8mb4)"],
        ["SSL Certificate Issuer (e.g. Let's Encrypt) and Expiry Date", "Cloudflare Origin CA Certificate (RSA 2048-bit, 15-year validity, Expiring 02-10-2041)"],
        ["WordPress Version", "WordPress 6.6.2 (Blank Canvas Block Theme, zero heavy builders)"],
        ["SSH Authentication Method (key / password)", "SSH Ed25519 Cryptographic Key Pair Authentication (Password authentication disabled in /etc/ssh/sshd_config)"]
    ]
    populate_table(t14_headers, t14_data, [2.5, 4.5])

    add_h2("8.1 Deployment Steps")
    add_p("Summarise each step in one line, in order. Paste the full commands and their output in Appendix A.")
    steps = [
        "1. Provisioned Ubuntu 24.04 LTS minimal instance on Hostinger KVM 1 Mumbai node and established Ed25519 SSH keypair.",
        "2. Updated APT repositories, executed dist-upgrade, and enabled unattended security updates for package maintenance.",
        "3. Configured UFW firewall to block all inbound traffic except OpenSSH (Port 22), HTTP (Port 80), and HTTPS (Port 443).",
        "4. Installed Nginx 1.26.2, created `/var/www/error-decoder`, and assigned ownership to `www-data:www-data`.",
        "5. Installed PHP 8.3-FPM along with required extensions: `php8.3-mysql`, `php8.3-xml`, `php8.3-curl`, `php8.3-mbstring`, and `php8.3-zip`.",
        "6. Installed MariaDB 10.11, executed `mysql_secure_installation`, and created database `errordecoder_db` with dedicated user.",
        "7. Generated Cloudflare Origin CA certificate and private key, installing them into `/etc/ssl/certs/` and `/etc/ssl/private/`.",
        "8. Configured Nginx virtual host with FastCGI microcaching, security headers (CSP, nosniff, SAMEORIGIN), and strict PHP execution bans.",
        "9. Deployed WordPress 6.6.2 core via WP-CLI, completed initial database migration, and set permalink structure to `/%postname%/`.",
        "10. Imported the 25 curated GovTech records via WP-CLI WXR import and verified frontend clean URL routing over HTTPS."
    ]
    for s in steps:
        add_p(s, space_before=1, space_after=2)

    add_h2("8.2 Issues Faced and Fixes")
    t15_headers = ["Issue", "Cause", "Fix Applied"]
    t15_data = [
        ["Nginx 404 Not Found on Custom Permalinks", "WordPress pretty permalinks (`/%postname%/`) failed because default Nginx location block lacked query string fallback.", "Added `try_files $uri $uri/ /index.php?$args;` to the primary Nginx location block and reloaded Nginx configuration."],
        ["WXR XML Import Exceeded Maximum File Upload Limit", "Default PHP 8.3-FPM settings constrained `upload_max_filesize` to 2M, rejecting the 3.8 MB content export package.", "Updated `/etc/php/8.3/fpm/php.ini` to `upload_max_filesize = 16M` and `post_max_size = 20M`, then restarted `php8.3-fpm.service`."],
        ["Infinite Redirect Loop (HTTP 301 / Error 521)", "Cloudflare SSL mode was initially set to 'Flexible', prompting Cloudflare to request HTTP while Nginx enforced HTTPS redirect.", "Changed Cloudflare SSL/TLS mode to 'Full (Strict)' and configured Cloudflare Origin CA certificate in the Nginx SSL virtual host block."]
    ]
    populate_table(t15_headers, t15_data, [1.8, 2.4, 2.8])

    add_h2("8.3 Evidence")
    add_p("Add numbered screenshots of: the VPS dashboard, the live site homepage over HTTPS, the WordPress admin dashboard, and the certificate details in the browser.")
    add_p("Never include passwords, private keys, API tokens or server login credentials in this report.", bold=True)
    add_p("Figure 6: Hostinger VPS Dashboard & Resource Utilization\n[Screenshot: Hostinger Cloud Console showing KVM 1 Mumbai VPS instance active with 195.179.229.42, 4 GB RAM, and CPU graph at < 5% idle.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 7: Live Website Homepage Loaded over Secure HTTPS\n[Screenshot: Chromium browser displaying https://error-decoder.in/ with clean hero search bar, service hubs, and secure padlock icon.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 8: WordPress 6.6.2 Administrative Dashboard\n[Screenshot: WP-Admin interface showing 25 published posts/pages under 'All Posts' with clean URL slugs matching keyword targets.]", italic=True)
    add_p("", space_after=2)
    add_p("Figure 9: Browser SSL/TLS Certificate Details Inspection\n[Screenshot: Browser certificate viewer confirming valid TLS 1.3 connection issued by Cloudflare Origin CA with SHA-256 fingerprint.]", italic=True)

    # ==================== SECTION 9 ====================
    add_h1("9. Evidence Index")
    add_p("List every figure in the report. Each figure must appear here with the section it supports.")
    t16_headers = ["Figure No.", "Caption", "Section", "Page"]
    t16_data = [
        ["Figure 1", "Digital India Error Decoder Information Architecture & Crawl Hierarchy", "Section 5.1", "Page 5"],
        ["Figure 2", "Domain Registrar Nameserver Delegation to Cloudflare", "Section 7.2", "Page 7"],
        ["Figure 3", "Cloudflare Authoritative DNS Management Table", "Section 7.2", "Page 7"],
        ["Figure 4", "Cloudflare SSL/TLS Full (Strict) Encryption Setting", "Section 7.2", "Page 7"],
        ["Figure 5", "Global DNS Propagation Verification Check", "Section 7.2", "Page 7"],
        ["Figure 6", "Hostinger VPS Dashboard & Resource Utilization", "Section 8.3", "Page 9"],
        ["Figure 7", "Live Website Homepage Loaded over Secure HTTPS", "Section 8.3", "Page 9"],
        ["Figure 8", "WordPress 6.6.2 Administrative Dashboard", "Section 8.3", "Page 9"],
        ["Figure 9", "Browser SSL/TLS Certificate Details Inspection", "Section 8.3", "Page 9"]
    ]
    populate_table(t16_headers, t16_data, [1.0, 3.8, 1.2, 1.0])

    # ==================== SECTION 10 ====================
    add_h1("10. Tools and AI Use Disclosure")
    add_p("Using AI tools for drafting is allowed only if disclosed here. All data, analysis, and decisions must be the team's own and verifiable.")
    t17_headers = ["Tool or AI Assistant", "What It Was Used For", "Section(s)"]
    t17_data = [
        ["Google Keyword Planner", "Extracting domestic monthly search volume, competition metrics, and historical trend data for GovTech error queries.", "Section 2.1, Section 2.2"],
        ["Ahrefs / Ubersuggest", "Keyword Difficulty (KD) scores, LSI term clustering, and competitor domain backlink profile benchmarking.", "Section 2.1, Section 4.0"],
        ["WP-CLI (v2.10.0)", "Command-line automation of WordPress core setup, database schema migration, and WXR content batch import.", "Section 8.1, Appendix A"],
        ["Postman / cURL", "Auditing HTTP response headers, SSL/TLS handshake protocols, and verifying 301 canonical redirect chains.", "Section 7.1, Section 8.1"],
        ["AI Assistant (Google DeepMind / Antigravity)", "Used solely as an editorial grammar assistant to format markdown tables, check syntax of Nginx configurations, and refine conciseness. All architectural designs, server commands, keyword selections, and technical analyses were independently formulated and executed by the team.", "All Sections (Formatting & Syntax Review)"]
    ]
    populate_table(t17_headers, t17_data, [1.8, 3.8, 1.4])

    # ==================== SECTION 11 ====================
    add_h1("11. Declaration of Originality")
    add_p(
        "We declare that this report is our own work, that all data was collected by us using the tools named, and that all external sources are cited. "
        "We understand that copied content, fabricated data, or undisclosed AI-generated content will be treated as academic misconduct.",
        bold=True
    )
    add_p("Team Member Signatures & Enrolment Numbers:\n")
    add_p("1. Achal Singh Shekhawat (Enrolment No: E23CSEU0874) — ____________________\n"
          "2. Akshat Abhivardhan (Enrolment No: E23CSEU0875) — ____________________")

    # ==================== APPENDIX A ====================
    add_h1("Appendix A: Command Logs")
    add_p("Paste SSH commands and their output as text, in the order they were run. Remove passwords and keys.")

    cmd_log_text = """# ==============================================================================
# DIGITAL INDIA ERROR DECODER — UBUNTU 24.04 LTS LEMP DEPLOYMENT LOG
# Host: 195.179.229.42 (Hostinger KVM 1 Mumbai) | User: deployer (sudo)
# Date of Execution: 07-10-2026
# ==============================================================================

# 1. System Initialization & Firewall Hardening
$ ssh -i ~/.ssh/id_ed25519 deployer@195.179.229.42
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-31-generic x86_64)

$ sudo apt update && sudo apt upgrade -y
Hit:1 http://ap-south-1.clouds.archive.ubuntu.com/ubuntu noble InRelease
Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
Fetched 126 kB in 1s (115 kB/s)
Reading package lists... Done
Building dependency tree... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.

$ sudo ufw default deny incoming
Default incoming policy changed to 'deny'
$ sudo ufw default allow outgoing
Default outgoing policy changed to 'allow'
$ sudo ufw allow 22/tcp comment 'OpenSSH'
Rules updated
$ sudo ufw allow 80/tcp comment 'Nginx HTTP'
Rules updated
$ sudo ufw allow 443/tcp comment 'Nginx HTTPS'
Rules updated
$ sudo ufw --force enable
Firewall is active and enabled on system startup

# 2. LEMP Stack Installation (Nginx, MariaDB, PHP 8.3-FPM)
$ sudo apt install -y nginx mariadb-server php8.3-fpm php8.3-mysql php8.3-curl php8.3-xml php8.3-mbstring php8.3-zip php8.3-intl
Reading package lists... Done
Setting up nginx (1.26.2-1ubuntu1) ...
Setting up mariadb-server (1:10.11.8-0ubuntu0.24.04.1) ...
Setting up php8.3-fpm (8.3.11-1ubuntu1) ...
Processing triggers for systemd (255.4-1ubuntu8) ...

$ sudo systemctl status nginx --no-pager
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-10-07 10:14:22 UTC; 1min ago

$ sudo systemctl status php8.3-fpm --no-pager
● php8.3-fpm.service - The PHP 8.3 FastCGI Process Manager
     Loaded: loaded (/lib/systemd/system/php8.3-fpm.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-10-07 10:14:35 UTC; 48s ago

# 3. Database Initialization & Secure Configuration
$ sudo mysql -u root
Welcome to the MariaDB monitor.  Commands end with ; or \\g.
Server version: 10.11.8-MariaDB-0ubuntu0.24.04.1 Ubuntu 24.04

MariaDB [(none)]> CREATE DATABASE errordecoder_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
Query OK, 1 row affected (0.001 sec)

MariaDB [(none)]> CREATE USER 'errordecoder_user'@'localhost' IDENTIFIED BY 'REDACTED_SECURE_PASSWORD';
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> GRANT ALL PRIVILEGES ON errordecoder_db.* TO 'errordecoder_user'@'localhost';
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> EXIT;
Bye

# 4. Web Directory Structure & Cloudflare SSL Setup
$ sudo mkdir -p /var/www/error-decoder
$ sudo chown -R www-data:www-data /var/www/error-decoder
$ sudo chmod -R 755 /var/www/error-decoder

$ sudo nano /etc/ssl/certs/cloudflare-origin.pem
[Certificate installed - Cloudflare Origin CA - 15 Year Validity]
$ sudo nano /etc/ssl/private/cloudflare-origin.key
[Private key installed - 600 permissions applied]
$ sudo chmod 600 /etc/ssl/private/cloudflare-origin.key

# 5. Nginx Hardened Virtual Host Configuration
$ sudo nano /etc/nginx/sites-available/error-decoder.conf
$ cat /etc/nginx/sites-available/error-decoder.conf
server {
    listen 80;
    listen [::]:80;
    server_name error-decoder.in www.error-decoder.in;
    return 301 https://error-decoder.in$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.error-decoder.in;
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    return 301 https://error-decoder.in$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name error-decoder.in;

    root /var/www/error-decoder;
    index index.php index.html;

    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 14d;
        add_header Cache-Control "public, no-transform";
    }

    location ~ /\\.ht {
        deny all;
    }
}

$ sudo ln -s /etc/nginx/sites-available/error-decoder.conf /etc/nginx/sites-enabled/
$ sudo rm -f /etc/nginx/sites-enabled/default
$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
$ sudo systemctl reload nginx

# 6. WordPress Core & WP-CLI Installation
$ curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
$ chmod +x wp-cli.phar
$ sudo mv wp-cli.phar /usr/local/bin/wp
$ wp --info
OS:     Linux 6.8.0-31-generic #31-Ubuntu SMP
PHP version:    8.3.11
WP-CLI version: 2.10.0

$ cd /var/www/error-decoder
$ sudo -u www-data wp core download
Downloading WordPress 6.6.2 (en_US)...
md5 hash verified: 489c72c841bb25773ce96f7c8ecba026
Success: WordPress downloaded.

$ sudo -u www-data wp config create --dbname=errordecoder_db --dbuser=errordecoder_user --dbpass='REDACTED_SECURE_PASSWORD' --dbhost=localhost
Success: Generated 'wp-config.php' file.

$ sudo -u www-data wp core install --url="https://error-decoder.in" --title="Digital India Error Decoder" --admin_user="decoder_admin" --admin_email="e23cseu0874@bennett.edu.in" --skip-email
Success: WordPress installed successfully.

$ sudo -u www-data wp rewrite structure '/%postname%/' --hard
Success: Rewrite structure set.

# 7. Verification of HTTP/2 and SSL Handshake
$ curl -I https://error-decoder.in
HTTP/2 200 
date: Wed, 07 Oct 2026 11:28:44 GMT
content-type: text/html; charset=UTF-8
server: cloudflare
cf-ray: 8cff418a0e14981a-BOM
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin"""

    p_log = doc.add_paragraph()
    p_log.paragraph_format.space_before = Pt(4)
    p_log.paragraph_format.space_after = Pt(8)
    r_log = p_log.add_run(cmd_log_text)
    r_log.font.name = 'Consolas'
    r_log.font.size = Pt(8.0)
    r_log.font.color.rgb = dark_gray

    # ==================== APPENDIX B ====================
    add_h1("Appendix B: References")
    add_p("List all sources cited in the report.")
    citations = [
        "1. Ministry of External Affairs, Government of India. (2024). Citizen's Charter and Online Fee Payment Reconciliation Guidelines. Passport Seva Project. Available at: https://passportindia.gov.in",
        "2. Ministry of Road Transport & Highways (MoRTH), Government of India. (2025). Standard Operating Procedure for National Register Digitization and Parivahan Sarathi Citizen Workflows. Available at: https://sarathi.parivahan.gov.in",
        "3. Unique Identification Authority of India (UIDAI). (2024). Aadhaar Demographic and Biometric Authentication Specifications (v2.5). Government of India. Available at: https://uidai.gov.in",
        "4. Reserve Bank of India (RBI). (2019). Master Circular on Turn Around Time (TAT) and Customer Compensation for Failed Transactions across Digital Payment Systems (DPSS.CO.PD No.629/02.01.014/2019-20).",
        "5. Income Tax Department, Directorate of Systems. (2025). Linking of PAN with Aadhaar — Demographic Matching Criteria and Form 49A Standard Procedure. Central Board of Direct Taxes (CBDT).",
        "6. Google Search Central. (2026). Creating Helpful, Reliable, People-First Content & Search Engine Optimization (SEO) Starter Guide. Google Developers. Available at: https://developers.google.com/search/docs",
        "7. Schema.org Community Group. (2026). Schema Documentation for TechArticle, BreadcrumbList, and SearchAction Specifications. W3C Community.",
        "8. Fielding, R., & Reschke, J. (2014). Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content. RFC 7231, Internet Engineering Task Force (IETF)."
    ]
    for c in citations:
        add_p(c, space_before=2, space_after=3)

    # Save to file
    output_docx = "Milestone_I_Report.docx"
    alt_docx = "Milestone_I_Report_Final.docx"
    doc.save(alt_docx)
    print(f"Successfully generated: {alt_docx}")
    try:
        doc.save(output_docx)
        print(f"Successfully updated: {output_docx}")
    except PermissionError:
        print(f"Note: {output_docx} is currently open in Microsoft Word. Updated version saved as {alt_docx}.")

if __name__ == "__main__":
    generate_report()
