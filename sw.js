const CACHE_VERSION = 'v14';
const CACHE_NAME = `shaktiq-cache-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `shaktiq-data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './logo.webp',
  './logo.png',
  './logo-white.webp',
  './logo-white.png',
  './hero-museum.webp',
  './hero-museum.png',
  './bodhi-tree.webp',
  './bodhi-tree.png',
  './yt-logo.webp',
  './yt-logo.png',
  './favicon.ico',
  './favicon.png',
  './favicon-48x48.png',
  './favicon-96x96.png',
  './favicon-192x192.png',
  './favicon-512x512.png',
  './apple-touch-icon.png',
  './share-card.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-caching skipped: ${asset}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log(`[SW] Purging stale cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Question Bank Data handling (versioned data cache with background update check)
  if (url.pathname.includes('questions.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put('./questions.json', clone);
              cache.put(event.request.url, networkResponse.clone());
            }).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const dataCache = await caches.open(DATA_CACHE_NAME);
          const cachedMatch = await dataCache.match('./questions.json') ||
                              await dataCache.match(event.request.url) ||
                              await caches.match('./questions.json');
          if (cachedMatch) return cachedMatch;
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Navigation requests (App Shell - Network first, fallback to cached index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('./index.html') || await caches.match('./');
          return cached;
        })
    );
    return;
  }

  // 3. Network first for other scripts/styles
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Stale-while-revalidate for local static assets (images, icons, manifest)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch(() => {});
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
