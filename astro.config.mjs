import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

// Custom domain: https://store.stuko.dev (GitHub Pages project site behind the
// domain root, so no `base` path). The repository is still served at
// https://stuko0.github.io/stukostore/ as a fallback, but every canonical URL
// points at the custom domain.
export default defineConfig({
  site: 'https://store.stuko.dev',
  integrations: [solid()],
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  devToolbar: { enabled: false },
});
