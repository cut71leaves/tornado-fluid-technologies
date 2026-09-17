const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const modules=process.env.FLUID_DEPS || path.join(__dirname,'interaction/node_modules');
const esbuild=require(path.join(modules,'esbuild'));
esbuild.buildSync({entryPoints:[path.join(__dirname,'interaction/sculpture.mjs')],
  nodePaths:[modules],bundle:true,minify:true,format:'iife',target:['es2020'],
  outfile:path.join(root,'assets/fluid-interactive.min.js'),legalComments:'eof'});
fs.copyFileSync(path.join(modules,'three/LICENSE'),path.join(root,'assets/THREE-LICENSE.txt'));
console.log('Built local interactive sculpture bundle.');
