const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1600,height:1200}});
    page.on('pageerror',e=>console.error(e.message));
    page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('ERR_FILE_NOT_FOUND'))console.error(m.text());});
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.locator('[data-fluid-stage]').scrollIntoViewIfNeeded();
    await page.waitForSelector('.sculpture-ready canvas',{timeout:30000});
    for(const [kind,width,height] of [['desktop',1200,1100],['mobile',700,850]]) {
      await page.locator('[data-fluid-stage]').evaluate((e,size)=>{e.style.width=size[0]+'px';e.style.height=size[1]+'px';},[width,height]);
      await page.locator('[data-fluid-stage]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      const png=await page.locator('.sculpture-canvas canvas').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
      await sharp(Buffer.from(png,'base64')).resize(width,height).webp({quality:92}).toFile(path.join(root,`assets/sculpture-${kind}.webp`));
    }
    console.log('Rendered original desktop and mobile sculpture posters.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
