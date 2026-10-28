const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
  try{
    const page=await browser.newPage({viewport:{width:800,height:500}});
    page.setDefaultTimeout(5000);
    const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    await page.route('https://notebook.google.com/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><style>textarea{position:fixed;left:180px;bottom:35px;width:480px;height:64px}</style><textarea aria-label="Faça uma pergunta"></textarea>'}));
    await page.goto('https://notebook.google.com/notebook/test');
    assert.equal(await page.evaluate(()=>location.hostname),'notebook.google.com');
    assert.ok(await page.evaluate(()=>document.querySelector('textarea').getBoundingClientRect().width>0),'O campo de chat sintético deve ser visível.');
    await page.addScriptTag({content:`
      globalThis.chrome={runtime:{id:'test',getManifest:()=>({version:'0.22.4'}),getURL:x=>x,sendMessage:async message=>({value:message.type==='CHECK_SETUP'?{required:false}:null})},storage:{local:{get:async()=>({localPrompts:[{id:'test',title:'Resumo do processo',body:'Texto selecionado',source:'local'}]})},onChanged:{addListener(){}}}};
      globalThis.easyNotebookIsProcessPage=()=>true;
      globalThis.easyNotebookSession=()=>({active:()=>true,call:fn=>Promise.resolve().then(fn),notify:fn=>Promise.resolve().then(fn).catch(()=>{}),onInvalid(){}});
      globalThis.easyNotebookPositionPanel=()=>({refresh(){},isDocked:()=>false});
      globalThis.easyNotebookPanelMarkup='<aside><button id="toggle"></button><section hidden><button id="close"></button><span id="panel-subtitle"></span><span id="actions-label"></span><div id="actions"></div><div id="advanced-actions"></div><div id="tools"></div><div id="library"></div><div id="replace-mode"></div><button id="config"></button><p id="status"></p></section></aside>';
    `});
    await page.addScriptTag({path:path.resolve(__dirname,'content.js')});
    assert.equal(await page.locator('#easy-notebook-host').count(),1,'O painel deve ser injetado no Notebook sintético.');
    try{await page.waitForSelector('#easy-notebook-inline-prompts',{state:'attached'});}catch(error){const state=await page.evaluate(()=>({host:!!document.querySelector('#easy-notebook-host'),inline:!!document.querySelector('#easy-notebook-inline-prompts'),fields:[...document.querySelectorAll('textarea,[contenteditable="true"],input[aria-label]')].map(el=>({label:el.getAttribute('aria-label'),rect:el.getBoundingClientRect().toJSON(),rects:el.getClientRects().length}))}));throw Error(error.message+' Page errors: '+pageErrors.join(' | ')+' State: '+JSON.stringify(state));}
    const position=await page.evaluate(()=>{const button=document.querySelector('#easy-notebook-inline-prompts').shadowRoot.querySelector('button');const field=document.querySelector('textarea');return {button:button.getBoundingClientRect().toJSON(),field:field.getBoundingClientRect().toJSON()};});
    assert.ok(position.button.right<=position.field.left,'O botão deve ficar à esquerda do chat.');
    await page.locator('#easy-notebook-inline-prompts').evaluate(host=>host.shadowRoot.querySelector('#open').click());
    await page.waitForFunction(()=>!document.querySelector('#easy-notebook-inline-prompts').shadowRoot.querySelector('#menu').hidden);
    assert.equal(await page.locator('#easy-notebook-inline-prompts').evaluate(host=>host.shadowRoot.querySelectorAll('.prompt').length),1);
    assert.equal(await page.locator('#easy-notebook-host').evaluate(host=>host.shadowRoot.querySelector('section').hidden),true);
    await page.locator('#easy-notebook-inline-prompts').evaluate(host=>host.shadowRoot.querySelector('.prompt').click());
    assert.equal(await page.locator('textarea').inputValue(),'Texto selecionado');
    assert.equal(await page.locator('#easy-notebook-inline-prompts').evaluate(host=>host.shadowRoot.querySelector('#menu').hidden),true);
    await page.setViewportSize({width:390,height:844});
    const mobile=await page.evaluate(()=>{const button=document.querySelector('#easy-notebook-inline-prompts').getBoundingClientRect();return button.left>=0&&button.right<=innerWidth;});
    assert.equal(mobile,true,'O botão deve continuar dentro da tela estreita.');
    console.log('Prompts no chat: botão ao lado esquerdo, abertura da biblioteca e adaptação à tela estreita aprovados.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
