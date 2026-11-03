const { test } = require('node:test');
const assert = require('node:assert/strict');
const { metrics } = require('../assets/js/scrollbar.js');
test('thumb maps top, middle and bottom to the available viewport track', () => {
  assert.deepEqual(metrics(800, 3200, 0), { range: 2400, height: 200, top: 0 });
  assert.equal(metrics(800, 3200, 1200).top, 300);
  assert.equal(metrics(800, 3200, 2400).top, 600);
});
test('short pages need no thumb and long pages retain a usable minimum', () => {
  assert.deepEqual(metrics(800, 600, 0), { range: 0, height: 800, top: 0 });
  assert.equal(metrics(800, 100000, 0).height, 32);
});
test('overscroll cannot push the thumb outside the viewport', () => {
  assert.equal(metrics(800, 3200, -200).top, 0);
  assert.equal(metrics(800, 3200, 4000).top, 600);
});
