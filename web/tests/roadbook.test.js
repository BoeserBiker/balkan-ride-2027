import assert from 'node:assert/strict';
import test from 'node:test';
import { gpxDownload } from '../src/gpx-download.js';
import { formatDayMapLabel } from '../src/map.js';
import { renderDayContent, renderMediaGallery } from '../src/roadbook.js';

test('map label matches the selected stage text', () => {
  assert.equal(formatDayMapLabel({
    frontmatter: { tag: 2, start: 'Velburg', ziel: 'Villach' },
  }), 'Tag 2 · Velburg → Villach');
});

test('GPX download appears only for a loaded track, respecting the deployment base', () => {
  const day = { frontmatter: { gpx_datei: 'assets/gpx/tag-03.gpx' } };
  assert.deepEqual(gpxDownload(day, { state: 'loaded', segments: [[[1, 2], [3, 4]]] }, '/balkan-ride-2027/'), {
    href: '/balkan-ride-2027/assets/gpx/tag-03.gpx',
    filename: 'tag-03.gpx',
  });
  assert.equal(gpxDownload(day, { state: 'loaded', segments: [] }, '/'), null);
  assert.equal(gpxDownload(day, { state: 'error', segments: [] }, '/'), null);
});

test('gallery renders attribution links and nocookie video', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '1 h', hoehenmeter: 10, highlights: [],
      bilder: [{
        datei: 'assets/media/tag-03/test.jpg', beschreibung: 'Blick',
        urheber: 'A & B', lizenz: 'CC BY 4.0',
        quelle: 'https://commons.wikimedia.org/wiki/File:Test',
        lizenz_url: 'https://creativecommons.org/licenses/by/4.0/',
      }],
      videos: [{ typ: 'youtube', quelle: 'https://www.youtube-nocookie.com/embed/abcdefghijk', titel: 'Tour' }],
    },
    body: '',
  };
  const html = renderDayContent(day, {
    marked: { parse: (text) => text },
    DOMPurify: { sanitize: (text) => text },
    assetUrls: { '../../assets/media/tag-03/test.jpg': '/assets/test.jpg' },
  });
  assert.match(html, /A &amp; B/);
  assert.match(html, /<span class="photo-caption">Blick<\/span>[\s\S]*<figcaption class="photo-credit">/);
  assert.match(html, /data-lightbox-caption="Blick · A &amp; B · CC BY 4\.0"/);
  assert.match(html, /https:\/\/commons\.wikimedia\.org\/wiki\/File:Test/);
  assert.match(html, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
  assert.match(html, /https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?rel=0&amp;playsinline=1/);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /<img src="https:\/\/i\.ytimg\.com\/vi\/abcdefghijk\/hqdefault\.jpg" alt="" loading="lazy" referrerpolicy="no-referrer">/);
  assert.doesNotMatch(html, /youtube-preview-title|media-gallery-video-overlay/);
  assert.match(html, /<button class="youtube-preview" type="button" data-youtube-embed="https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?autoplay=1&amp;rel=0&amp;playsinline=1"/);
  assert.match(html, /2-Klick-Vorschau: Mit Klick wird das Video von YouTube \(youtube-nocookie\.com\) geladen\./);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/watch\?v=abcdefghijk" target="_blank" rel="noopener noreferrer">Direkt in YouTube öffnen/);
});

test('photo views keep title and credits but omit image processing metadata', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '1 h', hoehenmeter: 10, highlights: [],
      bilder: [{
        datei: 'assets/media/tag-03/test.jpg', titel: 'Blick auf die Küste',
        bearbeitung: 'Interne Bildnotiz', urheber: 'A & B', lizenz: 'CC BY 4.0',
        quelle: 'https://commons.wikimedia.org/wiki/File:Test',
        lizenz_url: 'https://creativecommons.org/licenses/by/4.0/',
      }],
      videos: [],
    },
    body: '',
  };
  const assetUrls = { '../../assets/media/tag-03/test.jpg': '/assets/test.jpg' };
  const detailHtml = renderDayContent(day, {
    marked: { parse: (text) => text },
    DOMPurify: { sanitize: (text) => text },
    assetUrls,
  });
  const galleryHtml = renderMediaGallery([day], { assetUrls });

  for (const html of [detailHtml, galleryHtml]) {
    assert.match(html, /Blick auf die Küste/);
    assert.match(html, /A &amp; B/);
    assert.match(html, /CC BY 4\.0/);
    assert.doesNotMatch(html, /Interne Bildnotiz|bearbeitung|skaliert/i);
  }
});

test('lightbox photo caption deduplicates repeated credit', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '1 h', hoehenmeter: 10, highlights: [],
      bilder: [{
        datei: 'assets/media/tag-03/test.jpg',
        beschreibung: 'Blick · A & B · CC BY 4.0 · CC BY 4.0',
        urheber: 'A & B', lizenz: 'CC BY 4.0',
      }],
      videos: [],
    },
    body: '',
  };
  const html = renderDayContent(day, {
    marked: { parse: (text) => text },
    DOMPurify: { sanitize: (text) => text },
    assetUrls: { '../../assets/media/tag-03/test.jpg': '/assets/test.jpg' },
  });
  assert.match(html, /data-lightbox-caption="Blick · A &amp; B · CC BY 4\.0"/);
});

test('day media receives stable indices and video gallery launch controls', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '1 h', hoehenmeter: 10, highlights: ['Blick'],
      bilder: [
        { datei: 'assets/media/first.jpg', beschreibung: 'Blick' },
        { datei: 'assets/media/second.jpg', beschreibung: 'Berge' },
      ],
      videos: [
        { typ: 'youtube', quelle: 'https://youtu.be/abcdefghijk', titel: 'YouTube' },
        { typ: 'local', quelle: 'assets/media/clip.mp4', titel: 'Clip' },
      ],
    },
    body: '',
  };
  const html = renderDayContent(day, {
    marked: { parse: (text) => text }, DOMPurify: { sanitize: (text) => text },
    assetUrls: {
      '../../assets/media/first.jpg': '/first.jpg',
      '../../assets/media/second.jpg': '/second.jpg',
      '../../assets/media/clip.mp4': '/clip.mp4',
    },
  });

  assert.match(html, /data-lightbox-index="0" data-lightbox-type="image" data-lightbox-src="\/first\.jpg"/);
  assert.match(html, /data-lightbox-index="1" data-lightbox-type="image" data-lightbox-src="\/second\.jpg"/);
  assert.match(html, /data-lightbox-index="2" data-lightbox-type="youtube" data-lightbox-src="https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?rel=0&amp;playsinline=1"/);
  assert.match(html, /data-lightbox-index="3" data-lightbox-type="video" data-lightbox-src="\/clip\.mp4"/);
  assert.match(html, /aria-label="Video YouTube in Galerie öffnen"/);
  assert.match(html, /aria-label="Video Clip in Galerie öffnen"/);
  assert.match(html, /data-lightbox-index="0" data-lightbox-type="image" data-lightbox-src="\/first\.jpg"[^>]*>.*Blick/s);
});

test('model hours are displayed as rounded hours and minutes without changing the source', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '', hoehenmeter: 10, highlights: [], bilder: [], videos: [],
    },
    body: '',
  };
  const options = {
    marked: { parse: (text) => text }, DOMPurify: { sanitize: (text) => text }, assetUrls: {},
  };
  for (const [input, expected] of [
    ['2,88 Modell-h', '<span class="duration-desktop">ca. 2 Std. 53 Min.</span><span class="duration-mobile">ca. 2:53 h</span>'],
    ['5,09 Modell-h', '<span class="duration-desktop">ca. 5 Std. 05 Min.</span><span class="duration-mobile">ca. 5:05 h</span>'],
    ['0,00 Modell-h', '0 Std.'],
    ['0,06 Modell-h', '<span class="duration-desktop">ca. 0 Std. 04 Min.</span><span class="duration-mobile">ca. 0:04 h</span>'],
    ['1.999 Modell-h', '<span class="duration-desktop">ca. 2 Std. 00 Min.</span><span class="duration-mobile">ca. 2:00 h</span>'],
    ['1 h & Pause', '1 h &amp; Pause'],
  ]) {
    day.frontmatter.fahrzeit = input;
    const html = renderDayContent(day, options);
    assert.ok(html.includes(`<dt>FAHRZEIT</dt><dd>${expected}</dd>`), input);
    assert.equal(day.frontmatter.fahrzeit, input);
  }
});

test('formats model hours in roadbook text, highlights and media without changing source', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Runde 1,08 Modell-h',
      start: 'Start', ziel: 'Ziel', kilometer: 10, fahrzeit: '2 Modell-h', hoehenmeter: 10,
      highlights: ['Option 0,00 Modell-h', 'Abstecher 1.5 Modell-h'],
      bilder: [{ datei: 'photo.jpg', beschreibung: 'Blick 1,08 Modell-h' }],
      videos: [],
    },
    body: '45,6 km / 1,08 Modell-h; Option 0,00 Modell-h.',
  };
  const html = renderDayContent(day, {
    marked: { parse: (text) => text }, DOMPurify: { sanitize: (text) => text },
    assetUrls: { '../../photo.jpg': '/photo.jpg' },
  });
  assert.match(html, /Runde ca\. 1 Std\. 05 Min\./);
  assert.match(html, /45,6 km \/ <span class="duration-desktop">ca\. 1 Std\. 05 Min\.<\/span><span class="duration-mobile">ca\. 1:05 h<\/span>; Option 0 Std\./);
  assert.match(html, /Abstecher ca\. 1 Std\. 30 Min\./);
  assert.match(html, /Blick ca\. 1 Std\. 05 Min\./);
  assert.doesNotMatch(html, /Modell-h/);
  assert.equal(day.frontmatter.titel, 'Runde 1,08 Modell-h');
  assert.equal(day.body, '45,6 km / 1,08 Modell-h; Option 0,00 Modell-h.');
});

test('highlights select matching available photos or fall back by index', () => {
  const day = {
    frontmatter: {
      tag: 3, datum: '2027-09-10', titel: 'Test', start: 'A', ziel: 'B',
      kilometer: 10, fahrzeit: '1 h', hoehenmeter: 10,
      highlights: ['VRŠIČ Pass', 'Kein Treffer', 'Unbekannt', 'Blick'],
      bilder: [
        { datei: 'assets/media/first.jpg', beschreibung: 'Dorf', alt: 'Blick' },
        { datei: 'assets/media/second.jpg', beschreibung: 'Berge', title: 'Vrsic Pass Gipfel' },
        { datei: 'assets/media/missing.jpg', beschreibung: 'VRŠIČ Pass' },
      ],
      videos: [],
    },
    body: '',
  };
  const options = {
    marked: { parse: (text) => text }, DOMPurify: { sanitize: (text) => text },
    assetUrls: {
      '../../assets/media/first.jpg': '/first.jpg',
      '../../assets/media/second.jpg': '/second.jpg',
    },
  };
  const html = renderDayContent(day, options);
  const buttons = [...html.matchAll(/<button class="highlight-badge highlight-button"[^>]+>/g)].map((match) => match[0]);
  assert.equal(buttons.length, 4);
  assert.match(buttons[0], /data-lightbox-src="\/second\.jpg"/);
  assert.match(buttons[1], /data-lightbox-src="\/second\.jpg"/);
  assert.match(buttons[2], /data-lightbox-src="\/first\.jpg"/);
  assert.match(buttons[3], /data-lightbox-src="\/first\.jpg"/);
  assert.match(buttons[0], /data-lightbox-caption="Berge"/);

  const withoutPhotos = renderDayContent(day, { ...options, assetUrls: {} });
  assert.doesNotMatch(withoutPhotos, /class="highlight-badge highlight-button"/);
  assert.match(withoutPhotos, /<span class="highlight-badge">VRŠIČ Pass<\/span>/);
});
