globalThis.easyNotebookFindUploadInput=async function({report=()=>{},timeout=20000,triggerOnly=false,pause=()=>new Promise(r=>setTimeout(r,250))}={}){
  const visible=el=>el.getClientRects().length>0;
  const button=pattern=>[...document.querySelectorAll('button,[role="button"]')].find(el=>visible(el)&&[el.getAttribute('aria-label'),el.textContent,...[...el.querySelectorAll('span')].map(span=>span.textContent)].some(label=>pattern.test((label||'').replace(/\s+/g,' ').trim())));
  const clicked=new Set(),deadline=Date.now()+timeout;
  while(Date.now()<deadline){
    if(triggerOnly){const zone=[...document.querySelectorAll('[xapscottyuploaderdropzone]')].find(visible);if(zone)return zone;}
    const inputs=[...document.querySelectorAll('input[type="file"]')];
    const input=inputs.reverse().find(el=>!el.disabled&&(!el.accept||/pdf/i.test(el.accept)));
    if(input)return input;
    const trigger=[...document.querySelectorAll('button[xapscottyuploadertrigger]')].find(visible)||button(/^(Enviar arquivos|Upload files)$/i);
    if(trigger&&!clicked.has('upload')){
      if(triggerOnly)return trigger;
      clicked.add('upload');report('Abrindo Enviar arquivos…');trigger.click();
    }else if(!clicked.has('upload')){
      const add=button(/^(Adicionar fonte|Adicionar fontes|Add source|Add sources)$/i);
      if(add&&!clicked.has('add')){clicked.add('add');report('Abrindo a janela de adicionar fonte…');add.click();}
      else if(!clicked.has('add')){const sources=button(/^(Sources|Fontes)$/i);if(sources&&!clicked.has('sources')){clicked.add('sources');sources.click();}}
    }
    await pause();
  }
  throw Error(clicked.has('upload')?'Enviar arquivos foi acionado, mas o campo de arquivo não apareceu.':'Não localizei Enviar arquivos. Abra Adicionar fonte e tente Anexar PDF pendente.');
};
