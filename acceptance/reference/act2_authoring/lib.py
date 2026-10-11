"""Act II authoring generator: one Python description per spec renders the TS spec (seed literal +
figures from the model) and the registry entries, so spec and registry can't disagree."""
import copy, os, re, sys, textwrap
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, REPO)
from acceptance.reference.model import workspace_values, invoice_number_luhn, rf_reference, plain as _plain
from acceptance.reference import model as M

A = {'id': 1, 'name': 'Acme Ltd', 'email': 'ops@acme.example'}
G = {'id': 2, 'name': 'Globex Corp', 'email': 'billing@globex.example'}


def C(base=A, **kw):
    return dict(base, **kw)


def L(i, d, q, p, **kw):
    return dict(id=i, description=d, qty=q, unitPrice=p, **kw)


def I(i, c, st, iss, due, lines, **kw):
    r = dict(id=i, clientId=c, status=st, issueDate=iss, dueDate=due)
    r.update(kw)
    r['lineItems'] = lines
    return r


def P(i, c, amt, date, allocs, **kw):
    al = []
    for a in allocs:
        x = dict(invoiceId=a[0], amount=a[1])
        if len(a) > 2:
            x['date'] = a[2]
        al.append(x)
    r = dict(id=i, clientId=c, amount=amt, date=date)
    r.update({k: v for k, v in kw.items() if k in ('currency',)})
    r['allocations'] = al
    r.update({k: v for k, v in kw.items() if k not in ('currency',)})
    return r


def plus(fx, **kw):
    f = copy.deepcopy(fx)
    for k, v in kw.items():
        if k == 'lines':
            for inv_id, line in v:
                next(i for i in f['invoices'] if i['id'] == inv_id)['lineItems'].append(line)
        elif k == 'payments':
            f.setdefault('payments', []).extend(copy.deepcopy(v))
        elif k == 'inv':
            for inv_id, upd in v:
                inv = next(i for i in f['invoices'] if i['id'] == inv_id)
                for kk, vv in upd.items():
                    if vv is None:
                        inv.pop(kk, None)
                    else:
                        inv[kk] = vv
        elif k == 'drop_lines':
            for inv_id, lid in v:
                inv = next(i for i in f['invoices'] if i['id'] == inv_id)
                inv['lineItems'] = [l for l in inv['lineItems'] if l['id'] != lid]
        elif k == 'reverse':
            for pid in v:
                next(p for p in f['payments'] if p['id'] == pid)['reversed'] = True
        elif k == 'alloc':
            for pid, iid, amt, date in v:
                next(p for p in f['payments'] if p['id'] == pid)['allocations'].append(
                    dict(invoiceId=iid, amount=amt, date=date))
        elif k == 'pay':
            for pid, upd in v:
                next(p for p in f['payments'] if p['id'] == pid).update(upd)
        elif k == 'invoices':
            f['invoices'].extend(copy.deepcopy(v))
        elif k == 'clients':
            f['clients'].extend(copy.deepcopy(v))
        elif k == 'settings':
            f.setdefault('settings', {}).update(v)
        else:
            raise KeyError(k)
    return f


# ------------------------------------------------------------------------------ TS rendering

def ts(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return "'" + v.replace("\\", "\\\\").replace("'", "\\'") + "'"
    if isinstance(v, list):
        if not v:
            return '[]'
        return '[' + ', '.join(ts(x) for x in v) + ']'
    if isinstance(v, dict):
        if not v:
            return '{}'
        return '{ ' + ', '.join(f'{k}: {ts(x)}' for k, x in v.items()) + ' }'
    raise TypeError(v)


W = 110


def pack(tokens, first_prefix, cont_prefix, close):
    """Pack 'k: v' tokens into lines, the first starting with first_prefix."""
    lines, cur = [], first_prefix
    for i, t in enumerate(tokens):
        piece = t + (',' if i < len(tokens) - 1 else close)
        sep = '' if cur.endswith(('{ ', '[')) or cur == first_prefix else ' '
        if len(cur) + len(sep) + len(piece) > W and cur.strip() not in ('{', ''):
            lines.append(cur.rstrip())
            cur = cont_prefix + piece
        else:
            cur = cur + sep + piece
    lines.append(cur)
    return lines


def render_row(row, ind, key_first=None):
    """One collection row: inline if it fits, else wrapped; lineItems / allocations get own lines."""
    s = ind + ts(row) + ','
    if len(s) <= W:
        return [s]
    nested = [k for k in row if isinstance(row[k], list) and row[k] and isinstance(row[k][0], dict)]
    head = [f'{k}: {ts(v)}' for k, v in row.items() if k not in nested]
    out = pack(head, ind + '{ ', ind + '  ', ',' if nested else ' },')
    for j, k in enumerate(nested):
        items = row[k]
        last = j == len(nested) - 1
        one = ind + f'  {k}: ' + ts(items) + (' },' if last else ',')
        if len(one) <= W:
            out.append(one)
        else:
            out.append(ind + f'  {k}: [')
            for it in items:
                out.append(ind + '    ' + ts(it) + ',')
            out.append(ind + '  ]' + (' },' if last else ','))
    return out


def render_fixture(fx, ind='      '):
    out = []
    for k, v in fx.items():
        if isinstance(v, list):
            if not v:
                out.append(f'{ind}{k}: [],')
                continue
            one = f'{ind}{k}: [' + ts(v[0])[0:] + '],'
            if len(v) == 1 and len(one) <= W and k in ('clients', 'payments'):
                out.append(one)
                continue
            out.append(f'{ind}{k}: [')
            for row in v:
                out.extend(render_row(row, ind + '  '))
            out.append(f'{ind}],')
        elif isinstance(v, dict):
            one = f'{ind}{k}: {ts(v)},'
            if len(one) <= W:
                out.append(one)
            else:
                out.append(f'{ind}{k}: {{')
                for kk, vv in v.items():
                    if isinstance(vv, list):
                        out.append(f'{ind}  {kk}: [')
                        for it in vv:
                            out.append(f'{ind}    {ts(it)},')
                        out.append(f'{ind}  ],')
                    else:
                        out.append(f'{ind}  {kk}: {ts(vv)},')
                out.append(f'{ind}}},')
        else:
            out.append(f'{ind}{k}: {ts(v)},')
    return out


# ------------------------------------------------------------------------------ specs

PH = re.compile(r"\{([A-Za-z]\w*):([\w.]+)(?:\|(plain))?\}")


def plain_of(val):
    return re.sub(r'[^0-9.\-]', '', val)


class T:
    def __init__(self, title, tag, seed, body, **states):
        self.title, self.tag, self.seed, self.body = title, tag, seed, body
        self.states = dict(states)
        self.states.setdefault('s', seed)


class Spec:
    def __init__(self, basename, describe, header, tests, n, copy_note=None):
        self.basename, self.describe, self.header, self.tests, self.n = basename, describe, header, tests, n
        self.copy_note = copy_note


REG = []      # (spec, title, n, fx, checks, label)


def render_test(basename, n, t, register=True):
    """One test block, its figures from the model at version n; registers what it asserts."""
    vals = {lab: workspace_values(fx, n, strict=True) for lab, fx in t.states.items()}
    used = {}

    def sub(m):
        lab, key, fmt = m.group(1), m.group(2), m.group(3)
        if lab not in vals:
            raise KeyError(f'{basename} {t.title!r}: no state {lab}')
        if key not in vals[lab]:
            raise KeyError(f'{basename} {t.title!r}: no value {key} in {lab}')
        v = vals[lab][key]
        if v is None:
            raise ValueError(f'{basename} {t.title!r}: {lab}:{key} is None')
        used.setdefault(lab, [])
        if key not in used[lab]:
            used[lab].append(key)
        return plain_of(v) if fmt == 'plain' else v
    body = PH.sub(sub, textwrap.dedent(t.body).strip('\n'))
    if register:
        for lab, keys in used.items():
            REG.append((basename, t.title, n, copy.deepcopy(t.states[lab]), keys, '' if lab == 's' else lab))
    q = '"' if "'" in t.title else "'"
    lines = [f"  test({q}{t.title}{q}, {{ tag: '{t.tag}' }}, async ({{ page }}) => {{",
             '    await resetAndSeed({']
    lines += render_fixture(t.seed)
    lines += ['    });', "    await page.goto('/');", '']
    for bl in body.split('\n'):
        lines.append(('    ' + bl) if bl.strip() else '')
    lines.append('  });')
    return '\n'.join(lines)


def render(spec, register=True):
    tests_ts = [render_test(spec.basename, spec.n, t, register) for t in spec.tests]
    body_all = '\n'.join(tests_ts)
    head = ["import { test, expect } from '@playwright/test';",
            "import { resetAndSeed } from '../support/seed';"]
    if 'auditLines' in body_all:
        head.append("import { auditLines } from '../support/audit';")
    head.append('')
    hdr = []
    if spec.copy_note:
        hdr += wrap_comment(spec.copy_note)
    hdr += wrap_comment(spec.header)
    q = '"' if "'" in spec.describe else "'"
    return '\n'.join(head + hdr) + f"\ntest.describe({q}{spec.describe}{q}, () => {{\n" + '\n\n'.join(tests_ts) + '\n});\n'


def wrap_comment(text):
    text = ' '.join(textwrap.dedent(text).split())
    return ['// ' + l for l in textwrap.wrap(text, 97)]


# ------------------------------------------------------------------------------ checkpoints

CPS = []      # dicts: n, slug, type, mutates, retires, algorithm, request
SPECFN = {}   # basename -> fn(n) -> Spec
COPIES = {}   # n -> [basename]  (Act II specs re-rendered at n)


def cp(n, slug, request, specfn, type_='additive', mutates=None, retires=None, algorithm=None, copies=()):
    base = f'cp{n:02d}_{slug}' if n < 100 else f'cp{n}_{slug}'
    CPS.append(dict(n=n, id=base, type=type_, mutates=mutates, retires=retires, algorithm=algorithm,
                    request=request, base=base))
    SPECFN[base] = specfn
    for c in copies:
        COPIES.setdefault(n, []).append(c)
    return base
