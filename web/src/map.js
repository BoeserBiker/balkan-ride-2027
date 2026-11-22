const GPX_ASSETS = import.meta.glob('../../assets/gpx/*.gpx', {
  eager: true,
  query: '?raw',
  import: 'default',
});
import { escapeHtml } from './html.js';

function assetPathMap(assets) {
  return Object.fromEntries(
    Object.entries(assets).map(([source, value]) => [source.replace('../../', ''), value]),
  );
}

function parseTrack(gpxText) {
  const xml = new DOMParser().parseFromString(gpxText, 'application/xml');
  if (xml.querySelector('parsererror')) {
    return [];
  }

  return [...xml.querySelectorAll('trkpt, rtept')]
    .map((point) => [Number(point.getAttribute('lat')), Number(point.getAttribute('lon'))])
    .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));
}

function dayIcon(L, day, active) {
  return L.divIcon({
    className: `day-map-pin${active ? ' is-active' : ''}`,
    html: `<span>${String(day.frontmatter.tag).padStart(2, '0')}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function createRoadbookMap(L, days, statusElement) {
  const gpxByPath = assetPathMap(GPX_ASSETS);
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true,
  });
  const markerLayer = L.layerGroup().addTo(map);
  const dayMarkers = [];
  const trackLayers = [];
  const dayBounds = [];

  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  days.forEach((day, index) => {
    const { frontmatter } = day;
    const start = frontmatter.koordinaten_start;
    const finish = frontmatter.koordinaten_ziel;
    const bounds = L.latLngBounds([start, finish]);
    dayBounds.push(bounds);

    const startMarker = L.marker(start, {
      icon: dayIcon(L, day, index === 0),
      title: `Tag ${String(frontmatter.tag).padStart(2, '0')}: Start ${frontmatter.start}`,
      keyboard: true,
    })
      .addTo(markerLayer)
      .on('click', () => map.fire('roadbook:select-day', { index }));
    dayMarkers.push({ marker: startMarker, dayIndex: index });

    L.circleMarker(finish, {
      radius: 8,
      color: '#101513',
      weight: 3,
      fillColor: '#f0a94c',
      fillOpacity: 1,
      title: `Ziel: ${frontmatter.ziel}`,
    })
      .addTo(markerLayer)
      .bindTooltip(`Ziel · ${escapeHtml(frontmatter.ziel)}`)
      .on('click', () => map.fire('roadbook:select-day', { index }));

    const trackPath = frontmatter.gpx_datei;
    const trackPoints = parseTrack(gpxByPath[trackPath] ?? '');
    const trackLayer = trackPoints.length > 1
      ? L.polyline(trackPoints, {
        color: index === 0 ? '#f0a94c' : '#82908a',
        weight: index === 0 ? 5 : 3,
        opacity: index === 0 ? 0.95 : 0.65,
      }).addTo(map)
      : null;

    if (trackLayer) {
      bounds.extend(trackLayer.getBounds());
    }
    trackLayers.push(trackLayer);
  });

  map.on('roadbook:select-day', (event) => {
    if (Number.isInteger(event.index)) {
      map.options.onSelectDay?.(event.index);
    }
  });

  const allBounds = L.latLngBounds([]);
  dayBounds.forEach((bounds) => allBounds.extend(bounds));
  if (allBounds.isValid()) {
    map.fitBounds(allBounds.pad(0.14), { animate: false });
  } else {
    map.setView([44.7, 20.5], 5);
  }

  function selectDay(index, { moveMap = true } = {}) {
    const day = days[index];
    const trackPath = day.frontmatter.gpx_datei;
    const trackPoints = parseTrack(gpxByPath[trackPath] ?? '');
    const bounds = L.latLngBounds(dayBounds[index].getSouthWest(), dayBounds[index].getNorthEast());

    if (trackLayers[index]) {
      trackLayers[index].setStyle({ color: '#f0a94c', weight: 5, opacity: 0.95 });
      bounds.extend(trackLayers[index].getBounds());
    }
    trackLayers.forEach((layer, layerIndex) => {
      if (layer && layerIndex !== index) {
        layer.setStyle({ color: '#82908a', weight: 3, opacity: 0.55 });
      }
    });

    dayMarkers.forEach(({ marker, dayIndex }) => {
      marker.setIcon(dayIcon(L, days[dayIndex], dayIndex === index));
    });

    statusElement.textContent = trackPoints.length > 1
      ? `Tag ${String(day.frontmatter.tag).padStart(2, '0')}: GPX-Track geladen.`
      : `Tag ${String(day.frontmatter.tag).padStart(2, '0')}: Kein GPX-Track vorhanden – angezeigt werden nur die verifizierten Start- und Zielpunkte.`;

    if (moveMap && bounds.isValid()) {
      const zoom = Math.min(map.getBoundsZoom(bounds.pad(0.22)), 11);
      map.flyTo(bounds.getCenter(), zoom, { duration: 0.8 });
    }
  }

  return {
    selectDay,
    resize() {
      map.invalidateSize();
    },
    setSelectHandler(handler) {
      map.options.onSelectDay = handler;
    },
  };
}
