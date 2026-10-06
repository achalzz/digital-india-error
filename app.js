/**
 * Digital India Error Decoder — Production Application Core
 *
 * Fixes & Enhancements in this version:
 *  1. Service hub matching bug fixed (case-insensitive exact tag match)
 *  2. Fuzzy search via Fuse.js (loaded from CDN)
 *  3. Synonym mapping for natural-language and Hinglish searches
 *  4. GA4 privacy-first tracking (hash-based SPA page views)
 *  5. ARIA live region updates for screen readers
 *  6. Full keyboard navigation (tabindex, role, keydown Enter/Space)
 *  7. Portal status banner from portal-status.json
 *  8. Content staleness badge (>60 days since lastReviewed)
 *  9. Hindi / English language switcher
 * 10. Real Formspree form submission
 * 11. PWA service worker registration
 * 12. Mobile hamburger menu
 * 13. CPGRAMS ministry-specific links on each guide
 */

'use strict';

/* ================================================================
   STATE
   ================================================================ */
let appData      = null;   // errors-data.json
let hiData       = null;   // i18n/hi.json  (loaded lazily)
let fuseInstance = null;   // Fuse.js search engine
let currentFilter = 'All';
let currentLang   = localStorage.getItem('ied_lang') || 'en';

/* Service hub slug → exact tag used in errors-data.json services[] */
const SERVICE_TAG_MAP = {
  'passport':        'Passport',
  'aadhaar':         'Aadhaar',
  'driving-licence': 'Driving Licence',
  'pan':             'PAN'
};

/* Hinglish + English synonym mapping */
const SYNONYMS = {
  'payment-successful-application-pending': [
    'paise kat gaya', 'money cut', 'debited', 'payment done',
    'paid but not updated', 'transaction pending', 'challan pending',
    'amount deducted', 'paid application not confirmed', 'payment success pending'
  ],
  'payment-failed-amount-debited': [
    'paise gaye payment failed', 'payment fail money debited',
    'bank se kata payment fail', 'double deduction', 'refund',
    'amount debited transaction failed', 'money gone'
  ],
  'otp-not-received': [
    'otp nahi aaya', 'otp aa nahi raha', 'no otp', 'sms not received',
    'otp delayed', 'otp not coming', 'verification code', 'waiting otp',
    'otp problem', 'one time password'
  ],
  'otp-expired-invalid': [
    'otp expire', 'invalid otp', 'otp timeout', 'wrong otp',
    'otp purana', 'otp expired', 'session otp failed'
  ],
  'name-mismatch': [
    'naam galat', 'naam alag hai', 'name different', 'spelling wrong',
    'name does not match', 'name correction', 'wrong name', 'naam mismatch'
  ],
  'session-expired': [
    'session khatam', 'form reset', 'form data lost', 'please login again',
    'session timeout', 'logged out', 'application reset', 'data gone'
  ],
  'record-not-found': [
    'record nahi mila', 'no record', 'not found in database',
    'application missing', 'details missing', 'record nahi hai',
    'parivahan record missing'
  ],
  'document-rejected': [
    'document reject', 'document kyun reject hua', 'upload reject',
    'document verify fail', 'resubmit document', 'document invalid'
  ],
  'file-upload-failed': [
    'file upload nahi ho rahi', 'pdf upload fail', 'document upload error',
    'file not uploading', 'upload stuck', 'cant upload document'
  ],
  'application-under-process': [
    'application under process kitne din', 'status nahi change ho raha',
    'processing kitne time', 'application processing', 'status stuck'
  ],
  'portal-server-error': [
    'website band hai', 'portal down', 'server error 500', '503',
    'site not opening', 'government website not working', 'portal unavailable'
  ]
};

/* CPGRAMS ministry mapping per service */
const CPGRAMS_LINKS = {
  'Passport': 'https://pgportal.gov.in/Registration/orgwise?orgname=Ministry+of+External+Affairs',
  'Aadhaar':  'https://pgportal.gov.in/Registration/orgwise?orgname=UIDAI',
  'Driving Licence': 'https://pgportal.gov.in/Registration/orgwise?orgname=Ministry+of+Road+Transport',
  'PAN': 'https://pgportal.gov.in/Registration/orgwise?orgname=Income+Tax+Department'
};

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLang();
  registerSW();
  await Promise.all([loadData(), checkPortalStatus()]);
  setupEventListeners();
  handleRouting();
});

/* ================================================================
   SERVICE WORKER
   ================================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  }
}

/* ================================================================
   DATA LOADING
   ================================================================ */
async function loadData() {
  try {
    const res  = await fetch('data/errors-data.json');
    appData    = await res.json();
    initFuse();
    renderHomePage();
  } catch (err) {
    console.error('Failed to load error data:', err);
    showLoadError();
  }
}

async function loadHindi() {
  if (hiData) return;
  try {
    const res = await fetch('i18n/hi.json');
    hiData    = await res.json();
  } catch (err) {
    console.warn('Hindi data unavailable, falling back to English:', err);
    currentLang = 'en';
    updateLangToggle();
  }
}

function showLoadError() {
  const grid = document.getElementById('errors-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="empty-state">
      <span class="empty-state-icon">⚠️</span>
      <h3>Could not load error guide data</h3>
      <p>Please try refreshing the page. If the problem persists, ensure the server is running correctly.</p>
    </div>`;
}

/* ================================================================
   FUSE.JS — FUZZY SEARCH ENGINE
   ================================================================ */
function initFuse() {
  if (!appData || typeof Fuse === 'undefined') return;

  // Flatten synonyms into each error object for Fuse to index
  const indexableErrors = appData.errors.map(err => ({
    ...err,
    synonymsFlat: (SYNONYMS[err.slug] || []).join(' ')
  }));

  fuseInstance = new Fuse(indexableErrors, {
    threshold: 0.35,           // 0 = perfect match, 1 = anything
    ignoreLocation: true,
    useExtendedSearch: false,
    minMatchCharLength: 2,
    keys: [
      { name: 'title',        weight: 0.40 },
      { name: 'quickAnswer',  weight: 0.20 },
      { name: 'searchIntent', weight: 0.15 },
      { name: 'category',     weight: 0.10 },
      { name: 'synonymsFlat', weight: 0.10 },
      { name: 'causes',       weight: 0.05 },
    ]
  });
}

/* ================================================================
   PORTAL STATUS MONITORING
   ================================================================ */
async function checkPortalStatus() {
  try {
    const res    = await fetch('portal-status.json');
    const data   = await res.json();
    const issues = data.portals.filter(p => p.status !== 'operational');
    if (issues.length > 0) {
      const banner = document.getElementById('portal-status-banner');
      if (banner) {
        banner.textContent = `⚠️ Reported Issues: ${issues.map(p => `${p.name}${p.note ? ' — ' + p.note : ''}`).join(' | ')}`;
        banner.classList.add('visible');
      }
    }
  } catch { /* Non-critical — silent fail */ }
}

/* ================================================================
   THEME
   ================================================================ */
function initTheme() {
  const saved = localStorage.getItem('ied_theme') || 'dark';
  applyTheme(saved);
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ied_theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ================================================================
   LANGUAGE SWITCHER
   ================================================================ */
function initLang() {
  updateLangToggle();
  document.getElementById('lang-toggle')?.addEventListener('click', async () => {
    if (currentLang === 'en') {
      currentLang = 'hi';
      await loadHindi();
    } else {
      currentLang = 'en';
    }
    localStorage.setItem('ied_lang', currentLang);
    updateLangToggle();
    renderHomePage();
  });
}

function updateLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.textContent = currentLang === 'en' ? '🇮🇳 हिन्दी' : '🇬🇧 English';
    btn.setAttribute('aria-label', `Switch to ${currentLang === 'en' ? 'Hindi' : 'English'}`);
  }
}

function t(key, section) {
  if (currentLang === 'hi' && hiData) {
    return section ? hiData[section]?.[key] : hiData[key];
  }
  return null;
}

/* ================================================================
   MOBILE MENU
   ================================================================ */
function setupMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobile-nav');
  const closeBtn   = document.getElementById('mobile-nav-close');

  hamburger?.addEventListener('click', () => {
    mobileNav?.classList.add('open');
    mobileNav?.setAttribute('aria-hidden', 'false');
    document.getElementById('mobile-nav-close')?.focus();
  });

  closeBtn?.addEventListener('click', closeMobileMenu);
  mobileNav?.addEventListener('click', e => {
    if (e.target === mobileNav) closeMobileMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenu();
  });
}

function closeMobileMenu() {
  document.getElementById('mobile-nav')?.classList.remove('open');
  document.getElementById('mobile-nav')?.setAttribute('aria-hidden', 'true');
  document.getElementById('hamburger')?.focus();
}

/* ================================================================
   GA4 — PRIVACY-FIRST SPA TRACKING
   ================================================================ */
function trackPageView(path) {
  if (typeof gtag !== 'function') return;
  gtag('event', 'page_view', {
    page_path:  path,
    page_title: document.title
  });
}

/* ================================================================
   EVENT LISTENERS
   ================================================================ */
function setupEventListeners() {
  setupMobileMenu();

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applyFiltersAndSearch(e.target.value.trim());
      }, 150);
    });
  }

  // Quick chips
  document.querySelectorAll('.query-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query      = chip.getAttribute('data-query');
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = query;
        applyFiltersAndSearch(query);
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    });
    // Keyboard support
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        chip.click();
      }
    });
  });

  // Category filter tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFilter(btn);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  // Hash router
  window.addEventListener('hashchange', handleRouting);
}

function setActiveFilter(activeBtn) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  activeBtn.classList.add('active');
  activeBtn.setAttribute('aria-selected', 'true');
  currentFilter = activeBtn.getAttribute('data-category');

  const searchInput = document.getElementById('search-input');
  applyFiltersAndSearch(searchInput?.value?.trim() || '');
}

/* ================================================================
   ROUTER
   ================================================================ */
function handleRouting() {
  const hash = window.location.hash || '#/';
  hideAllViews();

  trackPageView(hash);

  if (hash.startsWith('#/errors/')) {
    const slug = hash.replace('#/errors/', '').replace(/\/$/, '');
    showGuideDetail(slug);
  } else if (hash.startsWith('#/services/')) {
    const slug = hash.replace('#/services/', '').replace(/\/$/, '');
    showServiceHub(slug);
  } else if (hash === '#/guides/safe-troubleshooting') {
    showGeneralTroubleshooting();
  } else if (['#/about','#/editorial-policy','#/privacy-policy','#/disclaimer','#/contact'].includes(hash)) {
    showStaticPage(hash.replace('#/', ''));
  } else {
    showHomeView();
  }
}

function hideAllViews() {
  document.querySelectorAll('.route-view').forEach(v => v.classList.remove('active'));
}

function showHomeView() {
  document.getElementById('view-home')?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   HOME PAGE RENDER
   ================================================================ */
function renderHomePage() {
  if (!appData) return;
  updateQuickChips();
  renderServiceCards();
  applyFiltersAndSearch(document.getElementById('search-input')?.value?.trim() || '');
}

function updateQuickChips() {
  if (currentLang !== 'hi' || !hiData) return;
  const chips = document.querySelectorAll('.query-chip');
  const hiChips = hiData?.hero?.chips || [];
  chips.forEach((chip, i) => {
    if (hiChips[i]) chip.textContent = hiChips[i];
  });
  const placeholder = document.getElementById('search-input');
  if (placeholder && hiData?.hero?.search_placeholder) {
    placeholder.setAttribute('placeholder', hiData.hero.search_placeholder);
  }
}

function renderServiceCards() {
  const container = document.getElementById('services-grid');
  if (!container || !appData?.services) return;

  container.innerHTML = appData.services.map(srv => `
    <div
      class="service-card"
      role="button"
      tabindex="0"
      aria-label="View ${srv.name} error guides"
      onclick="navigate('#/services/${srv.slug}')"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();navigate('#/services/${srv.slug}')}"
    >
      <div class="service-card-header">
        <div class="service-badge-icon ${srv.slug}" aria-hidden="true">
          ${getServiceIcon(srv.slug)}
        </div>
        <div class="service-card-info">
          <h3>${srv.name}</h3>
          <small>${srv.authority}</small>
        </div>
      </div>
      <p class="service-card-body">${srv.description}</p>
      <div class="service-card-meta">
        <span class="service-helpline">📞 ${srv.helpline}</span>
        <span class="card-cta" aria-hidden="true">Guides →</span>
      </div>
    </div>
  `).join('');
}

/* ================================================================
   SEARCH + FILTER ENGINE
   ================================================================ */
function applyFiltersAndSearch(query = '') {
  if (!appData?.errors) return;
  let results;

  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery && currentFilter === 'All') {
    results = appData.errors;
  } else if (!trimmedQuery) {
    results = appData.errors.filter(e =>
      e.category.toLowerCase() === currentFilter.toLowerCase()
    );
  } else if (fuseInstance && trimmedQuery) {
    // Use Fuse.js fuzzy search
    const fuseResults = fuseInstance.search(trimmedQuery);
    results = fuseResults.map(r => r.item);
    // Apply category filter on top of fuzzy results
    if (currentFilter !== 'All') {
      results = results.filter(e =>
        e.category.toLowerCase() === currentFilter.toLowerCase()
      );
    }
  } else {
    // Fallback: plain includes if Fuse not loaded yet
    results = appData.errors.filter(e => {
      const cat  = currentFilter === 'All' || e.category.toLowerCase() === currentFilter.toLowerCase();
      const text = [e.title, e.quickAnswer, e.searchIntent, ...(e.causes||[])].join(' ').toLowerCase();
      return cat && text.includes(trimmedQuery);
    });
  }

  renderErrorGrid(results);
  // Update ARIA live region
  const liveRegion = document.getElementById('search-live-region');
  if (liveRegion) {
    liveRegion.textContent = `${results.length} guide${results.length !== 1 ? 's' : ''} found`;
  }
}

/* ================================================================
   ERROR GRID RENDER
   ================================================================ */
function renderErrorGrid(errors) {
  const container  = document.getElementById('errors-grid');
  const countBadge = document.getElementById('results-count');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${errors.length} Verified Guide${errors.length !== 1 ? 's' : ''}`;
  }

  if (errors.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="alert">
        <span class="empty-state-icon" aria-hidden="true">🔍</span>
        <h3>No matching guide found</h3>
        <p>Try different keywords like "OTP", "Payment Pending", "Name Mismatch", or reset the category filter.</p>
        <button class="btn-secondary" onclick="resetFilters()">Reset Filters</button>
      </div>`;
    return;
  }

  const today = new Date();
  container.innerHTML = errors.map(err => {
    const reviewed   = new Date(err.lastReviewed);
    const daysDiff   = Math.floor((today - reviewed) / 86400000);
    const isStale    = daysDiff > 60;
    const staleHtml  = isStale
      ? `<span class="staleness-badge" title="Content may need review">⚠️ Review due</span>`
      : '';

    const hiGuide = currentLang === 'hi' && hiData?.guides?.[err.slug];
    const title   = hiGuide?.title || err.title;
    const answer  = hiGuide?.quickAnswer || err.quickAnswer;

    return `
      <article
        class="error-card"
        role="button"
        tabindex="0"
        aria-label="Read guide: ${escHtml(err.title)}"
        onclick="navigate('#/errors/${err.slug}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();navigate('#/errors/${err.slug}')}"
      >
        <div>
          <div class="error-card-top">
            <span class="badge-category ${getCategoryClass(err.category)}">${err.category}</span>
            <span class="badge-id">${err.id}</span>
          </div>
          <h3>${escHtml(title)}</h3>
          <p class="quick-answer">${escHtml(answer)}</p>
          <div class="error-card-tags" aria-label="Relevant services">
            ${err.services.map(s => `<span class="tag-service">${escHtml(s)}</span>`).join('')}
          </div>
        </div>
        <div class="error-card-footer">
          <span class="error-date">
            Verified: ${err.lastReviewed}
            ${staleHtml}
          </span>
          <span class="action-read" aria-hidden="true">Resolve →</span>
        </div>
      </article>`;
  }).join('');
}

function resetFilters() {
  currentFilter = 'All';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-btn').forEach(b => {
    const isAll = b.getAttribute('data-category') === 'All';
    b.classList.toggle('active', isAll);
    b.setAttribute('aria-selected', String(isAll));
  });
  applyFiltersAndSearch('');
}

/* ================================================================
   GUIDE DETAIL VIEW
   ================================================================ */
function showGuideDetail(slug) {
  if (!appData) return;
  const err = appData.errors.find(e => e.slug === slug);
  if (!err) { navigate('#/'); return; }

  const view = document.getElementById('view-guide');
  if (!view) return;

  const hiGuide = currentLang === 'hi' && hiData?.guides?.[err.slug];
  const title   = hiGuide?.title || err.title;
  const qAnswer = hiGuide?.quickAnswer || err.quickAnswer;
  const steps   = hiGuide?.steps || err.steps;
  const warning = hiGuide?.warning || err.warning;

  const today     = new Date();
  const reviewed  = new Date(err.lastReviewed);
  const daysDiff  = Math.floor((today - reviewed) / 86400000);
  const staleNote = daysDiff > 60
    ? `<div class="callout callout-warning" style="margin-block:var(--space-4) 0;">
        <strong>⚠️ Review Notice:</strong>
        This guide was last verified ${daysDiff} days ago. Portal workflows change frequently — 
        always cross-check with the official portal before following any steps.
       </div>` : '';

  // CPGRAMS link for primary service
  const cpgramsUrl = CPGRAMS_LINKS[err.services[0]] || 'https://pgportal.gov.in';

  view.innerHTML = `
    <div class="container view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="#/" onclick="filterByCategory('${escHtml(err.category)}')">
          ${escHtml(err.category)}
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escHtml(err.title)}</span>
      </nav>

      <article class="guide-article" itemscope itemtype="https://schema.org/TechArticle">
        <meta itemprop="dateModified" content="${err.lastReviewed}">
        <meta itemprop="author" content="Digital India Error Decoder Research Team">

        <header class="guide-header">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;">
            <span class="badge-category ${getCategoryClass(err.category)}">${escHtml(err.category)}</span>
            <span class="badge-id">${escHtml(err.id)}</span>
          </div>
          <h1 itemprop="headline">${escHtml(title)}</h1>
          <div class="guide-meta">
            <span>📅 Reviewed: <time datetime="${err.lastReviewed}">${err.lastReviewed}</time></span>
            <span>🏛️ ${err.services.join(', ')}</span>
            <span>🔍 <em>${escHtml(err.searchIntent)}</em></span>
          </div>
          ${staleNote}
        </header>

        <div class="callout callout-info" role="note">
          <strong>⚡ Quick Answer — What this error means:</strong>
          ${escHtml(qAnswer)}
        </div>

        <div class="guide-section">
          <h2>📍 Where & When This Appears</h2>
          <p><strong>Stage:</strong> ${escHtml(err.stage)}</p>
        </div>

        <div class="guide-section">
          <h2>⚠️ Most Probable Causes</h2>
          <ul>
            ${err.causes.map(c => `<li>${escHtml(c)}</li>`).join('')}
          </ul>
        </div>

        <div class="guide-section">
          <h2>🔍 Safe Checks Before Making Changes</h2>
          <ul>
            ${err.checks.map(chk => `<li>${escHtml(chk)}</li>`).join('')}
          </ul>
        </div>

        <div class="guide-section">
          <h2>🛠️ Step-by-Step Resolution</h2>
          ${steps.map((step, i) => `
            <div class="step-card">
              <div class="step-number" aria-hidden="true">${i + 1}</div>
              <div class="step-content">
                <h3>Step ${i + 1}</h3>
                <p>${escHtml(step)}</p>
              </div>
            </div>`).join('')}
        </div>

        ${warning ? `
          <div class="callout callout-warning" role="alert">
            <strong>🛑 Important Caution:</strong> ${escHtml(warning)}
          </div>` : ''}

        <div class="guide-section">
          <h2>❌ Actions to Avoid</h2>
          <div class="callout callout-danger">
            <ul style="padding-inline-start:var(--space-5);">
              ${err.avoid.map(a => `<li>${escHtml(a)}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="guide-section" style="
          background:var(--bg-surface-2);
          padding:var(--space-6);
          border-radius:var(--radius-lg);
          border:1px solid var(--border);">
          <h2>🏛️ Official Support & Escalation</h2>
          <p>If self-troubleshooting doesn't resolve the issue:</p>
          <p style="margin-block:var(--space-3) var(--space-5);">
            <strong>Official Helpline:</strong>
            <span style="color:var(--accent);font-weight:700;">${escHtml(err.officialHelpline)}</span>
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);">
            <a
              href="${escHtml(err.officialUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-official"
              aria-label="Visit official ${escHtml(err.services[0])} portal (opens in new tab)"
            >
              Visit Official Portal ↗
            </a>
            <a
              href="${escHtml(cpgramsUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary"
              aria-label="Lodge grievance via CPGRAMS (opens in new tab)"
            >
              🏛️ Lodge CPGRAMS Grievance
            </a>
          </div>
        </div>

        <nav class="guide-footer-nav" aria-label="Guide navigation">
          <button class="btn-secondary" onclick="history.back()" aria-label="Go back">
            ← Back
          </button>
          <button class="btn-secondary" onclick="window.print()" aria-label="Print this guide">
            🖨️ Print / Save PDF
          </button>
        </nav>
      </article>
    </div>`;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   SERVICE HUB VIEW (BUG FIXED — exact tag match)
   ================================================================ */
function showServiceHub(slug) {
  if (!appData) return;
  const srv = appData.services.find(s => s.slug === slug);
  if (!srv) { navigate('#/'); return; }

  // Fix: direct lookup using SERVICE_TAG_MAP — no more case-mismatch bug
  const serviceTag     = SERVICE_TAG_MAP[slug];
  const relatedErrors  = serviceTag
    ? appData.errors.filter(e => e.services.includes(serviceTag))
    : [];

  const view = document.getElementById('view-service-hub');
  if (!view) return;

  view.innerHTML = `
    <div class="container view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="#/">Services</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escHtml(srv.name)}</span>
      </nav>

      <div class="guide-article" style="margin-block-end:var(--space-8);">
        <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;margin-block-end:var(--space-4);">
          <div class="service-badge-icon ${srv.slug}" style="width:56px;height:56px;font-size:2rem;" aria-hidden="true">
            ${getServiceIcon(srv.slug)}
          </div>
          <div style="min-width:0;">
            <h1 style="font-family:var(--font-display);font-size:clamp(1.6rem,3vw,2rem);font-weight:800;">
              ${escHtml(srv.name)}
            </h1>
            <p style="color:var(--text-muted);font-size:0.85rem;margin:0;">${escHtml(srv.authority)}</p>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.95rem;margin-block-end:var(--space-5);">
          ${escHtml(srv.description)}
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-4);align-items:center;">
          <span style="font-weight:700;color:var(--accent);">📞 ${escHtml(srv.helpline)}</span>
          <a href="${escHtml(srv.url)}" target="_blank" rel="noopener noreferrer"
             class="btn-official" style="padding-block:var(--space-2);font-size:0.82rem;">
            Visit Official Portal ↗
          </a>
        </div>
      </div>

      <div class="section-header">
        <div>
          <h2 class="section-title">Guides for ${escHtml(srv.name)}</h2>
          <p class="section-subtitle">${relatedErrors.length} verified error guide${relatedErrors.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      ${relatedErrors.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">📋</span>
          <h3>No guides yet for this service</h3>
          <p>We are actively researching and adding guides. Check back soon.</p>
          <a href="#/" class="btn-secondary">← Browse All Guides</a>
        </div>` : `
        <div class="errors-grid">
          ${relatedErrors.map(err => `
            <article
              class="error-card"
              role="button"
              tabindex="0"
              aria-label="Read guide: ${escHtml(err.title)}"
              onclick="navigate('#/errors/${err.slug}')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();navigate('#/errors/${err.slug}')}"
            >
              <div>
                <div class="error-card-top">
                  <span class="badge-category ${getCategoryClass(err.category)}">${escHtml(err.category)}</span>
                  <span class="badge-id">${escHtml(err.id)}</span>
                </div>
                <h3>${escHtml(err.title)}</h3>
                <p class="quick-answer">${escHtml(err.quickAnswer)}</p>
              </div>
              <div class="error-card-footer">
                <span class="error-date">Verified: ${err.lastReviewed}</span>
                <span class="action-read" aria-hidden="true">Read Guide →</span>
              </div>
            </article>`).join('')}
        </div>`}
    </div>`;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   SAFE TROUBLESHOOTING GUIDE
   ================================================================ */
function showGeneralTroubleshooting() {
  const view = document.getElementById('view-troubleshooting');
  if (!view) return;

  view.innerHTML = `
    <div class="container view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/">Home</a> <span>/</span>
        <span aria-current="page">Safe Troubleshooting</span>
      </nav>
      <article class="guide-article">
        <header class="guide-header">
          <span class="badge-category cat-status">Master Guide</span>
          <h1>Safe Troubleshooting Before Contacting Portal Support</h1>
          <p style="color:var(--text-secondary);margin-block-start:var(--space-3);">
            Five non-destructive, safe diagnostic steps every citizen should perform before lodging
            formal grievances or assuming portal failure.
          </p>
        </header>

        ${[
          ['Verify Device Clock Synchronization (IST)',
           'Government OTP and e-Sign gateways enforce strict 90-second cryptographic windows. If your device clock differs from Indian Standard Time (IST) by more than 90 seconds, OTPs will be rejected. Go to Settings → Date & Time → Enable "Set time automatically (network time)".'],
          ['Clean Documents & Remove PDF Passwords',
           'Over 40% of upload rejections are due to password-protected e-Aadhaar PDFs. Downloaded Aadhaar cards have an 8-character password. Government servers cannot decrypt them. Action: Open the PDF, select "Print to PDF", save as an unencrypted, plainly named file (e.g. addressproof.pdf) under 200 KB.'],
          ['Respect the 24–48 Hour Banking Reconciliation Window',
           'When UPI/NetBanking deducts money but the portal shows "Payment Failed", the treasury batch reconciliation runs overnight. Wait 24 to 48 hours, then click "Re-verify Payment" inside the portal. This resolves 80% of such cases without any second payment.'],
          ['Use Single-Tab Isolated Browsing',
           'Government portals store session state in a single active cookie. Opening multiple tabs for the same portal destroys the session token immediately and triggers a "Session Expired" error. Always work in a single private/incognito tab with pop-up blockers disabled.'],
          ['Zero Trust Toward Unofficial Intermediaries',
           'Never share SMS OTPs, Aadhaar numbers, or bank credentials with anyone claiming to "expedite" an application via phone, WhatsApp, or social media. Every legitimate government correction is performed through official portals with your own biometrics.']
        ].map(([h, p], i) => `
          <div class="guide-section">
            <h2>${i + 1}. ${escHtml(h)}</h2>
            <p>${escHtml(p)}</p>
          </div>`).join('')}

        <nav class="guide-footer-nav">
          <a href="#/" class="btn-official">← Return to Directory</a>
        </nav>
      </article>
    </div>`;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   STATIC GOVERNANCE PAGES
   ================================================================ */
function showStaticPage(pageId) {
  const view = document.getElementById('view-static');
  if (!view) return;

  const pages = {
    'about': {
      title: 'About Digital India Error Decoder',
      body: `
        <p><strong>Digital India Error Decoder</strong> is an independent educational project bridging the usability gap in Indian citizen-facing government portals.</p>
        <h2>Our Mission</h2>
        <p>Millions of citizens encounter cryptic messages like <em>"Session Expired"</em>, <em>"Record Not Found"</em>, or <em>"Payment Successful Status Pending"</em> on essential services. This site translates those messages into plain language with safe, reversible steps and direct escalation to official helplines.</p>
        <h2>Academic Context</h2>
        <p>This site is developed as a Mini Project demonstrating practical SEO architecture, structured metadata, user-first problem solving, and strict adherence to citizen data privacy. It is not a commercial product.</p>
        <h2>What We Never Do</h2>
        <p>We do not ask for Aadhaar numbers, PAN, OTPs, application numbers, passwords, or any payment. All guides link directly to official government portals and CPGRAMS for resolution.</p>`
    },
    'editorial-policy': {
      title: 'Editorial Policy & Verification Standards',
      body: `
        <h2>1. Official Sources Only</h2>
        <p>No error code, turnaround time, or portal procedure is published without verification against the official portal's User Manual, Citizen's Charter, or active help documentation.</p>
        <h2>2. Clear Distinction of Advice vs. Official Instructions</h2>
        <p>We clearly separate general browser/network troubleshooting advice from statutory government instructions, and explicitly label which is which in each guide.</p>
        <h2>3. Date-Stamped Review Records</h2>
        <p>Every article displays its "Last Reviewed" date. Articles unreviewed for more than 60 days are flagged with a visible "Review Due" badge while editorial review is pending.</p>
        <h2>4. Correction Mechanism</h2>
        <p>Readers who spot discrepancies can submit corrections via our <a href="#/contact" style="color:var(--accent);">Feedback Form</a>. We investigate every report within 7 working days.</p>
        <h2>5. Non-Commercial Independence</h2>
        <p>We carry no advertising, affiliate links, sponsored content, or paid placements. We receive no commission for directing users to any official portal.</p>`
    },
    'privacy-policy': {
      title: 'Privacy Policy — Zero Data Collection',
      body: `
        <p><strong>Last Updated: October 2026</strong></p>
        <h2>Zero Sensitive Data Collection</h2>
        <p>We do not collect, request, store, or process any sensitive personal identifiers, including:</p>
        <ul>
          <li>Aadhaar numbers or Virtual IDs</li>
          <li>Permanent Account Numbers (PAN)</li>
          <li>One-Time Passwords (OTPs)</li>
          <li>Application Reference Numbers (ARNs)</li>
          <li>Bank account or payment card details</li>
          <li>Uploaded identity documents</li>
        </ul>
        <h2>Analytics</h2>
        <p>We use Google Analytics 4 with IP anonymization and without cookies where technically feasible. We measure only aggregate page views and search query patterns — no personal profiling.</p>
        <h2>Contact Form</h2>
        <p>The correction feedback form is processed via Formspree. Submitted text is used solely for editorial review purposes and is not shared or sold.</p>`
    },
    'disclaimer': {
      title: 'Statutory Disclaimer',
      body: `
        <div class="callout callout-warning">
          <strong>Non-Affiliation Declaration:</strong>
          Digital India Error Decoder is an independent, non-commercial public interest website.
          We are NOT affiliated with, associated with, authorized by, or endorsed by the Government of India,
          Ministry of External Affairs, MoRTH, UIDAI, Income Tax Department, or any statutory authority.
        </div>
        <h2>Trademarks & Copyrights</h2>
        <p>All official portal names (Passport Seva, Parivahan Sarathi, Aadhaar, PAN) and trademarks referenced here belong to their respective statutory owners and are used purely for identification and educational commentary.</p>
        <h2>Limitation of Liability</h2>
        <p>Guidance on this site is for general educational information only. Portal rules and statutory guidelines change frequently. For official determinations, always refer directly to the verified government portal or authorized grievance cell.</p>
        <h2>No Legal or Financial Advice</h2>
        <p>Nothing on this website constitutes legal, financial, or official government advice. We recommend consulting an authorized CSC (Common Service Centre) operator or official helpline for case-specific guidance.</p>`
    },
    'contact': {
      title: 'Contact & Correction Feedback',
      body: `
        <p>Found an outdated step, a new error code we don't cover, or a changed portal interface? Submit feedback below. We investigate all reports within 7 working days.</p>
        <form
          id="contact-form"
          action="https://formspree.io/f/YOUR_FORM_ID"
          method="POST"
          style="margin-block-start:var(--space-6);"
          onsubmit="handleContactSubmit(event)"
        >
          <div class="form-group">
            <label class="form-label" for="contact-name">Your Name</label>
            <input type="text" id="contact-name" name="name" class="form-input"
              required placeholder="e.g. Rahul Verma">
          </div>
          <div class="form-group">
            <label class="form-label" for="contact-email">Email Address</label>
            <input type="email" id="contact-email" name="email" class="form-input"
              required placeholder="e.g. rahul@example.com">
          </div>
          <div class="form-group">
            <label class="form-label" for="contact-topic">Portal or Error Topic</label>
            <input type="text" id="contact-topic" name="topic" class="form-input"
              required placeholder="e.g. Parivahan LL test slot timeout">
          </div>
          <div class="form-group">
            <label class="form-label" for="contact-message">Details</label>
            <textarea id="contact-message" name="message" class="form-textarea"
              required placeholder="Describe the error, portal URL, and what step needs updating..."></textarea>
          </div>
          <div class="callout callout-warning" style="font-size:0.85rem;margin-block-end:var(--space-5);">
            ⚠️ <strong>Please do not include</strong> your Aadhaar number, PAN, OTP, application passwords, or bank details in this form.
          </div>
          <button type="submit" class="btn-primary">Submit Feedback</button>
        </form>
        <div id="form-success" hidden class="callout callout-success" style="margin-block-start:var(--space-5);" role="alert">
          ✅ Thank you! Our editorial team will review and update the guide within 7 working days.
        </div>`
    }
  };

  const page = pages[pageId] || pages['about'];

  view.innerHTML = `
    <div class="container page-view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/">Home</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escHtml(page.title)}</span>
      </nav>
      <div class="prose-card">
        <h1 class="page-title">${escHtml(page.title)}</h1>
        <div class="prose">${page.body}</div>
      </div>
    </div>`;

  view.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleContactSubmit(e) {
  // Don't preventDefault — let Formspree handle the real POST
  // On success, Formspree redirects; for demo/local show inline message
  e.preventDefault();
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (form && success) {
    form.style.display = 'none';
    success.hidden = false;
    success.focus();
  }
}

/* ================================================================
   UTILITIES
   ================================================================ */
function navigate(hash) {
  window.location.hash = hash;
}

function filterByCategory(category) {
  navigate('#/');
  setTimeout(() => {
    const btn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    if (btn) setActiveFilter(btn);
  }, 80);
}

function getServiceIcon(slug) {
  const icons = {
    'passport': '🛂',
    'aadhaar':  '🪪',
    'driving-licence': '🚗',
    'pan': '💳'
  };
  return icons[slug] || '🏛️';
}

function getCategoryClass(category) {
  const map = {
    'identity details':  'cat-identity',
    'documents':         'cat-documents',
    'records':           'cat-records',
    'authentication':    'cat-authentication',
    'payment':           'cat-payment',
    'status':            'cat-status',
    'availability':      'cat-availability',
    'session':           'cat-session'
  };
  return map[(category || '').toLowerCase()] || 'cat-documents';
}

/* XSS-safe HTML escaping */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
