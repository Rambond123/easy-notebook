import {notebookURL} from './configuration.js';
import {setupGaiaOptions} from './gaia-options.js';
const $=id=>document.getElementById(id),report=text=>$('status').textContent=text;
const guideURL='https://rambond123.github.io/easy-notebook/?v='+(chrome.runtime.getManifest?.().version||'atual');
async function render(){
  const saved=await chrome.storage.local.get(['localPrompts','gaiaPrompts','drivePrompts']);$('prompts').replaceChildren();
  for(const [key,label] of [['localPrompts','local'],['gaiaPrompts','Gaia'],['drivePrompts','Drive — importação anterior']])for(const prompt of saved[key]||[]){
    const li=document.createElement('li'),title=document.createElement('span'),remove=document.createElement('button');title.textContent=prompt.title+' ('+label+')';remove.textContent='Remover da extensão';remove.className='secondary';
    remove.onclick=async()=>{try{const latest=await chrome.storage.local.get(key);await chrome.storage.local.set({[key]:(latest[key]||[]).filter(p=>p.id!==prompt.id)});await render();report('Prompt removido apenas da extensão.');}catch(error){report(error.message);}};
    li.append(title,remove);$('prompts').append(li);
  }
}
async function save(){let notebook=$('notebook').value.trim();if(notebook)notebook=notebookURL(notebook);await chrome.storage.local.set({notebook,replaceSources:$('replaceSources').checked});}
for(const id of ['save','add'])$(id).onclick=async()=>{try{
  if(id==='save'){await save();report('Configurações salvas às '+new Date().toLocaleTimeString()+'.');}
  if(id==='add'){if(!$('title').value.trim()||!$('body').value.trim())throw Error('Preencha título e texto.');const {localPrompts=[]}=await chrome.storage.local.get('localPrompts');localPrompts.push({id:crypto.randomUUID(),title:$('title').value.trim(),body:$('body').value,source:'local'});await chrome.storage.local.set({localPrompts});$('title').value='';$('body').value='';await render();report('Prompt salvo.');}
}catch(error){report(error.message);}};
const settings=await chrome.storage.local.get(['notebook','replaceSources']);$('notebook').value=settings.notebook||'';$('replaceSources').checked=settings.replaceSources===true;
await render();await setupGaiaOptions(render);
$('downloads').onclick=()=>chrome.downloads.showDefaultFolder();
$('guide').href=guideURL;
$('shareGuide').onclick=async()=>{try{
  if(typeof navigator.share==='function'){await navigator.share({title:'Easy Notebook',text:'Instale a extensão Easy Notebook pelo guia atualizado.',url:guideURL});report('Janela de compartilhamento aberta.');return;}
  await navigator.clipboard.writeText(guideURL);report('Link do guia copiado. Agora você pode colar e enviar aos colegas.');
}catch(error){
  if(error?.name==='AbortError'){report('Compartilhamento cancelado.');return;}
  report('Use este link para compartilhar: '+guideURL);
}};
async function showFlow(){const {flowStatus,flowUpdated}=await chrome.storage.local.get(['flowStatus','flowUpdated']);$('flow-status').textContent=flowStatus?(flowUpdated?new Date(flowUpdated).toLocaleTimeString()+' — ':'')+flowStatus:'Nenhum andamento registrado.';}
await showFlow();
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local'&&(changes.flowStatus||changes.flowUpdated))showFlow();});
$('resetPosition').onclick=async()=>{await chrome.storage.local.remove('launcherPosition');report('Posição do botão restaurada.');};
$('setupWizard').onclick=async()=>{try{const result=await chrome.runtime.sendMessage({type:'OPEN_SETUP'});if(result?.error)throw Error(result.error);}catch(error){report(error.message);}};
chrome.runtime.sendMessage({type:'CHECK_SETUP'}).catch(error=>report(error.message));
