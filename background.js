import {fileOperation} from './db.js';
import {syncDrive} from './drive.js';
import {directUpload} from './direct-upload-controller.js';
import './eproc-generation.js';
import {notebookURL} from './configuration.js';
import {openWizard,checkSetup,requireSetup,openSettings} from './setup-controller.js';
chrome.action.onClicked.addListener(()=>openSettings().catch(console.error));
chrome.runtime.onInstalled.addListener(details=>{
  const task=details.reason==='install'?openWizard('install'):checkSetup();task.catch(console.error);
});
chrome.runtime.onStartup.addListener(()=>checkSetup().catch(console.error));
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.notebook)checkSetup().catch(console.error);});
async function openNotebookFile(id,transferTab=null){
  await requireSetup();
  const {notebook}=await chrome.storage.local.get('notebook');
  const url=notebookURL(notebook||'');
  const tab=await chrome.tabs.create({url:'about:blank',active:true});
  await chrome.storage.session.set({pendingFile:id,pendingNotebookTab:tab.id,transferTab});
  await chrome.tabs.update(tab.id,{url,active:true});
  return {ok:true};
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  (async () => {
    if((['START_TREE','MARK_ALL','GENERATE_PDF','CAPTURE'].includes(message.type)||message.type.startsWith('CAPTURE_')||message.type.startsWith('DIRECT_UPLOAD_'))&&message.clientVersion!==chrome.runtime.getManifest().version)throw Error('Esta aba ainda está com uma versão antiga da Easy Notebook. Atualize a página (F5) e tente novamente.');
    if(message.type.startsWith('CAPTURE_')){
      if(!sender.tab||!/^https:\/\/eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br\//.test(sender.url))throw Error('Origem inválida para captura.');
      const key='capture:'+sender.tab.id;
      if(message.type==='CAPTURE_BEGIN'){
        const source=new URL(message.url);
        if(source.origin!==new URL(sender.url).origin||source.searchParams.get('acao')!=='download_documento_unificado')throw Error('Endereço inválido.');
        if(!Number.isSafeInteger(message.size)||message.size<1||message.size>200*1024*1024)throw Error('Tamanho de PDF inválido.');
        const previous=(await chrome.storage.session.get(key))[key];
        if(previous)for(let i=0;i<previous.next;i++)await fileOperation('readwrite',s=>s.delete(previous.id+':'+i));
        const job={id:crypto.randomUUID(),name:String(message.name).slice(0,200),size:message.size,next:0,received:0,url:source.href};
        await chrome.storage.session.set({[key]:job});return {id:job.id};
      }
      const job=(await chrome.storage.session.get(key))[key];
      if(!job||job.id!==message.id)throw Error('Captura não encontrada.');
      if(message.type==='CAPTURE_CHUNK'){
        if(message.index!==job.next||typeof message.base64!=='string'||message.base64.length>700000)throw Error('Bloco de captura inválido.');
        const bytes=Uint8Array.from(atob(message.base64),c=>c.charCodeAt(0));
        if(job.received+bytes.length>job.size)throw Error('PDF acima do tamanho declarado.');
        await fileOperation('readwrite',s=>s.put(bytes,job.id+':'+job.next));
        job.next++;job.received+=bytes.length;await chrome.storage.session.set({[key]:job});return {ok:true};
      }
      if(message.type==='CAPTURE_FINISH'){
        if(message.chunks!==job.next||job.received!==job.size)throw Error('PDF incompleto.');
        const parts=[];for(let i=0;i<job.next;i++){const part=await fileOperation('readonly',s=>s.get(job.id+':'+i));if(!part)throw Error('Bloco ausente.');parts.push(part);}
        const blob=new Blob(parts,{type:'application/pdf'});
        if(!new TextDecoder().decode(await blob.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('Conteúdo recebido não é PDF.');
        await fileOperation('readwrite',s=>s.put({name:job.name,blob},job.id));
        for(let i=0;i<job.next;i++)await fileOperation('readwrite',s=>s.delete(job.id+':'+i));
        await chrome.storage.session.remove(key);
        await chrome.storage.local.set({flowStatus:'PDF capturado. Abrindo o Notebook para envio direto…',flowUpdated:Date.now()});
        return openNotebookFile(job.id);
      }
      if(message.type==='CAPTURE_ABORT'){
        for(let i=0;i<job.next;i++)await fileOperation('readwrite',s=>s.delete(job.id+':'+i));await chrome.storage.session.remove(key);return {ok:true};
      }
      throw Error('Etapa de captura desconhecida.');
    }
    if(message.type==='CHECK_SETUP')return checkSetup({focus:message.focus===true});
    if(message.type==='OPEN_SETUP')return openWizard('manual');
    if (message.type === 'OPTIONS') return openSettings();
    if (message.type === 'SYNC_DRIVE') return {count:await syncDrive()};
    if (message.type === 'START_TREE') {
      const url = new URL(message.url);
      const actions = ['arvore_documento_listar','processo_consultar_arvore_sistema_externo'];
      if (!sender.tab || !/^https:\/\/eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br\//.test(sender.url) || url.protocol !== 'https:' || !/^eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br$/.test(url.hostname) || !actions.includes(url.searchParams.get('acao'))) throw Error('Link de árvore inválido.');
      // Start the job before navigating, so the destination script can resume it.
      await requireSetup();
      const tab = await chrome.tabs.create({url:'about:blank',active:true});
      const processNumber=url.searchParams.get('txtNumProcessoOriginarioExterno')||url.searchParams.get('txtNumProcesso')||url.searchParams.get('num_processo');
      const job={started:Date.now(),processNumber,tabId:tab.id};
      await chrome.storage.session.set({['treeJob:'+tab.id]:job,treeFlow:job});
      await chrome.storage.local.set({flowStatus:'Árvore solicitada. Aguardando a página dos documentos.',flowUpdated:Date.now()});
      await chrome.tabs.update(tab.id,{url:url.href});
      return {ok:true};
    }
    if (message.type === 'TREE_JOB') {
      if (!sender.tab || !/^https:\/\/eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br\//.test(sender.url)) return null;
      const key='treeJob:'+sender.tab.id;
      const data=await chrome.storage.session.get([key,'treeFlow']);
      let job=data[key];
      // The external-system bridge can open a different tab. Match the actual
      // process rather than assuming the original tab survives that bridge.
      const actualURL=new URL(sender.url);
      const actualProcess=actualURL.searchParams.get('txtNumProcesso')||actualURL.searchParams.get('num_processo');
      if(!job&&data.treeFlow&&actualProcess&&actualProcess===data.treeFlow.processNumber)job=data.treeFlow;
      if (!job || Date.now()-job.started>300000 || job.claimed) return null;
      if(message.ready){
        if(actualURL.searchParams.get('acao')!=='arvore_documento_listar')return null;
        await chrome.storage.session.remove('treeJob:'+job.tabId);
        await chrome.storage.session.set({treeFlow:{...job,claimed:true,tabId:sender.tab.id}});
      }
      return job;
    }
    if(message.type==='FLOW_STATUS'){
      if(!sender.tab||!/^https:\/\/(eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br|(notebook|notebooklm)\.google\.com)\//.test(sender.url))return null;
      await chrome.storage.local.set({flowStatus:String(message.text).slice(0,1000),flowUpdated:Date.now()});
      return {ok:true};
    }
    if (message.type === 'GENERATE_PDF' || message.type === 'MARK_ALL') {
      if (!sender.tab || !/^https:\/\/eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br\//.test(sender.url)) throw Error('Página de origem inválida.');
      const mode=message.type==='MARK_ALL'?true:(message.printOnly?'print':false);
      const result=await chrome.scripting.executeScript({target:{tabId:sender.tab.id},world:'MAIN',func:globalThis.easyNotebookGeneratePDF,args:[mode]});
      if(result[0]?.result?.ok===false)throw Error('Falha ao '+result[0].result.stage+': '+result[0].result.error);
      if(!result[0]?.result?.ok)throw Error('A página não devolveu o resultado do clique. Detalhe: '+(result[0]?.error?.message||String(result[0]?.error||'sem retorno da execução na página')));
      return result[0].result;
    }
    if (message.type === 'CAPTURE') {
      const url = new URL(message.url);
      if (!/^eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br$/.test(url.hostname) || url.protocol !== 'https:' || url.searchParams.get('acao') !== 'download_documento_unificado' || new URL(sender.url).origin !== url.origin) throw Error('Endereço de PDF inválido.');
      await chrome.storage.session.set({captureURL: url.href});
      return chrome.tabs.create({url: chrome.runtime.getURL('transfer.html')+(message.automatic?'?automatic=1':''),active:!message.automatic});
    }
    if (message.type === 'OPEN_NOTEBOOK') {
      return openNotebookFile(message.id,sender.tab?.id??null);
    }
    if (message.type === 'FILE_INFO' || message.type === 'FILE_CHUNK' || message.type.startsWith('DIRECT_UPLOAD_')) {
      if (!sender.tab || !/^https:\/\/(notebook|notebooklm)\.google\.com\//.test(sender.url)) throw Error('Destino inválido.');
      const {pendingFile,pendingNotebookTab,transferTab} = await chrome.storage.session.get(['pendingFile','pendingNotebookTab','transferTab']);
      if (!pendingFile || sender.tab.id!==pendingNotebookTab) return null;
      await requireSetup();const {notebook} = await chrome.storage.local.get('notebook');
      if (new URL(sender.url).pathname !== new URL(notebookURL(notebook || '')).pathname) return null;
      const file = await fileOperation('readonly', s => s.get(pendingFile));
      if (!file) return null;
      if(message.type.startsWith('DIRECT_UPLOAD_'))return directUpload(message,sender,file,pendingFile,notebook);
      if (message.type === 'FILE_INFO') return {name:file.name,size:file.blob.size};
      if (!Number.isSafeInteger(message.offset) || message.offset < 0 || message.offset >= file.blob.size) throw Error('Intervalo inválido.');
      const bytes = new Uint8Array(await file.blob.slice(message.offset, message.offset + 524288).arrayBuffer());
      let binary = ''; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
      return {base64:btoa(binary)};
    }
    throw Error('Operação desconhecida.');
  })().then(value => respond({value}), error => respond({error:error.message}));
  return true;
});
