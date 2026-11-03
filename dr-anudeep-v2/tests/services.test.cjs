const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { renderServices } = require('../lib/services.cjs');
const root = path.resolve(__dirname, '..');

test('services covers every published category, including specialist care missing from the landing overview', () => {
 const html = renderServices();
 assert.equal((html.match(/class="services-entry(?: services-entry--visual)?"/g) || []).length, 11);
 assert.equal((html.match(/<li>/g) || []).length, 46);
 assert.equal((html.match(/class="services-entry__image"/g) || []).length, 11);
 for (const service of ['Laser tattoo removal', 'Sclerotherapy', 'Hand fractures', 'Upper and lower limb cancer reconstruction', 'AV fistula for dialysis', 'Stem cell treatment']) assert.ok(html.includes(service), service);
 const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
 assert.equal(ids.length, new Set(ids).size);
 for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing category target ${id}`);
});
test('services navigation, page-specific CSS and rendering leave the landing page untouched', () => {
 const digest = () => createHash('sha256').update(readFileSync(path.join(root,'index.html'))).digest('hex');
 const before = digest(), html = renderServices();
 assert.equal(digest(), before);
 assert.match(html, /href="\/services\/" aria-current="page">Expertise/);
 assert.doesNotMatch(html, /href="\/blog\/" aria-current="page"/);
 assert.match(html, /href="\/assets\/css\/services.css"/);
 assert.doesNotMatch(html, /services-note|View the practice’s published service list/);
 assert.doesNotMatch(html, /lenis.min.js|assets\/js\/main.js/);
 assert.match(html, /assets\/js\/page-motion.js/);
 assert.match(html, /https:\/\/clinicia.com\/calendar\/book\?u=48267/);
});
test('services canonical respects repository paths and rejects unconfigured or unsafe origins', () => {
 assert.match(renderServices({siteUrl:'https://clinic.example',pathPrefix:'/practice'}), /rel="canonical" href="https:\/\/clinic.example\/practice\/services\/"/);
 for (const siteUrl of ['', 'http://clinic.example','https://clinic.example/path','https://user:password@clinic.example']) assert.doesNotMatch(renderServices({siteUrl}), /rel="canonical"/);
});
