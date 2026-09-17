const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/18513/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const out=path.resolve(root,'../../work/vortex-fluid-checks');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/18513/AppData/Local/ms-playwright/chromium-1200/chrome-win64/chrome.exe'});
 try{
  const page=await browser.newPage();const checks=[];
  for(const size of [{width:1440,height:1000},{width:390,height:844}]){
   await page.setViewportSize(size);await page.goto(pathToFileURL(path.join(root,'index.html')).href);
   await page.locator('#search-open').click();await page.locator('#search-input').fill('咖啡');await page.keyboard.press('Escape');await page.waitForTimeout(100);
   checks.push({viewport:size.width,searchEscClosed:!await page.locator('#search-dialog').isVisible(),focusReturned:await page.locator('#search-open').evaluate(e=>e===document.activeElement)});
   await page.locator('[data-open-demo]').click();await page.keyboard.press('Escape');checks.push({viewport:size.width,demoEscClosed:!await page.locator('#demo-dialog').isVisible()});
   await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode?.().catch(()=>{});}});
   await page.screenshot({path:path.join(out,'index-'+size.width+'-final.png'),fullPage:true});
   await page.screenshot({path:path.join(out,'firstfold-'+size.width+'-final.png')});
  }
  await page.goto(pathToFileURL(path.join(root,'sector-food.html')).href);await page.locator('.sector-subnav a').last().click();checks.push({mobileSectorScrollLastLink:page.url().endsWith('sector-energy.html')});
  console.log(JSON.stringify(checks,null,2));fs.writeFileSync(path.join(out,'recheck.json'),JSON.stringify(checks,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
