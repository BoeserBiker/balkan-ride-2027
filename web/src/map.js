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

  function resize({ fitActiveDay = false } = {}) {
    map.invalidateSize();
    if (fitActiveDay && dayBounds[activeIndex].isValid()) {
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
