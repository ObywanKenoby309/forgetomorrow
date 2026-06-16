// public/sw.js
// ForgeTomorrow PWA Service Worker
// Handles: push notifications, notification clicks, basic offline shell caching.

const CACHE_NAME = 'forgetomorrow-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {
      // Non-fatal — shell caching is a nice-to-have, never block install
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old cache versions ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first, falling back to cache for navigation requests ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Only intercept navigation (page loads), let everything else pass through
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
  }
});

// ─── Push: receive a push event and show a notification ───────────────────
self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'ForgeTomorrow', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'ForgeTomorrow';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    data: {
      url: payload.url || '/',
      notificationId: payload.notificationId || null,
    },
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click: open or focus the relevant page ──────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      // If a window is already open on this origin, focus it and navigate
      for (const client of clientsList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Push subscription change (browser rotates the subscription) ─────────
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : undefined)
      .then((subscription) =>
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
      )
      .catch(() => {
        // Silent — user will re-subscribe next time they open the app if this fails
      })
  );
});