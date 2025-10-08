importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precaching, routing, strategies, backgroundSync } = workbox;

precaching.precacheAndRoute(self.__WB_MANIFEST || []);

routing.registerRoute(
  ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
  new strategies.NetworkFirst({
    cacheName: 'app-shell',
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true })
    ]
  })
);

routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/knowledge'),
  new strategies.StaleWhileRevalidate({ cacheName: 'knowledge-cache' })
);

const bgSyncPlugin = new backgroundSync.BackgroundSyncPlugin('draft-sync', {
  maxRetentionTime: 60
});

routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/rules/apply'),
  new strategies.NetworkOnly({ plugins: [bgSyncPlugin] })
);
