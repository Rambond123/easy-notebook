// Serialized by chrome.scripting: all page helpers must remain inside this function.
export async function gaiaPage(action, promptId = '') {
  try {
    if (!/^https:\/\/eproc\.(trf4|jfrs|jfsc|jfpr)\.jus\.br\//.test(location.href)) throw Error('Abra uma página interna do eproc.');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const table = () => document.querySelector('#tbl_prompts');
    const form = () => document.querySelector('#frmLlmPrompt');
    const menu = () => [...document.querySelectorAll('a')].find(el => {
      const target = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('onclick') || '');
      return /llm_prompt\/index(?:[&'"?\s]|$)/.test(target);
    });
    const click = el => {
      if (!el) throw Error('Controle da biblioteca não encontrado.');
      // Preserve eproc's onclick but do not navigate to javascript:void(0).
      if (/^javascript:/i.test(el.getAttribute('href') || '')) el.addEventListener('click', event => event.preventDefault(), {once:true});
      el.click();
    };
    const until = async (read, message, timeout = 20000) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) { const value = read(); if (value) return value; await wait(150); }
      throw Error(message);
    };
    const rows = () => {
      const result = new Map();
      for (const row of document.querySelectorAll('#tbl_prompts tbody tr')) {
        const link = row.querySelector('a.btnConsultar');
        const source = link?.getAttribute('onclick') || '';
        const id = source.match(/IdLlmPrompt=(\d+)(?:&|['"]|$)/)?.[1];
        const cells = [...row.querySelectorAll('td')].map(text);
        if (!id || cells.length < 5 || result.has(id)) continue;
        const icon = cells[0].match(/^(groups|lock|public|person)\s*/)?.[1];
        result.set(id, {id,title:cells[0].replace(/^(groups|lock|public|person)\s*/,''),description:cells[1],author:cells[2],updated:cells[4],versionId:source.match(/IdLlmPromptVersaoCorrente=(\d+)/)?.[1] || '',visibility:icon==='lock'?'Privado':icon==='groups'?'Compartilhado':'',origin:location.origin});
      }
      return [...result.values()];
    };
    const info = () => {
      const value = text(document.querySelector('#tbl_prompts_info'));
      // eproc uses "Mostrando de 1 até N de TOTAL registros". Keep the
      // English fallback for installations with a translated DataTable.
      const match = value.match(/(?:de\s+[\d.,]+\s+at[eé]\s+[\d.,]+\s+de|of)\s+([\d.,]+)/i);
      return match ? Number(match[1].replace(/\D/g,'')) : null;
    };
    const ready = async () => {
      await until(() => table() && info() !== null && (info()===0 || rows().length), 'A lista da Gaia não terminou de carregar. Abra a biblioteca de prompts e tente novamente.');
    };
    async function openList() {
      if (form()) {
        if (typeof window.carregarModalIndexPrompts === 'function') window.carregarModalIndexPrompts();
        else click([...form().querySelectorAll('button,a,input[type=button]')].find(el=>/^(Voltar|Cancelar)$/i.test(text(el)||el.value)));
        await until(()=>!form() && table(), 'Não foi possível voltar à biblioteca da Gaia.');
      }
      if (!table() || !table().getClientRects().length) {
        const opener = document.querySelector('.btnModalPrompts');
        if (opener) click(opener);
        else if (menu()) { click(menu()); return {navigating:true}; }
        else throw Error('Abra a área de prompts pelo menu do eproc ou a biblioteca de prompts na Gaia e clique em Buscar prompts novamente.');
      }
      await ready();
      const filter = document.querySelector('#tituloDescricao');
      const search = document.querySelector('.btnFiltrarPrompts');
      if (filter?.value && search) {
        filter.value=''; filter.dispatchEvent(new Event('input',{bubbles:true})); click(search);
        await wait(400); await ready();
      }
      const size = document.querySelector('#tbl_prompts_length select');
      if (size && [...size.options].some(option=>option.value==='100') && size.value!=='100') {
        size.value='100'; size.dispatchEvent(new Event('change',{bubbles:true}));
        await until(()=>info()!==null && rows().length===Math.min(100,info()),'A Gaia não terminou de atualizar a quantidade de prompts por página.');
        await ready();
      }
      const first = document.querySelector('#tbl_prompts_first');
      if (first && !first.classList.contains('disabled')) {click(first); await wait(250);await ready();}
      else {
        let guard=0;
        while (guard++<100) {
          const prev=document.querySelector('#tbl_prompts_previous');
          if(!prev||prev.classList.contains('disabled')||prev.getAttribute('aria-disabled')==='true')break;
          const before=rows().map(x=>x.id).join(',');click(prev);
          await until(()=>rows().map(x=>x.id).join(',')!==before,'A paginação da Gaia não respondeu.');
        }
      }
      return null;
    }
    if (action==='probe') return {ok:true,available:!!(table()||form()||document.querySelector('.btnModalPrompts')||menu()),origin:location.origin};
    if (!['list','read'].includes(action)) throw Error('Operação de consulta inválida.');
    if(action==='read'&&!/^\d+$/.test(promptId))throw Error('Identificador de prompt inválido.');
    const opened=await openList(); if(opened)return {ok:true,...opened};
    const found=new Map(); let selected;
    for(let page=0;page<100;page++) {
      const visible=rows();for(const row of visible)found.set(row.id,row);
      if(action==='read')selected=visible.find(row=>row.id===promptId);
      if(selected)break;
      const next=document.querySelector('#tbl_prompts_next');
      if(!next||next.classList.contains('disabled')||next.getAttribute('aria-disabled')==='true')break;
      const before=visible.map(row=>row.id).join(',');click(next);
      await until(()=>rows().map(row=>row.id).join(',')!==before,'A paginação da Gaia não respondeu.');
      await ready();
    }
    if(action==='list') {
      if(info()!==found.size)throw Error(`A Gaia mostrou ${found.size} de ${info()??'?'} prompts. A lista incompleta não foi importada; consulte a biblioteca novamente.`);
      return {ok:true,prompts:[...found.values()],origin:location.origin};
    }
    if(!selected)throw Error('O prompt não está mais disponível nesta consulta da Gaia. Atualize a lista.');
    const link=[...document.querySelectorAll('#tbl_prompts a.btnConsultar')].find(el=>el.getAttribute('onclick')?.match(/IdLlmPrompt=(\d+)(?:&|['"]|$)/)?.[1]===promptId);
    click(link);
    const read=await until(()=>{
      const current=form();if(!current)return null;
      const value=id=>current.querySelector('#'+id)?.value||'';
      if(value('id_llm_prompt')!==promptId||!current.querySelector('textarea#prompt'))return null;
      return {...selected,title:value('titulo')||selected.title,description:value('descricao'),body:value('prompt'),version:value('seq_versao'),versionId:value('id_llm_prompt_versao')};
    },'O texto completo do prompt não ficou disponível.');
    if(!read.body.trim())throw Error('O prompt está vazio. A biblioteca anterior foi mantida.');
    return {ok:true,prompt:read};
  } catch(error) {return {ok:false,error:error?.message||String(error)};}
}
