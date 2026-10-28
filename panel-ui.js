globalThis.easyNotebookPanelMarkup=`
<style>
:host{all:initial;color-scheme:light;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}button,input,summary{font:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:wait}[hidden]{display:none!important}
aside{position:fixed;right:22px;bottom:22px;z-index:2147483646;width:max-content;max-width:calc(100vw - 24px);font-size:13px;color:#25344a}
section{position:absolute;right:0;bottom:calc(100% + 12px);width:360px;max-width:calc(100vw - 24px);background:#fff;border:1px solid #dbe4f2;border-radius:20px;box-shadow:0 18px 65px #071b3c30;max-height:min(760px,82vh);overflow:auto;margin-bottom:0}
:host([data-eproc-toolbar]){display:inline-block;vertical-align:middle;margin:0 4px}aside[data-docked]{position:relative;display:inline-block}aside[data-docked] #toggle{cursor:pointer;height:32px;border-radius:4px;padding:4px 10px;background:#f8fafc;color:#006da5;box-shadow:0 1px 3px #173b6020;font-size:13px;font-weight:500}aside[data-docked] #toggle img{width:19px;height:19px}
.panel-head{display:flex;align-items:center;gap:11px;padding:18px 18px 14px;border-bottom:1px solid #edf1f7}.brand-icon{width:36px;height:36px;flex:none}.brand-copy{flex:1}h2{margin:0;font-size:16px;font-weight:700;letter-spacing:-.3px}.subtitle{display:block;margin-top:3px;font-size:11px;color:#728099}
.icon-button{border:0;background:none;color:#7a8799;border-radius:8px;padding:6px 9px;font-size:22px;line-height:1}.icon-button:hover{background:#f0f4fa;color:#233c63}
.panel-body{padding:16px 18px}.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#7c899e;font-weight:700;margin:0 0 10px}
#actions{display:flex;flex-wrap:wrap;gap:8px}button.action{border:1px solid #dce5f3;border-radius:10px;background:#f4f7fc;color:#355374;padding:10px 12px;font-size:12px;font-weight:600;line-height:1.35}
button.action:hover{background:#e9f1ff;border-color:#bdd4f8}button.action.primary{width:100%;background:#2668db;color:#fff;border-color:#2668db;padding:13px 14px;font-size:13px;box-shadow:0 3px 9px #2668db20}button.action.primary:hover{background:#1555c3}
#status{margin:14px 0 0;padding:12px 13px;border:1px solid #e3eaf4;border-radius:11px;background:#f7f9fc;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:#556984}
#status[data-kind=success]{background:#f0f9f4;border-color:#d1e9da;color:#28714a}#status[data-kind=error]{background:#fff4f2;border-color:#f4d7d0;color:#ab4736}
#status[data-kind=busy]{position:relative;background:#c9142f;border:2px solid #8f0017;color:#fff;font-size:14px;font-weight:800;line-height:1.45;letter-spacing:.15px;padding:15px 42px 15px 15px;box-shadow:0 5px 16px #a9002838}
#status[data-kind=busy]::after{content:"";position:absolute;right:15px;top:50%;width:16px;height:16px;margin-top:-10px;border:3px solid #ffffff70;border-top-color:#fff;border-radius:50%;animation:easy-notebook-spin .8s linear infinite}@keyframes easy-notebook-spin{to{transform:rotate(360deg)}}
.mode-note{font-size:11px;color:#96612d;background:#fff8ec;border:1px solid #f0e2c9;border-radius:8px;padding:9px 11px;margin:12px 0 0;line-height:1.5}
#library:empty{display:none}#library{margin-top:18px}input{width:100%;border:1px solid #dce4f0;border-radius:10px;padding:11px 12px;color:#263b58;background:#fff;outline:none;font-size:12px}input:focus{border-color:#78a7f1;box-shadow:0 0 0 3px #3379e915}input::placeholder{color:#8b98aa}
.prompt-list{margin-top:9px;max-height:260px;overflow:auto}.empty-state{text-align:center;color:#8492a6;line-height:1.6;padding:18px 10px;font-size:12px}
article{border:1px solid #e6ecf5;border-radius:11px;padding:12px;margin-top:8px;display:grid;grid-template-columns:1fr auto;gap:6px 8px;align-items:start}article strong{font-size:12px;line-height:1.5;color:#2d4261}article button{border:0;background:#eaf2ff;color:#2463c1;border-radius:7px;font-size:11px;font-weight:700;padding:6px 9px}article details{grid-column:1/-1;font-size:11px;color:#8b98aa}summary{cursor:pointer}article p{white-space:pre-wrap;font-size:12px;line-height:1.6;color:#61738d;margin-bottom:0}
#tools{margin-top:16px;border-top:1px solid #edf1f7;padding-top:12px}#tools>summary{font-size:11px;color:#8b97a9}#advanced-actions{display:flex;flex-wrap:wrap;gap:7px;padding-top:10px}#advanced-actions button{font-size:11px;padding:8px 10px}
.panel-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid #edf1f7;background:#fbfcfe}#config{border:0;background:none;padding:4px 0;color:#5d7391;font-size:11px;font-weight:600}#config:hover{color:#2668db}.version{font-size:10px;color:#a1adbd}
#toggle{cursor:grab;touch-action:none;user-select:none;display:flex;align-items:center;gap:9px;padding:11px 15px;border:1px solid #dce5f3;border-radius:15px;background:#fff;color:#2c466d;box-shadow:0 5px 24px #071b3c22;font-size:12px;font-weight:650}#toggle[data-dragging=true]{cursor:grabbing}#toggle img{pointer-events:none;width:23px;height:23px}#toggle:hover{border-color:#9dbde9}
button:focus-visible,summary:focus-visible{outline:3px solid #8cb9ff;outline-offset:3px}@media(max-width:480px){aside{right:12px;bottom:12px}section{max-height:80vh}}
</style>
<aside aria-label="Easy Notebook">
<section hidden aria-label="Painel Easy Notebook">
<header class="panel-head"><img class="brand-icon" data-brand-icon alt=""><div class="brand-copy"><h2>Easy Notebook</h2><span class="subtitle" id="panel-subtitle">Do processo ao conhecimento</span></div><button class="icon-button" id="close" aria-label="Fechar painel" title="Fechar">×</button></header>
<div class="panel-body"><p class="section-label" id="actions-label">Ações</p><div id="actions"></div><p class="mode-note" id="replace-mode" hidden>Limpeza ativada: as fontes atuais serão excluídas antes do envio.</p><p id="status" role="status" aria-live="polite"></p><div id="library"></div><details id="tools"><summary>Ferramentas do eproc</summary><div id="advanced-actions"></div></details></div>
<footer class="panel-footer"><button id="config">Configurações</button><span class="version">v0.22.4</span></footer>
</section>
<button id="toggle" aria-expanded="false"><img data-brand-icon alt=""><span>Easy Notebook</span></button>
</aside>`;
