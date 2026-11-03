const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderAbout } = require('../lib/about.cjs');
const { renderServices } = require('../lib/services.cjs');
const { renderNextStep } = require('../lib/page-components.cjs');

test('About and Expertise share consultation output, hero structure and motion', () => {
 const about = renderAbout(), expertise = renderServices();
 for (const html of [about, expertise]) {
  assert.ok(html.includes(renderNextStep()));
  assert.match(html, /class="page-hero"/);
  assert.match(html, /assets\/css\/page-sections.css/);
  assert.match(html, /assets\/js\/page-motion.js/);
 }
 assert.match(about, /<h1 id="about-title">Dr. Anudeep<br>T Channaiah\.<\/h1>/);
 assert.match(expertise, /Care shaped<br><em>around you\.<\/em>/);
});

test('about renders qualifications, experience and research with working chapter links', () => {
 const html = renderAbout();
 for (const text of ['TNMC &amp; BYL Nair Hospital','National Board of Examinations','ISAPS','FIRM','Tata Memorial Hospital','Indian Journal of Plastic Surgery','A La Mode Classification']) assert.ok(html.includes(text), text);
 const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
 assert.equal(ids.length, new Set(ids).size);
 for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
 assert.match(html, /href="\/about\/" aria-current="page">About/);
 assert.doesNotMatch(html, /href="\/blog\/" aria-current="page"/);
 assert.match(html, /alt="Dr. Anudeep T Channaiah"/);
});
test('about canonical supports repository hosting and omits unsafe origins', () => {
 assert.match(renderAbout({siteUrl:'https://clinic.example',pathPrefix:'/practice'}), /rel="canonical" href="https:\/\/clinic.example\/practice\/about\/"/);
 for (const siteUrl of ['', 'http://clinic.example','https://clinic.example/path','https://user:password@clinic.example']) assert.doesNotMatch(renderAbout({siteUrl}), /rel="canonical"/);
});
