import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages that carry a noindex meta (NDA-gated cases, 404) stay out of the sitemap.
const NOINDEX_SLUGS = ['key-metrics-over-time', 'crust-upcharge-configurator', '404'];

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
        // build.format 'file' serves /page.html — keep sitemap URLs canonical.
        const url = item.url.replace(/\/$/, '');
        item.url =
          url === 'https://dejesumensaje.com'
            ? 'https://dejesumensaje.com/'
            : `${url}.html`;
        return item;
      },
    }),
  ],
});
