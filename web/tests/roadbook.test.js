import assert from 'node:assert/strict';
import test from 'node:test';
import { gpxDownload } from '../src/gpx-download.js';
import { formatDayMapLabel } from '../src/map.js';
import { renderDayContent, renderMediaGallery } from '../src/roadbook.js';
import { lightboxEntries, normalizeText, parseHtml } from './helpers/dom.js';

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
  const document = parseHtml(html);
  const card = document.querySelector('figure.photo-card');
  assert.equal(normalizeText(card.querySelector('.photo-caption')), 'Blick');
  assert.ok(card.querySelector('.photo-button .photo-caption'), 'caption belongs to the photo button');
  const credit = card.querySelector('figcaption.photo-credit');
  assert.ok(credit, 'credit follows the photo');
  assert.equal(card.querySelector('.photo-button').nextElementSibling, credit);
  assert.equal(lightboxEntries(card)[0].caption, 'Blick · A & B · CC BY 4.0');
  assert.deepEqual(
    [...credit.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    [
      'https://commons.wikimedia.org/wiki/File:Test',
      'https://creativecommons.org/licenses/by/4.0/',
    ],
  );
  const youtubeEmbed = 'https://www.youtube-nocookie.com/embed/abcdefghijk';
  assert.ok(lightboxEntries(document).some(({ type, src }) => type === 'youtube'
    && src === `${youtubeEmbed}?rel=0&playsinline=1`));
  assert.doesNotMatch(html, /<iframe/);
  const thumbnail = document.querySelector('.youtube-preview img');
  assert.equal(thumbnail.getAttribute('src'), 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  assert.equal(thumbnail.getAttribute('alt'), '');
  assert.equal(thumbnail.getAttribute('loading'), 'lazy');
  assert.equal(thumbnail.getAttribute('referrerpolicy'), 'no-referrer');
  assert.doesNotMatch(html, /youtube-preview-title|media-gallery-video-overlay/);
  const preview = document.querySelector('button.youtube-preview');
  assert.equal(preview.getAttribute('type'), 'button');
  assert.equal(
    preview.getAttribute('data-youtube-embed'), `${youtubeEmbed}?autoplay=1&rel=0&playsinline=1`,
  );
  assert.match(
    normalizeText(preview),
    /2-Klick-Vorschau: Mit Klick wird das Video von YouTube \(youtube-nocookie\.com\) geladen\./,
  );
  const directLink = document.querySelector('a.video-link');
  assert.equal(directLink.getAttribute('href'), 'https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(directLink.getAttribute('target'), '_blank');
  assert.equal(directLink.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(normalizeText(directLink), 'Direkt in YouTube öffnen');
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
  const entry = lightboxEntries(parseHtml(html))[0];
  assert.equal(entry.caption, 'Blick · A & B · CC BY 4.0');
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

  const document = parseHtml(html);
  const entries = lightboxEntries(document);
  assert.deepEqual(
    entries.filter(({ element }) => !element.classList.contains('highlight-button'))
      .map(({ index, type, src }) => ({ index, type, src })),
    [
      { index: '0', type: 'image', src: '/first.jpg' },
      { index: '1', type: 'image', src: '/second.jpg' },
      { index: '2', type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0&playsinline=1' },
      { index: '3', type: 'video', src: '/clip.mp4' },
    ],
  );
  assert.ok(document.querySelector('[aria-label="Video YouTube in Galerie öffnen"]'));
  assert.ok(document.querySelector('[aria-label="Video Clip in Galerie öffnen"]'));
  assert.equal(entries[0].index, '0');
  assert.equal(entries[0].src, '/first.jpg');
  assert.match(normalizeText(entries[0].element), /Blick/);
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
    ['2,88 Modell-h', { desktop: 'ca. 2 Std. 53 Min.', mobile: 'ca. 2:53 h' }],
    ['5,09 Modell-h', { desktop: 'ca. 5 Std. 05 Min.', mobile: 'ca. 5:05 h' }],
    ['0,00 Modell-h', { text: '0 Std.' }],
    ['0,06 Modell-h', { desktop: 'ca. 0 Std. 04 Min.', mobile: 'ca. 0:04 h' }],
    ['1.999 Modell-h', { desktop: 'ca. 2 Std. 00 Min.', mobile: 'ca. 2:00 h' }],
    ['1 h & Pause', { text: '1 h & Pause' }],
  ]) {
    day.frontmatter.fahrzeit = input;
    const html = renderDayContent(day, options);
    const label = [...parseHtml(html).querySelectorAll('dt')].find((term) => normalizeText(term) === 'FAHRZEIT');
    assert.ok(label, input);
    const value = label.nextElementSibling;
    assert.equal(value.tagName.toLowerCase(), 'dd', input);
    if (expected.text !== undefined) {
      assert.equal(normalizeText(value), expected.text, input);
      assert.equal(value.querySelector('span'), null, input);
    } else {
      assert.equal(normalizeText(value.querySelector('span.duration-desktop')), expected.desktop, input);
      assert.equal(normalizeText(value.querySelector('span.duration-mobile')), expected.mobile, input);
    }
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
  const hours = parseHtml(html).querySelector('.roadbook-copy');
  assert.equal(hours.querySelector('span.duration-desktop').textContent, 'ca. 1 Std. 05 Min.');
  assert.equal(hours.querySelector('span.duration-mobile').textContent, 'ca. 1:05 h');
  assert.ok(
    normalizeText(hours).startsWith('45,6 km / ca. 1 Std. 05 Min.ca. 1:05 h; Option 0 Std.'),
    normalizeText(hours),
  );
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
  const highlightButtons = (rendered) => [...parseHtml(rendered).querySelectorAll('button.highlight-button')];
  const buttons = highlightButtons(html);
  assert.equal(buttons.length, 4);
  assert.deepEqual(
    buttons.map((button) => button.getAttribute('data-lightbox-src')),
    ['/second.jpg', '/second.jpg', '/first.jpg', '/first.jpg'],
  );
  assert.equal(buttons[0].getAttribute('data-lightbox-caption'), 'Berge');

  const withoutPhotos = renderDayContent(day, { ...options, assetUrls: {} });
  assert.equal(highlightButtons(withoutPhotos).length, 0);
  const badge = parseHtml(withoutPhotos).querySelector('span.highlight-badge');
  assert.equal(normalizeText(badge), 'VRŠIČ Pass');
});
