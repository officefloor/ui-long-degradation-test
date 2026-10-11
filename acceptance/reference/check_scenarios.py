"""Evaluate every registered scenario at its own checkpoint and at every later one written so far.

A value that changes at checkpoint k is only allowed when k is mutative, mutates the spec's
checkpoint, and ships a new version of the spec at k. The mutation table (type/mutates) and the
range come from checkpoints.yaml. Prints the authored values (for writing the specs) with --print.
"""
import re, sys
from collections import defaultdict
import os
import yaml
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)
from acceptance.reference.scenarios import SC, values

checkpoints = yaml.safe_load(open(os.path.join(ROOT, 'checkpoints.yaml')))['checkpoints']
LAST = len(checkpoints)
MUT = {i: [int(x) for x in (cp.get('mutates') or [])]
       for i, cp in enumerate(checkpoints, 1) if cp.get('type') == 'mutative'}

versions = defaultdict(set)
for s in SC:
    versions[s['spec']].add(s['n'])
problems = []
for s in SC:
    own = int(re.match(r'cp(\d+)_', s['spec']).group(1))
    later = sorted(v for v in versions[s['spec']] if v > s['n'])
    end = later[0] if later else LAST + 1
    base = values(s['fx'], s['n'])
    for k in range(s['n'] + 1, min(end, LAST) + 1):
        cur = values(s['fx'], k)
        diff = [c for c in s['checks'] if cur.get(c) != base.get(c)]
        if not diff:
            continue
        if k == end and own in MUT.get(k, []):
            break
        problems.append(f"{s['spec']} v{s['n']} '{s['title']}' {s['label']}: changes at cp{k}: "
                        + ", ".join(f"{c} {base.get(c)} -> {cur.get(c)}" for c in diff))
        break
if '--print' in sys.argv:
    for s in SC:
        v = values(s['fx'], s['n'])
        print(f"{s['spec']} v{s['n']} | {s['title']} {s['label']}")
        for c in s['checks']:
            print(f"    {c} = {v[c]}")
print(f"checked {len(SC)} scenarios over cp1-{LAST}")
print('\n'.join(problems) or 'no unexpected changes')
