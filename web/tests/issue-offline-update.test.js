import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { extractTemplate, parseCss, parseHtml, normalizeText } from './helpers/dom.js';

const [mainSource, styleSource, workerSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../public/sw.js', import.meta.url), 'utf8'),
]);
const shell = parseHtml(extractTemplate(mainSource, /function renderShell\(\)\s*\{\s*app\.innerHTML\s*=\s*`/));
const css = parseCss(styleSource);

test('data and program updates have separate, accessible notices with a scrollable changelog', () => {
  const notice = shell.querySelector('#data-update-notice');
  assert.equal(normalizeText(notice.querySelector('h2')), 'Neue Daten verfügbar');
  assert.equal(normalizeText(notice.querySelector('p')), 'Folgende Daten wurden geändert:');
  assert.ok(notice.querySelector('#data-update-list'));
  assert.ok(notice.querySelector('#data-update-close'));

  const dialog = shell.querySelector('#program-update-dialog');
  assert.ok(dialog.querySelector('#program-update-title'));
  assert.ok(dialog.querySelector('#program-update-history'));
  assert.equal(normalizeText(dialog.querySelector('#program-update-later')), 'Später');
  assert.equal(normalizeText(dialog.querySelector('#program-update-now')), 'Jetzt aktualisieren');
  assert.equal(css.declarations('.program-update-scroll')['overflow-y'], 'auto');
  assert.match(css.declarations('.program-update-scroll')['max-height'], /360px/);
  assert.match(css.declarations('.program-update-actions .button')['min-height'], /44px/);
  assert.match(mainSource, /X-Offline-Fallback/);
  assert.match(mainSource, /serviceWorker\.addEventListener\('message'/);
  assert.match(mainSource, /addEventListener\('online', checkForUpdate/);
  assert.match(mainSource, /addEventListener\('visibilitychange'/);
  assert.match(mainSource, /registration\.update\(\)/);
  assert.match(mainSource, /type: 'SKIP_WAITING'/);
  assert.match(mainSource, /Tour-Übersicht und Tour-Karte/);
  assert.match(mainSource, /Etappendaten und Tourtexte/);
});

test('five font-size steps are scaled by exactly 1.5', () => {
  const baseline = [14, 16, 17, 18, 20];
  const expected = [21, 24, 25.5, 27, 30];
  expected.forEach((size, index) => {
    assert.equal(
      css.declarations(`:root[data-font-size="${index + 1}"]`, '@media (max-width: 520px)')['font-size'],
      `${size}px`,
    );
    assert.equal(
      css.declarations(`:root[data-font-size="${index + 1}"]`)['font-size'],
      `${baseline[index]}px`,
    );
  });
});

test('service worker reports a network-fetched tour data change after updating the cache', async () => {
  const handlers = {};
  const changedUrl = 'https://example.test/balkan-ride-2027/assets/gpx/tag-03.gpx';
  const entries = new Map([[changedUrl, new Response('old GPX')]]);
  const messages = [];
  const cache = {
    async match(request) { return entries.get(typeof request === 'string' ? request : request.url)?.clone(); },
    async put(request, response) { entries.set(typeof request === 'string' ? request : request.url, response.clone()); },
  };
  const self = {
    registration: { scope: 'https://example.test/balkan-ride-2027/' },
    clients: { matchAll: async () => [{ postMessage(message) { messages.push(message); } }] },
    addEventListener(name, callback) { handlers[name] = callback; },
  };
  runInNewContext(workerSource, {
    self, URL, Headers, Response, AbortController, setTimeout, clearTimeout, console,
    caches: { async open() { return cache; } },
    fetch: async () => new Response('new GPX'),
  });

  let result;
  handlers.fetch({
    request: new Request(changedUrl),
    respondWith(promise) { result = promise; },
  });
  assert.equal(await (await result).text(), 'new GPX');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'TOUR_DATA_UPDATED');
  assert.equal(messages[0].url, changedUrl);
  assert.equal(await (await cache.match(changedUrl)).text(), 'new GPX');
});

test('service worker names changed stages in the standalone roadbook data', async () => {
  const handlers = {};
  const dataUrl = 'https://example.test/balkan-ride-2027/roadbook-data.json';
  const oldData = {
    days: [{ frontmatter: { tag: 3, titel: 'Alte Etappe' }, body: 'alter Text' }],
    tourInfo: { map: 'unchanged' },
  };
  const newData = {
    days: [{ frontmatter: { tag: 3, titel: 'Neue Etappe' }, body: 'neuer Text' }],
    tourInfo: { map: 'updated' },
  };
  const entries = new Map([[dataUrl, new Response(JSON.stringify(oldData))]]);
  const messages = [];
  const cache = {
    async match(request) { return entries.get(typeof request === 'string' ? request : request.url)?.clone(); },
    async put(request, response) { entries.set(typeof request === 'string' ? request : request.url, response.clone()); },
  };
  const self = {
    registration: { scope: 'https://example.test/balkan-ride-2027/' },
    clients: { matchAll: async () => [{ postMessage(message) { messages.push(message); } }] },
    addEventListener(name, callback) { handlers[name] = callback; },
  };
  runInNewContext(workerSource, {
    self, URL, Headers, Response, AbortController, setTimeout, clearTimeout, console,
    caches: { async open() { return cache; } },
    fetch: async () => new Response(JSON.stringify(newData)),
  });

  let result;
  handlers.fetch({
    request: new Request(dataUrl),
    respondWith(promise) { result = promise; },
  });
  assert.deepEqual(JSON.parse(await (await result).text()), newData);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].url, dataUrl);
  assert.deepEqual(Array.from(messages[0].changedStages, ({ tag, title }) => [tag, title]), [[3, 'Neue Etappe']]);
  assert.equal(messages[0].tourInfoChanged, true);
});
