// Renderer lifecycle checks without a browser; GL calls are recorded, not GPU-executed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {initializeBandsSections, createBandsRenderer, scrollOpacity, SETTINGS, ORIGINAL_FRAGMENT, FRAGMENT_SOURCE, VERTEX_SOURCE}=require('../assets/js/effects/bands-background.js');
class Events {
 constructor(){this.events={};this.style={};}
 addEventListener(name,fn){(this.events[name]??=new Set()).add(fn);}
 removeEventListener(name,fn){this.events[name]?.delete(fn);}
 emit(name,event={}){for(const fn of this.events[name]??[])fn(event);}
}
function setup({reduced=false,available=true,compile=true,link=true,observers=true,drawError=false,initialize=true,ambient=false}={}){
 const calls=[],frames=new Map(),warnings=[];let nextFrame=0;
 const gl=new Proxy({
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,
  createShader:()=>({shader:true}),createProgram:()=>({program:true}),createBuffer:()=>({buffer:true}),createVertexArray:()=>({vao:true}),
  getShaderParameter:()=>compile,getShaderInfoLog:()=> 'compile error',getProgramParameter:()=>link,getProgramInfoLog:()=> 'link error',
  getAttribLocation:()=>0,getUniformLocation:(_,name)=>name,
 },{get(target,key){if(key in target)return target[key];return (...args)=>{calls.push({name:key,args});if(key==='drawArrays'&&drawError)throw Error('draw error');};}});
 const canvas=new Events();canvas.hidden=true;canvas.width=0;canvas.height=0;canvas.getContext=type=>{calls.push({name:'getContext',args:[type]});return available?gl:null;};
 const fallback=new Events(),background=new Events();
 const footer={rect:{top:1100,height:900},getBoundingClientRect(){return this.rect;}};
 const section={rect:{top:600,left:0,width:1200,height:500},getAttribute:name=>name==='data-bands-motion'&&ambient?'ambient':null,querySelector:s=>s==='canvas'?canvas:s==='.bands-background__fallback'?fallback:background,getBoundingClientRect(){return this.rect;}};
 const media=new Events();media.matches=reduced;
 const env=new Events();env.document=new Events();env.document.hidden=false;env.document.querySelector=()=>footer;env.innerWidth=1200;env.innerHeight=900;env.devicePixelRatio=3;env.matchMedia=()=>media;env.console={warn:(...args)=>warnings.push(args)};
 env.requestAnimationFrame=fn=>{const id=++nextFrame;frames.set(id,fn);return id;};env.cancelAnimationFrame=id=>frames.delete(id);
 const observerInstances={};
 if(observers){
  env.IntersectionObserver=class{constructor(fn){this.fn=fn;observerInstances.intersection=this;}observe(){}disconnect(){this.disconnected=true;}};
  env.ResizeObserver=class{constructor(fn){this.fn=fn;observerInstances.resize=this;}observe(){}disconnect(){this.disconnected=true;}};
 }
 const renderer=initialize?createBandsRenderer(section,env):null;
 const visible=value=>observerInstances.intersection.fn([{isIntersecting:value}]);
 const step=time=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time));};
 return {calls,frames,warnings,canvas,fallback,background,footer,section,media,env,renderer,visible,step,observers:observerInstances};
}
test('source shader and uniforms preserve the reference parameters',()=>{
 assert.equal(SETTINGS.u_seed,113);assert.equal(SETTINGS.u_speed,.15);assert.equal(SETTINGS.u_lensScale,10);
 assert.equal(SETTINGS.u_lensSpacingX,1.21);assert.equal(SETTINGS.u_lensSpacingY,.01);
 assert.equal(SETTINGS.u_lensRadius,.58);assert.equal(SETTINGS.u_edgeDisp,.6);assert.equal(SETTINGS.u_dispersionStrength,0);
 assert.ok(VERTEX_SOURCE.startsWith('#version 300 es'));
 assert.ok(FRAGMENT_SOURCE.endsWith(ORIGINAL_FRAGMENT));
 const names=new Set(ORIGINAL_FRAGMENT.match(/\bu_\w+/g));
 for(const name of names)assert.match(FRAGMENT_SOURCE,new RegExp(`uniform [^;]+\\b${name}\\b`));
 const file=fs.readFileSync(path.join(__dirname,'../assets/js/effects/bands-background.js'),'utf8');
 const hash=file.match(/Original fragment SHA-256: ([a-f0-9]+)/)[1];
 assert.equal(createHash('sha256').update(ORIGINAL_FRAGMENT).digest('hex'),hash);
});
test('initialization is lazy and uploads the original black/amber/black palette',()=>{
 const s=setup();assert.equal(s.calls.length,0);s.visible(true);assert.equal(s.frames.size,1);assert.equal(s.canvas.hidden,true);
 s.step(0);assert.equal(s.canvas.hidden,false);
 assert.ok(s.calls.some(c=>c.name==='getContext'&&c.args[0]==='webgl2'));
 const palette=s.calls.find(c=>c.name==='uniform4fv').args[1];
 assert.equal(palette.length,12);assert.ok(Math.abs(palette[4]-209/255)<1e-6);assert.equal(palette[0],0);assert.equal(palette[8],0);
 s.renderer.destroy();
});
test('offscreen and hidden tabs pause rendering while retaining the reference page clock',()=>{
 const s=setup();s.visible(true);s.step(100);s.step(200);
 s.visible(false);assert.equal(s.frames.size,0);
 s.visible(true);s.step(20000);
 const times=s.calls.filter(c=>c.name==='uniform1f'&&c.args[0]==='u_time').map(c=>c.args[1]);
 assert.deepEqual(times,[.1,.2,20]);
 s.env.document.hidden=true;s.env.document.emit('visibilitychange');assert.equal(s.frames.size,0);
 s.env.document.hidden=false;s.env.document.emit('visibilitychange');assert.equal(s.frames.size,1);
 s.renderer.destroy();
});
test('reduced motion uses the still image and can change live',()=>{
 const s=setup({reduced:true});s.visible(true);assert.equal(s.calls.length,0);assert.equal(s.frames.size,0);
 s.media.matches=false;s.media.emit('change');s.step(0);assert.equal(s.canvas.hidden,false);
 s.media.matches=true;s.media.emit('change');assert.equal(s.canvas.hidden,true);assert.equal(s.frames.size,0);
 s.renderer.destroy();
});
test('resize respects display size, mobile resolution and pixel limits',()=>{
 const s=setup();s.visible(true);assert.equal(s.canvas.width,1800);assert.equal(s.canvas.height,1350);
 s.env.innerWidth=390;s.env.innerHeight=400;s.observers.resize.fn();assert.equal(s.canvas.width,390);assert.equal(s.canvas.height,400);
 s.env.innerWidth=10000;s.env.innerHeight=10000;s.env.emit('resize');assert.equal(s.canvas.width,4096);assert.equal(s.canvas.height,4096);
 s.renderer.destroy();
});
test('unavailable WebGL and compile/link/draw errors retain fallback and release resources',()=>{
 for(const options of [{available:false},{compile:false},{link:false},{drawError:true}]){
  const s=setup(options);assert.doesNotThrow(()=>s.visible(true));s.step(0);
  assert.equal(s.canvas.hidden,true);assert.equal(s.frames.size,0);assert.equal(s.warnings.length,1);
  if(options.compile===false)assert.equal(s.calls.filter(c=>c.name==='deleteShader').length,1);
  if(options.link===false)assert.equal(s.calls.filter(c=>c.name==='deleteShader').length,2);
  s.visible(false);s.visible(true);assert.equal(s.warnings.length,1);
  s.renderer.destroy();
 }
});
test('context loss and restoration recover with a fresh program',()=>{
 const s=setup();s.visible(true);s.step(0);let prevented=false;
 s.canvas.emit('webglcontextlost',{preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(s.canvas.hidden,true);assert.equal(s.frames.size,0);
 s.canvas.emit('webglcontextrestored');s.step(100);assert.equal(s.canvas.hidden,false);
 assert.equal(s.calls.filter(c=>c.name==='getContext').length,2);
 s.renderer.destroy();
});
test('bfcache pauses and resumes; final disposal is idempotent',()=>{
 const s=setup();s.visible(true);s.env.emit('pagehide',{persisted:true});assert.equal(s.frames.size,0);
 s.env.emit('pageshow');assert.equal(s.frames.size,1);
 s.env.emit('pagehide',{persisted:false});s.renderer.destroy();assert.equal(s.frames.size,0);
 assert.equal(s.observers.intersection.disconnected,true);assert.equal(s.observers.resize.disconnected,true);
 assert.equal(s.env.document.events.visibilitychange.size,0);assert.equal(s.media.events.change.size,0);
 assert.equal(s.calls.filter(c=>c.name==='deleteProgram').length,1);
});
test('missing observers still support visible rendering and window resizing',()=>{
 const s=setup({observers:false});assert.equal(s.frames.size,1);s.step(0);assert.equal(s.canvas.hidden,false);s.renderer.destroy();
});

test('reference fade ranges follow section entry and footer entry heights',()=>{
 assert.equal(scrollOpacity({top:1000,height:600},{top:1600,height:1000},1000),0);
 assert.equal(scrollOpacity({top:700,height:600},{top:1300,height:1000},1000),.5);
 assert.equal(scrollOpacity({top:400,height:600},{top:1000,height:1000},1000),1);
 assert.equal(scrollOpacity({top:-100,height:600},{top:500,height:1000},1000),.5);
 assert.equal(scrollOpacity({top:-600,height:600},{top:0,height:1000},1000),0);
});
test('field stays viewport-sized and anchored as text scrolls over it',()=>{
 const s=setup();s.visible(true);s.step(0);
 assert.equal(s.canvas.style.width,'1200px');assert.equal(s.canvas.style.height,'900px');
 assert.equal(s.canvas.style.top,'-600px');
 s.section.rect.top=300;s.footer.rect.top=800;s.env.emit('scroll');
 assert.equal(s.canvas.style.top,'-300px');assert.equal(s.fallback.style.top,'-300px');
 assert.equal(Number(s.background.style.opacity),1-100/900);
 s.renderer.destroy();
});
test('reduced-motion fallback is fixed in viewport coordinates without fading',()=>{
 const s=setup({reduced:true});s.section.rect.top=300;s.env.emit('scroll');
 assert.equal(s.fallback.style.top,'-300px');assert.equal(s.background.style.opacity,'1');assert.equal(s.frames.size,0);
 s.renderer.destroy();assert.equal(s.env.events.scroll.size,0);
});

test('ambient backgrounds animate locally without scroll anchoring or fading',()=>{
 const s=setup({ambient:true});s.visible(true);s.step(0);
 assert.equal(s.canvas.style.height,'500px');assert.equal(s.canvas.style.top,'0px');
 assert.equal(s.background.style.opacity,'1');assert.equal(s.env.events.scroll,undefined);
 s.section.rect.top=-200;s.footer.rect.top=0;s.env.emit('scroll');s.step(1000);
 assert.equal(s.canvas.style.top,'0px');assert.equal(s.background.style.opacity,'1');
 assert.equal(s.calls.filter(c=>c.name==='uniform1f'&&c.args[0]==='u_time').at(-1).args[1],1);
 s.section.rect.height=400;s.env.emit('resize');assert.equal(s.canvas.style.height,'400px');
 s.media.matches=true;s.media.emit('change');assert.equal(s.canvas.hidden,true);assert.equal(s.frames.size,0);
 assert.equal(s.fallback.style.top,'0px');assert.equal(s.background.style.opacity,'1');s.renderer.destroy();
});
test('all marked sections initialize separately and retain independent resources',()=>{
 const first=setup({initialize:false,reduced:true});
 const second=setup({initialize:false,reduced:true});
 first.env.document.querySelectorAll=()=>[first.section,second.section];
 const instances=initializeBandsSections(first.env);
 assert.equal(instances.length,2);assert.equal(first.calls.length,0);assert.equal(second.calls.length,0);
 assert.equal(first.canvas.hidden,true);assert.equal(second.canvas.hidden,true);
 assert.equal(first.env.document.events.visibilitychange.size,2);
 instances[0].destroy();assert.equal(first.env.document.events.visibilitychange.size,1);
 instances[1].destroy();assert.equal(first.env.document.events.visibilitychange.size,0);
});
