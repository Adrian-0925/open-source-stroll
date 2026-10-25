const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
exports.openDB=function(filename=':memory:') {
  const sqlite=new DatabaseSync(filename);
  sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  for(const name of fs.readdirSync(path.join(__dirname,'../drizzle')).filter(n=>n.endsWith('.sql')).sort()){
    if(sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))continue;
    sqlite.exec(fs.readFileSync(path.join(__dirname,'../drizzle',name),'utf8'));
    sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(name);
  }
  function prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const result=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}};}
  return {prepare,async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close(){sqlite.close();}};
};
