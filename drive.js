export async function syncDrive() {
  const {folder,apiKey}=await chrome.storage.local.get(['folder','apiKey']);
  const url=new URL(folder||'');
  const id=url.pathname.match(/\/folders\/([\w-]+)/)?.[1];
  if(url.protocol!=='https:'||url.hostname!=='drive.google.com'||!id)throw Error('Configure uma pasta pública do Drive.');
  if(!apiKey)throw Error('Configure a chave da API do Drive.');
  const request=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Drive respondeu ${r.status}. Confira a chave e o acesso público.`);return r;};
  let files=[],page='';
  do {
    const params=new URLSearchParams({key:apiKey,q:`'${id}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,size)',pageSize:'100'});
    if(page)params.set('pageToken',page);
    const data=await(await request('https://www.googleapis.com/drive/v3/files?'+params)).json();files.push(...data.files);page=data.nextPageToken;
  }while(page);
  files=files.filter(f=>/\.(txt|md)$/i.test(f.name));
  if(!files.length)throw Error('Nenhum .txt ou .md encontrado. Biblioteca anterior mantida.');
  const prompts=[];
  for(const f of files){if(Number(f.size)>1000000)throw Error(`Prompt muito grande: ${f.name}`);const body=await(await request(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?alt=media&key=${encodeURIComponent(apiKey)}`)).text();if(body.length>1000000)throw Error('Prompt acima do limite de tamanho.');prompts.push({id:f.id,title:f.name.replace(/\.(txt|md)$/i,''),body,source:'drive'});}
  await chrome.storage.local.set({drivePrompts:prompts,lastSync:new Date().toISOString()});
  return prompts.length;
}
