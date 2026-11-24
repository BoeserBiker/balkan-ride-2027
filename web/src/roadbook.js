import { escapeHtml, escapeDisplayText, formatDuration } from './html.js';

const poiPrefix = /^D\d+\s*-\s*(\d+)\s*-\s*/i;
const poiDistanceFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const poiElevationFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

export function cleanPoiName(value) {
  return String(value ?? '').replace(poiPrefix, '').trim() || 'Unbenannter Stopp';
}

export function poiStopNumber(waypoint, index) {
  const match = String(waypoint?.name ?? '').match(poiPrefix);
  return match ? Number(match[1]) : index + 1;
}

export function editorialPoiDescription(waypoint) {
  const description = String(waypoint?.description ?? '').trim();
  if (!description || /\bV7\s*\/|\/\s*D\d+\s*\//i.test(description)) {
    return '';
  }

  const cleanedDescription = description
    .replace(/^(?:MOTORRAD|PKW|ALT|OPTION|FAEHRE)\s*[·–/-]\s*/i, '')
    .trim();
  const rawName = String(waypoint?.name ?? '').trim();
  const cleanedName = cleanPoiName(rawName);
  if (!cleanedDescription || [rawName, cleanedName].some(
    (name) => name && cleanedDescription.localeCompare(name, 'de', { sensitivity: 'base' }) === 0,
  )) {
    return '';
  }
  return cleanedDescription;
}

export function formatPoiSummary(waypoint, index, point) {
  const distance = Number.isFinite(point?.distanceKm)
    ? poiDistanceFormatter.format(point.distanceKm)
    : 'n/v';
  const height = Number.isFinite(point?.elevationMeters)
    ? poiElevationFormatter.format(point.elevationMeters)
    : 'n/v';
  return `Stopp ${poiStopNumber(waypoint, index)} · ${distance} km · ${height} m`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return escapeDisplayText(value);
  }
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function mediaPathMap(assets) {
  return Object.fromEntries(
    Object.entries(assets).map(([source, url]) => [source.replace('../../', ''), url]),
  );
}

function externalLink(url, label) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return `<a href="${escapeHtml(parsed.href)}" target="_blank" rel="noopener noreferrer">${escapeDisplayText(label)}</a>`;
    }
  } catch {
    return escapeDisplayText(label);
  }
  return escapeDisplayText(label);
}

function lightboxAttributes(photo, url, index) {
  const caption = photo.beschreibung || photo.caption || photo.title || photo.titel || photo.alt || 'Etappenfoto';
  const credit = photo.urheber && photo.lizenz
    ? `${photo.urheber} · ${photo.lizenz}${photo.bearbeitung ? ` · ${photo.bearbeitung}` : ''}`
    : '';
  return `data-lightbox-index="${index}" data-lightbox-type="image" data-lightbox-src="${escapeHtml(url)}" data-lightbox-alt="${escapeDisplayText(caption)}" data-lightbox-caption="${escapeDisplayText([caption, credit].filter(Boolean).join(' · '))}"`;
}

function keywords(text) {
  const commonWords = new Set(['und', 'der', 'die', 'das', 'von', 'nach', 'mit', 'zum', 'zur', 'den', 'and', 'the', 'with', 'for']);
  return new Set((text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((word) => word.length >= 3 && !commonWords.has(word)));
}

function highlightPhoto(highlight, index, photos) {
  const words = keywords(highlight);
  let bestPhoto;
  let bestScore = 0;
  for (const photo of photos) {
    const photoWords = keywords([photo.beschreibung, photo.titel, photo.title, photo.caption, photo.alt].filter(Boolean).join(' '));
    const score = [...words].filter((word) => photoWords.has(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestPhoto = photo;
    }
  }
  return bestPhoto || photos[index % photos.length];
}

function renderPhoto(photo, urls, index) {
  const url = urls[photo.datei];
  if (!url) {
    return `
      <div class="media-placeholder" role="img" aria-label="Bild noch nicht verfügbar">
        <span aria-hidden="true">＋</span>
        <small>BILD NOCH NICHT IM WORKSPACE</small>
        <p>${escapeDisplayText(photo.beschreibung)}</p>
      </div>
    `;
  }

  const caption = photo.beschreibung || 'Etappenfoto';
  const credit = photo.urheber && photo.lizenz
    ? `${photo.urheber} · ${photo.lizenz}${photo.bearbeitung ? ` · ${photo.bearbeitung}` : ''}`
    : '';
  return `
    <figure class="photo-card">
      <button class="photo-button" type="button" ${lightboxAttributes(photo, url, index)}>
        <img src="${escapeHtml(url)}" alt="${escapeDisplayText(caption)}" loading="lazy">
        <span class="photo-caption">${escapeDisplayText(caption)}</span>
      </button>
      ${credit ? `<figcaption class="photo-credit">${externalLink(photo.quelle, photo.urheber)} · ${externalLink(photo.lizenz_url, photo.lizenz)}${photo.bearbeitung ? ` · ${escapeDisplayText(photo.bearbeitung)}` : ''}</figcaption>` : ''}
    </figure>
  `;
}

function youtubeVideoId(source) {
  if (/^[\w-]{11}$/.test(source)) {
    return source;
  }

  let url;
  try {
    url = new URL(source);
  } catch {
    return null;
  }

  let videoId = '';
  if (['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname)) {
    videoId = url.pathname.startsWith('/embed/')
      ? url.pathname.slice('/embed/'.length)
      : url.searchParams.get('v') ?? '';
  } else if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) {
    videoId = url.pathname.slice(1);
  }

  return /^[\w-]{11}$/.test(videoId) ? videoId : null;
}

function renderVideo(video, urls) {
  const title = escapeDisplayText(video.titel || 'Etappenvideo');
  if (video.typ === 'youtube') {
    const videoId = youtubeVideoId(video.quelle);
    return videoId
      ? `<div class="video-item"><button class="video-open-button" type="button" data-lightbox-index="${video.index}" data-lightbox-type="youtube" data-lightbox-src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&amp;playsinline=1" data-lightbox-alt="${title}" data-lightbox-caption="${title}" aria-label="Video ${title} in Galerie öffnen"><span aria-hidden="true">▶</span> In Galerie ansehen</button><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&amp;playsinline=1" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="video-link" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Direkt in YouTube öffnen</a></div>`
      : `<div class="media-placeholder"><small>VIDEO-QUELLE UNGÜLTIG</small><p>${title}</p></div>`;
  }

  const url = urls[video.quelle];
  if (!url) {
    return `<div class="media-placeholder"><span aria-hidden="true">▶</span><small>VIDEO NOCH NICHT IM WORKSPACE</small><p>${title}</p></div>`;
  }
  const poster = urls[video.poster];
  return `
    <div class="video-item">
      <button class="video-open-button" type="button" data-lightbox-index="${video.index}" data-lightbox-type="video" data-lightbox-src="${escapeHtml(url)}" data-lightbox-alt="${title}" data-lightbox-caption="${title}" aria-label="Video ${title} in Galerie öffnen"><span aria-hidden="true">▶</span> In Galerie ansehen</button>
      <video controls preload="metadata" ${poster ? `poster="${escapeHtml(poster)}"` : ''} aria-label="${title}">
      <source src="${escapeHtml(url)}" type="video/mp4">
      Dein Browser unterstützt dieses Videoformat nicht.
      </video>
      <p class="media-caption">${title}</p>
    </div>
  `;
}

function renderGalleryVideo(video, urls, index) {
  const title = escapeDisplayText(video.titel || 'Etappenvideo');
  let type = 'video';
  let source = urls[video.quelle];
  if (video.typ === 'youtube') {
    const videoId = youtubeVideoId(video.quelle);
    if (!videoId) {
      return `<div class="media-placeholder"><small>VIDEO-QUELLE UNGÜLTIG</small><p>${title}</p></div>`;
    }
    type = 'youtube';
    source = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`;
  }
  if (!source) {
    return `<div class="media-placeholder"><span aria-hidden="true">▶</span><small>VIDEO NOCH NICHT IM WORKSPACE</small><p>${title}</p></div>`;
  }

  const poster = urls[video.poster];
  return `
    <button class="media-gallery-video" type="button" data-lightbox-index="${index}"
      data-lightbox-type="${type}" data-lightbox-src="${escapeHtml(source)}"
      data-lightbox-alt="${title}" data-lightbox-caption="${title}"
      aria-label="Video ${title} in Vollbild ansehen">
      ${poster
    ? `<img src="${escapeHtml(poster)}" alt="" loading="lazy">`
    : '<span class="media-gallery-video-placeholder" aria-hidden="true">▶</span>'}
      <span class="media-gallery-video-overlay"><strong>${title}</strong><span>▶ Video ansehen</span></span>
    </button>
  `;
}

export function renderMediaGallery(days, { assetUrls }) {
  const urls = mediaPathMap(assetUrls);
  return `${days.map(({ frontmatter }, dayIndex) => {
    const dayLabel = String(frontmatter.tag).padStart(2, '0');
    const photos = frontmatter.bilder.map((photo, index) => `
      <div class="media-gallery-entry" data-media-type="photo">
        ${renderPhoto(photo, urls, index)}
      </div>
    `).join('');
    const videos = frontmatter.videos.map((video, index) => `
      <div class="media-gallery-entry" data-media-type="video">
        ${renderGalleryVideo(video, urls, frontmatter.bilder.length + index)}
      </div>
    `).join('');
    return `
      <article class="media-gallery-stage" data-media-stage data-day-index="${dayIndex}">
        <header class="media-gallery-stage-heading">
          <div>
            <p class="eyebrow">ETAPPE ${dayLabel}</p>
            <h3>${escapeDisplayText(frontmatter.titel)}</h3>
          </div>
          <button class="button button-secondary media-stage-jump" type="button"
            data-select-day-index="${dayIndex}" aria-label="Etappe ${dayLabel} im Roadbook öffnen">
            Etappe ansehen
          </button>
        </header>
        <div class="media-gallery-grid">${photos}${videos}</div>
        <p class="media-gallery-empty" data-media-empty hidden>Für diese Etappe sind noch keine Medien hinterlegt.</p>
      </article>
    `;
  }).join('')}
  <p class="media-gallery-no-results" data-media-no-results hidden>Für diesen Filter sind keine Medien vorhanden.</p>`;
}

export function renderDayContent(day, { marked, DOMPurify, assetUrls }) {
  const { frontmatter, body } = day;
  const urls = mediaPathMap(assetUrls);
  const availablePhotos = frontmatter.bilder.filter((photo) => urls[photo.datei]);
  const photoIndexes = new Map(availablePhotos.map((photo, index) => [photo, index]));
  const highlights = frontmatter.highlights.length
    ? `<ul class="highlight-list">${frontmatter.highlights.map((highlight, index) => {
      if (!availablePhotos.length) {
        return `<li><span class="highlight-badge">${escapeDisplayText(highlight)}</span></li>`;
      }
      const photo = highlightPhoto(highlight, index, availablePhotos);
      return `<li><button class="highlight-badge highlight-button" type="button" aria-label="Foto zum Highlight ${escapeDisplayText(highlight)} öffnen" ${lightboxAttributes(photo, urls[photo.datei], photoIndexes.get(photo))}><span aria-hidden="true">📷</span> ${escapeDisplayText(highlight)}</button></li>`;
    }).join('')}</ul>`
    : '<p class="muted-copy">Für diese Etappe sind noch keine Highlights hinterlegt.</p>';
  const photos = frontmatter.bilder.length
    ? frontmatter.bilder.map((photo, index) => renderPhoto(photo, urls, photoIndexes.get(photo) ?? index)).join('')
    : '<div class="media-placeholder"><small>NOCH KEINE FOTOS HINTERLEGT</small></div>';
  const videos = frontmatter.videos.length
    ? frontmatter.videos.map((video, index) => renderVideo({
      ...video, index: availablePhotos.length + index,
    }, urls)).join('')
    : '<div class="media-placeholder"><small>NOCH KEINE VIDEOS HINTERLEGT</small></div>';
  const safeBody = DOMPurify.sanitize(marked.parse(formatDuration(body)));

  return `
    <div class="day-meta">
      <span class="eyebrow">ETAPPE ${String(frontmatter.tag).padStart(2, '0')}</span>
      <span>${formatDate(frontmatter.datum)}</span>
    </div>
    <h2 class="day-title">${escapeDisplayText(frontmatter.titel)}</h2>
    <div class="route-line" data-route-line>
      <div><span class="route-point start-point"></span><small>START</small><strong>${escapeDisplayText(frontmatter.start)}</strong></div>
      <div class="route-connector-wrap">
        <button class="route-connector" data-route-scrubber type="button" role="slider" aria-label="Streckenfortschritt: GPX wird geladen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" disabled>
          <span class="route-connector-line" aria-hidden="true"><span class="route-connector-fill"></span><span class="route-connector-thumb"><span data-route-distance></span></span></span>
        </button>
        <div class="route-poi-markers" data-route-poi-markers aria-label="Etappen-POIs"></div>
      </div>
      <div class="route-poi-popover" data-route-poi-popover role="dialog" aria-live="polite" hidden>
        <button class="route-poi-close" data-route-poi-close type="button" aria-label="POI-Information schließen">×</button>
        <strong data-route-poi-name></strong>
        <span data-route-poi-summary></span>
        <span data-route-poi-description hidden></span>
        <a class="poi-navigation" data-route-poi-navigation target="_blank" rel="noopener noreferrer">Dorthin navigieren</a>
      </div>
      <div><span class="route-point finish-point"></span><small>ZIEL</small><strong>${escapeDisplayText(frontmatter.ziel)}</strong></div>
    </div>
    <dl class="stats-grid">
      <div><dt>STRECKE</dt><dd>${escapeDisplayText(frontmatter.kilometer)} <small>km</small></dd></div>
      <div><dt>FAHRZEIT</dt><dd>${escapeDisplayText(frontmatter.fahrzeit)}</dd></div>
      <div><dt>HÖHENMETER</dt><dd>${escapeDisplayText(frontmatter.hoehenmeter)} <small>hm</small></dd></div>
    </dl>
    <section class="elevation-section" data-elevation-profile aria-label="Höhenprofil der Etappe" hidden></section>
    <section class="day-section">
      <h3>Highlights</h3>
      ${highlights}
    </section>
    <section class="story-section">
      <h3>Auf der Straße</h3>
      <div class="roadbook-copy">${safeBody}</div>
    </section>
    <section class="day-section media-section">
      <div class="subsection-heading"><h3>Momente der Etappe</h3><span>FOTO · VIDEO</span></div>
      <div class="photo-gallery">${photos}</div>
      <div class="video-gallery">${videos}</div>
    </section>
    <div class="day-navigation">
      <button id="previous-day" class="button button-secondary" type="button" disabled>← <span>ZURÜCK</span></button>
      <button id="next-day" class="button button-primary" type="button">WEITER <span>→</span></button>
    </div>
  `;
}
