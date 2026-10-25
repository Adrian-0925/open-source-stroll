import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {translateDescription,splitTranslation} from '../public/update-cloud.mjs';
const require=createRequire(import.meta.url);
const {openDB}=require('../scripts/local-db.cjs');
const {projectFrom,translationQueue,saveTranslations,readFeed,default:worker}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../dist/server/index.js',import.meta.url))).toString('base64'));
const now=Date.parse('2026-10-25T12:00:00Z');
const raw={id:99,name:'Sketch',full_name:'example/sketch',description:'A virtual whiteboard for hand-drawn diagrams.',owner:{id:12},stargazers_count:2000,license:{spdx_id:'MIT'}};
async function put(DB,p){await DB.prepare('INSERT INTO projects (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').bind('gh-99',JSON.stringify(p)).run();}
test('Chinese source bypasses the provider; UTF-8 segments respect the public API byte bound',async()=>{
  const original='这是一个可以离线使用的文字识别工具。';
  assert.equal(await translateDescription(original,()=>{throw new Error('Unexpected provider call');}),original);
  const source='A useful tool for photos. 🖼️ '.repeat(40);
  const chunks=splitTranslation(source);assert(chunks.length>1);assert.equal(chunks.join(''),source);
  assert(chunks.every(part=>Buffer.byteLength(part,'utf8')<=480));
});
test('translation uses the public provider without Site credentials and accepts only usable Chinese',async()=>{
  const zh=await translateDescription(raw.description,async(url,options)=>{
    assert.equal(new URL(url).hostname,'api.mymemory.translated.net');assert.equal(options.headers,undefined);
    assert.equal(new URL(url).searchParams.get('langpair'),'Autodetect|zh-CN');
    return Response.json({responseStatus:200,responseData:{translatedText:'用于绘制手绘风格图表的虚拟白板。'}});
  });assert.match(zh,/虚拟白板/);
  await assert.rejects(translateDescription(raw.description,async()=>Response.json({responseStatus:200,responseData:{translatedText:'MYMEMORY WARNING'}})),/unavailable/);
  await assert.rejects(translateDescription(raw.description,async()=>Response.json({quotaFinished:true,responseStatus:403})),/quota/);
});
test('translated copies persist, cache by original text, and retain provenance',async()=>{
  const DB=openDB();const p=projectFrom(raw,{},now);assert.match(p.description,/正在自动翻译/);await put(DB,p);
  let queue=await translationQueue({DB},now);assert.equal(queue.items.length,1);
  const result=await saveTranslations({DB},{items:[{id:'gh-99',source:raw.description,zh:'用于绘制手绘风格图表的虚拟白板。'}]},now);
  assert.equal(result.updated,1);assert.equal((await translationQueue({DB},now)).items.length,0);
  const feed=await readFeed(DB);assert.match(feed.projects['gh-99'].description,/虚拟白板/);assert.equal(feed.projects['gh-99'].sourceDescription,raw.description);
  const refreshed=projectFrom({...raw,stargazers_count:3000},feed.projects['gh-99'],now+3600000);assert.match(refreshed.description,/虚拟白板/);DB.close();
});
test('source changes invalidate cache; a failed translation keeps prior Chinese and retries later',async()=>{
  const DB=openDB();await put(DB,projectFrom(raw,{},now));
  await saveTranslations({DB},{items:[{id:'gh-99',source:raw.description,zh:'用于绘制手绘风格图表的虚拟白板。'}]},now);
  const old=(await readFeed(DB)).projects['gh-99'];const changed=projectFrom({...raw,description:'A collaborative virtual whiteboard with offline support.'},old,now+3600000);await put(DB,changed);
  assert.equal((await translationQueue({DB},now+3600000)).items.length,1);
  assert((await saveTranslations({DB},{items:[{id:'gh-99',source:raw.description,zh:'过时的中文简介。'}]},now)).error);
  await saveTranslations({DB},{items:[{id:'gh-99',source:changed.sourceDescription,error:'unavailable'}]},now+3600000);
  assert.match((await readFeed(DB)).projects['gh-99'].description,/虚拟白板/);
  assert.equal((await translationQueue({DB},now+3600001)).items.length,0);
  assert.equal((await translationQueue({DB},now+2*3600000+1)).items.length,1);
  assert((await saveTranslations({DB},{items:[{id:'gh-99',source:changed.sourceDescription,zh:'still English'}]},now)).error);DB.close();
});
test('editorial Chinese remains untouched and original Chinese bypasses translation',async()=>{
  const DB=openDB();const feed=await readFeed(DB);
  assert.equal((await translationQueue({DB},now)).items.length,0);
  assert((await saveTranslations({DB},{items:[{id:'localsend',source:feed.projects.localsend.sourceDescription,zh:'不能覆盖人工介绍。'}]},now)).error);
  await put(DB,projectFrom({...raw,description:'用于绘制手绘风格图表的虚拟白板。'}, {},now));
  assert.equal((await translationQueue({DB},now)).items.length,0);DB.close();
});

test('public deployments fail closed and authorized owners can read the pending queue',async()=>{
  const DB=openDB(),url='https://example.com/api/admin/translations';
  assert.equal((await worker.fetch(new Request(url),{DB})).status,503);
  assert.equal((await worker.fetch(new Request(url),{DB,UPDATE_TOKEN:'test-update-token'})).status,401);
  assert.equal((await worker.fetch(new Request(url,{headers:{Authorization:'Bearer test-update-token'}}),{DB,UPDATE_TOKEN:'test-update-token'})).status,200);
  assert.equal((await worker.fetch(new Request('https://example.com/api/feed'),{DB})).status,200);
  DB.close();
});
