const { renderServices } = require('../lib/services.cjs');
module.exports = class {
  data() { return { permalink: '/services/index.html', eleventyExcludeFromCollections: true }; }
  render() {
    return renderServices({ siteUrl: process.env.SITE_URL || process.env.CF_PAGES_URL || '', pathPrefix: process.env.SITE_PATH_PREFIX || '' });
  }
};
