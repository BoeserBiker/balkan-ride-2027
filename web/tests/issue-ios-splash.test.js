import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { parseDocument } from './helpers/dom.js';

const sizes = [[750, 1334, 2], [828, 1792, 2], [1080, 2340, 3], [1125, 2436, 3],
  [1170, 2532, 3], [1179, 2556, 3], [1206, 2622, 3], [1242, 2688, 3],
  [1284, 2778, 3], [1290, 2796, 3], [1320, 2868, 3]];

test('iOS startup links point to existing PNGs with matching portrait dimensions and Pages paths', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const document = parseDocument(html);
  for (const [name, content] of [['apple-mobile-web-app-capable', 'yes'], ['mobile-web-app-capable', 'yes'],
    ['apple-mobile-web-app-status-bar-style', 'black-translucent'], ['apple-mobile-web-app-title', 'Balkan-Ride 2027']]) {
    assert.equal(document.querySelector(`meta[name="${name}"]`).getAttribute('content'), content);
    assert.ok(html.indexOf(`name="${name}"`) < html.indexOf('rel="apple-touch-startup-image"'));
  }
  const icon = document.querySelector('link[rel="apple-touch-icon"]');
  assert.equal(icon.getAttribute('href'), '%BASE_URL%apple-touch-icon.png');
  assert.equal(icon.getAttribute('sizes'), '180x180');
  const png = await readFile(new URL('../public/apple-touch-icon.png', import.meta.url));
  assert.equal(png.readUInt32BE(16), 180);
  assert.equal(png.readUInt32BE(20), 180);
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url)));
  assert.match(document.querySelector('style').textContent, new RegExp(`background:\\s*${manifest.background_color}`));
  const links = [...document.querySelectorAll('link[rel="apple-touch-startup-image"]')];
  assert.equal(links.length, sizes.length);
  for (const [width, height, dpr] of sizes) {
    const name = `splash-${width}x${height}.png`;
    const link = links.find((item) => item.getAttribute('href') === `%BASE_URL%splash/${name}`);
    assert.ok(link, name);
    const media = link.getAttribute('media');
    assert.ok(media.includes(`(device-width: ${width / dpr}px)`));
    assert.ok(media.includes(`(device-height: ${height / dpr}px)`));
    assert.ok(media.includes(`(-webkit-device-pixel-ratio: ${dpr})`));
    assert.ok(media.includes('(orientation: portrait)'));
    const png = await readFile(new URL(`../public/splash/${name}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.equal(new URL(link.getAttribute('href').replace('%BASE_URL%', '/balkan-ride-2027/'), 'https://example.test').pathname,
      `/balkan-ride-2027/splash/${name}`);
  }
});

test('service worker caches only requested splash images and reuses them offline', async () => {
  const handlers = {};
  const entries = new Map();
  let preloaded;
  let online = true;
  const response = { ok: true, clone() { return this; } };
  const cache = {
    async addAll(urls) { preloaded = urls; },
    async match(request) { return entries.get(request.url); },
    async put(request, value) { entries.set(request.url, value); },
  };
  const self = {
    registration: { scope: 'https://example.test/balkan-ride-2027/' },
    clients: { claim() {} },
    skipWaiting() {},
    addEventListener(name, callback) { handlers[name] = callback; },
  };
  runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self, URL, Request, caches: { async open() { return cache; } },
    fetch: async () => { if (!online) throw new Error('offline'); return response; },
  });
  let install;
  handlers.install({ waitUntil(promise) { install = promise; } });
  await install;
  assert.ok(preloaded.every((url) => !String(url).includes('/splash/')), 'keine Splash-PNGs vorab laden');
  const request = { method: 'GET', mode: 'no-cors', url: `${self.registration.scope}splash/splash-750x1334.png` };
  let result;
  handlers.fetch({ request, respondWith(promise) { result = promise; } });
  assert.equal(await result, response);
  assert.equal(entries.size, 1);
  online = false;
  handlers.fetch({ request, respondWith(promise) { result = promise; } });
  assert.equal(await result, response);
});
