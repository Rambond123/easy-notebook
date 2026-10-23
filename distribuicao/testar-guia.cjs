const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const repo = path.resolve(__dirname, '..');
  const html = await fs.readFile(path.join(repo, 'docs/index.html'), 'utf8');
  const version = JSON.parse(await fs.readFile(path.join(repo, 'manifest.json'))).version;
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
  try {
    const page = await browser.newPage({viewport:{width:1100,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Render the artifact without interacting with the user's browser or accounts.
    await page.setContent(html);
    const target = `https://github.com/Rambond123/easy-notebook/releases/download/v${version}/Easy-Notebook-${version}.zip`;
    assert.equal(await page.locator('#download').getAttribute('href'), target);
    await fs.mkdir(path.join(repo, 'test-results'), {recursive:true});
    for(let i=0;i<8;i++) {
      assert.equal(await page.locator('[data-step]:visible').count(), 1);
      assert.equal(await page.locator('#counter').innerText(), `Etapa ${i+1} de 8`);
      await page.screenshot({path:path.join(repo, 'test-results', `guia-${i+1}.png`),fullPage:true});
      if(i<7) await page.locator('#next').click();
    }
    assert.equal(await page.locator('#next').isVisible(), false);
    for(let i=7;i>0;i--) await page.locator('#back').click();
    assert.equal(await page.locator('#back').isVisible(), false);
    await page.evaluate(() => {location.hash='4';});
    await page.waitForFunction(() => document.querySelector('#counter').textContent==='Etapa 4 de 8');
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
    for(let i=1;i<=8;i++){
      await page.evaluate(i=>{location.hash=String(i);},i);
      await page.waitForFunction(i=>document.querySelector('#counter').textContent===`Etapa ${i} de 8`,i);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await page.screenshot({path:path.join(repo,'test-results','guia-celular.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('Guia aprovado: 8 etapas, ida/volta, copiar/fallback, link da versão, largura de 390px e ausência de erros JavaScript.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
