import { escapeHtml } from './html.js';
import { gpxDownload } from './gpx-download.js';

function parseGpx(gpxText) {
  const xml = new DOMParser().parseFromString(gpxText, 'application/xml');
  if (xml.querySelector('parsererror')) {
    throw new Error('Die Tages-GPX-Datei ist kein gültiges XML.');
  }

  const waypoints = [...xml.getElementsByTagNameNS('*', 'wpt')];
  const points = waypoints
    .map((point) => {
      const description = point.getElementsByTagNameNS('*', 'desc')[0]?.textContent ?? '';
      const group = description.match(/\/\s*(D\d{2}[a-z]*)\s*\/\s*(MOTORRAD|PKW|ALT|OPTION|FAEHRE)\s*\//);
      return {
        latitude: Number(point.getAttribute('lat')),
        longitude: Number(point.getAttribute('lon')),
        name: point.getElementsByTagNameNS('*', 'name')[0]?.textContent?.trim() ?? 'V7-Wegpunkt',
        routeGroup: group?.[1] ?? '',
        type: group?.[2] ?? '',
      };
    })
    .filter((point) => Number.isFinite(point.latitude)
      && Number.isFinite(point.longitude)
      && /^D\d{2}/.test(point.routeGroup));
  const segments = [...xml.getElementsByTagNameNS('*', 'trkseg')]
    .map((segment) => [...segment.getElementsByTagNameNS('*', 'trkpt')].map((point) => {
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      if (lat === null || lon === null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))
        || Math.abs(Number(lat)) > 90 || Math.abs(Number(lon)) > 180) {
        throw new Error('Ungültiger Trackpunkt in der Tages-GPX-Datei.');
      }
      return [Number(lat), Number(lon)];
    }))
    .filter((segment) => segment.length > 1);
  return { points, segments };
}

function waypointStyle(waypoint, active) {
  const colors = {
    MOTORRAD: '#82908a',
    PKW: '#b5c3bb',
    ALT: '#76b7a3',
    OPTION: '#d98bc7',
    FAEHRE: '#7fc8e8',
  };
  const primary = waypoint.type === 'MOTORRAD' || waypoint.type === 'PKW';
  return {
    radius: waypoint.type === 'FAEHRE' ? 6 : 4,
    color: '#101513',
    weight: 1.5,
    fillColor: active && primary ? '#f0a94c' : (colors[waypoint.type] ?? '#82908a'),
    fillOpacity: active ? 0.95 : 0.75,
  };
}

function dayIcon(L, day, active) {
  return L.divIcon({
    className: `day-map-pin${active ? ' is-active' : ''}`,
    html: `<span>${String(day.frontmatter.tag).padStart(2, '0')}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function createRoadbookMap(L, days, statusElement, downloadElement) {
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true,
  });
  const markerLayer = L.layerGroup().addTo(map);
  const dayMarkers = [];
  const dayBounds = [];
  const waypointLayers = [];
  const trackLayers = [];
  const dayGpx = [];
  let activeIndex = 0;

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
    dayGpx.push({ state: 'loading', points: [], segments: [] });
    trackLayers.push([]);
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

    fetch(`${import.meta.env.BASE_URL}${frontmatter.gpx_datei}`).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    }).then((text) => {
      const { points, segments } = parseGpx(text);
      dayGpx[index] = { state: 'loaded', points, segments };
      segments.forEach((segment) => {
        const layer = L.polyline(segment).addTo(map);
        trackLayers[index].push(layer);
        bounds.extend(layer.getBounds());
      });
      points.forEach((waypoint) => {
        const layer = L.circleMarker([waypoint.latitude, waypoint.longitude], waypointStyle(waypoint, index === activeIndex))
          .addTo(markerLayer)
          .bindTooltip(`${escapeHtml(waypoint.name)} · ${escapeHtml(waypoint.routeGroup)}`)
          .on('click', () => map.fire('roadbook:select-day', { index }));
        waypointLayers.push({ layer, waypoint, dayIndex: index });
        bounds.extend([waypoint.latitude, waypoint.longitude]);
      });
      selectDay(activeIndex, { moveMap: false });
    }).catch((error) => {
      console.error(`GPX-Datei für Tag ${frontmatter.tag} konnte nicht geladen werden.`, error);
      dayGpx[index].state = 'error';
      selectDay(activeIndex, { moveMap: false });
    });
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
    activeIndex = index;
    const day = days[index];
    const bounds = L.latLngBounds(dayBounds[index].getSouthWest(), dayBounds[index].getNorthEast());

    waypointLayers.forEach(({ layer, waypoint, dayIndex }) => {
      layer.setStyle(waypointStyle(waypoint, dayIndex === index));
    });
    trackLayers.forEach((layers, dayIndex) => {
      layers.forEach((layer) => layer.setStyle({
        color: dayIndex === index ? '#f0a94c' : '#82908a',
        weight: dayIndex === index ? 5 : 3,
        opacity: dayIndex === index ? 0.95 : 0.55,
      }));
    });

    dayMarkers.forEach(({ marker, dayIndex }) => {
      marker.setIcon(dayIcon(L, days[dayIndex], dayIndex === index));
    });

    const gpx = dayGpx[index];
    const download = gpxDownload(day, gpx, import.meta.env.BASE_URL);
    downloadElement.hidden = !download;
    if (download) {
      downloadElement.href = download.href;
      downloadElement.download = download.filename;
    }
    const dayWaypoints = gpx.points;
    const routeGroups = [...new Set(dayWaypoints.map((waypoint) => waypoint.routeGroup))];
    const dayLabel = `Tag ${String(day.frontmatter.tag).padStart(2, '0')}`;
    statusElement.textContent = gpx.state === 'loading'
      ? `${dayLabel}: GPX-Daten werden geladen.`
      : gpx.state === 'missing' || gpx.state === 'error'
        ? `${dayLabel}: Tages-GPX konnte nicht geladen werden.`
        : gpx.segments.length
      ? `${dayLabel}: OSRM-PKW-Vorab-Track und ${dayWaypoints.length} V7-Wegpunkte (${routeGroups.join(', ')}). Nicht vor Ort geprüft.`
      : day.frontmatter.tag === 19
        ? `${dayLabel}: Seetag ohne Straßenroute; nur Hafenmarker, keine Linie über See.`
        : `${dayLabel}: Kein Straßen-Track verfügbar; angezeigte Wegpunkte und Streckenführung prüfen.`;

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
