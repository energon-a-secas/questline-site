// Questline Service Worker — offline-first caching strategy
const CACHE_NAME = 'questline-v6';
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
  '/js/register-sw.js',
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
  '/icon-192.svg',
  '/icon-512.svg',
  '/energon-classic-logo.png',
  '/og-preview.jpg',
  '/assets/logos/figma.svg',
  '/assets/logos/github.svg',
  '/assets/logos/vercel.svg',
  '/assets/logos/slack.svg',
  '/assets/logos/confluence.svg',
  '/assets/logos/canva.svg',
  '/assets/icons/lobehub/aws.svg',
  '/assets/icons/lobehub/azure.svg',
  '/assets/icons/lobehub/googlecloud.svg',
  '/assets/icons/lobehub/microsoft.svg',
  '/assets/icons/lobehub/github.svg',
  '/assets/icons/lobehub/figma.svg',
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

// Fetch strategy by asset class:
//   • cross-origin            → network only (no caching of fonts/analytics/etc.)
//   • code (JS modules, CSS,  → NETWORK-FIRST. The ES-module import graph is
//     HTML)                     all-or-nothing: one stale module with a renamed
//                               export white-screens the whole app. Always
//                               prefer fresh code when online; fall back to
//                               cache only when offline.
//   • everything else (images,→ stale-while-revalidate for instant paint.
//     fonts, manifest, icons)
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // External requests: network only (do not cache cross-origin fonts, analytics, etc.)
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(request));
    return;
  }

  // Code assets — network-first so a stale cached module can never break the
  // import graph on deploy. Cache is updated on every successful fetch and
  // used only as an offline fallback.
  const isCode = request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document' ||
    /\.(?:js|mjs|css)$/.test(url.pathname);

  if (isCode) {
    e.respondWith(
      fetch(request).then((response) => {
        if (request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Other same-origin assets: serve from cache immediately, then refresh from
  // the network in the background so updates are not blocked by the cache.
  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchAndCache = fetch(request).then((response) => {
        if (request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchAndCache;
    })
  );
});
