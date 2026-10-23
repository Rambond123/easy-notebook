const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const repo = path.resolve(__dirname, '..');
  const local = Boolean(process.env.GUIDE_FILE);
  const count = local ? 5 : 8;
  const prefix = local ? 'guia-local' : 'guia';
  const html = await fs.readFile(process.env.GUIDE_FILE || path.join(repo, 'docs/index.html'), 'utf8');
  const version = JSON.parse(await fs.readFile(path.join(repo, 'manifest.json'))).version;
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
  try {
    const page = await browser.newPage({viewport:{width:1100,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Render the artifact without interacting with the user's browser or accounts.
    await page.setContent(html);
    const target = `https://github.com/Rambond123/easy-notebook/releases/download/v${version}/Easy-Notebook-${version}.zip`;
    if(local){
      assert.equal(await page.locator('#download').count(),0);
      assert.match(await page.locator('[data-step]:visible').innerText(),/Você já extraiu/);
      assert.doesNotMatch(html,/Baixar Easy Notebook|Extrair Tudo|Primeiro, baixe/);
    } else assert.equal(await page.locator('#download').getAttribute('href'), target);
    await fs.mkdir(path.join(repo, 'test-results'), {recursive:true});
    for(let i=0;i<count;i++) {
      assert.equal(await page.locator('[data-step]:visible').count(), 1);
      assert.equal(await page.locator('#counter').innerText(), `Etapa ${i+1} de ${count}`);
      await page.screenshot({path:path.join(repo, 'test-results', `${prefix}-${i+1}.png`),fullPage:true});
      if(i<count-1) await page.locator('#next').click();
    }
    assert.equal(await page.locator('#next').isVisible(), false);
    for(let i=count-1;i>0;i--) await page.locator('#back').click();
    assert.equal(await page.locator('#back').isVisible(), false);
    const copyStep=local?1:4;
    await page.evaluate(n => {location.hash=String(n);},copyStep);
    await page.waitForFunction(({copyStep,count}) => document.querySelector('#counter').textContent===`Etapa ${copyStep} de ${count}`,{copyStep,count});
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text=>{window.copied=text;}}});
    });
    await page.locator('#copy').click();
    assert.equal(await page.evaluate(() => window.copied), 'chrome://extensions');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async()=>{throw Error('Denied');}}});
    });
    await page.locator('#copy').click();
    assert.match(await page.locator('#copy-status').innerText(), /Ctrl\+C/);
    assert.equal(await page.locator('#address').evaluate(el=>el.selectionEnd-el.selectionStart),19);
    await page.setViewportSize({width:390,height:844});
    for(let i=1;i<=count;i++){
      await page.evaluate(i=>{location.hash=String(i);},i);
      await page.waitForFunction(({i,count})=>document.querySelector('#counter').textContent===`Etapa ${i} de ${count}`,{i,count});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await page.screenshot({path:path.join(repo,'test-results',`${prefix}-celular.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(`Guia aprovado: ${count} etapas, ida/volta, copiar/fallback, largura de 390px e ausência de erros JavaScript.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
