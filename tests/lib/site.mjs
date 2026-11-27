import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve as resolvePath } from 'node:path';

export const ROOT = resolvePath(process.cwd(), 'dist');
export const SITE = 'https://dejesumensaje.com';

/** Every page Astro generates. Kept explicit so a missing route fails loudly. */
export const ROUTES = [
  '/',
  '/about',
  '/resume',
  '/404',
  '/store-pricing-ai',
  '/design-system-ai-agents',
  '/aprender-digital',
  '/colombia-aprende',
  '/es',
  '/es/about',
  '/es/resume',
  '/es/404',
  '/es/store-pricing-ai',
  '/es/design-system-ai-agents',
  '/es/aprender-digital',
  '/es/colombia-aprende',
];

/** Pages indexed by search engines (404 is noindex). */
export const INDEXABLE_ROUTES = ROUTES.filter((r) => !r.endsWith('/404'));

export const COUNTERPART = Object.fromEntries(
  ROUTES.map((route) => {
    const isEs = route === '/es' || route.startsWith('/es/');
    const other = isEs
      ? route === '/es'
        ? '/'
        : route.slice(3)
      : route === '/'
        ? '/es'
        : `/es${route}`;
    return [route, other];
  })
);

export const LANG_OF = (route) =>
  route === '/es' || route.startsWith('/es/') ? 'es' : 'en';

export function routeToFile(route) {
  if (route === '/') return join(ROOT, 'index.html');
  if (route === '/es') return join(ROOT, 'es.html');
  return join(ROOT, `${route.replace(/^\//, '')}.html`);
}

export function canonicalFor(route) {
  return route === '/' ? `${SITE}/` : `${SITE}${route}`;
}

export async function readRoute(route) {
  return readFile(routeToFile(route), 'utf8');
}

export async function fileExists(pathname) {
  try {
    const info = await stat(pathname);
    return info.isFile();
  } catch {
    return false;
  }
}

/** Attribute value from the first tag matching `tag` that has `attr`. */
export function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1];
}

export function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

export function ids(html) {
  return new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Static server that mirrors GitHub Pages: extensionless URLs resolve to
 * `path.html` before `path/index.html`, and unknown paths get 404.html.
 */
export async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
      const candidates = [];

      if (safe.endsWith('/')) candidates.push(join(ROOT, safe, 'index.html'));
      else {
        candidates.push(join(ROOT, safe));
        if (!extname(safe)) {
          candidates.push(join(ROOT, `${safe}.html`));
          candidates.push(join(ROOT, safe, 'index.html'));
        }
      }
      candidates.push(join(ROOT, '404.html'));

      let file;
      for (const candidate of candidates) {
        if (await fileExists(candidate)) {
          file = candidate;
          break;
        }
      }
      if (!file) throw new Error('not found');

      const body = await readFile(file);
      const is404 = file === join(ROOT, '404.html') && !pathname.endsWith('/404');
      res.writeHead(is404 ? 404 : 200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('server error');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseURL: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
