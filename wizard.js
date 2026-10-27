import {notebookURL,starterPrompt} from './configuration.js';
const $=id=>document.getElementById(id),panels=[...document.querySelectorAll('[data-step]')],steps=[...document.querySelectorAll('#steps li')];
let step=0,saving=false,completed=false;
const stored=await chrome.storage.local.get(['notebook','replaceSources','promptSource','localPrompts','setupDraft']);
const draft=stored.setupDraft||{};
$('notebook').value=draft.notebook??stored.notebook??'';
document.querySelector(`[name="sources"][value="${(draft.replaceSources??stored.replaceSources)?'replace':'keep'}"]`).checked=true;
const initialMode=draft.mode||stored.promptSource||'local';document.querySelector(`[name="prompts"][value="${initialMode==='gaia'?'gaia':'local'}"]`).checked=true;
$('starter').checked=draft.starter??!(stored.localPrompts||[]).length;$('starter-preview').textContent=starterPrompt.body;
if(new URL(location.href).searchParams.get('reason')==='incomplete')$('welcome-note').textContent='Falta concluir uma informação essencial. Suas outras preferências foram mantidas.';
else if(stored.notebook)$('welcome-note').textContent='Suas escolhas atuais já estão preenchidas. Você pode revisá-las passo a passo.';
function mode(){return document.querySelector('[name="prompts"]:checked').value;}
function replaceSources(){return document.querySelector('[name="sources"]:checked').value==='replace';}
function showError(error){const text=error?.message||String(error);$('wizard-error').textContent=text;$('wizard-error').hidden=false;}
function clearError(){$('wizard-error').hidden=true;for(const el of document.querySelectorAll('[aria-invalid]'))el.removeAttribute('aria-invalid');}
function showPromptFields(){$('local-fields').hidden=mode()!=='local';$('gaia-fields').hidden=mode()!=='gaia';}
function validate(){
  if(step===1){try{notebookURL($('notebook').value);}catch(error){$('notebook').setAttribute('aria-invalid','true');$('notebook').focus();throw error;}}

}
async function saveDraft(){if(completed)return;await chrome.storage.local.set({setupDraft:{notebook:$('notebook').value,replaceSources:replaceSources(),mode:mode(),starter:$('starter').checked}});}
function render(){
  clearError();panels.forEach((panel,index)=>panel.hidden=index!==step);steps.forEach((item,index)=>{item.classList.toggle('complete',index<step);if(index===step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
  $('back').hidden=step===0;$('step-count').textContent=`Etapa ${step+1} de 5`;$('next').textContent=step===0?'Começar':step===4?'Concluir':'Próximo';
  if(step===4){$('review-notebook').textContent=notebookURL($('notebook').value);$('review-sources').textContent=replaceSources()?'Excluir permanentemente todas as fontes atuais antes de cada envio.':'Manter as fontes existentes e acrescentar o PDF novo.';$('review-sources').classList.toggle('destructive',replaceSources());$('review-prompts').textContent=mode()==='gaia'?'Importar os prompts escolhidos na Gaia pelas configurações.':$('starter').checked?'Prompts locais, com o prompt inicial Resumir o processo.':'Prompts locais. Você pode cadastrar seus textos depois.';}
  panels[step].querySelector('h2').focus();
}
async function finish(){
  const notebook=notebookURL($('notebook').value),data={notebook,replaceSources:replaceSources(),setupVersion:1,setupCompletedAt:new Date().toISOString()};
  data.promptSource=mode();
  if(mode()==='local'&&$('starter').checked){const {localPrompts=[]}=await chrome.storage.local.get('localPrompts');if(!localPrompts.some(prompt=>prompt.id===starterPrompt.id))data.localPrompts=[...localPrompts,starterPrompt];}
  await chrome.storage.local.set(data);await chrome.storage.local.remove('setupDraft');completed=true;const finalURL=new URL(location.href);finalURL.hash='done';history.replaceState(null,'',finalURL.href);
  $('setup').hidden=true;document.querySelector('nav').hidden=true;$('done').hidden=false;$('done-prompts').textContent=mode()==='gaia'?'Abra Ver configurações e use Importar prompts da Gaia para escolher seus textos.':$('starter').checked?'O prompt Resumir o processo já está disponível no painel do Notebook.':'Você pode cadastrar seus prompts nas configurações quando quiser.';$('done').querySelector('h2').focus();
}
$('setup').onsubmit=async event=>{event.preventDefault();if(saving)return;saving=true;$('next').disabled=true;$('back').disabled=true;clearError();try{validate();if(step===4)await finish();else{await saveDraft();step++;render();}}catch(error){showError(error);}finally{saving=false;$('next').disabled=false;$('back').disabled=false;}};
$('back').onclick=async()=>{if(saving||step===0)return;try{await saveDraft();step--;render();}catch(error){showError(error);}};
for(const input of document.querySelectorAll('[name="prompts"]'))input.onchange=showPromptFields;
for(const id of ['notebook'])$(id).addEventListener('input',clearError);
$('open-home').onclick=()=>chrome.tabs.create({url:'https://notebook.google.com/'}).catch(showError);
$('open-notebook').onclick=async()=>{try{const {notebook}=await chrome.storage.local.get('notebook');await chrome.tabs.create({url:notebookURL(notebook)});}catch(error){showError(error);}};
showPromptFields();render();
