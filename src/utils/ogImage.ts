import type { ImageMetadata } from 'astro';

export function findFirstImage(
  markdown: string,
  articleId: string,
  allImages: Record<string, { default: ImageMetadata }>,
): ImageMetadata | null {
  const match = markdown.match(/!\[.*?\]\((\S+?)(?:\s+".*?")?\)/);
  if (!match) return null;

  const imgPath = match[1];
  if (/^https?:\/\//.test(imgPath)) return null;

  const cleanPath = imgPath.replace(/^\.\//, '');
  const articleDir = articleId.replace(/\/[^/]+$/, '');

  const key = `/src/content/articles/${articleDir}/${cleanPath}`;
  const entry = allImages[key];
  if (entry) return entry.default;

  return null;
}
