import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cleanPoiName, editorialPoiDescription, formatPoiSummary, poiInfoVisibility, renderMediaGallery,
} from '../src/roadbook.js';
import { directionsUrl, setNavigationApp } from '../src/html.js';
import {
  extractTemplate, isBefore, lightboxEntries, normalizeCssValue, normalizeText, parseCss,
  parseDocument, parseHtml,
} from './helpers/dom.js';

const [indexHtml, mainSource, styleSource, deployWorkflow] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
]);

// Struktur statt Quelltext: HTML als DOM, CSS als AST (unabhängig von Formatierung und Reihenfolge).
const css = parseCss(styleSource);
const indexDocument = parseDocument(indexHtml);
const shellDocument = parseHtml(
  extractTemplate(mainSource, /function renderShell\(\)\s*\{\s*app\.innerHTML\s*=\s*`/),
);

function assertCss(selector, expected, media = '') {
  const actual = css.declarations(selector, media);
  for (const [property, value] of Object.entries(expected)) {
    assert.equal(
      actual[property], normalizeCssValue(value), `${media} ${selector} { ${property} }`.trim(),
    );
  }
}

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

  assertCss('.elevation-chart', { position: 'relative' });
  assertCss('.elevation-poi-card', { position: 'absolute', 'z-index': '20', top: '8px' });
  assert.equal(css.mentions('.elevation-chart.has-poi'), false);
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
  const galleryDocument = parseHtml(html);
  assert.deepEqual(
    lightboxEntries(galleryDocument).map(({ index, type, src }) => ({ index, type, src })),
    [
      { index: '0', type: 'image', src: '/bucht.webp' },
      { index: '1', type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0&playsinline=1' },
      { index: '2', type: 'video', src: '/kurven.mp4' },
    ],
  );
  assert.match(html, /data-select-day-index="0"/);
  assert.match(html, /ETAPPE 07[\s\S]*Für diese Etappe sind noch keine Medien hinterlegt\./);
});

test('keeps the settings, themes, glove mode, and ordered app navigation wired into the shell', () => {
  const mount = indexDocument.querySelector('#app');
  assert.ok(mount, 'index.html must provide the #app mount point');
  assert.equal(mount.children.length, 0);
  assert.ok(
    [...indexDocument.querySelectorAll('script[type="module"]')]
      .some((script) => script.getAttribute('src') === '/src/main.js'),
    'index.html must load /src/main.js as a module',
  );
  const settingsToggle = shellDocument.querySelector('#settings-toggle');
  assert.equal(settingsToggle?.getAttribute('aria-label'), 'Einstellungen');
  assert.equal(normalizeText(settingsToggle), '⋮');
  assert.match(mainSource, /dialog\.showModal\(\)/);
  for (const theme of ['default', 'schalke', 'bvb']) {
    assert.ok(shellDocument.querySelector(`[data-theme-choice="${theme}"]`), theme);
  }
  assertCss(':root', { '--bg': '#101311', '--accent': '#f0a94c' });
  assertCss(':root[data-theme="schalke"]', { '--bg': '#071426', '--accent': '#3897f0' });
  assertCss(':root[data-theme="bvb"]', { '--bg': '#09090b', '--accent': '#fde000' });
  const fontRange = shellDocument.querySelector('input#font-size-range');
  assert.deepEqual(
    ['type', 'min', 'max', 'step'].map((name) => fontRange?.getAttribute(name)),
    ['range', '1', '5', '1'],
  );
  assert.deepEqual(
    [...shellDocument.querySelectorAll('li[data-font-step]')]
      .map((item) => [item.getAttribute('data-font-step'), normalizeText(item)]),
    [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']],
  );
  assertCss('.font-size-control', { '--font-range-thumb-size': '16px' });
  for (const [step, position] of [[1, '0'], [2, '25%'], [3, '50%'], [4, '75%'], [5, '100%']]) {
    assertCss(`.font-size-steps li:nth-child(${step})`, { left: position });
  }
  for (const token of ['version-badge', 'mobile-stage-route', 'route-connector', 'bindRouteScrubber']) {
    assert.equal(mainSource.includes(token), false, `main.js must not mention ${token}`);
  }
  assert.match(mainSource, /Etappe \$\{String\(day\.frontmatter\.tag\)/);
  assert.match(mainSource, /SETTINGS_KEYS = \{[\s\S]*theme: 'balkan-ride-theme'[\s\S]*fontSize: 'balkan-ride-font-size'/);
  for (const step of [1, 2, 3, 4, 5]) {
    assert.ok('font-size' in css.declarations(`:root[data-font-size="${step}"]`), `font-size step ${step}`);
  }
  assert.match(styleSource, /\.settings-dialog \{[^}]*overflow-y: auto; overscroll-behavior: contain; padding: 24px 24px 40px;/);
  assert.match(styleSource, /\.settings-dialog \{[^}]*padding: 24px clamp\(16px, 4vw, 40px\) calc\(40px \+ env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(styleSource, /\.settings-dialog \{ padding: 18px 14px calc\(40px \+ env\(safe-area-inset-bottom, 0px\)\); \}/);
  assert.equal(
    ['route-connector', 'version-badge', 'mobile-stage-route'].some((name) => css.mentions(name)),
    false,
  );
  assert.match(styleSource, /html \{ max-width: 100%; overflow-x: hidden; overflow-x: clip;/);
  assert.match(styleSource, /body, main, \.roadbook-layout \{ max-width: 100%; overflow-x: hidden; overflow-x: clip; \}/);
  assert.match(styleSource, /\[hidden\] \{ display: none !important; \}/);
  assert.match(styleSource, /\.gpx-downloads, \.gpx-downloads \.button,[\s\S]*?min-width: 0; max-width: 100%; box-sizing: border-box;/);
  assert.equal(css.mentions('--nav-shift') || css.mentions('translateY(var'), false);
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
  assert.ok(
    shellDocument.querySelector('nav.site-nav')?.nextElementSibling?.classList.contains('header-tools'),
    'the header tools follow the navigation',
  );
  for (const selector of ['.day-section h3', '.story-section h3']) {
    assertCss(selector, { 'font-size': '13px', 'font-weight': '650', 'letter-spacing': '.01em' });
  }
  assertCss('.elevation-title', {
    'font-size': '13px', 'font-weight': '650', 'line-height': 'inherit', 'letter-spacing': '.01em',
  });
  assertCss('.stats-grid > div', { padding: '0 8px' }, '@media (max-width: 520px)');
  assert.ok(
    css.entries.some((entry) => entry.media === '@media (max-width: 520px)'
      && entry.declarations['white-space'] === 'normal'),
    'narrow screens allow stat labels to wrap',
  );
  assertCss('.settings-dialog', {
    'box-sizing': 'border-box', width: 'min(460px, calc(100vw - 32px))', 'max-width': '460px',
  });
  assertCss('.settings-dialog', { width: '100vw', 'max-width': '100vw' }, '@media (max-width: 768px)');
  for (const app of ['google', 'apple', 'kurviger']) {
    assert.ok(shellDocument.querySelector(`option[value="${app}"]`), app);
  }

  const links = [...shellDocument.querySelectorAll('nav.site-nav a')]
    .map((link) => [link.getAttribute('href').replace(/^#/, ''), normalizeText(link)]);
  assert.deepEqual(links, [
    ['roadbook', 'Etappen'],
    ['media', 'Galerie'],
    ['logistics', 'Logistik'],
  ]);
  assertCss('.site-nav', { display: 'flex', 'flex-wrap': 'nowrap' });
  assertCss('.site-nav a', { 'white-space': 'nowrap' });
  for (const selector of [
    '.site-nav a:hover', '.site-nav a:focus-visible', '.site-nav a[aria-current="page"]', '.site-nav a.active',
  ]) {
    assert.ok(css.has(selector), selector);
  }
  assert.ok(shellDocument.querySelector('#media.media-page'));
  assert.equal(normalizeText(shellDocument.querySelector('h2#media-title')), 'Galerie der Tour.');
  assert.equal(
    shellDocument.querySelector('dialog#lightbox.lightbox')?.getAttribute('aria-label'), 'Galerieansicht',
  );
  assertCss('.photo-button', { display: 'flex', 'flex-direction': 'column' });
  assertCss('.photo-button img', {
    flex: 'none', height: 'auto', 'aspect-ratio': '4 / 3', 'object-fit': 'cover',
  });
  assert.notEqual(css.declarations('.photo-button img').height, '100%');
  assertCss('.leaflet-marker-icon.day-map-pin.is-active', { 'z-index': '900 !important' });
  assertCss('.photo-button .photo-caption', { flex: '1 0 auto', 'min-height': 'calc(2.8em + 16px)' });
  assertCss('.photo-credit', { 'min-height': '2.8em' });
  assertCss('.media-gallery-grid', { 'grid-auto-rows': 'auto', 'align-items': 'stretch' });
  assertCss('.media-gallery-entry .photo-card', { height: 'auto', overflow: 'visible' });
  assertCss('.media-gallery-entry .photo-button', { flex: 'none', height: 'auto' });
  assertCss('.media-page', { width: '100%', 'margin-inline': 'auto' });
  assertCss('.photo-gallery', { 'grid-auto-rows': 'auto', 'margin-bottom': '14px' });
  assertCss('.photo-gallery .photo-card', { height: 'auto', overflow: 'visible' });
  assertCss('.lightbox', {
    position: 'fixed', inset: '50% auto auto 50%', margin: '0', transform: 'translate(-50%, -50%)',
    'overflow-y': 'auto', 'overscroll-behavior': 'contain',
  });
  assert.match(mainSource, /viewSections\.forEach\(\(section\) => \{ section\.hidden = section\.id !== active; \}\)/);
  assert.match(mainSource, /\['roadbook', 'media', 'logistics'\]/);
  assert.match(mainSource, /setAttribute\('aria-current', 'page'\)/);
  assert.match(mainSource, /history\.pushState\(null, '', `#\$\{id\}`\)/);
  assert.match(mainSource, /window\.scrollTo\(0, 0\)/);
  assert.match(mainSource, /addEventListener\('hashchange'/);
  assert.match(mainSource, /addEventListener\('popstate'/);
  assert.match(mainSource, /map\.resize\(\)/);
  for (const selector of ['.roadbook-layout[hidden]', '.media-page[hidden]', '.logistics-section[hidden]']) {
    assertCss(selector, { display: 'none !important' });
  }
  assert.ok(shellDocument.querySelector('#media-type-filter'));
  assert.ok(shellDocument.querySelector('#media-stage-filter'));
});

test('centers the settings dialog heading', () => {
  const heading = shellDocument.querySelector('#settings-dialog h2#settings-title');
  assert.equal(normalizeText(heading), 'Einstellungen');
  const declarations = css.declarations('.settings-dialog h2');
  assert.equal(declarations['text-align'], 'center');
  assert.equal(declarations.margin, '0 0 20px');
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
  const settings = shellDocument.querySelector('#settings-dialog');
  assert.ok(settings, 'settings dialog must be rendered');
  const versionGrid = settings.querySelector('section.version-current-grid');
  assert.equal(versionGrid?.getAttribute('aria-label'), 'Aktueller Versionsstand');
  for (const [toggleId, historyId] of [
    ['app-version-toggle', 'app-version-history'],
    ['service-worker-version-toggle', 'service-worker-version-history'],
  ]) {
    const toggle = settings.querySelector(`button#${toggleId}.version-current-card`);
    assert.ok(toggle, toggleId);
    assert.equal(toggle.getAttribute('type'), 'button');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.getAttribute('aria-controls'), historyId);
    const indicator = toggle.querySelector('.version-history-indicator');
    assert.equal(indicator?.getAttribute('aria-hidden'), 'true');
    assert.equal(normalizeText(indicator), '▾');
    const history = settings.querySelector(`section#${historyId}.settings-history`);
    assert.ok(history?.hasAttribute('hidden'), `${historyId} starts collapsed`);
  }
  for (const id of ['version-current', 'service-worker-current']) {
    assert.ok(normalizeText(settings.querySelector(`strong#${id}`)), `${id} shows a placeholder or value`);
  }
  assert.equal(settings.querySelector('details, summary'), null);
  assert.doesNotMatch(
    normalizeText(settings), /App-Versionsverlauf|Service-Worker- \/ Cache-Verlauf/,
  );
  assert.ok(isBefore(settings.querySelector('#refresh-app'), versionGrid),
    'version cards must follow the update button');
  assert.match(mainSource, /const historyToggles = \[\.\.\.dialog\.querySelectorAll\('\[data-version-history-toggle\]'\)\]/);
  assert.match(mainSource, /toggleButton\.setAttribute\('aria-expanded', String\(expanded\)\)/);
  assert.match(mainSource, /history\.hidden = !expanded/);
  assert.ok(settings.querySelector('#app-version-history-list.version-history-list'));
  assert.ok(settings.querySelector('#service-worker-history-list.version-history-list'));
  assert.match(mainSource, /serviceWorkerCurrent\.textContent = data\.serviceWorkerCache/);
  assert.match(mainSource, /serviceWorkerList\.innerHTML = data\.serviceWorkerHistory\.map/);

  assertCss('.settings-dialog', {
    'box-sizing': 'border-box', width: 'min(460px, calc(100vw - 32px))',
    'overflow-x': 'hidden', 'overflow-y': 'auto',
  });
  assertCss('.settings-dialog > .settings-group', {
    'box-sizing': 'border-box', width: '100%', 'max-width': '100%', 'min-width': '0',
  });
  assertCss('.version-current-grid', {
    display: 'grid', 'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
  });
  assertCss('.version-current-card', {
    'box-sizing': 'border-box', display: 'grid', width: '100%', 'max-width': '100%',
    'min-width': '0', 'min-height': '60px',
  });
  assertCss('.version-current-card:hover', { 'border-color': 'var(--accent)' });
  assertCss('.version-current-card:focus-visible', { outline: '2px solid var(--marker-highlight)' });
  assertCss('.version-current-card:active', { transform: 'translateY(1px)' });
  assertCss('.version-current-card[aria-expanded="true"] .version-history-indicator', {
    transform: 'rotate(180deg)',
  });
  assertCss('.settings-history', {
    'box-sizing': 'border-box', width: '100%', 'max-width': '100%', 'min-width': '0', margin: '8px 0 0',
  });
  assertCss('.settings-history .version-history-list', {
    'box-sizing': 'border-box', width: '100%', 'max-width': '100%',
  });
  assert.ok(css.has(':root[data-font-size="5"] .version-current-card'));
  assert.equal(
    css.entries.some((entry) => entry.selector === '.settings-history .version-history-list'
      && 'max-height' in entry.declarations),
    false,
    'history lists must not get their own max-height',
  );
});
