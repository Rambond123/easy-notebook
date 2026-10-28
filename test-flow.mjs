import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const state={},events=[];let handler;
globalThis.chrome={
  action:{onClicked:{addListener(){}}},runtime:{onInstalled:{addListener(){}},onStartup:{addListener(){}},onMessage:{addListener(fn){handler=fn;}},getManifest:()=>({version:'0.18.0'}),getURL:path=>'chrome-extension://test/'+path},
  storage:{onChanged:{addListener(){}},local:{async get(){return {notebook:'https://notebook.google.com/notebook/test'};},async set(){}},session:{async get(key){return Object.fromEntries((Array.isArray(key)?key:[key]).map(k=>[k,state[k]]));},async set(data){Object.assign(state,data);},async remove(key){delete state[key];}}},
  tabs:{async create(data){events.push(['create',data]);return {id:7};},async update(id,data){assert.ok(state['treeJob:7']);events.push(['navigate',data]);}},
  scripting:{async executeScript({func,world,args=[]}){assert.equal(world,'MAIN');return [{result:await func(...args)}];}}
};
await import('./background.js');
const sender={tab:{id:7},url:'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar'};
const call=message=>new Promise(resolve=>handler({clientVersion:'0.18.0',...message},sender,resolve));
const url='https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_consultar_arvore_sistema_externo&hash=test';
assert.equal((await call({type:'START_TREE',url})).value.ok,true);
assert.equal(events[1][1].url,url);
assert.ok((await call({type:'TREE_JOB'})).value.started);
assert.ok((await call({type:'TREE_JOB'})).value.started, 'Uma página intermediária não pode consumir a tarefa.');
sender.tab.id=9;
sender.url='https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=arvore_documento_listar&txtNumProcesso=50545731720254047100';
// The real bridge link carries this parameter; exercise a different tab ID.
state.treeFlow.processNumber='50545731720254047100';
assert.ok((await call({type:'TREE_JOB'})).value.started,'A árvore em outra aba deve recuperar a tarefa pelo processo.');
assert.ok((await call({type:'TREE_JOB',ready:true})).value.started);
assert.equal((await call({type:'TREE_JOB'})).value,null);
assert.ok((await call({type:'START_TREE',url:'https://example.com/'})).error);
const externalTree='https://eprocv2-consulta-rs.trf4.jus.br/eprocV2/controlador.php?acao=arvore_documento_listar&txtNumProcesso=50010639520264047119';
assert.equal((await call({type:'START_TREE',url:externalTree})).value.ok,true,'A árvore originária redirecionada deve permanecer no fluxo.');
sender.tab.id=10;
sender.url=externalTree;
assert.ok((await call({type:'TREE_JOB'})).value.started,'A árvore originária no domínio externo deve recuperar a tarefa.');
assert.match((await call({type:'MARK_ALL',clientVersion:'0.7.0'})).error,/versão antiga/);
const contentSource=await readFile(new URL('./content.js',import.meta.url),'utf8');
assert.match(contentSource,/await selectAll\(\);\s*status\([\s\S]*?await rpc\(\{type:'GENERATE_PDF',printOnly:true\}\);/,'O envio automático deve concluir a marcação pelo caminho comprovado antes de pedir a impressão.');
let marked=false,printed=false;
const originalConfirm=()=>false,originalAlert=()=>{};
globalThis.window={confirm:originalConfirm,alert:originalAlert};
window.checkTodosDocsArvore=()=>{marked=true;};
window.gerarVersaoImpressao=()=>{assert.ok(marked);assert.equal(window.confirm('Gerar PDF?'),true);printed=true;};
const controls=[
  {textContent:'Marcar todos',getAttribute:()=> 'Marcar todos',click(){marked=true;}},
  {textContent:'49 MB Versão p/ impressão',getAttribute:()=> 'Gera arquivo único em PDF concatenando os documentos selecionados',click(){assert.ok(marked);assert.equal(window.confirm('Gerar PDF?'),true);window.alert('aviso');printed=true;}}
];
const documents=Array.from({length:62},()=>({closest:()=>({querySelector:()=>({classList:{contains:()=>marked}})})}));
globalThis.document={querySelector:selector=>selector.includes('checkTodosDocsArvore')?controls[0]:controls[1],querySelectorAll:selector=>selector.includes('eventoDocumento_')?documents:controls};
assert.deepEqual((await call({type:'GENERATE_PDF'})).value,{ok:true,clicked:'print'});
assert.ok(printed);assert.equal(window.confirm,originalConfirm);assert.equal(window.alert,originalAlert);
marked=false;printed=false;
assert.deepEqual((await call({type:'MARK_ALL'})).value,{ok:true,clicked:'mark-all'});
assert.ok(marked);assert.equal(printed,false,'Marcar todos manual não deve gerar PDF.');
printed=false;
const originalMark=window.checkTodosDocsArvore;
window.checkTodosDocsArvore=()=>{throw Error('Marcação não deve ser repetida durante a impressão.');};
assert.deepEqual((await call({type:'GENERATE_PDF',printOnly:true})).value,{ok:true,clicked:'print'});
assert.ok(printed);
printed=false;
const failure=await call({type:'MARK_ALL'});
assert.match(failure.error,/Falha ao marcar todos: Marcação não deve ser repetida/,'A falha original deve chegar ao painel.');
assert.equal(printed,false);
window.checkTodosDocsArvore=originalMark;
let initializationAttempts=0;
window.checkTodosDocsArvore=()=>{if(++initializationAttempts<3)throw new TypeError("Cannot read properties of undefined (reading 'check_all')");marked=true;};
assert.deepEqual((await call({type:'MARK_ALL'})).value,{ok:true,clicked:'mark-all'});
assert.equal(initializationAttempts,3,'Deve aguardar a inicialização tardia da árvore.');
window.checkTodosDocsArvore=originalMark;
console.log('Aprovado: chamadas às funções nativas do eproc, marcação antes da impressão, erro original preservado e retomada na árvore. O teste simula a página e não confirma o resultado no navegador.');
const notebook='https://notebook.google.com/notebook/test-123';
chrome.storage.local.get=async()=>({notebook});
const notebookEvents=[];
chrome.tabs.query=async()=>{throw Error('Não deve consultar nem reutilizar guias anteriores.');};
chrome.tabs.create=async options=>{notebookEvents.push(['create',options]);return {id:88};};
chrome.tabs.update=async(id,options)=>{notebookEvents.push(['update',id,options]);};
sender.tab.id=9;sender.url='chrome-extension://test/transfer.html?automatic=1';
assert.equal((await call({type:'OPEN_NOTEBOOK',id:'pdf-test'})).value.ok,true);
assert.equal(state.pendingNotebookTab,88);
assert.deepEqual(notebookEvents,[['create',{url:'about:blank',active:true}],['update',88,{url:notebook,active:true}]]);
sender.tab.id=99;sender.url=notebook;
assert.equal((await call({type:'FILE_INFO'})).value,null,'Outra guia do mesmo notebook não deve receber o arquivo.');
console.log('Aprovado: notebook em guia nova e envio restrito à guia recém-criada.');







