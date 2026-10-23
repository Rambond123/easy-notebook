import {setupProblem} from './configuration.js';
let opening;
export async function openWizard(reason='manual',focus=true){
  if(opening)return opening;
  opening=(async()=>{
    const url=chrome.runtime.getURL('wizard.html');
    const existing=(await chrome.tabs.query({url:url+'*'}))[0];
    if(existing){if(new URL(existing.url).hash==='#done'){const update={url:url+'?reason='+encodeURIComponent(reason)};if(focus)update.active=true;await chrome.tabs.update(existing.id,update);}else if(focus)await chrome.tabs.update(existing.id,{active:true});return {tabId:existing.id};}
    const tab=await chrome.tabs.create({url:url+'?reason='+encodeURIComponent(reason),active:true});return {tabId:tab.id};
  })();
  try{return await opening;}finally{opening=null;}
}
export async function checkSetup({open=true,focus=false}={}){
  const settings=await chrome.storage.local.get('notebook'),problem=setupProblem(settings);
  if(problem&&open)await openWizard('incomplete',focus);
  return {required:!!problem,message:problem?'Vamos concluir a configuração da Easy Notebook antes de enviar o PDF.':'Tudo pronto para enviar.'};
}
export async function requireSetup(){const state=await checkSetup({focus:true});if(state.required)throw Error(state.message);}
export async function openSettings(){if(!(await checkSetup({focus:true})).required)return chrome.runtime.openOptionsPage();}
