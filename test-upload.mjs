import assert from 'node:assert/strict';
await import('./notebook-upload.js');
for(const alreadyOpen of [false,true]){
  let modal=alreadyOpen,panel=alreadyOpen,input=null;const events=[];
  const control=(label,click,span=label)=>({textContent:label,getAttribute:()=>null,getClientRects:()=>[{}],querySelectorAll:()=>[{textContent:span}],click});
  const sources=control('Sources',()=>{panel=true;events.push('sources');});
  const add=control('Adicionar fonte',()=>{modal=true;events.push('add');});
  const trigger=control('uploadEnviar arquivos',()=>{events.push('upload');input={accept:'.pdf,.txt,.md',disabled:false};},'Enviar arquivos');
  globalThis.document={querySelectorAll:selector=>selector==='input[type="file"]'?(input?[input]:[]):selector==='button[xapscottyuploadertrigger]'?[]:modal?[trigger]:panel?[sources,add]:[sources]};
  const result=await globalThis.easyNotebookFindUploadInput({pause:async()=>{}});
  assert.equal(result,input);
  assert.deepEqual(events,alreadyOpen?['upload']:['sources','add','upload']);
}
console.log('Upload: modal já aberto e navegação Sources → Adicionar fonte → span Enviar arquivos aprovados; campo criado somente após o clique.');
