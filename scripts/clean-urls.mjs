// GitHub Pages serves `page.html` at `/page`, but `/page/` has no index and
// returns 404 because build.format is 'file'. Emit tiny redirect documents so
// trailing-slash URLs reach the clean canonical URL instead of the 404 page.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const ORIGIN = 'https://dejesumensaje.com';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

function redirectDocument(route, lang) {
  const escaped = route.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${ORIGIN}${escaped}">
  <script>location.replace(${JSON.stringify(route)} + location.search + location.hash);</script>
  <meta http-equiv="refresh" content="0;url=${escaped}">
  <title>Redirecting…</title>
</head>
<body><p><a href="${escaped}">Continue to ${escaped}</a></p></body>
</html>
`;
}

let made = 0;
for (const file of await walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'index.html' || rel.endsWith('/index.html') || rel.includes(' 2')) continue;
  // Public demos are standalone and keep their own URLs.
  if (rel.startsWith('explorations/') || rel.startsWith('play/')) continue;

  const route = `/${rel.replace(/\.html$/, '')}`;
  if (route.endsWith('/404')) continue;

  const target = join(ROOT, route.slice(1), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  try {
    await writeFile(
      target,
      redirectDocument(route, route === '/es' || route.startsWith('/es/') ? 'es' : 'en'),
      { flag: 'wx' }
    );
    made++;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // Never overwrite a real directory index.
  }
}

// @astrojs/sitemap drops the trailing slash on the home even after serialize().
const sitemap = join(ROOT, 'sitemap-0.xml');
try {
  const xml = await readFile(sitemap, 'utf8');
  await writeFile(
    sitemap,
    xml.replace(`<loc>${ORIGIN}</loc>`, `<loc>${ORIGIN}/</loc>`)
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

console.log(`clean URLs: ${made} trailing-slash redirects ready`);
