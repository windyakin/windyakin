const path = require('path');

const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItEleventyImg = require("markdown-it-eleventy-img");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

const CleanCSS = require("clean-css");
const HtmlMinifier = require('html-minifier');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy('CNAME');

  // Add plugin
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addFilter('dateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'Asia/Tokyo' }).toFormat('yyyy-MM-dd');
  });

  eleventyConfig.addFilter("tags", (tags) => {
    return (tags || []).filter(tag => ["all", "articles"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("cssmin", (css) => {
    return new CleanCSS({}).minify(css).styles;
  });

  eleventyConfig.addTransform('htmlmin', function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      let minified = HtmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });

      return minified;
    }
    return content;
  })

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "before",
      class: "anchor-link",
      symbol: "#"
    }),
    level: [1, 2, 3, 4],
  }).use(markdownItEleventyImg, {
    imgOptions: {
      outputDir: "_site/img/optimized/",
      urlPath: "/img/optimized/"
    },
    resolvePath: (filepath, env) => path.join(path.dirname(env.page.inputPath), filepath),
    globalAttributes: {
      class: "responsive-img",
      decoding: "async"
    },
    renderImage(image, attributes) {
      const [ Image, options ] = image;
      const [ src, attrs ] = attributes;

      Image(src, options);

      const metadata = Image.statsSync(src, options);
      const imageMarkup = Image.generateHTML(metadata, attrs, {
        whitespaceMode: "inline"
      });

      return `<figure>${imageMarkup}${attrs.title ? `<figcaption>${attrs.title}</figcaption>` : ""}</figure>`;
    }
  });
  eleventyConfig.setLibrary("md", markdownLibrary);
};
