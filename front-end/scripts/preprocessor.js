import fs from 'fs';

const args = process.argv.slice(2);
const targets = args.filter(a => a.startsWith('-D')).map((v) => v.slice(2));
const file = args.find(a => !a.startsWith('-D'));
if (!targets.length || !file) process.exit(1);

const lines = fs.readFileSync(file, 'utf-8').split('\n');
let keep = false;
let free = true;
let cond = false;
const out = [];

for (let l of lines) {
    l = l.trimEnd();
    if (l.startsWith('//#if ') || l.startsWith('//#elif ')) { keep = targets.includes(l.split('//#if ')[1]) || targets.includes(l.split('//#elif ')[1]); cond = keep || cond; free = false; }
    else if (l.startsWith('//#else')) { keep = !cond; free = false; }
    else if (l.startsWith('//#endif')) { keep = false; free = true; cond = false; }
    else if (keep) out.push(l.replace(/^\/\//, '').trim());
    else if (free) out.push(l);
}

fs.writeFileSync(file, out.join('\n'), 'utf-8');