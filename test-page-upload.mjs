import assert from 'node:assert/strict';
await import('./notebook-page-upload.js');
let nativePicker=0,submitted=null,created;
class Input{
  constructor(){this.type='file';this.name='Filedata';this.disabled=false;}
  click(){nativePicker++;}
  showPicker(){nativePicker++;}
  set files(value){this.received=value;}
  dispatchEvent(event){if(event.type==='change')submitted=this.received[0];}
}
globalThis.HTMLInputElement=Input;
globalThis.DataTransfer=class{constructor(){const files=[];this.files=files;this.items={add:file=>files.push(file)};}};
globalThis.window={};
const original=Input.prototype.click;
const trigger={textContent:'uploadEnviar arquivos',getAttribute:()=>null,getClientRects:()=>[{}],querySelectorAll:()=>[{textContent:'Enviar arquivos'}],click(){created=new Input();created.click();}};
globalThis.document={querySelectorAll:selector=>['input[type="file"]','[xapscottyuploaderdropzone]'].includes(selector)?[]:[trigger]};
const bytes=new TextEncoder().encode('%PDF-1.7\nTeste de arquivo temporário');
const invoke=request=>globalThis.easyNotebookPageUpload({token:'test',...request});
assert.equal((await invoke({action:'start',name:'teste.pdf',size:bytes.length})).ok,true);
assert.equal(nativePicker,0);assert.equal(Input.prototype.click,original);
assert.equal((await invoke({action:'chunk',index:0,base64:Buffer.from(bytes).toString('base64')})).ok,true);
assert.equal((await invoke({action:'finish'})).ok,true);
assert.equal(submitted.name,'teste.pdf');assert.deepEqual(new Uint8Array(await submitted.arrayBuffer()),bytes);
assert.equal(created.received.length,1);
assert.equal(window.__easyNotebookUploadV1,undefined);
assert.equal((await invoke({action:'start',name:'teste.pdf',size:bytes.length})).ok,true);
assert.equal((await invoke({action:'chunk',index:1,base64:'AA=='})).ok,false);
assert.equal(Input.prototype.click,original);
console.log('Upload na página: campo criado fora do DOM retido, seletor nativo não aberto, PDF íntegro recebido no evento change, métodos e memória restaurados. Teste simulado.');
globalThis.DragEvent=class extends Event{constructor(type,options){super(type,options);this.dataTransfer=options.dataTransfer;}};
const drops=[];
const zone={isConnected:true,getClientRects:()=>[{}],dispatchEvent(event){drops.push(event);}};
document.querySelectorAll=selector=>selector==='[xapscottyuploaderdropzone]'?[zone]:[];
assert.equal((await invoke({action:'start',name:'teste.pdf',size:bytes.length})).stage,'drop-ready');
await invoke({action:'chunk',index:0,base64:Buffer.from(bytes).toString('base64')});
assert.equal((await invoke({action:'finish'})).ok,true);
assert.deepEqual(drops.map(e=>e.type),['dragenter','dragover','drop']);
assert.equal(drops[2].dataTransfer.files[0].name,'teste.pdf');
assert.deepEqual(new Uint8Array(await drops[2].dataTransfer.files[0].arrayBuffer()),bytes);
assert.equal(nativePicker,0);
console.log('Soltura: área observada na página recebeu os três eventos com o PDF íntegro, sem input de arquivo ou seletor nativo. Teste simulado.');
