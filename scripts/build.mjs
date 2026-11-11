import {mkdir,copyFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const files=['index.html','styles.css','app.js','domain.js'];
await mkdir('dist',{recursive:true});
for(const file of files){
  const text=await readFile(file,'utf8');
  if(!text.trim()) throw new Error(`Archivo vacío: ${file}`);
  if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  await copyFile(file,`dist/${file}`);
}
// Portable, single-file edition: works without installation or external assets.
const [html,css,app,domain]=await Promise.all(files.map(file=>readFile(file,'utf8')));
const bundledDomain=domain.replace(/^export\s+/gm,'');
const bundledApp=app.replace(/^import\s+[\s\S]*?from\s*['"]\.\/domain\.js['"];?\s*/m,'');
if(/\bimport\s/.test(bundledApp))throw new Error('La edición portable contiene imports externos.');
const portable=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.js"></script>',()=>`<script type="module">\n${bundledDomain}\n${bundledApp}\n</script>`);
await import('node:fs/promises').then(fs=>fs.writeFile('dist/CONTENT_OS.html',portable));
console.log('CONTENT OS: build correcto, sin dependencias externas.');
