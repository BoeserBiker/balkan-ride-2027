import L from 'leaflet';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import 'leaflet/dist/leaflet.css';
import './style.css';
import roadbookDays from 'virtual:roadbook-content';
import tourInfo from 'virtual:tour-info';
import logisticsMarkdown from './content/logistik.md?raw';
import { createRoadbookMap, createTourMap } from './map.js';
import { mediaPathMap, renderDayContent, renderMediaGallery } from './roadbook.js';
import { buildRouteTrack } from './route-scrubber.js';
import {
  bindElevationProfile, buildElevationProfile, buildPoiPositions, renderElevationProfile,
} from './elevation-profile.js';
import { renderLogisticsChecklist } from './logistics.js';
import {
  bindHeaderHeight, bindSelfCheck, buildHighlightSlides, buildTourOverview, createSlideshowController, createTourScrollMemory,
  readSlideshowSettings, renderTourOverview, saveSlideshowSetting, SLIDESHOW_SETTINGS,
} from './tour-overview.js';
import {
  directionsUrl, escapeDisplayText, getNavigationApp, setNavigationApp,
} from './html.js';

const app = document.querySelector('#app');
const SETTINGS_KEYS = {
  theme: 'balkan-ride-theme',
  fontSize: 'balkan-ride-font-size',
};
const APP_CACHE_PREFIX = 'balkan-ride-shell-';
const THEMES = new Set(['default', 'schalke', 'bvb']);
const FONT_SIZES = new Set(['1', '2', '3', '4', '5']);
const LEGACY_FONT_SIZES = { normal: '2', large: '4' };
const FONT_SIZE_LABELS = {
  1: 'Klein',
  2: 'Normal',
  3: 'Groß',
  4: 'Sehr groß',
  5: 'Extra groß',
};
const mediaAssets = import.meta.glob('../../assets/media/**/*.{avif,gif,jpeg,jpg,png,webp,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function readSetting(key, allowedValues, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved && !allowedValues.has(saved)) {
      console.error(`Gespeicherte Einstellung "${key}" ist ungültig.`);
    }
    return allowedValues.has(saved) ? saved : fallback;
  } catch (error) {
    console.error(`Einstellung "${key}" konnte nicht gelesen werden.`, error);
    return fallback;
  }
}

function readFontSize() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEYS.fontSize);
    if (LEGACY_FONT_SIZES[saved]) return LEGACY_FONT_SIZES[saved];
  } catch (error) {
    console.error('Schriftgröße konnte nicht gelesen werden.', error);
    return '2';
  }
  return readSetting(SETTINGS_KEYS.fontSize, FONT_SIZES, '2');
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Einstellung "${key}" konnte nicht gespeichert werden.`, error);
  }
}

function updateNavigationLinks() {
  document.querySelectorAll('[data-navigation-lat][data-navigation-lon]').forEach((link) => {
    link.href = directionsUrl(Number(link.dataset.navigationLat), Number(link.dataset.navigationLon));
  });
}

function setNavigationTarget(link, latitude, longitude) {
  link.dataset.navigationLat = String(latitude);
  link.dataset.navigationLon = String(longitude);
  link.href = directionsUrl(latitude, longitude);
}

function initializeSettings() {
  const root = document.documentElement;
  const dialog = document.querySelector('#settings-dialog');
  const toggle = document.querySelector('#settings-toggle');
  const themeButtons = [...dialog.querySelectorAll('[data-theme-choice]')];
  const fontSlider = dialog.querySelector('#font-size-range');
  const fontValue = dialog.querySelector('#font-size-value');
  const navigationSelect = dialog.querySelector('#navigation-app');
  const refreshButton = dialog.querySelector('#refresh-app');
  const status = dialog.querySelector('#settings-status');
  const historyToggles = [...dialog.querySelectorAll('[data-version-history-toggle]')];
  const slideshowInputs = [...dialog.querySelectorAll('[data-slideshow-setting]')];
  const slideshowToggle = dialog.querySelector('#slideshow-enabled');
  const slideshowToggleState = dialog.querySelector('#slideshow-enabled-state');
  let onThemeChange = () => {};
  let onSlideshowChange = () => {};

  function applyTheme(theme, persist = false) {
    root.dataset.theme = theme;
    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
    document.querySelector('meta[name="theme-color"]').content = ({
      default: '#101311',
      schalke: '#071426',
      bvb: '#09090b',
    })[theme];
    if (persist) saveSetting(SETTINGS_KEYS.theme, theme);
    onThemeChange();
  }

  function applyFontSize(size, persist = false) {
    root.dataset.fontSize = size;
    fontSlider.value = size;
    fontSlider.setAttribute('aria-valuetext', FONT_SIZE_LABELS[size]);
    fontValue.textContent = `${size}/5 · ${FONT_SIZE_LABELS[size]}`;
    dialog.querySelectorAll('[data-font-step]').forEach((step) => {
      step.classList.toggle('is-active', step.dataset.fontStep === size);
    });
    if (persist) saveSetting(SETTINGS_KEYS.fontSize, size);
  }

  applyTheme(readSetting(SETTINGS_KEYS.theme, THEMES, 'default'));
  applyFontSize(readFontSize());
  navigationSelect.value = getNavigationApp();

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
  });
  fontSlider.addEventListener('input', () => {
    if (FONT_SIZES.has(fontSlider.value)) applyFontSize(fontSlider.value, true);
  });
  navigationSelect.addEventListener('change', () => {
    setNavigationApp(navigationSelect.value);
    updateNavigationLinks();
  });
  const slideshowSettings = readSlideshowSettings(localStorage);
  const updateSlideshowToggle = (enabled) => {
    slideshowToggle.checked = enabled;
    slideshowToggleState.textContent = enabled ? 'An' : 'Aus';
  };
  updateSlideshowToggle(slideshowSettings.enabled);
  slideshowToggle.addEventListener('change', () => {
    const saved = saveSlideshowSetting(localStorage, 'enabled', slideshowToggle.checked);
    updateSlideshowToggle(saved.enabled);
    onSlideshowChange();
  });
  slideshowInputs.forEach((input) => {
    input.value = String(slideshowSettings[input.dataset.slideshowSetting]);
    input.addEventListener('change', () => {
      const saved = saveSlideshowSetting(localStorage, input.dataset.slideshowSetting, input.value);
      input.value = String(saved[input.dataset.slideshowSetting]);
      onSlideshowChange();
    });
  });

  historyToggles.forEach((button) => {
    button.addEventListener('click', () => {
      const shouldExpand = button.getAttribute('aria-expanded') !== 'true';
      historyToggles.forEach((toggleButton) => {
        const history = document.getElementById(toggleButton.getAttribute('aria-controls'));
        const expanded = toggleButton === button && shouldExpand;
        toggleButton.setAttribute('aria-expanded', String(expanded));
        history.hidden = !expanded;
      });
    });
  });

  toggle.addEventListener('click', () => {
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  dialog.querySelector('.settings-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
      dialog.close();
    }
  });

  refreshButton.addEventListener('click', async () => {
    if (!navigator.onLine) {
      status.textContent = 'Zum Aktualisieren ist eine Internetverbindung erforderlich.';
      return;
    }
    refreshButton.disabled = true;
    status.textContent = 'App und Offline-Cache werden aktualisiert …';
    try {
      const appScope = new URL(import.meta.env.BASE_URL, location.origin).pathname;
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations
          .filter((registration) => {
            const scope = new URL(registration.scope);
            return scope.origin === location.origin && scope.pathname === appScope;
          })
          .map((registration) => registration.update()));
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames
          .filter((name) => name.startsWith(APP_CACHE_PREFIX))
          .sort((left, right) => {
            const version = (name) => Number(name.match(/v(\d+)$/)?.[1] ?? 0);
            return version(right) - version(left);
          });
        await Promise.all(appCaches.slice(1).map((name) => caches.delete(name)));
      }
      status.textContent = 'Cache bereinigt. Die App wird neu geladen …';
      location.reload();
    } catch (error) {
      console.error('App und Offline-Cache konnten nicht aktualisiert werden.', error);
      status.textContent = 'Aktualisierung fehlgeschlagen. Prüfe die Verbindung und versuche es erneut.';
      refreshButton.disabled = false;
    }
  });

  return {
    setThemeChangeHandler(handler) {
      onThemeChange = handler;
      onThemeChange();
    },
    setSlideshowChangeHandler(handler) {
      onSlideshowChange = handler;
    },
  };
}

function renderShell() {
  app.innerHTML = `
    <header class="site-header flex items-center justify-between">
      <div class="brand-group">
        <a class="brand" href="#start" data-view-link aria-label="Balkan-Ride 2027 Startseite">
          <img class="brand-mark" src="${import.meta.env.BASE_URL}favicon.svg?v=4" alt="" aria-hidden="true">
          <span><strong>BALKAN RIDE</strong><small>ROADBOOK · 2027</small></span>
        </a>
      </div>
      <div class="header-navigation">
        <nav class="site-nav" aria-label="Hauptnavigation">
          <a href="#start" aria-label="Tourübersicht"><span class="site-nav-tour-desktop">Tourübersicht</span><span class="site-nav-tour-mobile" aria-hidden="true">Tour</span></a>
          <a href="#roadbook">Etappen</a>
          <a href="#media">Galerie</a>
          <a href="#logistics">Logistik</a>
        </nav>
        <div class="header-tools">
          <button id="settings-toggle" class="settings-toggle" type="button" aria-label="Einstellungen" aria-haspopup="dialog" aria-controls="settings-dialog" aria-expanded="false">⋮</button>
        </div>
      </div>
    </header>

    <main id="top">
      <section id="start" class="tour-start" aria-labelledby="tour-title"></section>

      <section id="roadbook" class="roadbook-layout mx-auto max-w-[1680px]" aria-label="Tour-Roadbook">
        <section class="map-panel" aria-label="Etappenkarte">
          <div class="mobile-map-context" aria-live="polite">
            <h2><span class="mobile-stage-label" id="mobile-stage-label"></span><span class="mobile-stage-title" id="mobile-stage-title"></span></h2>
          </div>
          <div class="map-topline">
            <span class="eyebrow">SLOWENIEN · BALKAN · GRIECHENLAND</span>
            <span class="map-live"><i aria-hidden="true"></i> TOURKARTE</span>
          </div>
          <div id="map-content" class="map-content">
            <div id="map" role="application" aria-label="Interaktive Karte der verfügbaren Etappen"></div>
            <p id="map-status" class="map-status" aria-live="polite"></p>
            <div class="gpx-downloads">
              <a id="gpx-download" class="button button-primary" hidden>GPX</a>
              <a id="maps-navigation" class="button button-primary" target="_blank" rel="noopener noreferrer">Navigation</a>
              <a class="button button-secondary" href="${import.meta.env.BASE_URL}assets/gpx/balkan-ride-2027-alle-etappen.zip" download>ZIP</a>
            </div>
          </div>
        </section>

        <section class="journey-panel" aria-label="Etappen und Roadbook">
          <div class="journey-heading">
            <div>
              <p class="eyebrow">DIE TOUR · ${roadbookDays.length} TAGE UNTERWEGS</p>
              <h1>Der Balkan ruft.</h1>
              <p class="intro">${roadbookDays.length} Tage. Eine Menge Kehren. Euer digitales Roadbook für die große Runde.</p>
            </div>
            <div class="day-count"><strong id="day-count">00</strong><span>ETAPPEN<br>IM ROADBOOK</span></div>
          </div>

          <nav class="day-picker" aria-label="Etappe auswählen">
            <div class="day-picker-head">
              <div class="day-picker-label">ETAPPEN</div>
            </div>
            <div class="day-picker-controls">
              <button id="day-picker-previous" class="day-scroll" type="button" aria-label="Vorherige Etappe auswählen" aria-controls="day-list">‹</button>
              <ol id="day-list" class="day-list"></ol>
              <button id="day-picker-next" class="day-scroll" type="button" aria-label="Nächste Etappe auswählen" aria-controls="day-list">›</button>
            </div>
          </nav>

          <article id="day-detail" class="day-detail" aria-live="polite"></article>
        </section>
      </section>

      <section id="media" class="media-page" aria-labelledby="media-title">
        <div class="section-heading">
          <p class="eyebrow">FOTOS · VIDEOS · ETAPPEN</p>
          <h2 id="media-title">Galerie der Tour.</h2>
          <p>Alle Bilder und Videos aus dem Roadbook, gesammelt an einem Ort.</p>
        </div>
        <div class="media-gallery-toolbar">
          <label>
            <span>Medientyp</span>
            <select id="media-type-filter">
              <option value="all">Alle</option>
              <option value="photo">Fotos</option>
              <option value="video">Videos</option>
            </select>
          </label>
          <label>
            <span>Etappe</span>
            <select id="media-stage-filter">
              <option value="all">Alle Etappen</option>
              ${roadbookDays.map(({ frontmatter }, index) => `
                <option value="${index}">Etappe ${String(frontmatter.tag).padStart(2, '0')} · ${escapeDisplayText(frontmatter.titel)}</option>
              `).join('')}
            </select>
          </label>
        </div>
        <div id="media-gallery" class="media-gallery-list"></div>
      </section>

      <section id="logistics" class="logistics-section">
        <div class="section-heading">
          <p class="eyebrow">VORBEREITUNG · UNTERWEGS</p>
          <h2>Damit die Tour rund läuft.</h2>
          <p>Die wichtigsten Punkte für Papiere, Pässe, Sprit und Schrauberei.</p>
        </div>
        <div id="logistics-checklist" class="checklist-grid"></div>
        <p class="checklist-note">Eure Häkchen werden auf diesem Gerät gespeichert.</p>
      </section>
    </main>

    <nav class="mobile-day-navigation" id="mobile-day-navigation" aria-label="Etappe wechseln" hidden>
      <button type="button" class="button button-secondary" id="mobile-previous-day" aria-label="Vorherige Etappe">←</button>
      <button type="button" class="button button-primary" id="mobile-next-day" aria-label="Nächste Etappe">→</button>
    </nav>

    <footer class="site-footer">
      <span>ALLZEIT GUTE FAHRT.</span>
      <span>BALKAN-RIDE 2027 · ROADBOOK</span>
    </footer>

    <dialog id="lightbox" class="lightbox" aria-label="Galerieansicht">
      <button class="lightbox-close" type="button" aria-label="Bildansicht schließen">SCHLIESSEN <span aria-hidden="true">×</span></button>
      <div class="lightbox-media">
        <img alt="" hidden>
        <video controls playsinline hidden></video>
        <button class="youtube-preview lightbox-youtube-preview" type="button" hidden aria-label="Video laden und abspielen"><span class="youtube-preview-play" aria-hidden="true">▶</span><span class="youtube-preview-note">2-Klick-Vorschau: Mit Klick wird das Video von YouTube (youtube-nocookie.com) geladen.</span></button>
        <iframe title="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen hidden></iframe>
      </div>
      <p class="lightbox-caption"></p>
      <nav class="lightbox-navigation" aria-label="Galerie-Navigation">
        <button class="lightbox-previous" type="button" aria-label="Vorheriges Medium">←</button>
        <button class="lightbox-next" type="button" aria-label="Nächstes Medium">→</button>
      </nav>
    </dialog>
    <dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title">
      <button class="settings-close" type="button" aria-label="Einstellungen schließen">×</button>
      <h2 id="settings-title">Einstellungen</h2>
      <fieldset class="settings-group">
        <legend>Farbschema</legend>
        <div class="theme-options">
          <button class="theme-choice" type="button" data-theme-choice="default" aria-pressed="false">
            <span class="theme-swatches theme-swatches-gold" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Balkan Gold</span><span class="theme-check" aria-hidden="true">✓</span>
          </button>
          <button class="theme-choice" type="button" data-theme-choice="schalke" aria-pressed="false">
            <span class="theme-swatches theme-swatches-blue" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Königsblau</span><span class="theme-check" aria-hidden="true">✓</span>
          </button>
          <button class="theme-choice" type="button" data-theme-choice="bvb" aria-pressed="false">
            <span class="theme-swatches theme-swatches-yellow" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Borussia</span><span class="theme-check" aria-hidden="true">✓</span>
          </button>
        </div>
      </fieldset>
      <label class="settings-select-label" for="navigation-app">
        <span>Standard-Navi-App</span>
        <select id="navigation-app">
          <option value="google">Google Maps</option>
          <option value="apple">Apple Karten</option>
          <option value="kurviger">Kurviger</option>
        </select>
      </label>
      <fieldset class="settings-group">
        <legend>Schriftgröße / Handschuh-Modus</legend>
        <div class="font-size-control">
          <input id="font-size-range" class="font-size-range" type="range" min="1" max="5" step="1" value="2" aria-label="Schriftgröße, Stufe 1 bis 5" list="font-size-steps">
          <ol id="font-size-steps" class="font-size-steps" aria-hidden="true">
            <li data-font-step="1">1</li><li data-font-step="2">2</li><li data-font-step="3">3</li><li data-font-step="4">4</li><li data-font-step="5">5</li>
          </ol>
          <output id="font-size-value" class="font-size-value" for="font-size-range" aria-live="polite"></output>
        </div>
      </fieldset>
      <fieldset class="settings-group slideshow-settings">
        <legend>Startseiten-Slideshow</legend>
        <label class="slideshow-toggle">
          <span>Slideshow auf der Startseite</span>
          <span id="slideshow-enabled-state" aria-hidden="true">An</span>
          <input id="slideshow-enabled" type="checkbox" role="switch" checked>
        </label>
        ${Object.entries(SLIDESHOW_SETTINGS).map(([name, { label, min, max, unit }]) => `
          <label class="slideshow-setting">
            <span>${label}${unit ? ` (${min}–${max} ${unit})` : ` (${min}–${max})`}</span>
            <input type="number" inputmode="numeric" min="${min}" max="${max}" step="1" data-slideshow-setting="${name}">
          </label>`).join('')}
      </fieldset>
      <p id="settings-status" class="settings-status" role="status" aria-live="polite"></p>
      <button id="refresh-app" class="button button-primary settings-refresh" type="button">App &amp; Offline-Cache aktualisieren</button>
      <section class="version-current-grid" aria-label="Aktueller Versionsstand">
        <div class="version-current-item">
          <button id="app-version-toggle" class="version-current-card" type="button" aria-expanded="false" aria-controls="app-version-history" data-version-history-toggle>
            <span class="version-current-label">App-Version</span>
            <strong id="version-current">lädt …</strong>
            <span class="version-history-indicator" aria-hidden="true">▾</span>
          </button>
          <section id="app-version-history" class="settings-history" aria-labelledby="app-version-toggle" hidden>
            <ol id="app-version-history-list" class="version-history-list"></ol>
          </section>
        </div>
        <div class="version-current-item">
          <button id="service-worker-version-toggle" class="version-current-card" type="button" aria-expanded="false" aria-controls="service-worker-version-history" data-version-history-toggle>
            <span class="version-current-label">Service-Worker-Cache</span>
            <strong id="service-worker-current">lädt …</strong>
            <span class="version-history-indicator" aria-hidden="true">▾</span>
          </button>
          <section id="service-worker-version-history" class="settings-history" aria-labelledby="service-worker-version-toggle" hidden>
            <ol id="service-worker-history-list" class="version-history-list"></ol>
          </section>
        </div>
      </section>
    </dialog>
  `;
}

async function loadVersionHistory() {
  const current = document.querySelector('#version-current');
  const list = document.querySelector('#app-version-history-list');
  const serviceWorkerCurrent = document.querySelector('#service-worker-current');
  const serviceWorkerList = document.querySelector('#service-worker-history-list');

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (typeof data.version !== 'string' || !Array.isArray(data.history)
      || !data.history.every((entry) => entry && typeof entry.version === 'string'
        && typeof entry.date === 'string' && typeof entry.message === 'string')
      || typeof data.serviceWorkerCache !== 'string' || !Array.isArray(data.serviceWorkerHistory)
      || !data.serviceWorkerHistory.every((entry) => entry && typeof entry.version === 'string'
        && typeof entry.date === 'string' && typeof entry.message === 'string')) {
      throw new Error('Ungültiges Format der Versionsdatei.');
    }
    current.textContent = data.version;
    list.innerHTML = data.history.map((entry) => `
      <li><div><strong>${escapeDisplayText(entry.version)}</strong><time>${escapeDisplayText(entry.date)}</time></div>
        <p>${escapeDisplayText(entry.message)}</p></li>
    `).join('');
    serviceWorkerCurrent.textContent = data.serviceWorkerCache;
    serviceWorkerList.innerHTML = data.serviceWorkerHistory.map((entry) => `
      <li><div><strong>${escapeDisplayText(entry.version)}</strong><time>${escapeDisplayText(entry.date)}</time></div>
        <p>${escapeDisplayText(entry.message)}</p></li>
    `).join('');
  } catch (error) {
    console.error('Der Versionsverlauf konnte nicht geladen werden.', error);
    current.textContent = 'nicht verfügbar';
    serviceWorkerCurrent.textContent = 'nicht verfügbar';
  }
}

function renderApp() {
  if (!roadbookDays.length) {
    throw new Error('Keine Etappendateien in content/tag-*.md gefunden.');
  }

  renderShell();
  const navigationLinks = [...document.querySelectorAll('.site-nav a')];
  const viewIds = ['start', 'roadbook', 'media', 'logistics'];
  const viewSections = viewIds.map((id) => document.getElementById(id));
  const startSection = document.getElementById('start');
  const tourOverview = buildTourOverview(roadbookDays, tourInfo);
  startSection.innerHTML = renderTourOverview(tourOverview, tourInfo);
  bindSelfCheck(startSection);
  bindHeaderHeight(document.querySelector('.site-header'));
  let onRoadbookShown = () => {};
  let onStartShown = () => {};
  let activeView = 'start';
  const tourScrollPosition = createTourScrollMemory();
  history.scrollRestoration = 'manual';
  const mobileDayNavigation = document.querySelector('#mobile-day-navigation');
  const mobileViewport = window.matchMedia('(max-width: 768px)');
  // Die Tagesleiste (←/→) gehört zum Roadbook und stört auf der Tourübersicht.
  const syncMobileDayNavigation = () => {
    mobileDayNavigation.hidden = !mobileViewport.matches || activeView === 'start';
  };
  const slideshow = startSection.querySelector('.tour-slideshow');
  const slideshowSummary = startSection.querySelector('.tour-mobile-summary');
  const slideshowImage = slideshow.querySelector('img');
  const slideshowMediaUrls = mediaPathMap(mediaAssets);
  const slideshowController = createSlideshowController({
    getSettings: () => readSlideshowSettings(localStorage),
    getSlides: () => buildHighlightSlides(tourOverview.highlights, roadbookDays, slideshowMediaUrls, readSlideshowSettings(localStorage).photosPerHighlight),
    render: (slide) => {
      slideshow.hidden = !slide;
      slideshowSummary.classList.toggle('is-slideshow', Boolean(slide));
      if (!slide) return;
      slideshowImage.src = slide.src;
      slideshowImage.alt = slide.alt;
      slideshow.querySelector('.tour-slideshow-title').textContent = `Tag ${String(slide.tag).padStart(2, '0')} · ${slide.title}`;
      slideshow.querySelector('.tour-slideshow-credit').textContent = slide.credit;
    },
  });
  const slideshowViewport = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Nur auf der sichtbaren mobilen Startseite und ohne Bewegungsreduzierung; sonst werden alle Timer geräumt.
  const syncSlideshow = () => {
    if (activeView === 'start' && slideshowViewport.matches && !reducedMotion.matches && !document.hidden
      && readSlideshowSettings(localStorage).enabled) {
      slideshowController.start();
    } else {
      slideshowController.stop();
    }
  };
  slideshow.querySelector('.tour-slideshow-close').addEventListener('click', () => slideshowController.showBento());
  [slideshowViewport, reducedMotion].forEach((query) => query.addEventListener('change', syncSlideshow));
  document.addEventListener('visibilitychange', syncSlideshow);
  const showView = (id) => {
    const active = viewIds.includes(id) ? id : 'start';
    activeView = active;
    viewSections.forEach((section) => { section.hidden = section.id !== active; });
    syncMobileDayNavigation();
    syncSlideshow();
    navigationLinks.forEach((link) => {
      const isActive = link.hash === `#${active}`;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    if (active === 'roadbook') {
      onRoadbookShown();
    } else if (active === 'start') {
      onStartShown();
    }
  };
  const viewFromHash = () => location.hash.replace('#', '');
  const navigate = (id, { brand = false } = {}) => {
    const target = viewIds.includes(id) ? id : 'start';
    const scrollY = tourScrollPosition(activeView, target, window.scrollY, brand);
    showView(target);
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  };
  const goToView = (id, options) => {
    if (viewFromHash() !== id) {
      history.pushState(null, '', `#${id}`);
    }
    navigate(id, options);
  };
  [...navigationLinks, ...document.querySelectorAll('a[data-view-link]')].forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      goToView(link.hash.replace('#', ''), { brand: link.classList.contains('brand') });
    });
  });
  const syncHistoryView = () => {
    const id = viewFromHash();
    const target = viewIds.includes(id) ? id : 'start';
    if (target !== activeView) navigate(target);
  };
  window.addEventListener('hashchange', syncHistoryView);
  window.addEventListener('popstate', syncHistoryView);
  showView(viewFromHash());

  const mediaGallery = document.querySelector('#media-gallery');
  mediaGallery.innerHTML = renderMediaGallery(roadbookDays, { assetUrls: mediaAssets });
  const settings = initializeSettings();
  loadVersionHistory();

  const dayList = document.querySelector('#day-list');
  const dayDetail = document.querySelector('#day-detail');
  const previousDayButton = document.querySelector('#day-picker-previous');
  const nextDayButton = document.querySelector('#day-picker-next');
  const mobilePreviousDay = document.querySelector('#mobile-previous-day');
  const mobileNextDay = document.querySelector('#mobile-next-day');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxVideo = lightbox.querySelector('video');
  const lightboxFrame = lightbox.querySelector('iframe');
  const lightboxYoutubePreview = lightbox.querySelector('.lightbox-youtube-preview');
  let lightboxYoutubeSrc = '';
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxPrevious = lightbox.querySelector('.lightbox-previous');
  const lightboxNext = lightbox.querySelector('.lightbox-next');
  const map = createRoadbookMap(
    L, roadbookDays, document.querySelector('#map-status'), document.querySelector('#gpx-download'),
  );
  const tourMap = createTourMap(L, roadbookDays, document.querySelector('#tour-map-status'));
  map.setTourTrackHandler(tourMap.updateDay);
  onStartShown = () => requestAnimationFrame(() => tourMap.resize());
  if (activeView === 'start') onStartShown();
  settings.setThemeChangeHandler(map.setTheme);
  settings.setSlideshowChangeHandler(() => {
    slideshowController.stop();
    syncSlideshow();
  });
  // Startet die App auf der Tourübersicht, hatte die Karte keine Größe und wird beim ersten Anzeigen neu eingepasst.
  let mapFitted = !document.getElementById('roadbook').hidden;
  onRoadbookShown = () => {
    map.resize({ fitActiveDay: mobileViewport.matches, fitAll: !mapFitted && !mobileViewport.matches });
    mapFitted = true;
    requestAnimationFrame(() => map.resize());
  };
  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  let activeIndex = 0;
  let activeProfileController = null;
  let activePoiData = null;
  let lightboxItems = [];
  let lightboxIndex = -1;
  let touchStart = null;

  function showLightboxItem(index) {
    if (index < 0 || index >= lightboxItems.length) {
      return;
    }

    lightboxIndex = index;
    const item = lightboxItems[index];
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxFrame.removeAttribute('src');
    lightboxImage.removeAttribute('src');
    lightboxImage.hidden = item.type !== 'image';
    lightboxVideo.hidden = item.type !== 'video';
    lightboxFrame.hidden = true;
    lightboxYoutubePreview.hidden = item.type !== 'youtube';
    const youtubeId = item.type === 'youtube' ? /embed\/([\w-]{11})/.exec(item.src)?.[1] : null;
    lightboxYoutubePreview.style.backgroundImage = youtubeId ? `url("https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg")` : '';
    lightboxYoutubeSrc = '';

    if (item.type === 'image') {
      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;
    } else if (item.type === 'video') {
      lightboxVideo.src = item.src;
      lightboxVideo.load();
    } else {
      lightboxYoutubeSrc = item.src.includes('autoplay=1') ? item.src : `${item.src}&autoplay=1`;
      lightboxFrame.title = item.alt;
    }
    lightboxCaption.textContent = [...new Set((item.caption || '')
      .split(/\s+·\s+/)
      .map((part) => part.trim())
      .filter(Boolean))].join(' · ');
    lightboxPrevious.disabled = index === 0;
    lightboxNext.disabled = index === lightboxItems.length - 1;
  }

  function openLightbox(container, trigger) {
    const itemsByIndex = new Map();
    container.querySelectorAll('[data-lightbox-index]').forEach((item) => {
      itemsByIndex.set(item.dataset.lightboxIndex, {
        index: Number(item.dataset.lightboxIndex),
        type: item.dataset.lightboxType,
        src: item.dataset.lightboxSrc,
        alt: item.dataset.lightboxAlt,
        caption: item.dataset.lightboxCaption,
      });
    });
    lightboxItems = [...itemsByIndex.values()].sort((first, second) => first.index - second.index);
    const selectedIndex = lightboxItems.findIndex(
      (item) => item.index === Number(trigger.dataset.lightboxIndex),
    );
    showLightboxItem(selectedIndex);
    lightbox.showModal();
  }

  function syncMobileViewport() {
    syncMobileDayNavigation();
    requestAnimationFrame(() => map.resize({ fitActiveDay: mobileViewport.matches }));
    if (activeView === 'start') requestAnimationFrame(() => tourMap.resize());
  }

  mobileViewport.addEventListener('change', syncMobileViewport);
  syncMobileViewport();

  function updateElevationProfile(index) {
    if (index !== activeIndex) {
      return;
    }
    const container = dayDetail.querySelector('[data-elevation-profile]');
    if (!container || container.dataset.bound) {
      return;
    }
    const track = map.getTrackData(index);
    if (track.state === 'loading' || track.state === 'error') {
      return;
    }

    const route = buildRouteTrack(track.profileSegments);
    if (!route) {
      return;
    }
    container.dataset.bound = 'true';
    const poiPositions = buildPoiPositions(route, track.waypoints);
    const poiData = { track: route, pois: poiPositions };
    activePoiData = poiData;
    activeProfileController = null;
    const profile = buildElevationProfile(route, track.waypoints, poiPositions);
    if (profile) {
      container.innerHTML = renderElevationProfile(profile);
      container.hidden = false;
      activeProfileController = bindElevationProfile(
        container,
        profile,
        map.setLivePosition,
        map.setHighlightedWaypoint,
      );
    }
  }

  document.querySelector('#day-count').textContent = String(roadbookDays.length).padStart(2, '0');
  dayList.innerHTML = roadbookDays.map(({ frontmatter }, index) => `
    <li>
      <button class="day-link" type="button" data-day-index="${index}" aria-current="${index === 0 ? 'step' : 'false'}">
        <span class="day-link-number">${String(frontmatter.tag).padStart(2, '0')}</span>
        <span class="day-link-title">${escapeDisplayText(frontmatter.titel)}</span>
      </button>
    </li>
  `).join('');

  function selectDay(index, {
    moveMap = true,
    centerDay = true,
    centerScrollBehavior = scrollBehavior(),
  } = {}) {
    if (!Number.isInteger(index) || index < 0 || index >= roadbookDays.length) {
      return;
    }

    const changed = index !== activeIndex;
    activeProfileController = null;
    activePoiData = null;
    map.setLivePosition(null);
    map.setHighlightedWaypoint(null);
    activeIndex = index;
    const day = roadbookDays[index];
    document.querySelector('#mobile-stage-label').textContent = `Etappe ${String(day.frontmatter.tag).padStart(2, '0')}`;
    document.querySelector('#mobile-stage-title').textContent = day.frontmatter.titel;
    setNavigationTarget(document.querySelector('#maps-navigation'), ...day.frontmatter.koordinaten_ziel);
    dayDetail.innerHTML = renderDayContent(day, {
      marked,
      DOMPurify,
      assetUrls: mediaAssets,
    });

    dayList.querySelectorAll('.day-link').forEach((button, buttonIndex) => {
      button.setAttribute('aria-current', buttonIndex === index ? 'step' : 'false');
    });
    if (centerDay) {
      dayList.querySelector(`[data-day-index="${index}"]`).scrollIntoView({
        behavior: centerScrollBehavior, inline: 'center', block: 'nearest',
      });
    }
    previousDayButton.disabled = index === 0;
    nextDayButton.disabled = index === roadbookDays.length - 1;
    mobilePreviousDay.disabled = index === 0;
    mobileNextDay.disabled = index === roadbookDays.length - 1;
    document.querySelector('#previous-day').disabled = index === 0;
    document.querySelector('#next-day').disabled = index === roadbookDays.length - 1;
    map.selectDay(index, { moveMap: moveMap && !mobileViewport.matches });
    if (mobileViewport.matches) {
      requestAnimationFrame(() => map.resize({ fitActiveDay: mobileViewport.matches }));
      if (changed) {
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
      }
    }
    updateElevationProfile(index);
  }

  previousDayButton.addEventListener('click', () => {
    selectDay(activeIndex - 1, { centerScrollBehavior: 'smooth' });
  });
  nextDayButton.addEventListener('click', () => {
    selectDay(activeIndex + 1, { centerScrollBehavior: 'smooth' });
  });
  mobilePreviousDay.addEventListener('click', () => selectDay(activeIndex - 1));
  mobileNextDay.addEventListener('click', () => selectDay(activeIndex + 1));
  dayList.addEventListener('wheel', (event) => {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }
    const maxScroll = dayList.scrollWidth - dayList.clientWidth;
    if ((event.deltaY < 0 && dayList.scrollLeft <= 0) || (event.deltaY > 0 && dayList.scrollLeft >= maxScroll)) {
      return;
    }
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? dayList.clientWidth : 1;
    dayList.scrollLeft += event.deltaY * multiplier;
    event.preventDefault();
  }, { passive: false });

  dayList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-day-index]');
    if (button) {
      selectDay(Number(button.dataset.dayIndex));
    }
  });

  startSection.addEventListener('click', (event) => {
    const link = event.target.closest('[data-open-day]');
    if (!link) {
      return;
    }
    event.preventDefault();
    goToView('roadbook');
    selectDay(Number(link.dataset.openDay));
  });

  dayDetail.addEventListener('click', (event) => {
    if (event.target.closest('#previous-day')) {
      selectDay(activeIndex - 1);
      return;
    }
    if (event.target.closest('#next-day')) {
      selectDay(activeIndex + 1);
      return;
    }
    const mediaButton = event.target.closest('[data-lightbox-src]');
    if (mediaButton) {
      openLightbox(dayDetail, mediaButton);
    }
  });

  function filterMediaGallery() {
    const selectedType = document.querySelector('#media-type-filter').value;
    const selectedStage = document.querySelector('#media-stage-filter').value;
    const noResults = mediaGallery.querySelector('[data-media-no-results]');
    let visibleStages = 0;

    mediaGallery.querySelectorAll('[data-media-stage]').forEach((stage) => {
      const stageMatches = selectedStage === 'all' || stage.dataset.dayIndex === selectedStage;
      const entries = [...stage.querySelectorAll('[data-media-type]')];
      let matchingEntries = 0;
      entries.forEach((entry) => {
        const matches = selectedType === 'all' || entry.dataset.mediaType === selectedType;
        entry.hidden = !matches;
        if (matches) matchingEntries += 1;
      });

      const hasSelectedType = selectedType === 'all'
        || entries.some((entry) => entry.dataset.mediaType === selectedType);
      stage.hidden = !stageMatches || (selectedStage === 'all' && !hasSelectedType);
      if (stage.hidden) return;

      visibleStages += 1;
      const empty = stage.querySelector('[data-media-empty]');
      empty.hidden = matchingEntries > 0;
      if (matchingEntries === 0) {
        empty.textContent = selectedType === 'all'
          ? 'Für diese Etappe sind noch keine Medien hinterlegt.'
          : `Für diese Etappe sind keine ${selectedType === 'photo' ? 'Fotos' : 'Videos'} hinterlegt.`;
      }
    });
    noResults.hidden = visibleStages > 0;
  }

  document.querySelector('#media-type-filter').addEventListener('change', filterMediaGallery);
  document.querySelector('#media-stage-filter').addEventListener('change', filterMediaGallery);
  mediaGallery.addEventListener('click', (event) => {
    const dayButton = event.target.closest('[data-select-day-index]');
    if (dayButton) {
      selectDay(Number(dayButton.dataset.selectDayIndex));
      document.querySelector('#roadbook').scrollIntoView({ behavior: scrollBehavior() });
      return;
    }
    const mediaButton = event.target.closest('[data-lightbox-src]');
    if (mediaButton) {
      openLightbox(mediaButton.closest('[data-media-stage]'), mediaButton);
    }
  });
  filterMediaGallery();

  lightboxYoutubePreview.addEventListener('click', () => {
    if (!navigator.onLine) {
      lightboxYoutubePreview.querySelector('.youtube-preview-note').textContent = 'Offline: Das Video kann nur mit Internetverbindung geladen werden.';
      return;
    }
    lightboxFrame.src = lightboxYoutubeSrc;
    lightboxFrame.hidden = false;
    lightboxYoutubePreview.hidden = true;
  });
  document.addEventListener('click', (event) => {
    const preview = event.target.closest('.video-frame > .youtube-preview[data-youtube-embed]');
    if (!preview) {
      return;
    }
    if (!navigator.onLine) {
      preview.querySelector('.youtube-preview-note').textContent = 'Offline: Das Video kann nur mit Internetverbindung geladen werden.';
      return;
    }
    const frame = document.createElement('iframe');
    frame.src = preview.dataset.youtubeEmbed;
    frame.title = preview.dataset.youtubeTitle || 'Etappenvideo';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    preview.replaceWith(frame);
  });
  lightboxPrevious.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
  lightboxNext.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
  lightbox.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  }, { passive: true });
  lightbox.addEventListener('touchend', (event) => {
    if (!touchStart || event.changedTouches.length !== 1) {
      touchStart = null;
      return;
    }
    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
      showLightboxItem(lightboxIndex + (deltaX < 0 ? 1 : -1));
    }
    touchStart = null;
  }, { passive: true });
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });
  lightbox.addEventListener('close', () => {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();
    lightboxFrame.removeAttribute('src');
    lightboxImage.removeAttribute('src');
    lightboxImage.alt = '';
    lightboxCaption.textContent = '';
    lightboxItems = [];
    lightboxIndex = -1;
  });

  renderLogisticsChecklist({
    container: document.querySelector('#logistics-checklist'),
    markdown: logisticsMarkdown,
    marked,
    DOMPurify,
  });
  map.setSelectHandler((index) => {
    if (index !== activeIndex) selectDay(index);
  });
  map.setPoiSelectHandler((waypoint) => {
    const poi = activePoiData?.pois.find((entry) => entry.waypoint === waypoint);
    if (poi) {
      activeProfileController?.selectPoi(poi, 'map');
    }
  });
  map.setTrackLoadHandler(updateElevationProfile);
  selectDay(0, { moveMap: false, centerDay: false });
}

try {
  renderApp();
} catch (error) {
  console.error('Das Roadbook konnte nicht geladen werden.', error);
  app.innerHTML = `
    <section class="load-error" role="alert">
      <p class="eyebrow">ROADBOOK NICHT VERFÜGBAR</p>
      <h1>Beim Laden ist etwas schiefgelaufen.</h1>
      <p>Bitte prüfe die Etappendateien und lade die Seite erneut.</p>
    </section>
  `;
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
  }).catch((error) => {
    console.error('Der Service Worker konnte nicht registriert werden.', error);
  });
}
