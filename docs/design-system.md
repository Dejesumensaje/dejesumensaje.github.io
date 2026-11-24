# Design system rules

This portfolio is also a working example of the system it describes. Changes to
layout should extend the system, not add one-off values.

## Spacing

Spacing uses a **4px base**. In active UI code, `padding`, `margin`, `gap`,
`row-gap`, `column-gap`, `scroll-padding` and `scroll-margin` must use a
`--space-*` token. No hardcoded `px`, `em` or `rem` values.

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-9: 36px;
--space-10: 40px;
--space-11: 48px;
--space-12: 52px;
--space-13: 56px;
--space-14: 64px;
--space-15: 72px;
--space-16: 80px;
--space-17: 88px;
--space-18: 96px;
--space-19: 112px;
--space-20: 160px;
--space-21: 240px;
```

Semantic aliases keep layout decisions readable:

```css
--grid-margin: var(--space-15);
--gutter: var(--space-6);
--space-section: var(--space-20);
--space-chapter: var(--space-18);
--space-page-top: var(--space-19);
--space-before-footer: var(--space-21);
--space-avatar: var(--space-4);
```

`--grid-margin`, `--gutter`, the section aliases and `--space-avatar` change at
the responsive breakpoints. For example, the hero avatar is 16px on desktop and
8px on phones.

### Negative spacing

Use `calc(var(--space-n) * -1)` for negative offsets; do not write `-16px`.
Decorative 1px lines use `--hairline`.

### Adding a step

1. The value must be a multiple of 4.
2. Add it to the scale in `src/styles/f.css`.
3. Use the token; do not duplicate the pixel value in component CSS.

## Layout

- The content grid maxes out at 1296px.
- `.split` labels get extra width between 900–1300px and stack below 900px.
- The desktop navigation becomes the mobile menu below 900px.
- Multi-column card grids use `auto-fit` with sensible minimums, so they do not
  create narrow columns that break headings.
- Experience rows stack below 1300px.

## Typography and headings

- Allo (`--font-display`, `--font-body`) sets headings, navigation, buttons,
  card text and figures. The file in `public/fonts/allo-var.woff2` is an
  instance with roundness fixed at 20 and a Latin subset; weight and optical
  size stay variable. Headings use `--weight-display` (540) and `--weight-h3`
  (600).
- PT Serif (`--font-serif`) is for reading only: `.prose` at `--text-read`
  (19px, 18px on phones) and pull quotes, which are set entirely in italic.
  It has 400, 700 and 400 italic; do not use it for interface text.
- Each page has exactly one `h1`; heading levels never skip.
- Section headings use `h2`; cards and subsections use `h3`.
- Pull quotes are emphasis paragraphs (`p.t-h2.pull`), never headings.
- Titles and subtitles do not end with a period.
- Case-study kickers are intentionally omitted; the title leads.
- Headings use `text-wrap: balance`. The E2E suite checks that no heading leaves
  a single word on a line at 320, 360, 390, 768, 1024 and 1440px.
- The 404 title scales fluidly so it stays on one line.

## Checks

```bash
npm run lint          # spacing tokens + 4px scale
npm run check         # Astro + TypeScript
npm test              # build + static + browser suite
```

The spacing lint is deterministic and runs in CI before the typecheck. Do not
replace it with an AI review: an agent can help review intent, but the gate must
be reproducible.
