"""Check that every send a test performs stays allowed (or refused) while that spec version is in force.

check_scenarios compares the FIGURES a test reads. It cannot see a test whose ACTION a later rule
starts refusing: cp51 sends a draft that cp161's risk band then holds for approval. That failure
would be scored as a regression although the agent did exactly what its requests said.

For every test that clicks `invoice-send`, the invoice sent is the last `invoice-row-<id>` clicked
before it. Its send is evaluated with model.send_refusal on the spec's seed and on every registry
fixture of that test (which add what the test's own actions did, such as a payment), first at the
version's checkpoint and then at each later one until the spec is replaced. A change in the verdict
at a checkpoint that does not declare the spec in `mutates:` is reported.

It also checks the ids a test reads back. A payment or client the test creates through its form
gets the next id after the highest one seeded (AGENTS.md: new records carry on numbering), so a
`payment-row-<id>` the test reads before that many payments exist can never be found: cp147 once
recorded two payments in one order and read their rows in the other. An id named in an audit line
the test already expects (CREDIT_HELD payment=2) counts as created. Invoices and lines are not
checked: generating, rebilling and credit notes create them in ways no form count can follow.
"""
import copy
import glob
import os
import re
import sys
from collections import defaultdict

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)
from harness import fixtures as F                       # noqa: E402
from acceptance.reference.scenarios import SC          # noqa: E402
from acceptance.reference.model import send_refusal    # noqa: E402

SPECS = os.path.join(ROOT, 'acceptance', 'specs')
TEST = re.compile(r"\n\s*test\(\s*(['\"`])(.*?)(?<!\\)\1", re.S)
ROW = re.compile(r"getByTestId\('invoice-row-(\d+)'\)\.click\(\)")
SEND = re.compile(r"getByTestId\('invoice-send'\)\.click\(\)")


def sends(src):
    """{test title: [invoice id sent, ...]} in the order the test sends them."""
    out = {}
    starts = [(m.start(), m.group(2).replace("\\'", "'")) for m in TEST.finditer(src)]
    for i, (s, title) in enumerate(starts):
        body = src[s: starts[i + 1][0] if i + 1 < len(starts) else len(src)]
        events = sorted([(m.start(), 'row', int(m.group(1))) for m in ROW.finditer(body)]
                        + [(m.start(), 'send', None) for m in SEND.finditer(body)])
        cur, sent = None, []
        for _, kind, iid in events:
            if kind == 'row':
                cur = iid
            elif cur is not None:
                sent.append(cur)
        if sent:
            out[title] = sent
    return out


ROW_ENTITIES = {'payment': ('payments', 'payment-form-submit',
                            [r'payment=(\d+)', r'PAYMENT_\w+ id=(\d+)', r'REFUND\w* id=(\d+)']),
                'client': ('clients', 'client-form-submit', [r'CLIENT_\w+ id=(\d+)'])}
ROW_REF = re.compile(r"getByTestId\('([a-z-]+?)(?:-row-(\d+))?'\)(\.click\(\))?|toContain\('([^']*)'\)|toEqual\(\[([^\]]*)\]")


def unborn_rows(path):
    """[(line, message)] for each payment/client row a test reads before it can exist."""
    src = open(path).read()
    seeds = dict(F.spec_fixtures(path))
    out = []
    starts = [(m.start(), m.group(2).replace("\\'", "'")) for m in TEST.finditer(src)]
    for i, (s, title) in enumerate(starts):
        body = src[s: starts[i + 1][0] if i + 1 < len(starts) else len(src)]
        seed = seeds.get(title) or {}
        known = {e: max([r.get('id', 0) for r in seed.get(key, []) if isinstance(r, dict)] + [0])
                 for e, (key, _, _) in ROW_ENTITIES.items()}
        for m in ROW_REF.finditer(body):
            tid, rid, click, aud, aud_list = m.groups()
            if aud or aud_list:
                for e, (_, _, pats) in ROW_ENTITIES.items():
                    for pat in pats:
                        for x in re.findall(pat, aud or aud_list):
                            known[e] = max(known[e], int(x))
                continue
            for e, (_, submit, _) in ROW_ENTITIES.items():
                if click and tid == submit:
                    known[e] += 1
            if rid and tid in ROW_ENTITIES and int(rid) > known[tid]:
                line = src[:s + m.start()].count('\n') + 1
                out.append((line, f"'{title}' reads {tid}-row-{rid} when only ids up to "
                                  f"{known[tid]} can exist"))
    return out


def verdict(fx, iid, n):
    try:
        return send_refusal(copy.deepcopy(fx), iid, n)
    except (StopIteration, KeyError, AttributeError):   # the invoice only exists once the test creates it
        return 'n/a'


def main():
    cps = yaml.safe_load(open(os.path.join(ROOT, 'checkpoints.yaml')))['checkpoints']
    last = len(cps)
    mut = {i: {int(x) for x in (cp.get('mutates') or [])} for i, cp in enumerate(cps, 1)}
    versions = defaultdict(list)                       # basename -> [(n, path)]
    for p in glob.glob(SPECS + '/cp*.spec.ts'):
        b = os.path.basename(p)
        versions[b].append((int(re.match(r'cp(\d+)', b).group(1)), p))
    for p in glob.glob(SPECS + '/cp*/cp*.spec.ts'):
        versions[os.path.basename(p)].append((int(os.path.basename(os.path.dirname(p))[2:]), p))
    F.prime([p for v in versions.values() for _, p in v])
    registry = defaultdict(list)
    for s in SC:
        registry[(s['spec'] + '.spec.ts', s['n'], s['title'])].append(s['fx'])

    problems, notes, checked = [], [], 0
    for base, vs in sorted(versions.items()):
        vs.sort()
        own = int(re.match(r'cp(\d+)', base).group(1))
        for j, (n, path) in enumerate(vs):
            end = vs[j + 1][0] - 1 if j + 1 < len(vs) else last
            seeds = dict(F.spec_fixtures(path))
            for title, ids in sends(open(path).read()).items():
                # the registry's fixtures include what the test did before it sends (a payment);
                # the bare seed stands in only for a test the registry has no figures for
                fxs = registry.get((base, n, title)) or ([seeds[title]] if title in seeds else [])
                for iid in dict.fromkeys(ids):
                    for fx in fxs:
                        base_v = verdict(fx, iid, n)
                        if base_v == 'n/a':
                            continue
                        checked += 1
                        for k in range(n + 1, end + 1):
                            v = verdict(fx, iid, k)
                            if v != base_v and own not in mut.get(k, ()):
                                rel = os.path.relpath(path, ROOT)
                                # refused either way: the test sees the same send error, only the
                                # reason differs
                                into = notes if base_v and v else problems
                                into.append(f"{rel} '{title}': sending invoice {iid} is "
                                                f"{base_v or 'allowed'} at cp{n} but {v or 'allowed'} "
                                                f"from cp{k} (cp{k} does not mutate cp{own})")
                                break
    for base, vs in sorted(versions.items()):
        for _, path in vs:
            for line, msg in unborn_rows(path):
                problems.append(f"{os.path.relpath(path, ROOT)}:{line} {msg}")
    for p in dict.fromkeys(notes):
        print('note: ' + p)
    for p in dict.fromkeys(problems):
        print(p)
    print(f"checked {checked} sends across every checkpoint each spec version is in force")
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
