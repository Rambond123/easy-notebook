import './notebook-direct-upload.js';
import {fileOperation} from './db.js';
const busy=new Set();
export async function directUpload(message,sender,file,fileId,configuredURL){
  const storageKey='directUpload:'+fileId;
  let job=(await chrome.storage.session.get(storageKey))[storageKey];
  const configured=new URL(configuredURL);
  const page=async(action,extra={})=>{
    const results=await chrome.scripting.executeScript({target:{tabId:sender.tab.id},world:'MAIN',func:globalThis.easyNotebookDirectUpload,args:[{action,notebookPath:configured.pathname,account:configured.searchParams.get('authuser'),token:job.token,name:job.name,size:file.blob.size,sourceId:job.sourceId,...extra}]});
    const result=results[0]?.result;if(!result?.ok)throw Error(result?.error||'A guia não confirmou a etapa de envio.');return result;
  };
  const persist=()=>chrome.storage.session.set({[storageKey]:job});
  if(message.type==='DIRECT_UPLOAD_START'){
    if(!job){const {replaceSources=false}=await chrome.storage.local.get('replaceSources');const process=file.name.match(/\d{20}/)?.[0];job={token:crypto.randomUUID(),name:process?process+' - integral.pdf':file.name,phase:'collecting',replaceSources:replaceSources===true,tabId:sender.tab.id};await persist();}
    if(job.tabId!==sender.tab.id)throw Error('O envio pertence a outra guia do Notebook.');
    if(job.phase==='registering'){
      const recovered=await page('status',{previousIds:job.previousIds});
      if(!recovered.found)throw Error('O registro anterior ainda não foi confirmado. O PDF foi preservado; confira novamente sem iniciar outro envio.');
      job.sourceId=recovered.sourceId;job.phase=recovered.ready?'processing':'collecting';await persist();
    }
    if(job.phase==='registered'){job.phase='collecting';await persist();}
    if(['uploading','processing','ready'].includes(job.phase))return {phase:job.phase,name:job.name};
    if(job.phase==='cleaning'){job.phase='collecting';await persist();}
    const prepared=await page('prepare');return {...prepared,phase:job.phase,name:job.name};
  }
  if(!job||job.tabId!==sender.tab.id)throw Error('Não há envio iniciado nesta guia.');
  if(message.type==='DIRECT_UPLOAD_CHUNK'){
    if(job.phase!=='collecting')throw Error('O envio já saiu da etapa de transferência.');
    return page('chunk',{index:message.index,base64:message.base64});
  }
  if(message.type==='DIRECT_UPLOAD_FINISH'){
    if(busy.has(storageKey))throw Error('O envio já está em andamento.');
    busy.add(storageKey);
    try{
      if(job.phase!=='collecting')return {phase:job.phase};
      const checked=await page('check');
      if(job.replaceSources&&!job.cleanupComplete){
        job.cleanupIds??=checked.previousIds;job.cleanedIds??=[];job.phase='cleaning';await persist();
        const current=await page('list');
        if(current.sources.some(s=>!job.cleanupIds.includes(s.id)))throw Error('Uma fonte nova apareceu durante a limpeza. O envio foi interrompido para preservar essa fonte.');
        for(const id of job.cleanupIds){
          if(job.cleanedIds.includes(id))continue;
          await chrome.storage.local.set({flowStatus:`Removendo fontes anteriores: ${job.cleanedIds.length+1} de ${job.cleanupIds.length}…`,flowUpdated:Date.now()});
          await page('remove-source',{removeId:id,allowedIds:job.cleanupIds});job.cleanedIds.push(id);await persist();
        }
        if((await page('list')).sources.length)throw Error('A limpeza não deixou o notebook vazio. O PDF novo foi preservado.');
        job.cleanupComplete=true;job.phase='collecting';await persist();
      }
      if(!job.sourceId){job.previousIds=checked.previousIds;job.phase='registering';await persist();
        const registered=await page('register');job.sourceId=registered.sourceId;job.phase='registered';await persist();}
      job.phase='uploading';await persist();
      await page('send');job.phase='processing';await persist();
      return {phase:job.phase,sourceId:job.sourceId};
    }finally{busy.delete(storageKey);}
  }
  if(message.type==='DIRECT_UPLOAD_STATUS'||message.type==='DIRECT_UPLOAD_DONE'){
    if(job.phase==='collecting')throw Error('O PDF ainda não foi enviado.');
    const result=await page('status',{previousIds:job.previousIds});
    if(result.sourceId&&!job.sourceId){job.sourceId=result.sourceId;await persist();}
    if(result.failed)throw Error('O Notebook informou erro ao processar a fonte. O PDF capturado foi preservado.');
    if(message.type==='DIRECT_UPLOAD_STATUS')return {...result,phase:job.phase};
    if(!result.ready)throw Error('O Notebook ainda não confirmou que a fonte está pronta.');
    await chrome.storage.local.set({lastUploadResult:{name:job.name,size:file.blob.size,sourceId:job.sourceId,notebookPath:configured.pathname,ready:true,completed:Date.now()},flowStatus:'PDF pronto no Notebook: '+job.name,flowUpdated:Date.now()});
    await page('release');await fileOperation('readwrite',s=>s.delete(fileId));
    await chrome.storage.session.remove([storageKey,'pendingFile','pendingNotebookTab','transferTab']);
    await chrome.tabs.update(sender.tab.id,{active:true});
    return {ok:true,ready:true};
  }
  throw Error('Etapa de upload direto desconhecida.');
}
