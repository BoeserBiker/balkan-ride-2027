const CACHE_PREFIX = 'balkan-ride-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v167`;
const NETWORK_TIMEOUT_MS = 3000;
const ICON_PATHS = ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png'];
const DATA_FILE_PATTERN = /\.(?:gpx|zip|json|md|avif|gif|jpe?g|png|webp)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifestUrl = new URL('asset-manifest.json', self.registration.scope);
    const manifestResponse = await fetch(new Request(manifestUrl, { cache: 'reload' }));
    if (!manifestResponse.ok) {
      throw new Error(`Build-Manifest konnte nicht geladen werden: HTTP ${manifestResponse.status}`);
    }
    const manifest = await manifestResponse.json();
    const entry = Object.entries(manifest).find(([, asset]) => asset.isEntry && asset.src === 'index.html');
    if (!entry) throw new Error('Build-Manifest enthält keinen Einstiegspunkt index.html.');

    const coreAssets = new Set();
    const visited = new Set();
    function collectCoreAssets(key) {
      if (visited.has(key)) return;
      visited.add(key);
      const asset = manifest[key];
      if (!asset) throw new Error(`Build-Manifest verweist auf einen fehlenden Eintrag: ${key}`);
      if (asset.file) coreAssets.add(asset.file);
      (asset.css ?? []).forEach((file) => coreAssets.add(file));
      (asset.imports ?? []).forEach(collectCoreAssets);
    }
    collectCoreAssets(entry[0]);

    await cache.addAll([
      new Request(self.registration.scope, { cache: 'reload' }),
      new Request(new URL('version.json', self.registration.scope), { cache: 'reload' }),
      new Request(new URL('manifest.json', self.registration.scope), { cache: 'reload' }),
      new Request(manifestUrl, { cache: 'reload' }),
      new Request(new URL('favicon.svg?v=4', self.registration.scope), { cache: 'reload' }),
      ...ICON_PATHS.map((path) => new Request(new URL(path, self.registration.scope), { cache: 'reload' })),
      ...[...coreAssets].map((file) => new Request(new URL(file, self.registration.scope), { cache: 'reload' })),
    ]);
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function cacheKey(request, scopeUrl) {
  return request.mode === 'navigate' ? scopeUrl.href : request;
}

function offlineResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Offline-Fallback', 'true');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isTourDataUrl(url) {
  return (/\/assets\/gpx\/.+\.(?:gpx|zip)$/i.test(url.pathname)
      || /\/assets\/.+\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname)
      || /\/(?:content|data|stages)\//i.test(url.pathname)
      || /\/roadbook-data\.json$/i.test(url.pathname))
    && DATA_FILE_PATTERN.test(url.pathname);
}

async function notifyChangedData(url, changes = {}) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: 'TOUR_DATA_UPDATED', url, ...changes }));
}

async function changedRoadbookData(previous, current) {
  const [oldData, newData] = await Promise.all([
    previous.clone().json(),
    current.clone().json(),
  ]);
  const oldDays = new Map((oldData.days ?? []).map((day) => [Number(day.frontmatter?.tag), day]));
  const newDays = new Map((newData.days ?? []).map((day) => [Number(day.frontmatter?.tag), day]));
  const changedStages = [];
  newDays.forEach((day, tag) => {
    if (JSON.stringify(oldDays.get(tag)) !== JSON.stringify(day)) {
      changedStages.push({ tag, title: day.frontmatter?.titel ?? '' });
    }
  });
  oldDays.forEach((day, tag) => {
    if (!newDays.has(tag)) changedStages.push({ tag, title: day.frontmatter?.titel ?? '' });
  });
  return {
    changedStages,
    tourInfoChanged: JSON.stringify(oldData.tourInfo) !== JSON.stringify(newData.tourInfo),
  };
}

async function hasChangedData(previous, current) {
  if (!previous) return false;
  const oldTag = previous.headers.get('etag');
  const newTag = current.headers.get('etag');
  if (oldTag && newTag) return oldTag !== newTag;
  const oldModified = previous.headers.get('last-modified');
  const newModified = current.headers.get('last-modified');
  if (oldModified && newModified && oldModified !== newModified) return true;

  const [oldBytes, newBytes] = await Promise.all([
    previous.clone().arrayBuffer(),
    current.clone().arrayBuffer(),
  ]);
  if (oldBytes.byteLength !== newBytes.byteLength) return true;
  const oldView = new Uint8Array(oldBytes);
  const newView = new Uint8Array(newBytes);
  return oldView.some((byte, index) => byte !== newView[index]);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (request.method !== 'GET' || request.headers?.has('range')
    || requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = cacheKey(request, scopeUrl);
    const previous = await cache.match(key);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(request, { cache: 'no-cache', signal: controller.signal });
    } catch (error) {
      if (previous) return offlineResponse(previous);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return response;

    try {
      if (isTourDataUrl(requestUrl) && await hasChangedData(previous, response)) {
        const changes = /\/roadbook-data\.json$/i.test(requestUrl.pathname)
          ? await changedRoadbookData(previous, response)
          : {};
        await notifyChangedData(requestUrl.href, changes);
      }
    } catch (error) {
      console.error('Geänderte Tour-Daten konnten nicht erkannt oder gemeldet werden.', error);
    }
    try {
      await cache.put(key, response.clone());
    } catch (error) {
      console.error('Die Online-Antwort konnte nicht im Offline-Cache gespeichert werden.', error);
    }
    return response;
  })());
});
