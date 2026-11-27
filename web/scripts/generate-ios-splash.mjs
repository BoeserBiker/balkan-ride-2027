import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const sizes = [[750, 1334], [828, 1792], [1080, 2340], [1125, 2436], [1170, 2532], [1179, 2556],
  [1206, 2622], [1242, 2688], [1260, 2736], [1284, 2778], [1290, 2796], [1320, 2868]];
const svg = await readFile(path.join(publicDirectory, 'favicon.svg'), 'utf8');
await mkdir(path.join(publicDirectory, 'splash'), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="de"><head><style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; background: #0f172a; }
    main { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    img { display: block; width: min(80vw, 850px); height: auto; }
    h1 { margin: 0; color: #fff; font: 700 5vw/1.2 system-ui, sans-serif; letter-spacing: .02em; }
  </style></head><body><main><img alt=""><h1>Balkan-Ride 2027</h1></main></body></html>`);
  await page.locator('img').evaluate(async (image, source) => {
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await image.decode();
  }, svg);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const file = path.join(publicDirectory, 'splash', `splash-${width}x${height}.png`);
    await page.screenshot({ path: file });
    console.log(`Generated ${path.basename(file)}`);
  }
} finally {
  await browser.close();
}
