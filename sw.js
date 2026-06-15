// Questline Service Worker — offline-first caching strategy
const CACHE_NAME = 'questline-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/parts/base.css',
  '/css/parts/components.css',
  '/css/parts/flow.css',
  '/css/parts/console.css',
  '/css/parts/profile.css',
  '/css/parts/daily.css',
  '/css/parts/atlas.css',
  '/js/app.js',
  '/js/data.js',
  '/js/sites.js',
  '/js/state.js',
  '/js/render.js',
  '/js/events.js',
  '/js/console.js',
  '/js/icons-fa.js',
  '/js/utils.js',
  '/js/modal.js',
  '/js/banners.js',
  '/js/flow.js',
  '/js/glossary.js',
  '/js/keynav.js',
  '/js/quickmenu.js',
  '/js/splash.js',
  '/js/coach.js',
  '/js/celebrate.js',
  '/js/search.js',
  '/js/chapterReader.js',
  '/js/profile.js',
  '/js/playbooks.js',
  '/js/atlas.js',
  '/js/kiwi.js',
  '/js/engagement.js',
  '/js/logos.js',
  '/js/daily.js',
  '/js/particles.js',
  '/js/share.js',
  '/js/scrollProgress.js',
  '/manifest.json',
  '/favicon.ico',
];

// Install: cache the static shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Same-origin static assets: serve from cache, fall back to network
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cache successful GETs of CSS/JS for future offline use
          if (request.method === 'GET' && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // External requests: network only (do not cache cross-origin)
  e.respondWith(fetch(request));
});
