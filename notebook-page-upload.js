// Serialized into the Notebook page by chrome.scripting; no external bindings.
globalThis.easyNotebookPageUpload=async function(request){
  const key='__easyNotebookUploadV1';
  try{
    if(request.action==='start'){
      const prior=window[key];if(prior?.cleanup)prior.cleanup();
      const state={token:request.token,name:request.name,size:request.size,parts:[],received:0,index:0,input:null};window[key]=state;
      const zone=[...document.querySelectorAll('[xapscottyuploaderdropzone]')].find(el=>el.getClientRects().length);
      if(zone){state.zone=zone;return {ok:true,stage:'drop-ready'};}
      const inputs=[...document.querySelectorAll('input[type="file"]')];
      state.input=inputs.reverse().find(el=>el.name==='Filedata'&&!el.disabled)||null;
      if(!state.input){
        const trigger=[...document.querySelectorAll('button[xapscottyuploadertrigger],button')].find(el=>el.getClientRects().length&&[el.textContent,el.getAttribute('aria-label'),...[...el.querySelectorAll('span')].map(s=>s.textContent)].some(s=>/^(Enviar arquivos|Upload files)$/i.test((s||'').trim())));
        if(!trigger)throw Error('O botão Enviar arquivos não está na janela aberta.');
        const prototype=HTMLInputElement.prototype,originalClick=prototype.click,originalPicker=prototype.showPicker;
        let timer;
        const restore=()=>{if(prototype.click===interceptClick)prototype.click=originalClick;if(prototype.showPicker===interceptPicker)prototype.showPicker=originalPicker;clearTimeout(timer);};
        function capture(el){state.input=el;restore();}
        function interceptClick(...args){if(this.type==='file'){capture(this);return;}return originalClick.apply(this,args);}
        function interceptPicker(...args){if(this.type==='file'){capture(this);return;}return originalPicker.apply(this,args);}
        state.cleanup=restore;prototype.click=interceptClick;if(originalPicker)prototype.showPicker=interceptPicker;
        timer=setTimeout(restore,15000);
        try{
          trigger.click();
          const deadline=Date.now()+15000;while(!state.input&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
        }finally{restore();}
        if(!state.input)throw Error('O seletor do Google não criou o campo Filedata após Enviar arquivos.');
      }
      return {ok:true,stage:'input-ready'};
    }
    const state=window[key];if(!state||state.token!==request.token)throw Error('A janela de envio mudou. Tente anexar novamente.');
    if(request.action==='chunk'){
      if(request.index!==state.index||typeof request.base64!=='string'||request.base64.length>700000)throw Error('Bloco de envio inválido.');
      const bytes=Uint8Array.from(atob(request.base64),c=>c.charCodeAt(0));if(state.received+bytes.length>state.size)throw Error('Tamanho de envio inválido.');
      state.parts.push(bytes);state.received+=bytes.length;state.index++;return {ok:true};
    }
    if(request.action==='finish'){
      if(state.received!==state.size)throw Error('O PDF ainda não foi recebido inteiro.');
      const file=new File(state.parts,state.name,{type:'application/pdf'}),data=new DataTransfer();data.items.add(file);
      if(state.zone){
        if(!state.zone.isConnected)throw Error('A janela de adicionar fontes fechou antes da entrega do PDF.');
        data.effectAllowed='all';data.dropEffect='copy';
        for(const type of ['dragenter','dragover','drop'])state.zone.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,composed:true,dataTransfer:data}));
      }else{
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'files').set.call(state.input,data.files);
        state.input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      state.parts=[];delete window[key];return {ok:true,stage:'file-submitted'};
    }
    if(request.action==='abort'){state.cleanup?.();delete window[key];return {ok:true};}
    throw Error('Etapa de envio inválida.');
  }catch(error){const state=window[key];state?.cleanup?.();if(state)state.parts=[];delete window[key];return {ok:false,error:error.message||String(error)};}
};
