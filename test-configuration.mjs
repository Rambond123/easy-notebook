import assert from 'node:assert/strict';
import {notebookURL,setupProblem,driveFolder} from './configuration.js';
assert.equal(setupProblem({}), 'Cole o link de um notebook específico.');
for(const value of ['https://notebook.google.com/','http://notebook.google.com/notebook/test','https://example.com/notebook/test','https://notebook.google.com/notebook/test/other','https://x:y@notebook.google.com/notebook/test','https://notebook.google.com/notebook/test?authuser=bad'])assert.throws(()=>notebookURL(value));
assert.equal(notebookURL(' https://notebook.google.com/notebook/test?addSource=true&authuser=2 '),'https://notebook.google.com/notebook/test?authuser=2');
assert.equal(setupProblem({notebook:'https://notebooklm.google.com/notebook/test',folder:'',apiKey:''}), '','Drive é opcional');
assert.throws(()=>driveFolder('https://drive.google.com/file/d/test'));assert.equal(driveFolder('https://drive.google.com/drive/folders/test'),'https://drive.google.com/drive/folders/test');
console.log('Configuração: destino específico, conta preservada, links inválidos rejeitados e Drive opcional.');
