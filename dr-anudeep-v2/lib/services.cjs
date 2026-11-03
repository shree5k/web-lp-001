const fs = require('node:fs');
const path = require('node:path');
const { normalizePathPrefix } = require('./site-paths.cjs');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const { renderPageHero, renderNextStep } = require('./page-components.cjs');
function renderServices({ root = path.resolve(__dirname, '..'), siteUrl = '', pathPrefix = '' } = {}) {
  const { categories } = JSON.parse(fs.readFileSync(path.join(root, 'content/services.json'), 'utf8'));
  const partial = name => fs.readFileSync(path.join(root, 'blog/_includes', name), 'utf8');
  // Customize this page's navigation without changing the shared or landing header.
  const header = partial('header.html')
    .replace('href="/blog/" aria-current="page"', 'href="/blog/"')
    .replace('href="/services/">Expertise', 'href="/services/" aria-current="page">Expertise');
  let canonical = '';
  try {
    const url = new URL(siteUrl);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/') {
      canonical = `${url.origin}${normalizePathPrefix(pathPrefix)}/services/`;
    }
  } catch { /* Omit canonical until the site's real origin is configured. */ }
  const number = index => String(index + 1).padStart(2, '0');
  const index = categories.map((category, i) => `<a href="#${escape(category.id)}"><span aria-hidden="true">${number(i)}</span><span class="services-index__label">${escape(category.title)}</span><span class="services-index__arrow" aria-hidden="true">↗</span></a>`).join('');
  const images = {
    'facial-aesthetics': ['facial-aesthetics.webp', '70% center', 700, 467],
    'body-contouring': ['body-contouring.webp', '45% center', 700, 1050],
    'hair-restoration': ['hair-restoration.webp', '40% center', 700, 1050],
    'cosmetic-gynecology': ['cosmetic-gynecology.webp', 'center', 700, 1050],
    'varicose-veins': ['varicose-vein-care.webp', '50% center', 700, 933],
    'wound-care': ['wound-care.webp', '55% center', 700, 467],
    'dialysis-access': ['dialysis-access.webp', '60% center', 700, 1050],
    'breast-surgery': ['breast-surgery.webp', '55% center', 700, 1050],
    'hand-surgery': ['hand-microsurgery.webp', '30% center', 700, 467],
    'trauma': ['trauma-reconstruction.webp', 'center', 700, 1050],
    'cancer-reconstruction': ['specialized-care.webp', 'center', 700, 1050]
  };
  const sections = categories.map((category, i) => {
    const image = images[category.id];
    if (!image) throw new Error(`Missing service image for ${category.id}`);
    const visual = `<figure class="services-entry__image"><img src="/assets/images/expertise/${escape(image[0])}" alt="" loading="lazy" decoding="async" width="${image[2]}" height="${image[3]}" style="object-position:${escape(image[1])}"></figure>`;
    return `<section class="services-entry services-entry--visual" id="${escape(category.id)}" aria-labelledby="${escape(category.id)}-title">${visual}<div class="services-entry__content"><header class="services-entry__heading"><span class="services-number" aria-hidden="true">${number(i)}</span><div><h2 id="${escape(category.id)}-title">${escape(category.title)}</h2><p>${escape(category.summary)}</p></div></header><ul class="services-procedures">${category.procedures.map(procedure => `<li>${escape(procedure)}</li>`).join('')}</ul></div></section>`;
  }).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Services | Dr. Anudeep T Channaiah</title><meta name="description" content="Explore cosmetic, reconstructive and specialist surgical services at Mysore Aesthetics, Mysuru, with Dr. Anudeep T Channaiah.">
${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}
<meta property="og:type" content="website"><meta property="og:title" content="Services | Dr. Anudeep T Channaiah"><meta property="og:description" content="Explore the areas of care at Mysore Aesthetics, Mysuru.">
<link rel="icon" href="/assets/images/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" type="image/png" href="/assets/images/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" sizes="180x180">
<link rel="preload" href="/assets/fonts/ivymode.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/base.css"><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/sections.css"><link rel="stylesheet" href="/assets/css/blog.css"><link rel="stylesheet" href="/assets/css/page-sections.css"><link rel="stylesheet" href="/assets/css/services.css">
<script src="/assets/vendor/gsap.min.js" defer></script><script src="/assets/vendor/ScrollTrigger.min.js" defer></script><script src="/assets/js/page-motion.js" defer></script><script src="/assets/js/scrollbar.js" defer></script><script src="/assets/js/contact.js" defer></script><script src="/assets/js/blog.js" defer></script>
</head><body class="blog-page services-page"><a class="blog-skip-link" href="#main-content">Skip to content</a>${header}
<main id="main-content" class="services-main">${renderPageHero({
 page: 'Services', id: 'services-title', eyebrow: 'Expertise & services', lines: ['Care shaped', 'around you.'], accentLast: true,
 intro: 'Cosmetic, reconstructive and specialist surgical care in Mysuru. Explore the areas below and bring your questions to a personal consultation.',
 link: { href: '#service-index', label: 'Explore our services' },
 portrait: { src: '/assets/images/expertise/facial-aesthetics.webp', width: 700, height: 467 },
 detail: { src: '/assets/images/expertise/hand-microsurgery.webp', width: 700, height: 467 },
 caption: ['Precision in practice.', 'Care in every detail.'], footer: 'Aesthetic / Reconstructive / Specialist care'
})}
<div class="page-container"><div class="services-catalog"><aside class="services-sidebar" id="service-index"><p class="refined-eyebrow">${categories.length} areas of care</p><nav class="services-index" aria-label="Service categories">${index}</nav></aside><div class="services-entries">${sections}</div></div>
${renderNextStep()}
</div></main>${partial('footer.html')}</body></html>`;
}
module.exports = { renderServices };
