const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataFile = path.join(rootDir, 'data', 'errors-data.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Ensure target directories exist
const contentErrorsDir = path.join(rootDir, 'content', 'errors');
const contentServicesDir = path.join(rootDir, 'content', 'services');
const contentGuidesDir = path.join(rootDir, 'content', 'guides');
const contentPagesDir = path.join(rootDir, 'content', 'pages');
const exportDir = path.join(rootDir, 'export');
const publicDataDir = path.join(rootDir, 'public', 'data');

[contentErrorsDir, contentServicesDir, contentGuidesDir, contentPagesDir, exportDir, publicDataDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Copy data file to public/data/
fs.copyFileSync(dataFile, path.join(publicDataDir, 'errors-data.json'));
console.log('✓ Copied errors-data.json to public/data/');

// 1. Generate 15 Markdown Error Guides
data.errors.forEach(err => {
  const mdContent = `---
title: "${err.title}"
slug: "${err.slug}"
id: "${err.id}"
category: "${err.category}"
services: [${err.services.map(s => `"${s}"`).join(', ')}]
search_intent: "${err.searchIntent}"
last_reviewed: "${err.lastReviewed}"
author: "Digital India Error Decoder Research Team"
---

# ${err.title} — Meaning, Causes & Safe Resolution

> **Editorial Standard Reminder**:
> - Never request personal identifiers (Aadhaar, PAN, OTP, application numbers, bank info).
> - Cite the exact official instruction, notice, or Citizen's Charter section supporting each portal-specific claim.
> - Clearly separate general network/browser troubleshooting from portal-specific guidance.
> - Label unsupported or conflicting claims "Needs verification"; a review date alone is not proof of verification.

---

## Quick Answer
> **In Short**: ${err.quickAnswer}

---

## Where It Appears
- **Service / Portal**: ${err.services.join(', ')}
- **Stage of Application**: ${err.stage}
- **Recorded Review Date**: ${err.lastReviewed}
- **Source Status**: Needs source review; claim-level references are not recorded in the project data.

---

## Possible Causes
${err.causes.map(c => `- **${c.split(':')[0]}**: ${c}`).join('\n')}

---

## What to Check Before Retrying (Safe Checks)
${err.checks.map(chk => `- [ ] ${chk}`).join('\n')}

---

## Step-by-Step Resolution

${err.steps.map((st, i) => `### Step ${i + 1}: Action ${i + 1}
${st}
`).join('\n')}

${err.warning ? `> [!WARNING]
> **Important Caution**: ${err.warning}
` : ''}

---

## Actions to Avoid
${err.avoid.map(a => `- ❌ ${a}`).join('\n')}

---

## If the Problem Continues (Official Escalation Routes)
- **Official Portal**: [${err.services[0]} Official Site](${err.officialUrl})
- **National Consumer / Portal Helpline**: ${err.officialHelpline}
- **Grievance Redressal**: [CPGRAMS Portal](https://pgportal.gov.in)

---

## Editorial & Review Metadata
- **Author / Researcher**: Digital India Error Decoder Research Team
- **Last Reviewed Date**: ${err.lastReviewed}
- **Feedback & Corrections**: Found an outdated step? Report it via our [Correction Form](/contact/).

> **Disclaimer**: *Digital India Error Decoder is an independent educational initiative and is not affiliated with, endorsed by, or operated by the Government of India or any statutory authority.*
`;

  fs.writeFileSync(path.join(contentErrorsDir, `${err.slug}.md`), mdContent, 'utf8');
});
console.log(`✓ Generated ${data.errors.length} Markdown Error Guides in content/errors/`);

// 2. Generate 4 Service Hubs
data.services.forEach(srv => {
  const relatedErrors = data.errors.filter(e => 
    e.services.some(s => s.toLowerCase().includes(srv.slug.replace('-', ' '))) ||
    e.services.some(s => s.toLowerCase() === srv.name.toLowerCase().split(' ')[0])
  );

  const mdContent = `---
title: "${srv.name}"
slug: "${srv.slug}"
authority: "${srv.authority}"
helpline: "${srv.helpline}"
url: "${srv.url}"
---

# ${srv.name} — Public Portal Error Directory

- **Statutory Authority**: ${srv.authority}
- **Official Helpline listed in project data**: ${srv.helpline}
- **Official Portal URL**: [${srv.url}](${srv.url})

## Overview
${srv.description}

## Common Citizen Issues & Blockers
${srv.commonIssues.map(ci => `- ${ci}`).join('\n')}

## Verified Troubleshooting Guides for this Portal
${relatedErrors.map(re => `- [${re.title}](/errors/${re.slug}/) — *${re.category}*`).join('\n')}

---
> **Disclaimer**: *This page is independent educational documentation and is not operated by ${srv.authority}.*
`;

  fs.writeFileSync(path.join(contentServicesDir, `${srv.slug}.md`), mdContent, 'utf8');
});
console.log(`✓ Generated ${data.services.length} Service Hub pages in content/services/`);

// 3. Generate Master Troubleshooting Guide
const guideMd = `---
title: "Safe Troubleshooting Before Contacting Portal Support"
slug: "safe-troubleshooting-before-contacting-support"
---

# Safe Troubleshooting Before Contacting Portal Support

Essential, non-destructive diagnostic checks every citizen should perform before lodging official grievances or assuming a portal system failure.

## 1. Check Device Date and Time
An incorrect device clock can interfere with time-based authentication. Enable automatic date and time, then request a fresh OTP if the portal allows it. Follow the portal's own retry and lockout instructions.

## 2. Check Document Requirements
Portals may limit file type, size, dimensions, or password protection. Check the instructions for the exact application before editing a document. e-Aadhaar PDFs may be password protected; follow UIDAI instructions and avoid uploading identity documents to unknown conversion sites.

## 3. Check Payment Status Before Paying Again
If money was debited but the application still shows pending, check the official portal's payment-status or receipt page and your bank statement. Do not pay again until the portal or bank confirms the first transaction failed. Follow the reconciliation window shown by the portal or payment provider.

## 4. Keep the Session Stable
Some portals limit how many active sessions or tabs can be used at once. If a session expires, return through the official portal and check whether a draft or application was saved before restarting.

## 5. Maintain Zero Trust Against Unofficial Intermediaries
Never share SMS OTPs, Aadhaar numbers, or banking credentials with third-party agents found on social media, Telegram, or unofficial search ads claiming to "expedite" your application.
`;
fs.writeFileSync(path.join(contentGuidesDir, 'safe-troubleshooting-before-contacting-support.md'), guideMd, 'utf8');
console.log('✓ Generated Safe Troubleshooting Guide');

// 4. Generate Governance Pages
const pages = [
  { slug: 'about', title: 'About Digital India Error Decoder', content: 'Independent citizen utility project created to demystify cryptic government portal error messages and provide safe, verifiable troubleshooting advice.' },
  { slug: 'editorial-policy', title: 'Editorial Policy & Verification Standards', content: 'Portal-specific claims should cite a relevant official source, not just a portal homepage. Recorded review dates are not proof of independent verification; source and reviewer records are not yet complete for every guide.' },
  { slug: 'privacy-policy', title: 'Privacy & Data Use', content: 'This static build does not configure analytics or feedback submission. Production privacy details depend on the selected host and enabled services.' },
  { slug: 'disclaimer', title: 'Statutory Disclaimer', content: 'Digital India Error Decoder is an independent initiative not affiliated with, endorsed by, or operated by the Government of India or any statutory department.' },
  { slug: 'contact', title: 'Correction Submissions', content: 'Correction submissions are not available in this build because no feedback service or contact address is configured.' }
];

pages.forEach(p => {
  const pMd = `---
title: "${p.title}"
slug: "${p.slug}"
---

# ${p.title}

${p.content}
`;
  fs.writeFileSync(path.join(contentPagesDir, `${p.slug}.md`), pMd, 'utf8');
});
console.log('✓ Generated 5 Governance pages');

// 5. Generate WordPress WXR (XML) Export File for 1-click WP import
let postId = 100;
function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

let itemsXml = '';

// Add 15 error posts
data.errors.forEach(err => {
  postId++;
  const postDate = '2026-10-06 10:00:00';
  const postContent = `<!-- wp:paragraph -->
<p><strong>Quick Answer:</strong> ${escapeXml(err.quickAnswer)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading -->
<h2>Where It Appears</h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><strong>Stage:</strong> ${escapeXml(err.stage)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading -->
<h2>Possible Causes</h2>
<!-- /wp:heading -->
<!-- wp:list -->
<ul>${err.causes.map(c => `<li>${escapeXml(c)}</li>`).join('')}</ul>
<!-- /wp:list -->
<!-- wp:heading -->
<h2>Step-by-Step Resolution</h2>
<!-- /wp:heading -->
<!-- wp:list {"ordered":true} -->
<ol>${err.steps.map(s => `<li>${escapeXml(s)}</li>`).join('')}</ol>
<!-- /wp:list -->
<!-- wp:heading -->
<h2>Official Helpline</h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Helpline: <strong>${escapeXml(err.officialHelpline)}</strong> | <a href="${escapeXml(err.officialUrl)}">Visit Official Portal</a></p>
<!-- /wp:paragraph -->`;

  itemsXml += `
  <item>
    <title>${escapeXml(err.title)}</title>
    <link>https://error-decoder.in/errors/${err.slug}/</link>
    <pubDate>Tue, 06 Oct 2026 10:00:00 +0000</pubDate>
    <dc:creator><![CDATA[decoder_admin]]></dc:creator>
    <category domain="category" nicename="${err.category.toLowerCase().replace(/\s+/g, '-')}"><![CDATA[${err.category}]]></category>
    ${err.services.map(s => `<category domain="post_tag" nicename="${s.toLowerCase().replace(/\s+/g, '-')}"><![CDATA[${s}]]></category>`).join('\n')}
    <guid isPermaLink="false">https://error-decoder.in/?p=${postId}</guid>
    <description></description>
    <content:encoded><![CDATA[${postContent}]]></content:encoded>
    <excerpt:encoded><![CDATA[${escapeXml(err.quickAnswer)}]]></excerpt:encoded>
    <wp:post_id>${postId}</wp:post_id>
    <wp:post_date>${postDate}</wp:post_date>
    <wp:post_date_gmt>${postDate}</wp:post_date_gmt>
    <wp:comment_status>closed</wp:comment_status>
    <wp:ping_status>closed</wp:ping_status>
    <wp:post_name>${err.slug}</wp:post_name>
    <wp:status>publish</wp:status>
    <wp:post_parent>0</wp:post_parent>
    <wp:menu_order>0</wp:menu_order>
    <wp:post_type>post</wp:post_type>
    <wp:is_sticky>0</wp:is_sticky>
  </item>`;
});

// Add 4 Service Hub pages
data.services.forEach(srv => {
  postId++;
  const postDate = '2026-10-06 09:00:00';
  itemsXml += `
  <item>
    <title>${escapeXml(srv.name)}</title>
    <link>https://error-decoder.in/services/${srv.slug}/</link>
    <pubDate>Tue, 06 Oct 2026 09:00:00 +0000</pubDate>
    <dc:creator><![CDATA[decoder_admin]]></dc:creator>
    <guid isPermaLink="false">https://error-decoder.in/?p=${postId}</guid>
    <description></description>
    <content:encoded><![CDATA[<p>${escapeXml(srv.description)}</p><p>Official Helpline: ${escapeXml(srv.helpline)}</p>]]></content:encoded>
    <wp:post_id>${postId}</wp:post_id>
    <wp:post_date>${postDate}</wp:post_date>
    <wp:post_name>${srv.slug}</wp:post_name>
    <wp:status>publish</wp:status>
    <wp:post_type>page</wp:post_type>
  </item>`;
});

// Add 5 Governance pages
pages.forEach(p => {
  postId++;
  const postDate = '2026-10-06 08:00:00';
  itemsXml += `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>https://error-decoder.in/${p.slug}/</link>
    <pubDate>Tue, 06 Oct 2026 08:00:00 +0000</pubDate>
    <dc:creator><![CDATA[decoder_admin]]></dc:creator>
    <guid isPermaLink="false">https://error-decoder.in/?p=${postId}</guid>
    <description></description>
    <content:encoded><![CDATA[<p>${escapeXml(p.content)}</p>]]></content:encoded>
    <wp:post_id>${postId}</wp:post_id>
    <wp:post_date>${postDate}</wp:post_date>
    <wp:post_name>${p.slug}</wp:post_name>
    <wp:status>publish</wp:status>
    <wp:post_type>page</wp:post_type>
  </item>`;
});

const wxrXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>Digital India Error Decoder</title>
  <link>https://error-decoder.in</link>
  <description>Understand the error. Know what to do next.</description>
  <pubDate>Tue, 06 Oct 2026 12:00:00 +0000</pubDate>
  <language>en-US</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>https://error-decoder.in</wp:base_site_url>
  <wp:base_blog_url>https://error-decoder.in</wp:base_blog_url>
  ${itemsXml}
</channel>
</rss>`;

fs.writeFileSync(path.join(exportDir, 'wordpress-export.xml'), wxrXml, 'utf8');
console.log('✓ Generated WordPress WXR XML export in export/wordpress-export.xml');
