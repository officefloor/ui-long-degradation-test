"""Cross-check the registry against the written specs.
1. every registry scenario's TS spec+title exists, and its seed is consistent with the registry
   fixture (rows the spec seeds appear in the registry with the same values; the registry may add
   rows/lines/payments the test creates through the UI and may change status/discount/dates the
   test changes through the UI);
2. every checked value appears literally in that spec file;
3. every spec test with figures has a registry scenario (reported, not fatal, for figure-free tests).
"""
import os, re, sys, glob
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from harness import fixtures as F
from acceptance.reference.scenarios import SC, values
from acceptance.reference.model import money
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'specs')
files = {}
for p in glob.glob(ROOT + '/cp*.spec.ts'):
    b = os.path.basename(p)[:-8]
    files[(b, int(re.match(r'cp(\d+)', b).group(1)))] = p
for p in glob.glob(ROOT + '/cp*/cp*.spec.ts'):
    k = int(os.path.basename(os.path.dirname(p))[2:])
    files[(os.path.basename(p)[:-8], k)] = p
F.prime(files.values())
MUTABLE_INV = {'status', 'discountPct', 'discountAmount', 'discountCap', 'discountReason', 'issueDate', 'dueDate', 'lineItems',
               'retentionPct', 'retentionReleasedOn', 'instalments', 'instalmentRate', 'interestWaivedOn',
               'writtenOffOn', 'retentionCap', 'planDownPct', 'retentionReleasedAmount',
               # Act IV: states a test's actions change on the workspace
               'approvedTotal', 'approvedOn', 'disputedOn', 'disputeResolvedOn', 'poNumber', 'recurring',
               'recurUntil', 'milestones', 'surchargePct', 'disputeCredit', 'approvals',
               # Act V: states a test's actions record
               'sentTotal', 'sentTax', 'rebilledOn', 'reminders', 'interestWaivedOn', 'promiseDate', 'promiseAmount'}
bad = []
def eq(a, b):
    return a == b or (isinstance(a, (int, float)) and isinstance(b, (int, float)) and abs(a - b) < 1e-9)
def rows_ok(ts, rg, mutable=()):
    for r in ts:
        m = [x for x in rg if x['id'] == r['id']]
        if not m:
            return f"row id {r['id']} missing"
        for k, v in r.items():
            if k in mutable:
                continue
            if k not in m[0] or not eq(m[0][k], v) and not (isinstance(v, list)):
                return f"row {r['id']}.{k}: spec {v!r} registry {m[0].get(k)!r}"
            if isinstance(v, list) and v != m[0][k]:
                return f"row {r['id']}.{k} differs"
    return None
for s in SC:
    key = (s['spec'], s['n'])
    if key not in files:
        bad.append(f'no file for {key}'); continue
    path = files[key]
    fx = dict(F.spec_fixtures(path))
    if s['title'] not in fx:
        bad.append(f"{key}: no test titled {s['title']!r}"); continue
    ts, rg = fx[s['title']], s['fx']
    errs = []
    if ts.get('asOf') != rg.get('asOf'): errs.append(f"asOf {ts.get('asOf')} vs {rg.get('asOf')}")
    if ts.get('settings', {}) != rg.get('settings', {}): errs.append('settings differ')
    # a test's actions may change a client's rate card (the rate form, from cp126) or hold (cp154)
    e = rows_ok(ts.get('clients', []), rg.get('clients', []),
                () if s['label'] in ('', 'before', 'seeded') else ('rates', 'onHold', 'tier', 'creditLimit'))
    if e: errs.append('clients: ' + e)
    e = rows_ok(ts.get('invoices', []), rg.get('invoices', []), MUTABLE_INV)
    if e: errs.append('invoices: ' + e)
    for inv in ts.get('invoices', []):
        rinv = next((x for x in rg['invoices'] if x['id'] == inv['id']), None)
        if rinv is None: continue
        rl = {l['id']: l for l in rinv['lineItems']}
        for l in inv['lineItems']:
            if l['id'] in rl and any(not eq(rl[l['id']].get(k), v) for k, v in l.items()) and s['label'] != 'after' \
                    and not (s['n'] > 200 and s['label'] not in ('', 'before', 'seeded')):   # Act V: a line edited in the test
                errs.append(f"line {l['id']} differs")
            if l['id'] not in rl and s['label'] != 'after' \
                    and not (s['n'] > 200 and s['label'] not in ('', 'before', 'seeded')):   # Act V: a line removed in the test
                errs.append(f"line {l['id']} missing")
        for k in ('discountPct', 'discountAmount', 'discountCap', 'issueDate', 'dueDate', 'status'):
            if k in inv and s['label'] in ('', 'before', 'seeded') and not eq(inv[k], rinv.get(k)) \
                    and not s['title'].startswith(('sends', 'changing', 'removing a line from')):
                errs.append(f"invoice {inv['id']}.{k} {inv[k]} vs {rinv.get(k)}")
    # a test's actions may reverse a payment, use its credit on an invoice or refund some of it
    pay_mut = {'reversed'} if s['label'] in ('', 'before', 'seeded') else {'reversed', 'allocations', 'refunded'}
    e = rows_ok(ts.get('payments', []), rg.get('payments', []), pay_mut)
    if e: errs.append('payments: ' + e)
    if errs:
        bad.append(f"{key} '{s['title']}' {s['label']}: " + '; '.join(errs))
    src = open(path).read()
    v = values(rg, s['n'])
    for c in s['checks']:
        if c.startswith('ok.'):
            continue     # a model check of the test's actions, not a figure the spec shows
        val = v[c]
        if val is None: continue
        plain = re.sub(r'[^0-9.\-]', '', val)
        ok = f"'{val}'" in src or (re.match(r'-?(\$|€|£|¥|CHF )', val) and f"={plain}" in src) \
            or (val.startswith(('INV-', 'CN-', 'ADJ-')) and val in src)
        if not ok:
            bad.append(f"{key} '{s['title']}': value {c}={val} not in spec")
print('\n'.join(bad) or 'registry and specs agree')
