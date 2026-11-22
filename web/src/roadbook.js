import { escapeHtml } from './html.js';

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatDuration(value) {
  return value.replace(/(\d+(?:[,.]\d+)?)\s*Modell-h/g, (_match, amount) => {
    const minutes = Math.round(Number(amount.replace(',', '.')) * 60);
    if (minutes === 0) {
      return '0 Std.';
    }
    return `ca. ${Math.floor(minutes / 60)} Std. ${String(minutes % 60).padStart(2, '0')} Min.`;
  });
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
      return `<a href="${escapeHtml(parsed.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    }
  } catch {
    return escapeHtml(label);
  }
  return escapeHtml(label);
}

function lightboxAttributes(photo, url) {
  const caption = photo.beschreibung || photo.caption || photo.title || photo.titel || photo.alt || 'Etappenfoto';
  const credit = photo.urheber && photo.lizenz
    ? `${photo.urheber} · ${photo.lizenz}${photo.bearbeitung ? ` · ${photo.bearbeitung}` : ''}`
    : '';
  return `data-lightbox-src="${escapeHtml(url)}" data-lightbox-alt="${escapeHtml(caption)}" data-lightbox-caption="${escapeHtml([caption, credit].filter(Boolean).join(' · '))}"`;
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

function renderPhoto(photo, urls) {
  const url = urls[photo.datei];
  if (!url) {
    return `
      <div class="media-placeholder" role="img" aria-label="Bild noch nicht verfügbar">
        <span aria-hidden="true">＋</span>
        <small>BILD NOCH NICHT IM WORKSPACE</small>
        <p>${escapeHtml(photo.beschreibung)}</p>
      </div>
    `;
  }

  const caption = photo.beschreibung || 'Etappenfoto';
  const credit = photo.urheber && photo.lizenz
    ? `${photo.urheber} · ${photo.lizenz}${photo.bearbeitung ? ` · ${photo.bearbeitung}` : ''}`
    : '';
  return `
    <figure class="photo-card">
      <button class="photo-button" type="button" ${lightboxAttributes(photo, url)}>
        <img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" loading="lazy">
        <span class="photo-caption">${escapeHtml(caption)}</span>
      </button>
      ${credit ? `<figcaption class="photo-credit">${externalLink(photo.quelle, photo.urheber)} · ${externalLink(photo.lizenz_url, photo.lizenz)}${photo.bearbeitung ? ` · ${escapeHtml(photo.bearbeitung)}` : ''}</figcaption>` : ''}
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
  const title = escapeHtml(video.titel || 'Etappenvideo');
  if (video.typ === 'youtube') {
    const videoId = youtubeVideoId(video.quelle);
    return videoId
      ? `<div class="video-item"><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&amp;playsinline=1" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="video-link" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Direkt in YouTube öffnen</a></div>`
      : `<div class="media-placeholder"><small>VIDEO-QUELLE UNGÜLTIG</small><p>${title}</p></div>`;
  }

  const url = urls[video.quelle];
  if (!url) {
    return `<div class="media-placeholder"><span aria-hidden="true">▶</span><small>VIDEO NOCH NICHT IM WORKSPACE</small><p>${title}</p></div>`;
  }
  const poster = urls[video.poster];
  return `
    <video controls preload="metadata" ${poster ? `poster="${escapeHtml(poster)}"` : ''} aria-label="${title}">
      <source src="${escapeHtml(url)}" type="video/mp4">
      Dein Browser unterstützt dieses Videoformat nicht.
    </video>
    <p class="media-caption">${title}</p>
  `;
}

export function renderDayContent(day, { marked, DOMPurify, assetUrls }) {
  const { frontmatter, body } = day;
  const urls = mediaPathMap(assetUrls);
  const availablePhotos = frontmatter.bilder.filter((photo) => urls[photo.datei]);
  const highlights = frontmatter.highlights.length
    ? `<ul class="highlight-list">${frontmatter.highlights.map((highlight, index) => {
      if (!availablePhotos.length) {
        return `<li><span class="highlight-badge">${escapeHtml(highlight)}</span></li>`;
      }
      const photo = highlightPhoto(highlight, index, availablePhotos);
      return `<li><button class="highlight-badge highlight-button" type="button" aria-label="Foto zum Highlight ${escapeHtml(highlight)} öffnen" ${lightboxAttributes(photo, urls[photo.datei])}><span aria-hidden="true">📷</span> ${escapeHtml(highlight)}</button></li>`;
    }).join('')}</ul>`
    : '<p class="muted-copy">Für diese Etappe sind noch keine Highlights hinterlegt.</p>';
  const photos = frontmatter.bilder.length
    ? frontmatter.bilder.map((photo) => renderPhoto(photo, urls)).join('')
    : '<div class="media-placeholder"><small>NOCH KEINE FOTOS HINTERLEGT</small></div>';
  const videos = frontmatter.videos.length
    ? frontmatter.videos.map((video) => renderVideo(video, urls)).join('')
    : '<div class="media-placeholder"><small>NOCH KEINE VIDEOS HINTERLEGT</small></div>';
  const safeBody = DOMPurify.sanitize(marked.parse(formatDuration(body)));

  return `
    <div class="day-meta">
      <span class="eyebrow">ETAPPE ${String(frontmatter.tag).padStart(2, '0')}</span>
      <span>${formatDate(frontmatter.datum)}</span>
    </div>
    <h2 class="day-title">${escapeHtml(frontmatter.titel)}</h2>
    <div class="route-line">
      <div><span class="route-point start-point"></span><small>START</small><strong>${escapeHtml(frontmatter.start)}</strong></div>
      <span class="route-connector" aria-hidden="true"></span>
      <div><span class="route-point finish-point"></span><small>ZIEL</small><strong>${escapeHtml(frontmatter.ziel)}</strong></div>
    </div>
    <dl class="stats-grid">
      <div><dt>STRECKE</dt><dd>${escapeHtml(frontmatter.kilometer)} <small>km</small></dd></div>
      <div><dt>FAHRZEIT</dt><dd>${escapeHtml(formatDuration(frontmatter.fahrzeit))}</dd></div>
      <div><dt>HÖHENMETER*</dt><dd>${escapeHtml(frontmatter.hoehenmeter)} <small>hm</small></dd></div>
    </dl>
    <p class="muted-copy">* Vorläufig aus einer rekonstruierten Route geschätzt; eine GPX-Prüfung steht aus.</p>
    <section class="elevation-section" aria-label="Interaktives Höhenprofil">
      <div class="subsection-heading"><h3>Streckenprofil</h3><span>KM · HÖHENMETER</span></div>
      <div class="elevation-profile" data-elevation-profile>
        <p class="muted-copy">GPX-Track wird geladen.</p>
      </div>
    </section>
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
      <button id="previous-day" class="button button-secondary" type="button" disabled>← <span>VORHERIGE ETAPPE</span></button>
      <button id="next-day" class="button button-primary" type="button">NÄCHSTE ETAPPE <span>→</span></button>
    </div>
  `;
}
