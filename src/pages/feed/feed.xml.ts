import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import type { APIContext } from 'astro';

const parser = new MarkdownIt({ html: true });

export async function GET(context: APIContext) {
  const allArticles = await getCollection('articles');
  const sorted = allArticles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'windyakin.net',
    description: "windyakin's profile and portfolio site.",
    site: context.site!,
    items: sorted.map((article) => ({
      title: article.data.title,
      pubDate: article.data.date,
      link: article.data.externalUrl || `/articles/${article.id}.html`,
      content: sanitizeHtml(parser.render(article.body || ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
  });
}
