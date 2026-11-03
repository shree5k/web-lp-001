module.exports = class {
  data() {
    return {
      pagination: { data: 'sitePages', size: 1, alias: 'page' },
      permalink: data => data.page.url,
      eleventyExcludeFromCollections: true
    };
  }
  render({ page }) { return page.html; }
};
