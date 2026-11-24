# QC suite

Pruebas del portafolio construido en `dist/`. No usan el servidor de desarrollo.
Requiere **Node 22.23.4+** (el proyecto usa Node 24, ver `.nvmrc`).

```bash
npm install
npx playwright install chromium   # solo la primera vez
npm run check                     # Astro + TypeScript
npm test                          # build + 37 pruebas
npm run test:static               # enlaces, i18n, SEO, a11y estática, presupuestos
npm run test:e2e                  # navegador real (Playwright)
```

- `static.test.mjs` recorre las 16 rutas generadas y valida canónicas, hreflang,
  switcher de idioma, enlaces/anclas, assets, títulos, metadatos sociales,
  sitemap, redirects de URL con barra final, ids, nombres accesibles, `alt`,
  lazy-loading, spacing en base de 4 px y presupuestos de JS/CSS.
- `e2e.test.mjs` levanta un servidor estático que imita GitHub Pages (URLs sin
  `.html`) y prueba carga sin errores, cambio EN/ES con `?view=tldr` y `#hash`,
  continuidad de TL;DR entre casos, URLs con barra final, 404 bilingüe, tema
  persistente, menú móvil con foco atrapado, CRT perezoso, carruseles, overflow
  horizontal, reduced motion, imágenes rotas y palabras huérfanas en títulos a
  320/360/390/768/1024/1440 px.
