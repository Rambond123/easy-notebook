import {fileOperation} from './db.js';
const $=id=>document.getElementById(id);let captured;
const settings=await chrome.storage.local.get('notebook');$('destination').textContent='Destino: '+(settings.notebook||'não configurado; abra a configuração da extensão.');
const {captureURL}=await chrome.storage.session.get('captureURL');$('capture').disabled=!captureURL;
async function savePDF(file){
  $('status').textContent='Salvando o PDF completo em Downloads…';
  // Preserve the server's filename and use the browser's default directory.
  // HTTP downloads made by this API include the current session cookies.
  const objectURL=captureURL?null:URL.createObjectURL(file);
  try{
    const id=await chrome.downloads.download({url:captureURL||objectURL,saveAs:false,conflictAction:'uniquify'});
    const deadline=Date.now()+90000;
    while(Date.now()<deadline){const [item]=await chrome.downloads.search({id});if(item?.state==='complete')return;if(item?.state==='interrupted')throw Error('O navegador interrompeu o salvamento do PDF.');await new Promise(r=>setTimeout(r,500));}
    throw Error('O salvamento não foi confirmado em 90 segundos. Confira os downloads do Chrome.');
  }finally{if(objectURL)URL.revokeObjectURL(objectURL);}
}
async function validate(blob){if(blob.size>200*1024*1024)throw Error('Este protótipo aceita PDFs de até 200 MB.');if(!blob.size || !new TextDecoder().decode(await blob.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('A resposta não é um PDF válido. A sessão do eproc pode ter expirado.');}
async function send(file){await validate(file);if(!settings.notebook)throw Error('Configure primeiro o notebook de destino.');const id=crypto.randomUUID();await fileOperation('readwrite',s=>s.clear());await fileOperation('readwrite',s=>s.put({name:file.name||'processo.pdf',blob:file},id));const result=await chrome.runtime.sendMessage({type:'OPEN_NOTEBOOK',id});if(result.error)throw Error(result.error);$('status').textContent='PDF preparado. No notebook, a extensão tentará anexar o arquivo. Confira o processamento na lista de fontes.';}
async function run(fn){for(const id of ['send','capture'])$(id).disabled=true;try{await fn();}catch(e){$('status').textContent=e.message+' Você pode usar o PDF salvo no computador.';if(new URLSearchParams(location.search).get('automatic')==='1'){const tab=await chrome.tabs.getCurrent();if(tab)await chrome.tabs.update(tab.id,{active:true});}}finally{$('send').disabled=false;$('capture').disabled=!captureURL;}}
$('capture').onclick=()=>run(async()=>{$('status').textContent='Obtendo PDF do eproc…';const url=new URL(captureURL);if(url.protocol!=='https:'||!/^(?:eproc\.(?:trf4|jfrs|jfsc|jfpr)\.jus\.br|eprocv2-consulta-(?:rs|sc|pr)\.trf4\.jus\.br)$/.test(url.hostname)||url.searchParams.get('acao')!=='download_documento_unificado')throw Error('URL inválida.');const r=await fetch(url,{credentials:'include',signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(`Não foi possível obter o PDF (${r.status}).`);const blob=await r.blob();await validate(blob);captured=new File([blob],url.searchParams.get('arquivo')||'processo.pdf',{type:'application/pdf'});$('download').disabled=false;await savePDF(captured);await send(captured);});
$('send').onclick=()=>run(async()=>{const f=$('file').files[0];if(!f)throw Error('Selecione um PDF.');await send(f);});
$('download').onclick=()=>run(async()=>{if(!captured)throw Error('Capture primeiro o PDF.');await savePDF(captured);$('status').textContent='PDF salvo na pasta padrão de downloads do navegador.';});
if(new URLSearchParams(location.search).get('automatic')==='1'&&captureURL)$('capture').click();
