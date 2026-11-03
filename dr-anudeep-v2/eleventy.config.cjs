const { createSitePages } = require('./lib/blog.cjs');
const { finalizeOutput } = require('./lib/site-paths.cjs');

module.exports = function (config) {
  config.addGlobalData('sitePages', () => createSitePages({
    root: __dirname,
    preview: process.env.BLOG_PREVIEW === '1',
    siteUrl: process.env.SITE_URL || process.env.CF_PAGES_URL || '',
    pathPrefix: process.env.SITE_PATH_PREFIX || ''
  }));
  config.addWatchTarget('content/blog/');
  config.addWatchTarget('content/services.json');
  config.addWatchTarget('blog/_includes/');
  config.addWatchTarget('lib/');
  config.addPassthroughCopy({ 'index.html': 'index.html' });
  config.addPassthroughCopy('brand-guide/*.{html,css,js}');
  // Only browser assets are published; editorial notes and tooling stay in source.
  config.addPassthroughCopy('assets/**/*.{css,js,woff2,png,jpg,jpeg,webp,avif,gif,svg,ico}');
  config.on('eleventy.after', async () => {
    finalizeOutput(require('node:path').join(__dirname, '_site'), {
      pathPrefix: process.env.SITE_PATH_PREFIX || '',
      preview: process.env.BLOG_PREVIEW === '1'
    });
  });
  return {
    dir: { input: 'blog', output: '_site' },
    templateFormats: ['11ty.js']
  };
};
