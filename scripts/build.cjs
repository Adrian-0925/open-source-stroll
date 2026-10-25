const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const assets={};
for(const entry of fs.readdirSync(path.join(root,'public'),{withFileTypes:true})){
  if(!entry.isFile())continue;
  assets['/'+entry.name]={body:fs.readFileSync(path.join(root,'public',entry.name),'utf8'),type:types[path.extname(entry.name)]||'text/plain; charset=utf-8'};
}
const context={window:{}};
vm.runInNewContext(assets['/content.js'].body,context);
const source=fs.readFileSync(path.join(root,'worker/index.mjs'),'utf8').replace('/*__ASSETS__*/ {}',JSON.stringify(assets)).replace('/*__SEED__*/ { editions: [], projects: {} }',JSON.stringify(context.window.STROLL_CONTENT));
fs.mkdirSync(path.join(root,'dist/server'),{recursive:true});
fs.mkdirSync(path.join(root,'dist/.openai'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/server/index.js'),source);
fs.copyFileSync(path.join(root,'.openai/hosting.json'),path.join(root,'dist/.openai/hosting.json'));
// Keep direct-file preview current; all runtime assets are also embedded in the Worker.
for(const name of Object.keys(assets))fs.copyFileSync(path.join(root,'public',name.slice(1)),path.join(root,'dist',name.slice(1)));
console.log('Built self-contained Worker and approved frontend assets.');
