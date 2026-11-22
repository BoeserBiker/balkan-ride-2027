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
  assert.match(html, /https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk/);
});
