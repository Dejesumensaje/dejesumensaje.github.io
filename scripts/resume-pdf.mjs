// Regenerates public/assets/cv-william-montoya-2026-{en,es}.pdf from dist/
// using each page's own print stylesheet (Letter).
// 1. npm run build
// 2. node scripts/resume-pdf.mjs
// Needs playwright-core and Chromium. Set PLAYWRIGHT_DIR to a folder whose
// node_modules has playwright-core if this project doesn't install it.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const base = process.env.PLAYWRIGHT_DIR ?? join(root, 'node_modules');
const { chromium } = createRequire(base.endsWith('/') ? base : base + '/')('playwright-core');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

const targets = [
  { path: '/resume.html', out: join(root, 'public/assets/cv-william-montoya-2026-en.pdf') },
  { path: '/es/resume.html', out: join(root, 'public/assets/cv-william-montoya-2026-es.pdf') },
];

let server;
let origin = process.env.RESUME_ORIGIN;
if (!origin) {
  server = createServer(async (req, res) => {
    const clean = (req.url ?? '/').split('?')[0];
    const file = join(dist, clean === '/' ? 'index.html' : clean);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  origin = `http://127.0.0.1:${port}`;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage();
  for (const t of targets) {
    await page.goto(`${origin}${t.path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.pdf({ path: t.out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
    console.log(`Résumé PDF → ${t.out}`);
  }
} finally {
  await browser.close();
  server?.close();
}
