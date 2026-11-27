import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  bindSelfCheck, buildHighlightSlides, buildTourOverview, createSlideshowController, createTourScrollMemory, formatDateRange, readSlideshowSettings,
  renderTourOverview, saveSlideshowSetting, SLIDESHOW_SETTINGS, SLIDESHOW_STORAGE_KEY, transportKind, validateTourInfo,
} from '../src/tour-overview.js';
import { ferryConnections, ferryRoute, tourFitOptions } from '../src/map.js';
import { loadDays, loadTourInfo } from './helpers/content.js';
import {
  extractTemplate, normalizeCssValue, normalizeText, parseCss, parseHtml,
} from './helpers/dom.js';

const [mainSource, overviewSource, styleSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/tour-overview.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
]);
const days = await loadDays();
const info = await loadTourInfo(days);
const css = parseCss(styleSource);
const shell = parseHtml(extractTemplate(mainSource, /function renderShell\(\)\s*\{\s*app\.innerHTML\s*=\s*`/));

function day(tag, overrides = {}, transport = 'Motorrad.') {
  return {
    frontmatter: {
      tag, datum: `2027-09-${String(7 + tag).padStart(2, '0')}`, titel: `Titel ${tag}`,
      start: `Start ${tag}`, ziel: `Ziel ${tag}`, kilometer: 100, ...overrides,
    },
    body: transport ? `Text\n\n**Transport:** ${transport}` : 'Text',
  };
}

const baseInfo = (extra = {}) => ({
  laender: ['A', 'B'], kern_highlights: [{ tag: 2, kurz: 'Test', land: 'A', info_url: 'https://de.wikipedia.org/wiki/Test' }], teilnahme: null, kontakt: null, selbstcheck: [], hinweise: ['Stand offen.'],
  ...extra,
});

const pageText = (document) => normalizeText(document.body);

function render(days_, info_) {
  return parseHtml(renderTourOverview(buildTourOverview(days_, info_), info_));
}

test('tour data in content/tour.md is valid for the real stage files', () => {
  assert.ok(info.laender.length > 0);
  assert.ok(info.hinweise.length > 0);
  for (const { tag } of info.kern_highlights) {
    assert.ok(days.some((entry) => entry.frontmatter.tag === tag), `Etappe ${tag}`);
  }
});

test('tour data validation rejects unknown, unsafe and malformed values', () => {
  const tags = [1, 2, 3];
  const valid = {
    laender: ['A'], kern_highlights: [{ tag: 1, kurz: 'Test', land: 'A', info_url: 'https://de.wikipedia.org/wiki/Test' }], hinweise: ['x'],
    teilnahme: { max_motorraeder: 3, solo: true }, kontakt: { label: 'IG', url: 'https://example.org/x' },
  };
  assert.deepEqual(validateTourInfo(valid, tags).teilnahme, { max_motorraeder: 3, solo: true });
  assert.equal(validateTourInfo({ ...valid, teilnahme: undefined, kontakt: undefined }, tags).kontakt, null);
  for (const [label, patch] of Object.entries({
    'unbekanntes Feld': { gruppe: 4 },
    'http statt https': { kontakt: { label: 'IG', url: 'http://example.org' } },
    'javascript-Adresse': { kontakt: { label: 'IG', url: 'javascript:alert(1)' } },
    'Kontakt ohne Label': { kontakt: { label: ' ', url: 'https://example.org' } },
    'unbekannte Etappe': { kern_highlights: [{ ...valid.kern_highlights[0], tag: 9 }] },
    'doppelte Etappe': { kern_highlights: [valid.kern_highlights[0], valid.kern_highlights[0]] },
    'unbekanntes Land': { kern_highlights: [{ ...valid.kern_highlights[0], land: 'B' }] },
    'leerer Kurztitel': { kern_highlights: [{ ...valid.kern_highlights[0], kurz: '' }] },
    'unsichere Infoadresse': { kern_highlights: [{ ...valid.kern_highlights[0], info_url: 'javascript:alert(1)' }] },
    'falsche Infoquelle': { kern_highlights: [{ ...valid.kern_highlights[0], info_url: 'https://example.org/wiki/Test' }] },
    'keine Highlights': { kern_highlights: [] },
    'Null Motorräder': { teilnahme: { max_motorraeder: 0 } },
    'Gruppengröße als Text': { teilnahme: { max_motorraeder: '5' } },
    'unbekanntes Teilnahmefeld': { teilnahme: { modell: 'x' } },
    'Solo kein Boolean': { teilnahme: { solo: 'ja' } },
    'leere Länder': { laender: [] },
    'fehlende Hinweise': { hinweise: undefined },
    'Selbstcheck kein Text': { selbstcheck: [1] },
  })) {
    assert.throws(() => validateTourInfo({ ...valid, ...patch }, tags), /content\/tour\.md/, label);
  }
  assert.throws(() => validateTourInfo(null, tags), /Frontmatter/);
});

test('overview figures are derived from the stage files', () => {
  const overview = buildTourOverview(days, info);
  const kilometers = days.map((entry) => entry.frontmatter.kilometer);
  assert.equal(overview.dayCount, days.length);
  assert.equal(overview.entries.length, days.length);
  assert.equal(overview.totalKm, Math.round(kilometers.reduce((a, b) => a + b, 0) * 10) / 10);
  assert.equal(Math.round((overview.tourKm + overview.gespannKm) * 10) / 10, overview.totalKm);
  assert.equal(overview.tourDays + overview.gespannDays + overview.unknownDays, days.length);
  assert.equal(overview.unknownDays, 0, 'jede Etappe nennt ihren Transport');
  const kmOf = (kind) => Math.round(days.filter((entry) => transportKind(entry.body) === kind)
    .reduce((sum, entry) => sum + entry.frontmatter.kilometer, 0) * 10) / 10;
  assert.equal(overview.motorcycleKm, kmOf('motorrad'));
  assert.equal(overview.ferryKm, kmOf('faehre'));
  assert.equal(overview.gespannKm, kmOf('gespann'));
  assert.equal(overview.motorcycleDays + overview.ferryDays + overview.gespannDays, days.length);
  assert.equal(Math.round((overview.motorcycleKm + overview.ferryKm + overview.gespannKm) * 10) / 10, overview.totalKm);
  const dates = days.map((entry) => entry.frontmatter.datum).sort();
  const span = (Date.parse(dates.at(-1)) - Date.parse(dates[0])) / 86400000 + 1;
  assert.equal(overview.calendarDays, span);
  assert.equal(overview.startPlace, days[0].frontmatter.start);
  assert.equal(overview.endPlace, days.at(-1).frontmatter.ziel);
  assert.deepEqual(overview.highlights.map((entry) => entry.tag), info.kern_highlights.map((entry) => entry.tag));
});

test('transport decides between towing days and motorcycle or ferry days', () => {
  assert.equal(transportKind('x\n\n- **Transport:** PKW + Anhänger.'), 'gespann');
  assert.equal(transportKind('**Transport:** Motorrad.  '), 'motorrad');
  assert.equal(transportKind('**Transport:** Fähre als Fußpassagiere, anschließend Motorrad.'), 'motorrad');
  assert.equal(transportKind('**Transport:** Motorrad + geplante Fähre.'), 'motorrad');
  assert.equal(transportKind('**Transport:** Fähre.'), 'faehre');
  assert.equal(transportKind('**Transport:** Zug.'), 'unbekannt');
  assert.equal(transportKind('Kein Transport genannt.'), 'unbekannt');
  assert.equal(transportKind(undefined), 'unbekannt');
});

test('overview totals separate towing days and keep unknown days out of the split', () => {
  const overview = buildTourOverview([
    day(1, { kilometer: 400.5 }, 'PKW + Anhänger.'),
    day(2, { kilometer: 150.25 }),
    day(3, { kilometer: 10 }, 'Fähre.'),
    day(4, { kilometer: 5 }, null),
  ], baseInfo());
  assert.equal(overview.totalKm, 565.8);
  assert.equal(overview.gespannKm, 400.5);
  assert.equal(overview.tourKm, 160.3);
  assert.equal([overview.motorcycleKm, overview.ferryKm].join(), '150.3,10');
  assert.equal([overview.gespannDays, overview.motorcycleDays, overview.ferryDays, overview.tourDays, overview.unknownDays].join(), '1,1,1,2,1');
  assert.equal(overview.tourRange, 'Tag 2–3');
  const split = buildTourOverview([day(1), day(2, {}, 'PKW.'), day(3)], baseInfo({ kern_highlights: [{ tag: 1 }] }));
  assert.equal(split.tourRange, '', 'nicht zusammenhängende Tourtage werden nicht als Bereich genannt');
  const text = pageText(render([day(1, {}, 'PKW.'), day(2), day(3, {}, null)], baseInfo()));
  assert.match(text, /Summe der Etappenstrecken/);
  assert.doesNotMatch(text, /auf dem Motorrad|PKW und Anhänger für An-/);
});

test('first screen fills the viewport below the header and puts the key figures above the map row', () => {
  const heroStyle = css.declarations('.tour-hero');
  assert.equal(heroStyle['min-height'], 'calc(100dvh - var(--header-height, 64px) - var(--tour-start-top))');
  assert.equal(heroStyle.display, 'flex');
  assert.equal(heroStyle['flex-direction'], 'column');
  assert.equal(heroStyle['justify-content'], 'space-between');
  assert.equal(heroStyle['box-sizing'], 'border-box');
  assert.equal(heroStyle['padding-bottom'], '16px');
  assert.ok(Number.parseInt(css.declarations('.tour-hero-main')['column-gap'], 10) > 0);
  assert.equal(css.declarations('.tour-start', '@media (max-width: 767px)')['--tour-start-top'], '16px');
  assert.equal(css.declarations('.tour-hero-main', '@media (max-width: 767px)').flex, 'none');
  assert.equal(css.declarations('.tour-mobile-summary', '@media (max-width: 767px)').display, 'grid');
  assert.match(css.declarations('.tour-mobile-summary', '@media (max-width: 767px)')['font-size'], /^clamp\(/);
  assert.equal(css.declarations('.tour-mobile-summary')['font-size'], undefined, 'mobile typography cap does not affect desktop');
  const document = render(days, info);
  const block = document.querySelector('.tour-hero-main > .tour-facts-block');
  assert.ok(block.querySelector('.tour-facts'), 'Kennzahlenkarten stehen im ersten Bildschirm');
  assert.ok(block.querySelector('.tour-breakdown'), 'Aufschlüsselung steht im ersten Bildschirm');
  assert.equal(css.declarations('.tour-facts-block')['grid-area'], 'facts');
  assert.equal(css.declarations('.tour-facts-block', '@media (max-width: 767px)').display, 'none', 'mobil zeigt nur die kompakte Zusammenfassung');
  assert.equal(document.querySelectorAll('.tour-facts').length, 1);
  const order = (selector) => renderTourOverview(buildTourOverview(days, info), info).indexOf(selector);
  assert.ok(order('class="tour-hero"') < order('tour-facts-block') && order('tour-facts-block') < order('tour-join'), 'Mitfahren folgt erst nach dem ersten Bildschirm');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /bindHeaderHeight\(document\.querySelector\('\.site-header'\)\)/);
});

test('landing page shows the kilometre and stage split derived from the stage files', () => {
  const overview = buildTourOverview(days, info);
  const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const document = render(days, info);
  const [kilometres, stages] = [...document.querySelectorAll('.tour-facts-block .tour-breakdown p')].map(normalizeText);
  assert.ok(kilometres.startsWith(`${number.format(overview.totalKm)} km gesamt`));
  assert.ok(kilometres.includes(`· ${number.format(overview.motorcycleKm)} km Motorrad`));
  assert.ok(kilometres.includes(`· ${number.format(overview.gespannKm)} km Auto mit Anhänger`));
  assert.doesNotMatch(pageText(document), /ca\.\s*[\d.,]+\s*km/, 'Kilometer stehen überall ohne „ca.“');
  assert.equal(stages, `${overview.dayCount} Etappen · ${overview.gespannDays} Auto · ${overview.motorcycleDays} Motorrad · ${overview.ferryDays} Fähre`);
  // Tag 19 nennt 0 km; eine Fährstrecke wird nicht erfunden.
  assert.equal(overview.ferryKm, 0);
  assert.ok(kilometres.includes('Fähre ohne Kilometerangabe'));
  assert.doesNotMatch(kilometres, /0 km Fähre/);
  assert.equal(overview.compactRange, '08.–29.09.2027');
  const withFerryKm = buildTourOverview([day(1, { kilometer: 100 }), day(2, { kilometer: 40 }, 'Fähre.')], baseInfo({ kern_highlights: [{ tag: 1 }] }));
  assert.match(pageText(render([day(1, { kilometer: 100 }), day(2, { kilometer: 40 }, 'Fähre.')], baseInfo())), /· 40 km Fähre/);
  assert.equal(withFerryKm.ferryKm, 40);
  assert.equal(normalizeText(document.querySelector('.tour-intro-mobile')), 'Unsere Tour, dein Abenteuer!');
  assert.doesNotMatch(pageText(document), /Dein Abenteuer\./);
});

test('overview rejects missing stages, bad dates and unknown highlight stages', () => {
  assert.throws(() => buildTourOverview([], baseInfo()), /keine Etappen/);
  assert.throws(() => buildTourOverview([day(1, { datum: '8.9.2027' })], baseInfo({ kern_highlights: [{ tag: 1 }] })), /ungültiges Datum/);
  assert.throws(() => buildTourOverview([day(1, { datum: '2027-02-31' })], baseInfo({ kern_highlights: [{ tag: 1 }] })), /ungültiges Datum/);
  assert.throws(() => buildTourOverview([day(1)], baseInfo({ kern_highlights: [{ tag: 7 }] })), /fehlende Etappe 7/);
});

test('date ranges name month and year once when possible', () => {
  const at = (value) => new Date(`${value}T00:00:00Z`);
  assert.equal(formatDateRange(at('2027-09-08'), at('2027-09-29')), '08.–29. September 2027');
  assert.equal(formatDateRange(at('2027-09-28'), at('2027-10-05')), '28. September – 05. Oktober 2027');
  assert.equal(formatDateRange(at('2027-12-30'), at('2028-01-02')), '30. Dezember 2027 – 02. Januar 2028');
  assert.equal(formatDateRange(at('2027-09-08'), at('2027-09-08')), '08.–08. September 2027');
});

test('landing page offers a direct entry into every roadbook day', () => {
  const document = render(days, info);
  const cta = document.querySelector('a.tour-cta');
  assert.equal(cta.getAttribute('href'), '#roadbook');
  assert.ok(cta.hasAttribute('data-view-link'));
  assert.match(normalizeText(cta), new RegExp(`Zu den ${days.length} Etappen`));
  const itinerary = [...document.querySelectorAll('.tour-itinerary a[data-open-day]')];
  assert.deepEqual(itinerary.map((link) => link.getAttribute('data-open-day')), days.map((_, index) => String(index)));
  days.forEach((entry, index) => {
    const row = normalizeText(itinerary[index]);
    assert.ok(row.startsWith(String(entry.frontmatter.tag).padStart(2, '0')), row);
    assert.ok(row.includes(`${entry.frontmatter.start} → ${entry.frontmatter.ziel}`), row);
  });
  assert.deepEqual(
    [...document.querySelectorAll('.tour-card-list a[data-open-day]')].map((link) => Number(link.getAttribute('data-open-day'))),
    info.kern_highlights.map(({ tag }) => days.findIndex((entry) => entry.frontmatter.tag === tag)),
  );
  assert.deepEqual(
    [...document.querySelectorAll('.tour-chips li')].map(normalizeText), info.laender,
  );
  assert.deepEqual(
    [...document.querySelectorAll('.tour-facts dt')].map(normalizeText),
    ['ZEITRAUM', 'STRECKE', 'TOURTAGE', 'LÄNDER'],
  );
  assert.equal(document.querySelector('h1#tour-title') !== null, true);
});

test('highlights have separate country badges and secure Wikipedia links', () => {
  const document = render(days, info);
  const cards = [...document.querySelectorAll('.tour-card-list > li')];
  assert.equal(cards.length, info.kern_highlights.length);
  cards.forEach((card, index) => {
    const entry = info.kern_highlights[index];
    const link = card.querySelector('.tour-info-link');
    assert.equal(normalizeText(card.querySelector('.tour-country')), entry.land);
    assert.equal(link.getAttribute('href'), entry.info_url);
    assert.equal(link.getAttribute('target'), '_blank');
    assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(link.closest('a[data-open-day]'), null);
  });
});

test('landing page uses personal address, explains bookings and contains the overview map', () => {
  const document = render(days, info);
  const text = pageText(document);
  assert.match(text, /Dein Überblick zur Tour/);
  assert.doesNotMatch(text, /\b(?:Euer|Eure|Euch|wir|uns)\b/i);
  assert.match(text, /Fährverbindungen werden vorab gebucht/);
  assert.match(text, /Basislager bei Villach.*letzte Hotel bei Igoumenitsa.*voraussichtlich ebenfalls vorgebucht/);
  assert.ok(document.querySelector('.tour-hero #tour-map[aria-label]'));
  assert.equal(document.querySelector('.tour-map-panel h2'), null, 'die Karte steht ohne Überschrift');
  assert.doesNotMatch(pageText(document), /auf einen Blick/);
  assert.ok(document.querySelector('#tour-map-status[role="status"]'));
});

test('hero has one CTA after the map and an accessible ferry legend', () => {
  const document = render(days, info);
  const hero = document.querySelector('.tour-hero');
  assert.deepEqual([...hero.children].map((element) => element.className), ['tour-hero-main', 'tour-cta-row']);
  assert.deepEqual([...hero.querySelector('.tour-hero-main').children].map((element) => element.className), [
    'tour-hero-copy', 'tour-mobile-highlights', 'tour-map-panel', 'tour-mobile-summary', 'tour-facts-block',
  ]);
  assert.equal(normalizeText(hero.querySelector('.tour-ferry-legend-desktop')), 'Fährverbindung (ca. Linie)');
  assert.equal(normalizeText(hero.querySelector('.tour-ferry-legend-mobile')), 'Fährverbindung');
  assert.ok(hero.querySelector('#tour-ferry-legend').hasAttribute('hidden'));
  assert.equal(css.declarations('.tour-ferry-legend-mobile').display, 'none');
  assert.equal(css.declarations('.tour-ferry-legend-mobile', '@media (max-width: 767px)').display, 'inline');
  assert.equal(css.declarations('.tour-ferry-legend-desktop', '@media (max-width: 767px)').display, 'none');
  assert.equal(css.declarations('.tour-hero-main', '@media (max-width: 767px)')['grid-template-areas'], '"copy copy" "highlights map" "summary summary"');
  assert.equal(css.declarations('.tour-hero-main')['grid-template-areas'], '"copy map" "facts map"');
  const row = hero.querySelector('.tour-cta-row');
  assert.deepEqual([...row.children].map((element) => element.className), ['tour-mobile-route', 'button button-primary tour-cta']);
  assert.match(normalizeText(row.querySelector('.tour-mobile-route')), /^.+ [↔→] .+$/);
  const rowStyle = css.declarations('.tour-cta-row');
  assert.equal(rowStyle.display, 'flex');
  assert.equal(rowStyle['align-items'], 'center');
  assert.equal(rowStyle['justify-content'], 'space-between');
  assert.equal(rowStyle.gap, '12px');
  assert.equal(css.declarations('.tour-map-panel', '@media (min-width: 768px)')['align-self'], 'stretch');
  assert.equal(css.declarations('#tour-map', '@media (min-width: 768px)')['min-height'], '290px');
});

test('compact highlights and summary use the same validated tour data', () => {
  const document = render(days, info);
  const rows = [...document.querySelectorAll('.tour-mobile-highlights li')];
  assert.equal(rows.length, info.kern_highlights.length);
  rows.forEach((row, index) => {
    const entry = info.kern_highlights[index];
    assert.match(normalizeText(row), new RegExp(entry.kurz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const links = [...row.querySelectorAll('a')];
    assert.equal(links.length, 1, 'der Highlight-Titel ist der einzige Link der Zeile');
    const [wiki] = links;
    assert.ok(wiki.classList.contains('tour-mobile-wiki'));
    assert.equal(normalizeText(wiki), `${String(entry.tag).padStart(2, '0')} ${entry.kurz}`);
    assert.equal(wiki.getAttribute('href'), entry.info_url);
    assert.equal(wiki.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(wiki.getAttribute('target'), '_blank');
    assert.ok(wiki.getAttribute('aria-label').includes(normalizeText(wiki)), 'sichtbarer Text steckt im Namen');
    assert.doesNotMatch(normalizeText(row), /Wiki\b/);
  });
  const wikiRule = css.declarations('.tour-mobile-highlights li > a', '@media (max-width: 767px)');
  assert.equal(wikiRule['min-height'], '44px');
  assert.equal(wikiRule['min-width'], '44px');
  const overview = buildTourOverview(days, info);
  const summary = normalizeText(document.querySelector('.tour-mobile-summary'));
  assert.ok(summary.includes(overview.compactRange));
  assert.ok(summary.includes(`${overview.calendarDays} Tage`));
  const rounded = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  assert.ok(summary.includes(rounded.format(overview.totalKm)));
  assert.ok(summary.includes(rounded.format(overview.tourKm)));
  assert.ok(info.laender.every((country) => summary.includes(country)));
  assert.doesNotMatch(summary, /↔|→/, 'Start und Ziel stehen neben dem Button, nicht in der Zusammenfassung');
  assert.equal(normalizeText(document.querySelector('.tour-mobile-route')), `${overview.startPlace} ${overview.startPlace === overview.endPlace ? '↔' : '→'} ${overview.endPlace}`);
  assert.equal(normalizeText(document.querySelector('.tour-cta-mobile')), 'Zur Tour');
});

test('final mobile layout: compact highlights beside a full-height map and the bento summary with share bar', () => {
  const overview = buildTourOverview(days, info);
  const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const document = render(days, info);
  assert.equal(document.querySelector('.tour-design-switch'), null, 'kein Design-Umschalter mehr');
  assert.equal(document.querySelector('[data-design]'), null);
  assert.doesNotMatch(overviewSource + mainSource, /design=|tourDesignFromSearch|TOUR_DESIGNS/);
  assert.doesNotMatch(styleSource, /tour-design-switch|data-design/);
  assert.deepEqual([...document.querySelector('.tour-map-panel').children].map((element) => element.tagName.toLowerCase() + (element.className ? `.${element.className}` : '')), [
    'div.tour-map-frame', 'p.tour-note',
  ]);
  assert.deepEqual([...document.querySelectorAll('.tour-bento > div')].map((tile) => [
    tile.className, normalizeText(tile.querySelector('span')), tile.querySelector('strong') ? normalizeText(tile.querySelector('strong')) : '',
  ]), [
    ['tour-bento-hero', 'Strecke gesamt', `${number.format(overview.totalKm)} km`],
    ['tour-bento-cell is-accent', 'Motorrad', `${number.format(overview.motorcycleKm)} km`],
    ['tour-bento-cell', 'Auto', `${number.format(overview.gespannKm)} km`],
    ['tour-bento-countries', `${overview.countries.length} Länder`, ''],
  ]);
  const split = document.querySelector('.tour-bento-hero strong + .tour-bento-split');
  assert.ok(split, 'Proportionsbalken direkt unter der Gesamtstrecke');
  assert.deepEqual([...split.children].map((part) => [part.className, part.getAttribute('style')]), [
    ['tour-bento-split-part is-accent', `flex-grow: ${Math.round(overview.motorcycleKm)}`],
    ['tour-bento-split-part', `flex-grow: ${Math.round(overview.gespannKm)}`],
  ]);
  assert.deepEqual([...document.querySelectorAll('.tour-bento-matrix li')].map(normalizeText), overview.countries);
  const text = normalizeText(document.querySelector('.tour-mobile-summary'));
  for (const part of ['08.–29.09.2027 · 22 Tage', `${overview.dayCount} Etappen`, `${overview.motorcycleDays} Motorrad`, `${overview.gespannDays} Auto · ${overview.ferryDays} Fähre`]) {
    assert.ok(text.includes(part), part);
  }
  assert.doesNotMatch(text, /ca\.|Anhänger|↔/);

  const mobile = '@media (max-width: 767px)';
  const grid = css.declarations('.tour-hero-main', mobile);
  assert.equal(grid['grid-template-columns'], 'minmax(0, 35fr) minmax(0, 65fr)');
  assert.equal(grid.gap, '.5rem 8px');
  assert.equal(css.declarations('.tour-map-panel', mobile)['align-self'], 'stretch', 'Karte füllt die Höhe der Highlight-Spalte');
  assert.equal(css.declarations('#tour-map', mobile).flex, '1 1 auto');
  assert.equal(css.declarations('.tour-mobile-highlights li > a', mobile)['min-height'], '44px');
  for (const selector of ['.tour-bento span', '.tour-bento-hero strong', '.tour-bento-cell strong', '.tour-bento-matrix li']) {
    assert.match(css.declarations(selector, mobile)['font-size'], /^clamp\(\d+px, [\d.]+rem, \d+px\)$/, selector);
  }
});

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key) => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, String(value)), data };
}

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function fakeTimers() {
  let now = 0;
  let id = 0;
  const pending = new Map();
  return {
    setTimeout(callback, delay) { id += 1; pending.set(id, { at: now + delay, callback }); return id; },
    clearTimeout(timer) { pending.delete(timer); },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const [nextId, next] = [...pending].sort(([, a], [, b]) => a.at - b.at)[0] ?? [];
        if (!next || next.at > end) break;
        pending.delete(nextId);
        now = next.at;
        next.callback();
      }
      now = end;
    },
    get pending() { return pending.size; },
  };
}

test('slideshow starts hidden over the bento grid and offers a 44 px way back', () => {
  const document = render(days, info);
  const summary = document.querySelector('.tour-mobile-summary');
  assert.deepEqual([...summary.children].map((child) => child.className), ['tour-bento', 'tour-slideshow']);
  const slideshow = summary.querySelector('.tour-slideshow');
  assert.ok(slideshow.hasAttribute('hidden'), 'Startzustand ist das Bento-Grid');
  assert.ok(slideshow.querySelector('img.tour-slideshow-image'));
  assert.ok(slideshow.querySelector('figcaption .tour-slideshow-title'));
  assert.match(slideshow.querySelector('.tour-slideshow-close').getAttribute('aria-label'), /Übersicht/);
  const mobile = '@media (max-width: 767px)';
  assert.equal(css.declarations('.tour-slideshow', mobile).position, 'absolute');
  assert.equal(css.declarations('.tour-slideshow', mobile).inset, '0', 'gleiche Fläche wie das Bento');
  assert.equal(css.declarations('.tour-mobile-summary.is-slideshow .tour-bento', mobile).visibility, 'hidden', 'Bento hält die Höhe');
  assert.equal(css.declarations('.tour-slideshow-close', mobile).width, '44px');
  assert.equal(css.declarations('.tour-slideshow-close', mobile).height, '44px');
});

test('slideshow settings use defaults, clamp to limits and persist all four values', () => {
  assert.deepEqual(readSlideshowSettings(memoryStorage()), { enabled: true, photosPerHighlight: 2, secondsPerImage: 5, slideshowSeconds: 30, idleSeconds: 15 });
  assert.deepEqual(Object.values(SLIDESHOW_SETTINGS).map(({ min, max }) => [min, max]), [[1, 5], [2, 15], [10, 120], [5, 120]]);
  const storage = memoryStorage();
  saveSlideshowSetting(storage, 'photosPerHighlight', 9);
  saveSlideshowSetting(storage, 'secondsPerImage', '0');
  saveSlideshowSetting(storage, 'slideshowSeconds', 45.4);
  const saved = saveSlideshowSetting(storage, 'idleSeconds', 'abc');
  assert.deepEqual(saved, { enabled: true, photosPerHighlight: 5, secondsPerImage: 2, slideshowSeconds: 45, idleSeconds: 15 });
  assert.deepEqual(JSON.parse(storage.getItem(SLIDESHOW_STORAGE_KEY)), saved);
  assert.deepEqual(readSlideshowSettings(storage), saved);
  assert.throws(() => saveSlideshowSetting(storage, 'speed', 3), /Unbekannte/);
  assert.deepEqual(Object.entries(SLIDESHOW_SETTINGS).map(([name, { label, default: value }]) => [name, label, value]), [
    ['photosPerHighlight', 'Bilder pro Highlight', 2],
    ['secondsPerImage', 'Anzeigedauer pro Bild', 5],
    ['slideshowSeconds', 'Dauer der Slideshow', 30],
    ['idleSeconds', 'Standardbild bis zur nächsten Slideshow', 15],
  ]);
  assert.match(mainSource, /<fieldset class="settings-group slideshow-settings">\s*<legend>Startseiten-Slideshow<\/legend>/);
  assert.equal(css.declarations('.slideshow-setting input')['min-height'], '44px');
  const original = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(readSlideshowSettings(memoryStorage({ [SLIDESHOW_STORAGE_KEY]: '{kaputt' })).secondsPerImage, 5);
  } finally {
    console.error = original;
  }
  assert.match(mainSource, /data-slideshow-setting="\$\{name\}"/);
  assert.match(mainSource, /Object\.entries\(SLIDESHOW_SETTINGS\)/);
  assert.match(mainSource, /saveSlideshowSetting\(localStorage/);
});

test('slideshow switch defaults to on, persists off and prevents timers and slides', () => {
  const storage = memoryStorage({ [SLIDESHOW_STORAGE_KEY]: JSON.stringify({ photosPerHighlight: 3 }) });
  assert.equal(readSlideshowSettings(storage).enabled, true, 'bestehende Einstellungen bleiben aktiviert');
  const timers = fakeTimers();
  const shown = [];
  let builds = 0;
  const controller = createSlideshowController({
    timers,
    getSettings: () => readSlideshowSettings(storage),
    getSlides: () => { builds += 1; return [{ title: 'Highlight' }]; },
    render: (slide) => shown.push(slide?.title ?? 'bento'),
  });
  controller.start();
  timers.advance(15000);
  assert.equal(shown.at(-1), 'Highlight');
  assert.equal(saveSlideshowSetting(storage, 'enabled', false).photosPerHighlight, 3);
  controller.start();
  assert.equal(shown.at(-1), 'bento');
  assert.equal(timers.pending, 0, 'aktiver Timer wird beim Ausschalten geräumt');
  controller.start();
  timers.advance(240000);
  assert.equal(timers.pending, 0);
  assert.equal(builds, 1, 'ausgeschaltet werden keine Slides erzeugt');
  assert.equal(readSlideshowSettings(storage).enabled, false);
  assert.equal(JSON.parse(storage.getItem(SLIDESHOW_STORAGE_KEY)).enabled, false);
  assert.throws(() => saveSlideshowSetting(storage, 'enabled', 'false'), /Boolean/);
  saveSlideshowSetting(storage, 'enabled', true);
  controller.start();
  assert.equal(timers.pending, 1, 'erneutes Einschalten startet die normale Pause');
  timers.advance(15000);
  assert.equal(shown.at(-1), 'Highlight');
  controller.stop();
});

test('highlight slides pick at most N random photos per highlight with highlight caption and credit', () => {
  const overview = buildTourOverview(days, info);
  const urls = Object.fromEntries(days.flatMap(({ frontmatter }) => frontmatter.bilder.map((photo) => [photo.datei, `/media/${photo.datei}`])));
  const slides = buildHighlightSlides(overview.highlights, days, urls, 2, seededRandom(1));
  assert.equal(slides.length, overview.highlights.length * 2);
  for (const highlight of overview.highlights) {
    const own = slides.filter((slide) => slide.tag === highlight.tag);
    assert.equal(own.length, 2, `Tag ${highlight.tag}`);
    assert.ok(own.every((slide) => slide.title === highlight.kurz));
    const photos = days[highlight.index].frontmatter.bilder;
    for (const slide of own) {
      const photo = photos.find((candidate) => urls[candidate.datei] === slide.src);
      assert.ok(photo, 'Bild stammt aus der Highlight-Etappe');
      assert.equal(slide.credit, `${photo.urheber} · ${photo.lizenz}`);
    }
  }
  const other = buildHighlightSlides(overview.highlights, days, urls, 2, seededRandom(7));
  assert.notDeepEqual(other.map((slide) => slide.src), slides.map((slide) => slide.src), 'Auswahl und Reihenfolge sind zufällig');
  assert.equal(buildHighlightSlides(overview.highlights, days, urls, 9, seededRandom(1)).length,
    overview.highlights.reduce((sum, highlight) => sum + Math.min(5, days[highlight.index].frontmatter.bilder.length), 0), 'Limit höchstens 5');
  assert.deepEqual(buildHighlightSlides(overview.highlights, days, {}, 2), [], 'fehlende Bilder ergeben keine Slides');
});

test('slideshow controller cycles bento → images → bento and cleans up its timers', () => {
  const timers = fakeTimers();
  const shown = [];
  let builds = 0;
  const settings = { photosPerHighlight: 2, secondsPerImage: 5, slideshowSeconds: 30, idleSeconds: 15 };
  const controller = createSlideshowController({
    timers,
    getSettings: () => settings,
    getSlides: () => { builds += 1; return [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }]; },
    render: (slide) => shown.push(slide?.title ?? 'bento'),
  });
  controller.start();
  assert.deepEqual(shown, ['bento'], 'Start mit dem Bento-Grid');
  timers.advance(14999);
  assert.deepEqual(shown, ['bento']);
  timers.advance(1);
  assert.deepEqual(shown, ['bento', 'A']);
  timers.advance(25000);
  assert.deepEqual(shown, ['bento', 'A', 'B', 'C', 'D', 'A', 'B'], '30 s / 5 s = 6 Bilder, Folge läuft zyklisch');
  timers.advance(5000);
  assert.equal(shown.at(-1), 'bento', 'nach der Slideshow-Dauer zurück zum Bento');
  timers.advance(15000);
  assert.equal(shown.at(-1), 'A');
  assert.equal(builds, 2, 'jede Runde mischt neu');
  controller.showBento();
  assert.equal(shown.at(-1), 'bento', 'manuell jederzeit zurück zum Bento');
  timers.advance(14999);
  assert.equal(shown.at(-1), 'bento');
  controller.stop();
  assert.equal(timers.pending, 0, 'keine Timer nach dem Verlassen von #start');
  timers.advance(120000);
  assert.equal(shown.at(-1), 'bento');
  assert.match(mainSource, /prefers-reduced-motion: reduce/);
  assert.match(mainSource, /activeView === 'start' && slideshowViewport\.matches && !reducedMotion\.matches/);
});

test('map hint under the tour map is a single short line', async () => {
  const source = await readFile(new URL('../src/map.js', import.meta.url), 'utf8');
  assert.match(source, /'Vorläufige Tourkarte · keine Navigation'/);
  assert.doesNotMatch(source, /vorläufige Planungsdaten/);
});

test('overview scroll memory survives other views and resets only on brand navigation', () => {
  const position = createTourScrollMemory();
  assert.equal(position('start', 'roadbook', 1260), 0);
  assert.equal(position('roadbook', 'media', 400), 0);
  assert.equal(position('media', 'start', 75), 1260);
  assert.equal(position('start', 'roadbook', 790), 0);
  assert.equal(position('roadbook', 'start', 10), 790);
  assert.equal(position('start', 'start', 790, true), 0);
  assert.equal(position('start', 'roadbook', 0), 0);
  assert.equal(position('roadbook', 'start', 300), 0);
});

test('ferry connections use loaded neighbouring track endpoints, never missing or road tracks', () => {
  const segment = (points) => ({ state: 'loaded', profileSegments: [points] });
  const tracks = [
    segment([[39, 20, 1], [39.4, 20.2, 0]]),
    { state: 'loaded', profileSegments: [] },
    segment([[45.4, 12.2, 0], [46, 13, 1]]),
  ];
  const stages = days.slice(17, 20);
  assert.deepEqual(ferryConnections(stages, tracks), [[[39.4, 20.2], [45.4, 12.2]]]);
  assert.deepEqual(ferryConnections(stages, [tracks[0], { state: 'error' }, tracks[2]]), []);
  assert.deepEqual(ferryConnections(stages, [tracks[0], tracks[1], { state: 'loading' }]), []);
  assert.deepEqual(ferryConnections(stages, [tracks[0], tracks[0], tracks[2]]), []);
  assert.deepEqual(ferryConnections([stages[0], { ...stages[1], body: '**Transport:** Motorrad.' }, stages[2]], tracks), []);
});

test('ferry route follows open water of the Adriatic between the real track ends', () => {
  const start = [39.4886, 20.2596];
  const end = [45.4191, 12.2578];
  const route = ferryRoute([start, end]);
  assert.deepEqual(route[0], start);
  assert.deepEqual(route.at(-1), end);
  assert.deepEqual(route.slice(1, -1), [[40.15, 19.10], [41.80, 17.20], [43.30, 14.40], [44.40, 13.20], [45.30, 12.50]]);
  // Die Zwischenpunkte wandern nach Norden und nach Westen, nie über die italienische Küstenlinie hinaus nach Osten zurück.
  route.slice(1).forEach(([lat, lon], index) => {
    assert.ok(lat > route[index][0], 'Fährlinie läuft stetig nach Norden');
    assert.ok(lon < route[index][1] || index === route.length - 2, 'Fährlinie läuft stetig nach Westen');
  });
  assert.deepEqual(ferryRoute([[10, 10], [20, 20]]), [[10, 10], [20, 20]], 'unbekannte Verbindungen bleiben gerade');
});

test('tour map fits tightly with 14 px padding and keeps attribution free on mobile', async () => {
  assert.deepEqual(tourFitOptions(false), { paddingTopLeft: [14, 14], paddingBottomRight: [14, 14], animate: false });
  assert.deepEqual(tourFitOptions(true).paddingTopLeft, [14, 14]);
  assert.ok(tourFitOptions(true).paddingBottomRight[1] > 14);
  const source = await readFile(new URL('../src/map.js', import.meta.url), 'utf8');
  assert.match(source, /radius: 2\.5/);
  assert.match(source, /fitBounds\(bounds, tourFitOptions\(/);
  assert.doesNotMatch(source, /bounds\.pad\(0\.14\)\s*,\s*\{\s*paddingBottomRight/);
});

test('participation and contact come only from the tour data', () => {
  const withData = render(days, info);
  const text = normalizeText(withData.querySelector('.tour-join'));
  if (info.teilnahme?.max_motorraeder) assert.match(text, new RegExp(`Bis zu ${info.teilnahme.max_motorraeder} Motorräder`));
  const contact = withData.querySelector('a.tour-contact');
  const footer = withData.querySelector('.tour-contact-footer');
  assert.ok(footer, 'Kontakt erhält einen eigenen Abschlussbereich');
  assert.equal(contact.closest('.tour-join'), null, 'Kontakt steht nicht im Mitfahren-Bereich');
  assert.equal(withData.body.lastElementChild, footer, 'Kontakt ist das letzte Element der Landingpage');
  const bodyChildren = [...withData.body.children];
  assert.ok(bodyChildren.indexOf(withData.querySelector('.tour-join')) < bodyChildren.indexOf(footer),
    'Kontakt folgt auf Selbstcheck und Orientierungshinweis im Mitfahren-Bereich');
  assert.ok(bodyChildren.indexOf(withData.querySelector('.tour-itinerary')) < bodyChildren.indexOf(footer),
    'Kontakt folgt auch auf den Reiseverlauf');
  assert.equal(contact.getAttribute('href'), info.kontakt.url);
  assert.equal(contact.getAttribute('target'), '_blank');
  assert.equal(contact.getAttribute('rel'), 'noopener noreferrer');
  assert.ok(normalizeText(contact).includes(info.kontakt.label));

  const seven = pageText(render([day(1), day(2)], baseInfo({ teilnahme: { max_motorraeder: 7, solo: false } })));
  assert.match(seven, /Bis zu 7 Motorräder/);
  assert.match(seven, /Solo-Fahrer sind nicht vorgesehen/);
  assert.doesNotMatch(seven, /Bis zu 5/);

  const open = render([day(1), day(2)], baseInfo());
  assert.equal(open.querySelector('.tour-join'), null, 'ohne Angaben erscheint kein Teilnahmeblock');
  assert.equal(open.querySelector('a.tour-contact'), null);
  assert.doesNotMatch(pageText(open), /Motorräder|Solo|Kontakt aufnehmen/);
});

test('self-check is informational only and never blocks the entry', () => {
  const document = render(days, info);
  const boxes = [...document.querySelectorAll('input[data-selfcheck]')];
  assert.equal(boxes.length, info.selbstcheck.length);
  for (const box of boxes) {
    assert.equal(box.getAttribute('type'), 'checkbox');
    assert.ok(!box.hasAttribute('required') && !box.hasAttribute('disabled'));
    assert.ok(box.closest('label'), 'Haken sind beschriftet');
  }
  assert.match(normalizeText(document.querySelector('.tour-selfcheck')), /keine Teilnahmebedingung/);
  assert.equal(document.querySelector('a.tour-cta').getAttribute('aria-disabled'), null);
});

test('dynamic text is escaped on the landing page', () => {
  const hostile = '<img src=x onerror=alert(1)>';
  const hostileInfo = baseInfo({
    laender: [hostile], hinweise: [hostile], selbstcheck: [hostile],
    kontakt: { label: hostile, url: 'https://example.org/?a="b"' }, teilnahme: { max_motorraeder: 2, solo: null },
  });
  const hostileDays = [day(1, { titel: hostile, start: '"<b>', ziel: '&' }), day(2, { titel: hostile })];
  const html = renderTourOverview(buildTourOverview(hostileDays, hostileInfo), hostileInfo);
  const document = parseHtml(html);
  assert.equal(document.querySelector('img:not(.tour-slideshow-image)'), null, 'kein eingeschleustes Bild');
  assert.equal(document.querySelector('img.tour-slideshow-image').getAttribute('src'), null, 'Slideshow-Bild ist anfangs leer');
  assert.equal(document.querySelector('b'), null);
  assert.ok(normalizeText(document.querySelector('.tour-chips')).includes(hostile));
  assert.match(html, /href="https:\/\/example\.org\/\?a=&quot;b&quot;"/);
  assert.equal(document.querySelector('a.tour-contact').getAttribute('href'), 'https://example.org/?a="b"');
});

test('self-check ticks are restored and saved on this device only', () => {
  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const mount = () => {
    const document = render(days, info);
    bindSelfCheck(document);
    return [...document.querySelectorAll('input[data-selfcheck]')];
  };
  globalThis.localStorage = storage;
  try {
    const first = mount();
    assert.ok(first.every((box) => !box.checked));
    first[1].checked = true;
    first[1].dispatchEvent(new first[1].ownerDocument.defaultView.Event('change'));
    assert.deepEqual(mount().map((box) => box.checked), first.map((_, index) => index === 1));
    first[1].checked = false;
    first[1].dispatchEvent(new first[1].ownerDocument.defaultView.Event('change'));
    assert.ok(mount().every((box) => !box.checked));

    store.set('balkan-ride-2027-selfcheck', '{kaputt');
    const errors = [];
    const original = console.error;
    console.error = (...args) => errors.push(args);
    try {
      assert.ok(mount().every((box) => !box.checked));
    } finally {
      console.error = original;
    }
    assert.equal(errors.length, 1, 'ein ungültiger Speicherstand wird gemeldet und ignoriert');
  } finally {
    delete globalThis.localStorage;
  }
});

test('shell starts on the overview with a single responsive main-menu entry', () => {
  const main = shell.querySelector('main#top');
  const sections = [...main.children].map((child) => child.id);
  assert.deepEqual(sections.slice(0, 4), ['start', 'roadbook', 'media', 'logistics']);
  assert.equal(shell.querySelector('section#start').getAttribute('aria-labelledby'), 'tour-title');
  const brand = shell.querySelector('.site-header a.brand');
  assert.equal(brand.getAttribute('href'), '#start');
  assert.ok(brand.hasAttribute('data-view-link'));
  const tourLink = shell.querySelector('.site-nav a[href="#start"]');
  assert.ok(tourLink);
  assert.equal(tourLink.getAttribute('aria-label'), 'Tourübersicht');
  assert.equal(normalizeText(tourLink.querySelector('.site-nav-tour-desktop')), 'Tourübersicht');
  assert.equal(normalizeText(tourLink.querySelector('.site-nav-tour-mobile')), 'Tour');
  assert.equal(shell.querySelectorAll('a[href="#start"]').length, 2, 'nur Menüpunkt und Markenlogo verweisen auf die Übersicht');
  assert.equal(shell.querySelector('.day-picker a[href="#start"]'), null);
  assert.equal(shell.querySelector('.map-panel a[href="#start"]'), null);
  assert.deepEqual(
    [...shell.querySelectorAll('nav.site-nav a')].map((link) => link.getAttribute('href')),
    ['#start', '#roadbook', '#media', '#logistics'],
  );
});

test('touch targets of the landing page keep their minimum sizes in CSS', () => {
  const minimum = (selector, media = '') => css.declarations(selector, media)['min-height'];
  for (const [selector, value] of [
    ['.tour-start .tour-cta', '48px'], ['.tour-start .tour-contact', '48px'],
    ['.tour-day-link', '44px'], ['.tour-itinerary a', '48px'], ['.tour-check', '44px'],
    ['.tour-info-link', '44px'],
  ]) {
    assert.equal(minimum(selector), normalizeCssValue(value), selector);
  }
  assert.equal(css.declarations('.site-nav-tour-mobile').display, 'none');
  assert.equal(css.declarations('.site-nav-tour-desktop', '@media (max-width: 767px)').display, 'none');
  assert.equal(css.declarations('.site-nav-tour-mobile', '@media (max-width: 767px)').display, 'inline');
  assert.equal(css.declarations('.site-nav-tour-desktop', '@media (min-width: 768px)').display, undefined);
});

test('no motorcycle model or fixed group size is built into the landing page code or data', async () => {
  const tourSource = await readFile(new URL('../../content/tour.md', import.meta.url), 'utf8');
  for (const [name, source] of Object.entries({ overviewSource, mainSource })) {
    assert.doesNotMatch(source, /\b(BMW|GS|Yamaha|Honda|KTM|Triumph|Africa Twin)\b/, name);
    assert.doesNotMatch(source, /\b\d+\s+Motorräder\b|zu zweit/i, name);
  }
  assert.doesNotMatch(tourSource, /\b(BMW|Yamaha|Honda|KTM|Triumph|Africa Twin)\b|zu zweit/i);
});
