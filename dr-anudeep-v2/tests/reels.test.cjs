const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { initializeClinicReels } = require('../assets/js/reels.js');
function setup({ready=true,id='Ddq4W-WsaXK'}={}) {
 const events={}, linkEvents={}, holder={ children:[], replaceChildren(...nodes){this.children=nodes;} }, title={}, original={};
 const dialog={ hasAttribute:()=>ready, showModal(){}, querySelector:s=>({'.reels-dialog__embed':holder,'#clinic-reel-title':title,'.reels-dialog__original':original})[s], addEventListener:(n,f)=>{events[n]=f;} };
 const link={dataset:{reelId:id,reelTitle:'Hair and scalp care'},href:`https://www.instagram.com/reel/${id}/`,addEventListener:(n,f)=>{linkEvents[n]=f;}};
 const document={getElementById:()=>dialog,querySelectorAll:()=>[link],createElement:()=>({})};
 initializeClinicReels(document);
 return {holder,title,original,link,events,click:extra=>{let prevented=false;linkEvents.click({preventDefault(){prevented=true;},...extra});return prevented;}};
}
test('Instagram is loaded only after selection and removed on close',()=>{
 const s=setup();assert.equal(s.holder.children.length,0);
 assert.equal(s.click(),true);
 const frame=s.holder.children[0];
 assert.equal(frame.src,'https://www.instagram.com/reel/Ddq4W-WsaXK/embed/');
 assert.equal(frame.title,'Hair and scalp care');assert.equal(s.original.href,s.link.href);
 s.events.close();assert.equal(s.holder.children.length,0);
});
test('unavailable modal, modified clicks and invalid identifiers preserve the external link',()=>{
 for(const extra of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{button:1}]){
  const s=setup();assert.equal(s.click(extra),false);assert.equal(s.holder.children.length,0);
 }
 const fallback=setup({ready:false});assert.equal(fallback.click(),false);
 const unsafe=setup({id:'https://example.com'});assert.equal(unsafe.click(),false);
 assert.equal(unsafe.holder.children.length,0);
});
test('home includes the three selected reels immediately before the closing care section',()=>{
 const html=readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('<section id="clinic-reels"'),end=html.indexOf('</section>',start);
 assert.ok(start>0);assert.ok(end<html.indexOf('<section id="care-cta"'));
 const section=html.slice(start,end);
 for(const id of ['Ddq4W-WsaXK','DdjY5cSMpeN','Dc-Sc3dKPVc'])assert.ok(section.includes(`data-reel-id="${id}"`));
 assert.match(section,/@dermdoc.madhurya/);assert.match(section,/@aestheticsmysore/);
 assert.doesNotMatch(section,/<iframe/);
});
