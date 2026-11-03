const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fitPreview, initializePreviews } = require('../brand-guide/guide.js');

test('website previews preserve desktop and mobile viewport ratios at reduced display sizes', () => {
  assert.deepEqual(fitPreview(720, 1440, 1000), { scale: .5, height: 500 });
  assert.deepEqual(fitPreview(195, 390, 844), { scale: .5, height: 422 });
  assert.deepEqual(fitPreview(1600, 1440, 1000), { scale: 1, height: 1000 });
  for (const width of [0, -1, NaN, Infinity]) assert.equal(fitPreview(width, 1440, 1000), null);
});

test('resizing changes presentation scale without changing the embedded responsive viewport', () => {
  const frame = { style: {} };
  const target = { clientWidth: 720, dataset: { previewWidth: '1440', previewHeight: '1000' }, style: {}, querySelector: () => frame };
  let callback, disconnected = false;
  const cleanup = initializePreviews({ querySelectorAll: () => [target] }, {
    ResizeObserver: class {
      constructor(cb) { callback = cb; }
      observe(element) { assert.equal(element, target); }
      disconnect() { disconnected = true; }
    }
  });
  assert.equal(frame.style.width, '1440px');
  assert.equal(frame.style.height, '1000px');
  assert.equal(frame.style.transform, 'scale(0.5)');
  target.clientWidth = 360;
  callback([{ target }]);
  assert.equal(frame.style.width, '1440px');
  assert.equal(frame.style.transform, 'scale(0.25)');
  assert.equal(target.style.height, '250px');
  cleanup();
  assert.ok(disconnected);
});

test('experience embeds the actual local landing page rather than recreating its markup', () => {
  const html = fs.readFileSync(path.join(__dirname, '../brand-guide/index.html'), 'utf8');
  const frames = [...html.matchAll(/<iframe\b[^>]*>/g)].map(match => match[0]);
  assert.equal(frames.length, 2);
  assert.ok(frames.every(frame => frame.includes('src="../index.html"') && frame.includes('loading="lazy"') && frame.includes('title=')));
  assert.ok(html.includes('data-preview-width="1440"'));
  assert.ok(html.includes('data-preview-width="390"'));
  assert.ok(!html.includes('preview-hero-copy'));
  assert.ok(html.includes('on <span>you.</span>'));
});
