import assert from 'node:assert/strict';
await import('./notebook-direct-upload.js');
const notebook='test-notebook',sourceId='12345678-1234-1234-1234-123456789abc';
globalThis.window={};globalThis.location={hostname:'notebook.google.com',protocol:'https:',origin:'https://notebook.google.com',pathname:'/notebook/'+notebook,href:'https://notebook.google.com/notebook/'+notebook+'?authuser=1'};
globalThis.document={documentElement:{innerHTML:'<script>{"SNlM0e":"test-csrf","FdrFJe":"test-session"}</script>'}};
const bytes=new Uint8Array(700000);bytes.set(new TextEncoder().encode('%PDF-1.7\n'));
let registered=0,uploaded=0,ready=false,external=false,removed=false;const requests=[];
globalThis.fetch=async(url,request)=>{
  requests.push({url,request});
  if(url.startsWith('/_/')){
    const method=new URL(url,location.origin).searchParams.get('rpcids');
    assert.equal(new URL(url,location.origin).searchParams.get('authuser'),'1');
    assert.equal(request.credentials,'include');
    let result;
    if(method==='rLM1Ne')result=[['Notebook',registered&&!removed?[[[sourceId],'processo.pdf',null,[null,ready?2:1]]]:null]];
    else if(method==='tGMBJ'){assert.deepEqual(JSON.parse(JSON.parse(request.body.get('f.req'))[0][0][1]),[[[sourceId]]]);removed=true;result=null;}
    else {assert.equal(method,'o4cbdc');registered++;result=[[[sourceId]]];}
    return {ok:true,status:200,text:async()=>")]}'\n\n100\n"+JSON.stringify([['wrb.fr',method,JSON.stringify(result)]])};
  }
  assert.equal(request.headers['x-goog-authuser'],'1');
  if(request.headers['x-goog-upload-command']==='start')return {ok:true,status:200,headers:{get:()=>external?'https://other.example/upload/data':'https://notebook.google.com/upload/test-session'}};
  assert.equal(url,'https://notebook.google.com/upload/test-session');
  assert.deepEqual(new Uint8Array(await request.body.arrayBuffer()),bytes);uploaded++;ready=true;
  return {ok:true,status:200};
};
const base={notebookPath:location.pathname,account:'1',token:'job',name:'processo.pdf',size:bytes.length};
const call=(action,extra={})=>globalThis.easyNotebookDirectUpload({...base,action,...extra});
assert.equal((await call('prepare')).received,0);
assert.equal((await call('chunk',{index:1,base64:'AA=='})).ok,false);
for(let offset=0,index=0;offset<bytes.length;offset+=524288,index++)assert((await call('chunk',{index,base64:Buffer.from(bytes.subarray(offset,offset+524288)).toString('base64')})).ok);
assert.deepEqual((await call('check')).previousIds,[],'Notebook vazio deve ser aceito.');
assert.equal((await call('register')).sourceId,sourceId);
assert.equal((await call('register')).ok,false,'Não deve repetir o registro.');
assert((await call('send',{sourceId})).ok);assert.equal(uploaded,1);assert.equal(registered,1);
assert.equal((await call('send',{sourceId})).ok,false,'Não deve repetir o upload.');
assert.equal((await call('status',{sourceId})).ready,true);
assert.equal((await globalThis.easyNotebookDirectUpload({...base,account:'0',action:'status',sourceId})).ok,false);
// A new transfer must reject an upload URL outside the Notebook origin.
await call('release');base.token='other';await call('prepare');
for(let offset=0,index=0;offset<bytes.length;offset+=524288,index++)await call('chunk',{index,base64:Buffer.from(bytes.subarray(offset,offset+524288)).toString('base64')});
external=true;assert.equal((await call('send',{sourceId})).ok,false);assert.equal(uploaded,1);
assert.equal(requests.some(r=>r.url.includes('other.example')),false);
console.log('Upload direto: conta correta, PDF em blocos íntegros, notebook vazio, registro e envio únicos, confirmação de fonte pronta e rejeição de destino externo.');

assert.equal((await call('remove-source',{removeId:sourceId,allowedIds:[sourceId]})).ok,false,'Unvalidated transfer must never delete sources.');
await call('check');
assert.equal((await call('remove-source',{removeId:sourceId,allowedIds:[]})).ok,false);
assert.equal((await call('remove-source',{removeId:sourceId,allowedIds:[sourceId]})).ok,true);
assert.equal((await call('list')).sources.length,0);
const deletionCalls=requests.filter(r=>r.url.includes('rpcids=tGMBJ')).length;
assert.equal((await call('remove-source',{removeId:sourceId,allowedIds:[sourceId]})).ok,true);
assert.equal(requests.filter(r=>r.url.includes('rpcids=tGMBJ')).length,deletionCalls,'Already absent source must not repeat mutation.');
console.log('Exclusão: payload, resposta nula, confirmação por listagem e retomada idempotente aprovadas.');
