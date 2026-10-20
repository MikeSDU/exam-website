importScripts('vendor/sql-wasm.js','core.js');
let engine;
self.onmessage=async({data})=>{
 let db;try{
  const sql=data.query.trim();if(!/^(SELECT|WITH)\b/i.test(sql))throw Error('Use one read-only SELECT or WITH query.');
  engine ||= initSqlJs({locateFile:f=>'vendor/'+f});const SQL=await engine;
  const response=await fetch(data.path);if(!response.ok)throw Error('The database could not be loaded.');db=new SQL.Database(new Uint8Array(await response.arrayBuffer()));db.run('PRAGMA query_only=ON;');
  let count=0;for(const statement of db.iterateStatements(sql)){count++;statement.free();}if(count!==1)throw Error('Submit exactly one SQL statement.');
  const actual=db.exec(sql),reference=db.exec(data.reference);
  const rows=actual[0]?.values||[],expected=reference[0]?.values||[];
  self.postMessage({ok:true,match:ExamCore.compare(rows,expected,data.ordered),rowCount:rows.length,columns:actual[0]?.columns||[],preview:rows.slice(0,8)});
 }catch(e){self.postMessage({ok:false,error:e.message});}finally{db?.close();}
};
