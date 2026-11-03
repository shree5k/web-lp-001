const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderPageHero({ page, id, eyebrow, lines, accentLast = false, intro, link, portrait, detail, caption, footer }) {
 const image = (photo, priority = false) => `<img src="${escape(photo.src)}" alt="${escape(photo.alt || '')}" width="${photo.width}" height="${photo.height}" ${priority ? 'fetchpriority="high"' : 'loading="eager"'}>`;
 return `<div class="page-opening"><div class="page-container">
<nav class="page-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${escape(page)}</span></nav>
<section class="page-hero" aria-labelledby="${escape(id)}"><div class="page-hero__copy"><p class="refined-eyebrow">${escape(eyebrow)}</p><h1 id="${escape(id)}">${lines.map((line, index) => accentLast && index === lines.length - 1 ? `<em>${escape(line)}</em>` : escape(line)).join('<br>')}</h1><p class="page-intro">${escape(intro)}</p><a class="page-text-link" href="${escape(link.href)}">${escape(link.label)} <span aria-hidden="true">↓</span></a></div><figure class="page-hero__image"><div class="page-hero__portrait${portrait.contain ? ' page-hero__portrait--contain' : ''}">${image(portrait, true)}</div>${detail ? `<div class="page-hero__detail">${image(detail)}</div>` : ''}<figcaption>${caption.map(escape).join('<br>')}</figcaption></figure></section>
<div class="page-opening__footer"><span>Mysore Aesthetics · Mysuru</span><span>${escape(footer)}</span></div></div></div>`;
}

function renderNextStep() {
 return `<section class="page-consultation" aria-labelledby="consultation-title"><div><p class="refined-eyebrow">Your next step</p><h2 id="consultation-title">Start with a conversation.</h2><p>You don’t need to know which procedure to choose. Start with what’s concerning you and what you would like to understand.</p></div><a class="button-link roll-button" href="https://clinicia.com/calendar/book?u=48267" target="_blank" rel="noopener noreferrer"><span class="roll-text"><span class="roll-text__primary">Book a consultation</span><span class="roll-text__copy" aria-hidden="true">Book a consultation</span></span><span class="button-arrow" aria-hidden="true">↗</span></a></section>`;
}
module.exports = { renderPageHero, renderNextStep };
