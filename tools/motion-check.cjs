/* Run with Playwright installed, or set PLAYWRIGHT_MODULE and CHROMIUM_PATH. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const {pathToFileURL} = require('url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.MOTION_CHECK_OUT || path.join(root, 'work/motion-checks'));
fs.mkdirSync(out, {recursive: true});
const mime = {'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css',
  '.mp4':'video/mp4','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end();
  }
  const size = fs.statSync(file).size;
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  const headers = {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes'};
  if (range) {
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), size-1) : size-1;
    res.writeHead(206, {...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${size}`});
    fs.createReadStream(file,{start,end}).pipe(res);
  } else {
    res.writeHead(200,{...headers,'Content-Length':size}); fs.createReadStream(file).pipe(res);
  }
});
const checks = [], errors = [];
let browser;
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const playing = () => page.waitForFunction(() => {
    const v = document.querySelector('#hero-fluid-video'); return !v.paused && v.currentTime > .05 && document.querySelector('.motion-ready');
  });
  for (const width of [1440,390,360]) {
    await page.setViewportSize({width,height:width===1440?1000:844});
    await page.goto(url); await playing();
    const info = await page.locator('#hero-fluid-video').evaluate(v => ({src:v.currentSrc,duration:v.duration,muted:v.muted,w:v.videoWidth,h:v.videoHeight}));
    assert.ok(info.src.endsWith(width>700?'fluid-desktop.mp4':'fluid-mobile.mp4'));
    assert.equal(info.duration,12); assert.ok(info.muted);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,`home-${width}.png`)});
    checks.push({name:`${width}px playback and layout`,...info});
  }
  const toggle = page.locator('[data-motion-toggle]');
  await toggle.click();
  assert.ok(await page.locator('#hero-fluid-video').evaluate(v=>v.paused));
  await page.evaluate(()=>scrollTo(0,1700)); await page.waitForTimeout(150);
  await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(250);
  assert.ok(await page.locator('#hero-fluid-video').evaluate(v=>v.paused));
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(150);
  assert.ok(await toggle.isVisible()); await toggle.click(); await playing();
  checks.push({name:'User pause persists across scrolling and viewport change'});
  await page.evaluate(()=>scrollTo(0,1800));
  await page.waitForFunction(()=>document.querySelector('#hero-fluid-video').paused);
  await page.evaluate(()=>scrollTo(0,0)); await playing();
  checks.push({name:'Offscreen pauses; visible resumes'});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.ok(await page.locator('#hero-fluid-video').evaluate(v=>v.paused));
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await playing(); checks.push({name:'Visibility-change handler pauses and resumes'});
  await page.locator('#hero-fluid-video').evaluate(v=>{v.currentTime=11.85;});
  await page.waitForFunction(()=>document.querySelector('#hero-fluid-video').currentTime<1.5);
  checks.push({name:'Playback crosses loop boundary'});
  await page.emulateMedia({reducedMotion:'reduce'});
  try {
    await page.waitForFunction(()=>{const v=document.querySelector('#hero-fluid-video');return v.paused&&getComputedStyle(v).display==='none';},undefined,{timeout:5000});
  } catch (error) {
    console.error(await page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,hidden:document.hidden,heroClass:document.querySelector('.hero').className,paused:document.querySelector('#hero-fluid-video').paused,contentPlaying:window.VORTEX_MEDIA?.isPlaying()})));
    throw error;
  }
  assert.ok(await page.locator('#hero-fluid-video').evaluate(v=>v.paused));
  assert.ok(await page.locator('.hero-media img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await page.emulateMedia({reducedMotion:'no-preference'}); await playing();
  checks.push({name:'Changing reduced-motion preference shows poster then resumes'});

  const quiet = await browser.newPage({reducedMotion:'reduce'});
  const requests = [];
  quiet.on('request',r=>{if(r.url().endsWith('.mp4'))requests.push(r.url());});
  await quiet.goto(url); await quiet.waitForTimeout(400);
  assert.equal(requests.length,0); assert.ok(!await quiet.locator('[data-motion-toggle]').isVisible());
  checks.push({name:'Reduced-motion initial load requests no video'});
  const failed = await browser.newPage();
  await failed.route('**/*.mp4', route=>route.abort());
  await failed.goto(url); await failed.waitForFunction(()=>document.querySelector('#hero-fluid-video').error);
  assert.ok(!await failed.locator('.hero').evaluate(e=>e.classList.contains('motion-ready')));
  assert.ok(await failed.locator('.hero-media img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await failed.locator('#search-open').click();
  assert.ok(await failed.locator('#search-dialog').isVisible());
  checks.push({name:'Video network failure retains poster and working search'});
  const blocked = await browser.newPage();
  await blocked.addInitScript(()=>{
    const original=HTMLMediaElement.prototype.play;
    let first=true;
    HTMLMediaElement.prototype.play=function(){if(first){first=false;return Promise.reject(new DOMException('Test autoplay block','NotAllowedError'));}return original.call(this);};
  });
  await blocked.goto(url); await blocked.waitForTimeout(400);
  assert.ok(!await blocked.locator('.hero').evaluate(e=>e.classList.contains('motion-ready')));
  await blocked.locator('[data-motion-toggle]').click();
  await blocked.waitForFunction(()=>!document.querySelector('#hero-fluid-video').paused&&document.querySelector('#hero-fluid-video').currentTime>0);
  checks.push({name:'Autoplay refusal keeps poster; explicit play recovers'});
  const slow = await browser.newPage();
  await slow.route('**/*.mp4',async route=>{await new Promise(r=>setTimeout(r,1000));await route.continue();});
  await slow.goto(url,{waitUntil:'domcontentloaded'});
  await slow.waitForFunction(()=>document.querySelector('.hero-media img').naturalWidth>0);
  assert.ok(!await slow.locator('.hero').evaluate(e=>e.classList.contains('motion-ready')));
  await slow.waitForFunction(()=>document.querySelector('.motion-ready'));
  checks.push({name:'Slow video load shows poster without hiding content'});
  await page.goto(pathToFileURL(path.join(root,'index.html')).href); await playing();
  checks.push({name:'Direct local-file playback works'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'motion-results.json'),JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
