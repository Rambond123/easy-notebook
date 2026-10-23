// This function is serialized by chrome.scripting: keep it self-contained.
globalThis.easyNotebookGeneratePDF = async function generatePDF(markOnly=false) {
  let stage='localizar os controles';
  try {
  const deadline=Date.now()+20000;
  let mark,print;
  while(Date.now()<deadline){
    const controls=[...document.querySelectorAll('#divOpcoesDocumentos a, #divOpcoesDocumentos button, #divOpcoesDocumentos input[type="button"]')];
    const label=el=>(el.getAttribute('aria-label')||el.textContent||el.value||el.title||'').replace(/\s+/g,' ').trim();
    mark=document.querySelector('#divOpcoesDocumentos a[onclick*="checkTodosDocsArvore"]')||controls.find(el=>/^Marcar\s*todos$/i.test(label(el)));
    print=document.querySelector('#divOpcoesDocumentos a[onclick*="gerarVersaoImpressao"]')||controls.find(el=>/Gera arquivo único em PDF|Versão\s*p\/\s*impressão/i.test(label(el)));
    if(mark&&(markOnly===true||print))break;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!mark||(markOnly!==true&&!print))throw Error('A árvore abriu, mas seus controles não ficaram disponíveis em 20 segundos.');
  stage='marcar todos';
  if(markOnly!=='print'){
    if(typeof window.checkTodosDocsArvore!=='function')throw Error('A função checkTodosDocsArvore do eproc não está disponível no contexto da página.');
    const readyDeadline=Date.now()+30000;
    while(true){
      try{window.checkTodosDocsArvore();break;}
      catch(error){
        // The controls exist before eproc assigns its internal arvoreJs.
        // A missing check_all fails before selecting anything; retry only it.
        if(!/check_all/.test(error?.message||'') || Date.now()>=readyDeadline)throw error;
        await new Promise(resolve=>setTimeout(resolve,500));
      }
    }
  }
  if(markOnly===true)return {ok:true,clicked:'mark-all'};
  stage='gerar a versão para impressão';
  const originalConfirm=window.confirm,originalAlert=window.alert;
  window.confirm=()=>true;window.alert=()=>{};
  try{
    if(typeof window.gerarVersaoImpressao!=='function')throw Error('A função gerarVersaoImpressao do eproc não está disponível no contexto da página.');
    window.gerarVersaoImpressao();
  }finally{window.confirm=originalConfirm;window.alert=originalAlert;}
  return {ok:true,clicked:'print'};
  } catch(error) { return {ok:false,stage,error:error?.message||String(error)}; }
};
