/**
 * Digital India Error Decoder — Production Application Core
 *
 * Fixes & Enhancements in this version:
 *  1. Service hub matching bug fixed (case-insensitive exact tag match)
 *  2. Fuzzy search via Fuse.js (loaded from CDN)
 *  3. Synonym mapping for natural-language and Hinglish searches
 *  4. Route-specific metadata and structured data
 *  5. ARIA live region updates for screen readers
 *  6. Full keyboard navigation (tabindex, role, keydown Enter/Space)
 *  7. Portal status banner from portal-status.json
 *  8. Content staleness badge (>60 days since lastReviewed)
 *  9. Hindi / English language switcher
 * 10. Contact route explains that feedback is not configured
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
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery && window.location.pathname === '/' && (!window.location.hash || ['#', '#/'].includes(window.location.hash))) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = initialQuery;
      applyFiltersAndSearch(initialQuery);
    }
  }
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
   MANUALLY MAINTAINED PORTAL STATUS SNAPSHOT
   ================================================================ */
async function checkPortalStatus() {
  try {
    const res    = await fetch('portal-status.json');
    const data   = await res.json();
    const issues = data.portals.filter(p => p.status !== 'operational');
    const banner = document.getElementById('portal-status-banner');
    if (banner) {
      const updatedAt = data.updated ? Date.parse(`${data.updated}T00:00:00Z`) : NaN;
      const isStale = !Number.isFinite(updatedAt) || Date.now() - updatedAt > 48 * 60 * 60 * 1000;
      const summary = issues.length
        ? `Recorded issues: ${issues.map(p => `${p.name}${p.note ? ` (${p.note})` : ''}`).join('; ')}.`
        : 'The saved file lists all portals as operational.';
      const ageNote = isStale ? ' This snapshot may be outdated.' : '';
      banner.textContent = `Manual status snapshot dated ${data.updated || 'unknown'}: ${summary}${ageNote} This is not a live check; confirm directly with the official portal.`;
      banner.classList.add('visible');
    }
  } catch { /* Non-critical — silent fail */ }
}

/* ================================================================
   THEME
   ================================================================ */
function initTheme() {
  const saved = localStorage.getItem('ied_theme') || 'light';
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

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="/"]');
    if (!link || event.defaultPrevented || link.target || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

    navigate(`${destination.pathname}${destination.search}`);
  });

  window.addEventListener('popstate', handleRouting);
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
  const hash = getRouteFromLocation();
  hideAllViews();

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

  updateRouteMetadata(hash);
}

function getRouteFromLocation() {
  if (window.location.hash.startsWith('#/')) return window.location.hash;

  const pathname = decodeURIComponent(window.location.pathname).replace(/\/+$/, '') || '/';
  if (pathname === '/' || pathname === '/index.html' || pathname === '/errors') return '#/';
  if (pathname === '/guides/safe-troubleshooting-before-contacting-support') {
    return '#/guides/safe-troubleshooting';
  }
  if (/^\/(errors|services)\/[^/]+$/.test(pathname)) return `#${pathname}`;
  if (/^\/(about|editorial-policy|privacy-policy|disclaimer|contact)$/.test(pathname)) {
    return `#${pathname}`;
  }
  return '#/';
}

function updateRouteMetadata(hash) {
  const route = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  let canonicalPath = route === '/' ? '/' : `${route}/`;
  let title = 'Error Decoder India | Safe Help for Government Portals';
  let description = 'Plain-language troubleshooting for Aadhaar, PAN, Passport Seva, and Parivahan errors. Find safe next steps and official support contacts.';
  const errorMatch = route.match(/^\/errors\/([^/]+)$/);
  const serviceMatch = route.match(/^\/services\/([^/]+)$/);
  const staticMatch = route.match(/^\/(about|editorial-policy|privacy-policy|disclaimer|contact)$/);

  if (errorMatch) {
    const error = appData?.errors.find(item => item.slug === errorMatch[1]);
    if (error) {
      title = `${error.title} | Error Decoder`;
      description = `Understand ${error.title.toLowerCase()} and review safe next steps and official support contacts.`;
      canonicalPath = `/errors/${error.slug}/`;
    } else {
      canonicalPath = '/';
    }
  } else if (serviceMatch) {
    const service = appData?.services.find(item => item.slug === serviceMatch[1]);
    if (service) {
      title = `${service.name} Errors & Help | Error Decoder`;
      description = `Troubleshooting guides for ${service.name}: find related portal errors, safe checks, and official support contacts.`;
      canonicalPath = `/services/${service.slug}/`;
    } else {
      canonicalPath = '/';
    }
  } else if (route === '/guides/safe-troubleshooting') {
    title = 'Safe Government Portal Troubleshooting | Error Decoder';
    description = 'Non-destructive checks for portal errors, payment delays, document uploads, and account security.';
    canonicalPath = '/guides/safe-troubleshooting-before-contacting-support/';
  } else if (staticMatch) {
    const pages = {
      about: ['About Digital India Error Decoder', 'About this independent educational resource for understanding Indian public-service portal errors.'],
      'editorial-policy': ['Editorial Policy & Verification Standards', 'How this project handles sources, review dates, corrections, and portal-specific guidance.'],
      'privacy-policy': ['Privacy & Data Use', 'What this static build does and does not send, and what to consider before deployment.'],
      disclaimer: ['Disclaimer | Error Decoder', 'This independent educational project is not affiliated with government departments or statutory portals.'],
      contact: ['Correction Submissions', 'Correction submissions are unavailable in this build because no feedback service is configured.']
    };
    [title, description] = pages[staticMatch[1]];
    canonicalPath = `/${staticMatch[1]}/`;
  } else if (route !== '/') {
    canonicalPath = '/';
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const openGraphTitle = document.querySelector('meta[property="og:title"]');
  const openGraphDescription = document.querySelector('meta[property="og:description"]');
  const openGraphUrl = document.querySelector('meta[property="og:url"]');
  const origin = canonical ? new URL(canonical.href).origin : window.location.origin;
  const canonicalUrl = new URL(canonicalPath, `${origin}/`).href;
  const conciseDescription = description.replace(/\s+/g, ' ').trim();

  document.title = title;
  if (descriptionMeta) descriptionMeta.setAttribute('content', conciseDescription);
  if (canonical) canonical.setAttribute('href', canonicalUrl);
  if (openGraphTitle) openGraphTitle.setAttribute('content', title);
  if (openGraphDescription) openGraphDescription.setAttribute('content', conciseDescription);
  if (openGraphUrl) openGraphUrl.setAttribute('content', canonicalUrl);

  const error = errorMatch && appData?.errors.find(item => item.slug === errorMatch[1]);
  const service = serviceMatch && appData?.services.find(item => item.slug === serviceMatch[1]);
  let pageSchema = null;
  let breadcrumbNames = ['Home'];

  if (error) {
    pageSchema = {
      '@type': 'TechArticle',
      headline: title,
      description: conciseDescription,
      mainEntityOfPage: canonicalUrl,
      articleSection: error.category
    };
    breadcrumbNames.push(error.category, error.title);
  } else if (service) {
    pageSchema = {
      '@type': 'CollectionPage',
      name: title,
      description: conciseDescription,
      url: canonicalUrl
    };
    breadcrumbNames.push('Services', service.name);
  } else if (route === '/guides/safe-troubleshooting') {
    pageSchema = {
      '@type': 'Article',
      headline: title,
      description: conciseDescription,
      mainEntityOfPage: canonicalUrl
    };
    breadcrumbNames.push('Guides', 'Safe Troubleshooting');
  }

  const routeSchema = document.getElementById('route-structured-data');
  if (pageSchema) {
    const breadcrumbs = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbNames.map((name, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        ...(index === breadcrumbNames.length - 1 ? { item: canonicalUrl } : {})
      }))
    };
    const schemaScript = routeSchema || document.createElement('script');
    schemaScript.id = 'route-structured-data';
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [pageSchema, breadcrumbs]
    }).replace(/</g, '\\u003c');
    if (!routeSchema) document.head.appendChild(schemaScript);
  } else {
    routeSchema?.remove();
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
    <a
      href="/services/${srv.slug}/"
      class="service-card"
      aria-label="View ${srv.name} error guides"
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
    </a>
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
    countBadge.textContent = `${errors.length} Guide${errors.length !== 1 ? 's' : ''}`;
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
      <a
        href="/errors/${err.slug}/"
        class="error-card"
        aria-label="Read guide: ${escHtml(err.title)}"
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
            Review date: ${err.lastReviewed}
            ${staleHtml}
          </span>
          <span class="action-read" aria-hidden="true">Resolve →</span>
        </div>
      </a>`;
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
                This guide's recorded review date is ${daysDiff} days ago. Portal workflows change frequently —
        always cross-check with the official portal before following any steps.
       </div>` : '';

  // CPGRAMS link for primary service
  const cpgramsUrl = CPGRAMS_LINKS[err.services[0]] || 'https://pgportal.gov.in';

  view.innerHTML = `
    <div class="container view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/" onclick="filterByCategory('${escHtml(err.category)}')">
          ${escHtml(err.category)}
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escHtml(err.title)}</span>
      </nav>

      <article class="guide-article">
        <header class="guide-header">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;">
            <span class="badge-category ${getCategoryClass(err.category)}">${escHtml(err.category)}</span>
            <span class="badge-id">${escHtml(err.id)}</span>
          </div>
          <h1 itemprop="headline">${escHtml(title)}</h1>
          <div class="guide-meta">
            <span>Recorded review date: <time datetime="${err.lastReviewed}">${err.lastReviewed}</time></span>
            <span>🏛️ ${err.services.join(', ')}</span>
            <span>🔍 <em>${escHtml(err.searchIntent)}</em></span>
          </div>
          ${staleNote}
        </header>

        <div class="callout callout-warning" role="note">
          <strong>Source check:</strong> Claim-level references are incomplete in this build. Confirm portal-specific requirements and timelines through the linked official portal before acting.
        </div>

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
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/">Services</a>
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
          <p class="section-subtitle">${relatedErrors.length} error guide${relatedErrors.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      ${relatedErrors.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">📋</span>
          <h3>No guides yet for this service</h3>
          <p>We are actively researching and adding guides. Check back soon.</p>
          <a href="/" class="btn-secondary">← Browse All Guides</a>
        </div>` : `
        <div class="errors-grid">
          ${relatedErrors.map(err => `
            <a
              href="/errors/${err.slug}/"
              class="error-card"
              aria-label="Read guide: ${escHtml(err.title)}"
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
                <span class="error-date">Review date: ${err.lastReviewed}</span>
                <span class="action-read" aria-hidden="true">Read Guide →</span>
              </div>
            </a>`).join('')}
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
        <a href="/">Home</a> <span>/</span>
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
          ['Check Device Date and Time',
           'An incorrect device clock can interfere with time-based authentication. Enable automatic date and time, then request a fresh OTP if the portal allows it. Follow the portal’s own retry and lockout instructions.'],
          ['Check Document Requirements',
           'Portals may limit file type, size, dimensions, or password protection. Check the instructions for the exact application before editing a document. e-Aadhaar PDFs may be password protected; use UIDAI instructions and avoid uploading identity documents to unknown conversion sites.'],
          ['Check Payment Status Before Paying Again',
           'If money was debited but the application still shows pending, check the official portal’s payment-status or receipt page and your bank statement. Do not pay again until the portal or bank confirms the first transaction failed. Follow the reconciliation window shown by the portal or payment provider.'],
          ['Keep the Session Stable',
           'Some portals limit how many active sessions or tabs can be used at once. If a session expires, return through the official portal and check whether a draft or application was saved before restarting.'],
          ['Zero Trust Toward Unofficial Intermediaries',
           'Never share SMS OTPs, Aadhaar numbers, or bank credentials with anyone claiming to "expedite" an application via phone, WhatsApp, or social media. Every legitimate government correction is performed through official portals with your own biometrics.']
        ].map(([h, p], i) => `
          <div class="guide-section">
            <h2>${i + 1}. ${escHtml(h)}</h2>
            <p>${escHtml(p)}</p>
          </div>`).join('')}

        <nav class="guide-footer-nav">
          <a href="/" class="btn-official">← Return to Directory</a>
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
        <h2>1. Source Records</h2>
        <p>Portal-specific claims should link to the relevant official instruction, notice, or Citizen's Charter section. A general portal homepage is not evidence for every procedure or timeline. Source records and independent verification are not yet complete for all guides in this build.</p>
        <h2>2. Clear Distinction of Advice vs. Official Instructions</h2>
        <p>We clearly separate general browser/network troubleshooting advice from statutory government instructions, and explicitly label which is which in each guide.</p>
        <h2>3. Review Dates</h2>
        <p>Displayed dates are recorded review dates, not proof of independent verification. Review status should be confirmed against the cited source before acting on portal-specific instructions.</p>
        <h2>4. Correction Mechanism</h2>
        <p>This build has no configured feedback service. The contact page explains this limitation; correction links should not imply that a report has been submitted.</p>
        <h2>5. Non-Commercial Independence</h2>
        <p>We carry no advertising, affiliate links, sponsored content, or paid placements. We receive no commission for directing users to any official portal.</p>`
    },
    'privacy-policy': {
      title: 'Privacy & Data Use',
      body: `
        <p>This static build does not configure analytics or a feedback submission service. Search terms stay in your browser and are not sent by this application.</p>
        <p>The hosting provider may process request metadata such as IP addresses in server logs. A production privacy notice must name the actual host, its retention period, and any analytics or feedback processors before those services are enabled.</p>
        <p>Do not enter application details or sensitive personal information into this site. For account-specific help, contact the relevant official portal.</p>`
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
        <p>All official portal names (Passport Seva, Parivahan Sarathi, Aadhaar, PAN) and trademarks referenced here belong to their respective statutory owners and are used for identification and educational commentary.</p>
        <h2>Limitation of Liability</h2>
        <p>Guidance on this site is for general educational information only. Portal rules and statutory guidelines change frequently. For official determinations, always refer directly to the verified government portal or authorized grievance cell.</p>
        <h2>No Legal or Financial Advice</h2>
        <p>Nothing on this website constitutes legal, financial, or official government advice. We recommend consulting an authorized CSC (Common Service Centre) operator or official helpline for case-specific guidance.</p>`
    },
    'contact': {
      title: 'Correction Submissions',
      body: `
        <p>Correction submissions are not available in this build because no feedback service or contact address is configured.</p>
        <div class="callout callout-warning" role="status">
          <strong>Nothing is sent or stored here.</strong> Do not enter personal or application details. For help with an active application, use the relevant official portal or helpline.
        </div>`
    }
  };

  const page = pages[pageId] || pages['about'];

  view.innerHTML = `
    <div class="container page-view-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
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

/* ================================================================
   UTILITIES
   ================================================================ */
function navigate(hash) {
  const path = hash.startsWith('#/') ? hash.slice(1) : hash;
  window.history.pushState({}, '', path);
  handleRouting();
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
