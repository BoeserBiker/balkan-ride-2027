import L from 'leaflet';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import 'leaflet/dist/leaflet.css';
import './style.css';
import roadbookDays from 'virtual:roadbook-content';
import logisticsMarkdown from '../../docs/motorrad_checkliste_logistik.md?raw';
import { createRoadbookMap } from './map.js';
import { renderDayContent } from './roadbook.js';
import {
  bindElevationScrubber,
  buildElevationProfile,
  renderElevationProfile,
} from './elevation-profile.js';
import { renderLogisticsChecklist } from './logistics.js';
import { escapeHtml } from './html.js';

const app = document.querySelector('#app');
const mediaAssets = import.meta.glob('../../assets/media/**/*.{avif,gif,jpeg,jpg,png,webp,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function renderShell() {
  app.innerHTML = `
    <header class="site-header flex items-center justify-between">
      <a class="brand" href="#top" aria-label="Balkan-Ride 2027 Startseite">
        <img class="brand-mark" src="${import.meta.env.BASE_URL}favicon.svg?v=3" alt="" aria-hidden="true">
        <span><strong>BALKAN RIDE</strong><small>ROADBOOK · 2027</small></span>
      </a>
      <nav class="site-nav" aria-label="Hauptnavigation">
        <a href="#roadbook">Etappen</a>
        <a href="#logistics">Logistik</a>
      </nav>
    </header>

    <main id="top">
      <section id="roadbook" class="roadbook-layout mx-auto max-w-[1680px]" aria-label="Tour-Roadbook">
        <section class="map-panel" aria-label="Etappenkarte">
          <div class="map-topline">
            <span class="eyebrow">SLOWENIEN · BALKAN · GRIECHENLAND</span>
            <span class="map-live"><i aria-hidden="true"></i> TOURKARTE</span>
          </div>
          <div id="map" role="application" aria-label="Interaktive Karte der verfügbaren Etappen"></div>
          <p id="map-status" class="map-status" aria-live="polite"></p>
          <div class="gpx-downloads">
            <a id="gpx-download" class="button button-primary" hidden>GPX Datei</a>
            <a class="button button-secondary" href="${import.meta.env.BASE_URL}assets/gpx/balkan-ride-2027-alle-etappen.zip" download>Alle GPX als ZIP</a>
          </div>
          <p class="map-status">OSRM-Vorab-Tracks, nicht vor Ort geprüft. Tag 19 enthält keinen Straßen-Track.</p>
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

    <footer class="site-footer">
      <span>ALLZEIT GUTE FAHRT.</span>
      <span>BALKAN-RIDE 2027 · ROADBOOK</span>
    </footer>

    <dialog id="lightbox" class="lightbox" aria-label="Bildansicht">
      <button class="lightbox-close" type="button" aria-label="Bildansicht schließen">SCHLIESSEN <span aria-hidden="true">×</span></button>
      <img alt="">
      <p class="lightbox-caption"></p>
    </dialog>
  `;
}

function renderApp() {
  if (!roadbookDays.length) {
    throw new Error('Keine Etappendateien in content/tag-*.md gefunden.');
  }

  renderShell();

  const dayList = document.querySelector('#day-list');
  const dayDetail = document.querySelector('#day-detail');
  const previousDayButton = document.querySelector('#day-picker-previous');
  const nextDayButton = document.querySelector('#day-picker-next');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const map = createRoadbookMap(
    L, roadbookDays, document.querySelector('#map-status'), document.querySelector('#gpx-download'),
  );
  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  let activeIndex = 0;

  function updateElevationProfile(index) {
    if (index !== activeIndex) {
      return;
    }
    const container = dayDetail.querySelector('[data-elevation-profile]');
    if (!container) {
      return;
    }
    const track = map.getTrackData(index);
    if (track.state === 'loading') {
      return;
    }
    if (track.state === 'error') {
      container.innerHTML = '<p class="muted-copy">Die Tages-GPX konnte nicht geladen werden.</p>';
      return;
    }

    const profile = buildElevationProfile(track.profileSegments, track.estimatedAscentMeters);
    container.innerHTML = renderElevationProfile(profile);
    const scrubber = container.querySelector('[data-elevation-scrubber]');
    if (profile && scrubber) {
      bindElevationScrubber(scrubber, profile, map.setLivePosition);
    }
  }

  document.querySelector('#day-count').textContent = String(roadbookDays.length).padStart(2, '0');
  dayList.innerHTML = roadbookDays.map(({ frontmatter }, index) => `
    <li>
      <button class="day-link" type="button" data-day-index="${index}" aria-current="${index === 0 ? 'step' : 'false'}">
        <span class="day-link-number">${String(frontmatter.tag).padStart(2, '0')}</span>
        <span class="day-link-title">${escapeHtml(frontmatter.titel)}</span>
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
    activeIndex = index;
    const day = roadbookDays[index];
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
    document.querySelector('#previous-day').disabled = index === 0;
    document.querySelector('#next-day').disabled = index === roadbookDays.length - 1;
    map.selectDay(index, { moveMap });
    updateElevationProfile(index);
  }

  previousDayButton.addEventListener('click', () => {
    selectDay(activeIndex - 1, { centerScrollBehavior: 'smooth' });
  });
  nextDayButton.addEventListener('click', () => {
    selectDay(activeIndex + 1, { centerScrollBehavior: 'smooth' });
  });
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
  map.setTrackLoadHandler(updateElevationProfile);
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
