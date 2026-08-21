import { defineConfig } from 'astro/config';
import compress from '@playform/compress';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { rehypeFigure } from './src/plugins/rehype-figure.mjs';

export default defineConfig({
  integrations: [compress()],
  site: 'https://windyakin.net',
  build: {
    format: 'preserve',
    assets: 'assets',
  },
markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'prepend',
        properties: { class: 'anchor-link', ariaHidden: 'true' },
        content: { type: 'text', value: '#' },
      }],
      rehypeFigure,
    ],
  },
});
