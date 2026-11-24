# Agent instructions

Project: William Montoya portfolio (Astro 7, bilingual EN/ES).

Before changing layout, spacing, headings or shared UI, read
[`docs/design-system.md`](docs/design-system.md).

## Non-negotiables

- Spacing uses the `--space-*` scale (4px base). Do not hardcode `px`, `em` or
  `rem` in `padding`, `margin`, `gap` or scroll spacing.
- Do not reduce negative space to make something fit; adjust the layout,
  breakpoint or scale instead.
- No single-word lines inside headings. Test at 320, 360, 390, 768, 1024 and
  1440px.
- One `h1` per page, no skipped heading levels, pull quotes stay `<p>`.
- Keep English at `/` and Spanish under `/es`; every page has a counterpart.
- `src/pages/_legacy-*` and the non-`f/` legacy components are not built.
  Do not import them into live pages.

## Before you finish

```bash
npm run lint     # deterministic spacing contract
npm run check    # Astro + TypeScript
npm test         # build + static + Playwright
```

Use the deterministic lint and tests as the gate. An AI subagent can review
intent or copy, but it must not replace the reproducible checks.
