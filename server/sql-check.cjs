'use strict';
// Isolate student SQL so expensive queries can be terminated without blocking HTTP.
const {parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs'),path=require('node:path');
const {compare}=require('../dist/core.js');
(async()=>{let db;try{
 const query=workerData.query.trim();if(!/^(SELECT|WITH)\b/i.test(query))throw Error('Use one read-only SELECT or WITH query.');
 const SQL=await require('../dist/vendor/sql-wasm.js')({locateFile:f=>path.join(__dirname,'../dist/vendor',f)});
 db=new SQL.Database(fs.readFileSync(workerData.database));db.run('PRAGMA query_only=ON;');
 let count=0;for(const stmt of db.iterateStatements(query)){count++;stmt.free();}if(count!==1)throw Error('Submit exactly one SQL statement.');
 const result=db.exec(query)[0]?.values||[],reference=db.exec(workerData.reference)[0]?.values||[];
 parentPort.postMessage({ok:true,match:compare(result,reference,workerData.ordered),rowCount:result.length});
 }catch{parentPort.postMessage({ok:false,error:'The SQL query could not be executed as a single read-only query.'});}finally{db?.close();}
})().catch(()=>parentPort.postMessage({ok:false,error:'SQL verification was unavailable.'}));
