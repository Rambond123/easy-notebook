// Self-contained: chrome.scripting serializes this function into the Notebook tab.
globalThis.easyNotebookDirectUpload = async function(request) {
  const key='__easyNotebookDirectUploadV1';
  try {
    if(!['notebook.google.com','notebooklm.google.com'].includes(location.hostname)||location.protocol!=='https:'||location.pathname!==request.notebookPath)throw Error('A guia não corresponde ao notebook de destino.');
    const account=new URL(location.href).searchParams.get('authuser')??request.account??'0';
    if(request.account!=null&&account!==request.account)throw Error('A conta desta guia difere da conta configurada.');
    const options=[2,null,null,[1,null,null,null,null,null,null,null,null,null,[1]]];
    const notebookId=location.pathname.split('/')[2];
    async function rpc(method,params,allowNull=false) {
      const html=document.documentElement.innerHTML;
      const read=field=>{const m=html.match(new RegExp('"'+field+'"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")'));if(!m)throw Error('A sessão Google ainda não está disponível nesta guia.');return JSON.parse(m[1]);};
      const query=new URLSearchParams({rpcids:method,'source-path':location.pathname,'f.sid':read('FdrFJe'),authuser:account,hl:'pt-BR',rt:'c'});
      const body=new URLSearchParams({'f.req':JSON.stringify([[[method,JSON.stringify(params),null,'generic']]]),at:read('SNlM0e')});
      const response=await fetch('/_/LabsTailwindUi/data/batchexecute?'+query,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body,signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error('O Notebook respondeu HTTP '+response.status+' na etapa '+method+'.');
      for(const line of (await response.text()).split('\n')){
        let chunk;try{chunk=JSON.parse(line);}catch{continue;}
        if(!Array.isArray(chunk))continue;
        for(const row of Array.isArray(chunk[0])?chunk:[chunk]){
          if(row[0]==='er'&&row[1]===method)throw Error('O Notebook recusou a etapa '+method+' (código '+row[2]+').');
          if(row[0]==='wrb.fr'&&row[1]===method){if(row[2]===null&&!allowNull)throw Error('O Notebook não confirmou a etapa '+method+'.');return typeof row[2]==='string'?JSON.parse(row[2]):row[2];}
        }
      }
      throw Error('Resposta do Notebook não reconhecida na etapa '+method+'.');
    }
    async function sources(){const result=await rpc('rLM1Ne',[notebookId,null,options,null,0]);if(!Array.isArray(result?.[0])||(result[0][1]!=null&&!Array.isArray(result[0][1])))throw Error('Não foi possível conferir a lista de fontes.');return (result[0][1]||[]).map(s=>({id:Array.isArray(s?.[0])?s[0][0]:s?.[0],name:s?.[1],status:s?.[3]?.[1]}));}
    if(request.action==='list')return {ok:true,sources:await sources()};
    if(request.action==='status'){
      const list=await sources();
      const matches=request.sourceId?list.filter(s=>s.id===request.sourceId):list.filter(s=>s.name===request.name&&!(request.previousIds||[]).includes(s.id));
      if(matches.length>1)throw Error('Há mais de uma fonte nova com esse nome. O envio foi preservado para conferência.');
      const source=matches[0];return {ok:true,found:!!source,sourceId:source?.id,status:source?.status,ready:source?.status===2,failed:source?.status===3};
    }
    if(request.action==='release'){if(window[key]?.token===request.token)delete window[key];return {ok:true};}
    if(request.action==='prepare'){
      if(!Number.isSafeInteger(request.size)||request.size<5||request.size>200*1024*1024)throw Error('Tamanho de PDF inválido.');
      const previous=window[key];
      if(previous?.token===request.token&&previous.size===request.size)return {ok:true,received:previous.received,index:previous.index};
      window[key]={token:request.token,name:request.name,size:request.size,parts:[],received:0,index:0};
      return {ok:true,received:0,index:0};
    }
    const state=window[key];if(!state||state.token!==request.token)throw Error('O conteúdo temporário desta guia mudou. Use Anexar PDF pendente para retomar.');
    if(request.action==='chunk'){
      if(state.registrationRequested)throw Error('O registro da fonte já foi iniciado.');
      if(request.index!==state.index||typeof request.base64!=='string'||request.base64.length>700000)throw Error('Bloco de PDF inválido.');
      const bytes=Uint8Array.from(atob(request.base64),c=>c.charCodeAt(0));
      if(state.received+bytes.length>state.size)throw Error('O PDF excedeu o tamanho declarado.');
      state.parts.push(bytes);state.received+=bytes.length;state.index++;return {ok:true};
    }
    if(request.action==='check'){
      if(state.received!==state.size)throw Error('O PDF ainda não chegou inteiro à guia.');
      const pdf=new Blob(state.parts,{type:'application/pdf'});
      if(!new TextDecoder().decode(await pdf.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('Conteúdo recebido não é PDF.');
      state.checked=true;return {ok:true,previousIds:(await sources()).map(s=>s.id)};
    }
    if(request.action==='remove-source'){
      if(!state.checked)throw Error('O PDF novo precisa ser validado antes da limpeza.');
      if(!request.allowedIds?.includes(request.removeId)||typeof request.removeId!=='string')throw Error('Fonte fora da seleção de limpeza.');
      if((await sources()).some(s=>s.id===request.removeId))await rpc('tGMBJ',[[[request.removeId]]],true);
      if((await sources()).some(s=>s.id===request.removeId))throw Error('A exclusão da fonte ainda não foi confirmada.');
      return {ok:true,removedId:request.removeId};
    }
    if(request.action==='register'){
      if(state.registrationRequested)throw Error('O registro já foi solicitado. Confira a fonte antes de repetir.');
      state.registrationRequested=true;
      const result=await rpc('o4cbdc',[[[state.name]],notebookId,options]);
      function id(node){if(typeof node==='string'&&/^[a-f0-9]{8}-[a-f0-9-]{27,}$/i.test(node))return node;if(Array.isArray(node))for(const item of node){const value=id(item);if(value)return value;}return null;}
      const sourceId=id(result);if(!sourceId)throw Error('A fonte foi solicitada, mas seu identificador não foi reconhecido. Não repetir automaticamente.');
      return {ok:true,sourceId};
    }
    if(request.action==='send'){
      if(state.received!==state.size||!request.sourceId)throw Error('PDF ou identificação de fonte incompletos.');
      if(state.sent)throw Error('O envio já foi solicitado. Confira o processamento antes de repetir.');
      const response=await fetch('/upload/_/?authuser='+encodeURIComponent(account),{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','x-goog-authuser':account,'x-goog-upload-command':'start','x-goog-upload-header-content-length':String(state.size),'x-goog-upload-header-content-type':'application/pdf','x-goog-upload-protocol':'resumable'},body:JSON.stringify({PROJECT_ID:notebookId,SOURCE_NAME:state.name,SOURCE_ID:request.sourceId}),signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error('Não foi possível iniciar o upload (HTTP '+response.status+').');
      const address=response.headers.get('x-goog-upload-url');if(!address)throw Error('O Notebook não devolveu o endereço de upload.');
      const url=new URL(address,location.origin);
      if(url.origin!==location.origin||!url.pathname.startsWith('/upload/'))throw Error('O Notebook devolveu um destino de upload inesperado.');
      state.sent=true;
      const uploaded=await fetch(url.href,{method:'POST',credentials:'include',headers:{'Content-Type':'application/pdf','x-goog-authuser':account,'x-goog-upload-command':'upload, finalize','x-goog-upload-offset':'0'},body:new Blob(state.parts,{type:'application/pdf'}),signal:AbortSignal.timeout(240000)});
      if(!uploaded.ok)throw Error('O upload não foi confirmado (HTTP '+uploaded.status+'). Confira a fonte antes de repetir.');
      state.parts=[];return {ok:true,sourceId:request.sourceId,httpStatus:uploaded.status};
    }
    throw Error('Etapa de envio desconhecida.');
  } catch(error){return {ok:false,error:error.message||String(error)};}
};
