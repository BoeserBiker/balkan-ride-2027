import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { zipSync } from 'fflate';
import matter from 'gray-matter';

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const contentDirectory = path.resolve(webDirectory, '../content');
const gpxDirectory = path.resolve(webDirectory, '../assets/gpx');
const virtualModuleId = 'virtual:roadbook-content';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const base = '/balkan-ride-2027/';
const zipName = 'balkan-ride-2027-alle-etappen.zip';

async function loadGpxFiles() {
  const files = Array.from({ length: 22 }, (_, index) => `tag-${String(index + 1).padStart(2, '0')}.gpx`);
  return Promise.all(files.map(async (name) => [name, await readFile(path.join(gpxDirectory, name))]));
}

function createGpxZip(files) {
  return zipSync(Object.fromEntries(files), { level: 6, mtime: new Date('2027-01-01T00:00:00Z') });
}

function validateDay(data, fileName) {
  const tagFromName = Number(fileName.match(/^tag-(\d{2})\.md$/)?.[1]);
  const required = [
    'tag', 'datum', 'titel', 'start', 'ziel', 'koordinaten_start',
    'koordinaten_ziel', 'kilometer', 'fahrzeit', 'hoehenmeter',
    'gpx_datei', 'highlights', 'bilder', 'videos',
  ];
  const missing = required.filter((key) => !(key in data));
  if (missing.length) {
    throw new Error(`${fileName}: fehlende Frontmatter-Felder: ${missing.join(', ')}`);
  }
  if (data.tag !== tagFromName) {
    throw new Error(`${fileName}: tag muss zum Dateinamen passen (erwartet ${tagFromName}).`);
  }
  for (const field of ['datum', 'titel', 'start', 'ziel', 'fahrzeit', 'gpx_datei']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`${fileName}: Frontmatter-Feld "${field}" muss ein nichtleerer Text sein.`);
    }
  }
  for (const field of ['kilometer', 'hoehenmeter']) {
    if (!Number.isFinite(data[field]) || data[field] < 0) {
      throw new Error(`${fileName}: Frontmatter-Feld "${field}" muss eine nichtnegative Zahl sein.`);
    }
  }
  for (const field of ['koordinaten_start', 'koordinaten_ziel']) {
    const coordinates = data[field];
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)
      || coordinates[0] < -90 || coordinates[0] > 90 || coordinates[1] < -180 || coordinates[1] > 180) {
      throw new Error(`${fileName}: Frontmatter-Feld "${field}" muss [Breitengrad, Längengrad] enthalten.`);
    }
  }
  if (!Array.isArray(data.highlights) || !Array.isArray(data.bilder) || !Array.isArray(data.videos)) {
    throw new Error(`${fileName}: highlights, bilder und videos müssen Listen sein.`);
  }
  if (data.bilder.some((image) => !image || typeof image.datei !== 'string' || typeof image.beschreibung !== 'string')) {
    throw new Error(`${fileName}: jeder Eintrag in bilder benötigt datei und beschreibung.`);
  }
  if (data.videos.some((video) => !video || typeof video.typ !== 'string' || typeof video.quelle !== 'string')) {
    throw new Error(`${fileName}: jeder Eintrag in videos benötigt typ und quelle.`);
  }
}

function roadbookContentPlugin() {
  return {
    name: 'roadbook-content',
    resolveId(id) {
      return id === virtualModuleId ? resolvedVirtualModuleId : null;
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }

      const files = (await readdir(contentDirectory))
        .filter((name) => /^tag-\d{2}\.md$/.test(name))
        .sort();
      const days = await Promise.all(files.map(async (fileName) => {
        const source = await readFile(path.join(contentDirectory, fileName), 'utf8');
        const parsed = matter(source);
        validateDay(parsed.data, fileName);
        return {
          sourcePath: `content/${fileName}`,
          frontmatter: parsed.data,
          body: parsed.content.trim(),
        };
      }));

      return `export default ${JSON.stringify(days)};`;
    },
    handleHotUpdate({ file, server }) {
      if (path.dirname(file) !== contentDirectory || !/^tag-\d{2}\.md$/.test(path.basename(file))) {
        return;
      }
      const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
        return [module];
      }
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (pathname === `${base}assets/gpx/${zipName}`) {
          try {
            const archive = createGpxZip(await loadGpxFiles());
            response.setHeader('Content-Type', 'application/zip');
            response.end(archive);
          } catch (error) {
            next(error);
          }
          return;
        }
        const gpxFile = pathname.startsWith(`${base}assets/gpx/`)
          ? path.basename(pathname)
          : '';
        if (/^tag-\d{2}\.gpx$/.test(gpxFile)) {
          try {
            const data = await readFile(path.join(gpxDirectory, gpxFile));
            response.setHeader('Content-Type', 'application/gpx+xml');
            response.end(data);
          } catch (error) {
            next(error);
          }
          return;
        }
        next();
      });
    },
    async generateBundle() {
      const gpxFiles = await loadGpxFiles();
      for (const [fileName, source] of gpxFiles) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/gpx/${fileName}`,
          source,
        });
      }
      this.emitFile({
        type: 'asset',
        fileName: `assets/gpx/${zipName}`,
        source: createGpxZip(gpxFiles),
      });
    },
  };
}

export default defineConfig({
  base,
  plugins: [tailwindcss(), roadbookContentPlugin()],
});
