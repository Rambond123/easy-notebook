// Synthetic eproc pages: this test never connects to the tribunal or a Google account.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const repo=path.resolve(__dirname,'..');
  const fixture=`<!doctype html><html lang="pt-BR"><title>Gaia — biblioteca de teste</title><body><div id="app"></div><script>
  window.items=Array.from({length:105},(_,i)=>({id:'10000000000000000000000'+String(i+1).padStart(4,'0'),title:i<2?'Título repetido':'Prompt '+(i+1),description:i<2?'Categoria especial':'Descrição '+(i+1),body:'Texto completo '+(i+1)+'\\n<img src=x onerror=alert(1)>',author:'Autor de teste',version:'1'}));
  let page=0,size=10;
  window.carregarModalIndexPrompts=()=>{
    document.querySelector('#app').innerHTML='<input id="tituloDescricao"><button class="btnFiltrarPrompts">Filtrar</button><div id="tbl_prompts_length"><select><option>10</option><option>100</option></select></div><table id="tbl_prompts"><tbody></tbody></table><div id="tbl_prompts_info"></div><button id="tbl_prompts_previous">Anterior</button><button id="tbl_prompts_next">Próxima</button>';
    const select=document.querySelector('select');select.value=String(size);select.onchange=()=>{size=Number(select.value);page=0;draw();};
    document.querySelector('.btnFiltrarPrompts').onclick=()=>{page=0;draw();};
    document.querySelector('#tbl_prompts_previous').onclick=()=>{page--;draw();};document.querySelector('#tbl_prompts_next').onclick=()=>{page++;draw();};draw();
  };
  function draw(){const filtered=items.filter(x=>x.title.includes(document.querySelector('#tituloDescricao').value));const visible=filtered.slice(page*size,(page+1)*size);const body=document.querySelector('tbody');body.replaceChildren();
    for(const item of visible){const row=document.createElement('tr');for(const str of ['lock '+item.title,item.description,item.author,'01/01/2026','02/01/2026']){const cell=document.createElement('td');cell.textContent=str;row.append(cell);}const td=document.createElement('td'),a=document.createElement('a');a.className='btnConsultar';a.href='javascript:void(0)';a.textContent='Consultar';a.setAttribute('onclick',"consultar('IdLlmPrompt="+item.id+"&IdLlmPromptVersaoCorrente=9001')");td.append(a);row.append(td);body.append(row);body.append(row.cloneNode(true));}
    document.querySelector('#tbl_prompts_info').textContent='Mostrando de '+(page*size+1)+' até '+Math.min((page+1)*size,filtered.length)+' de '+filtered.length+' registros';
    document.querySelector('#tbl_prompts_previous').className=page===0?'disabled':'';document.querySelector('#tbl_prompts_next').className=(page+1)*size>=filtered.length?'disabled':'';
  }
  window.consultar=params=>{const id=new URLSearchParams(params).get('IdLlmPrompt'),item=items.find(x=>x.id===id);document.querySelector('#app').innerHTML='<form id="frmLlmPrompt"><input id="id_llm_prompt"><input id="id_llm_prompt_versao"><input id="seq_versao"><input id="titulo"><input id="descricao"><textarea id="prompt"></textarea></form>';for(const [key,value] of Object.entries({id_llm_prompt:id,id_llm_prompt_versao:'9001',seq_versao:item.version,titulo:item.title,descricao:item.description,prompt:item.body}))document.getElementById(key).value=value;};carregarModalIndexPrompts();
  </script></body></html>`;
  const profile=await fs.mkdtemp(path.join(repo,'.gaia-profile-'));
  const context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE, args:[`--disable-extensions-except=${repo}`,`--load-extension=${repo}`],viewport:{width:1100,height:900}});
  const errors=[];context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  try{
    await context.route('https://eproc.trf4.jus.br/**',route=>route.fulfill({contentType:'text/html',body:fixture}));
    await context.route('https://notebook.google.com/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Notebook sintético</title><textarea aria-label="Entrada de chat"></textarea>'}));
    const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const extensionId=new URL(worker.url()).host;
    const original={notebook:'https://notebook.google.com/notebook/test',replaceSources:false,setupVersion:1,localPrompts:[{id:'local',title:'Texto local',body:'Preservar',source:'local'}],drivePrompts:[{id:'legacy',title:'Texto antigo',body:'Preservar',source:'drive'}]};
    await worker.evaluate(data=>chrome.storage.local.set(data),original);
    const eproc=await context.newPage();await eproc.goto('https://eproc.trf4.jus.br/controlador.php?acao=inteligencia_artificial/llm_prompt/index');
    const page=await context.newPage();await page.goto('chrome-extension://'+extensionId+'/options.html');
    await page.locator('#gaia-list').click();await page.waitForFunction(()=>document.querySelector('#gaia-status').textContent.includes('105 prompts encontrados'));
    assert.equal(await page.locator('.gaia-card').count(),105);
    await page.locator('#gaia-search').fill('especial');assert.equal(await page.locator('.gaia-card').count(),2);
    await page.locator('.gaia-card button').first().click();await page.locator('#gaia-preview').waitFor({state:'visible'});
    assert.match(await page.locator('#gaia-preview-text').textContent(),/<img src=x onerror=alert\(1\)>/);assert.equal(await page.locator('#gaia-preview img').count(),0);
    await page.locator('#gaia-preview-close').click();await page.locator('#gaia-select-visible').click();
    await page.locator('#gaia-import').click();await page.waitForFunction(()=>document.querySelector('#gaia-status').textContent.includes('2 prompts importados'));
    let stored=await worker.evaluate(()=>chrome.storage.local.get(null));assert.equal(stored.gaiaPrompts.length,2);assert.deepEqual(stored.localPrompts,original.localPrompts);assert.deepEqual(stored.drivePrompts,original.drivePrompts);
    await eproc.evaluate(()=>{items[0].body='Nova versão';items[0].version='2';});
    await page.locator('#gaia-select-visible').click();await page.locator('#gaia-import').click();await page.waitForFunction(()=>document.querySelector('#gaia-status').textContent.includes('2 prompts importados'));
    stored=await worker.evaluate(()=>chrome.storage.local.get(null));assert.equal(stored.gaiaPrompts.length,2);assert.equal(stored.gaiaPrompts[0].body,'Nova versão');assert.equal(stored.gaiaPrompts[0].version,'2');
    // A last-page prompt proves pagination applies to both listing and full-text reads.
    await page.locator('#gaia-search').fill('Prompt 105');await page.locator('#gaia-select-visible').click();await page.locator('#gaia-import').click();await page.waitForFunction(()=>document.querySelector('#gaia-status').textContent.includes('1 prompts importados'));
    stored=await worker.evaluate(()=>chrome.storage.local.get(null));assert.equal(stored.gaiaPrompts.length,3);assert.match(stored.gaiaPrompts[2].body,/Texto completo 105/);
    await page.locator('#notebook').fill('https://example.com/');await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('notebook específico'));assert.equal((await worker.evaluate(()=>chrome.storage.local.get('notebook'))).notebook,original.notebook);
    await page.locator('#notebook').fill('https://notebook.google.com/notebook/test?authuser=2');await page.locator('#replaceSources').check();await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Configurações salvas'));
    await page.reload();assert.equal(await page.locator('#replaceSources').isChecked(),true);assert.match(await page.locator('#notebook').inputValue(),/authuser=2/);assert.equal(await page.locator('#apiKey,#folder').count(),0);
    await fs.mkdir(path.join(repo,'test-results'),{recursive:true});await page.locator('#gaia-list').click();await page.waitForFunction(()=>document.querySelector('#gaia-status').textContent.includes('105 prompts encontrados'));await page.locator('#gaia-search').fill('especial');await page.evaluate(()=>scrollTo(0,document.querySelector('#gaia-library').offsetTop-110));await page.screenshot({path:path.join(repo,'test-results','gaia-configuracoes.png')});
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
    const wizard=await context.newPage();await wizard.goto('chrome-extension://'+extensionId+'/wizard.html');await wizard.locator('#next').click();await wizard.locator('#next').click();await wizard.locator('#next').click();await wizard.locator('[name=prompts][value=gaia]').check();await wizard.locator('#next').click();assert.match(await wizard.locator('#review-prompts').textContent(),/Gaia/);await wizard.locator('#next').click();await wizard.locator('#done').waitFor({state:'visible'});assert.equal((await worker.evaluate(()=>chrome.storage.local.get('promptSource'))).promptSource,'gaia');
    const notebook=await context.newPage();await notebook.goto('https://notebook.google.com/notebook/test');await notebook.locator('#easy-notebook-host #toggle').click();
    await notebook.getByRole('button',{name:'Usar',exact:true}).nth(1).click();assert.equal(await notebook.locator('textarea').inputValue(),'Nova versão');
    await worker.evaluate(()=>chrome.storage.local.set({gaiaPrompts:[]}));await notebook.waitForFunction(()=>document.querySelector('#easy-notebook-host').shadowRoot.querySelectorAll('.prompt-list article').length===2);
    assert.deepEqual(errors,[]);console.log('PASS: extensão real em Chromium isolado, 105 prompts sintéticos, paginação, títulos repetidos, prévia segura, importação, atualização, preservação, painel do Notebook, configurações e assistente.');
  }finally{await context.close();await fs.rm(profile,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
