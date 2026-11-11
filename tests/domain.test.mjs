import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentStore,deriveStats,storyDebt,PROJECTS} from '../domain.js';

class MemoryAdapter{
 state=null; files=new Map(); fail=false;
 async load(){return structuredClone(this.state);}
 async save(state){if(this.fail)throw Error('Simulated quota failure');this.state=structuredClone(state);}
 async getFile(id){return this.files.get(id);}
 async putFile(id,file){this.files.set(id,file);}
}
async function fixture(){const adapter=new MemoryAdapter();const s=await new ContentStore(adapter).init();const source=await s.add('sources',{title:'QA sintético — evento SØD',project_id:'sod',pillar_id:'p1',type:'Texto',text_content:'Escenario de prueba, no una experiencia real.',status:'READY'});const story=await s.add('stories',{title:'QA sintético — historia del evento',project_id:'sod',pillar_id:'p1',source_id:source.id,status:'READY'});const idea=await s.add('ideas',{title:'QA sintético — idea editorial',story_id:story.id,pillar_id:'p1',core_thesis:'Tesis de prueba'});return {adapter,s,source,story,idea};}
const future=(hours=24)=>new Date(Date.now()+hours*3600000).toISOString();

test('SØD EVENT STORY: synthetic complete workflow persists and updates dashboard',async()=>{
 const {adapter,s,story,idea}=await fixture();
 assert.equal(PROJECTS.find(p=>p.id==='sod').type,'PRIMARY');
 assert.equal(PROJECTS.find(p=>p.id==='orbita').type,'SECONDARY');
 assert.equal(storyDebt(s).length,1);
 await s.setSettings({experiences:4});
 assert.equal(deriveStats(s).captureRate,25);
 const item=await s.add('content_items',{title:'QA sintético — pieza evento',idea_id:idea.id,status:'DRAFT'});
 assert.equal(storyDebt(s).length,0);
 const variants=[];
 for(const platform of ['LinkedIn','X','Instagram','Threads'])variants.push(await s.add('content_variants',{content_item_id:item.id,platform,format:'post',copy:`QA sintético para ${platform}`,status:'READY'}));
 for(const variant of variants.slice(0,2)){await s.update('content_variants',variant.id,{status:'APPROVED'});await s.schedule(variant.id,future());}
 assert.equal(s.all('calendar_slots').length,2);
 assert.equal(deriveStats(s).scheduled,2);
 assert.equal(deriveStats(s).ready,2);
 const reloaded=await new ContentStore(adapter).init();
 assert.equal(reloaded.all('calendar_slots').length,2);
 assert.equal(reloaded.all('content_variants').length,4);
 assert.equal(reloaded.all('stories')[0].id,story.id);
 assert.equal(storyDebt(reloaded).length,0);
});
test('draft cannot schedule; approved edit revokes approval and calendar atomically',async()=>{
 const {s,idea}=await fixture();const item=await s.add('content_items',{title:'QA item',idea_id:idea.id});
 const v=await s.add('content_variants',{content_item_id:item.id,platform:'X',copy:'First draft'});
 await assert.rejects(s.schedule(v.id,future()),/Aprob/);
 await s.update('content_variants',v.id,{status:'APPROVED'});
 await assert.rejects(s.schedule(v.id,'bad date'),/fecha/);
 await assert.rejects(s.schedule(v.id,new Date(0).toISOString()),/futura/);
 await s.schedule(v.id,future());await s.schedule(v.id,future(48));
 assert.equal(s.all('calendar_slots').length,1);
 await s.update('content_variants',v.id,{copy:'Edited after approval',status:'APPROVED'});
 assert.equal(s.all('content_variants')[0].status,'DRAFT');assert.equal(s.all('calendar_slots').length,0);
});
test('invalid relationships, cross-project histories, empty approved copy and URLs rejected',async()=>{
 const {s,source,idea}=await fixture();
 await assert.rejects(s.add('ideas',{title:'Broken',story_id:'missing'}),/Relación/);
 await assert.rejects(s.add('stories',{title:'Wrong brand',source_id:source.id,project_id:'orbita'}),/proyecto de su fuente/);
 const item=await s.add('content_items',{title:'QA item',idea_id:idea.id});
 await assert.rejects(s.add('content_variants',{content_item_id:item.id,platform:'LinkedIn',copy:'',status:'APPROVED'}),/texto/);
 await assert.rejects(s.add('content_variants',{content_item_id:item.id,platform:'X',media_url:'javascript:alert(1)'}),/URL/);
 await assert.rejects(s.add('sources',{title:'bad link',file_url:'javascript:alert(1)'}),/URL/);
 await assert.rejects(s.delete('sources',source.id),/derivados/);
});
test('import validates structure, identities, state enums and preserves existing data on failure',async()=>{
 const {s}=await fixture();const before=await s.export();
 await assert.rejects(s.import('no-json'),/JSON/);
 const bad=JSON.parse(before);bad.sources[0].profile_id='someone-else';
 await assert.rejects(s.import(JSON.stringify(bad)),/perfil/);
 const unknown=JSON.parse(before);unknown.stories[0].status='AUTO_PUBLISH';
 await assert.rejects(s.import(JSON.stringify(unknown)),/Estado/);
 const unsafe=JSON.parse(before);unsafe.settings.experiences=-1;
 await assert.rejects(s.import(JSON.stringify(unsafe)),/experiencias/);
 const unsafeProfile=JSON.parse(before);unsafeProfile.profile.social_accounts[0].url='javascript:alert(1)';
 await assert.rejects(s.import(JSON.stringify(unsafeProfile)),/Perfil social/);
 const unsafeText=JSON.parse(before);unsafeText.sources[0].text_content={html:'bad'};
 await assert.rejects(s.import(JSON.stringify(unsafeText)),/texto inválido/);
 const unsafeDate=JSON.parse(before);unsafeDate.sources[0].captured_at='invalid-date';
 await assert.rejects(s.import(JSON.stringify(unsafeDate)),/Fecha inválida/);
 assert.equal(s.all('sources').length,1);assert.equal(storyDebt(s).length,1);
 const other=await new ContentStore(new MemoryAdapter()).init();await other.import(before);
 assert.equal(other.all('stories').length,1);
});
test('persistence failures roll back state and queue recovers',async()=>{
 const {adapter,s}=await fixture();adapter.fail=true;
 await assert.rejects(s.add('sources',{title:'Should not persist'}),/quota/);
 assert.equal(s.all('sources').length,1);adapter.fail=false;
 await s.add('sources',{title:'Recovery works'});assert.equal(s.all('sources').length,2);
});
test('concurrent mutations serialize without lost writes and reading arrays is isolated',async()=>{
 const s=await new ContentStore(new MemoryAdapter()).init();
 await Promise.all(Array.from({length:8},(_,i)=>s.add('sources',{title:`Concurrent ${i}`})));
 assert.equal(s.all('sources').length,8);const copy=s.all('sources');copy[0].title='Mutated';assert.notEqual(s.all('sources')[0].title,'Mutated');
});
test('mother piece derivative also settles narrative debt',async()=>{
 const {s,source,idea}=await fixture();
 const mother=await s.add('mother_pieces',{title:'QA mother',source_id:source.id,idea_id:idea.id});
 await s.add('content_items',{title:'QA derivative',mother_piece_id:mother.id});assert.equal(storyDebt(s).length,0);
});
