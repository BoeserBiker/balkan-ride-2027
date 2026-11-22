import assert from 'node:assert/strict';
import test from 'node:test';
import { gpxDownload } from '../src/gpx-download.js';
import { renderDayContent } from '../src/roadbook.js';

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
        bearbeitung: 'Skaliert',
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
  assert.match(html, /https:\/\/commons\.wikimedia\.org\/wiki\/File:Test/);
  assert.match(html, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
  assert.match(html, /https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk\?rel=0&amp;playsinline=1/);
  assert.match(html, /referrerpolicy="strict-origin-when-cross-origin"/);
  assert.match(html, /allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen/);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/watch\?v=abcdefghijk" target="_blank" rel="noopener noreferrer">Direkt in YouTube öffnen/);
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
    ['2,88 Modell-h', 'ca. 2:53 h'],
    ['5,09 Modell-h', 'ca. 5:05 h'],
    ['0,00 Modell-h', '0 Std.'],
    ['0,06 Modell-h', 'ca. 0:04 h'],
    ['1.999 Modell-h', 'ca. 2:00 h'],
    ['1 h & Pause', '1 h &amp; Pause'],
  ]) {
    day.frontmatter.fahrzeit = input;
    const html = renderDayContent(day, options);
    assert.ok(html.includes(`<dt>FAHRZEIT</dt><dd>${expected}</dd>`), input);
    assert.equal(day.frontmatter.fahrzeit, input);
  }
});
