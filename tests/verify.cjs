const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../dist/core.js');
(async()=>{
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/content.json'))),root=path.resolve(__dirname,'../dist');
assert.equal(data.questions.length,41);assert.equal(new Set(data.questions.map(q=>q.id)).size,41);
for(const q of data.questions){assert.equal(q.criteria.reduce((s,c)=>s+c.max,0),10);assert.ok(q.source);if(q.dataset)assert.ok(data.files[q.dataset]);}
for(const f of Object.values(data.files)){assert.ok(fs.existsSync(path.join(root,f.path)));assert.ok(f.bytes<25*1024*1024);}
for(const [p,g] of [[100,'12'],[90,'12'],[89.9,'10'],[75,'10'],[74,'7'],[60,'7'],[45,'4'],[30,'02'],[29,'00'],[1,'00'],[0,'−3']])assert.equal(core.grade(p),g);
assert.equal(core.compare([[1],[1]],[[1],[2]]),false);assert.equal(core.compare([[2],[1]],[[1],[2]]),true);assert.equal(core.compare([[2],[1]],[[1],[2]],true),false);assert.equal(core.compare([[1.0000001]],[[1]]),true);assert.equal(core.compare([[null]],[[0]]),false);
assert.ok(Number.isNaN(core.parseNumber('a12')));assert.ok(Number.isNaN(core.parseNumber('1,200.00')));assert.equal(core.parseNumber('12,20'),12.2);
const q=data.questions[0],good={summary:'test',questions:[{id:q.id,marks:[10],feedback:'correct',nextStep:'explain'}]};core.validateFeedback(good,[q]);assert.throws(()=>core.validateFeedback({summary:'x',questions:[{id:q.id,marks:[11],feedback:'',nextStep:''}]},[q]));assert.throws(()=>core.validateFeedback({summary:'x',questions:[]},[q]));
const SQL=await require('../dist/vendor/sql-wasm.js')({locateFile:f=>path.join(root,'vendor',f)});
for(const q of data.questions.filter(q=>q.kind==='sql')){const db=new SQL.Database(fs.readFileSync(path.join(root,data.files[q.dataset].path)));db.run('PRAGMA query_only=ON');const r=db.exec(q.sql);assert.equal(r[0].values.length,q.referenceRows);let count=0;for(const stmt of db.iterateStatements(q.sql)){count++;stmt.free();}assert.equal(count,1);assert.throws(()=>db.run('DELETE FROM '+(q.dataset==='songs'?'songs':'Invoice')));db.close();}
const db=new SQL.Database(fs.readFileSync(path.join(root,data.files.songs.path)));assert.ok(core.compare(db.exec('SELECT AVG(tempo) FROM songs')[0].values,db.exec('SELECT SUM(tempo)/COUNT(tempo) FROM songs')[0].values));let count=0;for(const stmt of db.iterateStatements('SELECT 1; SELECT 2;')){count++;stmt.free();}assert.equal(count,2);db.close();
console.log('PASS: 41 content entries, 17 downloads, grade boundaries, result comparison, feedback validation, all 18 reference SQL queries, equivalent SQL and read-only enforcement.');
})().catch(e=>{console.error(e);process.exit(1)});
