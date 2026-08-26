/*
 * Service Worker — Sopian Lalu Imagery (dashboard PWA)
 * Strategi:
 *  - Navigasi (halaman): network-first, fallback cache, fallback /offline
 *  - Aset build (/build/*): stale-while-revalidate
 *  - API & non-GET: tidak pernah di-cache
 */
const VERSION = 'v2';
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

// ─── Web Push ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'Imagery', body: event.data.text() };
    }

    const title = payload.title || 'Imagery';
    const options = {
        body: payload.body || '',
        icon: '/icons/pwa-192.png',
        badge: '/icons/pwa-192.png',
        tag: payload.tag || 'imagery-push',
        data: payload.data || {},
        vibrate: [100, 50, 100],
    };

    event.waitUntil(
        self.registration.showNotification(title, options).then(() => {
            return updateBadgeCount(self.clients);
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Fokus ke tab yang sudah terbuka
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    if (client.navigate) client.navigate(url);
                    return;
                }
            }
            // Buka tab baru
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// ─── Badge API (unread count) ──────────────────────────────
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SET_BADGE') {
        const count = event.data.count || 0;
        setBadge(self.registration, count);
    }
});

function updateBadgeCount(clients) {
    return clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
            client.postMessage({ type: 'BADGE_REFRESH' });
        }
    });
}

function setBadge(registration, count) {
    if ('setAppBadge' in registration) {
        if (count > 0) {
            registration.setAppBadge(count).catch(() => {});
        } else {
            registration.clearAppBadge().catch(() => {});
        }
    }
}
