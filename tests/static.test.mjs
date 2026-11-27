import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { lintSpacing } from '../scripts/lint-spacing.mjs';
import {
  ROOT,
  SITE,
  ROUTES,
  INDEXABLE_ROUTES,
  COUNTERPART,
  LANG_OF,
  readRoute,
  canonicalFor,
  routeToFile,
  fileExists,
  attr,
  tags,
  ids,
} from './lib/site.mjs';

const html = Object.fromEntries(
  await Promise.all(ROUTES.map(async (route) => [route, await readRoute(route)]))
);

const ANCHORS = await Promise.all(
  ROUTES.map(async (route) => [route, ids(html[route])])
).then(Object.fromEntries);

test('all expected pages are generated', async () => {
  for (const route of ROUTES) {
    assert.ok(await fileExists(routeToFile(route)), `missing ${routeToFile(route)}`);
  }
});

test('trailing-slash variants have a redirect to the clean canonical URL', async () => {
  for (const route of ROUTES.filter((r) => r !== '/' && !r.endsWith('/404'))) {
    const file = join(ROOT, route.slice(1), 'index.html');
    assert.ok(await fileExists(file), `missing trailing-slash redirect for ${route}`);
    const page = await readFile(file, 'utf8');
    assert.match(page, /<meta name="robots" content="noindex"/, `redirect must be noindex for ${route}`);
    assert.ok(page.includes(`<link rel="canonical" href="${canonicalFor(route)}"`), `redirect canonical on ${route}`);
    assert.ok(
      page.includes(`location.replace(${JSON.stringify(route)} + location.search + location.hash)`),
      `redirect target on ${route}`
    );
  }
});

test('html lang, canonical and hreflang are correct on every page', () => {
  for (const route of ROUTES) {
    const page = html[route];
    const lang = LANG_OF(route);
    const canonical = attr(tags(page, 'link').find((t) => t.includes('rel="canonical"')) ?? '', 'href');
    assert.equal(canonical, canonicalFor(route), `canonical on ${route}`);
    assert.match(page, new RegExp(`<html\\b[^>]*\\blang="${lang}"`), `html lang on ${route}`);

    const alternates = Object.fromEntries(
      tags(page, 'link')
        .filter((t) => t.includes('rel="alternate"'))
        .map((t) => [attr(t, 'hreflang'), attr(t, 'href')])
    );
    const en = lang === 'en' ? route : COUNTERPART[route];
    const es = lang === 'es' ? route : COUNTERPART[route];
    assert.equal(alternates.en, canonicalFor(en), `hreflang en on ${route}`);
    assert.equal(alternates.es, canonicalFor(es), `hreflang es on ${route}`);
    assert.equal(alternates['x-default'], canonicalFor(en), `x-default on ${route}`);
  }
});

test('language switch points at the other language on every page', () => {
  for (const route of ROUTES) {
    const link = tags(html[route], 'a').find((t) => t.includes('data-lang-switch'));
    assert.ok(link, `no language switch on ${route}`);
    assert.equal(attr(link, 'href'), COUNTERPART[route], `language switch on ${route}`);
    assert.equal(attr(link, 'hreflang'), LANG_OF(COUNTERPART[route]), `switch hreflang on ${route}`);
  }
});

test('internal links and hashes resolve', async () => {
  for (const route of ROUTES) {
    const page = html[route];
    for (const match of page.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replaceAll('&amp;', '&');
      if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;

      const [rawPath, rawHash = ''] = href.split('#');
      const path = rawPath.split('?')[0] || route;
      const target = ROUTES.includes(path) ? path : null;

      if (target) {
        if (rawHash) assert.ok(ANCHORS[target].has(rawHash), `missing #${rawHash} at ${target} (from ${route})`);
      } else if (path.startsWith('/')) {
        const clean = path.replace(/\/$/, '') || '/';
        if (ROUTES.includes(clean)) {
          if (rawHash) assert.ok(ANCHORS[clean].has(rawHash), `missing #${rawHash} at ${clean} (from ${route})`);
        } else {
          const file = join(ROOT, decodeURIComponent(clean));
          const htmlFile = clean.endsWith('.html') ? file : `${file}.html`;
          assert.ok(
            (await fileExists(file)) || (await fileExists(htmlFile)),
            `broken internal link ${href} on ${route}`
          );
        }
      }
    }
  }
});

test('local assets, stylesheets, scripts and fonts exist', async () => {
  for (const route of ROUTES) {
    const page = html[route];
    const urls = new Set();
    for (const t of tags(page, 'img')) urls.add(attr(t, 'src'));
    for (const t of tags(page, 'script')) {
      const src = attr(t, 'src');
      if (src) urls.add(src);
    }
    for (const t of tags(page, 'link')) {
      const rel = attr(t, 'rel') ?? '';
      if (/stylesheet|icon|preload|manifest|apple-touch/.test(rel)) urls.add(attr(t, 'href'));
    }

    for (const url of urls) {
      if (!url || /^(https?:|data:)/.test(url)) continue;
      const file = join(ROOT, decodeURIComponent(url.split('?')[0]));
      assert.ok(await fileExists(file), `missing asset ${url} referenced by ${route}`);
    }
  }
});

test('no duplicate ids, images have alt, buttons and links have names', () => {
  for (const route of ROUTES) {
    const page = html[route];

    const allIds = [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `duplicate ids on ${route}`);

    for (const img of tags(page, 'img')) {
      assert.ok(/\balt(?:="[^"]*")?(?=\s|\/?>)/.test(img), `image without alt on ${route}: ${img.slice(0, 120)}`);
    }

    for (const button of page.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
      const attrs = button[1];
      const text = button[2].replace(/<[^>]+>/g, '').trim();
      assert.ok(
        text.length > 0 || /\baria-label="/.test(attrs) || /\btitle="/.test(attrs),
        `button without accessible name on ${route}`
      );
    }

    for (const link of page.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const attrs = link[1];
      if (/\baria-hidden="true"/.test(attrs)) continue;
      const inner = link[2];
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const imgAlt = [...inner.matchAll(/<img\b[^>]*\balt="([^"]*)"/g)].some((m) => m[1].trim());
      assert.ok(
        text.length > 0 || imgAlt || /\baria-label="/.test(attrs) || /\btitle="/.test(attrs),
        `link without accessible name on ${route}: ${link[0].slice(0, 120)}`
      );
    }
  }
});

test('title and description are present and unique', () => {
  const titles = new Map();
  for (const route of ROUTES) {
    const page = html[route];
    const title = page.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    const description = attr(tags(page, 'meta').find((t) => t.includes('name="description"')) ?? '', 'content');
    assert.ok(title, `missing title on ${route}`);
    assert.ok(description, `missing description on ${route}`);
    assert.ok(description.length >= 50, `description too short on ${route}`);
    assert.ok(description.length <= 160, `description too long on ${route} (${description.length})`);
    assert.ok(title.length <= 65, `title too long on ${route} (${title.length})`);
    if (!route.endsWith('/404')) {
      assert.ok(!titles.has(title), `duplicate title ${title} on ${route} and ${titles.get(title)}`);
      titles.set(title, route);
    }
  }
});

test('Spanish pages do not leak English UI strings (and vice versa)', () => {
  const englishOnly = [
    'Skip to main content',
    'Selected work',
    'Next story',
    'Download PDF',
    'Open menu',
    'Close menu',
    'Switch to dark mode',
    'Switch to light mode',
    'Client data blurred',
    'Previous project',
    'Next project',
  ];
  const spanishOnly = [
    'Saltar al contenido',
    'Trabajo seleccionado',
    'Siguiente historia',
    'Descargar PDF',
    'Abrir menú',
    'Cerrar menú',
    'Cambiar a modo oscuro',
    'Cambiar a modo claro',
    'Datos del cliente difuminados',
    'Proyecto anterior',
    'Proyecto siguiente',
  ];

  for (const route of ROUTES) {
    const page = html[route];
    const lang = LANG_OF(route);
    const forbidden = lang === 'es' ? englishOnly : spanishOnly;
    for (const phrase of forbidden) {
      assert.ok(!page.includes(phrase), `${route} (${lang}) contains "${phrase}"`);
    }
  }
});

test('sitemap lists every indexable page and nothing else', async () => {
  const xml = await readFile(join(ROOT, 'sitemap-0.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const normalized = locs.map((url) => {
    const { pathname } = new URL(url);
    return pathname.replace(/\/$/, '') || '/';
  });

  assert.deepEqual(new Set(normalized), new Set(INDEXABLE_ROUTES));
  assert.equal(normalized.length, new Set(normalized).size, 'duplicate sitemap URLs');
  assert.ok(locs.includes(`${SITE}/`), 'sitemap home should match the canonical trailing slash');

  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)];
  assert.equal(entries.length, INDEXABLE_ROUTES.length, 'sitemap entry count');
  for (const [, loc, body] of entries) {
    const route = new URL(loc).pathname.replace(/\/$/, '') || '/';
    const links = Object.fromEntries(
      [...body.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((m) => [m[1], m[2]])
    );
    const isEs = route === '/es' || route.startsWith('/es/');
    assert.equal(links.en, canonicalFor(isEs ? COUNTERPART[route] : route), `sitemap en alternate for ${route}`);
    assert.equal(links.es, canonicalFor(isEs ? route : COUNTERPART[route]), `sitemap es alternate for ${route}`);
  }
  assert.ok(!locs.some((u) => u.endsWith('.html')), 'sitemap contains .html URLs');
  assert.ok(!normalized.some((u) => u === '/404' || u === '/es/404'), 'sitemap contains 404');

  const robots = await readFile(join(ROOT, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/dejesumensaje\.com\/sitemap-index\.xml/);
});

test('social metadata is localized and complete', () => {
  for (const route of ROUTES) {
    const page = html[route];
    const metas = Object.fromEntries(
      tags(page, 'meta')
        .filter((t) => attr(t, 'property') || attr(t, 'name'))
        .map((t) => [attr(t, 'property') ?? attr(t, 'name'), attr(t, 'content')])
    );
    assert.equal(metas['og:url'], canonicalFor(route), `og:url on ${route}`);
    assert.equal(metas['og:locale'], LANG_OF(route) === 'es' ? 'es_CO' : 'en_US', `og:locale on ${route}`);
    assert.equal(
      metas['og:locale:alternate'],
      LANG_OF(route) === 'es' ? 'en_US' : 'es_CO',
      `og:locale:alternate on ${route}`
    );
    assert.ok(metas['og:title'], `og:title on ${route}`);
    assert.ok(metas['og:description'], `og:description on ${route}`);
    assert.ok(metas['og:image']?.startsWith('https://'), `og:image on ${route}`);
    assert.ok(metas['og:image:alt'], `og:image:alt on ${route}`);
    assert.ok(metas['og:image:width'], `og:image:width on ${route}`);
    assert.ok(metas['og:image:height'], `og:image:height on ${route}`);
    assert.equal(metas['twitter:card'], 'summary_large_image', `twitter:card on ${route}`);
    assert.equal(metas['twitter:title'], metas['og:title'], `twitter:title on ${route}`);
    assert.equal(metas['twitter:description'], metas['og:description'], `twitter:description on ${route}`);
    assert.equal(metas['twitter:image'], metas['og:image'], `twitter:image on ${route}`);
    assert.equal(metas['twitter:image:alt'], metas['og:image:alt'], `twitter:image:alt on ${route}`);
    assert.equal(metas.author, 'William Montoya', `author on ${route}`);
    assert.match(
      metas.robots,
      route.endsWith('/404') ? /noindex, nofollow/ : /index, follow/,
      `robots on ${route}`
    );
  }

  for (const route of ROUTES.filter((r) => LANG_OF(r) === 'es')) {
    const alt = attr(tags(html[route], 'meta').find((t) => t.includes('property="og:image:alt"')) ?? '', 'content');
    assert.ok(!alt.includes('based in Medellín'), `og:image:alt should not use the English default on ${route}`);
  }
});

test('structured data is valid and complete', () => {
  for (const route of ROUTES) {
    const page = html[route];
    const blocks = [...page.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0, `structured data missing on ${route}`);

    const entities = blocks.flatMap((block) => {
      const data = JSON.parse(block[1]);
      return data['@graph'] ?? [data];
    });
    const types = entities.map((entity) => entity['@type']);
    const lang = LANG_OF(route);
    assert.ok(types.includes('Person'), `Person schema on ${route}`);
    assert.ok(types.includes('WebSite'), `WebSite schema on ${route}`);
    assert.ok(types.includes('WebPage'), `WebPage schema on ${route}`);
    assert.equal(types.filter((type) => type === 'Person').length, 1, `one Person on ${route}`);

    const webPage = entities.find((entity) => entity['@type'] === 'WebPage');
    assert.equal(webPage.url, canonicalFor(route), `schema url on ${route}`);
    assert.equal(webPage.inLanguage, lang, `schema language on ${route}`);

    const isCaseStudy = [
      '/store-pricing-ai',
      '/design-system-ai-agents',
      '/aprender-digital',
      '/colombia-aprende',
      '/es/store-pricing-ai',
      '/es/design-system-ai-agents',
      '/es/aprender-digital',
      '/es/colombia-aprende',
    ].includes(route);
    if (isCaseStudy) {
      assert.ok(types.includes('CreativeWork'), `CreativeWork schema on ${route}`);
      assert.ok(types.includes('BreadcrumbList'), `BreadcrumbList schema on ${route}`);
      const breadcrumbs = entities.find((entity) => entity['@type'] === 'BreadcrumbList');
      assert.equal(breadcrumbs.itemListElement.length, 3, `breadcrumb length on ${route}`);
    }
  }
});

test('robots.txt keeps demo and game URLs out of search', async () => {
  const robots = await readFile(join(ROOT, 'robots.txt'), 'utf8');
  assert.match(robots, /Disallow: \/play\//);
  assert.match(robots, /Disallow: \/explorations\//);
});

test('performance budgets for shipped JS and CSS', async () => {
  const dir = join(ROOT, '_astro');
  const files = await readdir(dir);
  let js = 0;
  let css = 0;
  for (const name of files) {
    const info = await stat(join(dir, name));
    const body = await readFile(join(dir, name));
    if (name.endsWith('.js')) js += gzipSync(body).length;
    if (name.endsWith('.css')) css += gzipSync(body).length;
    assert.ok(info.size < 150_000, `${name} is unexpectedly large`);
  }
  assert.ok(js <= 20_000, `JS budget exceeded: ${js} B gzip`);
  assert.ok(css <= 25_000, `CSS budget exceeded: ${css} B gzip`);
});

test('critical images declare dimensions and non-hero images are lazy', () => {
  // The home hero and the featured case shot are above the fold by design.
  const eagerByDesign = new Set([
    '/assets/f/portrait.webp',
    '/assets/f/store-pricing-desktop.webp',
    '/assets/f/store-pricing-phone.webp',
  ]);
  for (const route of ROUTES) {
    const page = html[route];
    for (const img of tags(page, 'img')) {
      assert.ok(/\bwidth="\d+"/.test(img), `image without width on ${route}`);
      assert.ok(/\bheight="\d+"/.test(img), `image without height on ${route}`);
      assert.ok(!/\blang=/.test(img), `img must not set lang separately from its alt text on ${route}`);
      const src = attr(img, 'src') ?? '';
      const eager = /\bfetchpriority="high"/.test(img) || eagerByDesign.has(src);
      if (!eager) {
        assert.ok(/\bloading="lazy"/.test(img), `image not lazy on ${route}: ${src}`);
      }
    }
  }
});

test('heading outline is semantic and titles do not end with a period', () => {
  for (const route of ROUTES) {
    const page = html[route];
    const headings = [...page.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
      level: Number(m[1]),
      text: m[2]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[^;]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }));

    assert.equal(headings.filter((h) => h.level === 1).length, 1, `one h1 on ${route}`);
    let previous = 0;
    for (const heading of headings) {
      assert.ok(heading.text.length > 0, `empty h${heading.level} on ${route}`);
      if (previous > 0) {
        assert.ok(
          heading.level <= previous + 1,
          `heading level jumps from h${previous} to h${heading.level} on ${route}`
        );
      }
      assert.ok(!heading.text.endsWith('.'), `heading ends with a period on ${route}: ${heading.text}`);
      previous = heading.level;
    }

    // Pull quotes are emphasis paragraphs, never headings.
    assert.ok(!/<h[1-6][^>]*class="[^"]*\bpull\b/.test(page), `pull quote used as a heading on ${route}`);
  }
});

test('case kickers are gone and the home no longer renders How I think', () => {
  for (const route of ROUTES) {
    assert.ok(!html[route].includes('>Case study ·'), `English case kicker remains on ${route}`);
    assert.ok(!html[route].includes('>Caso de estudio ·'), `Spanish case kicker remains on ${route}`);
  }
  for (const route of ['/', '/es']) {
    assert.ok(!html[route].includes('id="think-title"'), `How I think still present on ${route}`);
  }
});

test('layout spacing is fully tokenized on a 4px base', async () => {
  const report = await lintSpacing();
  assert.deepEqual(report.errors, [], report.errors.join('\n'));
});

test('no stale clean-URL regressions in generated HTML', () => {
  for (const route of ROUTES) {
    const page = html[route];
    assert.ok(!page.includes('href="/es/"'), `link to /es/ directory on ${route}`);
    assert.ok(!page.includes('href="index.html"'), `relative index.html on ${route}`);
    assert.ok(!page.includes('undefined'), `"undefined" rendered on ${route}`);
    assert.ok(!page.includes('NaN'), `"NaN" rendered on ${route}`);
  }
});
