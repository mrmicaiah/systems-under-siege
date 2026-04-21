const { DateTime } = require('luxon');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const markdownIt = require('markdown-it');

module.exports = function(eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(pluginRss);

  // Passthrough copy - object syntax maps src paths to output paths
  eleventyConfig.addPassthroughCopy({"src/css": "css"});
  eleventyConfig.addPassthroughCopy({"src/js": "js"});
  eleventyConfig.addPassthroughCopy({"src/images": "images"});
  eleventyConfig.addPassthroughCopy({"src/robots.txt": "robots.txt"});
  eleventyConfig.addPassthroughCopy({"src/CNAME": "CNAME"});

  // Date filters
  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('LLLL d, yyyy');
  });

  eleventyConfig.addFilter('htmlDateString', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('isoDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISO();
  });

  // Generic date filter for formatting strings like "now"
  eleventyConfig.addFilter('date', (value, format) => {
    let luxonFormat = format;
    if (format) {
      luxonFormat = format
        .replace('%Y', 'yyyy')
        .replace('%m', 'LL')
        .replace('%d', 'dd')
        .replace('%H', 'HH')
        .replace('%M', 'mm')
        .replace('%S', 'ss');
    }
    
    if (value === 'now') {
      return DateTime.now().toFormat(luxonFormat || 'yyyy');
    }
    if (typeof value === 'string') {
      return DateTime.fromISO(value, { zone: 'utc' }).toFormat(luxonFormat || 'yyyy');
    }
    return DateTime.fromJSDate(value, { zone: 'utc' }).toFormat(luxonFormat || 'yyyy');
  });

  eleventyConfig.addFilter('readingTime', content => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  });

  eleventyConfig.addFilter('excerpt', content => {
    const stripped = content.replace(/<[^>]*>/g, '');
    return stripped.substring(0, 160) + (stripped.length > 160 ? '...' : '');
  });

  eleventyConfig.addFilter('limit', (arr, limit) => {
    return arr.slice(0, limit);
  });

  eleventyConfig.addFilter('head', (arr, n) => {
    if (!Array.isArray(arr)) return [];
    if (n < 0) return arr.slice(n);
    return arr.slice(0, n);
  });

  // Filter out a specific item from an array (e.g., removing 'posts' tag from keywords)
  eleventyConfig.addFilter('without', (arr, item) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => x !== item);
  });

  // Find related posts by shared tags. Scores by tag overlap (more shared tags = higher rank),
  // ties broken by date (newer first). Excludes the current post.
  eleventyConfig.addFilter('relatedPosts', (collection, currentUrl, currentTags, limit) => {
    if (!Array.isArray(collection) || !Array.isArray(currentTags)) return [];

    const myTags = currentTags.filter(t => t !== 'posts');
    if (myTags.length === 0) return [];

    const scored = collection
      .filter(post => post.url !== currentUrl)
      .map(post => {
        const postTags = ((post.data && post.data.tags) || []).filter(t => t !== 'posts');
        const overlap = postTags.filter(t => myTags.includes(t)).length;
        return { post, overlap };
      })
      .filter(item => item.overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return b.post.date - a.post.date;
      });

    return scored.slice(0, limit || 4).map(item => item.post);
  });

  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  });
  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addCollection('posts', collection => {
    return collection.getFilteredByGlob('src/posts/*.md').sort((a, b) => {
      return b.date - a.date;
    });
  });

  eleventyConfig.addCollection('tagList', collection => {
    const tags = new Set();
    collection.getAll().forEach(item => {
      if (item.data.tags) {
        item.data.tags.forEach(tag => tags.add(tag));
      }
    });
    return [...tags].filter(tag => tag !== 'posts');
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data'
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
};
