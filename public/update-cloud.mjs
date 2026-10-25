import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function isChinese(text) {
  const value=String(text||'');
  if(/[\u3040-\u30ff\uac00-\ud7af]/u.test(value))return false;
  const han=(value.match(/[\u3400-\u9fff]/gu)||[]).length;
  return han>=2 && han/Math.max(1,value.replace(/\s/g,'').length)>=0.18;
}
export function splitTranslation(text,maxBytes=480) {
  const segments=[];let part='';
  for(const character of text){if(Buffer.byteLength(part+character,'utf8')>maxBytes){segments.push(part);part='';}part+=character;}
  if(part)segments.push(part);return segments;
}
function plainText(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity)=>{
    if(entity[0]==='#'){const n=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[entity.toLowerCase()];
  }).replace(/<[^>]*>/g,'').trim();
}
export async function translateDescription(source,fetcher=fetch) {
  if(isChinese(source))return source;
  const parts=[];
  for(const segment of splitTranslation(source)) {
    const url=new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q',segment);url.searchParams.set('langpair','Autodetect|zh-CN');url.searchParams.set('mt','1');
    const response=await fetcher(url.href,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    let data;try{data=await response.json();}catch{throw new Error('unavailable');}
    if(response.status===429||data.quotaFinished||/quota|limit|next available/i.test(data.responseDetails||''))throw new Error('quota');
    if(!response.ok||Number(data.responseStatus)!==200||typeof data.responseData?.translatedText!=='string')throw new Error('unavailable');
    const translated=plainText(data.responseData.translatedText);
    if(!translated)throw new Error('unavailable');parts.push(translated);
  }
  const result=parts.join('');
  if(!isChinese(result)||result.length>1200)throw new Error('unavailable');return result;
}

// The original GitHub description is always retained in sourceDescription.
// Existing scheduled runs read this versioned script, including the Chinese-summary step.
// Scheduled updater for an independently authenticated backend. No stored credentials.
// Pass {origin,token} privately on stdin; token must match server-side UPDATE_TOKEN.
async function main() {
const input=await new Promise((resolve,reject)=>{
  let value='';const tty=process.stdin.isTTY;
  const finish=(error)=>{process.stdin.removeListener('data',onData);if(tty)process.stdin.setRawMode(false);process.stdin.pause();error?reject(error):resolve(value);};
  const onData=chunk=>{value+=chunk;if(value.includes('\u0003'))finish(new Error('Cancelled'));else if(value.length>20000)finish(new Error('Input too large'));else if(/[\r\n]/.test(value))finish();};
  if(tty){process.stdin.setRawMode(true);console.error('Ready for private updater JSON on stdin (input hidden).');}
  process.stdin.setEncoding('utf8');process.stdin.on('data',onData);process.stdin.once('end',()=>finish());process.stdin.resume();
});
try {
  const {origin,token}=JSON.parse(input);
  if(typeof token!=='string'||new URL(origin).origin!==origin||new URL(origin).protocol!=='https:')throw new Error('Use your HTTPS site origin and UPDATE_TOKEN');
  async function site(path,body) {
    const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(60000)});
    const result=await response.json();if(!response.ok)throw new Error(`Site ${path} returned ${response.status}: ${result.error||result.status?.lastError||'request failed'}`);return result;
  }
  const plan=await site('/api/admin/plan');
  const responses=[];
  if(!plan.cached) {
    if(!Array.isArray(plan.paths)||plan.paths.length>15)throw new Error('Unexpected plan');
    for(const path of plan.paths) {
      if(!/^\/repos\/[\w.-]+\/[\w.-]+$/.test(path)&&!path.startsWith('/search/repositories?q='))throw new Error('Unexpected source path');
      const response=await fetch('https://api.github.com'+path,{headers:{'Accept':'application/vnd.github+json','User-Agent':'OpenSourceStroll-Cloud/1.0','X-GitHub-Api-Version':'2026-03-10',...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})},redirect:'manual',signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error(`GitHub HTTP ${response.status}; next task should respect Retry-After ${response.headers.get('retry-after')||''} and rate-limit reset ${response.headers.get('x-ratelimit-reset')||''}; cached data retained`);
      responses.push({path,data:await response.json()});
    }
    const result=await site('/api/admin/ingest',{fetchedAt:new Date().toISOString(),responses});
    if(!['updated','cached'].includes(result.outcome))throw new Error(`Update outcome: ${result.outcome}`);
    console.log(JSON.stringify({operation:'update',outcome:result.outcome,status:result.status}));
  }
  const queue=await site('/api/admin/translations');
  if(!Array.isArray(queue.items)||queue.items.length>6)throw new Error('Unexpected Chinese summary queue');
  const translations=[];let quota=false;
  for(const item of queue.items) {
    try {
      if(quota)throw new Error('quota');
      const zh=await translateDescription(item.source);
      translations.push({id:item.id,source:item.source,zh});
    }catch(error){const reason=error.message==='quota'?'quota':'unavailable';if(reason==='quota')quota=true;translations.push({id:item.id,source:item.source,error:reason});}
  }
  if(translations.length) {
    const result=await site('/api/admin/translations',{items:translations});
    console.log(JSON.stringify({operation:'chinese-summaries',updated:result.updated,deferred:result.deferred}));
  }
  const feed=await site('/api/feed');
  if(feed.status?.source!=='github'||Date.now()-new Date(feed.status.updatedAt).getTime()>2*3600000||feed.editions[0]?.projects.length!==6||!feed.editions[0].projects.every(id=>Number.isFinite(feed.projects[id]?.stars)))throw new Error('Persisted readback is stale or incomplete');
  const summariesPending=feed.editions[0].projects.filter(id=>{const p=feed.projects[id];return p.copySource==='github' && !isChinese(p.sourceDescription) && !(p.translation?.status==='ready' && p.translation.source===p.sourceDescription.slice(0,600));}).length;
  console.log(JSON.stringify({operation:'verified',source:feed.status.source,transport:feed.status.transport,updatedAt:feed.status.updatedAt,edition:feed.editions[0].id,count:6,requests:responses.length,chineseSummaries:summariesPending===0,summariesPending}));
} catch(error) {console.error(error.message);process.exitCode=1;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
