import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const svg = await readFile(path.join(publicDirectory, 'favicon.svg'), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>
    html, body { margin: 0; width: 100%; height: 100%; background: #0f172a; }
    body { display: grid; place-items: center; }
    img { width: 65%; height: 65%; }
  </style><img alt="">`);
  await page.locator('img').evaluate(async (image, source) => {
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await image.decode();
  }, svg);
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.screenshot({ path: path.join(publicDirectory, `icon-maskable-${size}.png`) });
  }
} finally {
  await browser.close();
}
