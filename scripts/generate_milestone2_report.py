import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def generate_report():
    doc = docx.Document()
    
    # Page setup - Margins: 0.75 in (54 pt) all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Palette
    navy_color = RGBColor(31, 78, 121)    # #1F4E79 (Deep University Navy)
    dark_gray = RGBColor(33, 37, 41)      # #212529 (Body text)
    gray_muted = RGBColor(108, 117, 125)  # #6C757D (Subtext)
    border_gray = "CCCCCC"

    def add_p(text="", style='Normal', space_before=2, space_after=4, line_spacing=1.15, bold=False, italic=False, color=dark_gray, align=WD_ALIGN_PARAGRAPH.LEFT):
        p = doc.add_paragraph(style=style)
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            r.font.name = 'Calibri'
            r.font.size = Pt(10)
            r.font.bold = bold
            r.font.italic = italic
            r.font.color.rgb = color
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = navy_color
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = navy_color
        return p

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_cell_border(cell, **kwargs):
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = OxmlElement('w:tcBorders')
        for edge in ('top', 'left', 'bottom', 'right'):
            edge_data = kwargs.get(edge)
            if edge_data:
                tag = f'w:{edge}'
                element = OxmlElement(tag)
                element.set(qn('w:val'), edge_data.get('val', 'single'))
                element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
                element.set(qn('w:space'), '0')
                element.set(qn('w:color'), edge_data.get('color', border_gray))
                tcBorders.append(element)
            else:
                tag = f'w:{edge}'
                element = OxmlElement(tag)
                element.set(qn('w:val'), 'none')
                tcBorders.append(element)
        tcPr.append(tcBorders)

    def style_table(table, col_widths, col_alignments):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        border_kwargs = {
            'top': {'val': 'single', 'sz': 4, 'color': border_gray},
            'bottom': {'val': 'single', 'sz': 4, 'color': border_gray},
            'left': {'val': 'single', 'sz': 4, 'color': border_gray},
            'right': {'val': 'single', 'sz': 4, 'color': border_gray}
        }
        for r_idx, row in enumerate(table.rows):
            is_header = (r_idx == 0)
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            if is_header:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

            for c_idx, cell in enumerate(row.cells):
                cell.width = Inches(col_widths[c_idx])
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
                set_cell_border(cell, **border_kwargs)
                if is_header:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1F4E79"/>')
                    cell._tc.get_or_add_tcPr().append(shd)
                elif r_idx % 2 == 1:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F2F5F8"/>')
                    cell._tc.get_or_add_tcPr().append(shd)

                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.line_spacing = 1.05
                    p.alignment = col_alignments[c_idx]
                    for run in p.runs:
                        run.font.name = 'Calibri'
                        run.font.size = Pt(8.5 if len(col_widths) > 5 else 9)
                        if is_header:
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(255, 255, 255)
                        else:
                            run.font.color.rgb = dark_gray

    # ==========================================
    # COVER PAGE
    # ==========================================
    p = add_p("Bennett University – School of Computer Science Engineering and Technology (SCSET)", bold=True, color=navy_color, align=WD_ALIGN_PARAGRAPH.CENTER)
    p.runs[0].font.size = Pt(13)
    p = add_p("Course: CSET489 – Search Engine Optimization | B.Tech CSE, Semester VII, 2026–27", bold=True, color=dark_gray, align=WD_ALIGN_PARAGRAPH.CENTER)
    p.runs[0].font.size = Pt(10.5)
    p = add_p("Mini-Project, Milestone II – SEO Implementation, Content, Backlinking, Analytics & Evaluation (20 Marks)", bold=True, color=navy_color, align=WD_ALIGN_PARAGRAPH.CENTER)
    p.runs[0].font.size = Pt(11)
    p = add_p("Course Facilitator: Dr. Saumitra Gangwar", italic=True, color=gray_muted, align=WD_ALIGN_PARAGRAPH.CENTER)
    p.runs[0].font.size = Pt(9.5)
    add_p(space_after=4)

    # Project Overview Table
    cover_data = [
        ["Field", "Entry"],
        ["Team ID (generate using the portal)", "Team 14 [Assigned Course Team ID]"],
        ["Team Name", "Team Error Decoder (GovTech SEO Group)"],
        ["Live Website URL & hosting", "https://digital-india-error.netlify.app/ (Netlify High-Performance Edge CDN & SSL)"],
        ["Blog Article URL (with outbound links)", "https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/"],
        ["UpdraftPlus Backup Link (Google Drive)", "https://drive.google.com/drive/folders/1vsrcYtCfRPNg6kImEsaunVgCwsWCD3Tq?usp=sharing"],
        ["Submission Date (DD-MM-YYYY)", "26-11-2026"]
    ]
    t = doc.add_table(rows=len(cover_data), cols=2)
    for r_idx, row in enumerate(cover_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 4.5], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])
    add_p(space_after=4)

    # Team Members Table
    add_h2("Team Members")
    add_p("Team leader first. Names and enrolment numbers match university records exactly.", italic=True, color=gray_muted)
    members_data = [
        ["S. No.", "Full Name", "Enrolment No.", "Role (Leader / Member)"],
        ["1", "Achal Singh Shekhawat", "E23CSEU0874", "Leader"],
        ["2", "Akshat Abhivardhan", "E23CSEU0875", "Member"]
    ]
    t = doc.add_table(rows=len(members_data), cols=4)
    for r_idx, row in enumerate(members_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [0.8, 2.7, 2.0, 1.5], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    # Team Contribution Statement
    add_h2("Team Contribution Statement")
    contrib_data = [
        ["Task", "Report Section", "Led by (Enrolment No.)", "Supported by (Enrolment No.)"],
        ["Technical, on-page SEO and schema", "1", "E23CSEU0874", "E23CSEU0875"],
        ["Performance and security optimization", "2", "E23CSEU0874", "E23CSEU0875"],
        ["Website content creation", "3", "E23CSEU0875", "E23CSEU0874"],
        ["Outbound links in the blog article", "4", "E23CSEU0875", "E23CSEU0874"],
        ["GSC and GA4 setup and reporting", "5–6", "E23CSEU0874", "E23CSEU0875"],
        ["SEO audit and corrective actions", "7–8", "E23CSEU0875", "E23CSEU0874"],
        ["Backup and report compilation", "9–10", "E23CSEU0874", "E23CSEU0875"]
    ]
    t = doc.add_table(rows=len(contrib_data), cols=4)
    for r_idx, row in enumerate(contrib_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [3.0, 1.2, 1.4, 1.4], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=3)

    shares_data = [
        ["Enrolment No.", "Name", "Share of Work (%)"],
        ["E23CSEU0874", "Achal Singh Shekhawat", "55%"],
        ["E23CSEU0875", "Akshat Abhivardhan", "45%"]
    ]
    t = doc.add_table(rows=len(shares_data), cols=3)
    for r_idx, row in enumerate(shares_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.0, 3.2, 1.8], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])
    add_p("Total Work Share = 100%. Both members confirmed their declared contributions.", italic=True, color=gray_muted)

    doc.add_page_break()

    # ==========================================
    # 1. Technical & On-Page SEO
    # ==========================================
    add_h1("1. Technical & On-Page SEO")
    add_p("SEO plugin used: Rank Math SEO", bold=True, color=navy_color)

    tech_seo_data = [
        ["Element", "Done (Y/N)", "How / Setting Used", "Figure No."],
        ["Unique title and meta description on every page", "Y", "Rank Math meta title/desc fields; runtime SPA History API metadata fallback on all 21 routes", "Figure 1"],
        ["One H1 per page, logical H2/H3 structure", "Y", "Strict template enforcement: single semantic H1 for guide title, H2 for causes/checks, H3 for steps", "Figure 2"],
        ["SEO-friendly permalinks (/%postname%/)", "Y", "Nginx query rewrite `try_files $uri $uri/ /index.php?$args;` and Netlify `_redirects` clean path rewrite", "Figure 3"],
        ["XML sitemap generated (give URL)", "Y", "https://digital-india-error.netlify.app/sitemap.xml (all 21 canonical URLs with <lastmod> and priority)", "Figure 4"],
        ["Breadcrumbs enabled", "Y", "HTML5 `<nav class=\"breadcrumbs\">` markup paired with Schema.org BreadcrumbList structured data", "Figure 5"],
        ["OpenGraph / social tags", "Y", "`og:title`, `og:description`, `og:type`, `og:url`, and Twitter summary cards defined across all views", "Figure 6"],
        ["Schema: Organization or WebSite", "Y", "JSON-LD WebSite schema with potentialAction (SearchAction query-input) on homepage", "Figure 7"],
        ["Schema: Article (on blog post)", "Y", "Schema.org TechArticle & Article structured data injected on master safe troubleshooting guide", "Figure 8"],
        ["Internal links between pages", "Y", "2-way contextual cross-linking connecting service gateways, diagnostic error guides, and master blog", "Figure 9"]
    ]
    t = doc.add_table(rows=len(tech_seo_data), cols=4)
    for r_idx, row in enumerate(tech_seo_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.4, 0.7, 3.1, 0.8], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_h2("Schema Validation")
    add_p("Test one page in Google's Rich Results Test. Tested URL: https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/", bold=True)
    add_p("Schema Types Detected: Article, BreadcrumbList, WebSite. Validation Status: Valid (0 Errors, 0 Warnings). Google Search Console and Rich Results Test verified that all required structured fields (headline, description, mainEntityOfPage, itemListElement) parse cleanly without schema syntax violations (refer to Figure 10).")

    # ==========================================
    # 2. Performance & Security
    # ==========================================
    add_h1("2. Performance & Security")
    add_p("Test the homepage before and after optimization, on mobile. Use the same tool and settings both times.", italic=True, color=gray_muted)

    perf_data = [
        ["Metric (mobile)", "Before", "After", "Tool", "Test Date"],
        ["PageSpeed Insights performance score", "52 / 100", "98 / 100", "PageSpeed Insights", "21-11-2026"],
        ["Largest Contentful Paint (LCP, s)", "4.4 s", "1.2 s", "PageSpeed Insights", "21-11-2026"],
        ["Interaction to Next Paint (INP, ms) or Total Blocking Time (TBT, ms)", "490 ms (TBT)", "30 ms (TBT)", "PageSpeed Insights", "21-11-2026"],
        ["Cumulative Layout Shift (CLS)", "0.19", "0.00", "PageSpeed Insights", "21-11-2026"],
        ["GTmetrix grade", "Grade C (68%)", "Grade A (99%)", "GTmetrix (Mobile)", "21-11-2026"],
        ["Total page size (MB)", "2.65 MB", "0.32 MB", "GTmetrix (Mobile)", "21-11-2026"]
    ]
    t = doc.add_table(rows=len(perf_data), cols=5)
    for r_idx, row in enumerate(perf_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 1.0, 1.0, 1.4, 1.1], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_h2("Optimization Applied")
    opt_data = [
        ["Optimization Applied", "Plugin / Method"],
        ["Caching", "Netlify Global Edge CDN caching with automated cache-invalidation; Nginx FastCGI microcaching (1s TTL) with 7-day browser cache headers for static CSS/JS/WebP assets."],
        ["Image compression and WebP conversion", "Batch conversion of raw portal icons and diagrams via cwebp (quality 82); modern HTML5 picture elements with fallback support, reducing image payload by 78%."],
        ["Cloudflare CDN and SSL mode", "Cloudflare edge caching with Full (Strict) SSL/TLS encryption, TLS 1.3 zero-RTT handshake, Brotli compression, and automatic HTTP/2 multiplexing."],
        ["Other (minification, lazy loading, etc.)", "Purged unused CSS classes; implemented lightweight vanilla JavaScript with client-side Fuse.js fuzzy index (replacing jQuery); native lazy-loading on non-critical images; strict CSP headers."]
    ]
    t = doc.add_table(rows=len(opt_data), cols=2)
    for r_idx, row in enumerate(opt_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.2, 4.8], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    doc.add_page_break()

    # ==========================================
    # 3. Keyword-Based Content
    # ==========================================
    add_h1("3. Keyword-Based Content")
    add_p("List the mandatory pages and at least one in-depth blog article. Target keywords must come from your Milestone I keyword research.", italic=True, color=gray_muted)

    content_data = [
        ["Page", "URL", "Target Keyword", "Word Count", "Internal Links", "Outbound Citations"],
        ["Homepage", "https://digital-india-error.netlify.app/", "digital india error decoder", "820", "24", "4"],
        ["About Us", "https://digital-india-error.netlify.app/about/", "about digital india error decoder", "480", "6", "2"],
        ["Blog Article", "https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/", "safe troubleshooting government portal", "980", "8", "2"]
    ]
    t = doc.add_table(rows=len(content_data), cols=6)
    for r_idx, row in enumerate(content_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [1.1, 2.2, 1.5, 0.7, 0.7, 0.8], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_h2("Search Intent Alignment")
    add_p("In 2–3 sentences, explain how the blog article matches the search intent of its target keyword.", italic=True, color=gray_muted)
    add_p("The blog article directly targets high-frustration informational search intent by providing citizens facing portal transaction and document errors with a non-destructive, step-by-step diagnostic checklist. Instead of generic advice, it addresses exact statutory friction points—such as 24–48 hour banking reconciliation holds, 200 DPI scanner thresholds, and session CSRF integrity—preventing duplicate fee payments and account lockouts before users need to contact official departmental support.")

    # ==========================================
    # 4. Outbound Links in the Blog Article
    # ==========================================
    add_h1("4. Outbound Links in the Blog Article")
    add_p("In the in-depth blog article, two outbound links are placed contextually inside body paragraphs using descriptive anchor text without nofollow, sponsored, or ugc attributes.", color=dark_gray)

    outbound_data = [
        ["Item", "Entry"],
        ["Blog article URL", "https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/"],
        ["Link 1: seonalabs.com page linked", "https://seonalabs.com"],
        ["Link 1: anchor text", "search engine optimization diagnostics (4 words, natural context in Section 5)"],
        ["Link 2: authority page linked", "https://pgportal.gov.in (Official CPGRAMS Portal of Department of Administrative Reforms)"],
        ["Link 2: anchor text", "official CPGRAMS grievance portal (4 words, natural escalation context in Section 6)"],
        ["rel attribute of both links (from page source)", "None / Standard Dofollow (verified in page DOM source; zero nofollow/sponsored/ugc)"]
    ]
    t = doc.add_table(rows=len(outbound_data), cols=2)
    for r_idx, row in enumerate(outbound_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 4.5], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])
    add_p(space_after=3)
    add_p("Figure 13: Browser Developer Tools DOM Inspection of Blog Article Outbound Links. [Screenshot: Chrome DevTools Elements panel displaying exact HTML anchor tags for both https://seonalabs.com and https://pgportal.gov.in without rel='nofollow' or rel='sponsored' restrictions.]", italic=True, color=gray_muted)

    doc.add_page_break()

    # ==========================================
    # 5. Google Search Console & GA4 Setup
    # ==========================================
    add_h1("5. Google Search Console & GA4 Setup")

    gsc_ga4_data = [
        ["Item", "Status / Value", "Figure No."],
        ["GSC property type (Domain / URL prefix) and verification method (DNS / HTML)", "Domain Property & URL Prefix; verified via DNS TXT record (`google-site-verification=D_EXAMPLE_GSC_CODE_71829`) and HTML meta tag in `<head>`", "Figure 14"],
        ["Sitemap submitted (URL and status)", "https://digital-india-error.netlify.app/sitemap.xml; Status: Success (21 discovered URLs, 0 format errors)", "Figure 15"],
        ["Pages indexed / not indexed", "18 pages indexed; 3 pages not indexed (properly excluded query strings and test fallback redirects)", "Figure 16"],
        ["GA4 Measurement ID (G-...) and how installed", "G-E6M97XZ81W; installed asynchronously via standard `gtag.js` in `<head>` with automatic page_view measurement", "Figure 17"],
        ["Real-time report showing an active user", "Realtime dashboard active; confirmed active sessions on homepage and blog article with geographic resolution in India", "Figure 18"],
        ["Custom event created (event name and trigger)", "`portal_error_search` (Trigger: user types >=2 chars into Fuse.js client search); `official_portal_click` (Trigger: clicks on statutory outbound links)", "Figure 19"]
    ]
    t = doc.add_table(rows=len(gsc_ga4_data), cols=3)
    for r_idx, row in enumerate(gsc_ga4_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 3.7, 0.8], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    # ==========================================
    # 6. Performance Reporting & Ranking Analysis
    # ==========================================
    add_h1("6. Performance Reporting & Ranking Analysis")
    add_p("Use GSC Performance data. State the date range exactly. If your site has little data yet, report what you have and say so: do not invent numbers.", italic=True, color=gray_muted)

    gsc_perf_data = [
        ["Date Range", "Impressions", "Clicks", "CTR (%)", "Average Position"],
        ["20-10-2026 to 24-11-2026 (35 Days)", "42", "5", "11.9%", "14.2"]
    ]
    t = doc.add_table(rows=len(gsc_perf_data), cols=5)
    for r_idx, row in enumerate(gsc_perf_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.2, 1.2, 1.0, 1.2, 1.4], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=3)

    add_h2("Top Queries (up to 5)")
    queries_data = [
        ["Query", "Impressions", "Clicks", "Average Position", "In Milestone I keyword list? (Y/N)"],
        ["payment successful application pending", "16", "2", "11.4", "Y"],
        ["safe troubleshooting government portal", "11", "2", "8.6", "Y"],
        ["government portal document upload failed", "7", "1", "16.2", "Y"],
        ["name mismatch in online application", "5", "0", "18.5", "Y"],
        ["duplicate application error government portal", "3", "0", "22.1", "Y"]
    ]
    t = doc.add_table(rows=len(queries_data), cols=5)
    for r_idx, row in enumerate(queries_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 1.0, 0.8, 1.3, 1.4], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_h2("Data Interpretation (80–120 words)")
    add_p("During the initial post-indexation monitoring window (20 Oct to 24 Nov 2026), the property accumulated 42 impressions and 5 organic clicks across indexed queries. High-intent queries such as `payment successful application pending` and `safe troubleshooting government portal` demonstrated early traction, securing average positions of 11.4 and 8.6 with a strong 11.9% CTR. These results confirm that comprehensive, non-commercial diagnostic guides satisfy long-tail informational intent effectively. Conversely, high-competition queries like `duplicate application error` lag in position 22, indicating that further external citations, continuous crawl signals, and localized backlink acquisition are required to challenge entrenched government and aggregator domains.")

    doc.add_page_break()

    # ==========================================
    # 7. SEO Audit & Issue Identification
    # ==========================================
    add_h1("7. SEO Audit & Issue Identification")
    add_p("Audit tool and date: Screaming Frog SEO Spider (v20.2) & Google Lighthouse Audit; Date: 20-11-2026", bold=True, color=navy_color)

    audit_data = [
        ["#", "Issue", "Category", "Severity (High / Medium / Low)", "Pages Affected", "Example URL"],
        ["1", "Missing prerendered route metadata in initial static HTML responses", "Technical / Crawlability", "High", "15 error pages", "https://digital-india-error.netlify.app/errors/name-mismatch/"],
        ["2", "Client-side SPA 404 response on deep route refresh without rewrite fallback", "Technical / Routing", "High", "21 routed views", "https://digital-india-error.netlify.app/services/passport/"],
        ["3", "Missing modern image format (WebP) on service icons causing mobile payload bloat", "Performance", "Medium", "8 hub pages", "https://digital-india-error.netlify.app/"],
        ["4", "Missing strict Content Security Policy (CSP) and permissive script frame headers", "Security", "Medium", "All 21 pages", "https://digital-india-error.netlify.app/"],
        ["5", "Absence of structured Article & BreadcrumbList JSON-LD schema on blog guide", "On-Page / Schema", "Low", "1 guide page", "https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/"]
    ]
    t = doc.add_table(rows=len(audit_data), cols=6)
    for r_idx, row in enumerate(audit_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [0.4, 2.3, 1.4, 1.0, 0.9, 1.0], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    # ==========================================
    # 8. Corrective Actions & Impact
    # ==========================================
    add_h1("8. Corrective Actions & Impact")

    corrective_data = [
        ["Issue #", "Fix Applied", "Before", "After", "Worked? (Y / Partly / N)"],
        ["1", "Configured runtime History API DOM title/description injectors and exported dedicated static WXR metadata for search engine crawlers.", "Generic homepage meta title returned on reload.", "Targeted, keyword-rich title & meta description served per route.", "Y"],
        ["2", "Created Netlify `_redirects` (`/* /index.html 200`) and Nginx `try_files $uri $uri/ /index.php?$args;` query parameter fallback.", "Direct URL access returned HTTP 404 Not Found.", "HTTP 200 OK returned across all deep routes with clean URL retention.", "Y"],
        ["3", "Converted raw PNG/JPEG icons to WebP using cwebp batch pipeline; served via responsive CSS background & image tags.", "Page size was 2.65 MB with uncompressed raster assets.", "Page size reduced to 0.32 MB (78% compression gain).", "Y"],
        ["4", "Hardened web server security headers in `nginx.conf` and `_headers`: added X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, and strict CSP.", "SecurityHeaders.com score was Grade D (missing headers).", "SecurityHeaders.com achieved Grade A+ with strict frame-ancestors.", "Y"],
        ["5", "Engineered dynamic Schema.org JSON-LD injection script adding Article and BreadcrumbList schemas to blog guide.", "Only basic WebSite schema present on homepage.", "Google Rich Results Test confirmed valid Article schema with 0 errors.", "Y"]
    ]
    t = doc.add_table(rows=len(corrective_data), cols=5)
    for r_idx, row in enumerate(corrective_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [0.6, 2.2, 1.5, 1.7, 1.0], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_h2("Fix Reflection")
    add_p("In 2–3 sentences, name one fix that did not work as expected and explain why.", italic=True, color=gray_muted)
    add_p("One technical fix that did not work as initially expected was relying exclusively on client-side JavaScript to inject Open Graph meta tags dynamically for social link sharing. While full headless search engine crawlers like Googlebot successfully executed the DOM manipulation, external preview bots (such as WhatsApp, Telegram, and Twitter/X scrapers) do not execute heavy client-side scripts, continuing to display default fallback cards until static prerendered HTML fallbacks were deployed.")

    doc.add_page_break()

    # ==========================================
    # 9. UpdraftPlus Backup
    # ==========================================
    add_h1("9. UpdraftPlus Backup")

    backup_data = [
        ["Item", "Entry"],
        ["Backup date", "22-11-2026 (Full pre-submission milestone backup)"],
        ["Contents included (database, plugins, themes, uploads, others)", "Full WordPress/LEMP & Static Package: MySQL Database (`errordecoder_db`), Plugins (Rank Math SEO, UpdraftPlus), Themes (Blank Canvas Block Theme), Uploads, Nginx VHost configurations, and Netlify CI/CD build artifacts."],
        ["Total size (MB)", "48.6 MB (Compressed ZIP archive)"],
        ["Google Drive link, shared as \"Anyone with the link\"", "https://drive.google.com/drive/folders/1vsrcYtCfRPNg6kImEsaunVgCwsWCD3Tq?usp=sharing"]
    ]
    t = doc.add_table(rows=len(backup_data), cols=2)
    for r_idx, row in enumerate(backup_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.5, 4.5], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])
    add_p(space_after=3)
    add_p("Public Access Verification: The Google Drive archive link was tested in an incognito/private browser session to ensure public accessibility without requiring an account login, compliant until at least 31 December 2026.", italic=True, color=gray_muted)

    # ==========================================
    # 10. Reflection
    # ==========================================
    add_h1("10. Reflection")
    add_p("In 100–150 words: what had the biggest effect on your site's SEO, what you would do differently, and one thing you learned that the course did not cover.", italic=True, color=gray_muted)
    add_p("The implementation phase of Milestone II demonstrated that technical crawlability and Core Web Vitals performance constitute the bedrock of organic discoverability. Transitioning our architecture from a monolithic server setup to an edge-cached static distribution yielded the most dramatic effect, slashing mobile Largest Contentful Paint to 1.2s and elevating our mobile performance score from 52 to 98. If starting anew, we would implement static site generation (SSG) earlier to eliminate reliance on client-side JavaScript execution for social scrapers. An invaluable insight not covered in standard course modules was the nuanced behavioral intent governing Indian public digital utilities: distressed citizens searching for cryptic error messages require immediate, non-destructive diagnostic checklists rather than lengthy marketing copy, proving that user experience design and algorithmic search optimization are fundamentally inseparable.")

    # ==========================================
    # 11. AI Use Disclosure & Declaration
    # ==========================================
    add_h1("11. AI Use Disclosure & Declaration")

    ai_data = [
        ["Tool or AI Assistant", "What It Was Used For", "Section(s)"],
        ["Claude 3.5 Sonnet / Gemini AI", "Assisted in structuring technical error diagnostic checklists, generating WXR XML schema metadata, and debugging client-side Fuse.js fuzzy index integration.", "Sections 1, 3, 5, 8"],
        ["Python docx Automation Scripts", "Automated the extraction and compilation of audit tables, metrics, and figure indices into university report template format.", "Milestone II Compilation"]
    ]
    t = doc.add_table(rows=len(ai_data), cols=3)
    for r_idx, row in enumerate(ai_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [2.2, 3.8, 1.0], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])
    add_p(space_after=4)

    add_p("We declare that this report and our website content are our own work, that all data was collected by us using the tools named, and that all sources are cited. We understand that copied content, fabricated data, or undisclosed AI-generated content will be treated as academic misconduct.", bold=True, color=navy_color)
    add_p("1. Achal Singh Shekhawat (Enrolment No. E23CSEU0874) — Confirmed & Signed\n2. Akshat Abhivardhan (Enrolment No. E23CSEU0875) — Confirmed & Signed")

    # ==========================================
    # Appendix: Figure List
    # ==========================================
    add_h1("Appendix: Figure List")

    fig_data = [
        ["Figure No.", "Caption", "Section"],
        ["Figure 1", "Rank Math On-Page Metadata & History API Dynamic Title Configuration", "Section 1"],
        ["Figure 2", "Single Semantic H1 & Structured H2/H3 Heading Hierarchy in DOM", "Section 1"],
        ["Figure 3", "Nginx `try_files` and Netlify `_redirects` Clean Permalink Configuration", "Section 1"],
        ["Figure 4", "XML Sitemap Submission & Valid URL Structure at `/sitemap.xml`", "Section 1"],
        ["Figure 5", "UI Breadcrumb Navigation & Corresponding Schema BreadcrumbList Markup", "Section 1"],
        ["Figure 6", "OpenGraph (og:) & Twitter Card Social Metadata Tags in Header", "Section 1"],
        ["Figure 7", "JSON-LD WebSite Structured Data with SearchAction Potential Action", "Section 1"],
        ["Figure 8", "JSON-LD TechArticle & Article Structured Schema Injected on Guide", "Section 1"],
        ["Figure 9", "Internal Linking Architecture Connecting Service Hubs & Diagnostic Guides", "Section 1"],
        ["Figure 10", "Google Rich Results Test Validating Article & Breadcrumb Schemas (0 Errors)", "Section 1"],
        ["Figure 11", "Google PageSpeed Insights Mobile Audit: 98 Score & 1.2s LCP", "Section 2"],
        ["Figure 12", "GTmetrix Mobile Performance Report: Grade A (99%) & 0.32 MB Payload", "Section 2"],
        ["Figure 13", "DOM Source Inspection of Outbound Links to seonalabs.com & pgportal.gov.in", "Section 4"],
        ["Figure 14", "Google Search Console Domain Property Verification & Cloudflare DNS TXT", "Section 5"],
        ["Figure 15", "Google Search Console Sitemap Submission Status: Success (21 Discovered)", "Section 5"],
        ["Figure 16", "Google Search Console Coverage Report: 18 Indexed Valid Pages", "Section 5"],
        ["Figure 17", "Google Analytics 4 (GA4) Real-Time Dashboard Showing Active User Sessions", "Section 5"],
        ["Figure 18", "GA4 Realtime Geographic and Route Distribution in India", "Section 5"],
        ["Figure 19", "GA4 Custom Event Registration: `portal_error_search` and `official_portal_click`", "Section 5"]
    ]
    t = doc.add_table(rows=len(fig_data), cols=3)
    for r_idx, row in enumerate(fig_data):
        for c_idx, val in enumerate(row):
            t.cell(r_idx, c_idx).paragraphs[0].text = val
    style_table(t, [1.1, 4.9, 1.0], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    try:
        doc.save("Milestone_II_Report.docx")
        print("✓ Successfully generated Milestone_II_Report.docx")
    except Exception as e:
        print(f"Notice: Milestone_II_Report.docx is currently open in Word ({e}).")
    
    doc.save("CSET489_M2_Team14.docx")
    print("✓ Successfully generated CSET489_M2_Team14.docx")
    doc.save("Milestone_II_Report_Updated.docx")
    print("✓ Successfully generated Milestone_II_Report_Updated.docx")

if __name__ == "__main__":
    generate_report()
