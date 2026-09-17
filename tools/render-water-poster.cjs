const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>console.error(e.message));
  await page.goto(pathToFileURL(path.join(root,'technology.html')).href);
  await page.addScriptTag({url:pathToFileURL(path.join(root,'assets/water-surface.js')).href});
  const png=await page.evaluate(()=>{
   const canvas=document.createElement('canvas'),water=window.TornadoWater.create(canvas,false);
   water.resize(1440,1000,false);water.render(0);
   const data=canvas.toDataURL('image/png').split(',')[1];water.dispose();return data;
  });
  await sharp(Buffer.from(png,'base64')).webp({quality:91}).toFile(path.join(root,'assets/water-poster.webp'));
  console.log('Rendered static water poster using the same surface shader.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
