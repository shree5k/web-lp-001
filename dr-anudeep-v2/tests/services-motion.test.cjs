const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initializePageMotion } = require('../assets/js/page-motion.js');
function setup({ reduced = false, mobile = false, libraries = true, fail = false } = {}) {
 const calls = [], listeners = new Map();
 const media = { matches: reduced, addEventListener(n,f){this.change=f;}, removeEventListener(){this.change=null;} };
 const content = {}, image = {}, photo = { parentElement: image };
 const section = { querySelector: selector => selector === '.services-entry__content' ? content : image };
 const sidebar = {}, consultation = {};
 const doc = {
  querySelector: selector => ({'.services-sidebar': sidebar, '.page-consultation': consultation})[selector],
  querySelectorAll: selector => selector === '.services-entry' ? [section] : [photo]
 };
 const context = { reverted:false, add(fn){fn();}, revert(){this.reverted=true;} };
 const desktop = { reverted:false, add(query,fn){if(!mobile)fn();}, revert(){this.reverted=true;} };
 const gsap = {
  registerPlugin(){}, context:()=>context, matchMedia:()=>desktop,
  fromTo(target,from,to){calls.push({target,from,to});if(fail && calls.length===2)throw new Error('Animation unavailable');}
 };
 const trigger = { refresh(){this.refreshed=true;} };
 const view = { matchMedia:()=>media, addEventListener(n,f){listeners.set(n,f);},removeEventListener(n){listeners.delete(n);} };
 if(libraries)Object.assign(view,{gsap,ScrollTrigger:trigger});
 const dispose=initializePageMotion(view,doc);
 return {calls,media,context,desktop,listeners,trigger,dispose,section,content,image,photo};
}
test('services reveals match home easing and use once-only section triggers',()=>{
 const s=setup();
 const hero=s.calls[0];assert.equal(hero.to.ease,'power3.out');assert.equal(hero.to.stagger,.12);
 const content=s.calls.find(call=>call.target===s.content);
 assert.equal(content.to.scrollTrigger.trigger,s.section);assert.equal(content.to.scrollTrigger.once,true);
 assert.equal(content.to.opacity,1);assert.equal(content.to.y,0);
 assert.equal(s.trigger.refreshed,true);
});
test('services parallax runs on desktop while mobile keeps image entrances',()=>{
 const desktop=setup(), mobile=setup({mobile:true});
 assert.ok(desktop.calls.some(call=>call.target===desktop.photo&&call.to.yPercent<0));
 assert.equal(mobile.calls.some(call=>'yPercent' in call.to),false);
 assert.ok(mobile.calls.some(call=>call.target===mobile.image&&call.to.opacity===1));
});
test('missing libraries and reduced motion leave static content and preference changes clean up',()=>{
 assert.equal(setup({libraries:false}).calls.length,0);
 assert.equal(setup({reduced:true}).calls.length,0);
 const s=setup();s.media.matches=true;s.media.change();
 assert.equal(s.context.reverted,true);assert.equal(s.desktop.reverted,true);
});
test('partial initialization failure reverts hidden content and disposal removes listeners',()=>{
 const s=setup({fail:true});assert.equal(s.context.reverted,true);
 const normal=setup();normal.dispose();
 assert.equal(normal.context.reverted,true);assert.equal(normal.desktop.reverted,true);
 assert.equal(normal.listeners.size,0);assert.equal(normal.media.change,null);
});
