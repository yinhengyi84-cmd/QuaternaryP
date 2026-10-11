import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

// 只服务已构建的网页目录，不暴露原始文档、缓存或系统文件。
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=5173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const cache=new Map();
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    // 重新构建网页后自动刷新文件缓存，浏览器刷新即可看到新版。
    const stat=await fs.stat(file);
    if(cache.get(file)?.mtimeMs!==stat.mtimeMs){const body=await fs.readFile(file);cache.set(file,{mtimeMs:stat.mtimeMs,body,gzip:body.length>1000?gzipSync(body):null});}
    const stored=cache.get(file);const compressed=stored.gzip&&req.headers['accept-encoding']?.includes('gzip');
    const body=compressed?stored.gzip:stored.body;
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-cache','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff',...(compressed?{'Content-Encoding':'gzip'}:{})});res.end(req.method==='HEAD'?undefined:body);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'5173 端口已使用。请先关闭已有地图启动窗口。':error.message);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>{
  console.log(`\n极北铁幕地图\n  电脑访问：http://localhost:${port}/`);
  for(const addresses of Object.values(os.networkInterfaces()))for(const address of addresses||[]){if(address.family==='IPv4'&&!address.internal)console.log(`  手机访问：http://${address.address}:${port}/`);}
  console.log('\n手机与电脑连接同一 Wi-Fi；保持本窗口打开，Ctrl+C 停止。\n');
});
