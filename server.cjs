const http=require('node:http');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {openDB}=require('./scripts/local-db.cjs');
(async()=>{
  fs.mkdirSync(path.join(__dirname,'.local'),{recursive:true});
  const env={DB:openDB(process.env.STROLL_LOCAL_DB||path.join(__dirname,'.local/data.sqlite')),GITHUB_TOKEN:process.env.GITHUB_TOKEN,UPDATE_TOKEN:process.env.UPDATE_TOKEN};
  const {default:worker}=await import(pathToFileURL(path.join(__dirname,'dist/server/index.js')).href);
  const port=Number(process.env.PORT||4173);
  http.createServer(async(req,res)=>{
    try{
      const chunks=[];for await(const c of req)chunks.push(c);
      const options={method:req.method,headers:req.headers};
      if(!['GET','HEAD'].includes(req.method))options.body=Buffer.concat(chunks);
      const request=new Request('http://127.0.0.1:'+port+req.url,options);
      const result=await worker.fetch(request,env);
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
    }catch{res.writeHead(500);res.end('Local server error');}
  }).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
})();
