// Publishing-boundary and rendering checks using isolated Markdown fixtures.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSitePages, loadArticles, CATEGORIES, categorySlug } = require('../lib/blog.cjs');

const PROJECT = path.resolve(__dirname, '..');
const ORIGIN = 'https://example.test';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'anudeep-blog-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'content/blog'), { recursive: true });
  fs.mkdirSync(path.join(root, 'blog/_includes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'assets/images'), { recursive: true });
  for (const file of ['header.html', 'footer.html']) {
    fs.copyFileSync(path.join(PROJECT, 'blog/_includes', file), path.join(root, 'blog/_includes', file));
  }
  fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html lang="en"><head><title>Practice</title></head><body><header></header><main></main><footer></footer></body></html>');
  fs.writeFileSync(path.join(root, 'assets/images/test.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1uoAAAAASUVORK5CYII=', 'base64'));
  function article(slug, overrides = {}, body = '## A useful heading\n\nA short patient education article.') {
    const metadata = {
      title: `Article ${slug}`, slug, summary: `An introduction to ${slug}.`,
      cover: '/assets/images/test.png', coverAlt: 'Illustrative test image',
      category: CATEGORIES[0], author: 'Dr. Anudeep T Channaiah',
      date: '2026-10-01', status: 'published', ...overrides
    };
    for (const key of Object.keys(metadata)) if (metadata[key] === undefined) delete metadata[key];
    const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    fs.writeFileSync(path.join(root, 'content/blog', `${slug}.md`), `---\n${frontmatter}\n---\n${body}\n`);
    return metadata;
  }
  return { root, article };
}

const options = (root, extra = {}) => ({ root, preview: false, siteUrl: '', ...extra });
const page = (pages, url) => {
  const result = pages.find(item => item.url === url);
  assert.ok(result, `Missing route ${url}`);
  return result.html;
};
const articleLinks = html => [...html.matchAll(/href=["'](\/blog\/[^"']+\/)["']/g)].map(match => match[1]);

test('production excludes draft, implicit draft, and demo articles from every output', t => {
  const f = fixture(t);
  f.article('published-one');
  f.article('private-draft', { status: 'draft', title: 'PRIVATE DRAFT MARKER' });
  f.article('implicit-draft', { status: undefined, title: 'IMPLICIT DRAFT MARKER' });
  f.article('layout-demo', { demo: true, title: 'DEMO CONTENT MARKER' });
  const articles = loadArticles(options(f.root));
  assert.deepEqual(articles.map(article => article.slug), ['published-one']);
  const pages = createSitePages(options(f.root, { siteUrl: ORIGIN }));
  assert.ok(pages.some(item => item.url === '/blog/published-one/'));
  for (const slug of ['private-draft', 'implicit-draft', 'layout-demo']) {
    assert.ok(!pages.some(item => item.url === `/blog/${slug}/`));
    assert.ok(!pages.some(item => item.html.includes(`/blog/${slug}/`)));
  }
  const output = pages.map(item => item.html).join('\n');
  for (const marker of ['PRIVATE DRAFT MARKER', 'IMPLICIT DRAFT MARKER', 'DEMO CONTENT MARKER']) assert.ok(!output.includes(marker));
  page(pages, '/feed.xml');
  page(pages, '/sitemap.xml');
  page(pages, '/404.html');
});

test('preview includes drafts and demos, visibly badges them, and noindexes HTML pages', t => {
  const f = fixture(t);
  f.article('published-one');
  f.article('private-draft', { status: 'draft' });
  f.article('layout-demo', { demo: true });
  const preview = options(f.root, { preview: true, siteUrl: ORIGIN });
  assert.equal(loadArticles(preview).length, 3);
  const pages = createSitePages(preview);
  assert.match(page(pages, '/blog/private-draft/'), /draft/i);
  assert.match(page(pages, '/blog/layout-demo/'), /demo/i);
  for (const item of pages.filter(item => item.url.endsWith('/') || item.url.endsWith('.html'))) {
    assert.match(item.html, /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i, item.url);
  }
});

test('frontmatter validates published metadata, duplicates and missing cover files', t => {
  const invalid = [
    ['title', undefined], ['slug', 'Invalid Slug'], ['summary', undefined],
    ['cover', undefined], ['coverAlt', undefined], ['category', 'Unknown category'],
    ['author', 42], ['date', 'not-a-date'], ['date', '2026-02-30'],
    ['cover', '/assets/images/missing.png'], ['cover', 'https://example.test/cover.png'],
    ['status', 'scheduled'], ['demo', 'false'], ['featured', 'yes'],
    ['advanced', 'invalid'], ['advanced', []], ['advanced', { featured: 'yes' }],
    ['advanced', { author: 42 }], ['advanced', { seoDescription: 42 }]
  ];
  for (const [field, value] of invalid) {
    const f = fixture(t);
    f.article('invalid-article', { [field]: value });
    assert.throws(() => loadArticles(options(f.root)), undefined, `Invalid ${field} was accepted`);
  }
  const duplicate = fixture(t);
  duplicate.article('first-document', { slug: 'same-route' });
  duplicate.article('second-document', { slug: 'same-route', status: 'draft' });
  assert.throws(() => loadArticles(options(duplicate.root)), /duplicate|slug/i);
  const empty = fixture(t);
  empty.article('empty-body', {}, '');
  assert.throws(() => loadArticles(options(empty.root)), /body/i);
});

test('articles render Markdown safely and compute reading time without executing HTML', t => {
  const f = fixture(t);
  const hostileTitle = 'Title <img src=x onerror="alert(1)"> & "quoted"';
  const body = `## Useful heading\n\n${'Word '.repeat(700)}\n\n<script>alert("unsafe")</script>\n\n[Unsafe link](javascript:alert(1))`;
  f.article('safe-rendering', { title: hostileTitle }, body);
  const [article] = loadArticles(options(f.root));
  assert.equal(article.url, '/blog/safe-rendering/');
  assert.equal(article.date, '2026-10-01');
  assert.equal(article.title, hostileTitle);
  assert.equal(article.body.trim(), body.trim());
  assert.ok(Number.isInteger(article.readingTime) && article.readingTime >= 3);
  assert.match(article.html, /<h2[^>]*>Useful heading<\/h2>/);
  assert.ok(!article.html.includes('<script>'));
  assert.ok(!article.html.includes('href="javascript:'));
  const html = page(createSitePages(options(f.root, { siteUrl: ORIGIN })), article.url);
  assert.ok(!html.includes('<img src=x onerror='));
  assert.ok(!html.includes('<script>alert('));
  assert.match(html, /&lt;img/);
});

test('all and category indexes paginate twelve cards and exclude their featured article from every grid', t => {
  const f = fixture(t);
  f.article('featured-article', { featured: true, date: '2026-09-01' });
  for (let i = 1; i <= 13; i++) f.article(`article-${i}`, { date: `2026-10-${String(i).padStart(2, '0')}` });
  const pages = createSitePages(options(f.root));
  const category = categorySlug(CATEGORIES[0]);
  for (const base of ['/blog/', `/blog/category/${category}/`]) {
    const first = page(pages, base);
    const second = page(pages, `${base}page/2/`);
    const firstLinks = articleLinks(first).filter(url => /^\/blog\/(featured-article|article-\d+)\/$/.test(url));
    const secondLinks = articleLinks(second).filter(url => /^\/blog\/(featured-article|article-\d+)\/$/.test(url));
    assert.equal(firstLinks.filter(url => url === '/blog/featured-article/').length, 1);
    assert.equal(new Set(firstLinks.filter(url => url !== '/blog/featured-article/')).size, 12);
    assert.equal(new Set(secondLinks).size, 1);
    assert.ok(!secondLinks.includes('/blog/featured-article/'));
    assert.equal(new Set([...firstLinks, ...secondLinks]).size, 14);
  }
  assert.ok(!pages.some(item => item.url === '/blog/page/3/'));
});

test('category indexes contain only their category and choose the newest eligible feature when no flag exists', t => {
  const f = fixture(t);
  assert.ok(CATEGORIES.length >= 2);
  f.article('older-one', { date: '2026-09-01' });
  f.article('newest-one', { date: '2026-10-15' });
  f.article('other-category', { category: CATEGORIES[1], date: '2026-10-10' });
  const pages = createSitePages(options(f.root));
  const categoryHTML = page(pages, `/blog/category/${categorySlug(CATEGORIES[0])}/`);
  assert.ok(!articleLinks(categoryHTML).includes('/blog/other-category/'));
  const links = articleLinks(categoryHTML).filter(url => ['/blog/older-one/', '/blog/newest-one/'].includes(url));
  assert.equal(links[0], '/blog/newest-one/');
  assert.equal(links.filter(url => url === '/blog/newest-one/').length, 1);
});

test('canonical and social URLs require a valid HTTPS site origin', t => {
  const f = fixture(t);
  f.article('canonical-article');
  for (const siteUrl of ['', 'http://example.test', 'javascript:alert(1)', 'https://example.test/subpath']) {
    const html = page(createSitePages(options(f.root, { siteUrl })), '/blog/canonical-article/');
    assert.doesNotMatch(html, /<link\b[^>]*rel=["']canonical["']/i);
    assert.doesNotMatch(html, /<meta\b[^>]*property=["']og:url["']/i);
  }
  const pages = createSitePages(options(f.root, { siteUrl: ORIGIN }));
  const html = page(pages, '/blog/canonical-article/');
  assert.match(html, /https:\/\/example\.test\/blog\/canonical-article\//);
  assert.match(html, /<link\b[^>]*rel=["']canonical["']/i);
  assert.match(html, /<meta\b[^>]*property=["']og:url["']/i);
  assert.ok(page(pages, '/feed.xml').includes(`${ORIGIN}/blog/canonical-article/`));
  assert.ok(page(pages, '/sitemap.xml').includes(`${ORIGIN}/blog/canonical-article/`));
});

test('related reading never links unpublished content or repeats an eligible article', t => {
  const f = fixture(t);
  f.article('main-article');
  f.article('related-one');
  f.article('related-two');
  f.article('private-related', { status: 'draft' });
  f.article('demo-related', { demo: true });
  const html = page(createSitePages(options(f.root)), '/blog/main-article/');
  const links = articleLinks(html);
  for (const slug of ['related-one', 'related-two']) {
    assert.equal(links.filter(url => url === `/blog/${slug}/`).length, 1);
  }
  assert.ok(!links.includes('/blog/private-related/'));
  assert.ok(!links.includes('/blog/demo-related/'));
});

test('generated routes do not publish content sources or implementation artifacts', t => {
  const f = fixture(t);
  f.article('public-article');
  const pages = createSitePages(options(f.root));
  assert.equal(new Set(pages.map(item => item.url)).size, pages.length);
  for (const item of pages) {
    assert.ok(item.url.startsWith('/'));
    assert.doesNotMatch(item.url, /(?:content|_includes|lib|node_modules|tests)\/|\.(?:md|cjs|json)$/);
    assert.ok(typeof item.html === 'string');
  }
});

test('actual local draft and demo documents cannot leak into production routes', () => {
  const preview = loadArticles(options(PROJECT, { preview: true }));
  const unpublished = preview.filter(article => article.status !== 'published' || article.demo);
  const production = createSitePages(options(PROJECT));
  for (const article of unpublished) {
    assert.ok(!production.some(item => item.url === article.url), article.slug);
    assert.ok(!production.some(item => item.html.includes(article.url)), article.slug);
  }
});

test('CMS entries derive stable URLs from filenames and default the author', t => {
  const f = fixture(t);
  f.article('first-title', { slug: undefined, author: undefined });
  const [first] = loadArticles(options(f.root));
  assert.equal(first.url, '/blog/first-title/');
  assert.equal(first.author, 'Dr. Anudeep T Channaiah');
  f.article('first-title', { title: 'A completely updated title', slug: '', author: undefined });
  const [updated] = loadArticles(options(f.root));
  assert.equal(updated.url, first.url);
  assert.equal(updated.title, 'A completely updated title');
  assert.equal(updated.author, first.author);
});

test('optional settings support overrides, clear legacy values and preserve old articles', t => {
  const f = fixture(t);
  f.article('optional-settings', { author: 'Legacy author', featured: true,
    seoDescription: 'Legacy search text', advanced: { author: '', featured: false, seoDescription: '' } });
  const [article] = loadArticles(options(f.root));
  assert.equal(article.author, 'Dr. Anudeep T Channaiah');
  assert.equal(article.featured, false);
  assert.equal(article.seoDescription, '');
  f.article('optional-settings', { advanced: { author: 'Approved guest author', featured: true,
    seoDescription: 'A reviewed search introduction' } });
  const [overridden] = loadArticles(options(f.root));
  assert.equal(overridden.author, 'Approved guest author');
  assert.equal(overridden.featured, true);
  assert.equal(overridden.seoDescription, 'A reviewed search introduction');
  const html = page(createSitePages(options(f.root)), '/blog/optional-settings/');
  assert.match(html, /Approved guest author/);
  assert.match(html, /A reviewed search introduction/);
});

test('new editor entries still default to draft and never publish by accident', t => {
  const f = fixture(t);
  f.article('not-ready', { status: undefined, slug: undefined, author: undefined });
  assert.equal(loadArticles(options(f.root)).length, 0);
  assert.equal(loadArticles(options(f.root, { preview: true }))[0].status, 'draft');
});

test('repository paths appear in canonical, social, feed and sitemap URLs', t => {
  const f = fixture(t);
  f.article('project-article');
  const pages = createSitePages(options(f.root, { siteUrl: ORIGIN, pathPrefix: '/clinic' }));
  const html = page(pages, '/blog/project-article/');
  assert.match(html, /https:\/\/example\.test\/clinic\/blog\/project-article\//);
  assert.match(html, /https:\/\/example\.test\/clinic\/assets\/images\/test\.png/);
  assert.ok(page(pages, '/feed.xml').includes(`${ORIGIN}/clinic/blog/project-article/`));
  assert.ok(page(pages, '/sitemap.xml').includes(`${ORIGIN}/clinic/blog/project-article/`));
});
