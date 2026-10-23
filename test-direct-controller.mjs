import assert from 'node:assert/strict';
import {directUpload} from './direct-upload-controller.js';
const session={},local={},deleted=[],calls=[];let ready=false,failRegistration=false,visible=false;
globalThis.indexedDB={open(){const r={};queueMicrotask(()=>{r.result={close(){},transaction(){const t={};t.objectStore=()=>({delete(id){deleted.push(id);const request={};queueMicrotask(()=>t.oncomplete());return request;}});return t;}};r.onsuccess();});return r;}};
globalThis.chrome={storage:{session:{async get(k){return {[k]:session[k]};},async set(d){Object.assign(session,d);},async remove(keys){for(const key of keys)delete session[key];}},local:{async get(k){return {[k]:local[k]};},async set(d){Object.assign(local,d);}}},scripting:{async executeScript({args:[r]}){calls.push(r);let result={ok:true};if(r.action==='prepare')result={ok:true,received:0,index:0};if(r.action==='check')result={ok:true,previousIds:['old']};if(r.action==='register'){visible=true;if(failRegistration)throw Error('Resposta perdida');result={ok:true,sourceId:'new-source'};}if(r.action==='status')result={ok:true,found:visible,sourceId:visible?'new-source':undefined,ready,status:ready?2:1};return [{result}];}},tabs:{async update(){}}};
const file={name:'50190354820254047108_abc.pdf',blob:new Blob(['%PDF-1.7\n'])},sender={tab:{id:17}},configured='https://notebook.google.com/notebook/example?authuser=1';
const call=(type,id='file')=>directUpload({type},sender,file,id,configured);
assert.equal((await call('DIRECT_UPLOAD_START')).name,'50190354820254047108 - integral.pdf');
await assert.rejects(call('DIRECT_UPLOAD_DONE'),/ainda não foi enviado/);assert.equal(deleted.length,0);
await call('DIRECT_UPLOAD_FINISH');assert.equal(session['directUpload:file'].phase,'processing');
await call('DIRECT_UPLOAD_FINISH');assert.equal(calls.filter(c=>c.action==='register').length,1);
await assert.rejects(call('DIRECT_UPLOAD_DONE'),/ainda não confirmou/);assert.equal(deleted.length,0);
ready=true;await call('DIRECT_UPLOAD_DONE');assert.deepEqual(deleted,['file']);assert(local.lastUploadResult.ready);assert.equal(local.lastUploadResult.notebookPath,'/notebook/example');assert.equal(session['directUpload:file'],undefined);
assert(calls.every(r=>r.account==='1'));
// An uncertain registration is reconciled by a read, then reuses its source ID.
ready=false;visible=false;failRegistration=true;await call('DIRECT_UPLOAD_START','recover');await assert.rejects(call('DIRECT_UPLOAD_FINISH','recover'),/Resposta perdida/);
assert.equal(session['directUpload:recover'].phase,'registering');const registrations=calls.filter(c=>c.action==='register').length;
await call('DIRECT_UPLOAD_START','recover');failRegistration=false;await call('DIRECT_UPLOAD_FINISH','recover');
assert.equal(calls.filter(c=>c.action==='register').length,registrations);assert.equal(session['directUpload:recover'].sourceId,'new-source');
console.log('Controle: confirmação antes de descartar, conta preservada, sem repetição da criação e recuperação de resposta incerta pelo identificador.');

// Cleanup is opt-in; mutations follow PDF validation, with persisted recovery.
local.replaceSources=true;let sourceList=[{id:'old'}],failDelete=true;
const originalExecute=chrome.scripting.executeScript;
chrome.scripting.executeScript=async payload=>{
  const r=payload.args[0];
  if(r.action==='list'){calls.push(r);return [{result:{ok:true,sources:sourceList}}];}
  if(r.action==='remove-source'){calls.push(r);if(failDelete)throw Error('Exclusão não confirmada');sourceList=sourceList.filter(s=>s.id!==r.removeId);return [{result:{ok:true}}];}
  return originalExecute(payload);
};
await call('DIRECT_UPLOAD_START','clean');const before=calls.length;
await assert.rejects(call('DIRECT_UPLOAD_FINISH','clean'),/Exclusão não confirmada/);
assert.equal(session['directUpload:clean'].phase,'cleaning');
assert.equal(calls.slice(before).some(c=>c.action==='register'||c.action==='send'),false);
failDelete=false;await call('DIRECT_UPLOAD_START','clean');await call('DIRECT_UPLOAD_FINISH','clean');
assert.equal(session['directUpload:clean'].cleanupComplete,true);
const actions=calls.slice(before).map(c=>c.action);assert(actions.indexOf('check')<actions.indexOf('remove-source'));assert(actions.lastIndexOf('remove-source')<actions.indexOf('register'));
// Concurrent sources outside the snapshot are preserved.
sourceList=[{id:'old'},{id:'concurrent'}];await call('DIRECT_UPLOAD_START','concurrent');const start=calls.length;
await assert.rejects(call('DIRECT_UPLOAD_FINISH','concurrent'),/fonte nova/);
assert.equal(calls.slice(start).some(c=>c.action==='remove-source'||c.action==='register'),false);
console.log('Limpeza: valida PDF antes de excluir, interrompe falhas, retoma sem novo registro e preserva fontes concorrentes.');
