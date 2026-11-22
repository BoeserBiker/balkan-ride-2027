const EARTH_RADIUS_KM = 6371.0088;
const VIEWBOX_WIDTH = 420;
const VIEWBOX_HEIGHT = 184;
const PLOT = { left: 42, right: 412, top: 18, bottom: 140 };

function distanceBetween(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolateMissingElevations(points) {
  const knownIndexes = points
    .map((point, index) => Number.isFinite(point.elevationMeters) ? index : -1)
    .filter((index) => index >= 0);
  if (!knownIndexes.length) {
    return false;
  }

  let nextKnownPosition = 0;
  points.forEach((point, index) => {
    if (Number.isFinite(point.elevationMeters)) {
      nextKnownPosition += 1;
      return;
    }
    while (knownIndexes[nextKnownPosition] < index) {
      nextKnownPosition += 1;
    }
    const beforeIndex = knownIndexes[nextKnownPosition - 1];
    const afterIndex = knownIndexes[nextKnownPosition];
    if (beforeIndex === undefined) {
      point.elevationMeters = points[afterIndex].elevationMeters;
    } else if (afterIndex === undefined) {
      point.elevationMeters = points[beforeIndex].elevationMeters;
    } else {
      const before = points[beforeIndex];
      const after = points[afterIndex];
      const span = after.distanceKm - before.distanceKm;
      const progress = span > 0 ? (point.distanceKm - before.distanceKm) / span : 0;
      point.elevationMeters = before.elevationMeters
        + (after.elevationMeters - before.elevationMeters) * progress;
    }
  });
  return true;
}

export function buildElevationProfile(segments, estimatedAscentMeters) {
  const points = [];
  let distanceKm = 0;

  segments.forEach((segment, segmentIndex) => {
    let previous;
    segment.forEach(([latitude, longitude, elevation]) => {
      const point = {
        latitude,
        longitude,
        elevationMeters: Number.isFinite(elevation) ? elevation : null,
        distanceKm,
        segmentIndex,
        breakBefore: !previous && points.length > 0,
      };
      if (previous) {
        distanceKm += distanceBetween(previous, point);
        point.distanceKm = distanceKm;
      }
      points.push(point);
      previous = point;
    });
  });

  if (points.length < 2 || distanceKm <= 0) {
    return null;
  }

  const hasMissingElevations = points.some((point) => !Number.isFinite(point.elevationMeters));
  let elevationMode;
  if (interpolateMissingElevations(points)) {
    elevationMode = hasMissingElevations ? 'interpolated' : 'gpx';
  } else {
    const estimatedAscent = Number(estimatedAscentMeters);
    if (Number.isFinite(estimatedAscent) && estimatedAscent >= 0) {
      points.forEach((point) => {
        point.elevationMeters = estimatedAscent * point.distanceKm / distanceKm;
      });
      elevationMode = 'estimated-gain';
    } else {
      elevationMode = 'missing';
    }
  }

  const elevations = points
    .map((point) => point.elevationMeters)
    .filter(Number.isFinite);
  return {
    points,
    totalDistanceKm: distanceKm,
    elevationMode,
    minimumElevation: elevations.length ? Math.min(...elevations) : null,
    maximumElevation: elevations.length ? Math.max(...elevations) : null,
  };
}

export function sampleElevationProfile(profile, progress) {
  const fraction = Math.min(1, Math.max(0, progress));
  const targetDistance = profile.totalDistanceKm * fraction;
  const points = profile.points;
  let upperIndex = points.findIndex((point) => point.distanceKm >= targetDistance);
  if (upperIndex < 0) {
    upperIndex = points.length - 1;
  }
  if (upperIndex === 0) {
    upperIndex = 1;
  }

  const before = points[upperIndex - 1];
  const after = points[upperIndex];
  const span = after.distanceKm - before.distanceKm;
  const segmentProgress = span > 0 ? (targetDistance - before.distanceKm) / span : 0;
  const interpolate = (first, second) => first + (second - first) * segmentProgress;
  const sameSegment = before.segmentIndex === after.segmentIndex;

  return {
    latitude: sameSegment ? interpolate(before.latitude, after.latitude) : after.latitude,
    longitude: sameSegment ? interpolate(before.longitude, after.longitude) : after.longitude,
    elevationMeters: Number.isFinite(before.elevationMeters) && Number.isFinite(after.elevationMeters)
      ? interpolate(before.elevationMeters, after.elevationMeters)
      : null,
    distanceKm: targetDistance,
    progress: fraction,
  };
}

function chartY(profile, elevationMeters) {
  if (!Number.isFinite(elevationMeters)
    || profile.minimumElevation === profile.maximumElevation) {
    return (PLOT.top + PLOT.bottom) / 2;
  }
  return PLOT.bottom - (
    (elevationMeters - profile.minimumElevation)
    / (profile.maximumElevation - profile.minimumElevation)
  ) * (PLOT.bottom - PLOT.top);
}

export function renderElevationProfile(profile) {
  if (!profile || profile.points.length < 2) {
    return '<p class="muted-copy">Für diese Etappe ist kein Straßen-Track verfügbar.</p>';
  }

  const path = profile.points.map((point, index) => {
    const x = PLOT.left + point.distanceKm / profile.totalDistanceKm * (PLOT.right - PLOT.left);
    const y = chartY(profile, point.elevationMeters);
    return `${index === 0 || point.breakBefore ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const elevationLabel = profile.elevationMode === 'estimated-gain'
    ? 'Kumulierte Tageshöhenmeter, gleichmäßig interpoliert (Schätzwert)'
    : profile.elevationMode === 'missing'
      ? 'Keine Höhenwerte in der GPX-Datei'
      : profile.elevationMode === 'interpolated'
        ? 'Fehlende GPX-Höhenwerte wurden interpoliert'
        : 'Höhenwerte aus GPX';
  const minimumLabel = Number.isFinite(profile.minimumElevation)
    ? `${Math.round(profile.minimumElevation)} m`
    : '–';
  const maximumLabel = Number.isFinite(profile.maximumElevation)
    ? `${Math.round(profile.maximumElevation)} m`
    : '–';

  return `
    <div class="elevation-scrubber" data-elevation-scrubber role="slider" tabindex="0"
      aria-label="Streckenfortschritt auf dem Höhenprofil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <svg class="elevation-chart" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" aria-hidden="true" focusable="false">
        <line class="elevation-gridline" x1="${PLOT.left}" y1="${PLOT.top}" x2="${PLOT.right}" y2="${PLOT.top}" />
        <line class="elevation-gridline" x1="${PLOT.left}" y1="${PLOT.bottom}" x2="${PLOT.right}" y2="${PLOT.bottom}" />
        <text class="elevation-axis-label" x="2" y="${PLOT.top + 4}">${maximumLabel}</text>
        <text class="elevation-axis-label" x="2" y="${PLOT.bottom + 4}">${minimumLabel}</text>
        <path class="elevation-line" d="${path}" />
        <line class="elevation-cursor" data-profile-cursor x1="${PLOT.left}" y1="${PLOT.top}" x2="${PLOT.left}" y2="${PLOT.bottom}" visibility="hidden" />
        <circle class="elevation-cursor-point" data-profile-point cx="${PLOT.left}" cy="${chartY(profile, profile.points[0].elevationMeters)}" r="5" visibility="hidden" />
        <g class="elevation-tooltip" data-profile-tooltip visibility="hidden">
          <rect x="0" y="0" width="154" height="43" rx="4" />
          <text data-profile-distance x="9" y="17"></text>
          <text data-profile-elevation x="9" y="34"></text>
        </g>
      </svg>
      <div class="elevation-distance-labels"><span>0 km</span><span>${profile.totalDistanceKm.toFixed(1)} km</span></div>
      <p class="elevation-note">${elevationLabel}</p>
    </div>
  `;
}

export function bindElevationScrubber(container, profile, setLivePosition) {
  const svg = container.querySelector('.elevation-chart');
  const cursor = svg.querySelector('[data-profile-cursor]');
  const cursorPoint = svg.querySelector('[data-profile-point]');
  const tooltip = svg.querySelector('[data-profile-tooltip]');
  const distanceLabel = svg.querySelector('[data-profile-distance]');
  const elevationLabel = svg.querySelector('[data-profile-elevation]');

  function updateProgress(progress) {
    progress = Math.min(1, Math.max(0, progress));
    const sample = sampleElevationProfile(profile, progress);
    const x = PLOT.left + progress * (PLOT.right - PLOT.left);
    const y = chartY(profile, sample.elevationMeters);
    const tooltipX = Math.min(VIEWBOX_WIDTH - 160, Math.max(0, x - 77));
    const tooltipY = Math.max(0, y - 52);

    cursor.setAttribute('x1', x);
    cursor.setAttribute('x2', x);
    cursor.setAttribute('visibility', 'visible');
    cursorPoint.setAttribute('cx', x);
    cursorPoint.setAttribute('cy', y);
    cursorPoint.setAttribute('visibility', 'visible');
    tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
    tooltip.setAttribute('visibility', 'visible');
    distanceLabel.textContent = `${sample.distanceKm.toFixed(1)} km`;
    const heightText = profile.elevationMode === 'estimated-gain'
      ? `+${Math.round(sample.elevationMeters)} hm geschätzt`
      : Number.isFinite(sample.elevationMeters) ? `${Math.round(sample.elevationMeters)} m` : 'Höhe n/v';
    elevationLabel.textContent = heightText;
    container.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    container.setAttribute('aria-valuetext', `${sample.distanceKm.toFixed(1)} Kilometer; ${heightText}`);
    setLivePosition(sample);
  }

  function update(clientX) {
    const bounds = svg.getBoundingClientRect();
    if (!bounds.width) {
      return;
    }
    const svgX = (clientX - bounds.left) / bounds.width * VIEWBOX_WIDTH;
    updateProgress((svgX - PLOT.left) / (PLOT.right - PLOT.left));
  }

  function hide() {
    cursor.setAttribute('visibility', 'hidden');
    cursorPoint.setAttribute('visibility', 'hidden');
    tooltip.setAttribute('visibility', 'hidden');
    setLivePosition(null);
  }

  container.addEventListener('pointermove', (event) => update(event.clientX));
  container.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && container.setPointerCapture) {
      container.setPointerCapture(event.pointerId);
    }
    update(event.clientX);
  });
  container.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') {
      hide();
    }
  });
  container.addEventListener('pointerup', hide);
  container.addEventListener('pointercancel', hide);
  container.addEventListener('keydown', (event) => {
    const currentProgress = Number(container.getAttribute('aria-valuenow')) / 100;
    const step = event.shiftKey ? 0.1 : 0.01;
    let nextProgress;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextProgress = currentProgress - step;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextProgress = currentProgress + step;
    } else if (event.key === 'Home') {
      nextProgress = 0;
    } else if (event.key === 'End') {
      nextProgress = 1;
    } else {
      return;
    }
    event.preventDefault();
    updateProgress(nextProgress);
  });
  container.addEventListener('blur', hide);
  container.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) {
      event.preventDefault();
      update(touch.clientX);
    }
  }, { passive: false });
  container.addEventListener('touchend', hide);
  container.addEventListener('touchcancel', hide);
}
