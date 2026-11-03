const fs = require('node:fs');
const path = require('node:path');
const { renderPageHero, renderNextStep } = require('./page-components.cjs');
const { normalizePathPrefix } = require('./site-paths.cjs');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderAbout({ root = path.resolve(__dirname, '..'), siteUrl = '', pathPrefix = '' } = {}) {
  const partial = name => fs.readFileSync(path.join(root, 'blog/_includes', name), 'utf8');
  const header = partial('header.html').replace('href="/blog/" aria-current="page"', 'href="/blog/"').replace('href="/about/">About', 'href="/about/" aria-current="page">About');
  const footer = partial('footer.html').replace('href="https://www.dranudeep.in/about"', 'href="/about/"');
  let canonical = '';
  try {
    const url = new URL(siteUrl);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/') canonical = `${url.origin}${normalizePathPrefix(pathPrefix)}/about/`;
  } catch { /* A canonical needs a configured public origin. */ }
  const training = [
    ['Mysuru', 'The foundation', 'MBBS · MS, General Surgery', 'Government Medical College, Mysore'],
    ['Mumbai', 'Surgical specialisation', 'MCh, Plastic Surgery', 'TNMC & BYL Nair Hospital'],
    ['New Delhi', 'Further qualification', 'DrNB, Plastic Surgery · IAAPS fellowship', 'National Board of Examinations · Aesthetic surgery'],
    ['Colombia', 'An international perspective', 'Aesthetic surgery fellowships', 'ISAPS · Dr. Arias'],
    ['Brazil', 'Aesthetic training', 'Aesthetic surgery fellowship', 'Brazil']
  ];
  const experience = [
    { title: 'Clinical practice', items: [
      ['Founder', 'Mysore Aesthetics', 'À La Mode Esthétique Studio · Mysuru'],
      ['Visiting consultant', 'Manipal Hospitals', 'KVC · Nayana Kumar Hospital · Mysuru']
    ] },
    { title: 'Teaching & surgery', items: [
      ['Assistant professor · Senior resident', 'TNMC & BYL Nair Hospital', 'Plastic & reconstructive surgery · Mumbai'],
      ['Vascular surgery experience', 'Mysore Medical College', 'Mysuru']
    ] },
    { title: 'Specialist training', items: [
      ['Oncoplastic surgery · Visiting trainee', 'Tata Memorial Hospital', 'Mumbai'],
      ['Visiting trainee', 'Designer Bodyz', 'Genesis Hair Transplant Centre · Mumbai']
    ] }
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>About | Dr. Anudeep T Channaiah</title><meta name="description" content="Meet Dr. Anudeep T Channaiah. Explore his surgical training, qualifications, clinical experience and research interests.">
<meta property="og:type" content="website"><meta property="og:title" content="About | Dr. Anudeep T Channaiah"><meta property="og:description" content="The surgeon, his training and his approach to care.">
${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}
<link rel="icon" href="/assets/images/favicon.ico" sizes="16x16 32x32 48x48"><link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/ivymode.woff2" as="font" type="font/woff2" crossorigin>
${['base','tokens','main','sections','blog','about','page-sections'].map(name => `<link rel="stylesheet" href="/assets/css/${name}.css">`).join('')}
${['/assets/vendor/gsap.min.js','/assets/vendor/ScrollTrigger.min.js','/assets/js/page-motion.js','/assets/js/about.js','/assets/js/scrollbar.js','/assets/js/contact.js','/assets/js/blog.js'].map(src => `<script src="${src}" defer></script>`).join('')}
</head><body class="blog-page about-page"><a class="blog-skip-link" href="#main-content">Skip to content</a>${header}
<main id="main-content">
${renderPageHero({
 page: 'About', id: 'about-title', eyebrow: 'The surgeon', lines: ['Dr. Anudeep', 'T Channaiah.'],
 intro: 'A plastic and reconstructive surgeon whose training spans Mysore, Mumbai, New Delhi, Colombia and Brazil.',
 link: { href: '#background', label: 'Get to know your surgeon' },
 portrait: { src: '/assets/images/dr-anudeep.webp', alt: 'Dr. Anudeep T Channaiah', width: 864, height: 1024, contain: true },
 caption: ['Plastic, Reconstructive', '& Cosmetic Surgery'], footer: 'Training / Practice / Research'
})}<div class="about-container">
<nav class="about-chapters" aria-label="On this page"><a href="#background">01 <span>Background</span></a><a href="#experience">02 <span>Experience</span></a><a href="#research">03 <span>Research</span></a></nav></div>
<div class="about-container">
<section class="about-section about-section--journey" id="background" aria-labelledby="background-title"><header class="about-section__heading"><p class="refined-eyebrow">01 / Background</p><h2 id="background-title">Grounded in Mysuru.<br>Shaped by a wider world.</h2><p>Medical and surgical training in India, with further aesthetic surgery fellowships abroad.</p></header><ol class="about-journey" aria-label="Training locations and qualifications">${training.map(([place, label, degree, institution], index) => `<li class="about-journey__stop"><span class="about-journey__marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><p class="about-journey__label">${escape(label)}</p><h3>${escape(place)}</h3><p class="about-journey__degree">${escape(degree)}</p><p class="about-journey__institution">${escape(institution)}</p></li>`).join('')}</ol><p class="about-journey__note"><span>Further fellowship</span> FIRM · Stem cells and regenerative medicine</p></section>
</div>
<section class="about-experience-band" id="experience" aria-labelledby="experience-title"><div class="about-container about-section about-section--experience"><header class="about-section__heading"><p class="refined-eyebrow">02 / Experience</p><h2 id="experience-title">In the clinic.<br>Beyond the clinic.</h2></header><div class="about-experience-layout"><figure class="about-experience-portrait"><div><img src="/assets/images/dr-anudeep.webp" alt="Portrait of Dr. Anudeep T Channaiah" width="864" height="1024" loading="lazy" decoding="async"></div><figcaption><span>Dr. Anudeep T Channaiah</span>Mysuru · Mumbai</figcaption></figure><div class="about-experience">${experience.map(({title, items}, index) => `<article><header class="about-experience__heading"><span class="about-experience__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h3>${escape(title)}</h3></header><ul>${items.map(([role, institution, detail]) => `<li><p class="about-experience__role">${escape(role)}</p><p class="about-experience__institution">${escape(institution)}</p><p class="about-experience__detail">${escape(detail)}</p></li>`).join('')}</ul></article>`).join('')}</div></div></div></section>
<section class="about-research" id="research" aria-labelledby="research-title"><div class="about-container"><header class="about-research__heading"><p class="refined-eyebrow">03 / Research &amp; interests</p><h2 id="research-title">Regenerative medicine.<br>A continuing enquiry.</h2><p class="about-research__lead">Research into fat grafting, hair restoration and adipose-derived stem cells.</p></header><div class="about-research__notes"><article><p class="refined-eyebrow">01 / Contribution</p><h3>A La Mode Classification</h3><p>A classification of regenerative therapies developed by Dr. Anudeep.</p></article><article><p class="refined-eyebrow">02 / Peer review</p><h3>Indian Journal of Plastic Surgery</h3><p>Contributing to the field as a journal reviewer.</p></article></div><a class="about-text-link" href="/services/">Explore clinical expertise <span aria-hidden="true">↗</span></a></div></section>
<div class="about-container about-next-wrap">${renderNextStep()}</div>
</main>${footer}</body></html>`;
}
module.exports = { renderAbout };
