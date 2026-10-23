// Reloading an extension invalidates content scripts still running in existing tabs.
globalThis.easyNotebookSession=function(){
  const message='A extensão foi atualizada. Atualize esta página para continuar.';
  let stopped=false;const listeners=new Set();
  function stop(){if(stopped)return;stopped=true;for(const listener of listeners)listener();listeners.clear();}
  function active(){if(stopped)return false;try{if(chrome.runtime.id)return true;}catch{}stop();return false;}
  async function call(operation){
    if(!active())throw Error(message);
    try{const result=await operation();if(!active())throw Error(message);return result;}catch(error){
      if(/extension context invalidated/i.test(error?.message||String(error))||!active()){stop();throw Error(message);}
      throw error;
    }
  }
  return {active,call,message,notify:operation=>{void call(operation).catch(()=>{});},onInvalid(listener){if(stopped)listener();else listeners.add(listener);}};
};
