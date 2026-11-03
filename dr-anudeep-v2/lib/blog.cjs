const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const { normalizePathPrefix } = require('./site-paths.cjs');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_AUTHOR = 'Dr. Anudeep T Channaiah';
const CATEGORIES = Object.freeze(['Consultation', 'Facial Aesthetics', 'Body Contouring', 'Reconstruction', 'Recovery']);
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const categorySlug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const origin = value => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return '';
    return url.origin;
  } catch { return ''; }
};
const dateLabel = date => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

function loadArticles({ root = ROOT, preview = false } = {}) {
  const directory = path.join(root, 'content/blog');
  if (!fs.existsSync(directory)) return [];
  const slugs = new Set();
  const articles = [];
  for (const filename of fs.readdirSync(directory).filter(name => name.endsWith('.md')).sort()) {
    const { data: stored, content } = matter(fs.readFileSync(path.join(directory, filename), 'utf8'));
    const error = message => { throw new Error(`Article ${filename}: ${message}`); };
    if (stored.advanced != null && (typeof stored.advanced !== 'object' || Array.isArray(stored.advanced))) error('optional settings must be an object');
    const advanced = stored.advanced || {};
    const author = advanced.author ?? stored.author;
    const data = { ...stored, slug: stored.slug == null || (typeof stored.slug === 'string' && !stored.slug.trim()) ? path.basename(filename, '.md') : stored.slug,
      author: author == null || (typeof author === 'string' && !author.trim()) ? DEFAULT_AUTHOR : author,
      featured: advanced.featured ?? stored.featured ?? false,
      seoDescription: advanced.seoDescription ?? stored.seoDescription ?? '' };
    if (typeof data.seoDescription !== 'string') error('search introduction must be text');
    const status = data.status ?? 'draft';
    if (!['draft', 'published'].includes(status)) error('status must be draft or published');
    for (const flag of ['demo', 'featured']) {
      if (data[flag] !== undefined && typeof data[flag] !== 'boolean') error(`${flag} must be true or false`);
    }
    const demo = data.demo === true;
    if (data.slug) {
      if (slugs.has(data.slug)) error(`duplicate slug "${data.slug}"`);
      slugs.add(data.slug);
    }
    if (!preview && (status !== 'published' || demo)) continue;
    for (const field of ['title', 'slug', 'summary', 'cover', 'coverAlt', 'category', 'author']) {
      if (typeof data[field] !== 'string' || !data[field].trim()) error(`${field} is required`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || ['category', 'page'].includes(data.slug)) error('slug must be a lowercase, hyphen-separated URL name (not category or page)');
    if (data.slug !== path.basename(filename, '.md')) error('slug cannot change after creation; it must match the filename. Ask the site maintainer to migrate a published URL.');
    if (!CATEGORIES.includes(data.category)) error(`category must be one of: ${CATEGORIES.join(', ')}`);
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) error('date must be a valid YYYY-MM-DD date');
    if (!content.trim()) error('body is required');
    if (!/^\/assets\/images\/[^?#]+$/.test(data.cover) || !/\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(data.cover)) error('cover must be a local image path such as /assets/images/blog/cover.jpg');
    const coverFile = path.resolve(root, `.${data.cover}`);
    if (!coverFile.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(coverFile) || !fs.statSync(coverFile).isFile()) error(`cover image does not exist: ${data.cover}`);
    const words = content.replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
    articles.push({ ...data, status, demo, featured: data.featured === true, date, body: content,
      html: markdown.render(content), url: `/blog/${data.slug}/`, readingTime: Math.max(1, Math.ceil(words / 200)) });
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function createSitePages({ root = ROOT, preview = false, siteUrl = '', pathPrefix = '' } = {}) {
  const base = origin(siteUrl);
  const prefix = normalizePathPrefix(pathPrefix);
  const articles = loadArticles({ root, preview });
  const partial = name => fs.readFileSync(path.join(root, 'blog/_includes', `${name}.html`), 'utf8');
  const header = partial('header'), footer = partial('footer');
  const pages = [];
  const previewBanner = preview ? '<aside class="blog-preview-banner" aria-label="Preview notice">Preview build — includes unpublished sample content. Not for publication.</aside>' : '';
  const absolute = url => base ? `${base}${prefix}${url}` : '';
  function document({ title, description, url, content, image = '', article = null, noindex = false }) {
    const canonical = absolute(url);
    let metadata = `<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta name="twitter:card" content="summary_large_image">`;
    if (canonical && !noindex) metadata += `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">`;
    if (image && base) metadata += `<meta property="og:image" content="${escape(absolute(image))}">`;
    if (preview || noindex) metadata += '<meta name="robots" content="noindex, nofollow">';
    if (article && base && !preview) {
      const structured = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title,
        description, datePublished: article.date, author: { '@type': 'Person', name: article.author },
        image: absolute(article.cover), mainEntityOfPage: canonical };
      metadata += `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>`;
    }
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" href="/assets/images/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} | Dr. Anudeep</title><meta name="description" content="${escape(description)}">${metadata}<link rel="preload" href="/assets/fonts/ivymode.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/css/base.css"><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/sections.css"><link rel="stylesheet" href="/assets/css/blog.css"><link rel="alternate" type="application/rss+xml" title="Dr. Anudeep — Articles" href="/feed.xml"><script src="/assets/js/scrollbar.js" defer></script><script src="/assets/js/contact.js" defer></script><script src="/assets/js/blog.js" defer></script></head><body class="blog-page"><a class="blog-skip-link" href="#main-content">Skip to content</a>${header}${previewBanner}<main id="main-content" class="blog-main">${content}</main>${footer}</body></html>`;
  }
  const meta = article => `<p class="blog-meta"><span>${escape(article.author)}</span><span aria-hidden="true">·</span><time datetime="${article.date}">${dateLabel(article.date)}</time><span aria-hidden="true">·</span><span>${article.readingTime} min read</span></p>`;
  const badge = article => article.demo ? '<span class="blog-demo-note">Sample article — not doctor-reviewed</span>' : article.status === 'draft' ? '<span class="blog-demo-note">Unpublished draft</span>' : '';
  const card = article => `<article class="blog-card"><a href="${article.url}"><img src="${escape(article.cover)}" alt="${escape(article.coverAlt)}" loading="lazy" width="800" height="600"><div class="blog-card__body"><p class="blog-category">${escape(article.category)}</p>${badge(article)}<h2>${escape(article.title)}</h2><p class="blog-summary">${escape(article.summary)}</p>${meta(article)}<span class="blog-read-link">Read article <span aria-hidden="true">↗</span></span></div></a></article>`;
  const booking = '<section class="blog-booking"><div><p class="refined-eyebrow">Your next step</p><h2>Let’s talk about your care.</h2><p>A personal consultation starts with your questions.</p></div><a class="button-link roll-button" href="https://clinicia.com/calendar/book?u=48267" target="_blank" rel="noopener noreferrer"><span class="roll-text"><span class="roll-text__primary">Book a consultation</span><span class="roll-text__copy" aria-hidden="true">Book a consultation</span></span><span class="button-arrow" aria-hidden="true">↗</span></a></section>';
  const listUrl = (category, page = 1) => `${category ? `/blog/category/${categorySlug(category)}/` : '/blog/'}${page > 1 ? `page/${page}/` : ''}`;
  function listing(category = null) {
    const items = category ? articles.filter(item => item.category === category) : articles;
    const featured = items.find(item => item.featured) || items[0];
    const remaining = items.filter(item => item !== featured);
    const count = Math.max(1, Math.ceil(remaining.length / 12));
    for (let page = 1; page <= count; page++) {
      const url = listUrl(category, page);
      const tabs = [null, ...CATEGORIES].map(item => `<a href="${listUrl(item)}"${item === category ? ' aria-current="page"' : ''}>${escape(item || 'All articles')}</a>`).join('');
      const feature = page === 1 && featured ? `<article class="blog-featured"><a href="${featured.url}"><img class="blog-featured__image" src="${escape(featured.cover)}" alt="${escape(featured.coverAlt)}" fetchpriority="high" width="1200" height="900"><div class="blog-featured__copy"><p class="blog-category">${escape(featured.category)} · Featured</p>${badge(featured)}<h2>${escape(featured.title)}</h2><p class="blog-summary">${escape(featured.summary)}</p>${meta(featured)}<span class="blog-read-link">Read article <span aria-hidden="true">↗</span></span></div></a></article>` : '';
      const cards = remaining.slice((page - 1) * 12, page * 12).map(card).join('');
      const empty = !items.length ? '<div class="blog-empty"><h2>Good questions deserve thoughtful answers.</h2><p>Articles are on their way. In the meantime, bring your questions to a personal consultation.</p></div>' : '';
      const pagination = count > 1 ? `<nav class="blog-pagination" aria-label="Article pages">${page > 1 ? `<a href="${listUrl(category, page - 1)}" rel="prev">← Previous</a>` : '<span></span>'}<span>Page ${page} of ${count}</span>${page < count ? `<a href="${listUrl(category, page + 1)}" rel="next">Next →</a>` : '<span></span>'}</nav>` : '';
      const title = category ? `${category} articles` : 'Insights & patient education';
      const content = `<div class="refined-container"><header class="blog-intro"><p class="refined-eyebrow">The journal</p><h1>${escape(title)}</h1><p>Thoughtful perspectives on cosmetic and reconstructive care, and the questions that matter to you.</p></header>${feature}<nav class="blog-categories" aria-label="Article categories">${tabs}</nav>${cards ? `<div class="blog-grid">${cards}</div>` : ''}${empty}${pagination}${booking}</div>`;
      pages.push({ url, html: document({ title: `${title}${page > 1 ? ` — Page ${page}` : ''}`, description: `Explore ${category ? category.toLowerCase() : 'cosmetic and reconstructive care'} articles from Dr. Anudeep.`, url, content }) });
    }
  }
  listing();
  CATEGORIES.forEach(listing);
  for (const article of articles) {
    const related = articles.filter(item => item.slug !== article.slug).sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
    const content = `<article><header class="article-header refined-container"><nav class="blog-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Journal</a><span aria-hidden="true">/</span><a href="${listUrl(article.category)}">${escape(article.category)}</a></nav>${badge(article)}<h1>${escape(article.title)}</h1><p class="blog-summary">${escape(article.summary)}</p>${meta(article)}</header><figure class="article-cover refined-container"><img src="${escape(article.cover)}" alt="${escape(article.coverAlt)}" fetchpriority="high" width="1440" height="900"></figure><div class="article-content">${article.html}</div><footer class="article-footer refined-container">${article.demo ? '<p class="blog-demo-note">This is sample content for layout review, not medical advice or a doctor-approved article.</p>' : '<p class="article-disclaimer">For general information. A personal consultation is needed for advice about your care.</p>'}<a class="blog-back-link" href="/blog/">← All articles</a>${related.length ? `<section class="blog-related" aria-labelledby="related-title"><h2 id="related-title">Keep exploring</h2><div class="blog-grid">${related.map(card).join('')}</div></section>` : ''}${booking}</footer></article>`;
    pages.push({ url: article.url, html: document({ title: article.title, description: article.seoDescription || article.summary, image: article.cover, url: article.url, article, content }) });
  }
  pages.push({ url: '/404.html', html: document({ title: 'Page not found', description: 'Find your way back to Dr. Anudeep’s website.', url: '/404.html', noindex: true, content: '<section class="not-found refined-container"><p class="refined-eyebrow">404</p><h1>A different path.</h1><p>This page could not be found.</p><a class="button-link" href="/blog/">Explore the journal</a><a class="blog-back-link" href="/">Back to home</a></section>' }) });
  const feedItems = preview ? [] : articles;
  const xml = escape;
  pages.push({ url: '/feed.xml', html: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Dr. Anudeep — Articles</title><link>${xml(absolute('/blog/'))}</link><description>Cosmetic and reconstructive care articles.</description>${feedItems.map(article => `<item><title>${xml(article.title)}</title><link>${xml(absolute(article.url))}</link><guid isPermaLink="${base ? 'true' : 'false'}">${xml(absolute(article.url) || article.url)}</guid><pubDate>${new Date(`${article.date}T12:00:00Z`).toUTCString()}</pubDate><description>${xml(article.summary)}</description></item>`).join('')}</channel></rss>` });
  // No origin means no fabricated absolute URLs. Configure SITE_URL before publishing.
  const sitemapUrls = !preview && base ? ['/', '/about/', '/services/', ...pages.filter(page => page.url.endsWith('/') && !page.url.includes('/page/')).map(page => page.url)] : [];
  pages.push({ url: '/sitemap.xml', html: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map(url => `<url><loc>${xml(absolute(url))}</loc></url>`).join('')}</urlset>` });
  return pages;
}

module.exports = { createSitePages, loadArticles, CATEGORIES, categorySlug, DEFAULT_AUTHOR };
