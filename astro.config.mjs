import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
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

// Maps article slug (e.g. "2025/12/12/modoki") to its frontmatter `date`,
// used to set <lastmod> on article pages in the sitemap.
const articlesDir = fileURLToPath(new URL('./src/content/articles', import.meta.url));

const walkMarkdownFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(full);
    return extname(entry.name) === '.md' ? [full] : [];
  });

const articleLastmod = new Map(
  walkMarkdownFiles(articlesDir).map((file) => {
    const slug = relative(articlesDir, file).replace(/\.md$/, '').split('\\').join('/');
    const frontmatter = readFileSync(file, 'utf-8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const date = frontmatter.match(/^date:\s*(.+)$/m)?.[1].trim();
    return [slug, date];
  }),
);

// @astrojs/sitemap always serializes <lastmod> via Date#toISOString() (e.g.
// "2026-07-01T00:00:00.000Z"). Shift the clock forward 9 hours and relabel
// the offset as "+00:00" so it reads "2026-07-01T09:00:00+00:00".
const toNineOClockUtc = (isoString) => {
  const shifted = new Date(new Date(isoString).getTime() + 9 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}+00:00`;
};

const sitemapLastmodOffset = {
  name: 'sitemap-lastmod-offset',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const distDir = fileURLToPath(dir);
      for (const name of readdirSync(distDir)) {
        if (!/^sitemap(-\d+|-index)?\.xml$/.test(name)) continue;
        const filePath = join(distDir, name);
        const xml = readFileSync(filePath, 'utf-8').replace(
          /<lastmod>([^<]+)<\/lastmod>/g,
          (_, iso) => `<lastmod>${toNineOClockUtc(iso)}</lastmod>`,
        );
        writeFileSync(filePath, xml);
      }
    },
  },
};

export default defineConfig({
  integrations: [
    compress(),
    sitemap({
      filter: (page) => !isNoindexPage(page),
      serialize(item) {
        const { pathname } = new URL(item.url);
        const lastmod = articleLastmod.get(pathname.replace(/^\/articles\//, ''));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    sitemapLastmodOffset,
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
