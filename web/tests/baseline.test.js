import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const serviceWorkerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const versionData = JSON.parse(await readFile(new URL('../public/version.json', import.meta.url), 'utf8'));

const baselineChecks = [
  {
    name: 'synchronizes the service-worker cache and its history',
    run() {
      const cache = serviceWorkerSource.match(
        /const\s+CACHE_PREFIX\s*=\s*(['"])([^'"]+)\1\s*;\s*const\s+CACHE_NAME\s*=\s*`\$\{CACHE_PREFIX\}v(\d+)`\s*;/,
      );
      assert.ok(cache, 'service worker must expose a numeric cache version');
      assert.equal(cache[2], 'balkan-ride-shell-');
      assert.ok(Number.isSafeInteger(Number(cache[3])) && Number(cache[3]) > 0);
      const currentVersion = `v${cache[3]}`;
      assert.equal(versionData.serviceWorkerCache, currentVersion);
      assert.ok(Array.isArray(versionData.serviceWorkerHistory));
      assert.equal(versionData.serviceWorkerHistory[0]?.version, currentVersion);
      assert.match(versionData.serviceWorkerHistory[0]?.date ?? '', /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(versionData.serviceWorkerHistory[0]?.message.trim());
      const previousVersion = versionData.serviceWorkerHistory[1]?.version;
      assert.match(previousVersion ?? '', /^v\d+$/);
      assert.equal(Number(cache[3]), Number(previousVersion.slice(1)) + 1);
    },
  },
  {
    name: 'synchronizes the app version and its history',
    run() {
      assert.match(versionData.version, /^v2\.\d+$/);
      assert.ok(Array.isArray(versionData.history));
      assert.equal(versionData.history[0]?.version, versionData.version);
      assert.match(versionData.history[0]?.date ?? '', /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(versionData.history[0]?.message.trim());
    },
  },
  {
    name: 'bundles app content from web/src instead of docs/',
    async run() {
      const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
      assert.match(mainSource, /from\s+(['"])\.\/content\/logistik\.md\?raw\1/);
      assert.doesNotMatch(mainSource, /docs\//);
      const logistics = await readFile(new URL('../src/content/logistik.md', import.meta.url), 'utf8');
      assert.ok(logistics.trim());
    },
  },
];

for (const { name, run } of baselineChecks) {
  test(`baseline: ${name}`, run);
}
