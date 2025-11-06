import fs from 'fs';

const args = process.argv.slice(2);
const target = args.find(a => a.startsWith('-D'))?.slice(2);
const file = args.find(a => !a.startsWith('-D'));
if (!target || !file) process.exit(1);

const lines = fs.readFileSync(file, 'utf-8').split('\n');
let keep = false;
let free = true;
let cond = false;
const out = [];

for (let l of lines) {
    l = l.trimEnd();
    if (l.startsWith('//#if ') || l.startsWith('//#elif ')) { keep = l.split('//#if ')[1] === target || l.split('//#elif ')[1] === target; cond = keep || cond; free = false; }
    else if (l.startsWith('//#else')) { keep = !cond; free = false; }
    else if (l.startsWith('//#endif')) { keep = false; free = true; cond = false; } 
    else if (keep) out.push(l.replace(/^\/\//, '').trim());
    else if (free) out.push(l);
}

fs.writeFileSync(file, out.join('\n'), 'utf-8');