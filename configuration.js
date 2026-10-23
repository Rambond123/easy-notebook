export function notebookURL(value){
  let url;try{url=new URL(typeof value==='string'?value.trim():'');}catch{throw Error('Cole o link de um notebook específico.');}
  if(url.protocol!=='https:'||!['notebook.google.com','notebooklm.google.com'].includes(url.hostname)||url.username||url.password||url.port||!/^\/notebook\/[\w-]+\/?$/.test(url.pathname))throw Error('Use o link de um notebook específico, e não o endereço da página inicial.');
  const account=url.searchParams.get('authuser');if(account!==null&&!/^\d+$/.test(account))throw Error('O número da conta Google no link não é válido. Abra o notebook na conta desejada e copie o link novamente.');
  url.searchParams.delete('addSource');return url.href;
}
export function setupProblem(settings){try{notebookURL(settings?.notebook);return '';}catch(error){return error.message;}}
export function driveFolder(value){let url;try{url=new URL(value);}catch{throw Error('Cole o link da pasta pública do Google Drive.');}if(url.protocol!=='https:'||url.hostname!=='drive.google.com'||!url.pathname.match(/\/folders\/([\w-]+)/))throw Error('Use um link de pasta pública do Google Drive.');return url.href;}
export const starterPrompt={id:'easy-notebook-starter-summary-v1',title:'Resumir o processo',body:'Com base apenas nas fontes deste notebook, apresente um resumo do processo. Organize os fatos relevantes, os pedidos, os argumentos das partes, as provas e as decisões já proferidas. Indique as fontes que sustentam cada ponto e sinalize as informações que não encontrar. Não invente fatos nem referências.',source:'local'};
