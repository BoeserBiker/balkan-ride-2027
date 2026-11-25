import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [mainSource, roadbookSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/roadbook.js', import.meta.url), 'utf8'),
]);
const stageContent = (await Promise.all(
  Array.from({ length: 22 }, (_, index) => {
    const tag = String(index + 1).padStart(2, '0');
    return readFile(new URL(`../../content/tag-${tag}.md`, import.meta.url), 'utf8');
  }),
)).join('\n');

test('issue regression: uses group address without fixing motorcycle model or group size', () => {
  assert.match(mainSource, /Euer digitales Roadbook/);
  assert.match(mainSource, /Eure Häkchen werden auf diesem Gerät gespeichert/);
  assert.match(roadbookSource, /Dieses Videoformat wird von eurem Browser nicht unterstützt/);
  assert.doesNotMatch(stageContent, /\bBMW\s+800\s+GS\b/i);
  assert.doesNotMatch(stageContent, /\bzu zweit\b|\bfür zwei Personen\b/i);
});
