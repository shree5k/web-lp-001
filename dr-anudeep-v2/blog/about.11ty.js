const { renderAbout } = require('../lib/about.cjs');
module.exports = class {
  data() { return { permalink: '/about/index.html', eleventyExcludeFromCollections: true }; }
  render() {
    return renderAbout({ siteUrl: process.env.SITE_URL || process.env.CF_PAGES_URL || '', pathPrefix: process.env.SITE_PATH_PREFIX || '' });
  }
};
