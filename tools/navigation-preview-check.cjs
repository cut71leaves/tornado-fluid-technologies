const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.PREVIEW_CHECK_OUT||path.join(root,'work/preview-checks'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const checks=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.PREVIEW_URL||pathToFileURL(root+path.sep).href;
  const requests=[];page.on('request',r=>requests.push(r.url()));
  const visit=file=>page.goto(new URL(file,base).href);
  for(const width of [1440,390,360]){
   await page.setViewportSize({width,height:width===1440?1000:844});await visit('index.html');
   assert.equal(await page.locator('main video[data-content-video]').count(),0);
   assert.equal(await page.locator('[data-fluid-stage],canvas').count(),0);
   const first=await page.locator('.ambient-ribbon').evaluate(e=>getComputedStyle(e).transform);
   await page.evaluate(()=>scrollTo({top:1500,behavior:'instant'}));
   await page.waitForFunction(previous=>getComputedStyle(document.querySelector('.ambient-ribbon')).transform!==previous,first);
   assert.notEqual(await page.locator('.ambient-ribbon').evaluate(e=>getComputedStyle(e).transform),first);
   assert.ok(await page.locator('.header').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<1));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width<700)await page.locator('.menu-toggle').click();
   await page.locator('#primary-nav').getByRole('link',{name:'技术与产品',exact:true}).click();
   assert.ok(page.url().endsWith('technology.html'));
   assert.equal(await page.locator('main video[data-content-video]').count(),3);
   await page.evaluate(()=>{location.hash='video-prototype';});await page.waitForTimeout(500);
   const gap=await page.locator('#video-prototype').evaluate(e=>e.getBoundingClientRect().top);
   assert.ok(gap>=70,'Anchored video heading must clear fixed navigation');
   await page.screenshot({path:path.join(out,`technology-${width}.png`)});
   checks.push(`${width}px: fixed navigation, background response, compact home, video destination and anchor`);
  }
  await page.setViewportSize({width:1440,height:1000});await visit('technology.html#videos');
  for(const kind of ['science','prototype','concept']){
   const video=page.locator('#film-technology-'+kind);await video.scrollIntoViewIfNeeded();
   await video.locator('..').locator('[data-media-start]').click();
   await page.waitForFunction(id=>{const v=document.getElementById(id);return !v.paused&&v.currentTime>.05;},'film-technology-'+kind);
   assert.ok(await video.evaluate(v=>v.videoWidth===1280&&v.videoHeight===720&&v.controls&&getComputedStyle(v).objectFit==='contain'));
   assert.equal(await page.locator('video[data-content-video]').evaluateAll(vs=>vs.filter(v=>!v.paused).length),1);
   await video.evaluate(v=>v.pause());
   checks.push(kind+': video plays with full frame and exclusive controls');
  }
  await page.locator('#search-open').click();await page.locator('#search-input').fill('酒');
  assert.ok(await page.locator('#search-results a').count()>0);await page.keyboard.press('Escape');
  checks.push('Fixed-header search works below the fold');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.ambient-ribbon')).transform==='none');
  checks.push('Reduced-motion stops global background transforms');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await visit('index.html');await page.locator('.home-tech-preview').click();
  assert.ok(page.url().endsWith('technology.html#video-prototype'));
  assert.ok(!requests.some(r=>/fluid-interactive|fluid-loader/.test(r)));
  checks.push('Home preview goes to prototype; removed sculpture never downloads');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
