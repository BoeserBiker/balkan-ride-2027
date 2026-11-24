import { distanceBetween, sampleRouteTrack } from './route-scrubber.js';
import { directionsUrl, escapeHtml } from './html.js';
import { cleanPoiName, editorialPoiDescription, formatPoiSummary } from './roadbook.js';

const WIDTH = 420;
const LEFT = 48;
const RIGHT = 410;
const HEIGHT = 230;
const TOP = 112;
const BOTTOM = 184;
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const STORAGE_KEY = 'balkan_elevation_collapsed';
let collapsed;

function readCollapsedState() {
  if (collapsed !== undefined) return collapsed;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null && saved !== 'true' && saved !== 'false') {
      console.error('Gespeicherter Höhenprofil-Zustand ist ungültig.');
    }
    if (saved === null) return window.innerWidth <= 768;
    collapsed = saved === 'true';
  } catch (error) {
    console.error('Höhenprofil-Zustand konnte nicht gelesen werden.', error);
    return window.innerWidth <= 768;
  }
  return collapsed;
}

function saveCollapsedState(value) {
  collapsed = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch (error) {
    console.error('Höhenprofil-Zustand konnte nicht gespeichert werden.', error);
  }
}

export function buildPoiPositions(track, waypoints = []) {
  if (!track?.points.length) return [];
  return waypoints.map((waypoint) => {
    let nearest = track.points[0];
    let nearestDistance = distanceBetween(waypoint, nearest);
    for (const point of track.points.slice(1)) {
      const distance = distanceBetween(waypoint, point);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }
    return { waypoint, point: nearest };
  });
}

export function buildElevationProfile(track, waypoints = [], poiPositions = buildPoiPositions(track, waypoints)) {
  const known = track.points.filter((point) => Number.isFinite(point.elevationMeters));
  if (!known.some((point) => point.elevationMeters !== 0)) return null;

  let minimum = Infinity;
  let maximum = -Infinity;
  let ascent = 0;
  let previous;
  for (const point of track.points) {
    if (!Number.isFinite(point.elevationMeters)) {
      previous = undefined;
      continue;
    }
    minimum = Math.min(minimum, point.elevationMeters);
    maximum = Math.max(maximum, point.elevationMeters);
    if (previous && previous.segmentIndex === point.segmentIndex) {
      ascent += Math.max(0, point.elevationMeters - previous.elevationMeters);
    }
    previous = point;
  }
  return { track, minimum, maximum, ascent, incomplete: known.length !== track.points.length, pois: poiPositions };
}

function coordinates(profile, point) {
  const x = LEFT + point.distanceKm / profile.track.totalDistanceKm * (RIGHT - LEFT);
  const range = profile.maximum - profile.minimum;
  const y = range ? BOTTOM - (point.elevationMeters - profile.minimum) / range * (BOTTOM - TOP) : (TOP + BOTTOM) / 2;
  return { x, y };
}

export function renderElevationProfile(profile) {
  const sections = [];
  let section = [];
  let previous;
  for (const point of profile.track.points) {
    if (!Number.isFinite(point.elevationMeters) || (previous && point.segmentIndex !== previous.segmentIndex)) {
      if (section.length) sections.push(section);
      section = [];
    }
    if (Number.isFinite(point.elevationMeters)) section.push(coordinates(profile, point));
    previous = point;
  }
  if (section.length) sections.push(section);
  const lines = sections.map((points) => points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' '));
  const areas = sections.map((points, index) => `${lines[index]} L${points[points.length - 1].x.toFixed(2)},${BOTTOM} L${points[0].x.toFixed(2)},${BOTTOM} Z`);
  const poiDots = profile.pois.map(({ point }, index) => {
    if (!Number.isFinite(point.elevationMeters)) return '';
    const { x, y } = coordinates(profile, point);
    return `<circle class="elevation-poi-dot" data-elevation-dot="${index}" cx="${x}" cy="${y}" r="4" aria-hidden="true"/>`;
  }).join('');
  const isCollapsed = readCollapsedState();
  return `
    <h3 class="elevation-heading">
      <button type="button" class="elevation-toggle" data-elevation-toggle aria-expanded="${!isCollapsed}" aria-controls="elevation-content">
        <span class="elevation-title">Höhenprofil</span>
        <span class="elevation-summary">↗ ${integer.format(profile.ascent)} hm${profile.incomplete ? ' (unvollständig)' : ''} · max. ${integer.format(profile.maximum)} m</span>
        <span class="elevation-chevron" aria-hidden="true">▸</span>
      </button>
    </h3>
    <div id="elevation-content" class="elevation-content" data-elevation-content${isCollapsed ? ' hidden' : ''}>
    <div class="elevation-chart" data-elevation-chart>
      <span class="elevation-badge" data-elevation-badge hidden></span>
      <div class="elevation-poi-card" data-elevation-poi-card role="dialog" aria-label="POI-Information" hidden>
        <button class="elevation-poi-close" data-elevation-poi-close type="button" aria-label="POI-Information schließen">×</button>
        <strong data-poi-title></strong>
        <span data-poi-position></span>
        <span data-poi-description hidden></span>
        <a class="poi-navigation" data-poi-navigation target="_blank" rel="noopener noreferrer">Dorthin navigieren</a>
      </div>
      <div class="elevation-plot">
      <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="slider" tabindex="0" data-elevation-slider
        aria-label="Streckenfortschritt im Höhenprofil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <defs><linearGradient id="elevation-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="100%" stop-color="var(--accent)" stop-opacity=".02"/></linearGradient></defs>
        <line class="elevation-grid" x1="${LEFT}" x2="${RIGHT}" y1="${TOP}" y2="${TOP}"/>
        <line class="elevation-grid" x1="${LEFT}" x2="${RIGHT}" y1="${BOTTOM}" y2="${BOTTOM}"/>
        <text class="elevation-axis" x="0" y="${TOP + 4}">${integer.format(profile.maximum)} m</text>
        <text class="elevation-axis" x="0" y="${BOTTOM + 4}">${integer.format(profile.minimum)} m</text>
        ${areas.map((path) => `<path fill="url(#elevation-fill)" d="${path}"/>`).join('')}
        ${lines.map((path) => `<path class="elevation-curve" d="${path}"/>`).join('')}
        ${poiDots}
        <line class="elevation-guide" data-elevation-guide x1="${LEFT}" x2="${LEFT}" y1="${TOP}" y2="${BOTTOM}" visibility="hidden"/>
        <text class="elevation-axis" x="${LEFT}" y="222">0 km</text>
        <text class="elevation-axis" text-anchor="end" x="${RIGHT}" y="222">${decimal.format(profile.track.totalDistanceKm)} km</text>
      </svg>
      ${profile.pois.map(({ waypoint, point }, index) => {
        if (!Number.isFinite(point.elevationMeters)) return '';
        const { x, y } = coordinates(profile, point);
        return `<button type="button" class="elevation-poi-pin" data-elevation-poi="${index}"
          style="left:${x / WIDTH * 100}%;top:${y / HEIGHT * 100}%"
          aria-label="${escapeHtml(cleanPoiName(waypoint.name))} anzeigen"><span class="visually-hidden">${escapeHtml(cleanPoiName(waypoint.name))}</span></button>`;
      }).join('')}
      </div>
    </div>
    ${profile.pois.some(({ point }) => !Number.isFinite(point.elevationMeters)) ? `
      <div class="elevation-missing-pois">Höhe am nächsten Trackpunkt nicht verfügbar:
        ${profile.pois.map(({ waypoint, point }, index) => Number.isFinite(point.elevationMeters) ? ''
    : `<button type="button" data-elevation-poi="${index}">${escapeHtml(cleanPoiName(waypoint.name))}</button>`).join(' ')}
      </div>` : ''}
    </div>
  `;
}

export function bindElevationProfile(container, profile, setLivePosition, setHighlightedWaypoint, onPoiChange = () => {}) {
  const toggle = container.querySelector('[data-elevation-toggle]');
  const content = container.querySelector('[data-elevation-content]');
  const chart = container.querySelector('[data-elevation-chart]');
  const svg = chart.querySelector('svg');
  const slider = chart.querySelector('[data-elevation-slider]');
  const guide = chart.querySelector('[data-elevation-guide]');
  const badge = chart.querySelector('[data-elevation-badge]');
  const card = container.querySelector('[data-elevation-poi-card]');
  const title = card.querySelector('[data-poi-title]');
  const position = card.querySelector('[data-poi-position]');
  const description = card.querySelector('[data-poi-description]');
  const navigation = card.querySelector('[data-poi-navigation]');
  const closeButton = card.querySelector('[data-elevation-poi-close]');
  let activePoi = null;
  let activePoiPinned = false;
  let pinnedPoi = null;

  function showPoi(poi) {
    container.querySelectorAll('[data-elevation-poi]').forEach((button) => {
      button.classList.toggle('is-active', poi === profile.pois[Number(button.dataset.elevationPoi)]);
    });
    chart.querySelectorAll('[data-elevation-dot]').forEach((dot) => {
      dot.classList.toggle('is-active', poi === profile.pois[Number(dot.dataset.elevationDot)]);
    });
    card.hidden = !poi;
    setHighlightedWaypoint(poi?.waypoint ?? null);
    if (!poi) {
      const hadActivePoi = Boolean(activePoi);
      activePoi = null;
      activePoiPinned = false;
      chart.classList.remove('has-poi');
      chart.style.removeProperty('--elevation-poi-space');
      if (hadActivePoi) onPoiChange(null, { pinned: false });
      return;
    }

    const index = profile.pois.indexOf(poi);
    const { x } = coordinates(profile, poi.point);
    card.dataset.align = x / WIDTH < 0.25 ? 'left' : x / WIDTH > 0.75 ? 'right' : 'center';
    title.textContent = cleanPoiName(poi.waypoint.name);
    position.textContent = formatPoiSummary(poi.waypoint, index, poi.point);
    const editorialDescription = editorialPoiDescription(poi.waypoint);
    description.hidden = !editorialDescription;
    description.textContent = editorialDescription;
    navigation.dataset.navigationLat = String(poi.waypoint.latitude);
    navigation.dataset.navigationLon = String(poi.waypoint.longitude);
    navigation.href = directionsUrl(poi.waypoint.latitude, poi.waypoint.longitude);
    chart.classList.add('has-poi');
    chart.style.setProperty('--elevation-poi-space', `${card.offsetHeight + 37}px`);
    const chartWidth = chart.clientWidth;
    const cardWidth = card.offsetWidth;
    const maximumLeft = Math.max(0, chartWidth - cardWidth);
    card.style.left = `${Math.max(0, Math.min(maximumLeft, x / WIDTH * chartWidth - cardWidth / 2))}px`;
    const isPinned = pinnedPoi === poi;
    const changed = activePoi !== poi || activePoiPinned !== isPinned;
    activePoi = poi;
    activePoiPinned = isPinned;
    if (changed) onPoiChange(poi, { pinned: isPinned });
  }

  function update(progress, selectedPoi = null, pin = false, snap = true) {
    const nearest = selectedPoi ?? (snap ? profile.pois.reduce((best, poi) => {
      const distance = Math.abs(poi.point.distanceKm - progress * profile.track.totalDistanceKm);
      return distance <= profile.track.totalDistanceKm * 0.025 && (!best || distance < best.distance)
        ? { poi, distance } : best;
    }, null)?.poi ?? null : null);
    if (pinnedPoi && !pin && nearest !== pinnedPoi) return;
    if (pin && nearest) pinnedPoi = nearest;
    else if (pinnedPoi && nearest !== pinnedPoi) pinnedPoi = null;

    const poi = nearest;
    const poiProgress = poi ? poi.point.distanceKm / profile.track.totalDistanceKm : progress;
    const sample = poi ? { ...poi.point, progress: poiProgress } : sampleRouteTrack(profile.track, progress);
    const x = LEFT + sample.progress * (RIGHT - LEFT);
    const height = Number.isFinite(sample.elevationMeters) ? `${integer.format(sample.elevationMeters)} m` : 'Höhe n/v';
    const text = `${decimal.format(sample.distanceKm)} km · ${height}`;
    guide.setAttribute('x1', x);
    guide.setAttribute('x2', x);
    guide.setAttribute('visibility', 'visible');
    badge.textContent = text;
    badge.hidden = false;
    badge.style.left = `${Math.max(14, Math.min(86, x / WIDTH * 100))}%`;
    slider.setAttribute('aria-valuenow', String(Math.round(sample.progress * 100)));
    slider.setAttribute('aria-valuetext', text);
    setLivePosition(sample);
    showPoi(poi);
  }

  function updateFromX(clientX, target, pin = false) {
    const bounds = svg.getBoundingClientRect();
    const button = target.closest('[data-elevation-poi]');
    const poi = button ? profile.pois[Number(button.dataset.elevationPoi)] : null;
    if (poi) update(poi.point.distanceKm / profile.track.totalDistanceKm, poi, pin);
    else if (bounds.width) update(((clientX - bounds.left) / bounds.width * WIDTH - LEFT) / (RIGHT - LEFT), null, pin);
  }

  function reset(force = false) {
    if (pinnedPoi && !force) return;
    pinnedPoi = null;
    guide.setAttribute('visibility', 'hidden');
    badge.hidden = true;
    setLivePosition(null);
    showPoi(null);
  }

  function selectPoi(poi) {
    update(poi.point.distanceKm / profile.track.totalDistanceKm, poi, true);
  }

  function clearSelection() {
    reset(true);
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
    saveCollapsedState(expanded);
    if (expanded) reset(true);
    else if (activePoi) showPoi(activePoi);
  });
  closeButton.addEventListener('click', clearSelection);

  chart.addEventListener('pointermove', (event) => updateFromX(event.clientX, event.target));
  chart.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && chart.setPointerCapture) chart.setPointerCapture(event.pointerId);
    updateFromX(event.clientX, event.target);
  });
  chart.addEventListener('pointerup', (event) => {
    if (!card.contains(event.target)) updateFromX(event.clientX, event.target, true);
  });
  container.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') reset(); });
  chart.addEventListener('pointercancel', reset);
  chart.addEventListener('touchmove', (event) => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (event.touches[0]) {
      event.preventDefault();
      updateFromX(event.touches[0].clientX, chart);
    }
  }, { passive: false });
  chart.addEventListener('touchcancel', reset);
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-elevation-poi]');
    if (!button) return;
    const poi = profile.pois[Number(button.dataset.elevationPoi)];
    selectPoi(poi);
  });
  container.addEventListener('focusin', (event) => {
    const button = event.target.closest('[data-elevation-poi]');
    if (!button) return;
    const poi = profile.pois[Number(button.dataset.elevationPoi)];
    update(poi.point.distanceKm / profile.track.totalDistanceKm, poi);
  });
  container.addEventListener('focusout', (event) => {
    if (!container.contains(event.relatedTarget)) reset();
  });
  slider.addEventListener('keydown', (event) => {
    const current = Number(slider.getAttribute('aria-valuenow')) / 100;
    const step = event.shiftKey ? 0.1 : 0.01;
    let next;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 1;
    else return;
    event.preventDefault();
    update(next);
  });

  return {
    preview(progress, poi = null, snap = true) {
      update(progress, poi, false, snap);
    },
    selectPoi,
    clearSelection,
  };
}
