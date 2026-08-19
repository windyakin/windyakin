const path = require("path");
const fs = require("fs");
const Image = require("@11ty/eleventy-img");

module.exports = {
  layout: "layouts/article.njk",
  tags: ["articles"],
  permalink: "{{ page.filePathStem }}.html",
  eleventyComputed: {
    ogImage: (data) => {
      const inputPath = data.page.inputPath;
      const rawContent = fs.readFileSync(inputPath, "utf-8");

      const match = rawContent.match(/!\[.*?\]\((\S+?)(?:\s+".*?")?\)/);
      if (!match) return null;

      const imgPath = match[1];
      if (/^https?:\/\//.test(imgPath)) return imgPath;

      const resolved = path.join(path.dirname(inputPath), imgPath);
      if (!fs.existsSync(resolved)) return null;

      const metadata = Image.statsSync(resolved, {
        outputDir: "_site/img/optimized/",
        urlPath: "/img/optimized/",
      });

      const jpeg = metadata.jpeg;
      if (jpeg && jpeg.length > 0) return jpeg[jpeg.length - 1].url;

      const formats = Object.keys(metadata);
      if (formats.length > 0) {
        const entries = metadata[formats[0]];
        if (entries && entries.length > 0) return entries[entries.length - 1].url;
      }

      return null;
    },
  },
};
