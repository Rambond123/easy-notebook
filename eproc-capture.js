globalThis.easyNotebookCapturePDF=async function(url,{rpc,report}){
  const source=new URL(url,location.href);
  if(source.origin!==location.origin||source.searchParams.get('acao')!=='download_documento_unificado')throw Error('O endereço não corresponde ao PDF completo desta árvore.');
  report('Capturando o PDF diretamente na sessão do eproc…');
  const response=await fetch(source.href,{credentials:'include',signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error(`Não foi possível capturar o PDF (${response.status}).`);
  const blob=await response.blob();
  if(!blob.size||blob.size>200*1024*1024||!new TextDecoder().decode(await blob.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('O eproc não devolveu um PDF válido de até 200 MB.');
  const {id}=await rpc({type:'CAPTURE_BEGIN',url:source.href,name:source.searchParams.get('arquivo')||'processo.pdf',size:blob.size});
  let index=0;
  try{
    for(let offset=0;offset<blob.size;offset+=524288){
      const bytes=new Uint8Array(await blob.slice(offset,offset+524288).arrayBuffer());
      let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      await rpc({type:'CAPTURE_CHUNK',id,index,base64:btoa(binary)});index++;
      report(`PDF capturado: ${Math.round(Math.min(offset+bytes.length,blob.size)/blob.size*100)}% transferido à extensão.`);
    }
    report('PDF capturado. Abrindo uma guia nova do notebook…');
    return await rpc({type:'CAPTURE_FINISH',id,chunks:index});
  }catch(error){await rpc({type:'CAPTURE_ABORT',id}).catch(()=>{});throw error;}
};
