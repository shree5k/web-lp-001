// One sequential build test owns _site while fixture-only unit tests run separately.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadArticles, CATEGORIES, categorySlug } = require('../lib/blog.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, '_site');
const ORIGIN = 'https://example.test';

function build(preview = false, pathPrefix = '') {
  const result = spawnSync(process.execPath, ['scripts/build.cjs', ...(preview ? ['--preview'] : [])], {
    cwd: ROOT,
    env: { ...process.env, SITE_URL: ORIGIN, SITE_PATH_PREFIX: pathPrefix, BLOG_PREVIEW: preview ? '1' : '0' },
    encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${preview ? 'Preview' : 'Production'} build failed:\n${result.stdout}\n${result.stderr}`);
}

function files(directory = OUTPUT) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

function routeFile(url) {
  return path.join(OUTPUT, url, url.endsWith('/') ? 'index.html' : '');
}

function readRoute(url) {
  const filename = routeFile(url);
  assert.ok(fs.existsSync(filename), `Missing built route ${url}`);
  return fs.readFileSync(filename, 'utf8');
}

function decodeAttribute(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
  });
}

function tags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)].map(match => {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
      .map(attribute => [attribute[1].toLowerCase(), decodeAttribute(attribute[3])]));
    return { tag: match[1].toLowerCase(), attrs };
  });
}

function checkBuiltLinks(prefix = '') {
  function pathnameToFile(pathname) {
    assert.ok(!prefix || pathname.startsWith(prefix + '/'), `Link escaped deployment prefix: ${pathname}`);
    return path.resolve(OUTPUT, '.' + decodeURIComponent(pathname.slice(prefix.length)));
  }
  const cache = new Map();
  const parsed = filename => {
    if (!cache.has(filename)) cache.set(filename, tags(fs.readFileSync(filename, 'utf8')));
    return cache.get(filename);
  };
  for (const filename of files().filter(file => file.endsWith('.html'))) {
    const relative = path.relative(OUTPUT, filename).split(path.sep).join('/');
    for (const { tag, attrs } of parsed(filename)) {
      if (!['a', 'link', 'script', 'img', 'use', 'textpath', 'source'].includes(tag)) continue;
      const value = attrs.src ?? attrs.href;
      if (!value || value.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(value)) continue;
      const target = new URL(value, `${ORIGIN}${prefix}/${relative}`);
      let targetFile = pathnameToFile(target.pathname);
      assert.ok(targetFile === OUTPUT || targetFile.startsWith(OUTPUT + path.sep), `Escaping link ${value} in ${relative}`);
      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) targetFile = path.join(targetFile, 'index.html');
      assert.ok(fs.existsSync(targetFile) && fs.statSync(targetFile).isFile(), `Broken ${tag} link ${value} in ${relative}`);
      if (target.hash.length > 1 && targetFile.endsWith('.html')) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(parsed(targetFile).some(node => node.attrs.id === id), `Missing fragment ${value} in ${relative}`);
      }
    }
  }
  // Font and background URLs resolve relative to their stylesheet, not the page.
  for (const filename of files().filter(file => file.endsWith('.css'))) {
    const relative = path.relative(OUTPUT, filename).split(path.sep).join('/');
    for (const match of fs.readFileSync(filename, 'utf8').matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      const value = match[1];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) continue;
      const target = new URL(value, `${ORIGIN}${prefix}/${relative}`);
      const asset = pathnameToFile(target.pathname);
      assert.ok(asset.startsWith(OUTPUT + path.sep) && fs.existsSync(asset), `Broken CSS asset ${value} in ${relative}`);
    }
  }
}

function checkPublicAssetsOnly() {
  for (const filename of files()) {
    const relative = path.relative(OUTPUT, filename).split(path.sep).join('/');
    assert.doesNotMatch(relative, /(?:^|\/)(?:archive|docs|tests|content|lib|_includes|node_modules|scripts)(?:\/|$)/, relative);
    assert.doesNotMatch(relative, /\.(?:md|cjs|json|ya?ml|toml)$/i, relative);
    assert.doesNotMatch(relative, /(?:^|\/)(?:package(?:-lock)?\.json|eleventy\.config\.[^/]+|generated-sources\.json|sources\.json|DESIGN_SYSTEM\.md)$/i, relative);
  }
}

function checkJournalScriptsAndNavigation(prefix = '') {
  for (const filename of files().filter(file => file.endsWith('.html') && (file.includes(`${path.sep}blog${path.sep}`) || file === path.join(OUTPUT, '404.html')))) {
    const html = fs.readFileSync(filename, 'utf8');
    const nodes = tags(html);
    const scripts = nodes.filter(node => node.tag === 'script' && node.attrs.src).map(node => node.attrs.src);
    assert.deepEqual(scripts, [`${prefix}/assets/js/scrollbar.js`, `${prefix}/assets/js/contact.js`, `${prefix}/assets/js/blog.js`], path.relative(OUTPUT, filename));
    for (const anchor of ['/#home', '/about/', '/#testimonials']) {
      assert.ok(nodes.some(node => node.tag === 'a' && node.attrs.href === prefix + anchor), `Missing root navigation ${anchor}`);
    }
    assert.ok(nodes.some(node => node.tag === 'a' && node.attrs.href === `${prefix}/blog/`));
    assert.ok(nodes.some(node => node.tag === 'a' && node.attrs.href === `${prefix}/services/`));
  }
}

test('Eleventy production → preview → production keeps routes, assets and publishing boundaries intact', { timeout: 120000 }, () => {
  const allArticles = loadArticles({ root: ROOT, preview: true });
  const published = loadArticles({ root: ROOT, preview: false });
  const privateArticles = allArticles.filter(article => article.status !== 'published' || article.demo);
  assert.ok(privateArticles.length >= 3, 'The checked-in layout demos must remain available in preview');

  function checkProduction() {
    const listing = readRoute('/blog/');
    if (!published.length) {
      assert.match(listing, /class="blog-empty"/);
      assert.doesNotMatch(listing, /class="blog-card"|class="blog-featured"/);
    }
    for (const category of CATEGORIES) readRoute(`/blog/category/${categorySlug(category)}/`);
    readRoute('/404.html');
    assert.match(readRoute('/services/'), /id="services-title"/);
    assert.match(readRoute('/about/'), /id="about-title"/);
    assert.ok(readRoute('/sitemap.xml').includes(`${ORIGIN}/about/`));
    assert.ok(readRoute('/sitemap.xml').includes(`${ORIGIN}/services/`));
    readRoute('/feed.xml');
    readRoute('/sitemap.xml');
    for (const article of privateArticles) {
      assert.ok(!fs.existsSync(routeFile(article.url)), `Unpublished route remains: ${article.url}`);
      assert.ok(!listing.includes(article.url));
      assert.ok(!readRoute('/feed.xml').includes(article.url));
      assert.ok(!readRoute('/sitemap.xml').includes(article.url));
    }
    assert.doesNotMatch(readRoute('/'), /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i);
    assert.ok(tags(readRoute('/')).some(node => node.tag === 'a' && node.attrs.href && new URL(node.attrs.href, ORIGIN + '/').pathname === '/blog/'));
    checkPublicAssetsOnly();
    checkJournalScriptsAndNavigation();
    checkBuiltLinks();
  }

  build();
  checkProduction();
  try {
    build(false, '/clinic');
    checkBuiltLinks('/clinic');
    checkJournalScriptsAndNavigation('/clinic');
    assert.ok(readRoute('/sitemap.xml').includes(`${ORIGIN}/clinic/blog/`));
    assert.ok(readRoute('/services/').includes(`${ORIGIN}/clinic/services/`));
    assert.ok(readRoute('/about/').includes(`${ORIGIN}/clinic/about/`));
    assert.match(readRoute('/blog/'), /https:\/\/example\.test\/clinic\/blog\//);
    checkPublicAssetsOnly();
    build(true);
    for (const article of privateArticles) {
      const html = readRoute(article.url);
      assert.match(html, /blog-demo-note/);
    }
    for (const filename of files().filter(file => file.endsWith('.html'))) {
      assert.ok(tags(fs.readFileSync(filename, 'utf8')).some(node => node.tag === 'meta' && node.attrs.name === 'robots' && node.attrs.content?.includes('noindex')), `Preview page is indexable: ${path.relative(OUTPUT, filename)}`);
    }
    checkPublicAssetsOnly();
    checkJournalScriptsAndNavigation();
    checkBuiltLinks();
  } finally {
    // Keep the local output safe for publication even if a preview assertion fails.
    build();
  }
  checkProduction();
});
