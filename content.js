(() => {
  const isNotebook=/^(notebook|notebooklm)\.google\.com$/.test(location.hostname);
  if(!isNotebook&&!globalThis.easyNotebookIsProcessPage(document,location.href))return;
  if(document.getElementById('easy-notebook-host'))return;
  const session=globalThis.easyNotebookSession();
  const localGet=keys=>session.call(()=>chrome.storage.local.get(keys));
  let uploadTimer;
  const host=document.createElement('div');host.id='easy-notebook-host';document.documentElement.append(host);
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=globalThis.easyNotebookPanelMarkup;
  for(const image of root.querySelectorAll('[data-brand-icon]'))image.src=chrome.runtime.getURL('icons/notebook.svg');
  const $=id=>root.getElementById(id),section=root.querySelector('section');
  $('panel-subtitle').textContent=isNotebook?'Seus prompts, no lugar certo':'Do eproc direto para o Notebook';$('actions-label').textContent=isNotebook?'Biblioteca de prompts':'Enviar processo';$('tools').hidden=isNotebook;
  let processStage='idle';
  const syncProcessActions=()=>{if(isNotebook)return;const active=processStage!=='idle';$('actions').hidden=active;$('actions-label').textContent=processStage==='running'?'Geração em andamento':processStage==='complete'?'Geração concluída':'Enviar processo';};
  const setProcessStage=stage=>{processStage=stage;syncProcessActions();};
  const status=text=>{if(!session.active())return;const kind=processStage==='running'||/^AGUARDE\b/i.test(text)?'busy':/pronto para uso|PDF pronto|PDF capturado|atualizados|Prompt inserido/i.test(text)?'success':/erro|falha|não foi|não confirmou|recusou|interrompido/i.test(text)?'error':'info';$('status').textContent=text;$('status').dataset.kind=kind;section.toggleAttribute('aria-busy',kind==='busy');syncProcessActions();session.notify(()=>chrome.runtime.sendMessage({type:'FLOW_STATUS',text})); };
  const rpc=async message=>{const result=await session.call(()=>chrome.runtime.sendMessage({...message,clientVersion:chrome.runtime.getManifest().version}));if(result.error)throw Error(result.error);return result.value;};
  const panelPosition=globalThis.easyNotebookPositionPanel(root,session);
  session.onInvalid(()=>{
    clearInterval(uploadTimer);$('status').textContent=session.message;$('status').dataset.kind='error';section.hidden=false;$('toggle').setAttribute('aria-expanded','true');
    for(const button of root.querySelectorAll('button'))if(!['close','toggle'].includes(button.id))button.disabled=true;
    const reload=document.createElement('button');reload.className='action primary';reload.textContent='Atualizar página';reload.onclick=()=>location.reload();$('actions').append(reload);panelPosition.refresh();
  });
  const showPanel=visible=>{section.hidden=!visible;$('toggle').setAttribute('aria-expanded',String(visible));panelPosition.refresh();};
  $('toggle').onclick=()=>showPanel(section.hidden);$('close').onclick=()=>showPanel(false);
  $('config').onclick=()=>rpc({type:'OPTIONS'}).catch(e=>status(e.message));
  const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.className='action'+(!isNotebook&&label==='Enviar processo ao Notebook'?' primary':'');b.onclick=async()=>{b.disabled=true;try{await action();}catch(e){status(e.message);}finally{b.disabled=!session.active();}};(!isNotebook&&label!=='Enviar processo ao Notebook'?$('advanced-actions'):$('actions')).append(b);return b;};
  async function showMode(){const {replaceSources=false}=await localGet('replaceSources');$('replace-mode').hidden=!replaceSources;}showMode().catch(e=>status(e.message));chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.replaceSources)showMode().catch(e=>status(e.message));if(changes.flowStatus?.newValue?.startsWith('Removendo fontes anteriores:'))$('status').textContent=changes.flowStatus.newValue;});
  rpc({type:'CHECK_SETUP'}).then(setup=>{if(setup?.required){showPanel(true);status(setup.message);}}).catch(e=>status(e.message));
  const visible=el=>el.getClientRects().length>0;
  function conversation(){return [...document.querySelectorAll('textarea,[contenteditable="true"],input[aria-label]')].find(el=>visible(el)&&/Caixa de consulta|query box|Faça uma pergunta|Ask|Start typing/i.test([el.getAttribute('aria-label'),el.getAttribute('placeholder'),el.getAttribute('data-placeholder')].join(' ')));}
  function insert(text){const el=conversation();if(!el)throw Error('Abra a aba Chat para inserir o prompt.');el.focus();if(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement){const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,text);}else{el.textContent=text;}el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));el.dispatchEvent(new Event('change',{bubbles:true}));status('Prompt inserido. Revise o texto e clique em Enviar no notebook.');}
  async function library(){const {localPrompts=[],gaiaPrompts=[],drivePrompts=[]}=await localGet(['localPrompts','gaiaPrompts','drivePrompts']);$('library').replaceChildren();const search=document.createElement('input');search.placeholder='Buscar prompt';search.setAttribute('aria-label','Buscar prompt');$('library').append(search);const list=document.createElement('div');list.className='prompt-list';$('library').append(list);const draw=()=>{list.replaceChildren();for(const p of [...localPrompts,...gaiaPrompts,...drivePrompts].filter(p=>p.title.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))){const article=document.createElement('article'),title=document.createElement('strong'),use=document.createElement('button');title.textContent=p.title;use.textContent='Usar';use.onclick=()=>{try{insert(p.body);}catch(e){status(e.message);}};const details=document.createElement('details'),summary=document.createElement('summary'),preview=document.createElement('p');summary.textContent='Ver texto';preview.textContent=p.body;details.append(summary,preview);article.append(title,use,details);list.append(article);}};search.oninput=draw;draw();if(!localPrompts.length&&!gaiaPrompts.length&&!drivePrompts.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent='Importe prompts da Gaia ou cadastre seus textos nas Configurações.';list.append(empty);}}
  function inlinePrompts(){
    let inline;
    const place=()=>{
      if(!session.active())return;
      const field=conversation();if(!field)return;
      const rect=field.getBoundingClientRect();if(!rect.width||!rect.height)return;
      if(!inline){
        inline=document.createElement('div');inline.id='easy-notebook-inline-prompts';inline.style.cssText='position:fixed;z-index:2147483646;pointer-events:auto';document.body.append(inline);
        const inlineRoot=inline.attachShadow({mode:'open'});
        inlineRoot.innerHTML='<style>:host{display:block}button{border:1px solid #7e9df2;border-radius:18px;background:#eef3ff;color:#234ea7;font:600 13px system-ui,-apple-system,"Segoe UI",sans-serif;padding:9px 13px;box-shadow:0 2px 10px #1026602b;cursor:pointer}button:hover,button:focus-visible{background:#dce7ff;border-color:#416fd7;outline:none}#menu{position:absolute;left:0;bottom:calc(100% + 8px);width:min(320px,calc(100vw - 16px));max-height:330px;overflow:auto;padding:8px;background:#fff;border:1px solid #d4e0f5;border-radius:14px;box-shadow:0 12px 35px #10266038}#menu[hidden]{display:none}.prompt{display:block;width:100%;text-align:left;border:0;background:none;box-shadow:none;border-radius:8px;padding:9px;color:#253f69;font-size:12px}.prompt:hover{background:#edf3ff}.empty{padding:10px;color:#6d7e98;font:12px/1.45 system-ui}.manage{margin-top:5px;width:100%;font-size:12px}</style><button id="open" type="button" aria-label="Abrir prompts salvos" aria-expanded="false">Prompts</button><div id="menu" hidden role="menu"></div>';
        const open=inlineRoot.querySelector('#open'),menu=inlineRoot.querySelector('#menu');
        const close=()=>{menu.hidden=true;open.setAttribute('aria-expanded','false');};
        const render=async()=>{
          const {localPrompts=[],gaiaPrompts=[],drivePrompts=[]}=await localGet(['localPrompts','gaiaPrompts','drivePrompts']);
          menu.replaceChildren();
          for(const prompt of [...localPrompts,...gaiaPrompts,...drivePrompts]){const item=document.createElement('button');item.className='prompt';item.type='button';item.role='menuitem';item.textContent=prompt.title;item.onclick=()=>{try{insert(prompt.body);close();}catch(error){status(error.message);}};menu.append(item);}
          if(!menu.childElementCount){const empty=document.createElement('p');empty.className='empty';empty.textContent='Nenhum prompt salvo ainda.';menu.append(empty);}
          const manage=document.createElement('button');manage.className='manage';manage.type='button';manage.textContent=menu.childElementCount===1?'Importar prompts da Gaia':'Gerenciar prompts';manage.onclick=()=>{close();showPanel(true);root.querySelector('#library').scrollIntoView({block:'center'});};menu.append(manage);
          menu.hidden=false;open.setAttribute('aria-expanded','true');
        };
        open.onclick=()=>menu.hidden?render().catch(error=>status(error.message)):close();
      }
      const width=92,gap=10,beside=rect.left>=width+gap+8;
      inline.style.left=Math.round(beside?rect.left-width-gap:Math.max(8,rect.left+10))+'px';
      inline.style.top=Math.round(beside?rect.top+rect.height/2:Math.max(8,rect.top-42))+'px';
      inline.style.transform=beside?'translateY(-50%)':'';
    };
    const observer=new MutationObserver(place);observer.observe(document.documentElement,{childList:true,subtree:true});
    addEventListener('resize',place,{passive:true});place();
    session.onInvalid(()=>{observer.disconnect();inline?.remove();});
  }
  if(isNotebook){
    button('Importar prompts da Gaia',async()=>{await rpc({type:'OPTIONS'});});
    inlinePrompts();

    library().then(async()=>{const {lastUploadResult}=await localGet('lastUploadResult');const pending=await rpc({type:'FILE_INFO'});if(!pending&&lastUploadResult?.ready&&lastUploadResult.notebookPath===location.pathname)status('PDF pronto para uso: '+lastUploadResult.name);}).catch(e=>status(e.message));chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.localPrompts||changes.gaiaPrompts||changes.drivePrompts))library().catch(e=>status(e.message));});
    let uploading=false,attempted=false;
    const siteButton=pattern=>[...document.querySelectorAll('button,[role="button"]')].find(el=>visible(el)&&pattern.test(el.getAttribute('aria-label')||el.textContent.trim()));
    async function upload(){if(!session.active()||uploading||attempted)return;uploading=true;try{
      const info=await rpc({type:'FILE_INFO'});if(!info)return;attempted=true;showPanel(true);
      status('Preparando envio direto de '+info.name+'…');
      const start=await rpc({type:'DIRECT_UPLOAD_START'});
      if(start.phase==='collecting'){
        let index=start.index||0;
        for(let offset=start.received||0;offset<info.size;offset+=524288){const chunk=await rpc({type:'FILE_CHUNK',offset});if(!chunk?.base64)throw Error('O PDF pendente não está disponível.');await rpc({type:'DIRECT_UPLOAD_CHUNK',base64:chunk.base64,index:index++});status(`Preparando PDF para envio: ${Math.min(100,Math.round((offset+Math.min(524288,info.size-offset))/info.size*100))}%`);}
        status('Enviando o PDF diretamente ao Notebook…');await rpc({type:'DIRECT_UPLOAD_FINISH'});
      }
      status('PDF enviado. Aguardando o Notebook terminar o processamento…');
      let ready=false;
      for(let i=0;i<90;i++){
        const check=await rpc({type:'DIRECT_UPLOAD_STATUS'});
        if(check.ready){ready=true;break;}
        if(start.phase==='registered'||start.phase==='registering')throw Error('O registro de uma fonte anterior foi preservado, mas o envio dos bytes não foi confirmado. Confira essa fonte antes de tentar outro envio.');
        await new Promise(r=>setTimeout(r,2000));
      }
      if(!ready)throw Error('O Notebook ainda está processando. O PDF e o identificador da fonte foram preservados; use Anexar PDF pendente para conferir novamente, sem criar outra fonte.');
      await rpc({type:'DIRECT_UPLOAD_DONE'});status('PDF processado. Abrindo o Notebook pronto para uso…');
      const finalURL=new URL(location.href);finalURL.searchParams.delete('addSource');if(finalURL.href===location.href)location.reload();else location.replace(finalURL.href);
    }catch(e){status(e.message);}finally{uploading=false;}}
    const resume=button('Retomar envio pendente',async()=>{attempted=false;await upload();});resume.hidden=true;rpc({type:'FILE_INFO'}).then(info=>{resume.hidden=!info;}).catch(()=>{});
    uploadTimer=setInterval(()=>upload().catch(e=>status(e.message)),4000);
  }else{
    let running=false;
    async function captureAndFinish(url){
      setProcessStage('running');
      try{const result=await globalThis.easyNotebookCapturePDF(url,{rpc,report:status});setProcessStage('complete');status('PDF capturado. O envio continuará automaticamente no Notebook.');return result;}
      catch(error){setProcessStage('idle');throw error;}
    }
    async function selectAll(){
      const result=await rpc({type:'MARK_ALL'});
      if(result?.ok===false)throw Error('Falha ao '+result.stage+': '+result.error);
      if(!result?.ok)throw Error('Não foi possível acionar Marcar todos.');
      return result;
    }
    status('Clique em Enviar processo ao Notebook para abrir a árvore, marcar todos e gerar o PDF.');
    async function openTree(){
      const related=document.querySelector('#divRelacionados');
      const valid=a=>{try{return ['processo_consultar_arvore_sistema_externo','arvore_documento_listar'].includes(new URL(a.href,location.href).searchParams.get('acao'));}catch{return false;}};
      const a=(related&&[...related.querySelectorAll('a')].find(valid))||[...document.querySelectorAll('a')].find(valid);
      if(!a)throw Error('Não encontrei o link da árvore nesta página. Abra a capa do processo.');
      await rpc({type:'START_TREE',url:new URL(a.href,location.href).href});
      status('Árvore aberta em outra aba. A geração continuará automaticamente lá.');
    }
    async function sendProcess(){
      if(!session.active()||running)return;running=true;setProcessStage('running');showPanel(true);
      let stopWatching=()=>{};
      try{
        const pdfFrame=()=>[...document.querySelectorAll('iframe')].find(frame=>{
          try{return frame.id==='ifrLeitorPdf'||frame.getAttribute('type')==='application/pdf'||new URL(frame.src,location.href).searchParams.get('acao')==='download_documento_unificado';}catch{return frame.id==='ifrLeitorPdf'||frame.getAttribute('type')==='application/pdf';}
        });
        if(!pdfFrame()&&!document.querySelector('#divArvore')){await openTree();return;}
        status('AGUARDE — gerando o PDF completo.\nNão é necessário clicar novamente. Selecionando todos os documentos…');
        const previousPDF=pdfFrame()?.src;
        let readerReloaded=false;
        const isPDFFrame=frame=>frame?.tagName==='IFRAME'&&(frame.id==='ifrLeitorPdf'||frame.getAttribute('type')==='application/pdf');
        const onReaderLoad=event=>{if(isPDFFrame(event.target))readerReloaded=true;};
        const observer=new MutationObserver(records=>{if(records.some(record=>isPDFFrame(record.target)||[...record.addedNodes].some(isPDFFrame)))readerReloaded=true;});
        observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
        document.addEventListener('load',onReaderLoad,true);
        stopWatching=()=>{observer.disconnect();document.removeEventListener('load',onReaderLoad,true);};
        await selectAll();
        status('AGUARDE — documentos selecionados.\nNão é necessário clicar novamente. Solicitando o PDF completo ao eproc…');
        await rpc({type:'GENERATE_PDF',printOnly:true});
        status('AGUARDE — o eproc está montando o PDF completo.\nNão é necessário clicar novamente.');
        const deadline=Date.now()+180000;let url;
        while(Date.now()<deadline){
          if(!session.active())throw Error(session.message);
          const frame=pdfFrame();
          if(frame){const candidate=new URL(frame.src,location.href);if(candidate.searchParams.get('acao')==='download_documento_unificado'&&(candidate.href!==previousPDF||readerReloaded)){url=candidate.href;break;}}
          await new Promise(resolve=>setTimeout(resolve,800));
        }
        if(!url)throw Error('Não detectei a atualização do leitor em 3 minutos. Se o PDF completo já estiver à direita, use Capturar PDF já gerado; se ainda aparecer um documento individual, a geração não atualizou o leitor.');
        status('AGUARDE — PDF completo identificado.\nNão é necessário clicar novamente. Preparando a transferência…');
        await captureAndFinish(url);
      }catch(e){setProcessStage('idle');status(e.message);}finally{stopWatching();running=false;}
    }
    async function confirmSendProcess(){
      if(!session.active()||running)return;
      const setup=await rpc({type:'CHECK_SETUP',focus:true});if(setup.required){showPanel(true);status(setup.message);return;}
      if(!window.confirm('Enviar o pdf completo ao Gemini Notebook?'))return;
      await sendProcess();
    }
    button('Enviar processo ao Notebook',confirmSendProcess);
    globalThis.easyNotebookEprocToolbar(panelPosition);
    $('toggle').onclick=()=>{if(panelPosition.isDocked()){confirmSendProcess().catch(e=>status(e.message));}else showPanel(section.hidden);};
    button('Abrir árvore',openTree);
    button('Marcar todos',async()=>{await selectAll();status('Clique em Marcar todos realizado.');});
    button('Versão p/ impressão',async()=>{await rpc({type:'GENERATE_PDF'});status('Marcar todos e Versão p/ impressão acionados. Aguardando o PDF…');});
    button('Capturar PDF já gerado',async()=>{const frame=[...document.querySelectorAll('iframe')].find(candidate=>{try{return candidate.id==='ifrLeitorPdf'||candidate.getAttribute('type')==='application/pdf'||new URL(candidate.src,location.href).searchParams.get('acao')==='download_documento_unificado';}catch{return candidate.id==='ifrLeitorPdf'||candidate.getAttribute('type')==='application/pdf';}});if(!frame){await openTree();return;}const u=new URL(frame.src,location.href);if(u.searchParams.get('acao')!=='download_documento_unificado'){await sendProcess();return;}await captureAndFinish(u.href);});
    rpc({type:'TREE_JOB'}).then(async job=>{if(!job)return;setProcessStage('running');showPanel(true);status('AGUARDE — gerando o PDF completo.\nNão é necessário clicar novamente. Preparando a árvore de documentos…');const deadline=Date.now()+25000;while(session.active()&&!document.querySelector('#divOpcoesDocumentos')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,300));if(!session.active())return;if(!document.querySelector('#divOpcoesDocumentos')){setProcessStage('idle');status('A árvore ainda não ficou pronta. A tarefa foi preservada; atualize esta aba para retomar.');return;}const claimed=await rpc({type:'TREE_JOB',ready:true});if(claimed)await sendProcess();}).catch(e=>{setProcessStage('idle');showPanel(true);status('Não foi possível continuar na árvore: '+e.message);});
  }
})();














