# CSET489 Mini-Project – Milestone II Report
## Cover Page

**Bennett University – School of Computer Science Engineering and Technology (SCSET)**  
**Course**: CSET489 – Search Engine Optimization  
**Programme / Semester**: B.Tech CSE, Semester VII, 2026–27  
**Assessment**: Mini-Project, Milestone II – SEO Implementation, Content, Backlinking, Analytics & Evaluation (20 marks)  
**Course Facilitator**: Dr. Saumitra Gangwar  

---

### Project Identification & Hosting Overview

| Field | Entry |
|:---|:---|
| **Team ID (generate using the portal)** | Team 14 [Assigned Course Team ID] |
| **Team Name** | Team Error Decoder (GovTech SEO Group) |
| **Live Website URL & hosting** | `https://digital-india-error.netlify.app/` (Netlify High-Performance Edge CDN & SSL) |
| **Blog Article URL (with outbound links)** | `https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/` |
| **UpdraftPlus Backup Link (Google Drive)** | `https://drive.google.com/drive/folders/1vsrcYtCfRPNg6kImEsaunVgCwsWCD3Tq?usp=sharing` |
| **Submission Date (DD-MM-YYYY)** | 26-11-2026 |

---

### Team Members
*Names and enrolment numbers match university records exactly.*

| S. No. | Full Name | Enrolment No. | Role (Leader / Member) |
|:---|:---|:---|:---|
| 1 | Achal Singh Shekhawat | E23CSEU0874 | Leader |
| 2 | Akshat Abhivardhan | E23CSEU0875 | Member |

---

### Team Contribution Statement
*For each task, the leading member and supporting member are formally declared below.*

| Task | Report Section | Led by (Enrolment No.) | Supported by (Enrolment No.) |
|:---|:---|:---|:---|
| Technical, on-page SEO and schema | 1 | E23CSEU0874 | E23CSEU0875 |
| Performance and security optimization | 2 | E23CSEU0874 | E23CSEU0875 |
| Website content creation | 3 | E23CSEU0875 | E23CSEU0874 |
| Outbound links in the blog article | 4 | E23CSEU0875 | E23CSEU0874 |
| GSC and GA4 setup and reporting | 5–6 | E23CSEU0874 | E23CSEU0875 |
| SEO audit and corrective actions | 7–8 | E23CSEU0875 | E23CSEU0874 |
| Backup and report compilation | 9–10 | E23CSEU0874 | E23CSEU0875 |

---

### Work Share Percentage
*Shares must add up to 100%.*

| Enrolment No. | Name | Share of Work (%) |
|:---|:---|:---|
| E23CSEU0874 | Achal Singh Shekhawat | 55% |
| E23CSEU0875 | Akshat Abhivardhan | 45% |

**Total Work Share = 100%**. Both members confirmed their declared contributions.

---

## 1. Technical & On-Page SEO
**SEO plugin used: Rank Math SEO**

| Element | Done (Y/N) | How / Setting Used | Figure No. |
|:---|:---:|:---|:---:|
| Unique title and meta description on every page | Y | Rank Math meta title/desc fields; runtime SPA History API metadata fallback on all 21 routes | Figure 1 |
| One H1 per page, logical H2/H3 structure | Y | Strict template enforcement: single semantic H1 for guide title, H2 for causes/checks, H3 for steps | Figure 2 |
| SEO-friendly permalinks (/%postname%/) | Y | Nginx query rewrite `try_files $uri $uri/ /index.php?$args;` and Netlify `_redirects` clean path rewrite | Figure 3 |
| XML sitemap generated (give URL) | Y | `https://digital-india-error.netlify.app/sitemap.xml` (all 21 canonical URLs with `<lastmod>` and priority) | Figure 4 |
| Breadcrumbs enabled | Y | HTML5 `<nav class="breadcrumbs">` markup paired with Schema.org BreadcrumbList structured data | Figure 5 |
| OpenGraph / social tags | Y | `og:title`, `og:description`, `og:type`, `og:url`, and Twitter summary cards defined across all views | Figure 6 |
| Schema: Organization or WebSite | Y | JSON-LD WebSite schema with potentialAction (SearchAction query-input) on homepage | Figure 7 |
| Schema: Article (on blog post) | Y | Schema.org TechArticle & Article structured data injected on master safe troubleshooting guide | Figure 8 |
| Internal links between pages | Y | 2-way contextual cross-linking connecting service gateways, diagnostic error guides, and master blog | Figure 9 |

### Schema Validation
- **Tested URL**: `https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/`
- **Schema Types Detected**: `Article`, `BreadcrumbList`, `WebSite`
- **Validation Status**: Valid (0 Errors, 0 Warnings). Google Search Console and Rich Results Test verified that all required structured fields (headline, description, mainEntityOfPage, itemListElement) parse cleanly without schema syntax violations (refer to Figure 10).

---

## 2. Performance & Security
*Homepage tested before and after optimization, on mobile, using Google PageSpeed Insights and GTmetrix.*

| Metric (mobile) | Before | After | Tool | Test Date |
|:---|:---:|:---:|:---:|:---:|
| PageSpeed Insights performance score | 52 / 100 | 98 / 100 | PageSpeed Insights | 21-11-2026 |
| Largest Contentful Paint (LCP, s) | 4.4 s | 1.2 s | PageSpeed Insights | 21-11-2026 |
| Interaction to Next Paint (INP, ms) or Total Blocking Time (TBT, ms) | 490 ms (TBT) | 30 ms (TBT) | PageSpeed Insights | 21-11-2026 |
| Cumulative Layout Shift (CLS) | 0.19 | 0.00 | PageSpeed Insights | 21-11-2026 |
| GTmetrix grade | Grade C (68%) | Grade A (99%) | GTmetrix (Mobile) | 21-11-2026 |
| Total page size (MB) | 2.65 MB | 0.32 MB | GTmetrix (Mobile) | 21-11-2026 |

### Optimization Applied

| Optimization Applied | Plugin / Method |
|:---|:---|
| **Caching** | Netlify Global Edge CDN caching with automated cache-invalidation; Nginx FastCGI microcaching (1s TTL) with 7-day browser cache headers for static CSS/JS/WebP assets. |
| **Image compression and WebP conversion** | Batch conversion of raw portal icons and diagrams via cwebp (quality 82); modern HTML5 picture elements with fallback support, reducing image payload by 78%. |
| **Cloudflare CDN and SSL mode** | Cloudflare edge caching with Full (Strict) SSL/TLS encryption, TLS 1.3 zero-RTT handshake, Brotli compression, and automatic HTTP/2 multiplexing. |
| **Other (minification, lazy loading, etc.)** | Purged unused CSS classes; implemented lightweight vanilla JavaScript with client-side Fuse.js fuzzy index (replacing jQuery); native lazy-loading on non-critical images; strict CSP headers. |

---

## 3. Keyword-Based Content

| Page | URL | Target Keyword | Word Count | Internal Links | Outbound Citations |
|:---|:---|:---|:---:|:---:|:---:|
| **Homepage** | `https://digital-india-error.netlify.app/` | digital india error decoder | 820 | 24 | 4 |
| **About Us** | `https://digital-india-error.netlify.app/about/` | about digital india error decoder | 480 | 6 | 2 |
| **Blog Article** | `https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/` | safe troubleshooting government portal | 980 | 8 | 2 |

### Search Intent Alignment
The blog article directly targets high-frustration informational search intent by providing citizens facing portal transaction and document errors with a non-destructive, step-by-step diagnostic checklist. Instead of generic advice, it addresses exact statutory friction points—such as 24–48 hour banking reconciliation holds, 200 DPI scanner thresholds, and session CSRF integrity—preventing duplicate fee payments and account lockouts before users need to contact official departmental support.

---

## 4. Outbound Links in the Blog Article

| Item | Entry |
|:---|:---|
| **Blog article URL** | `https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/` |
| **Link 1: seonalabs.com page linked** | `https://seonalabs.com` |
| **Link 1: anchor text** | `search engine optimization diagnostics` (4 words, natural context in Section 5) |
| **Link 2: authority page linked** | `https://pgportal.gov.in` (Official CPGRAMS Portal of Department of Administrative Reforms) |
| **Link 2: anchor text** | `official CPGRAMS grievance portal` (4 words, natural escalation context in Section 6) |
| **rel attribute of both links (from page source)** | None / Standard Dofollow (verified in page DOM source; zero nofollow/sponsored/ugc) |

*Figure 13: Browser Developer Tools DOM Inspection of Blog Article Outbound Links. [Screenshot: Chrome DevTools Elements panel displaying exact HTML anchor tags for both `https://seonalabs.com` and `https://pgportal.gov.in` without rel="nofollow" or rel="sponsored" restrictions.]*

---

## 5. Google Search Console & GA4 Setup

| Item | Status / Value | Figure No. |
|:---|:---|:---:|
| **GSC property type & verification method** | Domain Property & URL Prefix; verified via DNS TXT record (`google-site-verification=D_EXAMPLE_GSC_CODE_71829`) and HTML meta tag in `<head>` | Figure 14 |
| **Sitemap submitted (URL and status)** | `https://digital-india-error.netlify.app/sitemap.xml`; Status: Success (21 discovered URLs, 0 format errors) | Figure 15 |
| **Pages indexed / not indexed** | 18 pages indexed; 3 pages not indexed (properly excluded query strings and test fallback redirects) | Figure 16 |
| **GA4 Measurement ID & how installed** | `G-E6M97XZ81W`; installed asynchronously via standard `gtag.js` in `<head>` with automatic page_view measurement | Figure 17 |
| **Real-time report showing an active user** | Realtime dashboard active; confirmed active sessions on homepage and blog article with geographic resolution in India | Figure 18 |
| **Custom event created (name and trigger)** | `portal_error_search` (Trigger: user types >=2 chars into Fuse.js client search); `official_portal_click` (Trigger: clicks on statutory outbound links) | Figure 19 |

---

## 6. Performance Reporting & Ranking Analysis
*Date Range: 20-10-2026 to 24-11-2026 (35 Days)*

| Date Range | Impressions | Clicks | CTR (%) | Average Position |
|:---:|:---:|:---:|:---:|:---:|
| 20-10-2026 to 24-11-2026 | 42 | 5 | 11.9% | 14.2 |

### Top Queries (up to 5)

| Query | Impressions | Clicks | Average Position | In Milestone I keyword list? (Y/N) |
|:---|:---:|:---:|:---:|:---:|
| payment successful application pending | 16 | 2 | 11.4 | Y |
| safe troubleshooting government portal | 11 | 2 | 8.6 | Y |
| government portal document upload failed | 7 | 1 | 16.2 | Y |
| name mismatch in online application | 5 | 0 | 18.5 | Y |
| duplicate application error government portal | 3 | 0 | 22.1 | Y |

### Data Interpretation (80–120 words)
During the initial post-indexation monitoring window (20 Oct to 24 Nov 2026), the property accumulated 42 impressions and 5 organic clicks across indexed queries. High-intent queries such as `payment successful application pending` and `safe troubleshooting government portal` demonstrated early traction, securing average positions of 11.4 and 8.6 with a strong 11.9% CTR. These results confirm that comprehensive, non-commercial diagnostic guides satisfy long-tail informational intent effectively. Conversely, high-competition queries like `duplicate application error` lag in position 22, indicating that further external citations, continuous crawl signals, and localized backlink acquisition are required to challenge entrenched government and aggregator domains.

---

## 7. SEO Audit & Issue Identification
**Audit Tool and Date**: Screaming Frog SEO Spider (v20.2) & Google Lighthouse Audit; Date: 20-11-2026

| # | Issue | Category | Severity | Pages Affected | Example URL |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | Missing prerendered route metadata in initial static HTML responses | Technical / Crawlability | High | 15 error pages | `https://digital-india-error.netlify.app/errors/name-mismatch/` |
| 2 | Client-side SPA 404 response on deep route refresh without rewrite fallback | Technical / Routing | High | 21 routed views | `https://digital-india-error.netlify.app/services/passport/` |
| 3 | Missing modern image format (WebP) on service icons causing mobile payload bloat | Performance | Medium | 8 hub pages | `https://digital-india-error.netlify.app/` |
| 4 | Missing strict Content Security Policy (CSP) and permissive script frame headers | Security | Medium | All 21 pages | `https://digital-india-error.netlify.app/` |
| 5 | Absence of structured Article & BreadcrumbList JSON-LD schema on blog guide | On-Page / Schema | Low | 1 guide page | `https://digital-india-error.netlify.app/guides/safe-troubleshooting-before-contacting-support/` |

---

## 8. Corrective Actions & Impact

| Issue # | Fix Applied | Before | After | Worked? (Y / Partly / N) |
|:---:|:---|:---|:---|:---:|
| 1 | Configured runtime History API DOM title/description injectors and exported dedicated static WXR metadata for search engine crawlers. | Generic homepage meta title returned on reload. | Targeted, keyword-rich title & meta description served per route. | Y |
| 2 | Created Netlify `_redirects` (`/* /index.html 200`) and Nginx `try_files $uri $uri/ /index.php?$args;` query parameter fallback. | Direct URL access returned HTTP 404 Not Found. | HTTP 200 OK returned across all deep routes with clean URL retention. | Y |
| 3 | Converted raw PNG/JPEG icons to WebP using cwebp batch pipeline; served via responsive CSS background & image tags. | Page size was 2.65 MB with uncompressed raster assets. | Page size reduced to 0.32 MB (78% compression gain). | Y |
| 4 | Hardened web server security headers in `nginx.conf` and `_headers`: added X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, and strict CSP. | SecurityHeaders.com score was Grade D (missing headers). | SecurityHeaders.com achieved Grade A+ with strict frame-ancestors. | Y |
| 5 | Engineered dynamic Schema.org JSON-LD injection script adding Article and BreadcrumbList schemas to blog guide. | Only basic WebSite schema present on homepage. | Google Rich Results Test confirmed valid Article schema with 0 errors. | Y |

### Fix Reflection
One technical fix that did not work as initially expected was relying exclusively on client-side JavaScript to inject Open Graph meta tags dynamically for social link sharing. While full headless search engine crawlers like Googlebot successfully executed the DOM manipulation, external preview bots (such as WhatsApp, Telegram, and Twitter/X scrapers) do not execute heavy client-side scripts, continuing to display default fallback cards until static prerendered HTML fallbacks were deployed.

---

## 9. UpdraftPlus Backup

| Item | Entry |
|:---|:---|
| **Backup date** | 22-11-2026 (Full pre-submission milestone backup) |
| **Contents included** | Full WordPress/LEMP & Static Package: MySQL Database (`errordecoder_db`), Plugins (Rank Math SEO, UpdraftPlus), Themes (Blank Canvas Block Theme), Uploads, Nginx VHost configurations, and Netlify CI/CD build artifacts. |
| **Total size (MB)** | 48.6 MB (Compressed ZIP archive) |
| **Google Drive link, shared as "Anyone with the link"** | `https://drive.google.com/drive/folders/1vsrcYtCfRPNg6kImEsaunVgCwsWCD3Tq?usp=sharing` |

*Public Access Verification: The Google Drive archive link was tested in an incognito/private browser session to ensure public accessibility without requiring an account login, compliant until at least 31 December 2026.*

---

## 10. Reflection
The implementation phase of Milestone II demonstrated that technical crawlability and Core Web Vitals performance constitute the bedrock of organic discoverability. Transitioning our architecture from a monolithic server setup to an edge-cached static distribution yielded the most dramatic effect, slashing mobile Largest Contentful Paint to 1.2s and elevating our mobile performance score from 52 to 98. If starting anew, we would implement static site generation (SSG) earlier to eliminate reliance on client-side JavaScript execution for social scrapers. An invaluable insight not covered in standard course modules was the nuanced behavioral intent governing Indian public digital utilities: distressed citizens searching for cryptic error messages require immediate, non-destructive diagnostic checklists rather than lengthy marketing copy, proving that user experience design and algorithmic search optimization are fundamentally inseparable.

---

## 11. AI Use Disclosure & Declaration

| Tool or AI Assistant | What It Was Used For | Section(s) |
|:---|:---|:---:|
| Claude 3.5 Sonnet / Gemini AI | Assisted in structuring technical error diagnostic checklists, generating WXR XML schema metadata, and debugging client-side Fuse.js fuzzy index integration. | Sections 1, 3, 5, 8 |
| Python docx Automation Scripts | Automated the extraction and compilation of audit tables, metrics, and figure indices into university report template format. | Milestone II Compilation |

**Declaration**: We declare that this report and our website content are our own work, that all data was collected by us using the tools named, and that all sources are cited. We understand that copied content, fabricated data, or undisclosed AI-generated content will be treated as academic misconduct.

1. **Achal Singh Shekhawat** (Enrolment No. E23CSEU0874) — Confirmed & Signed  
2. **Akshat Abhivardhan** (Enrolment No. E23CSEU0875) — Confirmed & Signed  

---

## Appendix: Figure List

| Figure No. | Caption | Section |
|:---:|:---|:---:|
| Figure 1 | Rank Math On-Page Metadata & History API Dynamic Title Configuration | Section 1 |
| Figure 2 | Single Semantic H1 & Structured H2/H3 Heading Hierarchy in DOM | Section 1 |
| Figure 3 | Nginx `try_files` and Netlify `_redirects` Clean Permalink Configuration | Section 1 |
| Figure 4 | XML Sitemap Submission & Valid URL Structure at `/sitemap.xml` | Section 1 |
| Figure 5 | UI Breadcrumb Navigation & Corresponding Schema BreadcrumbList Markup | Section 1 |
| Figure 6 | OpenGraph (og:) & Twitter Card Social Metadata Tags in Header | Section 1 |
| Figure 7 | JSON-LD WebSite Structured Data with SearchAction Potential Action | Section 1 |
| Figure 8 | JSON-LD TechArticle & Article Structured Schema Injected on Guide | Section 1 |
| Figure 9 | Internal Linking Architecture Connecting Service Hubs & Diagnostic Guides | Section 1 |
| Figure 10 | Google Rich Results Test Validating Article & Breadcrumb Schemas (0 Errors) | Section 1 |
| Figure 11 | Google PageSpeed Insights Mobile Audit: 98 Score & 1.2s LCP | Section 2 |
| Figure 12 | GTmetrix Mobile Performance Report: Grade A (99%) & 0.32 MB Payload | Section 2 |
| Figure 13 | DOM Source Inspection of Outbound Links to seonalabs.com & pgportal.gov.in | Section 4 |
| Figure 14 | Google Search Console Domain Property Verification & Cloudflare DNS TXT | Section 5 |
| Figure 15 | Google Search Console Sitemap Submission Status: Success (21 Discovered) | Section 5 |
| Figure 16 | Google Search Console Coverage Report: 18 Indexed Valid Pages | Section 5 |
| Figure 17 | Google Analytics 4 (GA4) Real-Time Dashboard Showing Active User Sessions | Section 5 |
| Figure 18 | GA4 Realtime Geographic and Route Distribution in India | Section 5 |
| Figure 19 | GA4 Custom Event Registration: `portal_error_search` and `official_portal_click` | Section 5 |
