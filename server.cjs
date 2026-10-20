'use strict';
const http=require('node:http'),fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path');
const {createGrader}=require('./server/grader.cjs');
const root=path.join(__dirname,'dist'),content=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.wasm':'application/wasm','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xlsm':'application/vnd.ms-excel.sheet.macroEnabled.12','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.csv':'text/csv; charset=utf-8','.db':'application/octet-stream','.sqlite':'application/octet-stream','.txt':'text/plain; charset=utf-8'};
function createApp(options={}){
 const grader=options.grader||createGrader({env:options.env||process.env,content,root});
 const json=(res,status,data,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
  let url;try{url=new URL(req.url,'http://localhost');}catch{return json(res,400,{error:{message:'Invalid request URL.'}});}
  try{
   if(url.pathname==='/healthz'&&req.method==='GET')return json(res,200,{ok:true});
   if(url.pathname==='/api/status'&&req.method==='GET')return json(res,200,grader.status());
   if(url.pathname==='/api/grade'&&req.method==='POST'){
    // Browsers must post JSON from this same service, not an unrelated website.
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:{message:'Use application/json.'}});
    if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return json(res,403,{error:{message:'Origin not allowed.'}});}if(origin.host!==req.headers.host)return json(res,403,{error:{message:'Origin not allowed.'}});}
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>40000)return json(res,413,{error:{message:'Attempt is too large. Shorten your answers.'}});chunks.push(chunk);}let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return json(res,400,{error:{message:'Invalid JSON.'}});}
    return json(res,202,grader.enqueue(payload));
   }
   const match=url.pathname.match(/^\/api\/grade\/([a-f0-9-]{36})$/);
   if(match&&['GET','DELETE'].includes(req.method)){const token=String(req.headers['x-job-token']||'');return json(res,200,req.method==='DELETE'?grader.cancel(match[1],token):grader.get(match[1],token));}
   if(url.pathname.startsWith('/api/'))return json(res,404,{error:{message:'API route not found.'}});
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:{message:'Method not allowed.'}},{Allow:'GET, HEAD'});
   let name;try{name=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:{message:'Invalid path.'}});}
   if(name.split('/').some(p=>p.startsWith('.')||p.includes('\\')))return json(res,404,{error:{message:'Not found.'}});
   const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))return json(res,404,{error:{message:'Not found.'}});
   const stat=await fsp.stat(file).catch(()=>null);if(!stat?.isFile())return json(res,404,{error:{message:'Not found.'}});
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':/\.(html|js|json)$/.test(file)?'no-cache':'public, max-age=3600'});if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch(e){if(!res.headersSent)json(res,e.status||500,{error:{code:e.code||'server_error',message:e.status?e.message:'The service could not complete this request. Your answers are preserved.'}},e.retryAfter?{'Retry-After':String(e.retryAfter)}:{});else res.destroy();}
 });
 server.on('close',()=>grader.close());return {server,grader};
}
if(require.main===module){const {server}=createApp();const port=Number(process.env.PORT)||3000;server.listen(port,'0.0.0.0',()=>console.log(`Accounting Exam Lab listening on port ${port}.`));for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>server.close(()=>process.exit(0)));}
module.exports={createApp};
