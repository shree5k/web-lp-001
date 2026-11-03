const {test} = require('node:test');
const assert = require('node:assert/strict');
const {initializeNavigation} = require('../assets/js/blog.js');
function setup({reduced=false}={}) {
 const element=()=>({listeners:{},attrs:{},hidden:false,addEventListener(n,f){this.listeners[n]=f;},setAttribute(n,v){this.attrs[n]=v;},focus(){doc.activeElement=this;}});
 const doc=element(),view=element(),header=element(),toggle=element(),menu=element(),link=element(),label={};
 const mobile=element(),preference=element();mobile.matches=true;preference.matches=reduced;
 const classes=new Set();header.classList={toggle(n,v){v?classes.add(n):classes.delete(n);}};
 doc.body={classList:{add(){}}};doc.querySelector=()=>toggle;doc.getElementById=()=>menu;
 header.contains=node=>[header,toggle,menu,link].includes(node);
 menu.contains=node=>node===menu||node===link;
 toggle.closest=()=>header;toggle.querySelector=()=>label;menu.querySelector=()=>link;
 const animations=[];
 menu.animate=()=>{
  let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});
  const animation={finished,finish:resolve,cancel:()=>reject(new Error('cancelled'))};animations.push(animation);return animation;
 };
 view.matchMedia=q=>q.includes('1023')?mobile:preference;
 initializeNavigation(view,doc);
 return {doc,view,header,toggle,menu,link,label,mobile,preference,animations};
}
test('navigation opens and closes with animation, inert links and accessible feedback', async()=>{
 const s=setup();assert.equal(s.menu.hidden,true);
 s.toggle.listeners.click();assert.equal(s.menu.hidden,false);assert.equal(s.menu.inert,false);assert.equal(s.label.textContent,'Close');
 s.toggle.listeners.click();assert.equal(s.menu.inert,true);assert.equal(s.menu.hidden,false);
 s.animations.at(-1).finish();await Promise.resolve();assert.equal(s.menu.hidden,true);assert.equal(s.toggle.attrs['aria-expanded'],'false');
});
test('rapid toggles do not let an obsolete close hide an open menu',async()=>{
 const s=setup();s.toggle.listeners.click();s.toggle.listeners.click();s.toggle.listeners.click();
 s.animations.at(-1).finish();await Promise.resolve();assert.equal(s.menu.hidden,false);assert.equal(s.menu.inert,false);
});
test('Escape restores focus; outside clicks, reduced motion and desktop resizing close safely',()=>{
 const s=setup({reduced:true});s.toggle.listeners.keydown({key:'ArrowDown',preventDefault(){}});assert.equal(s.doc.activeElement,s.link);
 s.doc.listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(s.doc.activeElement,s.toggle);assert.equal(s.menu.hidden,true);
 s.toggle.listeners.click();s.doc.listeners.click({target:{}});assert.equal(s.menu.hidden,true);
 s.mobile.matches=false;s.mobile.listeners.change();assert.equal(s.toggle.hidden,true);assert.equal(s.menu.hidden,false);assert.equal(s.menu.inert,false);
});
