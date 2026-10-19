import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

// GitHub Pages project site: https://stuko0.github.io/stukostore
// `base` keeps every asset URL under the repository path. A custom domain
// later only needs `site` changed and `base` removed.
export default defineConfig({
  site: 'https://stuko0.github.io',
  base: '/stukostore',
  integrations: [solid()],
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  devToolbar: { enabled: false },
});
