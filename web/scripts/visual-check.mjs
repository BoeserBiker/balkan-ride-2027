import { spawn } from 'node:child_process';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const webDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDirectory = path.join(webDirectory, '.visual-report');
const BASE_PATH = '/balkan-ride-2027/';
const PAGES = [
  { id: 'roadbook', label: 'Etappen' },
  { id: 'media', label: 'Galerie' },
  { id: 'logistics', label: 'Logistik' },
];
const VIEWPORTS = [
  { slug: 'iphone-12-mini', name: 'iPhone 12 mini', width: 375, height: 812, mobile: true },
  { slug: 'android-6-4', name: 'Android 6,4 Zoll', width: 412, height: 915, mobile: true },
  { slug: 'tablet-768', name: 'Tablet', width: 768, height: 1024, mobile: false },
  { slug: 'desktop', name: 'Desktop', width: 1280, height: 800, mobile: false },
];
// Transparentes 1x1-PNG: externe Ressourcen (Kartenkacheln, Fotos, Videos) werden offline ersetzt.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function startPreview() {
  await access(path.join(webDirectory, 'dist', 'index.html')).catch(() => {
    throw new Error('web/dist fehlt. Zuerst `npm run build --prefix web` ausführen.');
  });
  const port = await freePort();
  const viteBin = path.join(webDirectory, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: webDirectory,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`vite preview beendet sich vorzeitig:\n${output}`);
    try {
      const response = await fetch(`${origin}${BASE_PATH}`);
      if (response.ok) return { child, origin };
    } catch {
      // Server startet noch.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill();
  throw new Error(`vite preview wurde nicht rechtzeitig bereit:\n${output}`);
}

function stopPreview(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    const forceKill = setTimeout(() => child.kill('SIGKILL'), 3000);
    child.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

// Läuft im Browser: sammelt Elemente, die rechts über den Viewport hinausragen.
function collectRightOverflow() {
  const limit = window.innerWidth;
  const offenders = [];
  const clipsHorizontally = (element) => {
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      const { overflowX } = getComputedStyle(parent);
      if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') return true;
    }
    return false;
  };
  for (const element of document.body.querySelectorAll('*')) {
    if (element.closest('[hidden], dialog:not([open]), .leaflet-container, svg')) continue;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right > limit + 0.5 && !clipsHorizontally(element)) {
      const classes = typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).join('.')}` : '';
      offenders.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes} (right=${rect.right.toFixed(1)})`);
    }
  }
  return { limit, offenders: offenders.slice(0, 10), total: offenders.length };
}

function collectHeaderGeometry() {
  const header = document.querySelector('.site-header');
  const galleryLink = document.querySelector('.site-nav a[href="#media"]');
  const toggle = document.querySelector('#settings-toggle');
  const tools = document.querySelector('.header-tools');
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const headerRect = header.getBoundingClientRect();
  const linkRect = galleryLink.getBoundingClientRect();
  const buttonRect = toggle.getBoundingClientRect();
  const toolsRect = tools.getBoundingClientRect();
  const navLinksDoNotOverlap = navLinks.slice(1).every((link, index) => {
    const previousRect = navLinks[index].getBoundingClientRect();
    return previousRect.right <= link.getBoundingClientRect().left + 0.5;
  });
  const style = getComputedStyle(header);
  const contentLeft = headerRect.left + parseFloat(style.paddingLeft);
  const contentRight = headerRect.right - parseFloat(style.paddingRight);
  return {
    bottomDelta: Math.abs(buttonRect.bottom - linkRect.bottom),
    withinHeaderPadding: buttonRect.left >= contentLeft - 0.5
      && buttonRect.right <= contentRight + 0.5,
    noOverlap: navLinksDoNotOverlap && linkRect.right <= toolsRect.left + 0.5,
    noHeaderOverflow: header.scrollWidth <= header.clientWidth,
    buttonGeometry: `${buttonRect.left.toFixed(1)}–${buttonRect.right.toFixed(1)}`,
    linkBottom: linkRect.bottom.toFixed(1),
  };
}

function collectTextCollisions(scopeSelector) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return { collisions: [], total: 0 };
  const textSelector = 'h1,h2,h3,h4,h5,h6,p,figcaption,a,button,label,strong,small,time,li,dt,dd,span,legend';
  const ignoredSelector = '.leaflet-container,.visually-hidden,.elevation-badge,.media-gallery-video-play,[aria-hidden="true"]';
  const nodes = [...scope.querySelectorAll(textSelector)].filter((element) => {
    if (element.closest(ignoredSelector)) return false;
    const style = getComputedStyle(element);
    if (style.textOverflow === 'ellipsis') return false;
    return style.display !== 'none' && style.visibility !== 'hidden'
      && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
  }).flatMap((element) => {
    const label = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : ''}`;
    return [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      .flatMap((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()].map((rect) => ({
          element,
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
          label,
          text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 45),
        }));
      });
  });
  const collisions = [];
  for (let first = 0; first < nodes.length; first += 1) {
    for (let second = first + 1; second < nodes.length; second += 1) {
      const a = nodes[first];
      const b = nodes[second];
      if (a.element === b.element) continue;
      const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (overlapX > 1 && overlapY > 1) {
        collisions.push(`${a.label} "${a.text}" × ${b.label} "${b.text}" (${overlapX.toFixed(1)}×${overlapY.toFixed(1)}px)`);
      }
    }
  }
  return { collisions: collisions.slice(0, 10), total: collisions.length };
}

function collectMediaTextOverflow() {
  const media = document.querySelector('#media');
  const selector = 'h1,h2,h3,h4,h5,h6,p,figcaption,a,button,label,strong,small,time,li,dt,dd,span,legend';
  const ignoredSelector = '.visually-hidden,.media-gallery-video-play,[aria-hidden="true"]';
  const hasDirectText = (element) => [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  const offenders = [];
  for (const element of media.querySelectorAll(selector)) {
    if (!hasDirectText(element) || element.closest(ignoredSelector)) continue;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden'
      || style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none'
      || (style.whiteSpace === 'nowrap' && style.overflowX !== 'visible')) continue;
    if (element.clientWidth === 0 || element.clientHeight === 0) continue;
    const horizontal = element.scrollWidth > element.clientWidth + 2;
    const vertical = element.scrollHeight > element.clientHeight + 2;
    if (horizontal || vertical) {
      const label = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : ''}`;
      offenders.push(`${label} "${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 45)}" (scroll=${element.scrollWidth}×${element.scrollHeight}, client=${element.clientWidth}×${element.clientHeight})`);
    }
  }
  const frameErrors = [];
  for (const entry of media.querySelectorAll('.media-gallery-entry:not([hidden])')) {
    const stage = entry.closest('.media-gallery-stage');
    const card = entry.querySelector('.photo-card');
    const frame = entry.querySelector('.photo-button, .media-gallery-video, .media-placeholder');
    if (!stage || !frame) continue;
    const within = (inner, outer) => {
      const a = inner.getBoundingClientRect();
      const b = outer.getBoundingClientRect();
      return a.left >= b.left - 1 && a.right <= b.right + 1
        && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    };
    if (!within(entry, stage)) frameErrors.push('Medieneintrag ragt aus Etappenkarte');
    if (card && !within(frame, card)) frameErrors.push('Medienrahmen ragt aus Fotokarte');
    const image = frame.querySelector('img');
    if (image && !within(image, frame)) frameErrors.push('Bild ragt aus Medienrahmen');
  }
  return {
    text: offenders.slice(0, 10),
    textTotal: offenders.length,
    frames: frameErrors.slice(0, 10),
    frameTotal: frameErrors.length,
  };
}

function collectSettingsHistoryMetrics({ historyId, buttonId, otherHistoryId, otherButtonId }) {
  const dialog = document.querySelector('#settings-dialog');
  const updateButton = document.querySelector('#refresh-app');
  const history = document.getElementById(historyId);
  const button = document.getElementById(buttonId);
  const otherHistory = document.getElementById(otherHistoryId);
  const otherButton = document.getElementById(otherButtonId);
  const dialogRect = dialog.getBoundingClientRect();
  const updateRect = updateButton.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const historyRect = history.getBoundingClientRect();
  const round = (value) => Math.round(value * 10) / 10;
  const textErrors = [];
  for (const element of history.querySelectorAll('li, strong, time, p')) {
    if (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) {
      const label = element.tagName.toLowerCase();
      textErrors.push(`${label} scroll=${element.scrollWidth}×${element.scrollHeight}, client=${element.clientWidth}×${element.clientHeight}`);
    }
  }
  return {
    open: !history.hidden,
    ariaExpanded: button.getAttribute('aria-expanded'),
    otherClosed: otherHistory.hidden && otherButton.getAttribute('aria-expanded') === 'false',
    entryCount: history.querySelectorAll('li').length,
    cardsBelowUpdate: buttonRect.top > updateRect.bottom,
    buttonUnclipped: [button, ...button.querySelectorAll('*')].every(
      (element) => element.scrollWidth <= element.clientWidth + 2
        && element.scrollHeight <= element.clientHeight + 2,
    ),
    noHorizontalOverflow: dialog.scrollWidth <= dialog.clientWidth
      && document.documentElement.scrollWidth <= window.innerWidth,
    historyInsideDialog: historyRect.left >= dialogRect.left - 0.5
      && historyRect.right <= dialogRect.right + 0.5,
    historyNotClipped: history.scrollHeight <= history.clientHeight + 2,
    textErrors,
    buttonGeometry: `${round(buttonRect.top)}–${round(buttonRect.bottom)}px`,
    updateBottom: round(updateRect.bottom),
    historyGeometry: `${round(historyRect.left)}–${round(historyRect.right)}px`,
  };
}

function collectFontStepAlignment() {
  const slider = document.querySelector('#font-size-range');
  const control = document.querySelector('.font-size-control');
  const sliderRect = slider.getBoundingClientRect();
  const thumbSize = parseFloat(getComputedStyle(control).getPropertyValue('--font-range-thumb-size'));
  const values = [...document.querySelectorAll('#font-size-steps li')];
  const fractions = [0, 0.25, 0.5, 0.75, 1];
  const expected = fractions.map((fraction) => sliderRect.left + thumbSize / 2
    + (sliderRect.width - thumbSize) * fraction);
  const actual = values.map((value) => {
    const rect = value.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
  const deltas = actual.map((position, index) => position - expected[index]);
  return {
    count: values.length,
    maxDelta: Math.max(...deltas.map(Math.abs)),
    measurements: deltas.map((delta, index) => `${index + 1}=${delta.toFixed(1)}px`).join(', '),
  };
}

async function runCurrentChangeChecks(page, record, shot) {
  const recordChange = (check, pass, detail) => record(
    check, pass, detail, 'Aktueller Änderungs-Check',
  );
  await page.locator('#font-size-range').evaluate((slider) => {
    slider.value = '5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.documentElement.dataset.fontSize === '5');
  const stopAlignment = await page.evaluate(collectFontStepAlignment);
  recordChange(
    'Einstellungen: Zahlen stehen unter den Rastpunkten 0/25/50/75/100 %',
    stopAlignment.count === 5 && stopAlignment.maxDelta <= 1,
    `max. Abweichung=${stopAlignment.maxDelta.toFixed(1)}px; ${stopAlignment.measurements}`,
  );
  await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    dialog.scrollTop = dialog.scrollHeight;
  });
  await page.waitForTimeout(150);

  const initial = await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    const update = document.querySelector('#refresh-app');
    const cards = [...dialog.querySelectorAll('.version-current-card')];
    const oldHistoryControls = dialog.querySelectorAll('details, summary');
    const allCollapsed = cards.every((card) => card.getAttribute('aria-expanded') === 'false')
      && [...dialog.querySelectorAll('.settings-history')].every((history) => history.hidden);
    return {
      buttonCount: cards.length,
      buttonsValid: cards.every((card) => card.tagName === 'BUTTON'
        && card.type === 'button' && card.hasAttribute('aria-controls')),
      oldControlsRemoved: oldHistoryControls.length === 0
        && !dialog.textContent.includes('App-Versionsverlauf')
        && !dialog.textContent.includes('Service-Worker- / Cache-Verlauf'),
      allCollapsed,
      cardsBelowUpdate: cards.length === 2
        && cards.every((card) => card.getBoundingClientRect().top > update.getBoundingClientRect().bottom),
      noHorizontalOverflow: dialog.scrollWidth <= dialog.clientWidth
        && document.documentElement.scrollWidth <= window.innerWidth,
      fontStep: document.documentElement.dataset.fontSize,
    };
  });
  recordChange(
    'Einstellungen: Versionskarten sind unten, Verlaufs-Leisten entfernt',
    initial.buttonCount === 2 && initial.buttonsValid && initial.oldControlsRemoved
      && initial.allCollapsed && initial.cardsBelowUpdate && initial.noHorizontalOverflow
      && initial.fontStep === '5',
    `Buttons=${initial.buttonCount}; alte Leisten entfernt=${initial.oldControlsRemoved}; `
      + `beide unter Aktualisieren=${initial.cardsBelowUpdate}; Schrift=${initial.fontStep}/5; `
      + `horizontaler Überlauf=${initial.noHorizontalOverflow ? 'nein' : 'ja'}`,
  );
  await shot('settings', 'Einstellungen: Verläufe geschlossen, Schrift 5/5');

  await page.locator('#app-version-toggle').click();
  await page.waitForFunction(() => !document.querySelector('#app-version-history').hidden);
  const appHistory = await page.evaluate(collectSettingsHistoryMetrics, {
    historyId: 'app-version-history',
    buttonId: 'app-version-toggle',
    otherHistoryId: 'service-worker-version-history',
    otherButtonId: 'service-worker-version-toggle',
  });
  recordChange(
    'Einstellungen: App-Version öffnet vollständigen Verlauf ohne Überlauf',
    appHistory.open && appHistory.ariaExpanded === 'true' && appHistory.otherClosed
      && appHistory.cardsBelowUpdate && appHistory.buttonUnclipped
      && appHistory.noHorizontalOverflow && appHistory.historyInsideDialog
      && appHistory.historyNotClipped && appHistory.entryCount > 0
      && appHistory.textErrors.length === 0,
    `Einträge=${appHistory.entryCount}; Karte top/bottom=${appHistory.buttonGeometry}; `
      + `Aktualisieren-bottom=${appHistory.updateBottom}; Verlauf=${appHistory.historyGeometry}; `
      + `horizontal/vertikal unbeschnitten=${appHistory.noHorizontalOverflow && appHistory.historyNotClipped}; `
      + `Textfehler=${appHistory.textErrors.length}`,
  );
  await shot('settings-app-history', 'Einstellungen: App-Verlauf geöffnet, Schrift 5/5');
  await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    dialog.scrollTop = dialog.scrollHeight;
  });
  const appHistoryEnd = await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    return {
      atEnd: Math.abs(dialog.scrollHeight - dialog.clientHeight - dialog.scrollTop) <= 2,
      noHorizontalOverflow: dialog.scrollWidth <= dialog.clientWidth,
    };
  });
  recordChange(
    'Einstellungen: App-Verlauf bleibt bei Schrift 5/5 vollständig erreichbar',
    appHistoryEnd.atEnd && appHistoryEnd.noHorizontalOverflow,
    `Dialog-Ende erreichbar=${appHistoryEnd.atEnd}; horizontaler Überlauf=${appHistoryEnd.noHorizontalOverflow ? 'nein' : 'ja'}`,
  );

  await page.locator('#service-worker-version-toggle').click();
  await page.waitForFunction(() => !document.querySelector('#service-worker-version-history').hidden);
  const cacheHistory = await page.evaluate(collectSettingsHistoryMetrics, {
    historyId: 'service-worker-version-history',
    buttonId: 'service-worker-version-toggle',
    otherHistoryId: 'app-version-history',
    otherButtonId: 'app-version-toggle',
  });
  recordChange(
    'Einstellungen: Cache-Karte wechselt exklusiv zum Cache-Verlauf',
    cacheHistory.open && cacheHistory.ariaExpanded === 'true' && cacheHistory.otherClosed
      && cacheHistory.cardsBelowUpdate && cacheHistory.buttonUnclipped
      && cacheHistory.noHorizontalOverflow && cacheHistory.historyInsideDialog
      && cacheHistory.historyNotClipped && cacheHistory.entryCount > 0
      && cacheHistory.textErrors.length === 0,
    `Einträge=${cacheHistory.entryCount}; Karte top/bottom=${cacheHistory.buttonGeometry}; `
      + `Aktualisieren-bottom=${cacheHistory.updateBottom}; Verlauf=${cacheHistory.historyGeometry}; `
      + `horizontal/vertikal unbeschnitten=${cacheHistory.noHorizontalOverflow && cacheHistory.historyNotClipped}; `
      + `Textfehler=${cacheHistory.textErrors.length}`,
  );
  await shot('settings-cache-history', 'Einstellungen: Cache-Verlauf geöffnet, Schrift 5/5');
  await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    dialog.scrollTop = dialog.scrollHeight;
  });
  const cacheHistoryEnd = await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    return {
      atEnd: Math.abs(dialog.scrollHeight - dialog.clientHeight - dialog.scrollTop) <= 2,
      noHorizontalOverflow: dialog.scrollWidth <= dialog.clientWidth,
    };
  });
  recordChange(
    'Einstellungen: Cache-Verlauf bleibt bei Schrift 5/5 vollständig erreichbar',
    cacheHistoryEnd.atEnd && cacheHistoryEnd.noHorizontalOverflow,
    `Dialog-Ende erreichbar=${cacheHistoryEnd.atEnd}; horizontaler Überlauf=${cacheHistoryEnd.noHorizontalOverflow ? 'nein' : 'ja'}`,
  );

  await page.locator('#service-worker-version-toggle').click();
  const collapsed = await page.evaluate(() => ({
    app: document.querySelector('#app-version-history').hidden,
    cache: document.querySelector('#service-worker-version-history').hidden,
    appExpanded: document.querySelector('#app-version-toggle').getAttribute('aria-expanded'),
    cacheExpanded: document.querySelector('#service-worker-version-toggle').getAttribute('aria-expanded'),
  }));
  recordChange(
    'Einstellungen: erneutes Antippen klappt den Verlauf ein',
    collapsed.app && collapsed.cache && collapsed.appExpanded === 'false'
      && collapsed.cacheExpanded === 'false',
    `App zu=${collapsed.app}; Cache zu=${collapsed.cache}; aria-expanded=false`,
  );

  await page.locator('#font-size-range').evaluate((slider) => {
    slider.value = '2';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.documentElement.dataset.fontSize === '2');
}

async function checkViewport(browser, origin, viewport, results, screenshots) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.mobile ? 2 : 1,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    serviceWorkers: 'block',
    locale: 'de-DE',
  });
  await context.route((url) => url.origin !== origin, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console.error: ${message.text()}`);
  });

  const record = (check, pass, detail, suite = 'Basis-Checks') => results.push({
    viewport: viewport.name, suite, check, pass, detail,
  });
  const shot = async (suffix, caption) => {
    const file = `${viewport.slug}-${suffix}.png`;
    await page.screenshot({ path: path.join(reportDirectory, file) });
    screenshots.push({ viewport: viewport.name, file, caption });
  };

  await page.goto(`${origin}${BASE_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#day-list li', { timeout: 15000 });
  const header = await page.evaluate(collectHeaderGeometry);
  record('Header: Einstellungen rechtsbündig und an Galerie ausgerichtet',
    header.bottomDelta <= 1.5 && header.withinHeaderPadding && header.noOverlap && header.noHeaderOverflow,
    `Button ${header.buttonGeometry}; Galerie-Unterkante=${header.linkBottom}px; Delta=${header.bottomDelta.toFixed(1)}px`);

  for (const view of PAGES) {
    await page.click(`.site-nav a[href="#${view.id}"]`);
    await page.waitForFunction((id) => !document.getElementById(id).hidden, view.id);
    await page.waitForTimeout(300);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    record(`${view.label}: kein horizontaler Überlauf`, metrics.scrollWidth <= metrics.innerWidth,
      `scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}`);
    const overflow = await page.evaluate(collectRightOverflow);
    record(`${view.label}: kein Element über dem rechten Rand`, overflow.total === 0,
      overflow.total === 0 ? `alle rect.right <= ${overflow.limit}` : `${overflow.total} Treffer: ${overflow.offenders.join('; ')}`);
    const collisions = await page.evaluate(collectTextCollisions, `#${view.id}`);
    record(`${view.label}: keine Textkollisionen`, collisions.total === 0,
      collisions.total === 0 ? 'keine Überschneidungen' : `${collisions.total} Treffer: ${collisions.collisions.join('; ')}`);
    await shot(view.id === 'roadbook' ? 'main' : view.id, view.id === 'roadbook' ? 'Hauptansicht (Etappen)' : `Ansicht ${view.label}`);
    if (view.id === 'media') {
      const baseline = await page.evaluate(collectMediaTextOverflow);
      record('Galerie: Text bei Standardschriftstufe nicht abgeschnitten',
        baseline.textTotal === 0 && baseline.frameTotal === 0,
        `Textfehler=${baseline.textTotal}${baseline.text.length ? ` (${baseline.text.join('; ')})` : ''}; Rahmenfehler=${baseline.frameTotal}${baseline.frames.length ? ` (${baseline.frames.join('; ')})` : ''}`);
      const baselineCollisions = await page.evaluate(collectTextCollisions, '#media');
      record('Galerie: keine Textkollisionen bei Standardschriftstufe', baselineCollisions.total === 0,
        baselineCollisions.total === 0 ? 'keine Überschneidungen' : `${baselineCollisions.total} Treffer: ${baselineCollisions.collisions.join('; ')}`);

      await page.locator('#font-size-range').evaluate((slider) => {
        slider.value = '5';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => document.documentElement.dataset.fontSize === '5');
      await page.waitForTimeout(100);
      const largest = await page.evaluate(collectMediaTextOverflow);
      record('Galerie: Text bei Schriftstufe 5/5 nicht abgeschnitten',
        largest.textTotal === 0 && largest.frameTotal === 0,
        `Textfehler=${largest.textTotal}${largest.text.length ? ` (${largest.text.join('; ')})` : ''}; Rahmenfehler=${largest.frameTotal}${largest.frames.length ? ` (${largest.frames.join('; ')})` : ''}`);
      const largestCollisions = await page.evaluate(collectTextCollisions, '#media');
      record('Galerie: keine Textkollisionen bei Schriftstufe 5/5', largestCollisions.total === 0,
        largestCollisions.total === 0 ? 'keine Überschneidungen' : `${largestCollisions.total} Treffer: ${largestCollisions.collisions.join('; ')}`);
      await page.locator('#font-size-range').evaluate((slider) => {
        slider.value = '2';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => document.documentElement.dataset.fontSize === '2');
    }
  }

  await page.click('.site-nav a[href="#roadbook"]');
  await page.click('#settings-toggle');
  await page.waitForSelector('#settings-dialog[open]');
  await page.waitForFunction(() => !document.querySelector('#version-current').textContent.includes('lädt'));
  await page.waitForTimeout(200);

  const settingsBase = await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    const cards = [...dialog.querySelectorAll('.version-current-card')];
    const dialogRect = dialog.getBoundingClientRect();
    return {
      appVersion: document.querySelector('#version-current').textContent.trim(),
      cacheVersion: document.querySelector('#service-worker-current').textContent.trim(),
      cardCount: cards.length,
      cardsAreButtons: cards.every((card) => card.tagName === 'BUTTON' && card.type === 'button'),
      insideDialog: cards.every((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left >= dialogRect.left - 0.5 && rect.right <= dialogRect.right + 0.5;
      }),
      noHorizontalScroll: dialog.scrollWidth <= dialog.clientWidth,
      initialStateCollapsed: cards.every((card) => card.getAttribute('aria-expanded') === 'false')
        && [...dialog.querySelectorAll('.settings-history')].every((history) => history.hidden),
    };
  });
  record('Einstellungen: Versionsstände und Karten-Grundstruktur',
    settingsBase.cardCount === 2 && settingsBase.cardsAreButtons && settingsBase.insideDialog
      && settingsBase.noHorizontalScroll && settingsBase.initialStateCollapsed
      && /^v\d/.test(settingsBase.appVersion) && /^v\d+$/.test(settingsBase.cacheVersion),
    `App=${settingsBase.appVersion}; Cache=${settingsBase.cacheVersion}; `
      + `2 Buttons=${settingsBase.cardsAreButtons}; Verläufe geschlossen=${settingsBase.initialStateCollapsed}`);

  const fontSteps = [];
  await page.focus('#font-size-range');
  await page.keyboard.press('Home');
  for (let step = 1; step <= 5; step += 1) {
    if (step > 1) await page.keyboard.press('ArrowRight');
    fontSteps.push(await page.evaluate(() => {
      const box = document.querySelector('#settings-dialog');
      return {
        data: document.documentElement.dataset.fontSize,
        value: document.querySelector('#font-size-range').value,
        label: document.querySelector('#font-size-value').textContent.trim(),
        stored: Object.values(localStorage).includes(document.documentElement.dataset.fontSize),
        bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth && box.scrollWidth <= box.clientWidth,
      };
    }));
  }
  const fontOk = fontSteps.every((s, i) => s.data === String(i + 1) && s.value === String(i + 1)
    && s.label.startsWith(`${i + 1}/5`) && s.stored && s.noOverflow);
  const sizesGrow = fontSteps.every((s, i) => i === 0 || s.bodyFont >= fontSteps[i - 1].bodyFont);
  record('Einstellungen: 5-Stufen-Schriftregler', fontOk && sizesGrow,
    fontSteps.map((s, i) => `Stufe ${i + 1}: "${s.label}", body ${s.bodyFont}px`).join(' | '));
  // Standardstufe 2 wiederherstellen, damit der Screenshot den Normalzustand zeigt.
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');

  await runCurrentChangeChecks(page, record, shot);
  await page.evaluate(() => {
    const dialog = document.querySelector('#settings-dialog');
    dialog.scrollTop = dialog.scrollHeight;
  });
  await page.waitForTimeout(200);
  const afterScroll = await page.evaluate(() => {
    const box = document.querySelector('#settings-dialog');
    return {
      scrollable: box.scrollHeight > box.clientHeight,
      atEnd: Math.abs(box.scrollHeight - box.clientHeight - box.scrollTop) <= 2,
      noHorizontal: box.scrollWidth <= box.clientWidth,
    };
  });
  record('Einstellungen: Dialog scrollt ohne seitlichen Überlauf', afterScroll.atEnd && afterScroll.noHorizontal,
    `scrollbar nötig=${afterScroll.scrollable}, Ende erreichbar=${afterScroll.atEnd}`);

  record('Keine Laufzeit- oder Konsolenfehler', runtimeErrors.length === 0,
    runtimeErrors.length === 0 ? '0 pageerror / console.error' : runtimeErrors.slice(0, 5).join(' | '));
  await context.close();
}

function renderReport(results, screenshots, startedAt) {
  const failed = results.filter((r) => !r.pass);
  const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const lines = [
    '# Visueller Prüfbericht – Balkan-Ride 2027',
    '',
    `- **Zeitstempel:** ${startedAt.toISOString()}`,
    `- **Gesamtergebnis:** ${failed.length === 0 ? 'PASS' : `FAIL (${failed.length} von ${results.length} Prüfungen)`}`,
    `- **Viewports:** ${VIEWPORTS.map((v) => `${v.name} (${v.width} × ${v.height})`).join(', ')}`,
    `- **Seiten:** ${PAGES.map((p) => `${p.label} (#${p.id})`).join(', ')}`,
    '- **Hinweis:** Externe Ressourcen (Kartenkacheln, Fotos, Videovorschauen) werden durch ein transparentes Pixel ersetzt; der Service Worker ist blockiert.',
    '- **Zusatzprüfungen:** Header-Ausrichtung in allen Viewports; Textkollisionen in Etappen, Galerie und Logistik; Galerie-Textüberlauf und Medienrahmen bei Standardschrift (2/5) sowie größter Schriftstufe (5/5). Bewusste Overlay-Badges und der Play-Button sind ausgenommen.',
  ];
  for (const suite of ['Basis-Checks', 'Aktueller Änderungs-Check']) {
    lines.push(
      '',
      `## ${suite}`,
      '',
      '| Viewport | Prüfung | Ergebnis | Messwerte |',
      '| --- | --- | --- | --- |',
      ...results.filter((result) => result.suite === suite)
        .map((r) => `| ${cell(r.viewport)} | ${cell(r.check)} | ${r.pass ? 'PASS' : 'FAIL'} | ${cell(r.detail)} |`),
    );
  }
  lines.push('', '## Screenshots');
  for (const viewport of VIEWPORTS) {
    lines.push('', `### ${viewport.name} (${viewport.width} × ${viewport.height})`, '');
    for (const entry of screenshots.filter((s) => s.viewport === viewport.name)) {
      lines.push(`**${entry.caption}**`, '', `![${viewport.name} – ${entry.caption}](./${entry.file})`, '');
    }
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const startedAt = new Date();
  await rm(reportDirectory, { recursive: true, force: true });
  await mkdir(reportDirectory, { recursive: true });
  const results = [];
  const screenshots = [];
  const { child, origin } = await startPreview();
  let browser;
  try {
    browser = await chromium.launch();
    for (const viewport of VIEWPORTS) {
      try {
        await checkViewport(browser, origin, viewport, results, screenshots);
      } catch (error) {
        results.push({ viewport: viewport.name, check: 'Prüflauf', pass: false, detail: error.message.split('\n')[0] });
      }
    }
  } finally {
    if (browser) await browser.close();
    await stopPreview(child);
  }
  await writeFile(path.join(reportDirectory, 'REPORT.md'), renderReport(results, screenshots, startedAt));
  const failed = results.filter((r) => !r.pass);
  console.log(`${results.length - failed.length}/${results.length} Prüfungen bestanden. Bericht: web/.visual-report/REPORT.md`);
  for (const r of failed) console.error(`FAIL [${r.viewport}] ${r.check}: ${r.detail}`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
