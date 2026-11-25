import { parseHTML } from 'linkedom';
import postcss from 'postcss';

// Hilfen für formatunabhängige Tests: HTML wird als DOM, CSS als AST ausgewertet.
// Attributreihenfolge, Leerraum und Deklarationsreihenfolge spielen dadurch keine Rolle.

export function parseDocument(html) {
  return parseHTML(html).document;
}

export function parseHtml(html) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  return document;
}

function skipString(source, start) {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length && source[index] !== quote) {
    index += source[index] === '\\' ? 2 : 1;
  }
  return index + 1;
}

function skipExpression(source, start) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const char = source[index];
    if (char === '`') {
      index = readTemplate(source, index + 1).end;
    } else if (char === '"' || char === "'") {
      index = skipString(source, index);
    } else {
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) return index + 1;
      }
      index += 1;
    }
  }
  throw new Error('Template-Ausdruck ist nicht abgeschlossen.');
}

function readTemplate(source, start) {
  let text = '';
  let index = start;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      const next = source[index + 1];
      text += '`$\\'.includes(next) ? next : `\\${next}`;
      index += 2;
    } else if (char === '`') {
      return { text, end: index + 1 };
    } else if (char === '$' && source[index + 1] === '{') {
      index = skipExpression(source, index + 2);
      text += '{{expr}}';
    } else {
      text += char;
      index += 1;
    }
  }
  throw new Error('Template-Literal ist nicht abgeschlossen.');
}

// Liefert den Inhalt des Template-Literals, das direkt nach `openPattern` beginnt.
// Das Muster muss mit dem öffnenden Backtick enden; `${…}`-Ausdrücke werden zu `{{expr}}`.
export function extractTemplate(source, openPattern) {
  const match = openPattern.exec(source);
  if (!match) throw new Error(`Template nicht gefunden: ${openPattern}`);
  return readTemplate(source, match.index + match[0].length).text;
}

export function normalizeText(node) {
  return node.textContent.replace(/\s+/g, ' ').trim();
}

export function lightboxEntries(root) {
  return [...root.querySelectorAll('[data-lightbox-index]')].map((element) => ({
    index: element.getAttribute('data-lightbox-index'),
    type: element.getAttribute('data-lightbox-type'),
    src: element.getAttribute('data-lightbox-src'),
    caption: element.getAttribute('data-lightbox-caption'),
    element,
  }));
}

export function isBefore(first, second) {
  return Boolean(first.compareDocumentPosition(second) & 4);
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

export function normalizeCssValue(value) {
  return collapse(value).replace(/\s*,\s*/g, ', ').replace(/\s*:\s*/g, ': ');
}

function normalizeSelector(selector) {
  return collapse(selector).replace(/\s*([>+~])\s*/g, ' $1 ');
}

function atRuleContext(rule) {
  const context = [];
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule') context.unshift(`@${parent.name} ${normalizeCssValue(parent.params)}`);
  }
  return context.join(' ');
}

// Zerlegt CSS in Regeln; Selektorlisten werden aufgeteilt, spätere Regeln überschreiben frühere.
export function parseCss(source) {
  const entries = [];
  postcss.parse(source).walkRules((rule) => {
    const declarations = {};
    rule.each((node) => {
      if (node.type === 'decl') {
        declarations[node.prop] = normalizeCssValue(node.value) + (node.important ? ' !important' : '');
      }
    });
    for (const selector of rule.selectors) {
      entries.push({ selector: normalizeSelector(selector), media: atRuleContext(rule), declarations });
    }
  });
  return {
    entries,
    declarations(selector, media = '') {
      const wanted = normalizeSelector(selector);
      const merged = {};
      for (const entry of entries) {
        if (entry.selector === wanted && entry.media === media) Object.assign(merged, entry.declarations);
      }
      return merged;
    },
    has(selector, media = '') {
      const wanted = normalizeSelector(selector);
      return entries.some((entry) => entry.selector === wanted && entry.media === media);
    },
    mentions(text) {
      return entries.some((entry) => entry.selector.includes(text)
        || Object.entries(entry.declarations).some(([prop, value]) => prop.includes(text) || value.includes(text)));
    },
  };
}
