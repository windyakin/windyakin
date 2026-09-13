import { defineConfig } from 'astro/config';
import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import compress from '@playform/compress';
import sitemap from '@astrojs/sitemap';
import { autolinkHeadings } from './src/plugins/satteri-autolink-headings.mjs';
import { figure } from './src/plugins/satteri-figure.mjs';

// Pagination pages (/articles/1, /articles/2, ...) and tag pages (/tags/*)
// are marked noindex,follow in BaseLayout, so keep them out of the sitemap too.
const isNoindexPage = (path) => {
  const { pathname } = new URL(path);
  return /^\/tags\//.test(pathname) || /^\/articles\/\d+\/?$/.test(pathname);
};

export default defineConfig({
  integrations: [
    compress(),
    sitemap({
      filter: (page) => !isNoindexPage(page),
    }),
  ],
  site: 'https://windyakin.net',
  build: {
    format: 'preserve',
    assets: 'assets',
  },
  markdown: {
    processor: satteri({
      hastPlugins: [satteriHeadingIdsPlugin(), autolinkHeadings, figure],
    }),
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
