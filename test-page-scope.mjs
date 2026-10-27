import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('./page-scope.js',import.meta.url),'utf8');
const context={globalThis:{},URL};
vm.runInNewContext(source,context);
const isProcess=context.globalThis.easyNotebookIsProcessPage;
const doc=({selectors=[],headings=[]}={})=>({
  querySelector(selector){return selectors.some(value=>selector.split(',').includes(value))?{}:null;},
  querySelectorAll(selector){return /heading|h1/.test(selector)?headings.map(text=>({textContent:text})):[];}
});

assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_selecionar&num_processo=50545731720254047100'),true);
assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=arvore_documento_listar&txtNumProcesso=50545731720254047100'),true);
assert.equal(isProcess(doc({selectors:['#divArvore']}),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=arvore_documento_listar'),true);
assert.equal(isProcess(doc({headings:['Consulta Processual - Detalhes do Processo']}),'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_consultar'),true);
assert.equal(isProcess(doc({selectors:['#divRelacionados']}),'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar'),true);
assert.equal(isProcess(doc(),'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_editar&num_processo=50545731720254047100'),false);
assert.equal(isProcess(doc(),'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=documento_editar&num_processo=50545731720254047100'),false);
assert.equal(isProcess(doc({selectors:['#frmEditorMinuta']}),'https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=processo_selecionar&num_processo=50545731720254047100'),false);

assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista'),false);
assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=localizador_processos_lista&num_processo=50545731720254047100'),false);
assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=processo_lista&txtNumProcesso=50545731720254047100'),false);
assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=painel_geral'),false);
assert.equal(isProcess(doc(),'https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=usuario_pagina_inicial'),false);
assert.equal(isProcess(doc(),'not a URL'),false);

console.log('Escopo aprovado: botão apenas em processo individual; localizadores, listas, painéis e páginas gerais excluídos.');
