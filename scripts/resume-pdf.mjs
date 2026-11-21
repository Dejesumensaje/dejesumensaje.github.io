// Regenerates public/assets/cv-william-montoya-2026-en.pdf from /resume.html
// using the page's own print stylesheet (Letter, two pages).
// 1. npm run build && npm run preview   (serves http://localhost:4321)
// 2. node scripts/resume-pdf.mjs
// Needs playwright-core and a Chromium. Set PLAYWRIGHT_DIR to a folder whose
// node_modules has playwright-core if this project doesn't install it.
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.PLAYWRIGHT_DIR ?? join(root, 'node_modules');
const { chromium } = createRequire(base.endsWith('/') ? base : base + '/')('playwright-core');

const out = join(root, 'public/assets/cv-william-montoya-2026-en.pdf');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.goto(process.env.RESUME_URL ?? 'http://localhost:4321/resume.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
await browser.close();
console.log(`Résumé PDF → ${out}`);
