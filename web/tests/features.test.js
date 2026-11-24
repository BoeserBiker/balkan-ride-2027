import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cleanPoiName, editorialPoiDescription, formatPoiSummary, poiInfoVisibility, renderMediaGallery,
} from '../src/roadbook.js';
import { directionsUrl, setNavigationApp } from '../src/html.js';

const [indexHtml, mainSource, styleSource, elevationSource, serviceWorkerSource, deployWorkflow] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/elevation-profile.js', import.meta.url), 'utf8'),
  readFile(new URL('../public/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
]);

test('cleans POI export prefixes and hides technical descriptions', () => {
  assert.equal(cleanPoiName('D06 - 04 - Primošten'), 'Primošten');
  assert.equal(cleanPoiName('Primošten'), 'Primošten');
  assert.equal(editorialPoiDescription({
    name: 'D06 - 04 - Primošten',
    description: 'MOTORRAD · V7 / D06 / MOTORRAD / D06 - 04 - Primošten',
  }), '');
  assert.equal(editorialPoiDescription({
    name: 'D06 - 04 - Primošten',
    description: 'MOTORRAD · / D06 / MOTORRAD / D06 - 04 - Primošten',
  }), '');
  assert.equal(editorialPoiDescription({
    name: 'D06 - 04 - Primošten',
    description: 'Primošten',
  }), '');
  assert.equal(editorialPoiDescription({
    name: 'D06 - 04 - Primošten',
    description: 'Aussicht über die Bucht',
  }), 'Aussicht über die Bucht');
  assert.equal(formatPoiSummary(
    { name: 'D06 - 04 - Primošten' },
    0,
    { distanceKm: 74.5, elevationMeters: 2 },
  ), 'Stopp 4 · 74,5 km · 2 m');
});

test('shows at most one POI information card and keeps the elevation card overlaid', () => {
  for (const [source, routeLine, elevation] of [
    ['route-line', true, false],
    ['elevation', false, true],
    ['map', false, true],
  ]) {
    assert.deepEqual(poiInfoVisibility(source, true), { routeLine, elevation });
    assert.notEqual(routeLine, elevation, `POI cards must be exclusive for ${source}`);
  }
  assert.deepEqual(poiInfoVisibility('elevation', false), { routeLine: false, elevation: false });

  assert.match(mainSource, /const \{ routeLine \} = poiInfoVisibility\(source, true\)/);
  assert.match(elevationSource, /const visibility = poiInfoVisibility\(source, poi\)/);
  assert.match(elevationSource, /const TOP = 36;/);
  assert.match(styleSource, /\.elevation-chart \{ position: relative;/);
  assert.match(styleSource, /\.elevation-poi-card \{ position: absolute; z-index: 20; top: 8px;/);
  assert.doesNotMatch(styleSource, /\.elevation-chart\.has-poi/);
});

test('builds navigation URLs for each supported app', () => {
  const storage = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });

  try {
    const destination = '46.0569%2C14.5058';
    for (const [app, expected] of [
      ['google', `https://www.google.com/maps/dir/?api=1&destination=${destination}`],
      ['apple', `https://maps.apple.com/?daddr=${destination}`],
      ['kurviger', `https://kurviger.de/?point=${destination}`],
    ]) {
      setNavigationApp(app);
      assert.equal(directionsUrl(46.0569, 14.5058), expected);
      assert.equal(storage.get('balkan-ride-navigation-app'), app);
    }
    assert.throws(() => directionsUrl(91, 14), /Ungültige Koordinaten/);
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test('renders a stage-labelled all-media gallery with lightbox entries and empty states', () => {
  const days = [
    {
      frontmatter: {
        tag: 6,
        titel: 'Dalmatien & Küste',
        bilder: [{ datei: 'assets/media/tag-06/bucht.webp', beschreibung: 'Blick auf die Bucht' }],
        videos: [
          { typ: 'youtube', quelle: 'https://youtu.be/abcdefghijk', titel: 'Küstenfahrt' },
          {
            typ: 'mp4',
            quelle: 'assets/media/tag-06/kurven.mp4',
            poster: 'assets/media/tag-06/kurven.webp',
            titel: 'Kurvenfahrt',
          },
        ],
      },
    },
    {
      frontmatter: { tag: 7, titel: 'Weiter Richtung Süden', bilder: [], videos: [] },
    },
  ];
  const html = renderMediaGallery(days, {
    assetUrls: {
      '../../assets/media/tag-06/bucht.webp': '/bucht.webp',
      '../../assets/media/tag-06/kurven.mp4': '/kurven.mp4',
      '../../assets/media/tag-06/kurven.webp': '/kurven.webp',
    },
  });

  assert.match(html, /ETAPPE 06/);
  assert.match(html, /Dalmatien &amp; Küste/);
  assert.match(html, /data-media-type="photo"/);
  assert.match(html, /data-media-type="video"/);
  assert.match(html, /data-lightbox-index="0" data-lightbox-type="image" data-lightbox-src="\/bucht\.webp"/);
  assert.match(html, /data-lightbox-index="1"\s+data-lightbox-type="youtube"\s+data-lightbox-src="https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?rel=0&amp;playsinline=1/);
  assert.match(html, /data-lightbox-index="2"\s+data-lightbox-type="video"\s+data-lightbox-src="\/kurven\.mp4"/);
  assert.match(html, /data-select-day-index="0"/);
  assert.match(html, /ETAPPE 07[\s\S]*Für diese Etappe sind noch keine Medien hinterlegt\./);
});

test('keeps the settings, themes, glove mode, and ordered app navigation wired into the shell', () => {
  assert.match(indexHtml, /<div id="app"><\/div>/);
  assert.match(indexHtml, /src="\/src\/main\.js"/);
  assert.match(mainSource, /id="settings-toggle"[^>]*aria-label="Einstellungen"/);
  assert.ok(mainSource.includes('>⋮</button>'));
  assert.match(mainSource, /dialog\.showModal\(\)/);
  for (const theme of ['default', 'schalke', 'bvb']) {
    assert.ok(mainSource.includes(`data-theme-choice="${theme}"`));
  }
  assert.match(styleSource, /--bg: #101311;[\s\S]*--accent: #f0a94c;/);
  assert.match(styleSource, /:root\[data-theme="schalke"\][\s\S]*--bg: #071426;[\s\S]*--accent: #3897f0;/);
  assert.match(styleSource, /:root\[data-theme="bvb"\][\s\S]*--bg: #09090b;[\s\S]*--accent: #fde000;/);
  assert.match(mainSource, /data-font-size="large"[^>]*>Groß/);
  assert.match(mainSource, /SETTINGS_KEYS = \{[\s\S]*theme: 'balkan-ride-theme'[\s\S]*fontSize: 'balkan-ride-font-size'/);
  assert.match(styleSource, /:root\[data-font-size="large"\]/);
  for (const app of ['google', 'apple', 'kurviger']) {
    assert.ok(mainSource.includes(`<option value="${app}">`));
  }
  assert.match(mainSource, /navigationSelect\.addEventListener\('change'/);
  assert.match(mainSource, /updateNavigationLinks\(\)/);

  const navigation = mainSource.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(navigation, 'main.js must render the header navigation');
  const links = [...navigation.matchAll(/<a href="#([^"]+)">([^<]+)<\/a>/g)]
    .map(([, target, label]) => [target, label]);
  assert.deepEqual(links, [
    ['roadbook', 'Etappen'],
    ['media', 'Medien'],
    ['logistics', 'Logistik'],
  ]);
  assert.match(styleSource, /\.site-nav \{ display: flex; flex-wrap: nowrap;/);
  assert.match(styleSource, /\.site-nav a \{[^}]*white-space: nowrap;/);
  assert.match(styleSource, /\.site-nav a:hover, \.site-nav a:focus-visible, \.site-nav a\[aria-current="location"\]/);
  assert.match(mainSource, /id="media" class="media-page"/);
  assert.match(mainSource, /id="media-type-filter"/);
  assert.match(mainSource, /id="media-stage-filter"/);
  assert.match(mainSource, /renderMediaGallery\(roadbookDays/);
});

test('defines a numeric service-worker cache version and runs tests before the Pages build', () => {
  const cache = serviceWorkerSource.match(
    /const CACHE_PREFIX = '([^']+)';\s*const CACHE_NAME = `\$\{CACHE_PREFIX\}v(\d+)`;/,
  );
  assert.ok(cache, 'service worker cache name must use a numeric version');
  assert.equal(cache[1], 'balkan-ride-shell-');
  assert.ok(Number.isSafeInteger(Number(cache[2])) && Number(cache[2]) > 0);

  const testCommand = deployWorkflow.indexOf('node --test web/tests/*.test.js');
  const buildCommand = deployWorkflow.indexOf('npm run build --prefix web');
  assert.notEqual(testCommand, -1, 'Pages workflow must run the Node test suite');
  assert.ok(buildCommand > testCommand, 'Node tests must pass before the production build');
  assert.match(deployWorkflow, /pull_request:[\s\S]*branches: \[main\]/);
  assert.match(deployWorkflow, /if: github\.event_name != 'pull_request'/);
  assert.match(deployWorkflow, /needs: build/);
});
