const CACHE_NAME = 'finbot-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.includes('/api/') || url.hostname.includes('onrender.com')) {
    event.respondWith(fetch(request).catch(() => new Response('{"error":"offline"}', {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(fetch(request));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FinBot Alert';
  const options = {
    body: data.body || 'Price alert triggered!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'View' }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
