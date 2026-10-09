import { defineConfig } from 'astro/config';
import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import compress from '@playform/compress';
import sitemap from '@astrojs/sitemap';
import { autolinkHeadings } from './src/plugins/satteri-autolink-headings.mjs';
import { figure } from './src/plugins/satteri-figure.mjs';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export default defineConfig({
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/tags/') &&
        !page.includes('/feed/') &&
        !/\/articles\/\d+$/.test(page),
      serialize: (item) => {
        const match = item.url.match(/\/articles\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (match) {
          const [, year, month, day] = match;
          const utcMs = Date.UTC(Number(year), Number(month) - 1, Number(day));
          item.lastmod = new Date(utcMs - JST_OFFSET_MS).toISOString();
        }
        return item;
      },
    }),
    compress(),
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
