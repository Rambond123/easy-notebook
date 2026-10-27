// Decide whether an eproc page represents one individual process.
globalThis.easyNotebookIsProcessPage=function(doc=document,href=location.href){
  let url;
  try{url=new URL(href);}catch{return false;}
  const action=url.searchParams.get('acao')||'';

  // The editor may retain a process number in its URL, but sending the
  // process from a draft is both confusing and outside the intended flow.
  if(/(?:minuta|documento.*(?:editar|redigir)|editor|editar.*documento)/i.test(action))return false;
  if(doc.querySelector('#frmEditorMinuta,#divEditorMinuta,.editor-minuta,[data-editor-minuta]'))return false;

  // Listing and management routes can contain a process number as a filter.
  if(/(?:^|_)(?:localizador|lista|painel|relatorio)(?:_|$)/i.test(action))return false;

  const processKeys=['num_processo','txtNumProcesso','numProcesso','numeroProcesso'];
  if(processKeys.some(key=>(url.searchParams.get(key)||'').replace(/\D/g,'').length===20))return true;

  if(doc.querySelector('#divArvore,#ifrLeitorPdf,#divOpcoesDocumentos'))return true;

  const details=[...doc.querySelectorAll('h1,h2,h3,[role="heading"]')]
    .some(el=>/Consulta Processual.*Detalhes do Processo/i.test((el.textContent||'').replace(/\s+/g,' ')));
  if(details)return true;

  return ['processo_selecionar','processo_consultar'].includes(action)&&Boolean(doc.querySelector('#divRelacionados'));
};
