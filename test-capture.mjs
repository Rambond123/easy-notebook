import assert from 'node:assert/strict';
const records=new Map(),session={},events=[];let handler;
// Minimal transaction mock exercises the capture protocol; it is not a browser test.
globalThis.indexedDB={open(){const request={};queueMicrotask(()=>{request.result={close(){},transaction(){const tx={};const store={};for(const operation of ['get','put','delete'])store[operation]=(...args)=>{const item={};if(operation==='get')item.result=records.get(args[0]);if(operation==='put')records.set(args[1],args[0]);if(operation==='delete')records.delete(args[0]);queueMicrotask(()=>tx.oncomplete?.());return item;};tx.objectStore=()=>store;return tx;}};request.onsuccess();});return request;}};
globalThis.chrome={
  action:{onClicked:{addListener(){}}},runtime:{onInstalled:{addListener(){}},onStartup:{addListener(){}},getManifest:()=>({version:'0.18.0'}),getURL:path=>'chrome-extension://test/'+path,getContexts:async()=>[],async sendMessage(message){if(message.type==='CREATE_PDF_URL'){const file=records.get(message.id);return {url:'blob:chrome-extension://test/captured',name:file.name,size:file.blob.size};}return {ok:true};},onMessage:{addListener(fn){handler=fn;}}},
  offscreen:{async createDocument(){}},
  storage:{onChanged:{addListener(){}},session:{async get(keys){return Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,session[k]]));},async set(data){Object.assign(session,data);},async remove(keys){for(const key of Array.isArray(keys)?keys:[keys])delete session[key];}},local:{async get(){return {notebook:'https://notebook.google.com/notebook/test'};},async set(){}}},
  tabs:{async create(options){events.push(['tab',options]);return {id:50};},async update(id,options){events.push(['navigate',id,options]);}},
  downloads:{async download(options){events.push(['download',options]);return 1;},onChanged:{addListener(){},removeListener(){}},async search(){return [{state:'complete',filename:'Downloads/Easy Notebook/processo.pdf',fileSize:1200000}];}}
};
globalThis.location={origin:'https://eproc.jfrs.jus.br',href:'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=arvore_documento_listar'};
const bytes=new Uint8Array(1200000);bytes.set(new TextEncoder().encode('%PDF-1.7\n'));for(let i=20;i<bytes.length;i++)bytes[i]=i%251;
globalThis.fetch=async(url,options)=>{assert.equal(options.credentials,'include');return {ok:true,blob:async()=>new Blob([bytes])};};
await import('./background.js');await import('./eproc-capture.js');
const sender={tab:{id:9},url:location.href};
const rpc=message=>new Promise((resolve,reject)=>handler({...message,clientVersion:'0.18.0'},sender,result=>result.error?reject(Error(result.error)):resolve(result.value)));
await globalThis.easyNotebookCapturePDF('https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=download_documento_unificado&arquivo=processo.pdf',{rpc,report(){}});
assert.equal(session.pendingNotebookTab,50);
assert.equal(records.size,1,'Os blocos temporários devem ser removidos.');
const file=records.get(session.pendingFile);
assert.equal(file.name,'processo.pdf');assert.deepEqual(new Uint8Array(await file.blob.arrayBuffer()),bytes);
assert.equal(events.filter(e=>e[0]==='download').length,0,'O envio direto não deve baixar outra cópia do PDF.');
assert.equal(events.find(e=>e[0]==='navigate')[2].url,'https://notebook.google.com/notebook/test');
console.log('Captura: PDF em três blocos reconstruído byte a byte, temporários removidos, nenhum download e notebook novo preparado. Teste simulado.');


