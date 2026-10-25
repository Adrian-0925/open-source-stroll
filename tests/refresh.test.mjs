import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {openDB}=require('../scripts/local-db.cjs');
const source=readFileSync(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {refresh,readFeed,eligible,dayKey,pullPlan,ingest,default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const today=Date.parse('2026-10-24T12:00:00Z'),tomorrow=today+86400000;
function repo(name,id=1){return {id,full_name:name,name:name.split('/')[1],owner:{id:123},stargazers_count:1000,forks_count:12,description:'Original repository description',topics:['productivity'],language:'TypeScript',license:{spdx_id:'MIT'},pushed_at:'2026-10-20T00:00:00Z',fork:false,archived:false,private:false};}
function mock(options={}){let calls=0;const fn=async(url,init)=>{calls++;if(init.redirect==='error')throw new TypeError('Workers does not support redirect:error');if(options.fail)return new Response('{}',{status:429,headers:{'x-ratelimit-reset':String(Math.floor((tomorrow+3600000)/1000))}});if(url.includes('/search/'))return Response.json({incomplete_results:false,items:[repo('localsend/localsend'),...Array.from({length:options.short?3:10},(_,i)=>repo('new/project'+i,i+50))]});return Response.json(repo(decodeURIComponent(new URL(url).pathname.replace('/repos/',''))));};fn.count=()=>calls;return fn;}
test('live metadata merges with original copy; cache avoids extra calls',async()=>{
  const DB=openDB(),api=mock();
  assert.equal((await refresh({DB},api,today)).outcome,'updated');
  const feed=await readFeed(DB);
  assert.equal(feed.projects.localsend.stars,1000);
  assert.match(feed.projects.localsend.description,/照片/);
  assert.equal(feed.status.source,'github');
  assert.equal((await refresh({DB},api,today+60000)).outcome,'cached');
  assert.equal(api.count(),6);
  assert.equal(feed.editions.length,1);DB.close();
});
test('next day creates six unique licensed new projects; history survives; same-day rerun idempotent',async()=>{
  const DB=openDB();await refresh({DB},mock(),today);
  const api=mock();assert.equal((await refresh({DB},api,tomorrow)).outcome,'updated');
  let feed=await readFeed(DB);
  assert.equal(feed.editions.length,2);assert.equal(feed.editions[0].projects.length,6);
  assert.equal(new Set(feed.editions.flatMap(e=>e.projects)).size,12);
  assert.equal(feed.editions[0].id,'2026-10-25');
  await refresh({DB},api,tomorrow+3600000);
  feed=await readFeed(DB);assert.equal(feed.editions.length,2);assert(feed.projects.localsend);DB.close();
});
test('rate limits preserve last-good snapshot and honor retry time without more HTTP',async()=>{
  const DB=openDB();await refresh({DB},mock(),today);
  const api=mock({fail:true});assert.equal((await refresh({DB},api,tomorrow)).outcome,'deferred');
  const feed=await readFeed(DB);assert.equal(feed.projects.localsend.stars,1000);assert.equal(feed.status.updatedAt,new Date(today).toISOString());assert.match(feed.status.lastError,/限流/);
  assert.equal((await refresh({DB},api,tomorrow+60000)).outcome,'backoff');assert.equal(api.count(),1);DB.close();
});
test('lease prevents overlapping writers; failed short batch creates no partial edition',async()=>{
  const DB=openDB();
  await DB.prepare("INSERT INTO state (key,value) VALUES ('lock',?)").bind(String(today+60000)).run();
  const api=mock();assert.equal((await refresh({DB},api,today)).outcome,'busy');assert.equal(api.count(),0);
  await DB.prepare("DELETE FROM state WHERE key='lock'").run();
  await refresh({DB},mock(),today);
  assert.equal((await refresh({DB},mock({short:true}),tomorrow)).outcome,'deferred');
  assert.equal((await readFeed(DB)).editions.length,1);DB.close();
});
test('selection excludes archived, forked, unlicensed and already featured repos',()=>{
  const r=repo('a/b');assert(eligible(r,new Set(),today));
  for(const bad of [{archived:true},{fork:true},{license:null},{license:{spdx_id:'NOASSERTION'}},{stargazers_count:1},{pushed_at:'2020-01-01'}])assert(!eligible({...r,...bad},new Set(),today));
  assert(!eligible(r,new Set(['a/b']),today));
  assert.equal(dayKey(Date.parse('2026-10-25T05:00:00Z')),'2026-10-24');
});
test('updater rejects cross-origin or non-JSON writes; static UI and feed are served',async()=>{
  const DB=openDB();
  let res=await worker.fetch(new Request('https://private.example/api/admin/refresh',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json',Authorization:'Bearer test-update-token'},body:'{}'}),{DB,UPDATE_TOKEN:'test-update-token'});assert.equal(res.status,403);
  res=await worker.fetch(new Request('https://private.example/api/admin/refresh',{method:'POST',headers:{Authorization:'Bearer test-update-token'}}),{DB,UPDATE_TOKEN:'test-update-token'});assert.equal(res.status,415);
  res=await worker.fetch(new Request('https://private.example/'),{DB});assert.match(await res.text(),/readability.css/);
  res=await worker.fetch(new Request('https://private.example/api/feed'),{DB});assert.equal((await res.json()).editions.length,1);DB.close();
});
test('cloud relay validates a complete fresh plan, persists official records and preserves same-day idempotency',async()=>{
  const DB=openDB();const api=mock();let plan=await pullPlan({DB},today);
  assert.equal(plan.paths.length,6);
  const responses=await Promise.all(plan.paths.map(async path=>({path,data:await (await api('https://api.github.com'+path,{redirect:'manual'})).json()})));
  assert((await ingest({DB},{fetchedAt:new Date(today).toISOString(),responses:responses.slice(1)},today)).error);
  assert((await ingest({DB},{fetchedAt:new Date(today-3600000).toISOString(),responses},today)).error);
  assert.equal((await ingest({DB},{fetchedAt:new Date(today).toISOString(),responses},today)).outcome,'updated');
  assert.equal((await readFeed(DB)).status.transport,'cloud');
  assert.equal((await pullPlan({DB},today)).cached,true);
  plan=await pullPlan({DB},tomorrow);assert.equal(plan.paths.length,9);
  const next=await Promise.all(plan.paths.map(async path=>({path,data:await (await api('https://api.github.com'+path,{redirect:'manual'})).json()})));
  assert.equal((await ingest({DB},{fetchedAt:new Date(tomorrow).toISOString(),responses:next},tomorrow)).outcome,'updated');
  assert.equal((await readFeed(DB)).editions.length,2);DB.close();
});
