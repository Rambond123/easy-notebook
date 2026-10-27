import {gaiaTabs,queryGaia,importGaiaPrompts} from './gaia-import.js';
export async function setupGaiaOptions(onImported){
  const $=id=>document.getElementById(id),selected=new Set();let prompts=[],busy=false;
  const report=text=>$('gaia-status').textContent=text;
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const visible=()=>prompts.filter(p=>normalize([p.title,p.description,p.author].join(' ')).includes(normalize($('gaia-search').value)));
  const count=()=>{$('gaia-count').textContent=`${selected.size} selecionados · ${visible().length} de ${prompts.length} prompts exibidos`;$('gaia-import').disabled=busy||!selected.size;};
  function setBusy(value){busy=value;$('gaia-library').setAttribute('aria-busy',String(value));for(const el of $('gaia-library').querySelectorAll('button,input,select'))el.disabled=value;count();}
  async function run(work){if(busy)return;setBusy(true);try{await work();}catch(error){report(error.message);}finally{setBusy(false);}}
  function draw(){
    $('gaia-results').replaceChildren();
    for(const prompt of visible()){
      const card=document.createElement('article'),label=document.createElement('label'),box=document.createElement('input'),content=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small'),description=document.createElement('p'),preview=document.createElement('button');
      card.className='gaia-card';box.type='checkbox';box.checked=selected.has(prompt.id);box.disabled=busy;box.setAttribute('aria-label',`Selecionar ${prompt.title} (${prompt.id})`);
      box.onchange=()=>{if(box.checked)selected.add(prompt.id);else selected.delete(prompt.id);count();};
      title.textContent=prompt.title;meta.textContent=[prompt.author,prompt.visibility,prompt.updated,'ID …'+prompt.id.slice(-8)].filter(Boolean).join(' · ');
      description.textContent=prompt.description;content.append(title,meta);label.append(box,content);preview.textContent='Ver texto';preview.className='secondary';preview.disabled=busy;
      preview.onclick=()=>run(async()=>{report('Lendo o texto completo…');const result=await queryGaia(Number($('gaia-tab').value),'read',prompt.id);if(result.prompt.id!==prompt.id||result.prompt.origin!==prompt.origin)throw Error('A guia mudou. Busque a lista novamente.');$('gaia-preview-title').textContent=result.prompt.title+(result.prompt.version?' · versão '+result.prompt.version:'');$('gaia-preview-text').textContent=result.prompt.body;$('gaia-preview').showModal();report('Prévia aberta. Nenhum prompt foi executado.');});
      card.append(label,description,preview);$('gaia-results').append(card);
    }
    count();
  }
  async function refreshTabs(){
    const previous=$('gaia-tab').value,tabs=await gaiaTabs();$('gaia-tab').replaceChildren(new Option('Escolha a guia do eproc',''));
    for(const tab of tabs)$('gaia-tab').append(new Option(tab.title+' — '+new URL(tab.origin).hostname,String(tab.id)));
    if(tabs.some(tab=>String(tab.id)===previous))$('gaia-tab').value=previous;else if(tabs.length===1)$('gaia-tab').value=String(tabs[0].id);
    prompts=[];selected.clear();draw();report(tabs.length?'Escolha a guia com a biblioteca da Gaia e clique em Buscar prompts.':'Abra o eproc neste navegador, entre na sua conta e na biblioteca de prompts da Gaia. Depois clique em Atualizar guias.');
  }
  $('gaia-tabs').onclick=()=>run(refreshTabs);
  $('gaia-tab').onchange=()=>{prompts=[];selected.clear();draw();report('Clique em Buscar prompts para consultar esta guia.');};
  $('gaia-list').onclick=()=>run(async()=>{
    prompts=[];selected.clear();draw();if(!$('gaia-tab').value)throw Error('Escolha uma guia do eproc.');report('Consultando a biblioteca da Gaia…');
    const result=await queryGaia(Number($('gaia-tab').value),'list');prompts=result.prompts;draw();report(prompts.length?`${prompts.length} prompts encontrados. Marque os que deseja importar.`:'Nenhum prompt disponível nesta biblioteca.');
  });
  $('gaia-search').oninput=draw;
  $('gaia-select-visible').onclick=()=>{for(const prompt of visible())selected.add(prompt.id);draw();};
  $('gaia-clear').onclick=()=>{selected.clear();draw();};
  $('gaia-import').onclick=()=>run(async()=>{
    const total=await importGaiaPrompts(Number($('gaia-tab').value),prompts.filter(prompt=>selected.has(prompt.id)),report);
    selected.clear();draw();await onImported();report(`${total} prompts importados ou atualizados. Já estão disponíveis no painel do Notebook.`);
  });
  $('gaia-preview-close').onclick=()=>$('gaia-preview').close();
  await refreshTabs();
}
