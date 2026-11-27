import { readFile, readdir } from 'node:fs/promises';
import matter from 'gray-matter';
import { validateTourInfo } from '../../src/tour-overview.js';

const contentDirectory = new URL('../../../content/', import.meta.url);

// Liest die echten Etappen wie das virtuelle Modul des Builds (frontmatter + body).
export async function loadDays() {
  const names = (await readdir(contentDirectory)).filter((name) => /^tag-\d{2}\.md$/.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const parsed = matter(await readFile(new URL(name, contentDirectory), 'utf8'));
    return { frontmatter: parsed.data, body: parsed.content.trim() };
  }));
}

export async function loadTourInfo(days) {
  const parsed = matter(await readFile(new URL('tour.md', contentDirectory), 'utf8'));
  return validateTourInfo(parsed.data, days.map((day) => day.frontmatter.tag));
}
