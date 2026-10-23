import {notebookURL} from './configuration.js';
const $ = id => document.getElementById(id);
const report = text => $('status').textContent = text;
function folderID(value) { const u=new URL(value); if(u.protocol!=='https:' || u.hostname!=='drive.google.com') throw Error('Use um link de pasta do Google Drive.'); const id=u.pathname.match(/\/folders\/([\w-]+)/)?.[1]; if(!id) throw Error('Link de pasta inválido.'); return id; }
async function render() {
  const {localPrompts=[],drivePrompts=[]}=await chrome.storage.local.get(['localPrompts','drivePrompts']);
  $('prompts').replaceChildren();
  for(const p of [...localPrompts,...drivePrompts]) { const li=document.createElement('li'); li.textContent=p.title+(p.source==='drive'?' (Drive)':' (local)'); if(p.source!=='drive'){ const b=document.createElement('button');b.textContent='Excluir';b.className='secondary';b.onclick=async()=>{await chrome.storage.local.set({localPrompts:localPrompts.filter(x=>x.id!==p.id)});render();};li.append(b);} $('prompts').append(li); }
}
async function save() {
  let notebook=$('notebook').value.trim();
  if(notebook)notebook=notebookURL(notebook);
  if($('folder').value.trim()) folderID($('folder').value.trim());
  await chrome.storage.local.set({notebook,replaceSources:$('replaceSources').checked,folder:$('folder').value.trim(),apiKey:$('apiKey').value.trim()});
}
for(const id of ['save','sync','drive','add']) $(id).onclick=async()=>{ try {
  if(id==='save'){await save();report('Configurações salvas às '+new Date().toLocaleTimeString()+'.');}
  if(id==='drive'){folderID($('folder').value);await chrome.tabs.create({url:$('folder').value});}
  if(id==='add'){if(!$('title').value.trim()||!$('body').value.trim())throw Error('Preencha título e texto.');const {localPrompts=[]}=await chrome.storage.local.get('localPrompts');localPrompts.push({id:crypto.randomUUID(),title:$('title').value.trim(),body:$('body').value,source:'local'});await chrome.storage.local.set({localPrompts});$('title').value='';$('body').value='';await render();report('Prompt salvo.');}
  if(id==='sync'){
    await save();const folder=folderID($('folder').value),key=$('apiKey').value.trim();if(!key)throw Error('Informe a chave da API do Drive.');report('Buscando prompts…');$('sync').disabled=true;
    const request=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Drive respondeu ${r.status}. Verifique acesso público e chave da API.`);return r;};
    let files=[],page='';do{const q=new URLSearchParams({key,q:`'${folder}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType,size)',pageSize:'100'});if(page)q.set('pageToken',page);const data=await(await request('https://www.googleapis.com/drive/v3/files?'+q)).json();files.push(...data.files);page=data.nextPageToken;}while(page);
    files=files.filter(f=>/\.(txt|md)$/i.test(f.name));if(!files.length)throw Error('Nenhum .txt ou .md encontrado. A biblioteca anterior foi mantida.');
    const prompts=[];for(const f of files){if(Number(f.size)>1000000)throw Error(`Prompt muito grande: ${f.name}`);const body=await(await request(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?alt=media&key=${encodeURIComponent(key)}`)).text();if(body.length>1000000)throw Error('Limite de tamanho excedido.');prompts.push({id:f.id,title:f.name.replace(/\.(txt|md)$/i,''),body,source:'drive'});}
    await chrome.storage.local.set({drivePrompts:prompts,lastSync:new Date().toISOString()});await render();report(`${prompts.length} prompts atualizados. Os textos anteriores do Drive foram substituídos.`);
  }
}catch(e){report(e.message);}finally{$('sync').disabled=false;}};
const settings=await chrome.storage.local.get(['notebook','folder','apiKey','replaceSources']);$('replaceSources').checked=settings.replaceSources===true;for(const id of ['notebook','folder','apiKey'])$(id).value=settings[id]||'';await render();
$('downloads').onclick=()=>chrome.downloads.showDefaultFolder();
async function showFlow(){const {flowStatus,flowUpdated}=await chrome.storage.local.get(['flowStatus','flowUpdated']);$('flow-status').textContent=flowStatus?(flowUpdated?new Date(flowUpdated).toLocaleTimeString()+' — ':'')+flowStatus:'Nenhum andamento registrado.';}
await showFlow();
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local'&&(changes.flowStatus||changes.flowUpdated))showFlow();});

$('resetPosition').onclick=async()=>{await chrome.storage.local.remove('launcherPosition');report('Posição do botão restaurada.');};

$('setupWizard').onclick=async()=>{try{const result=await chrome.runtime.sendMessage({type:'OPEN_SETUP'});if(result?.error)throw Error(result.error);}catch(error){report(error.message);}};
chrome.runtime.sendMessage({type:'CHECK_SETUP'}).catch(error=>report(error.message));
