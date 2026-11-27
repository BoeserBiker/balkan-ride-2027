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
  { id: 'start', label: 'Tourübersicht', trigger: '.brand' },
  { id: 'roadbook', label: 'Etappen' },
  { id: 'media', label: 'Galerie' },
  { id: 'logistics', label: 'Logistik' },
];
const VIEWPORTS = [
  { slug: 'iphone-12-mini', name: 'iPhone 12 mini', width: 375, height: 812, mobile: true },
  { slug: 'android-6-4', name: 'Android 6,4 Zoll', width: 412, height: 915, mobile: true },
  { slug: 'boundary-767', name: 'Grenze 767', width: 767, height: 1024, mobile: false },
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

// Läuft im Browser: Text, der im eigenen Kasten abgeschnitten wird (Bereichsvariante für die Tourübersicht).
function collectTextClipping(scopeSelector) {
  const scope = document.querySelector(scopeSelector);
  const selector = 'h1,h2,h3,h4,h5,h6,p,figcaption,a,button,label,strong,small,time,li,dt,dd,span,legend';
  const hasDirectText = (element) => [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  const offenders = [];
  for (const element of scope.querySelectorAll(selector)) {
    if (!hasDirectText(element) || element.closest('.visually-hidden,[aria-hidden="true"]')) continue;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.display === 'inline'
      || style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none'
      || (style.whiteSpace === 'nowrap' && style.overflowX !== 'visible')) continue;
    if (element.clientWidth === 0 || element.clientHeight === 0) continue;
    if (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) {
      offenders.push(`${element.tagName.toLowerCase()}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : ''} "${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 45)}" (scroll=${element.scrollWidth}×${element.scrollHeight}, client=${element.clientWidth}×${element.clientHeight})`);
    }
  }
  return { offenders: offenders.slice(0, 10), total: offenders.length };
}

// Läuft im Browser: Kontrast aller sichtbaren Texte (WCAG: 4,5:1, große Schrift 3:1) gegen den tatsächlichen Hintergrund.
function collectContrast(scopeSelector) {
  const parse = (value) => {
    const match = /^rgba?\(([^)]+)\)$/.exec(value);
    if (!match) return null;
    const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const background = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const color = parse(getComputedStyle(node).backgroundColor);
      if (color && color.a > 0) layers.push(color);
      if (color && color.a >= 1) break;
    }
    let result = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : { r: 255, g: 255, b: 255, a: 1 };
    while (layers.length) result = over(layers.pop(), result);
    return result;
  };
  const luminance = ({ r, g, b }) => {
    const channel = (value) => {
      const unit = value / 255;
      return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const scope = document.querySelector(scopeSelector);
  const hasDirectText = (element) => [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  let minimum = Infinity;
  let checked = 0;
  const offenders = [];
  for (const element of scope.querySelectorAll('h1,h2,h3,p,li,a,button,label,dt,dd,small,span,legend')) {
    if (!hasDirectText(element)) continue;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) continue;
    const foreground = parse(style.color);
    if (!foreground) continue;
    const surface = background(element);
    const text = over({ ...foreground, a: foreground.a * Number(style.opacity) }, surface);
    const [light, dark] = [luminance(text), luminance(surface)].sort((a, b) => b - a);
    const ratio = (light + 0.05) / (dark + 0.05);
    const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
    checked += 1;
    minimum = Math.min(minimum, ratio);
    if (ratio < (large ? 3 : 4.5)) {
      offenders.push(`${element.tagName.toLowerCase()}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/).join('.')}` : ''} "${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}" ${ratio.toFixed(2)}:1`);
    }
  }
  return { checked, minimum: Number.isFinite(minimum) ? minimum : 0, offenders: offenders.slice(0, 5), total: offenders.length };
}

// Läuft im Browser: Größe der angegebenen Bedienelemente (nur sichtbare).
function collectTargetSizes(selectors) {
  const sizes = [];
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      sizes.push({ selector, width: rect.width, height: rect.height });
    }
  }
  const small = sizes.filter(({ width, height }) => width < 44 - 0.5 || height < 44 - 0.5);
  return {
    count: sizes.length,
    smallest: sizes.length ? Math.min(...sizes.map(({ width, height }) => Math.min(width, height))) : 0,
    small: small.slice(0, 5).map(({ selector, width, height }) => `${selector} ${width.toFixed(1)}×${height.toFixed(1)}`),
    smallTotal: small.length,
  };
}

async function setFontStep(page, step) {
  await page.locator('#font-size-range').evaluate((slider, value) => {
    slider.value = value;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, String(step));
  await page.waitForFunction((value) => document.documentElement.dataset.fontSize === value, String(step));
}

async function openView(page, id) {
  await page.waitForFunction((view) => !document.getElementById(view).hidden, id);
  await page.waitForTimeout(150);
}

const roadbookState = () => ({
  hash: location.hash,
  startHidden: document.getElementById('start').hidden,
  roadbookVisible: !document.getElementById('roadbook').hidden,
  activeDay: [...document.querySelectorAll('#day-list .day-link')].findIndex((button) => button.getAttribute('aria-current') === 'step'),
  map: (() => {
    const rect = document.querySelector('#map').getBoundingClientRect();
    const visiblePins = [...document.querySelectorAll('.day-map-pin')].filter((pin) => {
      const box = pin.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
    }).length;
    return { width: Math.round(rect.width), height: Math.round(rect.height), visiblePins };
  })(),
});

// Einstiegsseite: Inhalte, Einstieg ins Roadbook, Rücksprung, Touch-Ziele, Kontrast und rein informativer Selbstcheck.
async function runLandingChecks(page, record, shot) {
  const recordChange = (check, pass, detail) => record(check, pass, detail, 'Aktueller Änderungs-Check');
  await page.click('.brand');
  await openView(page, 'start');

  const content = await page.evaluate(() => {
    const start = document.getElementById('start');
    const contact = start.querySelector('a.tour-contact');
    return {
      headings: start.querySelectorAll('h1').length,
      facts: [...start.querySelectorAll('.tour-facts dt')].map((term) => term.textContent.trim()),
      factsFilled: [...start.querySelectorAll('.tour-facts dd')].every((value) => /\d/.test(value.textContent)),
      countries: start.querySelectorAll('.tour-chips li').length,
      highlights: start.querySelectorAll('.tour-card-list a[data-open-day]').length,
      itinerary: start.querySelectorAll('.tour-itinerary a[data-open-day]').length,
      days: document.querySelectorAll('#day-list li').length,
      selfCheck: start.querySelectorAll('input[data-selfcheck]').length,
      contactSecure: Boolean(contact) && contact.href.startsWith('https://')
        && contact.rel.includes('noopener') && contact.target === '_blank',
      contactLast: Boolean(contact) && Boolean(start.querySelector('.tour-contact-footer'))
        && contact.closest('.tour-join') === null
        && start.lastElementChild === contact.closest('.tour-contact-footer')
        && Boolean(start.querySelector('.tour-selfcheck .tour-note')?.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING)
        && Boolean(start.querySelector('.tour-itinerary')?.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING),
      status: start.querySelectorAll('.tour-status-list li').length,
      badges: [...start.querySelectorAll('.tour-card-list li')].every((card) => card.querySelector('.tour-country')?.textContent.trim()),
      info: [...start.querySelectorAll('.tour-info-link')].every((link) => link.hostname === 'de.wikipedia.org'
        && link.target === '_blank' && link.rel.includes('noopener') && link.rel.includes('noreferrer')
        && !link.closest('a[data-open-day]')),
      personal: /Dein Überblick/.test(start.textContent) && !/\b(Euer|Eure|Euch|wir|uns)\b/i.test(start.textContent),
      booking: /Fährverbindungen werden vorab gebucht/.test(start.textContent)
        && /Basislager bei Villach.*letzte Hotel bei Igoumenitsa.*voraussichtlich ebenfalls vorgebucht/s.test(start.textContent),
    };
  });
  recordChange('Tourübersicht: Pflichtinhalte aus den Projektdaten vorhanden',
    content.headings === 1 && content.facts.length >= 3 && content.factsFilled && content.countries > 0
      && content.highlights > 0 && content.itinerary === content.days && content.itinerary > 0
      && content.contactSecure && content.contactLast && content.selfCheck > 0 && content.status > 0
      && content.badges && content.info && content.personal && content.booking,
    `Kennzahlen=${content.facts.join('/')}; Länder=${content.countries}; Highlights=${content.highlights}; `
      + `Reiseverlauf=${content.itinerary}/${content.days} Etappen; Kontakt https=${content.contactSecure}, letztes Element nach Selbstcheck=${content.contactLast}; `
      + `Selbstcheck=${content.selfCheck}; Planungshinweise=${content.status}; Länder/Infos=${content.badges}/${content.info}; Du=${content.personal}; Buchungen=${content.booking}`);

  const breakdown = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('#start .tour-breakdown')].filter((block) => block.getBoundingClientRect().width > 0);
    const block = visible[0];
    const rect = block?.getBoundingClientRect();
    const subtitle = document.querySelector('.tour-intro-mobile');
    return {
      blocks: visible.length,
      lines: [...(block?.querySelectorAll('p') ?? [])].map((line) => line.textContent.trim()),
      inside: Boolean(rect) && rect.left >= 0 && rect.right <= window.innerWidth + 1,
      mobileSubtitle: getComputedStyle(subtitle).display === 'none' ? null : subtitle.textContent.trim(),
      oldSubtitle: /Deine Tour\. Dein Abenteuer\./.test(document.getElementById('start').textContent),
    };
  });
  recordChange('Tourübersicht: Kilometer- und Etappenaufschlüsselung sowie Untertitel',
    breakdown.blocks === 1 && breakdown.inside && breakdown.lines.length === 2 && !breakdown.oldSubtitle
      && breakdown.lines[0] === 'ca. 4.825 km gesamt · ca. 2.823 km Motorrad · Fähre ohne Kilometerangabe · ca. 2.002 km Auto mit Anhänger'
      && breakdown.lines[1] === '22 Etappen · 4 Auto · 17 Motorrad · 1 Fähre'
      && (page.viewportSize().width >= 768 || breakdown.mobileSubtitle === 'Unsere Tour, dein Abenteuer!'),
    `${breakdown.lines.join(' | ')}; Untertitel mobil=${breakdown.mobileSubtitle ?? 'ausgeblendet (Desktop)'}`);
  const firstScreen = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, height: box.height };
    };
    const hero = document.querySelector('.tour-hero');
    const main = document.querySelector('.tour-hero-main');
    const facts = document.querySelector('.tour-facts-block');
    const map = document.querySelector('.tour-map-panel');
    return {
      viewport: window.innerHeight,
      scrollY: window.scrollY,
      header: rect('.site-header'),
      hero: rect('.tour-hero'),
      heroMinHeight: parseFloat(getComputedStyle(hero).minHeight),
      headerVariable: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
      topPadding: parseFloat(getComputedStyle(document.querySelector('.tour-start')).getPropertyValue('--tour-start-top')),
      main: rect('.tour-hero-main'),
      facts: rect('.tour-facts-block'),
      factsVisible: getComputedStyle(facts).display !== 'none' && facts.getBoundingClientRect().width > 0,
      copy: rect('.tour-hero-copy'),
      map: rect('.tour-map-panel'),
      mapVisible: getComputedStyle(map).display !== 'none' && map.getBoundingClientRect().width > 0,
      cta: rect('.tour-cta-row'),
      join: rect('.tour-join'),
      heroDisplay: getComputedStyle(hero).display,
      heroDirection: getComputedStyle(hero).flexDirection,
      heroJustify: getComputedStyle(hero).justifyContent,
      heroBoxSizing: getComputedStyle(hero).boxSizing,
      heroBottomPadding: parseFloat(getComputedStyle(hero).paddingBottom),
      mainAreas: getComputedStyle(main).gridTemplateAreas,
    };
  });
  recordChange('Tourübersicht: Hero füllt den ersten Viewport unter dem Header; Mitfahren beginnt danach',
    firstScreen.scrollY === 0
      && firstScreen.heroDisplay === 'flex' && firstScreen.heroDirection === 'column'
      && firstScreen.heroJustify === 'space-between' && firstScreen.heroBoxSizing === 'border-box'
      && firstScreen.heroBottomPadding === 16
      && Math.abs(firstScreen.heroMinHeight - (firstScreen.viewport - firstScreen.headerVariable - firstScreen.topPadding)) <= 1
      && firstScreen.cta.bottom <= firstScreen.viewport && firstScreen.cta.bottom >= firstScreen.viewport - 40
      && firstScreen.join.top >= firstScreen.viewport
      && (page.viewportSize().width < 768
        ? firstScreen.mainAreas.includes('highlights') && firstScreen.mainAreas.includes('map')
          && firstScreen.factsVisible === false && firstScreen.mapVisible
        : firstScreen.factsVisible && firstScreen.mapVisible
          && firstScreen.facts.right <= firstScreen.map.left + 1
          && firstScreen.facts.top >= firstScreen.copy.bottom - 1),
    `Hero=${Math.round(firstScreen.hero.height)}px/min ${Math.round(firstScreen.heroMinHeight)}px; Main=${Math.round(firstScreen.main.height)}px; Facts=${Math.round(firstScreen.facts.height)}px; Karte=${Math.round(firstScreen.map.height)}px; CTA unten=${Math.round(firstScreen.cta.bottom)}/${firstScreen.viewport}px; Mitfahren oben=${Math.round(firstScreen.join.top)}px; Header=${Math.round(firstScreen.header.height)}px; Kennzahlen sichtbar=${firstScreen.factsVisible}`);

  await page.waitForFunction(() => !document.querySelector('#tour-map-status').textContent.includes('werden geladen'));
  const tourMap = await page.evaluate(async () => {
    const hero = document.querySelector('.tour-hero-copy').getBoundingClientRect();
    const map = document.querySelector('#tour-map').getBoundingClientRect();
    const highlight = document.querySelector('.tour-mobile-highlights').getBoundingClientRect();
    const summary = document.querySelector('.tour-mobile-summary').getBoundingClientRect();
    const points = [...document.querySelectorAll('#tour-map .tour-map-point')];
    const attribution = document.querySelector('#tour-map .leaflet-control-attribution').getBoundingClientRect();
    const visiblePoints = points.filter((point) => {
      const rect = point.getBoundingClientRect();
      const x = (rect.left + rect.right) / 2;
      const y = (rect.top + rect.bottom) / 2;
      const covered = x >= attribution.left && x <= attribution.right && y >= attribution.top && y <= attribution.bottom;
      return x >= map.left && x <= map.right && y >= map.top && y <= map.bottom && !covered;
    }).length;
    const days = document.querySelectorAll('#day-list li').length;
    const expectedTracks = (await Promise.all(Array.from({ length: days }, async (_, index) => {
      const response = await fetch(`${location.pathname}assets/gpx/tag-${String(index + 1).padStart(2, '0')}.gpx`);
      if (!response.ok) throw new Error(`GPX-Prüfung: HTTP ${response.status}`);
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      return [...xml.getElementsByTagNameNS('*', 'trkseg')]
        .filter((segment) => segment.getElementsByTagNameNS('*', 'trkpt').length > 1).length;
    }))).reduce((sum, count) => sum + count, 0);
    return {
      width: map.width, height: map.height, left: map.left, top: map.top, heroRight: hero.right, heroBottom: hero.bottom,
      copyBottom: document.querySelector('.tour-hero-copy').getBoundingClientRect().bottom,
      mapBottom: document.querySelector('.tour-map-panel').getBoundingClientRect().bottom,
      highlight: { left: highlight.left, right: highlight.right, top: highlight.top, bottom: highlight.bottom },
      summary: { top: summary.top, bottom: summary.bottom },
      cta: (() => { const r = document.querySelector('.tour-cta').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; })(),
      heroRightEdge: document.querySelector('.tour-hero').getBoundingClientRect().right,
      mobileInfo: [...document.querySelectorAll('.tour-mobile-highlights li')].map((row) => {
        const links = [...row.querySelectorAll('a')].map((a) => {
          const r = a.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width, height: r.height, target: a.target, rel: a.rel,
            host: a.hostname, protocol: a.protocol, text: a.textContent.trim().replace(/\s+/g, ' '), underlined: getComputedStyle(a).textDecorationLine.includes('underline') };
        });
        return { links, text: row.textContent.trim().replace(/\s+/g, ' ') };
      }),
      route: (() => {
        const element = document.querySelector('.tour-mobile-route');
        const r = element.getBoundingClientRect();
        const row = getComputedStyle(document.querySelector('.tour-cta-row'));
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, visible: r.width > 0 && getComputedStyle(element).display !== 'none',
          text: element.textContent.trim(), display: row.display, align: row.alignItems, justify: row.justifyContent, gap: row.columnGap };
      })(),
      pointSizes: [...new Set(points.map((point) => Math.round(point.getBoundingClientRect().width)))],
      pointSpread: (() => {
        const centres = points.map((point) => { const r = point.getBoundingClientRect(); return [(r.left + r.right) / 2, (r.top + r.bottom) / 2]; });
        const xs = centres.map(([x]) => x); const ys = centres.map(([, y]) => y);
        return { spanX: (Math.max(...xs) - Math.min(...xs)) / map.width, spanY: (Math.max(...ys) - Math.min(...ys)) / map.height,
          marginLeft: Math.min(...xs) - map.left, marginTop: Math.min(...ys) - map.top, marginRight: map.right - Math.max(...xs) };
      })(),
      summaryText: document.querySelector('.tour-mobile-summary').textContent,
      ctaText: document.querySelector('.tour-cta').innerText.trim().replace(/\s+/g, ' '),
      zoomVisible: document.querySelector('#tour-map .leaflet-control-zoom').getBoundingClientRect().width > 0,
      points: points.length, visiblePoints, expectedTracks,
      tracks: document.querySelectorAll('#tour-map .tour-map-track').length,
      ferry: (() => {
        const path = document.querySelector('#tour-map .tour-map-ferry');
        const rect = path?.getBoundingClientRect();
        return { count: document.querySelectorAll('#tour-map .tour-map-ferry').length,
          vertices: (path?.getAttribute('d') ?? '').match(/[ML]/g)?.length ?? 0,
          dash: path?.getAttribute('stroke-dasharray'), width: rect?.width, height: rect?.height,
          stroke: path?.getAttribute('stroke'), strokeWidth: path?.getAttribute('stroke-width'), opacity: path?.getAttribute('stroke-opacity'),
          outline: document.querySelector('#tour-map .tour-map-ferry-outline')?.getAttribute('stroke'),
          outlineWidth: document.querySelector('#tour-map .tour-map-ferry-outline')?.getAttribute('stroke-width'),
          legendColor: getComputedStyle(document.querySelector('#tour-ferry-legend span'), '::after').backgroundImage,
          legendHeight: getComputedStyle(document.querySelector('#tour-ferry-legend span'), '::after').height,
          legend: !document.querySelector('#tour-ferry-legend').hidden && document.querySelector('#tour-ferry-legend').textContent.trim() };
      })(),
      days,
      status: document.querySelector('#tour-map-status').textContent,
    };
  });
  recordChange('Tourkarte: alle Tagespunkte und verfügbaren Tracks im responsiven Hero',
    tourMap.width >= (page.viewportSize().width < 768 ? 130 : 200) && tourMap.height >= 160 && tourMap.points === 2 * tourMap.days
      && tourMap.visiblePoints === tourMap.points && tourMap.tracks === tourMap.expectedTracks && tourMap.tracks > 0
      && (page.viewportSize().width >= 768 ? tourMap.left >= tourMap.heroRight : tourMap.top >= tourMap.heroBottom)
      && /vorläufige Planungsdaten/.test(tourMap.status),
    `Karte=${Math.round(tourMap.width)}×${Math.round(tourMap.height)}px; sichtbare Punkte=${tourMap.visiblePoints}/${2 * tourMap.days}; Tracks=${tourMap.tracks}/${tourMap.expectedTracks}; ${tourMap.status}`);

  recordChange('Tourübersicht: kompakter mobiler Einstieg und Desktop-Layout',
    page.viewportSize().width < 768
      ? tourMap.cta.top >= tourMap.summary.bottom && tourMap.summary.top >= Math.max(tourMap.mapBottom, tourMap.highlight.bottom)
        && tourMap.highlight.right <= tourMap.left && Math.abs(tourMap.cta.right - tourMap.heroRightEdge) <= 1
        && tourMap.cta.width < page.viewportSize().width / 2 && tourMap.ctaText === 'Zur Tour →'
        && tourMap.height >= 170 && tourMap.height <= 200 && !tourMap.zoomVisible
        && tourMap.mobileInfo.length === 6 && tourMap.mobileInfo.every(({ links, text }) => links.length === 1 && !/Wiki\b/.test(text)
          && /^\d{2} \S/.test(links[0].text) && links[0].text === text && links[0].target === '_blank' && links[0].rel.includes('noopener') && links[0].rel.includes('noreferrer')
          && links[0].protocol === 'https:' && links[0].host === 'de.wikipedia.org' && links[0].underlined
          && links[0].width >= 44 && links[0].height >= 44)
        && tourMap.route.visible && tourMap.route.text === 'Recklinghausen ↔ Recklinghausen'
        && tourMap.route.display === 'flex' && tourMap.route.align === 'center' && tourMap.route.justify === 'space-between' && tourMap.route.gap === '12px'
        && tourMap.route.right <= tourMap.cta.left && tourMap.route.left < tourMap.cta.left - 40
        && tourMap.route.top < tourMap.cta.bottom && tourMap.route.bottom > tourMap.cta.top
        && tourMap.route.top >= tourMap.summary.bottom - 1 && !/Recklinghausen/.test(tourMap.summaryText)
        && /September 2027/.test(tourMap.summaryText) && /22 Tage/.test(tourMap.summaryText)
        && /4\.825 km gesamt/.test(tourMap.summaryText) && /2\.823 km Motorrad/.test(tourMap.summaryText)
        && /9 Länder/.test(tourMap.summaryText)
        && (page.viewportSize().width > 412 || tourMap.cta.bottom <= page.viewportSize().height)
      : tourMap.cta.top >= tourMap.copyBottom && tourMap.cta.left < tourMap.left && tourMap.height >= 290 && !tourMap.route.visible,
    `Karte=${Math.round(tourMap.width)}×${Math.round(tourMap.height)}; Highlights=${tourMap.mobileInfo.length} (Titel=Wikipedia-Link); Route=${tourMap.route.text} (${Math.round(tourMap.route.left)}–${Math.round(tourMap.route.right)}) neben Button=${tourMap.ctaText} (${Math.round(tourMap.cta.left)}–${Math.round(tourMap.cta.right)}, unten ${Math.round(tourMap.cta.bottom)}px); Zoom=${tourMap.zoomVisible}`);
  recordChange('Tourkarte: enger Ausschnitt mit 14 px Rand und feinen Punkten (r=2,5)',
    tourMap.pointSizes.length === 1 && tourMap.pointSizes[0] <= 6
      && Math.max(tourMap.pointSpread.spanX, tourMap.pointSpread.spanY) >= 0.6
      && tourMap.pointSpread.marginLeft >= 10 && tourMap.pointSpread.marginTop >= 10 && tourMap.pointSpread.marginRight >= 10,
    `Punktbreite=${tourMap.pointSizes}px; Ausdehnung=${Math.round(tourMap.pointSpread.spanX * 100)}%×${Math.round(tourMap.pointSpread.spanY * 100)}%; Rand links/oben/rechts=${Math.round(tourMap.pointSpread.marginLeft)}/${Math.round(tourMap.pointSpread.marginTop)}/${Math.round(tourMap.pointSpread.marginRight)}px`);
  recordChange('Tourkarte: gestrichelte Fährverbindung mit Legende',
    tourMap.ferry.count === 1 && tourMap.ferry.vertices === 7 && Boolean(tourMap.ferry.dash) && tourMap.ferry.width > 5 && tourMap.ferry.height > 5
      && tourMap.ferry.legend === 'Fährverbindung (ca. Linie)' && tourMap.ferry.stroke === '#ffc64a'
      && tourMap.ferry.strokeWidth === '5' && tourMap.ferry.opacity === '0.95'
      && tourMap.ferry.outline === '#12151b' && tourMap.ferry.outlineWidth === '9'
      && tourMap.ferry.legendColor.includes('rgb(255, 198, 74)') && tourMap.ferry.legendHeight === '5px',
    `Linien=${tourMap.ferry.count}; Adria-Stützpunkte=${tourMap.ferry.vertices}; Striche=${tourMap.ferry.dash}; Vordergrund=${tourMap.ferry.stroke}/${tourMap.ferry.strokeWidth}px; Kontur=${tourMap.ferry.outline}/${tourMap.ferry.outlineWidth}px; Legende=${tourMap.ferry.legend}`);

  const targets = await page.evaluate(collectTargetSizes, [
    '#start .tour-cta', '#start .tour-contact', '#start .tour-card-list a', '#start .tour-mobile-highlights a', '#start .tour-itinerary a', '#start .tour-check', '#tour-map .leaflet-control-zoom a',
  ]);
  recordChange('Tourübersicht: Bedienelemente mindestens 44 × 44 px',
    targets.count > 0 && targets.smallTotal === 0,
    `${targets.count} Elemente; kleinste Kantenlänge=${targets.smallest.toFixed(1)}px${targets.small.length ? `; zu klein: ${targets.small.join('; ')}` : ''}`);

  const themes = [];
  for (const theme of ['default', 'schalke', 'bvb']) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    themes.push({ theme, ...(await page.evaluate(collectContrast, '#start')) });
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = 'default'; });
  recordChange('Tourübersicht: Textkontrast mindestens 4,5:1 (3:1 bei großer Schrift) in allen Farbschemata',
    themes.every((entry) => entry.checked > 0 && entry.total === 0),
    themes.map((entry) => `${entry.theme}: ${entry.checked} Texte, min. ${entry.minimum.toFixed(2)}:1${entry.offenders.length ? ` (${entry.offenders.join('; ')})` : ''}`).join(' | '));

  await page.locator('.tour-cta').scrollIntoViewIfNeeded();
  if (await page.evaluate(() => window.scrollY) === 0) {
    await page.evaluate(() => window.scrollTo({ top: 60, behavior: 'instant' }));
  }
  const ctaScroll = await page.evaluate(() => window.scrollY);
  await page.click('.tour-cta');
  await openView(page, 'roadbook');
  const entered = await page.evaluate(roadbookState);
  recordChange('Tourübersicht: Einstieg führt in die Roadbook-Tage mit sichtbarer Karte',
    entered.hash === '#roadbook' && entered.startHidden && entered.roadbookVisible && entered.activeDay === 0
      && entered.map.width >= 200 && entered.map.height >= 160 && entered.map.visiblePins >= 1,
    `hash=${entered.hash}; Etappe=${entered.activeDay + 1}; Karte=${entered.map.width}×${entered.map.height}px; Pins im Ausschnitt=${entered.map.visiblePins}`);

  const backTargets = await page.evaluate(collectTargetSizes, ['.overview-link']);
  recordChange('Roadbook: Rücksprung zur Tourübersicht sichtbar und mindestens 44 px hoch',
    backTargets.count === 1 && backTargets.smallTotal === 0,
    `${backTargets.count} sichtbarer Link; Größe=${backTargets.smallest.toFixed(1)}px`);
  await page.locator('.overview-link:visible').click();
  await openView(page, 'start');
  const back = await page.evaluate(roadbookState);
  const backMap = await page.locator('#tour-map').boundingBox();
  const ctaReturn = await page.evaluate(() => window.scrollY);
  recordChange('Roadbook: Rücksprung zeigt die Tourübersicht',
    back.hash === '#start' && !back.startHidden && !back.roadbookVisible && backMap.width >= (page.viewportSize().width < 768 ? 130 : 200) && backMap.height >= 160,
    `hash=${back.hash}; Tourkarte=${Math.round(backMap.width)}×${Math.round(backMap.height)}px`);

  const itineraryLink = page.locator('.tour-itinerary a[data-open-day="10"]');
  await itineraryLink.scrollIntoViewIfNeeded();
  const itineraryScroll = await page.evaluate(() => window.scrollY);
  await itineraryLink.click();
  await openView(page, 'roadbook');
  const opened = await page.evaluate(roadbookState);
  await page.goBack();
  await openView(page, 'start');
  const historyScroll = await page.evaluate(() => window.scrollY);
  const history = await page.evaluate(roadbookState);
  await page.goForward();
  await openView(page, 'roadbook');
  await page.goBack();
  await openView(page, 'start');
  const repeatedHistoryScroll = await page.evaluate(() => window.scrollY);
  // Mobil sind die Highlight-Titel Wikipedia-Links; die Etappe öffnet dort über den Reiseverlauf.
  const highlightLink = page.locator('.tour-card-list a[data-open-day]:visible, .tour-itinerary a[data-open-day]:visible').first();
  const expectedHighlightDay = Number(await highlightLink.getAttribute('data-open-day'));
  await highlightLink.scrollIntoViewIfNeeded();
  if (await page.evaluate(() => window.scrollY) === 0) {
    await page.evaluate(() => window.scrollTo({ top: 60, behavior: 'instant' }));
  }
  const highlightScroll = await page.evaluate(() => window.scrollY);
  await highlightLink.click();
  await openView(page, 'roadbook');
  const highlight = { expected: expectedHighlightDay, ...(await page.evaluate(roadbookState)) };
  recordChange('Tourübersicht: Reiseverlauf und Highlights öffnen die gewählte Etappe; Zurück-Taste führt zur Übersicht',
    opened.hash === '#roadbook' && opened.activeDay === 10 && history.hash === '#start' && !history.startHidden
      && highlight.activeDay === highlight.expected,
    `Etappe 11 geöffnet=${opened.activeDay === 10}; Zurück→${history.hash}; Highlight geöffnet=${highlight.activeDay === highlight.expected}`);
  await page.locator('.overview-link:visible').click();
  await openView(page, 'start');
  const highlightReturn = await page.evaluate(() => window.scrollY);
  recordChange('Tourübersicht: Scrollposition bei CTA, Reiseverlauf und Highlight wiederhergestellt',
    [ctaScroll, itineraryScroll, highlightScroll].every((value) => value > 0)
      && Math.abs(ctaScroll - ctaReturn) <= 2 && Math.abs(itineraryScroll - historyScroll) <= 2
      && Math.abs(itineraryScroll - repeatedHistoryScroll) <= 2
      && Math.abs(highlightScroll - highlightReturn) <= 2,
    `CTA ${Math.round(ctaScroll)}→${Math.round(ctaReturn)}; Browser-Zurück/Vor/Zurück ${Math.round(itineraryScroll)}→${Math.round(historyScroll)}→${Math.round(repeatedHistoryScroll)}; Highlight ${Math.round(highlightScroll)}→${Math.round(highlightReturn)} px`);
  await page.locator('.brand').evaluate((element) => element.click());
  await openView(page, 'start');
  const brandScroll = await page.evaluate(() => window.scrollY);
  recordChange('Tourübersicht: Header-Logo führt nach oben', brandScroll <= 2, `scrollY=${Math.round(brandScroll)}px`);

  // Selbstcheck: rein informativ (F03) – ein Haken ändert nichts am Einstieg und wird nur lokal gemerkt.
  const firstCheck = page.locator('#start .tour-check').first();
  await firstCheck.click();
  const afterTick = await page.evaluate(() => ({
    checked: document.querySelector('#start input[data-selfcheck]').checked,
    ctaDisabled: document.querySelector('#start .tour-cta').hasAttribute('aria-disabled'),
  }));
  await page.click('.tour-cta');
  await openView(page, 'roadbook');
  const enteredWithTick = await page.evaluate(roadbookState);
  await page.click('.brand');
  await openView(page, 'start');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#start .tour-facts', { state: 'attached' });
  const persisted = await page.evaluate(() => document.querySelector('#start input[data-selfcheck]').checked);
  await page.locator('#start .tour-check').first().click();
  const cleared = await page.evaluate(() => !document.querySelector('#start input[data-selfcheck]').checked);
  recordChange('Tourübersicht: Selbstcheck ist rein informativ, blockiert den Einstieg nicht und wird lokal gemerkt',
    afterTick.checked && !afterTick.ctaDisabled && enteredWithTick.roadbookVisible && persisted && cleared,
    `Haken gesetzt=${afterTick.checked}; Einstieg trotz Haken=${enteredWithTick.roadbookVisible}; nach Neuladen gemerkt=${persisted}; zurückgesetzt=${cleared}`);
  await page.locator('#start .tour-join').scrollIntoViewIfNeeded();
  await shot('start-selfcheck', 'Tourübersicht: Mitfahren und Selbstcheck');
  await page.locator('#start .tour-contact').scrollIntoViewIfNeeded();
  const contactFooter = await page.evaluate(() => {
    const contact = document.querySelector('#start .tour-contact');
    const footer = document.querySelector('#start .tour-contact-footer');
    const note = document.querySelector('#start .tour-selfcheck .tour-note');
    return {
      contactText: contact.textContent.trim().replace(/\s+/g, ' '),
      footerIsLast: document.querySelector('#start').lastElementChild === footer,
      outsideJoin: contact.closest('.tour-join') === null,
      followsSelfCheck: Boolean(note.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING),
      followsItinerary: Boolean(document.querySelector('#start .tour-itinerary').compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING),
      targetHeight: contact.getBoundingClientRect().height,
    };
  });
  recordChange('Tourübersicht: Instagram-Kontakt als letzter Abschluss nach Selbstcheck und Reiseverlauf',
    contactFooter.footerIsLast && contactFooter.outsideJoin && contactFooter.followsSelfCheck
      && contactFooter.followsItinerary && contactFooter.targetHeight >= 44
      && contactFooter.contactText === 'Kontakt aufnehmen · Instagram: @boeser_biker',
    `${contactFooter.contactText}; letzter Bereich=${contactFooter.footerIsLast}; nach Selbstcheck/Reiseverlauf=${contactFooter.followsSelfCheck}/${contactFooter.followsItinerary}; Höhe=${contactFooter.targetHeight}px`);
  await shot('start-contact-footer', 'Tourübersicht: Kontakt-Button als Seitenabschluss');

  const fallback = await page.context().newPage();
  try {
    await fallback.route('**/assets/gpx/tag-03.gpx', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
    await fallback.route('**/assets/gpx/tag-19.gpx', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
    await fallback.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
    await fallback.goto(page.url().split('#')[0], { waitUntil: 'networkidle' });
    await fallback.waitForFunction(() => {
      const text = document.querySelector('#tour-map-status')?.textContent ?? '';
      return text.includes('Tages-GPX nicht verfügbar') && text.includes('Kartenhintergrund nicht verfügbar');
    }, null, { timeout: 10000 });
    const failed = await fallback.evaluate(() => ({
      text: document.querySelector('#tour-map-status').textContent,
      points: document.querySelectorAll('#tour-map .tour-map-point').length,
      days: document.querySelectorAll('#day-list li').length,
      ferry: document.querySelectorAll('#tour-map .tour-map-ferry').length,
      legendHidden: document.querySelector('#tour-ferry-legend').hidden,
    }));
    recordChange('Tourkarte: fehlende GPX und Kartenkacheln zeigen verständlichen Fallback',
      failed.points === 2 * failed.days && /Start- und Zielpunkte bleiben sichtbar/.test(failed.text)
        && failed.ferry === 0 && failed.legendHidden,
      `${failed.points} Punkte; Fährlinie bei fehlender GPX=${failed.ferry}; ${failed.text}`);
  } finally {
    await fallback.close();
  }
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
  await page.waitForSelector('#start .tour-facts', { state: 'attached', timeout: 15000 });
  await page.waitForSelector('#day-list li', { state: 'attached', timeout: 15000 });
  const header = await page.evaluate(collectHeaderGeometry);
  record('Header: Einstellungen rechtsbündig und an Galerie ausgerichtet',
    header.bottomDelta <= 1.5 && header.withinHeaderPadding && header.noOverlap && header.noHeaderOverflow,
    `Button ${header.buttonGeometry}; Galerie-Unterkante=${header.linkBottom}px; Delta=${header.bottomDelta.toFixed(1)}px`);

  for (const view of PAGES) {
    await page.click(view.trigger ?? `.site-nav a[href="#${view.id}"]`);
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
    if (view.id === 'start') {
      const baselineClip = await page.evaluate(collectTextClipping, '#start');
      record('Tourübersicht: Text bei Standardschriftstufe nicht abgeschnitten', baselineClip.total === 0,
        baselineClip.total === 0 ? 'kein abgeschnittener Text' : `${baselineClip.total} Treffer: ${baselineClip.offenders.join('; ')}`);
      await setFontStep(page, 5);
      await page.waitForTimeout(100);
      const largestOverflow = await page.evaluate(collectRightOverflow);
      record('Tourübersicht: kein Element über dem rechten Rand bei Schriftstufe 5/5', largestOverflow.total === 0,
        largestOverflow.total === 0 ? `alle rect.right <= ${largestOverflow.limit}` : `${largestOverflow.total} Treffer: ${largestOverflow.offenders.join('; ')}`);
      const largestScroll = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
      record('Tourübersicht: kein horizontaler Überlauf bei Schriftstufe 5/5', largestScroll.scrollWidth <= largestScroll.innerWidth,
        `scrollWidth=${largestScroll.scrollWidth}, innerWidth=${largestScroll.innerWidth}`);
      const largestClip = await page.evaluate(collectTextClipping, '#start');
      record('Tourübersicht: Text bei Schriftstufe 5/5 nicht abgeschnitten', largestClip.total === 0,
        largestClip.total === 0 ? 'kein abgeschnittener Text' : `${largestClip.total} Treffer: ${largestClip.offenders.join('; ')}`);
      const largestCollisions = await page.evaluate(collectTextCollisions, '#start');
      record('Tourübersicht: keine Textkollisionen bei Schriftstufe 5/5', largestCollisions.total === 0,
        largestCollisions.total === 0 ? 'keine Überschneidungen' : `${largestCollisions.total} Treffer: ${largestCollisions.collisions.join('; ')}`);
      await setFontStep(page, 2);
    }
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

  await runLandingChecks(page, record, shot);

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
    '- **Zusatzprüfungen:** Header-Ausrichtung in allen Viewports; Textkollisionen in Tourübersicht, Etappen, Galerie und Logistik; Tourübersicht: Pflichtinhalte, Einstieg und Rücksprung, Touch-Ziele (44 px), Kontrast in allen Farbschemata, Schriftstufe 5/5, rein informativer Selbstcheck; Galerie-Textüberlauf und Medienrahmen bei Standardschrift (2/5) sowie größter Schriftstufe (5/5). Bewusste Overlay-Badges und der Play-Button sind ausgenommen.',
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
