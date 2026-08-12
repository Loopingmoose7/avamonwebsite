#!/usr/bin/env python3
import re
from pathlib import Path

def read_file(p):
    return Path(p).read_text(encoding='utf-8') if Path(p).exists() else ''

def split_blocks(text):
    # Find numbered question blocks like '1.' at line starts
    parts = re.split(r'(?m)^(?=\d+\.)', text)
    blocks = [p.strip() for p in parts if p.strip()]
    return blocks

def normalize_for_key(block):
    # Remove ANSWER lines, SOURCE lines, separators, and choices
    lines = []
    for line in block.splitlines():
        l = line.strip()
        if not l:
            continue
        if re.match(r'^(ANSWER:|Source:|Source|--+)', l, re.I):
            continue
        # skip choice lines like A) or (A)
        if re.match(r'^[A-D]\)|^\([A-D]\)', l):
            continue
        # skip lines that are just numbers
        if re.match(r'^\d+\.$', l):
            continue
        lines.append(l)
    text = ' '.join(lines)
    # remove punctuation, lowercase
    text = re.sub(r'[\W_]+', ' ', text).lower().strip()
    return text[:180]

def main():
    a = 'public/questions/unit-1.txt'
    b = 'tmp/pdfs/unit-1-guide.txt'
    out = 'public/questions/unit-1-merged.txt'
    bak = 'public/questions/unit-1.backup.txt'

    ta = read_file(a)
    tb = read_file(b)

    if not ta and not tb:
        print('No input files found.')
        return

    # Backup existing file
    if ta:
        Path(bak).write_text(ta, encoding='utf-8')
        print(f'Backed up {a} -> {bak}')

    blocks = []
    if ta:
        blocks += split_blocks(ta)
    if tb:
        blocks += split_blocks(tb)

    seen = set()
    merged = []
    for blk in blocks:
        key = normalize_for_key(blk)
        if not key:
            continue
        if key in seen:
            continue
        seen.add(key)
        merged.append(blk)

    # Write merged with numbering
    out_lines = []
    out_lines.append('AP WORLD HISTORY - UNIT 1 MERGED QUESTIONS')
    out_lines.append(f'Total unique questions: {len(merged)}')
    out_lines.append('')
    for i, blk in enumerate(merged, 1):
        # Remove original numbering if present, then prepend new number
        blk2 = re.sub(r'(?m)^\s*\d+\.', '', blk).strip()
        out_lines.append(f'{i}. {blk2}')
        out_lines.append('\n')

    Path(out).write_text('\n'.join(out_lines), encoding='utf-8')
    print(f'Wrote merged file: {out} (questions={len(merged)})')

if __name__ == '__main__':
    main()
