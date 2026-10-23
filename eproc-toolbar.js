// Mount the existing extension button in the process-cover toolbar.
globalThis.easyNotebookEprocToolbar=function(positioner){
  function findPrint(){
    if(document.querySelector('#divArvore,#ifrLeitorPdf'))return null;
    const action=new URL(location.href).searchParams.get('acao')||'';
    const cover=['processo_selecionar','processo_consultar'].includes(action)||[...document.querySelectorAll('h1,h2,h3,[role="heading"]')].some(el=>/Consulta Processual.*Detalhes do Processo/i.test(el.textContent.replace(/\s+/g,' ')));
    if(!cover)return null;
    return [...document.querySelectorAll('button,input[type="button"],input[type="submit"],a,[role="button"]')].find(el=>el.getClientRects().length&&[el.getAttribute('aria-label'),el.value,el.textContent,el.title].some(label=>/^Imprimir$/i.test((label||'').replace(/\s+/g,' ').trim())));
  }
  function refresh(){const print=findPrint();if(print)positioner.dock(print);else positioner.undock();}
  let scheduled=false;
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh();});});
  observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('popstate',refresh);refresh();
};
