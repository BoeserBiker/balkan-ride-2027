import { escapeHtml } from './html.js';
import { gpxDownload } from './gpx-download.js';
import { cleanPoiName } from './roadbook.js';

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
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      return {
        latitude: lat === null || !lat.trim() ? NaN : Number(lat),
        longitude: lon === null || !lon.trim() ? NaN : Number(lon),
        name: point.getElementsByTagNameNS('*', 'name')[0]?.textContent?.trim() ?? 'V7-Wegpunkt',
        description: description.trim(),
        routeGroup: group?.[1] ?? '',
        type: group?.[2] ?? '',
      };
    })
    .filter((point) => Number.isFinite(point.latitude)
      && Number.isFinite(point.longitude)
      && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180
      && /^D\d{2}/.test(point.routeGroup));
  const profileSegments = [...xml.getElementsByTagNameNS('*', 'trkseg')]
    .map((segment) => [...segment.getElementsByTagNameNS('*', 'trkpt')].map((point) => {
      const lat = point.getAttribute('lat');
      const lon = point.getAttribute('lon');
      if (lat === null || lon === null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))
        || Math.abs(Number(lat)) > 90 || Math.abs(Number(lon)) > 180) {
        throw new Error('Ungültiger Trackpunkt in der Tages-GPX-Datei.');
      }
      const elevationText = point.getElementsByTagNameNS('*', 'ele')[0]?.textContent?.trim();
      const elevation = elevationText ? Number(elevationText) : null;
      return [Number(lat), Number(lon), Number.isFinite(elevation) ? elevation : null];
    }))
    .filter((segment) => segment.length > 1);
  const segments = profileSegments.map((segment) => segment.map(([latitude, longitude]) => [latitude, longitude]));
  return { points, segments, profileSegments };
}

function mapColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    accent: read('--accent', '#f0a94c'),
    poiActive: read('--poi-active', '#f0a94c'),
    routeActive: read('--route-active', '#f0a94c'),
    routeMuted: read('--route-muted', '#82908a'),
    outline: read('--map-outline', '#101513'),
    markerHighlight: read('--marker-highlight', '#fff3d6'),
  };
}

function waypointStyle(waypoint, active) {
  const theme = mapColors();
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
    color: theme.outline,
    weight: 1.5,
    fillColor: active && primary ? theme.poiActive : (colors[waypoint.type] ?? '#82908a'),
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

export function formatDayMapLabel(day) {
  const { tag, start, ziel } = day.frontmatter;
  return `Tag ${tag} · ${start} → ${ziel}`;
}

export function ferryConnections(days, data) {
  return days.flatMap((day, index) => {
    const transport = /\*\*Transport:\*\*\s*([^\n]+)/.exec(day.body ?? '')?.[1] ?? '';
    const current = data[index];
    const before = data[index - 1];
    const after = data[index + 1];
    if (!/(?:^|[\s+])Fähre(?=$|[\s.,;+])/i.test(transport)
      || current?.state !== 'loaded' || current.profileSegments.length
      || before?.state !== 'loaded' || after?.state !== 'loaded'
      || !before.profileSegments.length || !after.profileSegments.length) return [];
    const lastSegment = before.profileSegments.at(-1);
    const firstSegment = after.profileSegments[0];
    return [[lastSegment.at(-1).slice(0, 2), firstSegment[0].slice(0, 2)]];
  });
}

// Grobe Orientierungslinie über das offene Wasser der Adria, damit die Fähre nicht quer über das Festland läuft.
// Kein Fahrplan und keine Seekarte; Start und Ende bleiben die Endpunkte der benachbarten GPX-Tracks.
const ADRIA_WAYPOINTS = [[40.15, 19.10], [41.80, 17.20], [43.30, 14.40], [44.40, 13.20], [45.30, 12.50]];

export function ferryRoute([start, end]) {
  const fromIgoumenitsa = Math.abs(start[0] - 39.49) < 0.3 && Math.abs(start[1] - 20.26) < 0.3;
  return fromIgoumenitsa && end[0] > 44.5 ? [start, ...ADRIA_WAYPOINTS, end] : [start, end];
}

export function tourFitOptions(mobile) {
  return { paddingTopLeft: [14, 14], paddingBottomRight: [14, mobile ? 34 : 14], animate: false };
}

export function createTourMap(L, days, statusElement) {
  // zoomSnap 0.25: fitBounds rastet sonst auf ganze Zoomstufen und lässt bis zur Hälfte der Karte leer.
  const map = L.map('tour-map', { zoomControl: false, scrollWheelZoom: false, zoomSnap: 0.25 });
  L.control.zoom({ position: 'topright' }).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const bounds = L.latLngBounds([]);
  const states = days.map(() => 'loading');
  let tileError = false;
  const tracks = days.map(() => []);
  const trackData = days.map(() => ({ state: 'loading' }));
  const ferryLayer = L.layerGroup().addTo(map);
  const ferryLegend = document.getElementById('tour-ferry-legend');
  const updateStatus = () => {
    const loading = states.filter((state) => state === 'loading').length;
    const errors = states.filter((state) => state === 'error').length;
    statusElement.textContent = [
      loading ? `Tourkarte: ${loading} Tages-GPX werden geladen.` : 'Tourkarte: vorläufige Planungsdaten, keine geprüfte Navigation.',
      errors ? `${errors} Tages-GPX nicht verfügbar; Start- und Zielpunkte bleiben sichtbar.` : '',
      tileError ? 'Kartenhintergrund nicht verfügbar; eine Internetverbindung ist erforderlich.' : '',
    ].filter(Boolean).join(' ');
  };
  tiles.on('tileerror', () => { tileError = true; updateStatus(); });
  days.forEach(({ frontmatter }) => {
    [frontmatter.koordinaten_start, frontmatter.koordinaten_ziel].forEach((point) => {
      bounds.extend(point);
      L.circleMarker(point, {
        radius: 2.5, color: '#101513', weight: 1, fillColor: '#f0a94c', fillOpacity: 1, interactive: false,
        className: 'tour-map-point',
      }).addTo(map);
    });
  });
  const resize = () => {
    map.invalidateSize();
    if (bounds.isValid()) map.fitBounds(bounds, tourFitOptions(window.matchMedia('(max-width: 767px)').matches));
  };
  const updateDay = (index, data) => {
    states[index] = data.state;
    trackData[index] = data;
    tracks[index].forEach((layer) => layer.remove());
    tracks[index] = [];
    if (data.state === 'loaded') {
      data.profileSegments.forEach((segment) => {
        const points = segment.map(([lat, lon]) => [lat, lon]);
        const layer = L.polyline(points, { color: '#f0a94c', weight: 3, opacity: 0.9, interactive: false, className: 'tour-map-track' }).addTo(map);
        tracks[index].push(layer);
        bounds.extend(layer.getBounds());
      });
      data.waypoints.forEach(({ latitude, longitude }) => bounds.extend([latitude, longitude]));
    }
    ferryLayer.clearLayers();
    const connections = ferryConnections(days, trackData);
    connections.map(ferryRoute).forEach((points) => {
      L.polyline(points, {
        color: '#12151b', weight: 9, opacity: 0.95, smoothFactor: 0, interactive: false, className: 'tour-map-ferry-outline',
      }).addTo(ferryLayer);
      L.polyline(points, {
        color: '#ffc64a', weight: 5, opacity: 0.95, smoothFactor: 0, dashArray: '9 7', className: 'tour-map-ferry',
      }).bindTooltip('Fährverbindung (ca. Linie)').addTo(ferryLayer);
    });
    ferryLegend.hidden = connections.length === 0;
    updateStatus();
    if (!document.getElementById('start').hidden) resize();
  };
  updateStatus();
  resize();
  return { resize, updateDay };
}

export function createRoadbookMap(L, days, statusElement, downloadElement) {
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true,
  });
  map.createPane('live-position-pane');
  map.getPane('live-position-pane').style.zIndex = '650';
  const markerLayer = L.layerGroup().addTo(map);
  const livePositionLayer = L.layerGroup().addTo(map);
  const dayMarkers = [];
  const dayBounds = [];
  const waypointLayers = [];
  const trackLayers = [];
  const finishLayers = [];
  const dayGpx = [];
  let activeIndex = 0;
  let trackLoadHandler;
  let tourTrackHandler;
  let livePositionMarkers = null;
  let highlightedWaypoint = null;

  function setHighlightedWaypoint(waypoint) {
    const colors = mapColors();
    if (highlightedWaypoint) {
      const { layer, waypoint: previous, dayIndex } = highlightedWaypoint;
      layer.setStyle(waypointStyle(previous, dayIndex === activeIndex));
    }
    highlightedWaypoint = waypointLayers.find((entry) => entry.dayIndex === activeIndex && entry.waypoint === waypoint) ?? null;
    if (highlightedWaypoint) {
      highlightedWaypoint.layer.setStyle({
        radius: 11, color: colors.markerHighlight, weight: 3, fillColor: colors.poiActive, fillOpacity: 1,
      });
      highlightedWaypoint.layer.bringToFront();
    }
  }

  function setLivePosition(point) {
    if (!point) {
      livePositionLayer.clearLayers();
      livePositionMarkers = null;
      return;
    }

    const position = [point.latitude, point.longitude];
    if (livePositionMarkers) {
      livePositionMarkers.forEach((marker) => marker.setLatLng(position));
      return;
    }

    const colors = mapColors();
    livePositionMarkers = [
      L.circleMarker(position, {
        pane: 'live-position-pane',
        radius: 15,
        color: colors.routeActive,
        weight: 3,
        fillColor: colors.accent,
        fillOpacity: 0.16,
        className: 'live-position-halo',
        interactive: false,
      }),
      L.circleMarker(position, {
        pane: 'live-position-pane',
        radius: 6,
        color: colors.markerHighlight,
        weight: 2,
        fillColor: colors.poiActive,
        fillOpacity: 1,
        className: 'live-position-marker',
        interactive: false,
      }),
    ];
    livePositionMarkers.forEach((marker) => marker.addTo(livePositionLayer));
  }

  function getTrackData(index) {
    const gpx = dayGpx[index];
    if (gpx.state !== 'loaded') {
      return { state: gpx.state };
    }
    return {
      state: gpx.state,
      profileSegments: gpx.profileSegments,
      waypoints: gpx.points,
      estimatedAscentMeters: days[index].frontmatter.hoehenmeter,
    };
  }

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
    dayGpx.push({ state: 'loading', points: [], segments: [], profileSegments: [] });
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

    const colors = mapColors();
    const finishMarker = L.circleMarker(finish, {
      radius: 8,
      color: colors.outline,
      weight: 3,
      fillColor: colors.accent,
      fillOpacity: 1,
      title: `Ziel: ${frontmatter.ziel}`,
    })
      .addTo(markerLayer)
      .bindTooltip(`Ziel · ${escapeHtml(frontmatter.ziel)}`)
      .on('click', () => map.fire('roadbook:select-day', { index }));
    finishLayers.push(finishMarker);

    fetch(`${import.meta.env.BASE_URL}${frontmatter.gpx_datei}`).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    }).then((text) => {
      const { points, segments, profileSegments } = parseGpx(text);
      dayGpx[index] = { state: 'loaded', points, segments, profileSegments };
      trackLoadHandler?.(index);
      tourTrackHandler?.(index, getTrackData(index));
      segments.forEach((segment) => {
        const layer = L.polyline(segment).addTo(map);
        trackLayers[index].push(layer);
        bounds.extend(layer.getBounds());
      });
      points.forEach((waypoint) => {
        const poiName = cleanPoiName(waypoint.name);
        const layer = L.circleMarker([waypoint.latitude, waypoint.longitude], waypointStyle(waypoint, index === activeIndex))
          .addTo(markerLayer)
          .bindTooltip(escapeHtml(poiName))
          .on('click', () => map.fire('roadbook:select-day', { index, waypoint }));
        waypointLayers.push({ layer, waypoint, dayIndex: index });
        bounds.extend([waypoint.latitude, waypoint.longitude]);
      });
      selectDay(activeIndex, { moveMap: false });
      if (index === activeIndex && window.matchMedia('(max-width: 768px)').matches) {
        requestAnimationFrame(() => {
          if (index === activeIndex && window.matchMedia('(max-width: 768px)').matches) {
            resize({ fitActiveDay: true });
          }
        });
      }
    }).catch((error) => {
      console.error(`GPX-Datei für Tag ${frontmatter.tag} konnte nicht geladen werden.`, error);
      dayGpx[index].state = 'error';
      trackLoadHandler?.(index);
      tourTrackHandler?.(index, getTrackData(index));
      selectDay(activeIndex, { moveMap: false });
    });
  });

  map.on('roadbook:select-day', (event) => {
    if (Number.isInteger(event.index)) {
      map.options.onSelectDay?.(event.index);
      if (event.waypoint) map.options.onSelectPoi?.(event.waypoint);
    }
  });

  const allBounds = L.latLngBounds([]);
  dayBounds.forEach((bounds) => allBounds.extend(bounds));
  if (allBounds.isValid()) {
    map.fitBounds(allBounds.pad(0.14), { animate: false });
  } else {
    map.setView([44.7, 20.5], 5);
  }

  function applyTheme() {
    const colors = mapColors();
    waypointLayers.forEach(({ layer, waypoint, dayIndex }) => {
      layer.setStyle(waypointStyle(waypoint, dayIndex === activeIndex));
    });
    if (highlightedWaypoint) setHighlightedWaypoint(highlightedWaypoint.waypoint);
    trackLayers.forEach((layers, dayIndex) => {
      layers.forEach((layer) => layer.setStyle({
        color: dayIndex === activeIndex ? colors.routeActive : colors.routeMuted,
        weight: dayIndex === activeIndex ? 5 : 3,
        opacity: dayIndex === activeIndex ? 0.95 : 0.55,
      }));
    });
    finishLayers.forEach((layer) => layer.setStyle({
      color: colors.outline, fillColor: colors.accent,
    }));
    if (livePositionMarkers) {
      livePositionMarkers[0].setStyle({
        color: colors.routeActive, fillColor: colors.accent,
      });
      livePositionMarkers[1].setStyle({
        color: colors.markerHighlight, fillColor: colors.poiActive,
      });
    }
  }

  function selectDay(index, { moveMap = true } = {}) {
    if (activeIndex !== index) {
      setLivePosition(null);
      setHighlightedWaypoint(null);
    }
    activeIndex = index;
    const day = days[index];
    const bounds = L.latLngBounds(dayBounds[index].getSouthWest(), dayBounds[index].getNorthEast());

    waypointLayers.forEach(({ layer, waypoint, dayIndex }) => {
      layer.setStyle(waypointStyle(waypoint, dayIndex === index));
    });
    if (highlightedWaypoint) setHighlightedWaypoint(highlightedWaypoint.waypoint);
    const colors = mapColors();
    trackLayers.forEach((layers, dayIndex) => {
      layers.forEach((layer) => layer.setStyle({
        color: dayIndex === index ? colors.routeActive : colors.routeMuted,
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
    statusElement.textContent = gpx.state === 'missing' || gpx.state === 'error'
      ? `${formatDayMapLabel(day)} · Tages-GPX konnte nicht geladen werden.`
      : formatDayMapLabel(day);

    if (moveMap && bounds.isValid()) {
      const zoom = Math.min(map.getBoundsZoom(bounds.pad(0.22)), 11);
      map.flyTo(bounds.getCenter(), zoom, { duration: 0.8 });
    }
  }

  // fitAll: Gesamtansicht neu einpassen, z. B. wenn die Karte beim Start verborgen war und keine Größe hatte.
  function resize({ fitActiveDay = false, fitAll = false } = {}) {
    map.invalidateSize();
    if (fitAll && allBounds.isValid()) {
      map.fitBounds(allBounds.pad(0.14), { animate: false });
    } else if (fitActiveDay && dayBounds[activeIndex].isValid()) {
      map.fitBounds(dayBounds[activeIndex], { padding: [24, 24], maxZoom: 11, animate: false });
    }
  }

  return {
    selectDay,
    getTrackData,
    setTrackLoadHandler(handler) {
      trackLoadHandler = handler;
      dayGpx.forEach((gpx, index) => {
        if (gpx.state !== 'loading') {
          trackLoadHandler(index);
        }
      });
    },
    setTourTrackHandler(handler) {
      tourTrackHandler = handler;
      dayGpx.forEach((gpx, index) => {
        if (gpx.state !== 'loading') handler(index, getTrackData(index));
      });
    },
    setLivePosition,
    setHighlightedWaypoint,
    setTheme: applyTheme,
    resize,
    setSelectHandler(handler) {
      map.options.onSelectDay = handler;
    },
    setPoiSelectHandler(handler) {
      map.options.onSelectPoi = handler;
    },
  };
}
