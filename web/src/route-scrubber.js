const EARTH_RADIUS_KM = 6371.0088;

function distanceBetween(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function buildRouteTrack(segments) {
  const points = [];
  let totalDistanceKm = 0;
  segments.forEach((segment, segmentIndex) => {
    let previous;
    segment.forEach(([latitude, longitude, elevation]) => {
      const point = {
        latitude, longitude, elevationMeters: Number.isFinite(elevation) ? elevation : null,
        distanceKm: totalDistanceKm, segmentIndex,
      };
      if (previous) {
        totalDistanceKm += distanceBetween(previous, point);
        point.distanceKm = totalDistanceKm;
      }
      points.push(point);
      previous = point;
    });
  });
  return points.length >= 2 && totalDistanceKm > 0 ? { points, totalDistanceKm } : null;
}

export function sampleRouteTrack(track, progress) {
  const fraction = Math.min(1, Math.max(0, progress));
  const distanceKm = fraction * track.totalDistanceKm;
  if (fraction === 0 || fraction === 1) {
    const point = track.points[fraction === 0 ? 0 : track.points.length - 1];
    return {
      latitude: point.latitude, longitude: point.longitude, elevationMeters: point.elevationMeters,
      distanceKm, progress: fraction,
    };
  }
  const upperIndex = track.points.findIndex((point) => point.distanceKm >= distanceKm);
  const before = track.points[upperIndex - 1];
  const after = track.points[upperIndex];
  const span = after.distanceKm - before.distanceKm;
  const part = span > 0 ? (distanceKm - before.distanceKm) / span : 0;
  return {
    latitude: before.latitude + (after.latitude - before.latitude) * part,
    longitude: before.longitude + (after.longitude - before.longitude) * part,
    elevationMeters: Number.isFinite(before.elevationMeters) && Number.isFinite(after.elevationMeters)
      ? before.elevationMeters + (after.elevationMeters - before.elevationMeters) * part
      : null,
    distanceKm,
    progress: fraction,
  };
}

export function bindRouteScrubber(control, track, setLivePosition) {
  const label = control.querySelector('[data-route-distance]');
  const distanceFormatter = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  function update(progress) {
    const sample = sampleRouteTrack(track, progress);
    const distance = `${distanceFormatter.format(sample.distanceKm)} km`;
    control.style.setProperty('--route-progress', `${sample.progress * 100}%`);
    control.classList.add('is-active');
    control.setAttribute('aria-valuenow', String(Math.round(sample.progress * 100)));
    control.setAttribute('aria-valuetext', distance);
    label.textContent = distance;
    setLivePosition(sample);
  }

  function updateFromX(clientX) {
    const bounds = control.getBoundingClientRect();
    if (bounds.width > 0) {
      update((clientX - bounds.left) / bounds.width);
    }
  }

  function reset() {
    control.classList.remove('is-active');
    control.style.removeProperty('--route-progress');
    control.setAttribute('aria-valuenow', '0');
    control.removeAttribute('aria-valuetext');
    label.textContent = '';
    setLivePosition(null);
  }

  control.disabled = false;
  control.setAttribute('aria-label', 'Streckenfortschritt auf der Karte anzeigen');
  control.addEventListener('pointermove', (event) => updateFromX(event.clientX));
  control.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && control.setPointerCapture) {
      control.setPointerCapture(event.pointerId);
    }
    updateFromX(event.clientX);
  });
  control.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') reset();
  });
  control.addEventListener('pointerup', reset);
  control.addEventListener('pointercancel', reset);
  control.addEventListener('touchmove', (event) => {
    if (event.touches[0]) {
      event.preventDefault();
      updateFromX(event.touches[0].clientX);
    }
  }, { passive: false });
  control.addEventListener('touchend', reset);
  control.addEventListener('touchcancel', reset);
  control.addEventListener('blur', reset);
  control.addEventListener('keydown', (event) => {
    const current = Number(control.getAttribute('aria-valuenow')) / 100;
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
