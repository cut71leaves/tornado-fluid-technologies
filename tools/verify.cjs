const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');
const { chromium } = require('C:/Users/18513/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/18513/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.VORTEX_CHECK_OUT || path.join(root, '../../work/vortex-fluid-checks'));
fs.mkdirSync(out, {recursive:true});
const results = {pages: [], links: [], interactions: [], errors: []};
let activeBrowser;
function record(name, passed, detail) { results.interactions.push({name,passed,detail}); }
async function run(){
 const browser = await chromium.launch({headless:true,executablePath:'C:/Users/18513/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe'});
 activeBrowser=browser;
 const ctx = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page = await ctx.newPage();
 let current='';
 page.on('pageerror',e=>results.errors.push({page:current,error:e.message}));
 page.on('requestfailed',r=>results.errors.push({page:current,request:r.url(),error:r.failure()?.errorText}));
 const url=name=>pathToFileURL(path.join(root,name)).href;
 const navigate=async name=>{current=name;await page.goto(url(name));await page.waitForLoadState('load');};
 const files=fs.readdirSync(root).filter(x=>x.endsWith('.html'));
 for (const name of files) {
  await navigate(name);
  const links=await page.locator('a[href],link[href],script[src],img[src]').evaluateAll(els=>els.map(e=>({tag:e.tagName,attr:e.getAttribute('href')||e.getAttribute('src'),url:e.href||e.src})));
  for(const link of links){
   if(!link.url.startsWith('file:'))continue;
   const u=new URL(link.url); const target=fileURLToPath(u);
   if(!fs.existsSync(target))results.links.push({source:name,kind:'missing',...link});
   else if(u.hash&&target===path.join(root,name)&&!(await page.locator(`[id="${decodeURIComponent(u.hash.slice(1))}"]`).count()))results.links.push({source:name,kind:'missing anchor',...link});
  }
  if(name==='404.html')continue;
  const state=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.innerText),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(x=>x.loading!=='lazy'&&(!x.complete||!x.naturalWidth)).map(x=>x.src)}));
  results.pages.push({name,viewport:'desktop',...state});
 }
 const important=['index.html','technology.html','sectors.html','sector-food.html','scene-alcohol.html','scene-cutting-fluid.html','sector-environment.html','scene-coffee-tea.html','applications.html','process-extraction.html','resources.html','research.html','article-understanding-cavitation.html','about.html','contact.html','international.html'];
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:360,height:800}]){
  await page.setViewportSize(size);
  for(const name of important){
   await navigate(name);
   await page.evaluate(async()=>{for(const image of document.images){image.loading='eager';if(image.decode)await image.decode().catch(()=>{});}});
   const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src),overflow:[...document.querySelectorAll('main *,header *,footer *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).display!=='none'&&(r.right>innerWidth+1||r.left < -1);}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,70)})).slice(0,12)}));
   results.pages.push({name,viewport:size.width,...state});
   if((size.width===1440||size.width===390)&&['index.html','sector-food.html','scene-alcohol.html','contact.html'].includes(name))await page.screenshot({path:path.join(out,name.replace('.html','')+'-'+size.width+'.png'),fullPage:true});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await navigate('index.html');
 for(const [label,file] of [['技术与产品','technology.html'],['应用领域','sectors.html'],['关于我们','about.html'],['研究动态','research.html']]){
  await page.locator('#primary-nav').getByRole('link',{name:label,exact:true}).click();
  record('nav '+label,page.url().endsWith(file),page.url());await page.locator('.logo').click();
 }
 await page.locator('#search-open').click();
 record('search opens + focused',await page.locator('#search-dialog').isVisible()&&await page.locator('#search-input').evaluate(e=>e===document.activeElement));
 for(const word of ['酒','切削液','咖啡']){await page.locator('#search-input').fill(word);record('search '+word,(await page.locator('#search-results a').count())>0,await page.locator('#search-results strong').allTextContents());}
 await page.locator('#search-input').fill('zzzzNonexistentzzzz');record('search empty state',await page.locator('#search-results a').count()===0&&await page.locator('#search-count').innerText()==='未找到相关内容，请尝试其他关键词。');
 await page.keyboard.press('Escape');await page.waitForTimeout(150);record('search escape + return focus',!await page.locator('#search-dialog').isVisible()&&await page.locator('#search-open').evaluate(e=>e===document.activeElement));
 if(await page.locator('#search-dialog').isVisible())await page.locator('#search-dialog [data-close]').click();
 await page.locator('#search-open').click();await page.locator('#search-input').fill('切削液');await page.locator('#search-results a').filter({hasText:'切削液与润滑体系'}).first().click();record('search navigation',page.url().endsWith('scene-cutting-fluid.html'),page.url());
 await navigate('index.html');await page.locator('[data-open-demo]').click();record('demo opens',await page.locator('#demo-dialog').isVisible());await page.screenshot({path:path.join(out,'demo-desktop.png')});await page.locator('#demo-dialog [data-close]').click();record('demo closes',!await page.locator('#demo-dialog').isVisible());
 const before=await page.locator('[data-module-title]').innerText();await page.locator('[data-module-next]').click();record('module carousel next',(await page.locator('[data-module-title]').innerText())!==before&&await page.locator('[data-module-counter]').innerText()==='02 / 03');await page.locator('[data-module-prev]').click();record('module carousel prev',await page.locator('[data-module-title]').innerText()===before);
 await page.locator('[data-hero-next]').click();record('hero carousel next',await page.locator('.rail-controls > span').innerText()==='02 / 03');await page.locator('[data-hero-prev]').click();record('hero carousel prev',await page.locator('.rail-controls > span').innerText()==='01 / 03');
 await navigate('research.html');for(const name of ['空化知识','技术研究','行业观察','全部']){await page.locator(`[data-filter="${name}"]`).click();const cats=await page.locator('[data-category]:visible').evaluateAll(a=>a.map(x=>x.dataset.category));record('filter '+name,name==='全部'?cats.length===4:name==='行业观察'?cats.length===0&&await page.locator('.filter-empty').isVisible():cats.length===2&&cats.every(x=>x===name),cats);}
 await navigate('contact.html');await page.locator('#enquiry-form button[type="submit"]').click();record('empty form invalid',!await page.locator('#enquiry-form').evaluate(e=>e.checkValidity()));
 await page.locator('[name=name]').fill('QA Tester');await page.locator('[name=company]').fill('QA Company');await page.locator('[name=email]').fill('qa@example.com');await page.locator('[name=message]').fill('Testing local summary only');
 const downloadPromise=page.waitForEvent('download');await page.locator('#enquiry-form button[type="submit"]').click();const download=await downloadPromise;await download.saveAs(path.join(out,'form-summary.txt'));const downloadText=fs.readFileSync(path.join(out,'form-summary.txt'),'utf8');record('form real local download',downloadText.includes('QA Tester')&&downloadText.includes('未向旋风流体发送信息'),await page.locator('#form-status').innerText());
 await page.setViewportSize({width:390,height:844});await navigate('index.html');await page.locator('.menu-toggle').click();record('mobile menu opens',await page.locator('.menu-toggle').getAttribute('aria-expanded')==='true'&&await page.locator('#primary-nav').isVisible());await page.keyboard.press('Escape');record('mobile menu escape',await page.locator('.menu-toggle').getAttribute('aria-expanded')==='false');await page.locator('.menu-toggle').click();await page.locator('#primary-nav').getByRole('link',{name:'应用领域',exact:true}).click();record('mobile navigation',page.url().endsWith('sectors.html'));await page.locator('#search-open').click();await page.locator('#search-input').fill('萃取');await page.screenshot({path:path.join(out,'mobile-search.png')});record('mobile search fits',await page.locator('#search-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
 await browser.close();
 const shot=path.join(out,'index-1440.png');const stats=await sharp(shot).extract({left:650,top:100,width:650,height:650}).stats();results.heroImageVariance=stats.channels.map(c=>c.stdev);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({pageChecks:results.pages.length,brokenLinks:results.links,errors:results.errors,layoutIssues:results.pages.filter(x=>x.scrollWidth>x.width||x.broken?.length||x.overflow?.length),interactions:results.interactions,heroImageVariance:results.heroImageVariance},null,2));
}
run().catch(async e=>{fs.writeFileSync(path.join(out,'results-partial.json'),JSON.stringify(results,null,2));console.error(e);await activeBrowser?.close();process.exitCode=1;});
