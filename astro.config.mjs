import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dejesumensaje.com',
  output: 'static',
  build: {
    assets: '_astro',
    format: 'file',
  },
});
