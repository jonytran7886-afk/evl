import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,extname,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';

// Browser smoke test using an installed Edge; no additional packages required.
const browserPath=process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const root=resolve(process.cwd()),profile=resolve(tmpdir(),'evl-prototype-qa-'+Date.now());
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+decodeURIComponent(name==='/'?'/prototype.html':name));if(!file.startsWith(root+'\\')&&!file.startsWith(root+'/')){res.writeHead(403).end();return;}const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/prototype.html`)).status,200,'Preview server returns the prototype');
await mkdir(profile,{recursive:true});
const browser=spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
browser.stderr.on('data',chunk=>process.stderr.write(chunk));
let socket;let count=0;const pending=new Map();const errors=[];
try{
 let port;
 for(let i=0;i<100;i++){try{port=Number((await readFile(resolve(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert.ok(port,'Edge remote debugger started');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++count;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}console.error(await evaluate('document.body.innerText.slice(0,1000)'),JSON.stringify(errors));throw new Error('Timeout: '+expression);};
 await call('Runtime.enable');await call('Page.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/prototype.html`});await wait('document.querySelectorAll("nav a").length===16');
 assert.equal(await evaluate('window.featureModules.flatMap(m=>m.features).length'),208);
 for(let i=1;i<=16;i++){
  const id=String(i).padStart(2,'0');await evaluate(`location.hash='${id}'`);await wait(`document.querySelector('nav a.active').getAttribute('href')==='#${id}'`);
  assert.ok(await evaluate('document.querySelector("h1").textContent.length>0'));
  await evaluate('document.querySelector("[data-action=scope]").click()');assert.equal(await evaluate('document.querySelectorAll("[data-feature]").length'),await evaluate(`window.featureModules.find(m=>m.id==='${id}').features.length`));await evaluate('document.querySelector("[data-feature]").click()');assert.equal(await evaluate('document.querySelector("dialog").open'),true);await evaluate('document.querySelector("[data-action=close]").click()');
  await evaluate('document.querySelector("[data-tab=\\"0\\"]").click()');assert.equal(await evaluate('document.querySelectorAll("[data-feature]").length'),0);
 }
 await evaluate("location.hash='02'");await wait("document.querySelector('nav a.active').getAttribute('href')==='#02'");
 await evaluate('document.querySelector("[data-action=primary]").click()');
 await evaluate(`document.querySelector('[name=f0]').value='QA khách hàng';document.querySelector('[name=f1]').value='QA liên hệ';document.querySelector('[name=f2]').value='QA phụ trách';document.querySelector('#record-form').requestSubmit()`);
 assert.ok(await evaluate('document.querySelector("tbody").textContent.includes("QA khách hàng")'));
 await evaluate(`const search=document.querySelector('#record-search');search.value='QA khách hàng';search.dispatchEvent(new Event('input',{bubbles:true}))`);
 assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'),1);
 await evaluate('document.querySelector("[data-record]").click();document.querySelector("[data-edit]").click();document.querySelector("[name=f0]").value="QA đã sửa";document.querySelector("#record-form").requestSubmit()');
 await evaluate(`document.querySelector('#record-search').value='';document.querySelector('#record-search').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert.ok(await evaluate('document.querySelector("tbody").textContent.includes("QA đã sửa")'));
 await call('Page.reload');await wait('document.querySelector("tbody")?.textContent.includes("QA đã sửa")');
 await evaluate('document.querySelector("[data-record]").click();document.querySelector("[data-delete]").click();document.querySelector("[data-confirm-delete]").click()');
 assert.equal(await evaluate('document.querySelector("tbody").textContent.includes("QA đã sửa")'),false);
 await evaluate("location.hash='09'");await wait('!!document.querySelector("[data-action=checkin]")');
 await evaluate('document.querySelector("[data-action=checkin]").click();document.querySelectorAll("[data-check]").forEach(x=>x.click())');
 assert.equal(await evaluate('document.querySelector("[data-action=checkout]").disabled'),false);
 await evaluate('document.querySelector("[data-action=checkout]").click()');assert.ok(await evaluate('document.querySelector("[data-action=checkout]").textContent.includes("Đã hoàn tất")'));
 await evaluate("location.hash='06'");await wait('!!document.querySelector(".calendar")');
 assert.equal(await evaluate('document.querySelectorAll(".event").length'),4);
 await evaluate('document.querySelector("[data-month=\\"1\\"]").click()');assert.ok(await evaluate('document.querySelector(".month-title").textContent.includes("11" )'));
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const id of ['01','02','03','06','09','16']){await evaluate(`location.hash='${id}'`);await wait(`document.querySelector('nav a.active').getAttribute('href')==='#${id}'`);assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),`No horizontal page overflow: ${id}`);}
 await evaluate('document.querySelector("#menu").click()');assert.equal(await evaluate('document.body.classList.contains("menu-open")'),true);
 assert.equal(errors.length,0,JSON.stringify(errors));
 if(process.env.CAPTURE_PREVIEW==='1'){
  await mkdir(resolve(root,'preview'),{recursive:true});
  for(const [name,width,height,id] of [['desktop',1440,1100,'01'],['mobile',390,844,'09']]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   await evaluate(`location.hash='${id}'`);await wait(`document.querySelector('nav a.active').getAttribute('href')==='#${id}'`);
   await evaluate('document.querySelector("#toast").style.display="none"');
   await new Promise(r=>setTimeout(r,100));
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   await writeFile(resolve(root,'preview',name+'.png'),Buffer.from(shot.data,'base64'));
  }
 }
 console.log('PASS: 16 module routes, 208 feature mappings, feature dialogs, create/edit/delete, search, persistence, field checklist, calendar, mobile overflow and menu; no runtime exceptions.');
 await call('Browser.close').catch(()=>{});
}finally{socket?.close();browser.kill();server.close();assert.equal(dirname(profile),resolve(tmpdir()));assert.ok(basename(profile).startsWith('evl-prototype-qa-'));for(let i=0;i<20;i++){try{await rm(profile,{recursive:true,force:true});break;}catch{await new Promise(r=>setTimeout(r,100));}}}
