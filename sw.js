/**
 * Digital India Error Decoder — Service Worker (PWA)
 * Strategy: Cache-First for static assets, Network-First for data
 */

const CACHE_NAME    = 'ied-v10';
const DATA_CACHE    = 'ied-data-v2';
const OFFLINE_URL   = '/';

// Static assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/data/errors-data.json',
  '/i18n/hi.json',
  '/portal-status.json'
];

// Install — precache static shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove stale caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== DATA_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — Cache-First for CSS/JS/fonts, Network-First for JSON data
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) return;

  // JSON data: Network-First (stay fresh), fallback to cache
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache =>
        fetch(request)
          .then(response => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Static assets: Cache-First, fallback to network then offline page
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});
