import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages that carry a noindex meta stay out of the sitemap.
const NOINDEX_SLUGS = ['404', 'es/404'];

export default defineConfig({
  site: 'https://dejesumensaje.com',
  output: 'static',
  build: {
    assets: '_astro',
    format: 'file',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !NOINDEX_SLUGS.some(
          (slug) =>
            page === `https://dejesumensaje.com/${slug}` ||
            page === `https://dejesumensaje.com/${slug}/`
        ),
      serialize(item) {
        // build.format 'file' emits page.html; GitHub Pages serves it at the
        // extensionless URL, which is the canonical form.
        const url = item.url.replace(/\/$/, '');
        item.url = url === 'https://dejesumensaje.com' ? 'https://dejesumensaje.com/' : url;
        return item;
      },
    }),
  ],
});
