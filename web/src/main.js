import L from 'leaflet';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import 'leaflet/dist/leaflet.css';
import './style.css';
import roadbookDays from 'virtual:roadbook-content';
import logisticsMarkdown from '../../docs/motorrad_checkliste_logistik.md?raw';
import { createRoadbookMap } from './map.js';
import { renderDayContent } from './roadbook.js';
import { bindRouteScrubber, buildRouteTrack } from './route-scrubber.js';
import { bindElevationProfile, buildElevationProfile, renderElevationProfile } from './elevation-profile.js';
import { renderLogisticsChecklist } from './logistics.js';
import { escapeDisplayText, googleMapsDirectionsUrl } from './html.js';

const app = document.querySelector('#app');
const mediaAssets = import.meta.glob('../../assets/media/**/*.{avif,gif,jpeg,jpg,png,webp,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function renderShell() {
  app.innerHTML = `
    <header class="site-header flex items-center justify-between">
      <div class="brand-group">
        <a class="brand" href="#top" aria-label="Balkan-Ride 2027 Startseite">
          <img class="brand-mark" src="${import.meta.env.BASE_URL}favicon.svg?v=3" alt="" aria-hidden="true">
          <span><strong>BALKAN RIDE</strong><small>ROADBOOK · 2027</small></span>
        </a>
      </div>
      <div class="header-navigation">
        <nav class="site-nav" aria-label="Hauptnavigation">
          <a href="#roadbook">Etappen</a>
          <a href="#logistics">Logistik</a>
        </nav>
        <button id="version-badge" class="version-badge" type="button" aria-haspopup="dialog" aria-controls="version-history" disabled>Version lädt</button>
      </div>
    </header>

    <main id="top">
      <section id="roadbook" class="roadbook-layout mx-auto max-w-[1680px]" aria-label="Tour-Roadbook">
        <section class="map-panel" aria-label="Etappenkarte">
          <div class="map-topline">
            <span class="eyebrow">SLOWENIEN · BALKAN · GRIECHENLAND</span>
            <span class="map-live"><i aria-hidden="true"></i> TOURKARTE</span>
          </div>
          <div class="mobile-map-controls" id="mobile-map-controls" hidden>
            <button type="button" class="button button-secondary" id="mobile-map-toggle" aria-expanded="true" aria-controls="map-content">Karte einklappen</button>
            <button type="button" class="button button-secondary" id="mobile-map-expand" aria-pressed="false" aria-controls="map-content">Große Kartenansicht</button>
          </div>
          <div id="map-content" class="map-content">
            <div id="map" role="application" aria-label="Interaktive Karte der verfügbaren Etappen"></div>
            <p id="map-status" class="map-status" aria-live="polite"></p>
            <div class="gpx-downloads">
              <a id="gpx-download" class="button button-primary" hidden>GPX Datei</a>
              <a id="maps-navigation" class="button button-primary" target="_blank" rel="noopener noreferrer">In Karten-App öffnen</a>
              <a class="button button-secondary" href="${import.meta.env.BASE_URL}assets/gpx/balkan-ride-2027-alle-etappen.zip" download>Alle GPX als ZIP</a>
            </div>
            <p class="map-status">OSRM-Vorab-Tracks, nicht vor Ort geprüft. Tag 19 enthält keinen Straßen-Track.</p>
          </div>
        </section>

        <section class="journey-panel" aria-label="Etappen und Roadbook">
          <div class="journey-heading">
            <div>
              <p class="eyebrow">DIE TOUR · ${roadbookDays.length} TAGE UNTERWEGS</p>
              <h1>Der Balkan ruft.</h1>
              <p class="intro">${roadbookDays.length} Tage. Eine Menge Kehren. Dein digitales Roadbook für die große Runde.</p>
            </div>
            <div class="day-count"><strong id="day-count">00</strong><span>ETAPPEN<br>IM ROADBOOK</span></div>
          </div>

          <nav class="day-picker" aria-label="Etappe auswählen">
            <div class="day-picker-label">ETAPPEN</div>
            <div class="day-picker-controls">
              <button id="day-picker-previous" class="day-scroll" type="button" aria-label="Vorherige Etappe auswählen" aria-controls="day-list">‹</button>
              <ol id="day-list" class="day-list"></ol>
              <button id="day-picker-next" class="day-scroll" type="button" aria-label="Nächste Etappe auswählen" aria-controls="day-list">›</button>
            </div>
          </nav>

          <article id="day-detail" class="day-detail" aria-live="polite"></article>
        </section>
      </section>

      <section id="logistics" class="logistics-section">
        <div class="section-heading">
          <p class="eyebrow">VORBEREITUNG · UNTERWEGS</p>
          <h2>Damit die Tour rund läuft.</h2>
          <p>Die wichtigsten Punkte für Papiere, Pässe, Sprit und Schrauberei.</p>
        </div>
        <div id="logistics-checklist" class="checklist-grid"></div>
        <p class="checklist-note">Deine Häkchen werden auf diesem Gerät gespeichert.</p>
      </section>
    </main>

    <nav class="mobile-day-navigation" id="mobile-day-navigation" aria-label="Etappe wechseln" hidden>
      <button type="button" class="button button-secondary" id="mobile-previous-day">← Zurück</button>
      <button type="button" class="button button-primary" id="mobile-next-day">Weiter →</button>
    </nav>

    <footer class="site-footer">
      <span>ALLZEIT GUTE FAHRT.</span>
      <span>BALKAN-RIDE 2027 · ROADBOOK</span>
    </footer>

    <dialog id="lightbox" class="lightbox" aria-label="Bildansicht">
      <button class="lightbox-close" type="button" aria-label="Bildansicht schließen">SCHLIESSEN <span aria-hidden="true">×</span></button>
      <img alt="">
      <p class="lightbox-caption"></p>
    </dialog>
    <dialog id="version-history" class="version-dialog" aria-labelledby="version-history-title">
      <button class="version-close" type="button" aria-label="Versionsverlauf schließen">×</button>
      <h2 id="version-history-title">Versionsverlauf</h2>
      <ol class="version-history-list"></ol>
    </dialog>
  `;
}

async function loadVersionHistory() {
  const badge = document.querySelector('#version-badge');
  const dialog = document.querySelector('#version-history');
  const list = dialog.querySelector('.version-history-list');

  dialog.querySelector('.version-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
      dialog.close();
    }
  });
  badge.addEventListener('click', () => dialog.showModal());

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (typeof data.version !== 'string' || !Array.isArray(data.history)
      || !data.history.every((entry) => entry && typeof entry.version === 'string'
        && typeof entry.date === 'string' && typeof entry.message === 'string')) {
      throw new Error('Ungültiges Format der Versionsdatei.');
    }
    badge.textContent = data.version;
    badge.setAttribute('aria-label', `Versionsverlauf öffnen, aktuelle Version ${data.version}`);
    list.innerHTML = data.history.map((entry) => `
      <li><div><strong>${escapeDisplayText(entry.version)}</strong><time>${escapeDisplayText(entry.date)}</time></div>
        <p>${escapeDisplayText(entry.message)}</p></li>
    `).join('');
    badge.disabled = false;
  } catch (error) {
    console.error('Der Versionsverlauf konnte nicht geladen werden.', error);
    badge.textContent = 'Version nicht verfügbar';
  }
}

function renderApp() {
  if (!roadbookDays.length) {
    throw new Error('Keine Etappendateien in content/tag-*.md gefunden.');
  }

  renderShell();
  loadVersionHistory();

  const dayList = document.querySelector('#day-list');
  const dayDetail = document.querySelector('#day-detail');
  const previousDayButton = document.querySelector('#day-picker-previous');
  const nextDayButton = document.querySelector('#day-picker-next');
  const mobilePreviousDay = document.querySelector('#mobile-previous-day');
  const mobileNextDay = document.querySelector('#mobile-next-day');
  const mobileDayNavigation = document.querySelector('#mobile-day-navigation');
  const mobileMapControls = document.querySelector('#mobile-map-controls');
  const mapPanel = document.querySelector('.map-panel');
  const mapToggle = document.querySelector('#mobile-map-toggle');
  const mapExpand = document.querySelector('#mobile-map-expand');
  const mobileViewport = window.matchMedia('(max-width: 768px)');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const map = createRoadbookMap(
    L, roadbookDays, document.querySelector('#map-status'), document.querySelector('#gpx-download'),
  );
  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  let activeIndex = 0;

  function updateMobileMapControls() {
    const collapsed = mapPanel.classList.contains('is-map-collapsed');
    const expanded = mapPanel.classList.contains('is-map-expanded');
    mapToggle.textContent = collapsed ? 'Karte anzeigen' : 'Karte einklappen';
    mapToggle.setAttribute('aria-expanded', String(!collapsed));
    mapExpand.textContent = expanded ? 'Zurück zum Roadbook' : 'Große Kartenansicht';
    mapExpand.setAttribute('aria-pressed', String(expanded));
    mobileDayNavigation.hidden = !mobileViewport.matches || expanded;
  }

  function syncMobileViewport() {
    const wasCollapsed = mapPanel.classList.contains('is-map-collapsed');
    mobileMapControls.hidden = !mobileViewport.matches;
    if (!mobileViewport.matches) {
      mapPanel.classList.remove('is-map-collapsed', 'is-map-expanded');
    }
    updateMobileMapControls();
    requestAnimationFrame(() => {
      map.resize();
      if (wasCollapsed && !mobileViewport.matches) map.selectDay(activeIndex);
    });
  }

  mapToggle.addEventListener('click', () => {
    const collapsed = mapPanel.classList.toggle('is-map-collapsed');
    if (collapsed) mapPanel.classList.remove('is-map-expanded');
    updateMobileMapControls();
    if (!collapsed) requestAnimationFrame(() => {
      map.resize();
      map.selectDay(activeIndex);
    });
  });
  mapExpand.addEventListener('click', () => {
    const wasCollapsed = mapPanel.classList.contains('is-map-collapsed');
    mapPanel.classList.remove('is-map-collapsed');
    mapPanel.classList.toggle('is-map-expanded');
    updateMobileMapControls();
    requestAnimationFrame(() => {
      map.resize();
      if (wasCollapsed) map.selectDay(activeIndex);
    });
  });
  mobileViewport.addEventListener('change', syncMobileViewport);
  syncMobileViewport();

  function updateRouteScrubber(index) {
    if (index !== activeIndex) {
      return;
    }
    const control = dayDetail.querySelector('[data-route-scrubber]');
    if (!control || control.dataset.bound) {
      return;
    }
    const track = map.getTrackData(index);
    if (track.state === 'loading') {
      return;
    }
    if (track.state === 'error') {
      control.setAttribute('aria-label', 'Streckenfortschritt nicht verfügbar: GPX konnte nicht geladen werden');
      control.title = 'GPX konnte nicht geladen werden.';
      return;
    }

    const route = buildRouteTrack(track.profileSegments);
    if (route) {
      control.dataset.bound = 'true';
      bindRouteScrubber(control, route, map.setLivePosition);
      const profile = buildElevationProfile(route, track.waypoints);
      if (profile) {
        const container = dayDetail.querySelector('[data-elevation-profile]');
        container.innerHTML = renderElevationProfile(profile);
        container.hidden = false;
        bindElevationProfile(container, profile, map.setLivePosition, map.setHighlightedWaypoint);
      }
    } else {
      control.setAttribute('aria-label', 'Streckenfortschritt nicht verfügbar: kein Straßen-Track');
      control.title = 'Kein Straßen-Track verfügbar.';
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

    map.setLivePosition(null);
    map.setHighlightedWaypoint(null);
    activeIndex = index;
    const day = roadbookDays[index];
    document.querySelector('#maps-navigation').href = googleMapsDirectionsUrl(...day.frontmatter.koordinaten_ziel);
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
    map.selectDay(index, { moveMap: moveMap && !(mobileViewport.matches && mapPanel.classList.contains('is-map-collapsed')) });
    updateRouteScrubber(index);
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

  dayDetail.addEventListener('click', (event) => {
    if (event.target.closest('#previous-day')) {
      selectDay(activeIndex - 1);
      return;
    }
    if (event.target.closest('#next-day')) {
      selectDay(activeIndex + 1);
      return;
    }
    const imageButton = event.target.closest('[data-lightbox-src]');
    if (imageButton) {
      lightboxImage.src = imageButton.dataset.lightboxSrc;
      lightboxImage.alt = imageButton.dataset.lightboxAlt;
      lightboxCaption.textContent = imageButton.dataset.lightboxCaption;
      lightbox.showModal();
    }
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });
  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
    lightboxImage.alt = '';
    lightboxCaption.textContent = '';
  });

  renderLogisticsChecklist({
    container: document.querySelector('#logistics-checklist'),
    markdown: logisticsMarkdown,
    marked,
    DOMPurify,
  });
  map.setSelectHandler(selectDay);
  map.setTrackLoadHandler(updateRouteScrubber);
  selectDay(0, { moveMap: false, centerDay: false });
  requestAnimationFrame(() => map.resize());
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
