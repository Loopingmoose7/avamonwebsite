const fs = require('fs');
const path = require('path');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch(e) { return ''; }
}

function splitBlocks(text) {
  // Split on lines that start with a number and a dot
  const parts = text.split(/(?=^\d+\.)/m);
  return parts.map(p => p.trim()).filter(Boolean);
}

function normalizeForKey(block) {
  const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const keep = [];
  for (let l of lines) {
    if (/^(ANSWER:|Source:|Source|\-\-+)/i.test(l)) continue;
    if (/^[A-D]\)|^\([A-D]\)/.test(l)) continue;
    if (/^\d+\.$/.test(l)) continue;
    keep.push(l);
  }
  let text = keep.join(' ');
  text = text.replace(/[^\w\s]+/g, ' ').toLowerCase().trim();
  return text.slice(0, 180);
}

function main(){
  const a = path.join('public','questions','unit-1.txt');
  const b = path.join('tmp','pdfs','unit-1-guide.txt');
  const out = path.join('public','questions','unit-1-merged.txt');
  const bak = path.join('public','questions','unit-1.backup.txt');

  const ta = read(a);
  const tb = read(b);
  if (!ta && !tb) { console.log('No input files found.'); return; }
  if (ta) fs.writeFileSync(bak, ta, 'utf8');
  if (ta) console.log(`Backed up ${a} -> ${bak}`);

  let blocks = [];
  if (ta) blocks = blocks.concat(splitBlocks(ta));
  if (tb) blocks = blocks.concat(splitBlocks(tb));

  const seen = new Set();
  const merged = [];
  for (let blk of blocks) {
    const key = normalizeForKey(blk);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(blk);
  }

  const outLines = [];
  outLines.push('AP WORLD HISTORY - UNIT 1 MERGED QUESTIONS');
  outLines.push(`Total unique questions: ${merged.length}`);
  outLines.push('');
  merged.forEach((blk, i) => {
    const blk2 = blk.replace(/^\s*\d+\./m, '').trim();
    outLines.push(`${i+1}. ${blk2}`);
    outLines.push('\n');
  });

  fs.writeFileSync(out, outLines.join('\n'), 'utf8');
  console.log(`Wrote merged file: ${out} (questions=${merged.length})`);
}

main();
