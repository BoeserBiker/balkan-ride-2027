import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cleanPoiName, editorialPoiDescription, formatPoiSummary, poiInfoVisibility, renderMediaGallery,
} from '../src/roadbook.js';
import { directionsUrl, setNavigationApp } from '../src/html.js';

const [indexHtml, mainSource, styleSource, elevationSource, deployWorkflow] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/elevation-profile.js', import.meta.url), 'utf8'),
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
  for (const source of ['elevation', 'map']) {
    assert.deepEqual(poiInfoVisibility(source, true), { elevation: true });
  }
  assert.deepEqual(poiInfoVisibility('elevation', false), { elevation: false });
  assert.deepEqual(poiInfoVisibility('route-line', true), { elevation: false });

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

  assert.match(html, /Etappe 06/);
  assert.doesNotMatch(html, /route-line|route-connector|>START<|>ZIEL</);
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
  assert.match(mainSource, /<input id="font-size-range"[^>]*type="range" min="1" max="5" step="1"/);
  assert.match(mainSource, /<li data-font-step="4">4<\/li><li data-font-step="5">5<\/li>/);
  assert.match(styleSource, /\.font-size-control \{ --font-range-thumb-size: 16px;/);
  for (const [step, position] of [[1, '0'], [2, '25%'], [3, '50%'], [4, '75%'], [5, '100%']]) {
    assert.match(styleSource, new RegExp(`\\.font-size-steps li:nth-child\\(${step}\\) \\{ left: ${position}; \\}`));
  }
  assert.doesNotMatch(mainSource, /version-badge|mobile-stage-route|route-connector|bindRouteScrubber/);
  assert.match(mainSource, /Etappe \$\{String\(day\.frontmatter\.tag\)/);
  assert.match(mainSource, /SETTINGS_KEYS = \{[\s\S]*theme: 'balkan-ride-theme'[\s\S]*fontSize: 'balkan-ride-font-size'/);
  for (const step of [1, 2, 3, 4, 5]) {
    assert.match(styleSource, new RegExp(`:root\\[data-font-size="${step}"\\] \\{ font-size`));
  }
  assert.match(styleSource, /\.settings-dialog \{[^}]*overflow-y: auto; overscroll-behavior: contain; padding: 24px 24px 40px;/);
  assert.match(styleSource, /\.settings-dialog \{[^}]*padding: 24px clamp\(16px, 4vw, 40px\) calc\(40px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(styleSource, /\.settings-dialog \{ padding: 18px 14px calc\(40px \+ env\(safe-area-inset-bottom, 0px\)\); \}/);
  assert.doesNotMatch(styleSource, /route-connector|version-badge|mobile-stage-route/);
  assert.match(styleSource, /html \{ max-width: 100%; overflow-x: hidden; overflow-x: clip;/);
  assert.match(styleSource, /body, main, \.roadbook-layout \{ max-width: 100%; overflow-x: hidden; overflow-x: clip; \}/);
  assert.match(styleSource, /\[hidden\] \{ display: none !important; \}/);
  assert.match(styleSource, /\.gpx-downloads, \.gpx-downloads \.button,[\s\S]*?min-width: 0; max-width: 100%; box-sizing: border-box;/);
  assert.doesNotMatch(styleSource, /--nav-shift|translateY\(var/);
  assert.match(styleSource, /\.brand \{ display: flex; align-items: flex-end;[^}]*\}\n\.brand > span \{ margin-bottom: 2\.5px; \}/);
  assert.match(styleSource, /\.header-navigation \{ --nav-pb: 1px; \}\n  \.brand > span \{ margin-bottom: 1px; \}/);
  assert.match(styleSource, /\.header-navigation \{ --nav-pb: 0px; \}/);
  assert.match(styleSource, /\.site-nav a \{ font-size: 12px; \}/);
  assert.match(styleSource, /\.mobile-map-context \{ display: grid; gap: 2px; margin: 0 0 6px; padding: 0 0 4px; \}/);
  assert.match(styleSource, /#map \{ height: auto; min-height: 330px; flex: 1; \}/);
  assert.match(styleSource, /\.map-panel \{ margin-top: 0; padding-top: 4px; padding-bottom: 6px; \}/);
  assert.match(styleSource, /\.duration-mobile \{ display: none; \}/);
  assert.match(styleSource, /@media \(max-width: 768px\) \{[\s\S]*?\.duration-desktop \{ display: none; \}\n  \.duration-mobile \{ display: inline; \}/);
  assert.match(styleSource, /\.header-navigation \{ --nav-pb: 2px; box-sizing: border-box; display: flex; max-width: 100%; flex-direction: row; align-items: flex-end; align-self: flex-end;/);
  assert.match(styleSource, /\.header-tools \{ box-sizing: border-box; display: flex; align-items: flex-end;/);
  assert.match(styleSource, /\.settings-toggle \{ box-sizing: border-box; position: relative; display: grid;/);
  assert.match(styleSource, /\.header-navigation \.settings-toggle \{ margin: 0; \}/);
  assert.doesNotMatch(styleSource, /\.header-navigation \.settings-toggle \{ margin: -/);
  assert.match(mainSource, /<\/nav>\s*<div class="header-tools">/);
  assert.match(styleSource, /\.day-section h3, \.story-section h3 \{[^}]*font-size: 13px; font-weight: 650; letter-spacing: \.01em;/);
  assert.match(styleSource, /\.elevation-title \{[^}]*font-size: 13px; font-weight: 650; line-height: inherit; letter-spacing: \.01em;/);
  assert.match(styleSource, /@media \(max-width: 520px\) \{\n  \.stats-grid > div \{ padding: 0 8px; \}[\s\S]*?white-space: normal;/);
  assert.match(styleSource, /\.settings-dialog \{ box-sizing: border-box; width: min\(460px, calc\(100vw - 32px\)\); max-width: 460px;/);
  assert.match(styleSource, /@media \(max-width: 768px\) \{[\s\S]*?\.settings-dialog \{ width: 100vw; max-width: 100vw;/);
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
    ['media', 'Galerie'],
    ['logistics', 'Logistik'],
  ]);
  assert.match(styleSource, /\.site-nav \{ display: flex; flex-wrap: nowrap;/);
  assert.match(styleSource, /\.site-nav a \{[^}]*white-space: nowrap;/);
  assert.match(styleSource, /\.site-nav a:hover, \.site-nav a:focus-visible, \.site-nav a\[aria-current="page"\], \.site-nav a\.active/);
  assert.match(mainSource, /id="media" class="media-page"/);
  assert.match(mainSource, /<h2 id="media-title">Galerie der Tour\.<\/h2>/);
  assert.match(mainSource, /<dialog id="lightbox" class="lightbox" aria-label="Galerieansicht">/);
  assert.match(styleSource, /\.photo-button \{ display: flex; flex-direction: column;/);
  assert.match(styleSource, /\.photo-button img \{[^}]*flex: none;[^}]*height: auto;[^}]*aspect-ratio: 4 \/ 3;[^}]*object-fit: cover;/);
  assert.doesNotMatch(styleSource, /\.photo-button img \{[^}]*height: 100%/);
  assert.match(styleSource, /\.leaflet-marker-icon\.day-map-pin\.is-active \{ z-index: 900 !important; \}/);
  assert.match(styleSource, /\.photo-button \.photo-caption \{ flex: 1 0 auto; min-height: calc\(2\.8em \+ 16px\); \}/);
  assert.match(styleSource, /\.photo-credit \{[^}]*min-height: 2\.8em;/);
  assert.match(styleSource, /\.media-gallery-grid \{[^}]*grid-auto-rows: auto;[^}]*align-items: stretch;/);
  assert.match(styleSource, /\.media-gallery-entry \.photo-card \{[^}]*height: auto;[^}]*overflow: visible;/);
  assert.match(styleSource, /\.media-gallery-entry \.photo-button \{ flex: none;[^}]*height: auto;/);
  assert.match(styleSource, /\.media-page \{ width: 100%; margin-inline: auto;/);
  assert.match(styleSource, /\.photo-gallery \{ grid-auto-rows: auto; margin-bottom: 14px; \}/);
  assert.match(styleSource, /\.photo-gallery \.photo-card \{ height: auto; overflow: visible; \}/);
  assert.match(styleSource, /\.lightbox \{ position: fixed; inset: 50% auto auto 50%;[^}]*margin: 0;[^}]*transform: translate\(-50%, -50%\);/);
  assert.match(styleSource, /\.lightbox \{[^}]*overflow-y: auto; overscroll-behavior: contain;/);
  assert.match(mainSource, /viewSections\.forEach\(\(section\) => \{ section\.hidden = section\.id !== active; \}\)/);
  assert.match(mainSource, /\['roadbook', 'media', 'logistics'\]/);
  assert.match(mainSource, /setAttribute\('aria-current', 'page'\)/);
  assert.match(mainSource, /history\.pushState\(null, '', `#\$\{id\}`\)/);
  assert.match(mainSource, /window\.scrollTo\(0, 0\)/);
  assert.match(mainSource, /addEventListener\('hashchange'/);
  assert.match(mainSource, /addEventListener\('popstate'/);
  assert.match(mainSource, /map\.resize\(\)/);
  assert.match(styleSource, /\.roadbook-layout\[hidden\], \.media-page\[hidden\], \.logistics-section\[hidden\] \{ display: none !important; \}/);
  assert.match(mainSource, /id="media-type-filter"/);
  assert.match(mainSource, /id="media-stage-filter"/);
  assert.match(mainSource, /renderMediaGallery\(roadbookDays/);
});

test('centers the settings dialog heading', () => {
  assert.match(mainSource, /<h2 id="settings-title">Einstellungen<\/h2>/);
  assert.match(styleSource, /\.settings-dialog h2 \{[^}]*margin: 0 0 20px;[^}]*text-align: center;/);
  assert.doesNotMatch(styleSource, /\.settings-dialog h2 \{[^}]*margin: 0 38px 20px 0;/);
});

test('runs the Node tests before the Pages production build', () => {
  const testCommand = deployWorkflow.indexOf('node --test web/tests/*.test.js');
  const buildCommand = deployWorkflow.indexOf('npm run build --prefix web');
  assert.notEqual(testCommand, -1, 'Pages workflow must run the Node test suite');
  assert.ok(buildCommand > testCommand, 'Node tests must pass before the production build');
  assert.match(deployWorkflow, /pull_request:[\s\S]*branches: \[main\]/);
  assert.match(deployWorkflow, /if: github\.event_name != 'pull_request'/);
  assert.match(deployWorkflow, /needs: build/);
});

test('renders accessible version-card toggles below update button without separate history bars', () => {
  const settingsMarkup = mainSource.match(/<dialog id="settings-dialog"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(settingsMarkup, 'settings dialog must be rendered');
  assert.match(settingsMarkup, /<section class="version-current-grid" aria-label="Aktueller Versionsstand">/);
  assert.match(settingsMarkup, /<button id="app-version-toggle" class="version-current-card" type="button" aria-expanded="false" aria-controls="app-version-history"/);
  assert.match(settingsMarkup, /<button id="service-worker-version-toggle" class="version-current-card" type="button" aria-expanded="false" aria-controls="service-worker-version-history"/);
  assert.match(settingsMarkup, /<strong id="version-current">lädt …<\/strong>/);
  assert.match(settingsMarkup, /<strong id="service-worker-current">lädt …<\/strong>/);
  assert.match(settingsMarkup, /<span class="version-history-indicator" aria-hidden="true">▾<\/span>/);
  assert.match(settingsMarkup, /<section id="app-version-history" class="settings-history"[^>]*hidden>/);
  assert.match(settingsMarkup, /<section id="service-worker-version-history" class="settings-history"[^>]*hidden>/);
  assert.doesNotMatch(settingsMarkup, /<details|<summary>|App-Versionsverlauf|Service-Worker- \/ Cache-Verlauf/);
  assert.ok(settingsMarkup.indexOf('id="refresh-app"') < settingsMarkup.indexOf('class="version-current-grid"'),
    'version cards must follow the update button');
  assert.match(mainSource, /const historyToggles = \[\.\.\.dialog\.querySelectorAll\('\[data-version-history-toggle\]'\)\]/);
  assert.match(mainSource, /toggleButton\.setAttribute\('aria-expanded', String\(expanded\)\)/);
  assert.match(mainSource, /history\.hidden = !expanded/);
  assert.match(settingsMarkup, /id="app-version-history-list" class="version-history-list"/);
  assert.match(settingsMarkup, /id="service-worker-history-list" class="version-history-list"/);
  assert.match(mainSource, /serviceWorkerCurrent\.textContent = data\.serviceWorkerCache/);
  assert.match(mainSource, /serviceWorkerList\.innerHTML = data\.serviceWorkerHistory\.map/);

  assert.match(styleSource, /\.settings-dialog \{ box-sizing: border-box; width: min\(460px, calc\(100vw - 32px\)\);[^}]*overflow-x: hidden; overflow-y: auto;/);
  assert.match(styleSource, /\.settings-dialog > \.settings-group,[\s\S]*?box-sizing: border-box;[\s\S]*?width: 100%;[\s\S]*?max-width: 100%;[\s\S]*?min-width: 0;/);
  assert.match(styleSource, /\.version-current-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(styleSource, /\.version-current-card \{ box-sizing: border-box; display: grid; width: 100%; max-width: 100%; min-width: 0; min-height: 60px;/);
  assert.match(styleSource, /\.version-current-card:hover \{ border-color: var\(--accent\);/);
  assert.match(styleSource, /\.version-current-card:focus-visible \{ outline: 2px solid var\(--marker-highlight\);/);
  assert.match(styleSource, /\.version-current-card:active \{ transform: translateY\(1px\); \}/);
  assert.match(styleSource, /\.version-current-card\[aria-expanded="true"\] \.version-history-indicator \{ transform: rotate\(180deg\); \}/);
  assert.match(styleSource, /\.settings-history \{ box-sizing: border-box; (?:width: 100%; max-width: 100%; min-width: 0; margin: 8px 0 0;|position: absolute; inset: 0; z-index: 20; min-width: 0; margin: 0; overflow-x: hidden; overflow-y: auto;)/);
  assert.match(styleSource, /\.settings-history \.version-history-list \{ box-sizing: border-box; width: 100%; max-width: 100%;/);
  assert.match(styleSource, /:root\[data-font-size="5"\] \.version-current-card/);
  assert.doesNotMatch(styleSource, /settings-history \.version-history-list \{ max-height:/);
});
