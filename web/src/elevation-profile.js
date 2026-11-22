import { distanceBetween, sampleRouteTrack } from './route-scrubber.js';
import { escapeHtml } from './html.js';

const WIDTH = 420;
const LEFT = 48;
const RIGHT = 410;
const TOP = 16;
const BOTTOM = 132;
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const elevation = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 20 });

export function buildElevationProfile(track, waypoints = []) {
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
  const pois = waypoints.map((waypoint) => {
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
  return { track, minimum, maximum, ascent, incomplete: known.length !== track.points.length, pois };
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
  return `
    <div class="elevation-heading"><h3>Höhenprofil</h3><span>↗ ${integer.format(profile.ascent)} hm${profile.incomplete ? ' (unvollständig)' : ''}</span></div>
    <div class="elevation-chart" data-elevation-chart>
      <svg viewBox="0 0 ${WIDTH} 160" role="slider" tabindex="0" data-elevation-slider
        aria-label="Streckenfortschritt im Höhenprofil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <defs><linearGradient id="elevation-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0a94c" stop-opacity=".45"/><stop offset="100%" stop-color="#f0a94c" stop-opacity=".02"/></linearGradient></defs>
        <line class="elevation-grid" x1="${LEFT}" x2="${RIGHT}" y1="${TOP}" y2="${TOP}"/>
        <line class="elevation-grid" x1="${LEFT}" x2="${RIGHT}" y1="${BOTTOM}" y2="${BOTTOM}"/>
        <text class="elevation-axis" x="0" y="${TOP + 4}">${integer.format(profile.maximum)} m</text>
        <text class="elevation-axis" x="0" y="${BOTTOM + 4}">${integer.format(profile.minimum)} m</text>
        ${areas.map((path) => `<path fill="url(#elevation-fill)" d="${path}"/>`).join('')}
        ${lines.map((path) => `<path class="elevation-curve" d="${path}"/>`).join('')}
        <line class="elevation-guide" data-elevation-guide x1="${LEFT}" x2="${LEFT}" y1="${TOP}" y2="${BOTTOM}" visibility="hidden"/>
        <text class="elevation-axis" x="${LEFT}" y="153">0 km</text>
        <text class="elevation-axis" text-anchor="end" x="${RIGHT}" y="153">${decimal.format(profile.track.totalDistanceKm)} km</text>
      </svg>
      <span class="elevation-badge" data-elevation-badge hidden></span>
      ${profile.pois.map(({ waypoint, point }, index) => {
        if (!Number.isFinite(point.elevationMeters)) return '';
        const { x, y } = coordinates(profile, point);
        return `<button type="button" class="elevation-poi-pin" data-elevation-poi="${index}"
          style="left:${x / WIDTH * 100}%;top:${y / 160 * 100}%"
          aria-label="POI ${escapeHtml(waypoint.name)} anzeigen"><span aria-hidden="true"></span></button>`;
      }).join('')}
    </div>
    ${profile.pois.some(({ point }) => !Number.isFinite(point.elevationMeters)) ? `
      <div class="elevation-missing-pois">Höhe am nächsten Trackpunkt nicht verfügbar:
        ${profile.pois.map(({ waypoint, point }, index) => Number.isFinite(point.elevationMeters) ? ''
    : `<button type="button" data-elevation-poi="${index}">${escapeHtml(waypoint.name)}</button>`).join(' ')}
      </div>` : ''}
    <div class="elevation-poi-card" data-elevation-poi-card hidden aria-live="polite">
      <strong data-poi-title></strong>
      <span data-poi-description></span>
      <span data-poi-position></span>
    </div>
  `;
}

export function bindElevationProfile(container, profile, setLivePosition, setHighlightedWaypoint) {
  const chart = container.querySelector('[data-elevation-chart]');
  const svg = chart.querySelector('svg');
  const slider = chart.querySelector('[data-elevation-slider]');
  const guide = chart.querySelector('[data-elevation-guide]');
  const badge = chart.querySelector('[data-elevation-badge]');
  const card = container.querySelector('[data-elevation-poi-card]');
  const title = card.querySelector('[data-poi-title]');
  const description = card.querySelector('[data-poi-description]');
  const position = card.querySelector('[data-poi-position]');

  function showPoi(poi) {
    container.querySelectorAll('[data-elevation-poi]').forEach((button) => {
      button.classList.toggle('is-active', poi === profile.pois[Number(button.dataset.elevationPoi)]);
    });
    card.hidden = !poi;
    setHighlightedWaypoint(poi?.waypoint ?? null);
    if (!poi) return;
    title.textContent = poi.waypoint.name;
    description.textContent = [poi.waypoint.type, poi.waypoint.description].filter(Boolean).join(' · ');
    position.textContent = `${decimal.format(poi.point.distanceKm)} km · ${Number.isFinite(poi.point.elevationMeters)
      ? `${elevation.format(poi.point.elevationMeters)} m`
      : 'Höhe n/v'}`;
  }

  function update(progress, selectedPoi) {
    const sample = sampleRouteTrack(profile.track, progress);
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
    const nearest = selectedPoi ?? profile.pois.reduce((best, poi) => {
      const distance = Math.abs(poi.point.distanceKm - sample.distanceKm);
      return distance <= profile.track.totalDistanceKm * 0.025 && (!best || distance < best.distance)
        ? { poi, distance } : best;
    }, null)?.poi;
    showPoi(nearest);
  }

  function updateFromX(clientX, target) {
    const bounds = svg.getBoundingClientRect();
    const button = target.closest('[data-elevation-poi]');
    const poi = button ? profile.pois[Number(button.dataset.elevationPoi)] : undefined;
    if (poi) update(poi.point.distanceKm / profile.track.totalDistanceKm, poi);
    else if (bounds.width) update(((clientX - bounds.left) / bounds.width * WIDTH - LEFT) / (RIGHT - LEFT));
  }

  function reset() {
    guide.setAttribute('visibility', 'hidden');
    badge.hidden = true;
    setLivePosition(null);
    showPoi(null);
  }

  chart.addEventListener('pointermove', (event) => updateFromX(event.clientX, event.target));
  chart.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && chart.setPointerCapture) chart.setPointerCapture(event.pointerId);
    updateFromX(event.clientX, event.target);
  });
  chart.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') reset(); });
  chart.addEventListener('pointercancel', reset);
  chart.addEventListener('touchmove', (event) => {
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
    update(poi.point.distanceKm / profile.track.totalDistanceKm, poi);
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
}
