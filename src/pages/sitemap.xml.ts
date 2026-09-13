import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJstMidnightUtc(date: Date): string {
  const utc = new Date(date.getTime() - JST_OFFSET_MS);
  return utc.toISOString().split('.')[0] + 'Z';
}

export async function GET(context: APIContext) {
  const siteUrl = context.site!.origin;
  const allArticles = await getCollection('articles');

  const staticPages = [
    { loc: '/' },
    { loc: '/carrier/' },
  ];

  const articlePages = allArticles
    .filter((article) => !article.data.externalUrl)
    .map((article) => ({
      loc: `/articles/${article.id}.html`,
      lastmod: article.data.date ? toJstMidnightUtc(article.data.date) : undefined,
    }));

  const entries = [...staticPages, ...articlePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${siteUrl}${entry.loc}</loc>${
      'lastmod' in entry && entry.lastmod
        ? `
    <lastmod>${entry.lastmod}</lastmod>`
        : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
