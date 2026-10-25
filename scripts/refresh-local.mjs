import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { translateDescription } from '../public/update-cloud.mjs';
const require=createRequire(import.meta.url);
const {openDB}=require('./local-db.cjs');
const {refresh,translationQueue,saveTranslations}=await import('../dist/server/index.js');
mkdirSync('.local',{recursive:true});
const DB=openDB(process.env.STROLL_LOCAL_DB||'.local/data.sqlite');
try {
  const result=await refresh({DB,GITHUB_TOKEN:process.env.GITHUB_TOKEN});
  console.log(JSON.stringify({operation:'metadata',outcome:result.outcome,status:result.status}));
  const queue=await translationQueue({DB}),items=[];let quota=false;
  for(const item of queue.items){try{if(quota)throw new Error('quota');items.push({...item,zh:await translateDescription(item.source)});}catch(error){const reason=error.message==='quota'?'quota':'unavailable';if(reason==='quota')quota=true;items.push({...item,error:reason});}}
  if(items.length)console.log(JSON.stringify(await saveTranslations({DB},{items})));
  if(result.outcome==='deferred'||result.outcome==='backoff')process.exitCode=1;
} finally {DB.close();}
