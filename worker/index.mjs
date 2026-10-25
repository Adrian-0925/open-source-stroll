// Self-contained ESM Worker; scripts/build.cjs embeds the approved static UI.
const ASSETS = /*__ASSETS__*/ {};
const SEED = /*__SEED__*/ { editions: [], projects: {} };
export const TIMEZONE = 'America/Denver';
const HOUR = 3600000;
const TOPICS = ['productivity', 'desktop-application', 'file-management', 'image-processing', 'note-taking', 'ocr', 'utilities'];
function searchPaths(now) {
  const index=Math.floor(now/86400000)%TOPICS.length;
  const cutoff=new Date(now-180*86400000).toISOString().slice(0,10);
  return Array.from({length:3},(_,attempt)=>`/search/repositories?q=${encodeURIComponent(`topic:${TOPICS[(index+attempt)%TOPICS.length]} stars:>200 fork:false archived:false pushed:>${cutoff}`)}&sort=stars&order=desc&per_page=50`);
}
export function dayKey(now) { return new Intl.DateTimeFormat('sv-SE', {timeZone:TIMEZONE}).format(new Date(now)); }
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const statement = (db,sql,...args) => db.prepare(sql).bind(...args);
async function state(db,key) { const row=await statement(db,'SELECT value FROM state WHERE key = ?',key).first(); return row?JSON.parse(row.value):null; }
function putState(db,key,value) { return statement(db,'INSERT INTO state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,JSON.stringify(value)); }
export async function readFeed(db) {
  const [catalog,issues,status] = await Promise.all([db.prepare('SELECT id,payload FROM projects').all(),db.prepare('SELECT payload FROM editions ORDER BY id DESC').all(),state(db,'status')]);
  const projects={...SEED.projects};
  for(const row of catalog.results)projects[row.id]=JSON.parse(row.payload);
  const editions=issues.results.length?issues.results.map(r=>JSON.parse(r.payload)):SEED.editions;
  return {editions,projects,status:status||{source:'seed',updatedAt:null,lastError:null}};
}
function reasonableRepo(r) { return r && Number.isInteger(r.id) && typeof r.full_name==='string' && /^[\w.-]+\/[\w.-]+$/.test(r.full_name) && typeof r.name==='string' && Number.isFinite(r.stargazers_count) && r.owner && Number.isInteger(r.owner.id); }
export function eligible(r,used,now) {
  return reasonableRepo(r) && !r.fork && !r.archived && !r.disabled && !r.private && r.description && r.license && r.license.spdx_id && !['NOASSERTION','NONE'].includes(r.license.spdx_id) && r.stargazers_count>=200 && new Date(r.pushed_at).getTime()>now-366*86400000 && !used.has(r.full_name.toLowerCase());
}
function label(r) {
  const t=(r.topics||[]).join(' ');
  if(/ocr|text-recognition/.test(t))return ['文字识别','从图片里提取文字'];
  if(/image|photo|drawing/.test(t))return ['图片处理','给图片处理，多一个选择'];
  if(/note|markdown|knowledge/.test(t))return ['笔记整理','把零散想法，有序收好'];
  if(/file|sync|backup/.test(t))return ['文件工具','让文件管理，省一点力'];
  if(/video|audio|media/.test(t))return ['影音工具','发现一个影音小帮手'];
  return ['效率工具','给日常工作，多一个帮手'];
}
export function isChinese(text) {
  const value=String(text||'');
  if(/[\u3040-\u30ff\uac00-\ud7af]/u.test(value))return false;
  const han=(value.match(/[\u3400-\u9fff]/gu)||[]).length;
  return han>=2 && han/Math.max(1,value.replace(/\s/g,'').length)>=0.18;
}
const isEditorial=p=>Object.values(SEED.projects).some(s=>s.repo.toLowerCase()===p.repo?.toLowerCase());
export function projectFrom(r,old={},now=Date.now()) {
  if(!reasonableRepo(r))throw new Error('GitHub 返回了不完整的项目资料');
  const [category,title]=label(r);
  const source=String(r.description||'').trim();
  const editorial=isEditorial({repo:r.full_name});
  const originalChinese=isChinese(source);
  const description=editorial && old.description?old.description:originalChinese?source:(isChinese(old.description)?old.description:'中文简介正在自动翻译，可先到原仓库了解项目。');
  return {...old,name:old.name||r.name,repo:r.full_name,category:old.category||category,title:old.title||title,
    description,copySource:editorial?'editorial':'github',
    ...(!editorial && originalChinese?{translation:{status:'original',source:source.slice(0,600),provider:null}}:{}),
    tags:old.tags||[r.language||'开源项目',r.license?.spdx_id||'查看许可'],
    note:editorial && old.note?old.note:'简介依据仓库描述自动翻译（MyMemory），未逐个安装测试。请先查看 README、安装要求与许可证。',
    art:old.art||'files',color:old.color||'lilac',avatarId:r.owner.id,
    stars:r.stargazers_count,forks:r.forks_count||0,language:r.language||null,license:r.license?.spdx_id||null,
    pushedAt:r.pushed_at,archived:!!r.archived,sourceDescription:source,checkedAt:new Date(now).toISOString()};
}
export async function translationQueue(env,now=Date.now()) {
  const feed=await readFeed(env.DB);
  const items=Object.entries(feed.projects).filter(([,p])=>{
    const source=(p.sourceDescription||'').slice(0,600);
    return !isEditorial(p) && source && !isChinese(source) && !(p.translation?.source===source && p.translation?.status==='ready') && !([p.translation?.source,p.translation?.attemptSource].includes(source) && new Date(p.translation?.retryAt||0).getTime()>now);
  }).slice(-6).map(([id,p])=>({id,repo:p.repo,source:p.sourceDescription.slice(0,600)}));
  return {items};
}
export async function saveTranslations(env,body,now=Date.now()) {
  if(!Array.isArray(body?.items)||body.items.length>6)return {error:'Expected up to six Chinese summaries'};
  const feed=await readFeed(env.DB),writes=[],seen=new Set();let updated=0,deferred=0;
  for(const item of body.items) {
    const p=feed.projects[item.id],source=p?.sourceDescription?.slice(0,600);
    if(!p||isEditorial(p)||seen.has(item.id)||typeof item.source!=='string'||item.source!==source)return {error:'Project or source changed; read the translation queue again'};
    seen.add(item.id);
    if(typeof item.zh==='string') {
      const zh=item.zh.trim();
      if(zh.length>1200||!isChinese(zh)||/<\/?[a-z][^>]*>/i.test(zh))return {error:'Expected plain Chinese summary text'};
      p.description=zh;p.copySource='github';
      p.translation={status:'ready',source,provider:'MyMemory',translatedAt:new Date(now).toISOString(),retryAt:null};updated++;
    } else if(['quota','unavailable'].includes(item.error)) {
      p.translation={...p.translation,status:p.translation?.status==='ready'?'ready':'pending',attemptSource:source,lastError:item.error,lastAttemptAt:new Date(now).toISOString(),retryAt:new Date(now+(item.error==='quota'?24*3600000:3600000)).toISOString()};deferred++;
    } else return {error:'Expected a translation or retry reason'};
    writes.push(statement(env.DB,'INSERT INTO projects (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',item.id,JSON.stringify(p)));
  }
  if(writes.length)await env.DB.batch(writes);
  return {outcome:'translated',updated,deferred};
}
class UpstreamError extends Error { constructor(message,retryAt=null){super(message);this.retryAt=retryAt;} }
async function github(path,env,fetcher,now) {
  const headers={'Accept':'application/vnd.github+json','User-Agent':'OpenSourceStroll/1.0','X-GitHub-Api-Version':'2026-03-10'};
  if(env.GITHUB_TOKEN)headers.Authorization=`Bearer ${env.GITHUB_TOKEN}`;
  let response;
  // Workers supports follow/manual, and throws before sending for redirect:error.
  try { response=await fetcher(`https://api.github.com${path}`,{headers,signal:AbortSignal.timeout(12000),redirect:'manual'}); }
  catch(error) { console.warn('GitHub transport failure',error.name,String(error.message).slice(0,200));throw new UpstreamError('GitHub 连接暂时不可用',now+15*60000); }
  if(!response.ok) {
    const reset=Number(response.headers.get('x-ratelimit-reset'))*1000;
    const retry=Number(response.headers.get('retry-after'))*1000;
    throw new UpstreamError([403,429].includes(response.status)?'GitHub 限流，稍后重试':`GitHub 接口暂时返回 ${response.status}`,Math.max(now+15*60000,reset||0,retry?now+retry:0));
  }
  try { return await response.json(); } catch {throw new UpstreamError('GitHub 返回了无效数据',now+15*60000);}
}
export async function refresh(env,fetcher=fetch,now=Date.now(),transport='worker') {
  const db=env.DB, day=dayKey(now), startedAt=new Date(now).toISOString();
  const previous=await state(db,'status');
  // Retry a pre-fix transport failure once after upgrading; never bypass rate-limit backoff.
  const oldTransportFailure=previous?.lastError==='GitHub 连接暂时不可用' && previous.transportVersion!==2;
  if(previous?.retryAt && transport!=='cloud' && !oldTransportFailure && new Date(previous.retryAt).getTime()>now)return {outcome:'backoff',status:previous};
  if(previous?.updatedAt && now-new Date(previous.updatedAt).getTime()<50*60000 && previous.editionDay===day && !previous.lastError)return {outcome:'cached',status:previous};
  const lock=await statement(db,"INSERT INTO state (key,value) VALUES ('lock',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(state.value AS INTEGER) < ?",String(now+5*60000),now).run();
  if(!lock.meta.changes)return {outcome:'busy'};
  let feed;
  try {
    feed=await readFeed(db);
    const projects={...feed.projects}, editions=[...feed.editions], changed=new Set(), problems=[];
    const ids=[...new Set([...(editions[0]?.projects||[]),...Object.keys(SEED.projects)])];
    // Bounded sequential requests stop immediately on rate limits.
    for(const id of ids) {
      try { const repo=await github(`/repos/${projects[id].repo}`,env,fetcher,now); projects[id]=projectFrom(repo,projects[id],now); changed.add(id); }
      catch(error){if(error.retryAt)throw error;problems.push(error.message);}
    }
    let edition=editions.find(e=>e.id===day),createdEdition=false;
    if(!edition) {
      const used=new Set(Object.values(projects).map(p=>p.repo.toLowerCase()));
      const pool=new Map();
      for(let attempt=0;attempt<3 && pool.size<6;attempt++) {
        const result=await github(searchPaths(now)[attempt],env,fetcher,now);
        if(!Array.isArray(result.items)||result.incomplete_results)throw new Error('GitHub 搜索结果不完整，本次保留上期推荐');
        for(const r of result.items)if(eligible(r,used,now))pool.set(r.full_name.toLowerCase(),r);
      }
      const selected=[...pool.values()].sort((a,b)=>Math.log10(b.stargazers_count+1)-Math.log10(a.stargazers_count+1)).slice(0,6);
      if(selected.length!==6)throw new Error('暂未找到 6 个符合条件且未推荐过的项目，保留上期推荐');
      const selectedIds=[];
      for(const r of selected){const id=`gh-${r.id}`;projects[id]=projectFrom(r,{},now);changed.add(id);selectedIds.push(id);}
      edition={id:day,number:String(editions.length+1).padStart(2,'0'),title:'给日常，多几个开源选择。',subtitle:'从 GitHub 的公开项目中，自动筛选出的六个新发现。',projects:selectedIds,selection:'automatic'};
      editions.unshift(edition);
      createdEdition=true;
    }
    const status={source:'github',transport,transportVersion:2,updatedAt:startedAt,lastAttemptAt:startedAt,editionDay:day,lastError:problems.join('；')||null,retryAt:null,timezone:TIMEZONE,refreshedProjects:changed.size};
    const writes=[...changed].map(id=>statement(db,'INSERT INTO projects (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',id,JSON.stringify(projects[id])));
    // Bootstrap editorial history only during the first successful data transaction.
    const newEditions=previous?.source==='github'?(createdEdition?[edition]:[]):editions;
    for(const e of newEditions)writes.push(statement(db,'INSERT INTO editions (id,payload) VALUES (?,?) ON CONFLICT(id) DO NOTHING',e.id,JSON.stringify(e)));
    writes.push(putState(db,'status',status));
    await db.batch(writes);
    return {outcome:'updated',status,edition:edition.id,projects:changed.size};
  } catch(error) {
    const status={...(previous||{source:'seed',updatedAt:null}),transportVersion:2,lastAttemptAt:startedAt,lastError:error.message,retryAt:new Date(error.retryAt||now+15*60000).toISOString()};
    await putState(db,'status',status).run();
    return {outcome:'deferred',status};
  } finally {await statement(db,"DELETE FROM state WHERE key='lock' AND value=?",String(now+5*60000)).run();}
}
export async function pullPlan(env,now=Date.now()) {
  const feed=await readFeed(env.DB),day=dayKey(now);
  const cached=feed.status.updatedAt && now-new Date(feed.status.updatedAt).getTime()<50*60000 && feed.status.editionDay===day && !feed.status.lastError;
  const ids=[...new Set([...(feed.editions[0]?.projects||[]),...Object.keys(SEED.projects)])];
  return {generatedAt:new Date(now).toISOString(),day,timezone:TIMEZONE,cached:!!cached,paths:cached?[]:[...ids.map(id=>`/repos/${feed.projects[id].repo}`),...(!feed.editions.some(e=>e.id===day)?searchPaths(now):[])]};
}
export async function ingest(env,body,now=Date.now()) {
  if(!body || !Array.isArray(body.responses) || body.responses.length>15 || Math.abs(now-new Date(body.fetchedAt).getTime())>15*60000 || !Number.isFinite(new Date(body.fetchedAt).getTime()))return {error:'Expected a fresh bounded GitHub batch'};
  const plan=await pullPlan(env,now),allowed=new Set(plan.paths),responses=new Map();
  if(plan.cached)return {outcome:'cached',status:(await readFeed(env.DB)).status};
  for(const entry of body.responses) {
    if(!entry || !allowed.has(entry.path)||responses.has(entry.path))return {error:'Unexpected or duplicate GitHub path'};
    if(entry.path.startsWith('/repos/')) {
      if(!reasonableRepo(entry.data) || entry.data.full_name.toLowerCase()!==entry.path.slice(7).toLowerCase())return {error:'Invalid repository response'};
    } else if(!Array.isArray(entry.data?.items)||entry.data.items.length>50||!entry.data.items.every(reasonableRepo))return {error:'Invalid search response'};
    responses.set(entry.path,entry.data);
  }
  if(plan.paths.some(path=>!responses.has(path)))return {error:'Incomplete GitHub batch; previous snapshot retained'};
  return refresh(env,async url=>{
    const path=url.slice('https://api.github.com'.length);
    if(!responses.has(path))return new Response('{}',{status:503});
    return json(responses.get(path));
  },now,'cloud');
}
export default {async fetch(request,env) {
  const url=new URL(request.url);
  try {
    if(url.pathname.startsWith('/api/admin/')) {
      if(!env.UPDATE_TOKEN)return json({error:'Background writes are disabled; configure UPDATE_TOKEN'},503);
      if(request.headers.get('Authorization')!==`Bearer ${env.UPDATE_TOKEN}`)return json({error:'Unauthorized'},401);
    }
    if(url.pathname==='/api/feed' && request.method==='GET')return json(await readFeed(env.DB));
    if(url.pathname==='/api/admin/plan' && request.method==='GET')return json(await pullPlan(env));
    if(url.pathname==='/api/admin/translations' && request.method==='GET')return json(await translationQueue(env));
    if(['/api/admin/refresh','/api/admin/ingest','/api/admin/translations'].includes(url.pathname)) {
      // Entry authorization requires a configured UPDATE_TOKEN for all admin routes.
      if(request.method!=='POST')return json({error:'POST required'},405);
      if(request.headers.get('Origin') && request.headers.get('Origin')!==url.origin)return json({error:'Origin rejected'},403);
      if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required'},415);
      if(Number(request.headers.get('Content-Length')||0)>2000000)return json({error:'Batch too large'},413);
      let result;
      if(!url.pathname.endsWith('/refresh')) {
        const text=await request.text();if(text.length>2000000)return json({error:'Batch too large'},413);
        try {result=url.pathname.endsWith('/ingest')?await ingest(env,JSON.parse(text)):await saveTranslations(env,JSON.parse(text));}catch(error){if(error instanceof SyntaxError)return json({error:'Invalid JSON'},400);throw error;}
      } else result=await refresh(env);
      return json(result,result.error?400:result.outcome==='deferred'?503:200);
    }
    if(request.method!=='GET' && request.method!=='HEAD')return json({error:'Method not allowed'},405);
    const asset=ASSETS[url.pathname==='/'?'/index.html':url.pathname];
    if(!asset)return new Response('Not found',{status:404});
    return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  } catch(error) {console.error('Request failed',url.pathname,error.message);return json({error:'数据暂时不可用，请稍后重试'},503);}
}};
