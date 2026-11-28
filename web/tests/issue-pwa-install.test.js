import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { parseDocument } from './helpers/dom.js';

test('manifest provides separate PNG icons and install identity under the Pages scope', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url)));
  assert.equal(manifest.id, '/balkan-ride-2027/');
  assert.equal(manifest.start_url, manifest.id);
  assert.equal(manifest.scope, manifest.id);
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    for (const purpose of ['any', 'maskable']) {
      const name = purpose === 'any' ? `icon-${size}.png` : `icon-maskable-${size}.png`;
      const icon = manifest.icons.find((entry) => entry.src === name);
      assert.deepEqual(icon, { src: name, sizes: `${size}x${size}`, type: 'image/png', purpose });
      const png = await readFile(new URL(`../public/${name}`, import.meta.url));
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
    }
  }
  const document = parseDocument(await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const link = document.querySelector('link[rel="manifest"]');
  assert.equal(link.getAttribute('href'), '%BASE_URL%manifest.json');
  assert.equal(link.hasAttribute('disabled'), false);
  assert.equal(link.hasAttribute('media'), false);
});

test('service worker precaches the exact manifest and icon URLs, replaces old cache and serves offline', async () => {
  const handlers = {};
  const entries = new Map();
  const deleted = [];
  const response = new Response('preloaded');
  let online = true;
  const reloadRequests = new Set();
  const cache = {
    async addAll(urls) {
      for (const url of urls) {
        const key = url instanceof Request ? url.url : String(url);
        if (url instanceof Request && url.cache === 'reload') reloadRequests.add(key);
        entries.set(key, response.clone());
      }
    },
    async match(request) {
      const value = entries.get(typeof request === 'string' ? request : request.url);
      return value?.clone();
    },
    async put(request, value) { entries.set(typeof request === 'string' ? request : request.url, value.clone()); },
  };
  const self = {
    registration: { scope: 'https://example.test/balkan-ride-2027/' },
    clients: { claim() {} },
    skipWaiting() {},
    addEventListener(name, callback) { handlers[name] = callback; },
  };
  runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self, URL, Request, Headers, Response, AbortController, setTimeout, clearTimeout, console,
    caches: {
      async open() { return cache; },
      async keys() { return ['balkan-ride-shell-v1', 'unrelated']; },
      async delete(name) { deleted.push(name); },
    },
    fetch: async (request) => {
      if (!online) throw new Error('offline');
      if (request.url.endsWith('/asset-manifest.json')) {
        return new Response(JSON.stringify({
          'index.html': {
            src: 'index.html',
            isEntry: true,
            file: 'assets/app.js',
            css: ['assets/app.css'],
            imports: ['src/vendor.js'],
          },
          'src/vendor.js': {
            file: 'assets/vendor.js',
            imports: [],
          },
        }));
      }
      return new Response('network');
    },
  });
  let pending;
  handlers.install({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.ok(reloadRequests.has(`${self.registration.scope}assets/app.js`));
  assert.ok(reloadRequests.has(`${self.registration.scope}assets/app.css`));
  assert.ok(reloadRequests.has(`${self.registration.scope}assets/vendor.js`));
  handlers.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(deleted, ['balkan-ride-shell-v1']);
  online = false;
  for (const file of ['manifest.json', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) {
    const request = { method: 'GET', mode: 'no-cors', url: `${self.registration.scope}${file}` };
    assert.ok(entries.has(request.url), `${file} im Precache`);
    assert.ok(reloadRequests.has(request.url), `${file} ohne veralteten HTTP-Cache laden`);
    let result;
    handlers.fetch({ request: new Request(request.url), respondWith(promise) { result = promise; } });
    const fallback = await result;
    assert.equal(await fallback.text(), 'preloaded', `${file} offline verfügbar`);
    assert.equal(fallback.headers.get('X-Offline-Fallback'), 'true');
  }
});

test('service worker uses a 3-second network-first timeout and returns cached tour data', async () => {
  const handlers = {};
  const cachedUrl = 'https://example.test/balkan-ride-2027/assets/gpx/tag-03.gpx';
  const entries = new Map([[cachedUrl, new Response('cached GPX')]]);
  let timerCallback;
  let timerDelay;
  let networkStarted = false;
  const cache = {
    async match(request) { return entries.get(typeof request === 'string' ? request : request.url)?.clone(); },
    async put(request, response) { entries.set(typeof request === 'string' ? request : request.url, response.clone()); },
  };
  const self = {
    registration: { scope: 'https://example.test/balkan-ride-2027/' },
    clients: { matchAll: async () => [] },
    addEventListener(name, callback) { handlers[name] = callback; },
  };
  runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self, URL, Headers, Response, AbortController, console,
    caches: { async open() { return cache; } },
    setTimeout(callback, delay) { timerCallback = callback; timerDelay = delay; return 1; },
    clearTimeout() {},
    fetch(_request, options) {
      networkStarted = true;
      assert.equal(options.cache, 'no-cache');
      return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    },
  });
  const request = new Request(cachedUrl);
  let result;
  handlers.fetch({ request, respondWith(promise) { result = promise; } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(networkStarted, true, 'network wird vor dem Cache geprüft');
  assert.equal(timerDelay, 3000);
  timerCallback();
  const fallback = await result;
  assert.equal(await fallback.text(), 'cached GPX');
  assert.equal(fallback.headers.get('X-Offline-Fallback'), 'true');
});
