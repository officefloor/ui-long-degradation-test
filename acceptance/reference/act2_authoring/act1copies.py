"""Updated copies of Act I specs shipped by Act II mutations: text edits of the version in force,
plus their registry entries (carried scenarios re-registered at the copy's checkpoint, with any test
the copy changes or adds re-stated)."""
import copy, os, re, sys
import lib
from lib import REPO, REG
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import panel_waits  # noqa: E402  (copies patch the authored text, without the waits)

SPECS = os.path.join(REPO, 'acceptance/specs')
sys.path.insert(0, REPO)

_COPIES = []   # (k, base, header, reps, retire, add_ts, reg_fn)


def act1(k, base, header, reps=(), retire=(), add_ts='', reg=None):
    _COPIES.append((k, base, header, list(reps), list(retire), add_ts, reg))


def latest_path(base, k):
    best = os.path.join(SPECS, base + '.spec.ts')
    bn = 0
    for dname in os.listdir(SPECS):
        m = re.fullmatch(r'cp(\d+)', dname)
        if m and int(m.group(1)) < k and os.path.exists(os.path.join(SPECS, dname, base + '.spec.ts')):
            if int(m.group(1)) > bn:
                bn, best = int(m.group(1)), os.path.join(SPECS, dname, base + '.spec.ts')
    return best


def _scenarios(base, k):
    """Scenarios of the version in force before k (Act I registry, or a copy made earlier here)."""
    from acceptance.reference.scenarios import SC
    pool = [s for s in SC if s['spec'] == base and s['n'] <= 50]
    pool += [dict(spec=r[0], title=r[1], n=r[2], fx=r[3], checks=r[4], label=r[5]) for r in REG if r[0] == base]
    prev = max(s['n'] for s in pool if s['n'] < k)
    return [s for s in pool if s['n'] == prev]


def write():
    for k, base, header, reps, retire, add_ts, reg in sorted(_COPIES, key=lambda c: c[0]):
        src = latest_path(base, k)
        s = panel_waits.strip_waits(open(src).read())
        # drop an earlier copy's own note: from 'UPDATED for' to the end of its 'Carries' sentence
        lines = s.split('\n')
        i = lines.index('')
        j = i + 1
        if lines[j].startswith('// UPDATED for'):
            while 'Carries' not in lines[j]:
                j += 1
            while not lines[j].rstrip().endswith('.'):
                j += 1
            j += 1
        body = lines[:i + 1] + lib.wrap_comment(header) + lines[j:]
        s = '\n'.join(body)
        for old, new in reps:
            assert s.count(old) >= 1, f'cp{k} copy of {base}: missing {old!r}'
            s = s.replace(old, new)
        for title in retire:
            m = re.search(r"\n  test\((['\"])" + re.escape(title) + r"\1.*?\n  }\);\n", s, re.S)
            assert m, f'cp{k} copy of {base}: no test {title!r}'
            s = s[:m.start()] + '\n' + s[m.end():]
            s = s.replace('\n\n\n', '\n\n')
        if callable(add_ts):
            add_ts = '\n\n'.join(lib.render_test(base, k, t) for t in add_ts())
        if add_ts:
            s = s.rstrip('\n')
            assert s.endswith('});')
            s = s[:-3].rstrip('\n') + '\n\n' + add_ts.strip('\n') + '\n});\n'
        if 'auditLines' in s and "import { auditLines }" not in s:
            s = s.replace("import { resetAndSeed } from '../support/seed';\n",
                          "import { resetAndSeed } from '../support/seed';\nimport { auditLines } from '../support/audit';\n")
        os.makedirs(os.path.join(SPECS, f'cp{k:02d}'), exist_ok=True)
        open(os.path.join(SPECS, f'cp{k:02d}', base + '.spec.ts'), 'w').write(s.rstrip('\n') + '\n')
        carried = [x for x in _scenarios(base, k) if x['title'] not in retire]
        if reg:
            carried = reg(carried)
        for x in carried:
            REG.append((base, x['title'], k, copy.deepcopy(x['fx']), list(x['checks']), x['label']))
