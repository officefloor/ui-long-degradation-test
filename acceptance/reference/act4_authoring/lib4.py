"""Act IV authoring helpers (authoring aid, never shown to the agent). Builds on Act II's and Act III's
generators (act2_authoring/lib.py, act3_authoring/lib3.py): the same spec description (T, Spec),
rendering and registry, so every figure an Act IV spec asserts comes from model.py with the spec's own
seed."""
import copy, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'act3_authoring'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'act2_authoring'))
import lib  # noqa: E402
import lib3  # noqa: E402
from lib3 import *  # noqa: E402,F401,F403
from lib import REPO, REG, SPECFN, CPS, COPIES, render, render_test, wrap_comment, workspace_values  # noqa: E402
from acceptance.reference import model as M  # noqa: E402

SPECS = os.path.join(REPO, 'acceptance/specs')
FIRST = 151

# ------------------------------------------------------------------------------ copies at Act IV mutations

NOTES = {}        # (k, base) -> copy note, for copies rendered from a spec function
REPS = {}         # (k, base) -> [(old, new)] text edits after rendering
TEXT_COPIES = []  # (k, base, header, reps, retire, add_ts, reg)
POSTS = {}        # k -> [fn(text) -> text] applied to every text copy at k
CUSTOM = {}       # (k, base) -> fn(text) -> text, applied after rendering a spec-function copy


def copy_note(k, base, note, reps=(), post=None):
    """Ship base re-rendered from its spec function at k (registered by cp(..., copies=[base]))."""
    NOTES[(k, base)] = note
    REPS[(k, base)] = list(reps)
    if post:
        CUSTOM[(k, base)] = post


def text_copy(k, base, header, reps=(), retire=(), add_ts='', reg=None):
    """Ship base as a text edit of the version in force before k (for specs with no spec function)."""
    TEXT_COPIES.append((k, base, header, list(reps), list(retire), add_ts, reg))


def latest_path(base, k):
    best = os.path.join(SPECS, base + '.spec.ts')
    bn = 0
    for dname in os.listdir(SPECS):
        m = re.fullmatch(r'cp(\d+)', dname)
        if m and int(m.group(1)) < k and os.path.exists(os.path.join(SPECS, dname, base + '.spec.ts')):
            if int(m.group(1)) > bn:
                bn, best = int(m.group(1)), os.path.join(SPECS, dname, base + '.spec.ts')
    return best


def scenarios_before(base, k):
    """Registry entries of the version of base in force before k (Acts I-III registry + this build)."""
    from acceptance.reference.scenarios import SC
    pool = [s for s in SC if s['spec'] == base and s['n'] < FIRST]
    pool += [dict(spec=r[0], title=r[1], n=r[2], fx=r[3], checks=r[4], label=r[5]) for r in REG if r[0] == base]
    prev = max(s['n'] for s in pool if s['n'] < k)
    return [s for s in pool if s['n'] == prev]


def write_text_copies():
    written = []
    for k, base, header, reps, retire, add_ts, reg in sorted(TEXT_COPIES, key=lambda c: c[0]):
        src = latest_path(base, k)
        s = open(src).read()
        lines, i, j = lib3.strip_note(s)
        s = '\n'.join(lines[:i + 1] + wrap_comment(header) + lines[j:])
        for old, new in reps:
            assert s.count(old) >= 1, f'cp{k} copy of {base}: missing {old!r}'
            s = s.replace(old, new)
        for title in retire:
            m = re.search(r"\n  test\((['\"])" + re.escape(title) + r"\1.*?\n  }\);\n", s, re.S)
            assert m, f'cp{k} copy of {base}: no test {title!r}'
            s = s[:m.start()] + '\n' + s[m.end():]
            s = s.replace('\n\n\n', '\n\n')
        if callable(add_ts):
            add_ts = '\n\n'.join(render_test(base, k, t) for t in add_ts())
        if add_ts:
            s = s.rstrip('\n')
            assert s.endswith('});')
            s = s[:-3].rstrip('\n') + '\n\n' + add_ts.strip('\n') + '\n});\n'
        if 'auditLines' in s and "import { auditLines }" not in s:
            s = s.replace("import { resetAndSeed } from '../support/seed';\n",
                          "import { resetAndSeed } from '../support/seed';\nimport { auditLines } from '../support/audit';\n")
        s = re.sub(r"(test\.describe\([^\n]*\{)\n\n", r"\1\n", s)
        for fn in POSTS.get(k, []):
            s = fn(s)
        os.makedirs(os.path.join(SPECS, f'cp{k}'), exist_ok=True)
        path = os.path.join(SPECS, f'cp{k}', base + '.spec.ts')
        open(path, 'w').write(s.rstrip('\n') + '\n')
        written.append(path)
        carried = [x for x in scenarios_before(base, k) if x['title'] not in retire]
        if reg:
            carried = reg(carried)
        for x in carried:
            REG.append((base, x['title'], k, copy.deepcopy(x['fx']), list(x['checks']), x['label']))
    return written
