import { sampleRouteTrack } from './route-scrubber.js';

const WIDTH = 420;
const LEFT = 48;
const RIGHT = 410;
const TOP = 16;
const BOTTOM = 132;
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function buildElevationProfile(track) {
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
  return { track, minimum, maximum, ascent, incomplete: known.length !== track.points.length };
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
    <div class="elevation-chart" data-elevation-chart role="slider" tabindex="0"
      aria-label="Streckenfortschritt im Höhenprofil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <svg viewBox="0 0 ${WIDTH} 160" aria-hidden="true">
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
    </div>
  `;
}

export function bindElevationProfile(container, profile, setLivePosition) {
  const chart = container.querySelector('[data-elevation-chart]');
  const svg = chart.querySelector('svg');
  const guide = chart.querySelector('[data-elevation-guide]');
  const badge = chart.querySelector('[data-elevation-badge]');

  function update(progress) {
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
    chart.setAttribute('aria-valuenow', String(Math.round(sample.progress * 100)));
    chart.setAttribute('aria-valuetext', text);
    setLivePosition(sample);
  }

  function updateFromX(clientX) {
    const bounds = svg.getBoundingClientRect();
    if (bounds.width) update(((clientX - bounds.left) / bounds.width * WIDTH - LEFT) / (RIGHT - LEFT));
  }

  function reset() {
    guide.setAttribute('visibility', 'hidden');
    badge.hidden = true;
    setLivePosition(null);
  }

  chart.addEventListener('pointermove', (event) => updateFromX(event.clientX));
  chart.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && chart.setPointerCapture) chart.setPointerCapture(event.pointerId);
    updateFromX(event.clientX);
  });
  chart.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') reset(); });
  chart.addEventListener('pointerup', reset);
  chart.addEventListener('pointercancel', reset);
  chart.addEventListener('touchmove', (event) => {
    if (event.touches[0]) {
      event.preventDefault();
      updateFromX(event.touches[0].clientX);
    }
  }, { passive: false });
  chart.addEventListener('touchend', reset);
  chart.addEventListener('touchcancel', reset);
  chart.addEventListener('blur', reset);
  chart.addEventListener('keydown', (event) => {
    const current = Number(chart.getAttribute('aria-valuenow')) / 100;
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
