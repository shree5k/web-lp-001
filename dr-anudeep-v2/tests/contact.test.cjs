const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initializeContactMenu, copyPhoneNumber } = require('../assets/js/contact.js');

function setup(scrollY = 0, heroHeight = null) {
  let added = 0;
  const doc = { activeElement: null, handlers: {}, addEventListener(name, fn) { (this.handlers[name] ??= []).push(fn); },
    emit(name, event = {}) { for (const handler of this.handlers[name] || []) handler(event); } };
  const clipboardWrites = [], timers = new Map(); let nextTimer = 0;
  const view = { scrollY, handlers: new Set(),
    navigator: { clipboard: { async writeText(value) { clipboardWrites.push(value); } } },
    setTimeout(fn) { const id = ++nextTimer; timers.set(id,fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, fn) { if (name === 'scroll') this.handlers.add(fn); },
    removeEventListener(name, fn) { if (name === 'scroll') this.handlers.delete(fn); },
    scrollTo(y) { this.scrollY = y; for (const fn of this.handlers) fn(); }
  };
  doc.defaultView = view;
  function element(parent = null) {
    return { parent, hidden: true, attrs: {}, handlers: {}, classes: new Set(),
      classList: { toggle(name, value) { value ? root.classes.add(name) : root.classes.delete(name); } },
      setAttribute(name, value) { this.attrs[name] = value; },
      getAttribute(name) { return this.attrs[name]; },
      addEventListener(name, fn) { (this.handlers[name] ??= []).push(fn); },
      emit(name, event = {}) { return Promise.all((this.handlers[name] || []).map(handler => handler(event))); },
      contains(node) { return Boolean(node && (node === this || this.contains(node.parent))); },
      focus() { doc.activeElement = this; },
      closest(selector) { return (selector === 'a' && this.isLink) || (selector === '[data-copy-phone]' && this.isCopy) ? this : null; }
    };
  }
  const root = element(), toggle = element(root), options = element(root);
  const links = Array.from({ length: 3 }, () => ({ ...element(options), isLink: true }));
  const copyLabel = { textContent: 'Call' };
  links[0].isLink = false; links[0].isCopy = true;
  links[0].attrs['data-copy-phone'] = '+918070607068';
  links[0].querySelector = () => copyLabel;
  root.querySelector = selector => selector === '.contact-float__toggle' ? toggle : options;
  options.querySelector = selector => selector === 'a:last-child' ? links[2] : links[0];
  doc.createElement = () => root;
  doc.querySelector = selector => selector === '.hero-wrap' ? (heroHeight === null ? null : { getBoundingClientRect: () => ({ bottom: heroHeight - view.scrollY }) }) : added ? root : null;
  doc.body = { appendChild() { added++; } };
  initializeContactMenu(doc);
  return { doc, view, root, toggle, options, links, copyLabel, clipboardWrites, timers, added: () => added };
}

test('contact menu uses the official destinations and initialises once', () => {
  const s = setup();
  for (const value of ['+91 80706 07068', 'data-copy-phone="+918070607068"', 'https://wa.me/918070607068', 'https://www.instagram.com/icosmeticsurgeon/']) assert.ok(s.root.innerHTML.includes(value));
  assert.match(s.root.innerHTML, /aria-expanded="false"/);
  assert.match(s.root.innerHTML, /id="contact-options" hidden/);
  assert.equal((s.root.innerHTML.match(/rel="noopener noreferrer"/g) || []).length, 2);
  initializeContactMenu(s.doc);
  assert.equal(s.added(), 1);
});

test('mouse hover opens and leave closes even when the launcher retained focus', () => {
  const s = setup();s.toggle.focus();
  s.root.emit('pointerenter', { pointerType: 'mouse' });
  assert.equal(s.options.hidden, false);
  assert.equal(s.toggle.attrs['aria-expanded'], 'true');
  s.root.emit('pointerleave');assert.equal(s.options.hidden, true);
  s.root.emit('pointerenter', { pointerType: 'touch' });assert.equal(s.options.hidden, true);
});

test('tap toggles the menu, stays open on pointer leave and dismisses outside', () => {
  const s = setup();s.toggle.emit('click');assert.equal(s.options.hidden, false);
  s.root.emit('pointerleave');assert.equal(s.options.hidden, false);
  s.doc.emit('pointerdown', { target: s.toggle });assert.equal(s.options.hidden, false);
  s.doc.emit('pointerdown', { target: {} });assert.equal(s.options.hidden, true);
  s.toggle.emit('click');s.toggle.emit('click');assert.equal(s.options.hidden, true);
});

test('keyboard arrows open options, Escape restores focus and Tab can leave', () => {
  const s = setup();let prevented = 0;s.toggle.focus();
  s.doc.emit('keydown', { target: s.toggle, key: 'ArrowDown', preventDefault() { prevented++; } });
  assert.equal(s.doc.activeElement, s.links[0]);assert.equal(s.options.hidden, false);
  s.root.emit('pointerleave');assert.equal(s.options.hidden, false);
  s.doc.emit('keydown', { target: s.links[0], key: 'Escape', preventDefault() { prevented++; } });
  assert.equal(s.options.hidden, true);assert.equal(s.doc.activeElement, s.toggle);
  s.doc.emit('keydown', { target: s.toggle, key: 'ArrowUp', preventDefault() { prevented++; } });
  assert.equal(s.doc.activeElement, s.links[2]);
  s.root.emit('focusout', { relatedTarget: s.links[1] });assert.equal(s.options.hidden, false);
  s.root.emit('focusout', { relatedTarget: {} });assert.equal(s.options.hidden, true);
  assert.equal(prevented, 3);
});

test('hover dismissal does not intercept another component’s Escape key', () => {
  const s = setup();let prevented = false;
  s.root.emit('pointerenter', { pointerType: 'mouse' });
  s.doc.emit('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, false);assert.equal(s.options.hidden, true);
});

test('choosing a channel closes the menu and returns focus to its launcher', () => {
  const s = setup();s.toggle.emit('click');
  s.options.emit('click', { target: s.links[1] });
  assert.equal(s.options.hidden, true);assert.equal(s.doc.activeElement, s.toggle);
});

test('contact without a hero expands on scroll and collapses at the top', () => {
  const s = setup();
  assert.equal(s.root.classes.has('is-expanded'), false);
  s.view.scrollTo(1);
  assert.equal(s.root.classes.has('is-expanded'), true);
  s.view.scrollTo(0);
  assert.equal(s.root.classes.has('is-expanded'), false);
  s.toggle.emit('click');
  assert.equal(s.options.hidden, false);
});

test('contact expands immediately for a restored scroll position', () => {
  const s = setup(500);
  assert.equal(s.root.classes.has('is-expanded'), true);
});

test('contact expands on the first pixel of scroll within the hero and collapses at the top', () => {
  const s = setup(0, 900);
  assert.equal(s.root.classes.has('is-expanded'), false);
  s.view.scrollTo(1);
  assert.equal(s.root.classes.has('is-expanded'), true);
  s.view.scrollTo(821);
  assert.equal(s.root.classes.has('is-expanded'), true);
  s.view.scrollTo(0);
  assert.equal(s.root.classes.has('is-expanded'), false);
});

test('restored positions below the hero expand immediately', () => {
  const s = setup(1200, 900);
  assert.equal(s.root.classes.has('is-expanded'), true);
});

test('Call copies the number, confirms it, and keeps the contact options open', async () => {
 const s=setup();s.toggle.emit('click');
 await s.options.emit('click',{target:s.links[0]});
 assert.deepEqual(s.clipboardWrites,['+918070607068']);
 assert.equal(s.copyLabel.textContent,'Copied');assert.equal(s.options.hidden,false);
 for(const reset of s.timers.values())reset();
 assert.equal(s.copyLabel.textContent,'Call');
});
test('failed copying never reports success', async () => {
 const s=setup();s.view.navigator.clipboard.writeText=async()=>{throw new Error('Denied');};
 await s.options.emit('click',{target:s.links[0]});
 assert.equal(s.copyLabel.textContent,'Couldn’t copy');assert.equal(s.options.hidden,false);
});
test('selection fallback copies when Clipboard API is unavailable and always removes its temporary field', async () => {
 for(const succeeds of [true,false]){
  const field={style:{},setAttribute(){},select(){this.selected=true;},remove(){this.removed=true;}};
  const doc={defaultView:{},querySelector:()=>null,createElement:()=>field,body:{appendChild(){}},execCommand:()=>succeeds};
  if(succeeds)await copyPhoneNumber(doc,'+918070607068');
  else await assert.rejects(copyPhoneNumber(doc,'+918070607068'));
  assert.equal(field.value,'+918070607068');assert.equal(field.selected,true);assert.equal(field.removed,true);
 }
});
