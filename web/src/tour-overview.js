import { escapeDisplayText, escapeHtml } from './html.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const SELFCHECK_STORAGE_KEY = 'balkan-ride-2027-selfcheck';
export const SLIDESHOW_STORAGE_KEY = 'balkan-ride-slideshow';
// Grenzen und Standardwerte der Startseiten-Slideshow (Sekundenwerte in s).
export const SLIDESHOW_SETTINGS = {
  photosPerHighlight: { label: 'Bilder pro Highlight', min: 1, max: 5, default: 2, unit: '' },
  secondsPerImage: { label: 'Anzeigedauer pro Bild', min: 2, max: 15, default: 5, unit: 's' },
  slideshowSeconds: { label: 'Dauer der Slideshow', min: 10, max: 120, default: 30, unit: 's' },
  idleSeconds: { label: 'Standardbild bis zur nächsten Slideshow', min: 5, max: 120, default: 15, unit: 's' },
};
const TRANSPORT = /\*\*Transport:\*\*\s*([^\n]+)/;
const INFO_KEYS = new Set(['laender', 'kern_highlights', 'teilnahme', 'kontakt', 'selbstcheck', 'hinweise']);
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', timeZone: 'UTC' });
export function createTourScrollMemory() {
  let position = 0;
  return (from, to, current, brand = false) => {
    if (from === 'start' && to !== 'start') position = current;
    if (brand) position = 0;
    return to === 'start' ? position : 0;
  };
}

// Prüft content/tour.md (Frontmatter). Läuft beim Build und in den Tests; Fehler brechen den Build ab.
export function validateTourInfo(data, dayTags) {
  const fail = (message) => { throw new Error(`content/tour.md: ${message}`); };
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Frontmatter fehlt.');
  for (const key of Object.keys(data)) {
    if (!INFO_KEYS.has(key)) fail(`unbekanntes Feld "${key}".`);
  }
  const texts = (key, required) => {
    const value = data[key];
    if (value === undefined) {
      if (required) fail(`Feld "${key}" fehlt.`);
      return [];
    }
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
      fail(`"${key}" muss eine Liste nichtleerer Texte sein.`);
    }
    if (required && value.length === 0) fail(`"${key}" darf nicht leer sein.`);
    return value.map((entry) => entry.trim());
  };

  const laender = texts('laender', true);
  const highlights = data.kern_highlights;
  if (!Array.isArray(highlights) || highlights.length === 0) fail('"kern_highlights" darf nicht leer sein.');
  const tags = new Set();
  const validatedHighlights = highlights.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || Object.keys(entry).some((key) => !['tag', 'kurz', 'land', 'info_url'].includes(key))
      || !Number.isInteger(entry.tag) || !dayTags.includes(entry.tag) || tags.has(entry.tag)
      || typeof entry.kurz !== 'string' || !entry.kurz.trim()
      || typeof entry.land !== 'string' || !laender.includes(entry.land)) {
      fail('"kern_highlights" benötigt verschiedene vorhandene Etappen und ein bekanntes Land.');
    }
    let url;
    try { url = new URL(entry.info_url); } catch { fail('Ungültige Highlight-Infoadresse.'); }
    if (url.protocol !== 'https:' || url.hostname !== 'de.wikipedia.org'
      || url.username || url.password || url.port || !url.pathname.startsWith('/wiki/')) {
      fail('Highlight-Infoadresse muss auf einen deutschen Wikipedia-Artikel verweisen.');
    }
    tags.add(entry.tag);
    return { tag: entry.tag, kurz: entry.kurz.trim(), land: entry.land, info_url: url.href };
  });

  let teilnahme = null;
  if (data.teilnahme !== undefined) {
    const value = data.teilnahme;
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some((key) => !['max_motorraeder', 'solo'].includes(key))) {
      fail('"teilnahme" darf nur max_motorraeder und solo enthalten.');
    }
    if (value.max_motorraeder !== undefined
      && (!Number.isInteger(value.max_motorraeder) || value.max_motorraeder < 1 || value.max_motorraeder > 99)) {
      fail('"teilnahme.max_motorraeder" muss eine ganze Zahl von 1 bis 99 sein.');
    }
    if (value.solo !== undefined && typeof value.solo !== 'boolean') fail('"teilnahme.solo" muss true oder false sein.');
    teilnahme = { max_motorraeder: value.max_motorraeder ?? null, solo: value.solo ?? null };
  }

  let kontakt = null;
  if (data.kontakt !== undefined) {
    const value = data.kontakt;
    if (!value || typeof value !== 'object' || typeof value.label !== 'string' || !value.label.trim()
      || typeof value.url !== 'string') {
      fail('"kontakt" benötigt label und url.');
    }
    let url;
    try {
      url = new URL(value.url);
    } catch {
      fail('"kontakt.url" ist keine gültige Adresse.');
    }
    if (url.protocol !== 'https:') fail('"kontakt.url" muss mit https:// beginnen.');
    kontakt = { label: value.label.trim(), url: url.href };
  }

  return {
    laender,
    kern_highlights: validatedHighlights,
    teilnahme,
    kontakt,
    selbstcheck: texts('selbstcheck', false),
    hinweise: texts('hinweise', true),
  };
}

// Tage mit PKW im Transport sind Gespann-Tage (An- und Rückreise), Tage nur mit Fähre Fährtage.
// Mischtage wie „Fähre als Fußpassagiere, anschließend Motorrad“ zählen als Motorrad, da die Etappenstrecke gefahren wird.
export function transportKind(body) {
  const match = TRANSPORT.exec(body ?? '');
  if (!match) return 'unbekannt';
  if (/\bPKW\b/.test(match[1])) return 'gespann';
  if (/\bMotorrad\b/.test(match[1])) return 'motorrad';
  return /\bFähre\b/.test(match[1]) ? 'faehre' : 'unbekannt';
}

function parseDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  // Der Rückvergleich fängt nicht existierende Tage wie 2027-02-31 ab, die JavaScript sonst verschiebt.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(date.getTime())
    || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Tourübersicht: ungültiges Datum "${value}".`);
  }
  return date;
}

const two = (value) => String(value).padStart(2, '0');

export function formatDateRange(from, to) {
  const [fromDay, toDay] = [two(from.getUTCDate()), two(to.getUTCDate())];
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();
  if (sameMonth) return `${fromDay}.–${toDay}. ${monthName.format(to)} ${to.getUTCFullYear()}`;
  if (sameYear) return `${fromDay}. ${monthName.format(from)} – ${toDay}. ${monthName.format(to)} ${to.getUTCFullYear()}`;
  return `${fromDay}. ${monthName.format(from)} ${from.getUTCFullYear()} – ${toDay}. ${monthName.format(to)} ${to.getUTCFullYear()}`;
}

function formatCompactDateRange(from, to) {
  const fromDay = two(from.getUTCDate());
  const toDay = two(to.getUTCDate());
  const fromMonth = two(from.getUTCMonth() + 1);
  const toMonth = two(to.getUTCMonth() + 1);
  const fromYear = from.getUTCFullYear();
  const toYear = to.getUTCFullYear();
  if (fromYear === toYear && fromMonth === toMonth) return `${fromDay}.–${toDay}.${toMonth}.${toYear}`;
  if (fromYear === toYear) return `${fromDay}.${fromMonth}.–${toDay}.${toMonth}.${toYear}`;
  return `${fromDay}.${fromMonth}.${fromYear}–${toDay}.${toMonth}.${toYear}`;
}

const sumKm = (entries) => Math.round(entries.reduce((total, entry) => total + entry.kilometer, 0) * 10) / 10;

// Berechnet die Kennzahlen der Tourübersicht ausschließlich aus den Etappen und content/tour.md.
export function buildTourOverview(days, info) {
  if (!Array.isArray(days) || days.length === 0) throw new Error('Tourübersicht: keine Etappen vorhanden.');
  const entries = days.map(({ frontmatter, body }, index) => ({
    index,
    tag: frontmatter.tag,
    datum: frontmatter.datum,
    date: parseDate(frontmatter.datum),
    titel: frontmatter.titel,
    start: frontmatter.start,
    ziel: frontmatter.ziel,
    kilometer: frontmatter.kilometer,
    kind: transportKind(body),
  }));
  const times = entries.map((entry) => entry.date.getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));
  const motorcycle = entries.filter((entry) => entry.kind === 'motorrad');
  const ferry = entries.filter((entry) => entry.kind === 'faehre');
  const tour = entries.filter((entry) => entry.kind === 'motorrad' || entry.kind === 'faehre');
  const gespann = entries.filter((entry) => entry.kind === 'gespann');
  const contiguous = tour.every((entry, position) => position === 0 || entry.index === tour[position - 1].index + 1);
  const highlights = info.kern_highlights.map((highlight) => {
    const entry = entries.find((candidate) => candidate.tag === highlight.tag);
    if (!entry) throw new Error(`Tourübersicht: Kern-Highlight verweist auf fehlende Etappe ${highlight.tag}.`);
    return { ...entry, kurz: highlight.kurz, land: highlight.land, info_url: highlight.info_url };
  });
  return {
    entries,
    dayCount: entries.length,
    calendarDays: Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1,
    range: formatDateRange(from, to),
    compactRange: formatCompactDateRange(from, to),
    totalKm: sumKm(entries),
    tourKm: sumKm(tour),
    motorcycleKm: sumKm(motorcycle),
    ferryKm: sumKm(ferry),
    motorcycleDays: motorcycle.length,
    ferryDays: ferry.length,
    gespannKm: sumKm(gespann),
    tourDays: tour.length,
    gespannDays: gespann.length,
    tourRange: tour.length > 1 && contiguous ? `Tag ${tour[0].tag}–${tour[tour.length - 1].tag}` : '',
    unknownDays: entries.length - tour.length - gespann.length,
    startPlace: entries[0].start,
    endPlace: entries[entries.length - 1].ziel,
    highlights,
    countries: info.laender,
  };
}

const dayNumber = (entry) => String(entry.tag).padStart(2, '0');
const place = (value) => escapeDisplayText(value);

function renderFacts(overview) {
  const tourDays = overview.tourDays
    ? `<div><dt>TOURTAGE</dt><dd>${overview.tourDays} <small>Tage Motorrad und Fähre${overview.tourRange ? ` · ${escapeHtml(overview.tourRange)}` : ''}</small></dd></div>`
    : '';
  const motorcycle = overview.unknownDays === 0 && overview.tourDays
    ? `davon ${integer.format(overview.motorcycleKm)} km auf dem Motorrad`
    : 'Summe der Etappenstrecken';
  return `
    <div class="tour-facts-block">
    <dl class="tour-facts" aria-label="Die Tour in Zahlen">
      <div><dt>ZEITRAUM</dt><dd>${escapeHtml(overview.range)} <small>${overview.calendarDays} Kalendertage</small></dd></div>
      <div><dt>STRECKE</dt><dd>${integer.format(overview.totalKm)} km <small>${motorcycle}</small></dd></div>
      ${tourDays}
      <div><dt>LÄNDER</dt><dd>${overview.countries.length} <small>Länder auf der Route</small></dd></div>
    </dl>
    ${renderBreakdown(overview)}
    </div>`;
}

// Zwei kompakte Zeilen: Kilometer nach Transportart und Etappen nach Transportart (nur bei vollständig bekanntem Transport).
function renderBreakdown(overview) {
  if (overview.unknownDays > 0) return '';
  const km = [`${integer.format(overview.totalKm)} km gesamt`];
  if (overview.motorcycleDays) km.push(`${integer.format(overview.motorcycleKm)} km Motorrad`);
  if (overview.ferryDays) km.push(overview.ferryKm > 0 ? `${integer.format(overview.ferryKm)} km Fähre` : 'Fähre ohne Kilometerangabe');
  if (overview.gespannDays) km.push(`${integer.format(overview.gespannKm)} km Auto mit Anhänger`);
  const days = [`${overview.dayCount} Etappen`];
  if (overview.gespannDays) days.push(`${overview.gespannDays} Auto`);
  if (overview.motorcycleDays) days.push(`${overview.motorcycleDays} Motorrad`);
  if (overview.ferryDays) days.push(`${overview.ferryDays} Fähre`);
  return `<div class="tour-breakdown"><p>${escapeHtml(km.join(' · '))}</p><p>${escapeHtml(days.join(' · '))}</p></div>`;
}

const km = (value) => `${integer.format(value)} km`;

// Aus den Etappen berechnete Kennzahlen des mobilen Bento-Bereichs.
function mobileFigures(overview) {
  const otherDays = [
    overview.gespannDays ? `${overview.gespannDays} Auto` : '',
    overview.ferryDays ? `${overview.ferryDays} Fähre` : '',
  ].filter(Boolean).join(' · ');
  const otherLabel = [overview.gespannDays ? 'Auto' : '', overview.ferryKm > 0 || !overview.gespannDays ? 'Fähre' : '']
    .filter(Boolean).join(' & ');
  return {
    period: `${escapeHtml(overview.compactRange)} · ${overview.calendarDays} Tage`,
    total: { label: 'Gesamt', km: km(overview.totalKm), sub: `${overview.dayCount} Etappen` },
    motorcycle: overview.motorcycleDays
      ? { label: 'Motorrad', km: km(overview.motorcycleKm), sub: `${overview.motorcycleDays} Motorrad`, value: overview.motorcycleKm }
      : null,
    other: otherDays
      ? { label: otherLabel, km: km(overview.gespannKm + overview.ferryKm), sub: otherDays, value: overview.gespannKm + overview.ferryKm }
      : null,
    countries: overview.countries.map(escapeHtml),
  };
}

const countryList = (className, countries, label) => `<ol class="${className}" aria-label="${countries.length} Länder ${label}">${countries.map((country) => `<li>${country}</li>`).join('')}</ol>`;

// Bento-Grid (2A) mit Proportionsbalken Motorrad vs. Auto/Fähre unter der Gesamtstrecke; in allen Vorschlägen identisch.
function renderBento(figures) {
  const cells = [figures.motorcycle, figures.other].filter(Boolean);
  const shares = cells.filter((entry) => entry.value > 0);
  const split = shares.length
    ? `<div class="tour-bento-split" role="img" aria-label="Kilometeranteile: ${shares.map((entry) => `${entry.label} ${entry.km}`).join(', ')}">${shares.map((entry) => `<span class="tour-bento-split-part${entry === figures.motorcycle ? ' is-accent' : ''}" style="flex-grow: ${Math.round(entry.value)}"></span>`).join('')}</div>`
    : '';
  return `
      <div class="tour-bento">
        <div class="tour-bento-hero"><span>Strecke gesamt</span><strong>${figures.total.km}</strong>${split}<span>${figures.period}</span><span>${figures.total.sub}</span></div>
        ${cells.map((cell) => `<div class="tour-bento-cell${cell === figures.motorcycle ? ' is-accent' : ''}"><span>${cell.label}</span><strong>${cell.km}</strong><span>${cell.sub}</span></div>`).join('')}
        <div class="tour-bento-countries"><span>${figures.countries.length} Länder</span>${countryList('tour-bento-matrix', figures.countries, 'in Routenreihenfolge')}</div>
      </div>`;
}

function renderMobileSummary(overview) {
  return `
      <section class="tour-mobile-summary" aria-label="Termin, Strecke, Etappen und Länder">${renderBento(mobileFigures(overview))}${renderSlideshow()}
      </section>`;
}

function renderDayLink(entry, withRoute) {
  return `<a class="tour-day-link" href="#roadbook" data-open-day="${entry.index}">
      <span class="tour-day-no">Tag ${dayNumber(entry)}</span>
      <span class="tour-day-title">${place(entry.titel)}</span>
      ${withRoute ? `<span class="tour-day-meta">${place(entry.start)} → ${place(entry.ziel)} · ${integer.format(entry.kilometer)} km</span>` : ''}
    </a>`;
}

function renderParticipation(info) {
  const facts = [];
  if (info.teilnahme?.max_motorraeder) facts.push(`Bis zu ${info.teilnahme.max_motorraeder} Motorräder`);
  if (info.teilnahme?.solo === true) facts.push('Solo-Fahrer sind willkommen');
  if (info.teilnahme?.solo === false) facts.push('Solo-Fahrer sind nicht vorgesehen');
  const selfcheck = info.selbstcheck.length
    ? `<fieldset class="tour-selfcheck">
        <legend>Selbstcheck</legend>
        ${info.selbstcheck.map((text, index) => `<label class="tour-check"><input type="checkbox" data-selfcheck="${index}"><span>${escapeHtml(text)}</span></label>`).join('')}
        <p class="tour-note">Nur zur Orientierung: Deine Haken werden nicht ausgewertet, sind keine Teilnahmebedingung und bleiben auf diesem Gerät.</p>
      </fieldset>`
    : '';
  if (!facts.length && !selfcheck) return '';
  return `
    <section class="tour-section tour-join" aria-labelledby="tour-join-title">
      <h2 id="tour-join-title">Mitfahren</h2>
      ${facts.length ? `<ul class="tour-join-list">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}
      ${selfcheck}
    </section>`;
}

function renderContact(info) {
  if (!info.kontakt) return '';
  return `
    <footer class="tour-contact-footer">
      <a class="button button-primary tour-contact" href="${escapeHtml(info.kontakt.url)}" target="_blank" rel="noopener noreferrer">Kontakt aufnehmen · ${escapeHtml(info.kontakt.label)}</a>
    </footer>`;
}

function clampSetting(name, value) {
  const { min, max, default: fallback } = SLIDESHOW_SETTINGS[name];
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
}

// Fehlende Einstellungen behalten ihre Standardwerte; vorhandene Zahlen werden auf die Grenzen begrenzt.
export function readSlideshowSettings(storage) {
  let saved = {};
  try {
    const parsed = JSON.parse(storage?.getItem(SLIDESHOW_STORAGE_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
  } catch (error) {
    console.error('Slideshow-Einstellungen konnten nicht gelesen werden.', error);
  }
  if ('enabled' in saved && typeof saved.enabled !== 'boolean') {
    console.error('Ungültiger Wert für den Slideshow-Schalter; Standardwert wird verwendet.');
  }
  return {
    enabled: typeof saved.enabled === 'boolean' ? saved.enabled : true,
    ...Object.fromEntries(Object.keys(SLIDESHOW_SETTINGS)
      .map((name) => [name, name in saved ? clampSetting(name, saved[name]) : SLIDESHOW_SETTINGS[name].default])),
  };
}

export function saveSlideshowSetting(storage, name, value) {
  if (name !== 'enabled' && !(name in SLIDESHOW_SETTINGS)) throw new Error(`Unbekannte Slideshow-Einstellung "${name}".`);
  if (name === 'enabled' && typeof value !== 'boolean') throw new TypeError('Der Slideshow-Schalter benötigt einen Boolean.');
  const settings = { ...readSlideshowSettings(storage), [name]: name === 'enabled' ? value : clampSetting(name, value) };
  try {
    storage.setItem(SLIDESHOW_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Slideshow-Einstellungen konnten nicht gespeichert werden.', error);
  }
  return settings;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function listenMediaQuery(query, callback) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', callback);
  } else {
    query.addListener(callback);
  }
}

// Wählt je Kern-Highlight höchstens perHighlight vorhandene Etappenfotos zufällig aus und mischt die Gesamtfolge.
export function buildHighlightSlides(highlights, days, urls, perHighlight, random = Math.random) {
  const limit = clampSetting('photosPerHighlight', perHighlight);
  const slides = highlights.flatMap((highlight) => {
    const photos = (days[highlight.index]?.frontmatter.bilder ?? []).filter((photo) => urls[photo.datei]);
    return shuffle(photos, random).slice(0, limit).map((photo) => ({
      src: urls[photo.datei],
      tag: highlight.tag,
      title: highlight.kurz,
      alt: `${highlight.kurz}: ${photo.beschreibung || 'Etappenfoto'}`,
      credit: [photo.urheber, photo.lizenz].filter(Boolean).join(' · '),
    }));
  });
  return shuffle(slides, random);
}

// Steuert den Wechsel Bento → Slideshow → Bento. render(null) zeigt das Bento, render(slide) ein Bild.
export function createSlideshowController({ getSlides, getSettings, render, timers = globalThis }) {
  let timer = null;
  let running = false;
  const clear = () => {
    if (timer !== null) timers.clearTimeout(timer);
    timer = null;
  };
  const stop = () => {
    running = false;
    clear();
    render(null);
  };
  const waitForNextShow = () => {
    clear();
    render(null);
    if (running) timer = timers.setTimeout(showSlides, getSettings().idleSeconds * 1000);
  };
  function showSlides() {
    const slides = getSlides();
    const { secondsPerImage, slideshowSeconds } = getSettings();
    if (!slides.length) {
      waitForNextShow();
      return;
    }
    const count = Math.max(1, Math.floor(slideshowSeconds / secondsPerImage));
    let shown = 0;
    const next = () => {
      if (shown === count) {
        waitForNextShow();
        return;
      }
      render(slides[shown % slides.length]);
      shown += 1;
      timer = timers.setTimeout(next, secondsPerImage * 1000);
    };
    next();
  }
  return {
    start() {
      if (getSettings().enabled === false) {
        stop();
        return;
      }
      if (running) return;
      running = true;
      waitForNextShow();
    },
    stop,
    showBento: waitForNextShow,
    get running() { return running; },
  };
}

function renderSlideshow() {
  return `
      <figure class="tour-slideshow" hidden>
        <img class="tour-slideshow-image" alt="" decoding="async">
        <figcaption><strong class="tour-slideshow-title"></strong><span class="tour-slideshow-credit"></span></figcaption>
        <button class="tour-slideshow-close" type="button" aria-label="Slideshow beenden und Übersicht zeigen">×</button>
      </figure>`;
}

// Liefert den HTML-Text der Einstiegsseite. Alle dynamischen Werte werden maskiert.
export function renderTourOverview(overview, info) {
  return `
    <div class="tour-hero">
      <div class="tour-hero-main">
      <div class="tour-hero-copy">
        <p class="eyebrow">DIE TOUR · ${overview.dayCount} TAGE · ${escapeHtml(overview.range.toUpperCase())}</p>
        <h1 id="tour-title">Balkan-Ride 2027</h1>
        <p class="tour-intro">Dein Überblick zur Tour: Zeitraum, Strecke, Länder und Highlights. Von hier geht es Tag für Tag ins Roadbook.</p>
        <p class="tour-intro-mobile">Unsere Tour, dein Abenteuer!</p>
      </div>
      <section class="tour-mobile-highlights" aria-label="Kern-Highlights">
        <h2>Highlights</h2>
        <ul>${overview.highlights.map((entry) => `<li>
          <a class="tour-mobile-wiki" href="${escapeHtml(entry.info_url)}" target="_blank" rel="noopener noreferrer" aria-label="Tag ${dayNumber(entry)} ${place(entry.kurz)}: Wikipedia-Info, öffnet in neuem Tab">
            <span>${dayNumber(entry)}</span> <span>${place(entry.kurz)}</span></a>
        </li>`).join('')}</ul>
      </section>
      <div class="tour-map-panel">
        <div class="tour-map-frame">
          <div id="tour-map" role="region" aria-label="Übersichtskarte der gesamten Tour"></div>
          <p id="tour-ferry-legend" class="tour-ferry-legend" hidden><span aria-hidden="true"></span><span class="tour-ferry-legend-desktop">Fährverbindung (ca. Linie)</span><span class="tour-ferry-legend-mobile">Fährverbindung</span></p>
        </div>
        <p id="tour-map-status" class="tour-note" role="status">Die Tourkarte wird geladen.</p>
      </div>
      ${renderMobileSummary(overview)}
      ${renderFacts(overview)}
      </div>
      <div class="tour-cta-row">
        <p class="tour-mobile-route">${place(overview.startPlace)} ${overview.startPlace === overview.endPlace ? '↔' : '→'} ${place(overview.endPlace)}</p>
        <a class="button button-primary tour-cta" href="#roadbook" data-view-link><span class="tour-cta-desktop">Zu den ${overview.dayCount} Etappen</span><span class="tour-cta-mobile">Zur Tour</span> <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <section class="tour-section tour-countries" aria-labelledby="tour-countries-title">
      <h2 id="tour-countries-title">Länder und Route</h2>
      <ul class="tour-chips" aria-label="Länder in der Reihenfolge der Route">${overview.countries.map((country) => `<li>${escapeHtml(country)}</li>`).join('')}</ul>
      <p class="tour-note">Start: ${place(overview.startPlace)} · Ziel: ${place(overview.endPlace)}</p>
    </section>
    <section class="tour-section tour-highlights" aria-labelledby="tour-highlights-title">
      <h2 id="tour-highlights-title">Kern-Highlights</h2>
      <ul class="tour-card-list">${overview.highlights.map((entry) => `<li>
        ${renderDayLink(entry, true)}
        <div class="tour-highlight-info"><span class="tour-country">${escapeHtml(entry.land)}</span>
          <a class="tour-info-link" href="${escapeHtml(entry.info_url)}" target="_blank" rel="noopener noreferrer" aria-label="Wikipedia-Info zu ${place(entry.titel)}">Wikipedia ↗</a></div>
      </li>`).join('')}</ul>
    </section>
    ${renderParticipation(info)}
    <section class="tour-section" aria-labelledby="tour-status-title">
      <h2 id="tour-status-title">Stand der Planung</h2>
      <ul class="tour-status-list">${info.hinweise.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>
    </section>
    <section class="tour-section" aria-labelledby="tour-itinerary-title">
      <h2 id="tour-itinerary-title">Reiseverlauf Tag für Tag</h2>
      <ol class="tour-itinerary">${overview.entries.map((entry) => `<li><a href="#roadbook" data-open-day="${entry.index}">
        <span class="tour-day-no">${dayNumber(entry)}</span>
        <span class="tour-itinerary-route">${place(entry.start)} → ${place(entry.ziel)}</span>
        <small>${integer.format(entry.kilometer)} km</small>
      </a></li>`).join('')}</ol>
    </section>
    ${renderContact(info)}`;
}

// Hält --header-height aktuell, damit der erste Bildschirm der Startseite exakt unter dem Header endet.
export function bindHeaderHeight(header, root = document.documentElement) {
  const update = () => root.style.setProperty('--header-height', `${header.offsetHeight}px`);
  update();
  if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(header);
}

// Merkt die rein informativen Selbstcheck-Haken nur auf diesem Gerät.
export function bindSelfCheck(container) {
  const boxes = [...container.querySelectorAll('input[data-selfcheck]')];
  let state = {};
  try {
    const saved = localStorage.getItem(SELFCHECK_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) state = parsed;
  } catch (error) {
    console.error('Gespeicherte Selbstcheck-Haken konnten nicht gelesen werden.', error);
  }
  boxes.forEach((box) => {
    box.checked = Boolean(state[box.dataset.selfcheck]);
    box.addEventListener('change', () => {
      state[box.dataset.selfcheck] = box.checked;
      try {
        localStorage.setItem(SELFCHECK_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Selbstcheck-Haken konnten nicht gespeichert werden.', error);
      }
    });
  });
}
