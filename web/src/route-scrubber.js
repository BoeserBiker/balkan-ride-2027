const EARTH_RADIUS_KM = 6371.0088;

export function distanceBetween(first, second) {
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
