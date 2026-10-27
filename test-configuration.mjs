import assert from 'node:assert/strict';
import {notebookURL,setupProblem} from './configuration.js';
assert.equal(setupProblem({}), 'Cole o link de um notebook específico.');
for(const value of ['https://notebook.google.com/','http://notebook.google.com/notebook/test','https://example.com/notebook/test','https://notebook.google.com/notebook/test/other','https://x:y@notebook.google.com/notebook/test','https://notebook.google.com/notebook/test?authuser=bad'])assert.throws(()=>notebookURL(value));
assert.equal(notebookURL(' https://notebook.google.com/notebook/test?addSource=true&authuser=2 '),'https://notebook.google.com/notebook/test?authuser=2');
assert.equal(setupProblem({notebook:'https://notebooklm.google.com/notebook/test',folder:'',apiKey:''}), '','Biblioteca é opcional');
console.log('Configuração: destino específico, conta preservada, links inválidos rejeitados e biblioteca opcional.');
