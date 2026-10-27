import {gaiaPage} from './gaia-page.js';
export const isEprocURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&/^eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br$/.test(u.hostname);}catch{return false;}};
export function normalizeGaiaPrompt(value){
  if(!value||typeof value.id!=='string'||!/^\d+$/.test(value.id)||!isEprocURL(value.origin)||new URL(value.origin).origin!==value.origin)throw Error('Origem ou identificador de prompt inválido.');
  if(typeof value.title!=='string'||!value.title.trim()||typeof value.body!=='string'||!value.body.trim()||value.body.length>1000000)throw Error('Texto ou título de prompt inválido.');
  const result={id:`gaia:${value.origin}:${value.id}`,gaiaId:value.id,source:'gaia',origin:value.origin,title:value.title.trim(),body:value.body,importedAt:new Date().toISOString()};
  for(const field of ['version','versionId','author','description','visibility','updated'])result[field]=String(value[field]||'').slice(0,10000);
  return result;
}
export function mergeGaiaPrompts(existing,incoming){
  const map=new Map(existing.map(prompt=>[prompt.id,prompt]));
  for(const value of incoming){const prompt=normalizeGaiaPrompt(value);map.set(prompt.id,prompt);}
  const result=[...map.values()];
  if(new TextEncoder().encode(JSON.stringify(result)).length>6000000)throw Error('A biblioteca da Gaia ultrapassou 6 MB. Importe menos prompts ou remova os que não usa.');
  return result;
}
export async function gaiaTabs(){
  const tabs=(await chrome.tabs.query({})).filter(tab=>isEprocURL(tab.url));
  return tabs.map(tab=>({id:tab.id,title:tab.title||'eproc',origin:new URL(tab.url).origin}));
}
async function queryUnlocked(tabId,action,id=''){
  if(!Number.isSafeInteger(tabId))throw Error('Escolha uma guia do eproc.');
  for(let attempt=0;attempt<3;attempt++){
    const tab=await chrome.tabs.get(tabId);
    if(!isEprocURL(tab.url))throw Error('A guia escolhida não está no eproc. Faça login e busque novamente.');
    let response;
    try{response=(await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:gaiaPage,args:[action,id]}))[0]?.result;}
    catch(error){
      if(attempt<2&&/frame|navigat|context.*destroy|document.*unload/i.test(error.message)){await new Promise(resolve=>setTimeout(resolve,700));continue;}
      throw error;
    }
    if(!response?.ok)throw Error(response?.error||'O eproc não devolveu a consulta. Atualize a guia e tente novamente.');
    if(response.navigating){await new Promise(resolve=>setTimeout(resolve,1000));continue;}
    return response;
  }
  throw Error('A área de prompts ainda está abrindo. Aguarde e clique em Buscar prompts novamente.');
}
export async function queryGaia(tabId,action,id=''){
  return navigator.locks.request('easy-notebook-gaia-tab-'+tabId,{ifAvailable:true},async lock=>{
    if(!lock)throw Error('Esta guia está sendo consultada por outra janela da extensão. Aguarde e tente novamente.');
    return queryUnlocked(tabId,action,id);
  });
}
export async function importGaiaPrompts(tabId,selected,onProgress=()=>{}){
  if(!selected.length)throw Error('Marque ao menos um prompt.');
  // Web Locks serialize imports across settings tabs. Nothing is stored until all reads succeed.
  return navigator.locks.request('easy-notebook-gaia-import',{ifAvailable:true},async lock=>{
    if(!lock)throw Error('Já existe uma importação em outra janela de configurações.');
    return navigator.locks.request('easy-notebook-gaia-tab-'+tabId,{ifAvailable:true},async tabLock=>{
    if(!tabLock)throw Error('Esta guia está sendo consultada por outra janela da extensão. Aguarde e tente novamente.');
    const incoming=[];
    for(const [index,item] of selected.entries()){
      onProgress(`Importando ${index+1} de ${selected.length}: ${item.title}`);
      const result=await queryUnlocked(tabId,'read',item.id);
      if(result.prompt.id!==item.id||result.prompt.origin!==item.origin)throw Error('A origem da consulta mudou. Busque a lista novamente.');
      incoming.push(result.prompt);
    }
    const {gaiaPrompts=[]}=await chrome.storage.local.get('gaiaPrompts');
    const merged=mergeGaiaPrompts(gaiaPrompts,incoming);
    await chrome.storage.local.set({gaiaPrompts:merged,gaiaLastImport:new Date().toISOString()});
    return incoming.length;
    });
  });
}
