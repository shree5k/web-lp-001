// Code-only regression checks; no browser or third-party test dependencies.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8');
class Element {
  constructor(id='') {
    this.id=id; this.attrs={}; this.handlers={}; this.dataset={}; this.hidden=false;
    this.style={setProperty:(k,v)=>{this.style[k]=v;}};
    this.classes=new Set();
    this.classList={contains:k=>this.classes.has(k), toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};
    this.rect={top:200,left:0,right:100,bottom:100,width:220}; this.offsetLeft=0; this.queries={}; this.groups={};
  }
  addEventListener(k,fn) { (this.handlers[k]??=[]).push(fn); }
  emit(k,event={}) { for(const fn of this.handlers[k]??[])fn(event); }
  click() { this.emit('click'); }
  setAttribute(k,v) { this.attrs[k]=v; }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k];if(k==='id')this.id=''; }
  cloneNode() {
    const node=new Element(this.id);node.attrs={...this.attrs};node.dataset={...this.dataset};node.classes=new Set(this.classes);
    const child=new Element();child.dataset.dialog=this.groups['button, a, input, [tabindex]']?.[0]?.dataset.dialog;child.parentElement=node;
    node.groups['button, a, input, [tabindex]']=[child];node.queries['[data-dialog]']=child;
    return node;
  }
  appendChild(node) {
    const cards=this.groups['.expertise-card'];node.offsetLeft=cards.length*252;cards.push(node);node.parentElement=this;this.scrollWidth=cards.length*252-32;
  }
  closest(selector) {
    if(selector==='[data-dialog]'&&this.dataset.dialog)return this;
    if(selector==='[data-loop-copy]'&&this.dataset.loopCopy)return this;
    return this.parentElement?.closest(selector)??null;
  }
  getBoundingClientRect() { return this.rect; }
  querySelector(k) { return this.queries[k]??(this.queries[k]=new Element()); }
  querySelectorAll(k) { return this.groups[k]??[]; }
  focus() { this.focused=true; }
  contains(node) { return node === this; }
  scrollBy({left}) { this.scrollLeft+=left; }
  scrollTo({left}) { this.scrollLeft=left; }
  showModal() { this.open=true; }
  close() { this.open=false; this.emit('close'); }
}
function setup({reduced=false,libraries=true,failAnimation=false,autoplay=false,gallery=false,mobile=false,controls=true,dialogMotion=false}={}) {
  const win=new Element(),doc=new Element(),media=new Element(); media.matches=reduced;
  win.scrollY=0;win.innerHeight=1000;win.matchMedia=()=>media;
  win.scrollTo=value=>{win.lastScroll=value;};
  const autoFrames=new Map();let nextAutoFrame=0,now=0;
  win.performance={now:()=>now};
  if(autoplay){
    win.requestAnimationFrame=fn=>{const id=++nextAutoFrame;autoFrames.set(id,fn);return id;};
    win.cancelAnimationFrame=id=>autoFrames.delete(id);
  }
  function stepAuto(time){now=time;const pending=[...autoFrames.values()];autoFrames.clear();pending.forEach(fn=>fn(time));}

  const ids={};doc.getElementById=id=>ids[id]??null;
  for(const id of ['home','media','about','ethos','team','why-choose','location','packages'])ids[id]=new Element(id);
  const header=doc.querySelector('.site-header');
  const rail=doc.querySelector('.expertise-rail');rail.scrollLeft=0;rail.scrollWidth=1984;rail.clientWidth=900;
  rail.groups['.expertise-card']=Array.from({length:8},(_,i)=>{
    const card=new Element(`service-${i+1}`);card.offsetLeft=i*252;card.classes.add('expertise-card');ids[card.id]=card;
    const child=new Element();child.dataset.dialog=`treatment-${i+1}`;child.parentElement=card;
    card.groups['button, a, input, [tabindex]']=[child];card.queries['[data-dialog]']=child;
    return card;
  });
  rail.queries['.expertise-card']=rail.groups['.expertise-card'][0];
  const opener=new Element();opener.dataset.dialog=gallery?'gallery-detail-1':'treatment-1';opener.click=()=>doc.emit('click',{target:opener});
  const dialog=ids[opener.dataset.dialog]=new Element(opener.dataset.dialog);dialog.rect.top=0;
  const dialogAnimations=[];
  if (!gallery) dialog.classes.add('treatment-dialog');
  if (dialogMotion) dialog.animate=(frames,options)=>{
    const animation={frames,options,cancel(){this.cancelled=true;}};
    dialogAnimations.push(animation);return animation;
  };
  doc.groups['[data-dialog]']=[opener];doc.groups['.treatment-dialog']=[dialog];doc.groups['.treatment-dialog, .gallery-dialog, .reels-dialog']=[dialog];
  const input=new Element();input.parentElement=new Element();input.value='50';
  doc.groups['.result-comparison input']=[input];
  const calls=[],instances=[],ticker=new Set(),contexts=[],errors=[];
  const trigger={update(){},refresh(){calls.push({type:'refresh'});}};
  const animate=(type,target,from,to)=>{
    if(failAnimation && calls.filter(c=>c.type==='fromTo').length===2 && type==='fromTo')throw Error('Injected animation failure');
    calls.push({type,target,from,to});to?.onComplete?.();
  };
  const gsap={registerPlugin(){},killTweensOf(){},fromTo:(t,f,v)=>animate('fromTo',t,f,v),to:(t,v)=>animate('to',t,null,v),
    matchMedia(){return {add(query,fn){if(query==='(min-width: 768px)'&&!mobile)fn();},revert(){}};},
    ticker:{add:fn=>ticker.add(fn),remove:fn=>ticker.delete(fn)},
    context(fn){if(!fn)return undefined;const ctx={reverted:false,revert(){this.reverted=true;},add(fn){fn();}};contexts.push(ctx);if(fn)fn();return ctx;}
  };
  class Lenis {constructor(options){this.options=options;instances.push(this);}on(){}raf(){}stop(){this.stopped=true;}start(){this.stopped=false;}destroy(){this.destroyed=true;}scrollTo(target,options){this.scrolled={target,options};}}
  const history={pushState(...args){this.args=args;}};
  if(libraries)Object.assign(win,{gsap,ScrollTrigger:trigger,Lenis});
  const context={window:win,document:doc,history,getComputedStyle:()=>({gap:'32px'}),console:{error:(...e)=>errors.push(e)},setTimeout:fn=>{fn();return 1;},clearTimeout(){}};
  if(libraries)Object.assign(context,{Lenis});
  if (!controls) {
    const query = doc.querySelector.bind(doc);
    doc.querySelector = selector => ['.expertise-prev', '.expertise-next'].includes(selector) ? null : query(selector);
  }
  vm.runInNewContext(code,context);
  return {win,doc,media,ids,header,rail,autoFrames,stepAuto,opener,dialog,dialogAnimations,input,calls,instances,ticker,contexts,errors,history};
}
test('main page uses native controls and keeps smooth scrolling',()=>{
 const s=setup();
 const o=s.instances[0].options;assert.equal(o.duration,1);assert.equal(o.wheelMultiplier,.7);assert.equal(o.touchMultiplier,1.5);
 assert.equal(s.ticker.size,1);assert.equal(s.errors.length,0);
});
test('header hides only past first viewport and returns scrolling up',()=>{
 const s=setup({reduced:true});s.win.scrollY=500;s.win.emit('scroll');assert.equal(s.header.style.transform,undefined);
 s.win.scrollY=1200;s.win.emit('scroll');assert.equal(s.header.style.transform,'translateY(-120px)');
 s.win.scrollY=1100;s.win.emit('scroll');assert.equal(s.header.style.transform,'');assert.equal(s.header.classes.has('is-scrolled'),true);
});
test('dialog pauses scrolling, closes on backdrop, and restores focus',()=>{
 const s=setup();s.opener.click();assert.equal(s.dialog.open,true);assert.equal(s.instances[0].stopped,true);
 s.dialog.emit('click',{target:s.dialog,clientX:50,clientY:50});assert.equal(s.dialog.open,true);
 s.dialog.emit('click',{target:s.dialog,clientX:150,clientY:50});assert.equal(s.dialog.open,false);
 assert.equal(s.instances[0].stopped,false);assert.equal(s.opener.focused,true);
});
test('gallery range updates comparison position',()=>{
 const s=setup();s.input.value='75';s.input.emit('input');assert.equal(s.input.parentElement.style['--comparison'],'75%');
});
test('service anchors reveal the capsule and scroll directly to it',()=>{
 const s=setup();const card=s.ids['service-3']=new Element('service-3');card.classes.add('expertise-card');card.offsetLeft=504;
 let prevented=false;const link={hash:'#service-3'};
 s.doc.emit('click',{target:{closest:selector=>selector==='a[href^="#"]'?link:null},preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(s.rail.scrollLeft,504);assert.equal(s.instances[0].scrolled.target,card);
 assert.equal(s.instances[0].scrolled.options.offset,-80);assert.equal(card.focused,true);
});
test('reduced motion cleanup removes ticker and destroys smoothing',()=>{
 const s=setup();s.media.matches=true;s.media.emit('change');
 assert.equal(s.contexts[0].reverted,true);assert.equal(s.ticker.size,0);assert.equal(s.instances[0].destroyed,true);
 s.media.matches=false;s.media.emit('change');assert.equal(s.ticker.size,1);
});
test('missing optional libraries preserve native controls and anchors',()=>{
 const s=setup({libraries:false});assert.equal(s.calls.length,0);
 s.opener.click();s.dialog.querySelector('.dialog-close').click();assert.equal(s.dialog.open,false);
 s.doc.emit('click',{target:{closest:selector=>selector==='a[href^="#"]'?{hash:'#about'}:null},preventDefault(){}});
 assert.equal(s.win.lastScroll.top,120);
});
test('animation definitions preserve reference triggers and independent transforms',()=>{
 const s=setup();const c=s.calls;
 assert.equal(c.some(x=>x.target==='.logos-container'),false);
 assert.equal(c.some(x=>x.target==='.circular-lettering'),false);
 const aboutParallax=c.find(x=>x.target===s.ids.about.querySelector('.motion-image-parallax'));
 assert.equal(aboutParallax.to.yPercent,-8);assert.equal(aboutParallax.to.scrollTrigger.scrub,2);
 const cards=c.find(x=>x.target==='.expertise-card');assert.equal(cards.to.stagger,.04);assert.equal(cards.from.y,20);assert.equal(cards.to.duration,.6);assert.equal(cards.to.scrollTrigger.start,'top 85%');
 assert.notEqual(aboutParallax.target,s.ids.about.querySelector('.motion-image-reveal'));
});
test('partial animation failures revert initialized reveals',()=>{
 const s=setup({failAnimation:true});assert.equal(s.errors.length,1);assert.equal(s.contexts[0].reverted,true);assert.equal(s.ticker.size,0);
});
test('malformed hash links do not crash click handling',()=>{
 const s=setup();assert.doesNotThrow(()=>s.doc.emit('click',{target:{closest:selector=>selector==='a[href^="#"]'?{hash:'#%'}:null},preventDefault(){}}));
});

test('bundled GSAP context creation supports setup and rollback',()=>{
 const {gsap}=require('../assets/vendor/gsap.min.js');
 assert.equal(gsap.version,'3.13.0');
 assert.equal(gsap.context(),undefined);
 const context=gsap.context(()=>{});
 const target={value:10};
 try {
   assert.throws(()=>context.add(()=>{
     gsap.fromTo(target,{value:0},{value:100,duration:1}).progress(.5);
     throw Error('Injected setup failure');
   }),/Injected setup failure/);
   assert.notEqual(target.value,10);
   context.revert();
   assert.equal(target.value,10);
 } finally { context.revert(); }
});

test('USP strip remains visible without waiting for scroll triggers',()=>{
 const s=setup();
 assert.equal(s.calls.some(c=>c.target===s.ids.media),false);
});

test('expertise arrows and keyboard move one capsule with endless controls',()=>{
 const s=setup({reduced:true});
 const previous=s.doc.querySelector('.expertise-prev'),next=s.doc.querySelector('.expertise-next');
 assert.equal(previous.disabled,false);assert.equal(next.disabled,false);
 next.click();assert.equal(s.rail.scrollLeft,252);
 let prevented=false;s.rail.emit('keydown',{target:s.rail,key:'ArrowRight',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(s.rail.scrollLeft,504);
 previous.click();assert.equal(s.rail.scrollLeft,252);
 s.rail.scrollLeft=1084;s.rail.emit('scroll');assert.equal(next.disabled,false);
});

test('expertise auto-scroll is slow and pauses on hover and focus',()=>{
 const s=setup({autoplay:true});
 for(let i=0;i<=10;i++)s.stepAuto(1000+i*100);
 assert.ok(Math.abs(s.rail.scrollLeft-20)<.01);
 s.rail.emit('pointerenter',{pointerType:'mouse'});assert.equal(s.autoFrames.size,0);
 s.stepAuto(5000);assert.ok(Math.abs(s.rail.scrollLeft-20)<.01);
 s.rail.emit('pointerleave');assert.equal(s.autoFrames.size,1);
 s.rail.emit('focusin');assert.equal(s.autoFrames.size,0);
 s.rail.emit('focusout',{relatedTarget:null});assert.equal(s.autoFrames.size,1);
});
test('expertise auto-scroll respects visibility, reduced motion and open dialogs',()=>{
 const reduced=setup({autoplay:true,reduced:true});assert.equal(reduced.autoFrames.size,0);
 const s=setup({autoplay:true});
 s.doc.hidden=true;s.doc.emit('visibilitychange');assert.equal(s.autoFrames.size,0);
 s.doc.hidden=false;s.doc.emit('visibilitychange');assert.equal(s.autoFrames.size,1);
 s.opener.click();assert.equal(s.autoFrames.size,0);
 s.dialog.close();assert.equal(s.autoFrames.size,1);
 s.media.matches=true;s.media.emit('change');assert.equal(s.autoFrames.size,0);
});
test('manual interaction pauses immediately and resumes without a cooldown',()=>{
 const s=setup({autoplay:true});s.stepAuto(1000);
 s.rail.emit('pointerdown');assert.equal(s.autoFrames.size,0);
 s.win.emit('pointerup');assert.equal(s.autoFrames.size,1);
 s.stepAuto(1016);s.stepAuto(1032);assert.ok(s.rail.scrollLeft>0);
 s.rail.emit('pointerdown');assert.equal(s.autoFrames.size,0);
 s.win.emit('pointercancel');assert.equal(s.autoFrames.size,1);
});
test('automatic movement wraps seamlessly and continues in the same direction',()=>{
 const s=setup({autoplay:true});s.rail.scrollLeft=2015;
 s.rail.emit('pointerenter',{pointerType:'mouse'});s.rail.emit('pointerleave');
 s.stepAuto(1000);assert.equal(s.rail.scrollLeft,2015);
 s.stepAuto(1100);assert.equal(s.rail.scrollLeft,1);
 s.stepAuto(1200);assert.equal(s.rail.scrollLeft,3);
});

test('loop copies have no duplicate IDs or keyboard stops and expand for wide screens',()=>{
 const s=setup();const copies=s.rail.groups['.expertise-card'].slice(8);
 assert.equal(copies.length,16);
 for(const copy of copies){
  assert.equal(copy.id,'');assert.equal(copy.getAttribute('aria-hidden'),'true');
  assert.ok(copy.dataset.originalId.startsWith('service-'));
  assert.equal(copy.groups['button, a, input, [tabindex]'][0].getAttribute('tabindex'),'-1');
 }
 s.rail.clientWidth=6000;s.win.emit('resize');assert.equal(s.rail.groups['.expertise-card'].length,40);
});
test('copy activation opens original dialog and restores focus to original control',()=>{
 const s=setup();const copy=s.rail.groups['.expertise-card'][8];const button=copy.querySelector('[data-dialog]');
 s.doc.emit('click',{target:button});assert.equal(s.dialog.open,true);
 s.dialog.close();assert.equal(s.ids['service-1'].querySelector('[data-dialog]').focused,true);
});
test('backward navigation wraps and scroll-end normalizes repeat copies',()=>{
 const s=setup({reduced:true});s.doc.querySelector('.expertise-prev').click();assert.equal(s.rail.scrollLeft,1764);
 s.rail.scrollLeft=2100;s.rail.emit('scrollend');assert.equal(s.rail.scrollLeft,84);
});


test('restored gallery comparisons and expansion retain focus and scroll handling',()=>{
 const s=setup({gallery:true});
 s.input.value='65';s.input.emit('input');assert.equal(s.input.parentElement.style['--comparison'],'65%');
 s.opener.click();assert.equal(s.dialog.open,true);assert.equal(s.instances[0].stopped,true);
 s.dialog.querySelector('.dialog-close').click();assert.equal(s.dialog.open,false);
 assert.equal(s.opener.focused,true);assert.equal(s.instances[0].stopped,false);
});

test('mobile hero retains opacity entrance without image zoom or scroll movement',()=>{
 const mobile=setup({mobile:true});
 assert.equal(mobile.errors.length,0);
 const entrance=mobile.calls.find(c=>c.target==='.hero-slide');
 assert.equal(entrance.from.opacity,0);
 assert.equal(entrance.to.opacity,1);
 assert.equal(mobile.calls.some(c=>c.target==='.hero-slide'&&c.from?.scale!==undefined),false);
 assert.equal(mobile.calls.some(c=>c.target==='.hero-image-motion'),false);
 const desktop=setup();
 assert.equal(desktop.calls.some(c=>c.target==='.hero-slide'&&c.from?.scale===1.1),true);
 assert.equal(desktop.calls.some(c=>c.target==='.hero-image-motion'&&c.to.y===400),true);
});

test('mouse focus does not keep expertise paused after leaving the rail',()=>{
 const s=setup({autoplay:true});
 s.rail.emit('pointerenter',{pointerType:'mouse'});
 s.rail.emit('focusin',{target:{matches:()=>false}});
 s.rail.emit('pointerleave');assert.equal(s.autoFrames.size,1);
 s.stepAuto(1000);s.stepAuto(1016);assert.ok(s.rail.scrollLeft>0);
});

test('expertise keeps looping, keyboard navigation and resize support without visible arrows',()=>{
 const s=setup({controls:false,autoplay:true});
 s.stepAuto(1000);s.stepAuto(1100);assert.ok(s.rail.scrollLeft>0);
 let prevented=false;
 s.rail.emit('keydown',{target:s.rail,key:'ArrowRight',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.ok(s.rail.scrollLeft>=252);
 s.rail.clientWidth=5000;
 assert.doesNotThrow(()=>s.win.emit('resize'));
 assert.ok(s.rail.scrollWidth>s.rail.clientWidth);
 assert.equal(s.errors.length,0);
});

test('practice image has visible vertical movement and enough overscan to cover its frame',()=>{
 const s=setup();
 const motion=s.calls.find(c=>c.target===s.ids.location.querySelector('.motion-image-parallax'));
 assert.ok(motion.to.yPercent < -6);
 assert.ok(motion.to.scrollTrigger.scrub > 0);
 const css=fs.readFileSync(path.join(__dirname,'../assets/css/sections.css'),'utf8');
 const height=Number(css.match(/\.refined-location \.refined-photo \{[^}]*height:\s*(\d+)%/)[1]);
 assert.ok(height*(1+motion.to.yPercent/100)>=100,'parallax must not reveal an empty image edge');
});

test('expertise dialog waits for exit before restoring focus and scrolling',()=>{
 const s=setup({dialogMotion:true});s.opener.click();
 assert.equal(s.dialogAnimations[0].options.duration,320);
 s.dialog.querySelector('.dialog-close').click();
 assert.equal(s.dialogAnimations[0].cancelled,true);
 assert.equal(s.dialog.open,true);assert.equal(s.instances[0].stopped,true);
 assert.equal(s.opener.focused,undefined);
 s.dialog.querySelector('.dialog-close').click();assert.equal(s.dialogAnimations.length,2);
 s.dialogAnimations[1].onfinish();
 assert.equal(s.dialog.open,false);assert.equal(s.opener.focused,true);
 assert.equal(s.instances[0].stopped,false);assert.equal(s.dialog.classes.has('is-closing'),false);
 s.opener.click();assert.equal(s.dialogAnimations.length,3);assert.equal(s.dialog.open,true);
});
test('Escape and backdrop clicks share the expertise dialog exit animation',()=>{
 for(const kind of ['escape','backdrop']){
  const s=setup({dialogMotion:true});s.opener.click();
  let prevented=false;
  if(kind==='escape')s.dialog.emit('cancel',{preventDefault(){prevented=true;}});
  else s.dialog.emit('click',{target:s.dialog,clientX:150,clientY:50});
  if(kind==='escape')assert.equal(prevented,true);
  assert.equal(s.dialog.open,true);assert.equal(s.dialogAnimations.length,2);
  s.dialogAnimations[1].onfinish();assert.equal(s.dialog.open,false);
 }
});
test('reduced motion closes instantly and can finish a pending modal exit',()=>{
 const reduced=setup({dialogMotion:true,reduced:true});reduced.opener.click();
 reduced.dialog.querySelector('.dialog-close').click();
 assert.equal(reduced.dialogAnimations.length,0);assert.equal(reduced.dialog.open,false);
 const s=setup({dialogMotion:true});s.opener.click();s.dialog.querySelector('.dialog-close').click();
 s.media.matches=true;s.media.emit('change');
 assert.equal(s.dialog.open,false);assert.equal(s.dialogAnimations[1].cancelled,true);
});
test('gallery expansion retains its immediate native close behavior',()=>{
 const s=setup({dialogMotion:true,gallery:true});s.opener.click();
 s.dialog.querySelector('.dialog-close').click();
 assert.equal(s.dialogAnimations.length,0);assert.equal(s.dialog.open,false);
});
