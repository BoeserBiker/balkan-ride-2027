const CACHE_PREFIX = 'balkan-ride-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v128`;
const ICON_PATHS = ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      self.registration.scope,
      new URL('version.json', self.registration.scope),
      new URL('manifest.json?v=4', self.registration.scope),
      ...ICON_PATHS.map((path) => new URL(`${path}?v=3`, self.registration.scope)),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (request.method !== 'GET' || requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) {
    return;
  }

  if (request.mode === 'navigate' || requestUrl.pathname === new URL('version.json', scopeUrl).pathname) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request.mode === 'navigate' ? self.registration.scope : request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request.mode === 'navigate' ? self.registration.scope : request);
        if (cached) {
          return cached;
        }
        throw error;
      }
    })());
    return;
  }

  if (requestUrl.pathname.includes('/assets/')
    || ICON_PATHS.some((path) => requestUrl.pathname === new URL(path, scopeUrl).pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      if (requestUrl.pathname.includes('/assets/gpx/')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          throw error;
        }
      }
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
