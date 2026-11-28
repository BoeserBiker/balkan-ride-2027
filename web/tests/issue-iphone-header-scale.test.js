import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseCss } from './helpers/dom.js';
import { MOBILE_UPDATE_QUERY, mobileUpdatesEnabled } from '../src/update-policy.js';

const [mainSource, styleSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
]);
const css = parseCss(styleSource);
const STACKED = { '--nav-row': '2', '--nav-column': '1 / -1', '--nav-justify': 'space-between' };

test('every px font size scales with the five font steps, so labels, numbers and buttons all grow', () => {
  const baseline = [14, 16, 17, 18, 20];
  baseline.forEach((root, index) => {
    const declarations = css.declarations(`:root[data-font-size="${index + 1}"]`);
    assert.equal(Number(declarations['--font-scale']), root / 16, `Stufe ${index + 1}`);
    assert.equal(declarations['font-size'], `${root}px`);
  });
  assert.equal(css.declarations(':root')['--font-scale'], '1');

  const unscaled = [];
  for (const [, value] of styleSource.matchAll(/(?<!--)font-size:\s*([^;}]+)/g)) {
    const size = value.trim();
    const fixedPx = /^\d+(\.\d+)?px$/.test(size) || (/^clamp\(/.test(size) && /px/.test(size));
    if (fixedPx && !/^(14|16|17|18|20|21|24|25\.5|27|30)px$/.test(size)) unscaled.push(size);
  }
  assert.deepEqual(unscaled, [], 'px-Schriftgrößen müssen mit var(--font-scale) multipliziert werden');
  assert.ok(!/\.(?:intro|roadbook-copy)\s*\{\s*font-size:\s*1[56]px/.test(styleSource), 'keine festen Stufen-Ausnahmen für Fließtext');
});

test('mobile header keeps BALKAN RIDE on one line and moves the navigation below it when it no longer fits', () => {
  const mobile = '@media (max-width: 767px)';
  for (const selector of ['.brand strong', '.brand small']) assert.equal(css.declarations(selector, mobile)['white-space'], 'nowrap', selector);
  assert.equal(css.declarations('.header-navigation', mobile).display, 'contents');
  const header = css.declarations('.site-header', mobile);
  assert.equal(header['--nav-row'], '1');
  assert.equal(header['--nav-justify'], 'flex-end');
  assert.match(header['grid-template-columns'], /auto minmax\(0, 1fr\) auto/);
  assert.equal(css.declarations('.site-nav', mobile)['grid-row'], 'var(--nav-row)');
  assert.equal(css.declarations('.brand-group', mobile)['grid-row'], '1');
  assert.equal(css.declarations('.header-tools', mobile)['grid-row'], '1', 'Logo und Einstellungen bleiben in der oberen Zeile');

  const widths = [];
  [
    ['.site-header', 394],
    [':root[data-font-size="3"] .site-header', 411],
    [':root[data-font-size="4"] .site-header', 426],
    [':root[data-font-size="5"] .site-header', 458],
  ].forEach(([selector, width]) => {
    assert.deepEqual(
      Object.fromEntries(Object.entries(css.declarations(selector, `@media (max-width: ${width}px)`))
        .filter(([name]) => name.startsWith('--nav-'))),
      STACKED, selector,
    );
    widths.push(width);
  });
  assert.deepEqual(widths, [...widths].sort((a, b) => a - b), 'größere Schrift stapelt früher');
  assert.ok(widths[0] >= 390, 'iPhone 12 (390 px) stapelt schon in der Standardstufe');
});

test('update dialog and data notice appear only below 768 px', () => {
  const windowWith = (matches) => ({
    matchMedia(query) {
      assert.equal(query, MOBILE_UPDATE_QUERY);
      return { matches };
    },
  });
  assert.equal(MOBILE_UPDATE_QUERY, '(max-width: 767px)');
  assert.equal(mobileUpdatesEnabled(windowWith(true)), true);
  assert.equal(mobileUpdatesEnabled(windowWith(false)), false, 'Desktop/Tablet >= 768 px');
  assert.equal(mobileUpdatesEnabled({}), false);
  assert.match(mainSource, /function showUpdate\(data\) \{\s*if \(!mobileUpdatesEnabled\(\)\) return;/);
  assert.match(mainSource, /function addChangedData\(url\) \{\s*if \(!mobileUpdatesEnabled\(\)\) return;/);
});
