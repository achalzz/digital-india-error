# SEO and Production Readiness Review

**Project**: Digital India Error Decoder  
**Review date**: 2026-10-07
**Scope**: Repository inspection and local browser checks only

This is not a live-domain SEO, performance, accessibility, SSL, or security certification. No crawl export, Lighthouse report, Search Console data, or live TLS evidence is included in this repository. Numeric scores and pass claims should be added only with dated evidence files.

---

## 1. Executive Summary of Audit Results

| Area | Evidence available in this repository | Status |
|:---|:---|:---|
| **Route and metadata behavior** | Clean-path History API routing, runtime metadata, and `?q=` handling | Locally checked; deploy and test the static fallback |
| **Sitemap / crawlability** | Sitemap file exists, but deployment must serve each listed URL | Not live-crawled |
| **Performance / accessibility** | Responsive layout and basic interaction checked locally | No Lighthouse report available |
| **Structured data** | Homepage JSON-LD exists; route-level data is not prerendered | Not externally validated |
| **TLS / headers** | Example Nginx configuration exists | No live host evidence |

---

## 2. On-Page & Technical SEO Validation

### A. URL and Canonical Behavior
- The browser app exposes clean paths such as `/errors/name-mismatch/` and uses the History API for client-side navigation; legacy hash routes remain supported.
- Runtime JavaScript now updates the title, description, Open Graph metadata, and canonical URL for routed views. This metadata is not present in the initial HTML response for each route.
- The sitemap lists clean paths such as `/errors/name-mismatch/`. Those paths must resolve to real crawlable pages on the chosen host; a client-side hash router alone does not provide them.
- Two mutually exclusive Nginx examples now exist: `config/nginx-static-spa.conf` provides an `index.html` fallback for clean SPA paths; `config/nginx-wordpress.conf` targets WordPress. Select one deployment model and test its paths before submitting the sitemap.
- `?q=` is supported by the app for homepage searches, but search results canonicalize to the homepage and should not be submitted as separate indexable URLs.

### B. Titles and Descriptions
Route-specific metadata is updated in the browser after the SPA loads. The current browser check does not prove that search engines receive or index those values. For reliable indexing, render each content route to its own HTML page or deploy the WordPress pages and verify the rendered output.

---

## 3. Structured Data (Schema.org) Audit

The homepage contains `WebSite` and `Organization` JSON-LD. Routed guide and service views now add runtime `TechArticle` or `CollectionPage` JSON-LD plus a `BreadcrumbList`. These structures parse in a local browser but have not been tested with Google's Rich Results Test or another schema validator. Do not claim external validation until a test result is archived. Structured data does not guarantee a rich result.

### Schemas Present in Code:
1. **WebSite Schema with SearchAction**:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://error-decoder.in/#website",
  "url": "https://error-decoder.in/",
  "name": "Digital India Error Decoder",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://error-decoder.in/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

2. `BreadcrumbList` data is emitted for routed guide, service, and general-guide views; the homepage and policy pages do not emit route-specific schema.

---

## 4. Performance & Core Web Vitals (Mobile Profile)

No Lighthouse or PageSpeed results are included here. Responsive layout and basic controls were exercised in a local browser; performance scores and Core Web Vitals remain unmeasured. Run Lighthouse against the deployed build and archive the JSON/HTML report with device and network settings.

---

## 5. Security & Privacy Hardening Audit

1. **HTTP Security Headers** (declared in the sample Nginx configuration; not checked on a live host):
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks).
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing).
   - `X-XSS-Protection: 1; mode=block`.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - The current CSP allows broad HTTPS sources and inline/eval script execution; it is not a restrictive XSS policy and should be tailored to actual assets.
2. **Directory & File Execution Protection**:
   - Direct execution of PHP files inside `/wp-content/uploads/` is strictly denied in Nginx.
   - Hidden files (`.git`, `.env`, `.htaccess`) return `403 Forbidden`.
   - `xmlrpc.php` and direct `wp-config.php` requests are blocked.
3. **Data Protection Boundary**:
   - The static app currently has no configured analytics or feedback endpoint; its contact page says submissions are unavailable.
   - Hosting and CDN access logs may still contain request metadata. Document the actual provider and retention policy before production.
