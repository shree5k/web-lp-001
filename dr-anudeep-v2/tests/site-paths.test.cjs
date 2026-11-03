const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizePathPrefix, prefixHtml } = require('../lib/site-paths.cjs');

test('deployment prefixes accept root and repository paths but reject unsafe forms', () => {
  assert.equal(normalizePathPrefix(''), '');
  assert.equal(normalizePathPrefix('/'), '');
  assert.equal(normalizePathPrefix('/clinic-site/'), '/clinic-site');
  for (const value of ['clinic', '//cdn.test', '/a/../b', '/a/./b', '/a?x=1', '/a#b', 'https://example.test/a', '/a//b']) {
    assert.throws(() => normalizePathPrefix(value), /SITE_PATH_PREFIX/, value);
  }
});

test('HTML prefixing preserves external, relative, fragment and protocol-relative URLs', () => {
  const html = '<a href="/blog/">Blog</a><a href="/#about">About</a><script src="/assets/js/blog.js"></script>'
    + '<a href="https://example.test/">External</a><a href="#topic">Jump</a><img src="images/local.webp">'
    + '<img src="//cdn.test/image.webp"><img srcset="/assets/one.webp 1x, /assets/two.webp 2x">';
  assert.equal(prefixHtml(html), html);
  const result = prefixHtml(html, '/clinic');
  assert.match(result, /href="\/clinic\/blog\/"/);
  assert.match(result, /href="\/clinic\/#about"/);
  assert.match(result, /src="\/clinic\/assets\/js\/blog\.js"/);
  assert.match(result, /href="https:\/\/example.test\/"/);
  assert.match(result, /href="#topic"/);
  assert.match(result, /src="images\/local.webp"/);
  assert.match(result, /src="\/\/cdn.test\/image.webp"/);
  assert.match(result, /srcset="\/clinic\/assets\/one.webp 1x, \/clinic\/assets\/two.webp 2x"/);
});
