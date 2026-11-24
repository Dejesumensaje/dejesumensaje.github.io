import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer, ROUTES, COUNTERPART, LANG_OF } from './lib/site.mjs';

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function newPage(options = {}) {
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  // Keep analytics from touching the network or polluting the console.
  await context.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
  );
  await context.route('https://www.google-analytics.com/**', (route) =>
    route.fulfill({ status: 204, body: '' })
  );
  const page = await context.newPage();
  return { context, page };
}

async function goto(page, path) {
  const response = await page.goto(server.baseURL + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  return response;
}

function collect(page) {
  const errors = [];
  const failed = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? '';
    // Navigating away cancels in-flight lazy images; that is not a failure.
    if (request.url().startsWith(server.baseURL) && !reason.includes('ERR_ABORTED')) {
      failed.push(`${request.url()} ${reason}`);
    }
  });
  return { errors, failed };
}

test('every page loads with 200 and no console or local request errors', async () => {
  const { context, page } = await newPage();
  for (const route of ROUTES) {
    const { errors, failed } = collect(page);
    const response = await goto(page, route);
    assert.equal(response?.status(), 200, `HTTP status on ${route}`);
    assert.deepEqual(errors, [], `runtime errors on ${route}`);
    assert.deepEqual(failed, [], `failed local requests on ${route}`);
    page.removeAllListeners();
  }
  await context.close();
});

test('language switch flips language on every page and keeps the hash', async () => {
  const { context, page } = await newPage();
  for (const route of ROUTES) {
    await goto(page, `${route}#main-content`);
    const expected = COUNTERPART[route];
    await Promise.all([
      page.waitForURL((url) => url.pathname === expected),
      page.locator('.nav__lang').click(),
    ]);
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      hash: location.hash,
      path: location.pathname,
    }));
    assert.equal(state.path, expected, `switch target on ${route}`);
    assert.equal(state.lang, LANG_OF(expected), `html lang after switch on ${route}`);
    assert.equal(state.hash, '#main-content', `hash lost switching from ${route}`);
  }
  await context.close();
});

test('language switch preserves reading depth in case studies', async () => {
  const { context, page } = await newPage();
  for (const route of ['/store-pricing-ai', '/es/store-pricing-ai']) {
    await goto(page, `${route}?view=tldr#ch-problem`);
    const expected = COUNTERPART[route];
    const href = await page.locator('.nav__lang').getAttribute('href');
    assert.ok(href.includes('view=tldr'), `static switch href should include view on ${route}`);
    assert.ok(href.includes('#ch-problem'), `static switch href should include hash on ${route}`);
    await Promise.all([
      page.waitForURL((url) => url.pathname === expected && url.search === '?view=tldr'),
      page.locator('.nav__lang').click(),
    ]);
    const state = await page.evaluate(() => ({
      search: location.search,
      hash: location.hash,
      tldr: document.documentElement.classList.contains('depth-tldr'),
      path: location.pathname,
    }));
    assert.equal(state.path, expected, `switch target from ${route}`);
    assert.equal(state.search, '?view=tldr', `query lost switching from ${route}`);
    assert.equal(state.hash, '#ch-problem', `hash lost switching from ${route}`);
    assert.equal(state.tldr, true, `TL;DR mode lost switching from ${route}`);
  }
  await context.close();
});

test('unknown Spanish URLs reach the Spanish 404 without changing language', async () => {
  const { context, page } = await newPage();
  await page.goto(server.baseURL + '/es/no-existe', { waitUntil: 'load' });
  await page.waitForURL((url) => url.pathname === '/es/404.html');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');
  assert.match(await page.title(), /Perdido en la conversación/);

  await page.goto(server.baseURL + '/no-existe', { waitUntil: 'load' });
  await page.waitForTimeout(200);
  assert.equal(new URL(page.url()).pathname, '/no-existe');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.match(await page.title(), /Lost in conversation/);
  await context.close();
});

test('trailing-slash URLs redirect to the clean canonical URL', async () => {
  const { context, page } = await newPage();
  for (const [path, expected, lang] of [
    ['/es/#main-content', '/es', 'es'],
    ['/about/#main-content', '/about', 'en'],
    ['/es/store-pricing-ai/#main-content', '/es/store-pricing-ai', 'es'],
  ]) {
    await page.goto(server.baseURL + path, { waitUntil: 'load' });
    await page.waitForURL((url) => url.pathname === expected && url.hash === '#main-content');
    assert.equal(await page.evaluate(() => document.documentElement.lang), lang, `lang for ${path}`);
  }
  await context.close();
});

test('next story keeps the reading depth', async () => {
  const { context, page } = await newPage();
  await goto(page, '/');
  await page.evaluate(() => localStorage.removeItem('case-depth'));
  await goto(page, '/aprender-digital?view=tldr');
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains('depth-tldr')),
    true
  );

  // Forget the stored choice: the link itself must carry the mode forward.
  await page.evaluate(() => localStorage.removeItem('case-depth'));
  const next = page.locator('[data-next-story]');
  const nextHref = await next.getAttribute('href');
  assert.ok(nextHref.includes('view=tldr'), 'next story href should include view');
  const href = new URL(nextHref, page.url());
  await Promise.all([
    page.waitForURL((url) => url.pathname === href.pathname),
    next.click(),
  ]);
  assert.equal(new URL(page.url()).searchParams.get('view'), 'tldr');
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains('depth-tldr')),
    true
  );
  await context.close();
});

test('clean 404 URLs do not redirect to .html', async () => {
  const { context, page } = await newPage();
  await goto(page, '/es/404');
  await page.waitForTimeout(300);
  assert.equal(new URL(page.url()).pathname, '/es/404');

  await Promise.all([
    page.waitForURL((url) => url.pathname === '/404'),
    page.locator('.nav__lang').click(),
  ]);
  assert.equal(new URL(page.url()).pathname, '/404');
  await context.close();
});

test('theme choice persists across pages and language', async () => {
  const { context, page } = await newPage();
  await goto(page, '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });

  await page.locator('.theme-btn').first().click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
  assert.equal(
    await page.locator('.theme-btn').first().getAttribute('aria-label'),
    'Switch to light mode'
  );

  await Promise.all([
    page.waitForURL((url) => url.pathname === '/es'),
    page.locator('.nav__lang').click(),
  ]);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
  assert.equal(
    await page.locator('.theme-btn').first().getAttribute('aria-label'),
    'Cambiar a modo claro'
  );
  await context.close();
});

test('mobile menu traps focus, closes with Escape and restores focus', async () => {
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await goto(page, '/es');

  const opener = page.locator('[data-menu-open]');
  await opener.click();
  await page.waitForFunction(() => {
    const menu = document.querySelector('[data-menu]');
    return menu && !menu.hidden && menu.classList.contains('is-open');
  });
  assert.equal(await opener.getAttribute('aria-expanded'), 'true');
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).overflow),
    'hidden'
  );
  assert.equal(
    await page.evaluate(() => !!document.activeElement?.closest('[data-menu]')),
    true,
    'focus should move into the menu'
  );

  for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() => !!document.activeElement?.closest('[data-menu]')),
    true,
    'Tab should stay inside the open menu'
  );

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('[data-menu]')?.hidden === true);
  assert.equal(await opener.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open')), true);
  await context.close();
});

test('mobile language switch navigates in the menu', async () => {
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await goto(page, '/es#work');
  await page.locator('[data-menu-open]').click();
  await page.waitForFunction(() => document.querySelector('[data-menu]')?.classList.contains('is-open'));
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/' && url.hash === '#work'),
    page.locator('.menu__lang').click(),
  ]);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  await context.close();
});

test('reading depth toggles, persists and keeps the URL honest', async () => {
  const { context, page } = await newPage();
  await goto(page, '/store-pricing-ai');
  await page.evaluate(() => localStorage.removeItem('case-depth'));
  await page.reload({ waitUntil: 'load' });

  const inline = page.locator('[data-depth-toggle]:not([data-floating])');
  await inline.locator('[data-value="tldr"]').click();
  await page.waitForFunction(
    () =>
      new URL(location.href).searchParams.get('view') === 'tldr' &&
      document.documentElement.classList.contains('depth-tldr')
  );
  assert.equal(
    await inline.locator('[data-value="tldr"]').getAttribute('aria-checked'),
    'true'
  );
  assert.equal(await page.evaluate(() => localStorage.getItem('case-depth')), 'tldr');

  await page.reload({ waitUntil: 'load' });
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains('depth-tldr')),
    true,
    'TL;DR should persist after reload'
  );

  const inline2 = page.locator('[data-depth-toggle]:not([data-floating])');
  await inline2.locator('[data-value="full"]').click();
  await page.waitForFunction(
    () =>
      new URL(location.href).searchParams.get('view') === 'full' &&
      !document.documentElement.classList.contains('depth-tldr')
  );
  await context.close();
});

test('floating depth toggle keeps the reader in place', async () => {
  for (const { viewport, scroll } of [
    { viewport: { width: 1440, height: 900 }, scroll: 1800 },
    { viewport: { width: 390, height: 844 }, scroll: 1200 },
  ]) {
    const { context, page } = await newPage({ viewport });
    await goto(page, '/aprender-digital');
    await page.evaluate(() => localStorage.removeItem('case-depth'));
    await page.reload({ waitUntil: 'load' });

    await page.locator('[data-depth-toggle]:not([data-floating]) [data-value="tldr"]').click();
    await page.waitForFunction(() => document.documentElement.classList.contains('depth-tldr'));
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    await page.waitForFunction(() =>
      document.querySelector('[data-depth-toggle][data-floating]')?.classList.contains('is-shown')
    );

    const before = await page.evaluate(() => window.scrollY);
    await page.locator('[data-depth-toggle][data-floating] [data-value="full"]').click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('depth-tldr'));
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => window.scrollY);
    assert.ok(
      Math.abs(after - before) < 5,
      `floating toggle jumped from ${before} to ${after} at ${viewport.width}px`
    );
    await context.close();
  }
});

test('partially visible reveal blocks appear without extra scroll', async () => {
  const { context, page } = await newPage({ viewport: { width: 1440, height: 900 } });
  for (const route of ['/', '/es']) {
    await goto(page, route);
    const partiallyVisible = await page.evaluate(() => {
      const rect = document.querySelector('.logos').getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    assert.equal(partiallyVisible, true, `logo strip should peek into the first viewport on ${route}`);
    await page.waitForFunction(() => document.querySelector('.logos')?.classList.contains('is-in'));
    await page.waitForTimeout(700);
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.querySelector('.logos')).opacity),
      '1',
      `logo strip should be visible on ${route}`
    );
  }
  await context.close();
});

test('Spanish TL;DR shows the short version, not the full story', async () => {
  const { context, page } = await newPage();
  const visibleSections = () => page.evaluate(() => ({
    count: [...document.querySelectorAll('.case-page section')]
      .filter((section) => getComputedStyle(section).display !== 'none').length,
    hiddenFull: [...document.querySelectorAll('[data-depth="full"]')]
      .every((el) => getComputedStyle(el).display === 'none'),
    note: document.querySelector('.tldr-note')?.textContent?.trim() ?? '',
    noteVisible: (() => {
      const note = document.querySelector('.tldr-note');
      return note ? getComputedStyle(note).display !== 'none' : false;
    })(),
    tldrClass: document.documentElement.classList.contains('depth-tldr'),
  }));

  await goto(page, '/es/aprender-digital?view=tldr');
  assert.match(
    await page.locator('[data-depth-toggle]:not([data-floating]) [data-value="tldr"]').innerText(),
    /Versión corta/i
  );
  const tldr = await visibleSections();
  assert.equal(tldr.tldrClass, true);
  assert.equal(tldr.hiddenFull, true, 'full-only blocks must stay hidden in TL;DR');
  assert.equal(tldr.noteVisible, true, 'the short-version note should be visible');
  assert.match(tldr.note, /versión corta/i);

  await goto(page, '/es/aprender-digital?view=full');
  const full = await visibleSections();
  assert.equal(full.tldrClass, false);
  assert.ok(tldr.count < full.count, `TL;DR (${tldr.count}) should be shorter than full (${full.count})`);
  await context.close();
});

test('footer game loads lazily only after the start action', async () => {
  const { context, page } = await newPage();
  await goto(page, '/');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-crt-game] iframe').count(), 0, 'iframe loaded too early');

  await page.locator('[data-crt-start]').click();
  await page.waitForFunction(() => !!document.querySelector('[data-crt-game] iframe'));
  const src = await page.locator('[data-crt-game] iframe').getAttribute('src');
  assert.equal(src, '/play/alborada/?embed=1');

  await page.locator('[data-crt-sound]').click();
  assert.equal(await page.locator('[data-crt-sound]').getAttribute('aria-pressed'), 'true');
  await context.close();
});

test('side projects and recently played carousels move', async () => {
  const { context, page } = await newPage();
  await goto(page, '/');

  const side = page.locator('[data-carousel]');
  await side.scrollIntoViewIfNeeded();
  await side.locator('[data-next]').click();
  await page.waitForTimeout(700);
  const sideState = await side.locator('[data-track]').evaluate((track) => ({
    left: track.scrollLeft,
    prevDisabled: track.parentElement?.querySelector('[data-prev]')?.disabled,
  }));
  assert.ok(sideState.left > 0, 'side projects carousel did not move');
  assert.equal(sideState.prevDisabled, false, 'previous arrow should enable after moving');

  await goto(page, '/about');
  const games = page.locator('[data-games]');
  await games.scrollIntoViewIfNeeded();
  await games.locator('[data-next]').click();
  await page.waitForTimeout(700);
  const gamesState = await games.locator('[data-track]').evaluate((track) => ({
    left: track.scrollLeft,
    prevDisabled: track.parentElement?.querySelector('[data-prev]')?.disabled,
  }));
  assert.ok(gamesState.left > 0, 'recently played carousel did not move');
  assert.equal(gamesState.prevDisabled, false, 'previous arrow should enable after moving');
  await context.close();
});

test('no horizontal overflow at phone and desktop widths', async () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    const { context, page } = await newPage({ viewport });
    for (const route of ROUTES) {
      await goto(page, route);
      const overflow = await page.evaluate(() => ({
        inner: window.innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      assert.ok(
        overflow.doc <= overflow.inner + 1 && overflow.body <= overflow.inner + 1,
        `horizontal overflow on ${route} at ${viewport.width}px: ${JSON.stringify(overflow)}`
      );
    }
    await context.close();
  }
});

test('reduced motion keeps the page usable', async () => {
  const { context, page } = await newPage({ reducedMotion: 'reduce' });
  await goto(page, '/');
  await page.waitForTimeout(900);
  assert.equal(await page.locator('h1').isVisible(), true);
  assert.equal(await page.locator('h1').evaluate((el) => getComputedStyle(el).opacity), '1');

  await page.locator('[data-menu-open]').count(); // no-op on desktop, keeps the test honest
  const theme = page.locator('.theme-btn').first();
  await theme.click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await context.close();
});

test('no heading leaves a single word on a line', async () => {
  // Measure the settled layout: entrance animations translate words by line.
  const { context, page } = await newPage({ reducedMotion: 'reduce' });
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await goto(page, route);
      const orphans = await page.evaluate(() => {
        const out = [];
        const headings = [...document.querySelectorAll('h1,h2,h3')].filter((heading) => {
          const rect = heading.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        for (const heading of headings) {
          const words = [];
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            for (const match of node.textContent.matchAll(/\S+/g)) {
              const range = document.createRange();
              range.setStart(node, match.index);
              range.setEnd(node, match.index + match[0].length);
              const rect = range.getBoundingClientRect();
              if (rect.width) words.push({ word: match[0], top: Math.round(rect.top) });
            }
          }

          if (words.length < 2) continue;
          const lines = [];
          let current = [];
          let top = null;
          for (const word of words) {
            if (top === null || Math.abs(word.top - top) > 2) {
              if (current.length) lines.push(current);
              current = [word];
              top = word.top;
            } else {
              current.push(word);
            }
          }
          if (current.length) lines.push(current);

          if (lines.length > 1 && lines.some((line) => line.length === 1)) {
            out.push({
              heading: heading.innerText.replace(/\s+/g, ' ').trim(),
              lines: lines.map((line) => line.map((word) => word.word).join(' ')),
            });
          }
        }
        return out;
      });

      assert.deepEqual(
        orphans,
        [],
        `single-word heading line at ${width}px on ${route}: ${JSON.stringify(orphans)}`
      );
    }
  }
  await context.close();
});

test('all images above the fold decode and no hero image is broken', async () => {
  const { context, page } = await newPage();
  for (const route of ['/', '/es', '/about', '/es/about']) {
    await goto(page, route);
    await page.waitForTimeout(400);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          const aboveFold = rect.top < window.innerHeight && rect.bottom > 0;
          return aboveFold && img.complete && img.naturalWidth === 0;
        })
        .map((img) => img.getAttribute('src'))
    );
    assert.deepEqual(broken, [], `broken above-the-fold image on ${route}`);
  }
  await context.close();
});
