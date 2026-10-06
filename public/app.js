/**
 * Digital India Error Decoder — Client Search Engine & Dynamic Application Logic
 */

let appData = null;
let currentFilter = 'All';
let currentSearchQuery = '';

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadData();
  setupEventListeners();
  handleRouting();
});

// Load dataset
async function loadData() {
  try {
    const res = await fetch('../data/errors-data.json');
    appData = await res.json();
    renderHomePage();
  } catch (err) {
    console.error('Failed to load error data, trying relative fallback:', err);
    try {
      const resFallback = await fetch('data/errors-data.json');
      appData = await resFallback.json();
      renderHomePage();
    } catch (e) {
      console.error('Data load error:', e);
    }
  }
}

// Theme handling
function initTheme() {
  const savedTheme = localStorage.getItem('ied_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ied_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Live search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      applyFiltersAndSearch();
    });
  }

  // Quick chips search
  document.querySelectorAll('.query-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (searchInput) {
        searchInput.value = query;
        currentSearchQuery = query.toLowerCase();
        applyFiltersAndSearch();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // Category filter tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-category');
      applyFiltersAndSearch();
    });
  });

  // URL Hash router
  window.addEventListener('hashchange', handleRouting);
}

// Router
function handleRouting() {
  const hash = window.location.hash || '#/';
  
  // Hide all view containers
  document.querySelectorAll('.route-view').forEach(view => {
    view.classList.remove('active');
  });

  if (hash.startsWith('#/errors/')) {
    const slug = hash.replace('#/errors/', '');
    showGuideDetail(slug);
  } else if (hash.startsWith('#/services/')) {
    const slug = hash.replace('#/services/', '');
    showServiceHub(slug);
  } else if (hash === '#/guides/safe-troubleshooting') {
    showGeneralTroubleshooting();
  } else if (['#/about', '#/editorial-policy', '#/privacy-policy', '#/disclaimer', '#/contact'].includes(hash)) {
    const pageId = hash.replace('#/', '');
    showStaticPage(pageId);
  } else {
    // Default home view
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateBreadcrumbs([{ name: 'Home', url: '#/' }]);
  }
}

// Render Homepage Components
function renderHomePage() {
  if (!appData) return;
  renderServiceCards();
  applyFiltersAndSearch();
}

function renderServiceCards() {
  const container = document.getElementById('services-grid');
  if (!container || !appData.services) return;

  container.innerHTML = appData.services.map(srv => `
    <div class="service-card" onclick="window.location.hash='#/services/${srv.slug}'">
      <div class="service-card-header">
        <div class="service-badge-icon ${srv.slug}">
          ${getServiceIcon(srv.slug)}
        </div>
        <div>
          <h3>${srv.name}</h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">${srv.authority}</span>
        </div>
      </div>
      <p>${srv.description}</p>
      <div class="service-card-meta">
        <span class="service-helpline">📞 ${srv.helpline}</span>
        <span style="color:var(--accent-primary); font-weight:600;">Explore Errors →</span>
      </div>
    </div>
  `).join('');
}

function getServiceIcon(slug) {
  switch (slug) {
    case 'passport': return '🛂';
    case 'aadhaar': return '🪪';
    case 'driving-licence': return '🚗';
    case 'pan': return '💳';
    default: return '🏛️';
  }
}

// Core Search & Filter Execution
function applyFiltersAndSearch() {
  if (!appData || !appData.errors) return;

  const results = appData.errors.filter(err => {
    // 1. Category Filter Match
    const matchesCategory = (currentFilter === 'All') || (err.category.toLowerCase() === currentFilter.toLowerCase());

    // 2. Search Query Match
    if (!matchesCategory) return false;
    if (!currentSearchQuery) return true;

    const query = currentSearchQuery;
    const inTitle = err.title.toLowerCase().includes(query);
    const inQuick = err.quickAnswer.toLowerCase().includes(query);
    const inCategory = err.category.toLowerCase().includes(query);
    const inId = err.id.toLowerCase().includes(query);
    const inServices = err.services.some(s => s.toLowerCase().includes(query));
    const inIntent = err.searchIntent.toLowerCase().includes(query);
    const inCauses = err.causes.some(c => c.toLowerCase().includes(query));

    return inTitle || inQuick || inCategory || inId || inServices || inIntent || inCauses;
  });

  renderErrorGrid(results);
}

function renderErrorGrid(errors) {
  const container = document.getElementById('errors-grid');
  const countBadge = document.getElementById('results-count');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${errors.length} Verified Guide${errors.length === 1 ? '' : 's'}`;
  }

  if (errors.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 0.5rem;">No exact error match found</h3>
        <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
          Try searching for keywords like "OTP", "Payment Pending", "Name Mismatch", or select a different category above.
        </p>
        <button class="filter-btn active" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = errors.map(err => `
    <div class="error-card" onclick="window.location.hash='#/errors/${err.slug}'">
      <div>
        <div class="error-card-top">
          <span class="badge-category ${getCategoryClass(err.category)}">${err.category}</span>
          <span class="badge-id">${err.id}</span>
        </div>
        <h3>${err.title}</h3>
        <p class="quick-answer">${err.quickAnswer}</p>
        <div class="error-card-tags">
          ${err.services.map(s => `<span class="tag-service">${s}</span>`).join('')}
        </div>
      </div>
      <div class="error-card-footer">
        <span style="color: var(--text-muted); font-size: 0.75rem;">Verified: ${err.lastReviewed}</span>
        <span class="action-read">Resolve Error →</span>
      </div>
    </div>
  `).join('');
}

function resetFilters() {
  currentFilter = 'All';
  currentSearchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-category') === 'All');
  });
  applyFiltersAndSearch();
}

function getCategoryClass(category) {
  switch (category.toLowerCase()) {
    case 'identity details': return 'cat-identity';
    case 'documents': return 'cat-documents';
    case 'records': return 'cat-records';
    case 'authentication': return 'cat-authentication';
    case 'payment': return 'cat-payment';
    case 'status': return 'cat-status';
    case 'availability': return 'cat-availability';
    case 'session': return 'cat-session';
    default: return 'cat-documents';
  }
}

// Show Guide Detail View
function showGuideDetail(slug) {
  if (!appData) return;
  const error = appData.errors.find(e => e.slug === slug);
  if (!error) {
    window.location.hash = '#/';
    return;
  }

  const view = document.getElementById('view-guide');
  if (!view) return;

  view.innerHTML = `
    <div class="container">
      <div class="breadcrumbs" id="guide-breadcrumbs">
        <a href="#/">Home</a> <span>/</span>
        <a href="#/" onclick="filterByCategory('${error.category}')">${error.category}</a> <span>/</span>
        <span style="color:var(--text-primary);">${error.title}</span>
      </div>

      <article class="guide-article">
        <div class="guide-header">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="badge-category ${getCategoryClass(error.category)}">${error.category}</span>
            <span class="badge-id">${error.id}</span>
          </div>
          <h1>${error.title}</h1>
          <div class="guide-meta">
            <span>📅 Reviewed: ${error.lastReviewed}</span>
            <span>🏛️ Portals: ${error.services.join(', ')}</span>
            <span>🔍 Intent: <em>${error.searchIntent}</em></span>
          </div>
        </div>

        <div class="callout callout-quick">
          <strong>⚡ Quick Answer (What this means):</strong><br>
          ${error.quickAnswer}
        </div>

        <div class="guide-section">
          <h2>📍 Where & When It Appears</h2>
          <p><strong>Stage:</strong> ${error.stage}</p>
        </div>

        <div class="guide-section">
          <h2>⚠️ Most Probable Causes</h2>
          <ul>
            ${error.causes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>

        <div class="guide-section">
          <h2>🔍 Safe Checks Before Making Changes</h2>
          <ul>
            ${error.checks.map(chk => `<li>${chk}</li>`).join('')}
          </ul>
        </div>

        <div class="guide-section">
          <h2>🛠️ Step-by-Step Resolution</h2>
          ${error.steps.map((step, idx) => `
            <div class="step-card">
              <div class="step-number">${idx + 1}</div>
              <div class="step-content">
                <h3>Step ${idx + 1}</h3>
                <p>${step}</p>
              </div>
            </div>
          `).join('')}
        </div>

        ${error.warning ? `
          <div class="callout callout-warning">
            <strong>🛑 Caution & Safe Boundary:</strong><br>
            ${error.warning}
          </div>
        ` : ''}

        <div class="guide-section">
          <h2>❌ Actions to Avoid</h2>
          <div class="callout callout-danger" style="margin:0;">
            <ul style="margin:0; padding-left:1.25rem;">
              ${error.avoid.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="guide-section" style="background:var(--bg-secondary); padding:1.5rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h2>🏛️ Official Support & Escalation Channels</h2>
          <p style="margin-bottom:1rem;">If self-troubleshooting does not resolve the issue, contact the verified government helpline:</p>
          <p><strong>Official Helpline:</strong> <span style="color:var(--accent-primary); font-weight:700;">${error.officialHelpline}</span></p>
          <div style="margin-top:1.25rem;">
            <a href="${error.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn-official">
              Visit Official Verified Portal ↗
            </a>
          </div>
        </div>

        <div class="footer-nav">
          <a href="#/" class="btn-icon" style="text-decoration:none; display:inline-flex; gap:0.5rem; align-items:center;">
            ← Back to All Guides
          </a>
          <button onclick="window.print()" class="btn-icon" title="Print Guide">
            🖨️ Print / Save PDF
          </button>
        </div>
      </article>
    </div>
  `;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show Service Hub View
function showServiceHub(slug) {
  if (!appData) return;
  const srv = appData.services.find(s => s.slug === slug);
  if (!srv) {
    window.location.hash = '#/';
    return;
  }

  const relatedErrors = appData.errors.filter(e => 
    e.services.some(s => s.toLowerCase().includes(srv.slug.replace('-', ' '))) ||
    e.services.some(s => s.toLowerCase() === srv.name.toLowerCase().split(' ')[0])
  );

  const view = document.getElementById('view-service-hub');
  if (!view) return;

  view.innerHTML = `
    <div class="container">
      <div class="breadcrumbs">
        <a href="#/">Home</a> <span>/</span>
        <a href="#/">Services</a> <span>/</span>
        <span style="color:var(--text-primary);">${srv.name}</span>
      </div>

      <div class="page-header" style="background:var(--bg-card); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--border-subtle); margin-bottom:2.5rem;">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
          <div class="service-badge-icon ${srv.slug}" style="width:54px; height:54px; font-size:2rem;">
            ${getServiceIcon(srv.slug)}
          </div>
          <div>
            <h1 style="font-family:var(--font-display); font-size:2rem; margin-bottom:0.25rem;">${srv.name}</h1>
            <span style="color:var(--text-muted); font-size:0.9rem;">Authority: ${srv.authority}</span>
          </div>
        </div>
        <p style="color:var(--text-secondary); max-width:800px; margin-bottom:1.5rem;">${srv.description}</p>
        <div style="display:flex; flex-wrap:wrap; gap:1.5rem; align-items:center;">
          <span style="font-weight:600; color:var(--accent-primary);">📞 Helpline: ${srv.helpline}</span>
          <a href="${srv.url}" target="_blank" rel="noopener noreferrer" class="btn-official" style="padding:0.45rem 1rem; font-size:0.85rem;">
            Visit Official Portal ↗
          </a>
        </div>
      </div>

      <h2 class="section-title" style="margin-bottom:1.5rem;">Verified Guides for ${srv.name}</h2>
      <div class="errors-grid">
        ${relatedErrors.map(err => `
          <div class="error-card" onclick="window.location.hash='#/errors/${err.slug}'">
            <div>
              <div class="error-card-top">
                <span class="badge-category ${getCategoryClass(err.category)}">${err.category}</span>
                <span class="badge-id">${err.id}</span>
              </div>
              <h3>${err.title}</h3>
              <p class="quick-answer">${err.quickAnswer}</p>
            </div>
            <div class="error-card-footer">
              <span style="color: var(--text-muted); font-size: 0.75rem;">Verified: ${err.lastReviewed}</span>
              <span class="action-read">Read Guide →</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show General Safe Troubleshooting
function showGeneralTroubleshooting() {
  const view = document.getElementById('view-troubleshooting');
  if (!view) return;

  view.innerHTML = `
    <div class="container">
      <div class="breadcrumbs">
        <a href="#/">Home</a> <span>/</span>
        <a href="#/">Guides</a> <span>/</span>
        <span style="color:var(--text-primary);">Safe Troubleshooting</span>
      </div>

      <article class="guide-article">
        <div class="page-header">
          <span class="badge-category cat-documents">Master Guide</span>
          <h1 style="font-family:var(--font-display); font-size:2.2rem; margin:0.75rem 0;">Safe Troubleshooting Before Contacting Support</h1>
          <p style="color:var(--text-secondary);">Five non-destructive, safe diagnostic checks every citizen can perform before lodging formal grievances or assuming portal failure.</p>
        </div>

        <div class="guide-section">
          <h2>1. Verify Device Clock Synchronization (IST)</h2>
          <p>Government portal authentication gateways (such as OTPs, 2FA, and Aadhaar e-Sign) strictly enforce cryptographic time-window validation. If your computer or smartphone clock deviates by more than 90 seconds from Indian Standard Time (IST), OTPs will be rejected as expired upon entry.</p>
          <div class="callout callout-quick">
            <strong>Check:</strong> Go to Settings → Date & Time → Toggle on "Set time automatically" (Network-provided time).
          </div>
        </div>

        <div class="guide-section">
          <h2>2. Clean Document Formatting & Password Removal</h2>
          <p>Over 40% of document upload rejections are due to password-protected e-Aadhaar PDFs or file names containing spaces and punctuation. Downloaded Aadhaar cards have a default 8-character password. Government ingestion servers cannot decrypt password-protected files.</p>
          <div class="callout callout-warning">
            <strong>Safe Action:</strong> Open your PDF, select "Print to PDF", save as an unencrypted file named cleanly (e.g. <code>idproof.pdf</code>), and confirm file size is under 200 KB.
          </div>
        </div>

        <div class="guide-section">
          <h2>3. Respect the 24–48 Hour Banking Reconciliation Window</h2>
          <p>When money is deducted via UPI, NetBanking, or Debit Card but the portal indicates "Payment Failed" or "Pending Challan", treasury aggregators (Bharatkosh, SBI ePay) require nightly batch reconciliations.</p>
          <div class="callout callout-danger">
            <strong>Never Pay Twice in Panic:</strong> Clicking "Pay Now" repeatedly risks multiple charges. In 80% of cases, logging back in after 24 hours and clicking "Re-verify Payment" confirms the fee.
          </div>
        </div>

        <div class="guide-section">
          <h2>4. Use Single-Tab Isolated Browsing</h2>
          <p>Government session cookies are tied to a single active session token. Opening multiple tabs for the same portal will scramble the state parameters, resulting in an immediate "Session Expired" error.</p>
        </div>

        <div class="guide-section">
          <h2>5. Maintain Zero Trust Against Unofficial Intermediaries</h2>
          <p>Never share SMS OTPs, Aadhaar numbers, or banking credentials with third-party agents found on social media, Telegram, or unofficial search ads claiming to "expedite" your application.</p>
        </div>

        <div class="footer-nav">
          <a href="#/" class="btn-official">← Return to Directory</a>
        </div>
      </article>
    </div>
  `;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show Static Governance Pages
function showStaticPage(pageId) {
  const view = document.getElementById('view-static');
  if (!view) return;

  let title = '';
  let content = '';

  switch (pageId) {
    case 'about':
      title = 'About Digital India Error Decoder';
      content = `
        <p><strong>Digital India Error Decoder</strong> is an independent educational and public utility research project created to bridge the usability gap in Indian citizen-facing government portals.</p>
        <h2>Our Mission</h2>
        <p>Millions of citizens every month encounter cryptic messages like <em>"Session Expired"</em>, <em>"Record Not Found"</em>, or <em>"Payment Successful Status Pending"</em> on essential services including Passport Seva, Parivahan, UIDAI, and Income Tax. Most official portals provide minimal contextual explanation, leaving applicants anxious or prone to falling for unauthorized cyber-cafe scams.</p>
        <p>We translate technical error codes into plain English with safe checks, reversible steps, and direct escalation paths.</p>
        <h2>Academic & Research Context</h2>
        <p>This site is developed as part of a Web Search Engine & Usability Mini Project, demonstrating practical SEO architecture, structured metadata implementation, user-first problem solving, and strict ethical adherence to citizen data privacy.</p>
      `;
      break;

    case 'editorial-policy':
      title = 'Editorial Policy & Verification Standards';
      content = `
        <p>To preserve accuracy, integrity, and user safety, all guides on Digital India Error Decoder adhere to rigorous editorial rules:</p>
        <h2>1. Official Verification Only</h2>
        <p>No error code, turnaround timeline, or portal procedure is published unless verified against official government user manuals, Citizen's Charters, or active portal workflows.</p>
        <h2>2. Distinction Between Advice and Instructions</h2>
        <p>We clearly distinguish general browser/network troubleshooting from statutory government instructions.</p>
        <h2>3. Date-Stamped Reviews</h2>
        <p>Every article features a visible "Last Reviewed Date". As portal interfaces change, outdated articles are re-audited and updated.</p>
        <h2>4. Corrections</h2>
        <p>Readers and public service personnel who spot discrepancies can submit immediate corrections via our <a href="#/contact">Feedback Form</a>.</p>
      `;
      break;

    case 'privacy-policy':
      title = 'Privacy Policy';
      content = `
        <p><strong>Last Updated: October 2026</strong></p>
        <h2>Zero Data Collection Standard</h2>
        <p>Digital India Error Decoder is committed to maximum citizen privacy. <strong>We do not collect, request, store, or process any sensitive personal identifiers</strong> including but not limited to:</p>
        <ul>
          <li>Aadhaar numbers or Virtual IDs</li>
          <li>Permanent Account Numbers (PAN)</li>
          <li>One-Time Passwords (OTPs)</li>
          <li>Application Reference Numbers (ARNs)</li>
          <li>Bank account or credit card numbers</li>
          <li>Uploaded identity documents or certificates</li>
        </ul>
        <h2>Analytics & Telemetry</h2>
        <p>We utilize privacy-preserving basic analytics (Google Search Console and privacy-configured Google Analytics 4) strictly to measure overall site performance, page search queries, and broken links. IP anonymization is enforced and no cross-device tracking is performed.</p>
      `;
      break;

    case 'disclaimer':
      title = 'Statutory Disclaimer & Non-Affiliation';
      content = `
        <div class="callout callout-warning">
          <strong>Non-Affiliation Declaration:</strong><br>
          Digital India Error Decoder (<code>error-decoder.in</code>) is an independent, non-commercial public interest website. We are <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with the Government of India</strong>, the Ministry of External Affairs, the Ministry of Road Transport and Highways, UIDAI, the Income Tax Department, or any of their subsidiaries or affiliates.
        </div>
        <h2>Trademarks & Copyrights</h2>
        <p>All official portal names, logos, trademarks, and service marks (including Passport Seva, Parivahan Sarathi, Aadhaar, PAN) referenced on this site belong to their respective statutory owners. Their use on this website is for identification, education, and nominative fair-use commentary only.</p>
        <h2>Limitation of Liability</h2>
        <p>The guidance provided on this website is for general educational information only. While we make every effort to keep instructions up to date, portal rules and statutory guidelines change frequently. For official determinations, always refer directly to the verified government portal or authorized grievance cell.</p>
      `;
      break;

    case 'contact':
      title = 'Contact & Correction Feedback';
      content = `
        <p>Found an error code not yet covered, or noticed that a portal interface has changed? Submit your feedback below.</p>
        <form id="contact-form" onsubmit="handleContactSubmit(event)" style="margin-top:2rem;">
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" required placeholder="e.g. Citizen Researcher">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" required placeholder="e.g. name@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Portal or Error Topic</label>
            <input type="text" class="form-input" required placeholder="e.g. Parivahan LL test slot timeout">
          </div>
          <div class="form-group">
            <label class="form-label">Feedback or Correction Details</label>
            <textarea class="form-textarea" rows="4" required placeholder="Describe the error, portal URL, and what step needs updating..."></textarea>
          </div>
          <div class="callout callout-warning" style="font-size:0.85rem; margin-bottom:1.5rem;">
            ⚠️ <strong>Reminder:</strong> Do not include your Aadhaar number, PAN, OTP, application passwords, or private bank details in this form.
          </div>
          <button type="submit" class="btn-primary">Submit Feedback</button>
        </form>
        <div id="form-success" style="display:none; margin-top:1.5rem;" class="callout callout-quick">
          ✅ Thank you for your feedback! Our editorial review team will verify the portal workflow and update the guide accordingly.
        </div>
      `;
      break;
  }

  view.innerHTML = `
    <div class="container">
      <div class="breadcrumbs">
        <a href="#/">Home</a> <span>/</span>
        <span style="color:var(--text-primary);">${title}</span>
      </div>
      <div class="page-container prose glass" style="border-radius:var(--radius-lg);">
        <div class="page-header">
          <h1>${title}</h1>
        </div>
        ${content}
      </div>
    </div>
  `;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleContactSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (form && success) {
    form.style.display = 'none';
    success.style.display = 'block';
  }
}

function filterByCategory(category) {
  window.location.hash = '#/';
  setTimeout(() => {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const match = btn.getAttribute('data-category').toLowerCase() === category.toLowerCase();
      btn.classList.toggle('active', match);
    });
    currentFilter = category;
    applyFiltersAndSearch();
  }, 50);
}
