const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const errors = [];
for (const name of pages) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  if (/Vortex\s+Fluid/i.test(html)) errors.push(`${name}: old English brand`);
  if (name !== '404.html' && !html.includes('Tornado Fluid Technologies')) {
    errors.push(`${name}: missing English brand`);
  }
  for (const match of html.matchAll(/\b(?:href|src|srcset|data-desktop|data-mobile)="([^"]+)"/g)) {
    const url = match[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
    const local = decodeURIComponent(url.split(/[?#]/)[0]);
    if (local && !fs.existsSync(path.resolve(root, local))) {
      errors.push(`${name}: missing resource ${local}`);
    }
  }
}
for (const file of ['tools/build.cjs', 'site.js', 'assets/application-guide.txt', 'assets/vortex-logo.svg']) {
  if (/Vortex\s+Fluid/i.test(fs.readFileSync(path.join(root, file), 'utf8'))) {
    errors.push(`${file}: old English brand`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} HTML files: brand and local resources passed.`);
}
