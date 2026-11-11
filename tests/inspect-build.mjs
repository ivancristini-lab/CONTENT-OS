import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const app=readFileSync('app.js','utf8');
console.log('Encoding:',{replacementCharacters:app.split('\uFFFD').length-1,controlCharacters:[...app].filter(c=>c.charCodeAt(0)<32&&!['\n','\r','\t'].includes(c)).length});
const html=readFileSync('dist/CONTENT_OS.html','utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
if(!script)throw Error('No portable script found');
const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:script,encoding:'utf8'});
if(check.status!==0){console.error(check.stderr);process.exit(1);}
console.log('Portable combined module: syntax valid');
console.log(app.match(/function renderProfile[\s\S]*?function renderSettings/)?.[0]);
