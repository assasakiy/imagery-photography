/*
 * Service Worker — Sopian Lalu Imagery (dashboard PWA)
 * Strategi:
 *  - Navigasi (halaman): network-first, fallback cache, fallback /offline
 *  - Aset build (/build/*): stale-while-revalidate
 *  - API & non-GET: tidak pernah di-cache
 */
const VERSION = 'v1';
const CACHE = `sli-pwa-${VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.add(OFFLINE_URL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;
    if (url.pathname === '/sw.js') return;

    // Navigasi halaman: network-first → cache → offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(async () =>
                    (await caches.match(request)) ||
                    (await caches.match(OFFLINE_URL)) ||
                    Response.error()
                )
        );
        return;
    }

    // Aset statis build: stale-while-revalidate
    if (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/icons/') ||
        /\.(?:png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const refresh = fetch(request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            const copy = response.clone();
                            caches.open(CACHE).then((cache) => cache.put(request, copy));
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached || refresh;
            })
        );
    }
});
