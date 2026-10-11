"""Act V authoring helpers (authoring aid, never shown to the agent). Builds on the Act II-IV generators
(act2_authoring/lib.py, act3_authoring/lib3.py, act4_authoring/lib4.py): the same spec description (T,
Spec), rendering and registry, so every figure an Act V spec asserts comes from model.py with the spec's
own seed.

Act V also checks the test's actions against the model: sending (send_state / send_refusal), payment
routing (route) and Apply credit (apply_credit) build the state after the action, and record it under
'_ok', so the registry re-evaluates them at every later checkpoint ('ok.send<id>', 'ok.pay<id>',
'ok.credit<id>'): a later rule that would send, refuse, date or route differently is reported by
check_scenarios.py like a changed figure."""
import copy, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'act4_authoring'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'act3_authoring'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'act2_authoring'))
import lib  # noqa: E402
import lib3  # noqa: E402
import lib4  # noqa: E402
from lib4 import *  # noqa: E402,F401,F403
from lib import REPO, REG, SPECFN, CPS, COPIES, render_test, wrap_comment, workspace_values  # noqa: E402
from acceptance.reference import model as M  # noqa: E402
from decimal import Decimal as D  # noqa: E402
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import panel_waits  # noqa: E402  (copies patch the authored text, without the waits)

SPECS = os.path.join(REPO, 'acceptance/specs')
FIRST = 201

# ------------------------------------------------------------------------------ rendering with model checks


def render(spec, register=True):
    """lib.render, then every registered state that recorded actions ('_ok') also checks them."""
    start = len(REG)
    text = lib.render(spec, register)
    if not register:
        return text
    done = set()
    for j in range(start, len(REG)):
        b, title, n, fx, checks, label = REG[j]
        if fx.get('_ok'):
            ok = sorted(k for k in workspace_values(fx, n) if k.startswith('ok.'))
            REG[j] = (b, title, n, fx, checks + [k for k in ok if k not in checks], label)
        done.add((title, label))
    for t in spec.tests:
        for lab, fx in t.states.items():
            key = (t.title, '' if lab == 's' else lab)
            if fx.get('_ok') and key not in done:
                ok = sorted(k for k in workspace_values(fx, spec.n) if k.startswith('ok.'))
                REG.append((spec.basename, t.title, spec.n, copy.deepcopy(fx), ok, key[1]))
                done.add(key)
    return text


def _ok(fx, entry):
    f = copy.deepcopy(fx)
    f.setdefault('_ok', []).append(entry)
    return f


def _bare(fx):
    return copy.deepcopy({k: v for k, v in fx.items() if k != '_ok'})


def sent5(fx, ids, n):
    """fx with drafts sent today, one after another, as the model sends them (due date by the terms, the
    snapshot kept, credit used); each send checked at every later checkpoint."""
    f = fx
    for i in ids:
        why = M.send_refusal(_bare(f), i, n)
        assert why is None, f'sending {i} is refused at cp{n}: {why}'
        pre = _bare(f)
        s2 = M.send_state(pre, i, n)
        s2['_ok'] = copy.deepcopy(f.get('_ok', [])) + [('send', i, pre)]
        f = s2
    return f


def refused5(fx, iid, n, why=None):
    """fx with a refused send of iid recorded (the reason checked at every later checkpoint)."""
    got = M.send_refusal(_bare(fx), iid, n)
    assert got is not None and (why is None or got == why), f'sending {iid} at cp{n}: {got}'
    return _ok(fx, ('send', iid, _bare(fx)))


def pay5(fx, pmt, n, open_id=None):
    """fx plus a payment recorded on the form, its allocations as the model routes them."""
    pre = _bare(fx)
    p = copy.deepcopy(pmt)
    p['allocations'] = []
    dec = M.dec_of(M.Ctx(pre, n).ccy(p['clientId']))
    p['allocations'] = [dict(invoiceId=i, amount=M.major(a, dec)) for i, a in M.route(pre, pmt, n, open_id)]
    f = plus(fx, payments=[p])
    f['_ok'] = copy.deepcopy(fx.get('_ok', [])) + [('pay', p['id'], open_id, pre, dict(p, allocations=[]))]
    return f


def credit5(fx, cid, n):
    """fx after Apply credit for client cid (the credit used dated today)."""
    pre = _bare(fx)
    ctx = M.Ctx(pre, n)
    dec = M.dec_of(ctx.ccy(cid))
    f = copy.deepcopy(fx)
    for pid, iid, a in M.apply_credit(pre, cid, n):
        next(p for p in f['payments'] if p['id'] == pid)['allocations'].append(
            dict(invoiceId=iid, amount=M.major(a, dec), date=pre['asOf']))
    f['_ok'] = copy.deepcopy(fx.get('_ok', [])) + [('credit', cid, pre)]
    return f


def remind5(fx, iid, n):
    """fx after Remind on invoice iid: the reminder for the level it has reached goes out today."""
    pre = _bare(fx)
    ctx = M.Ctx(pre, n)
    assert M.can_remind(M.find_inv(ctx, iid), ctx, n), f'remind {iid} refused at cp{n}: {M.dunning_of(M.find_inv(ctx, iid), ctx, n)}'
    f = copy.deepcopy(fx)
    inv = next(x for x in f['invoices'] if x['id'] == iid)
    inv['reminders'] = list(inv.get('reminders') or []) + [f['asOf']]
    if n >= 233:     # cp233: the reminder goes for the invoice's overdue debit notes too
        for x in f['invoices']:
            if x.get('adjustmentOf') == iid and x.get('status') == 'SENT' and not M.is_credit_adj(x) \
                    and M.figures(M.find_inv(ctx, x['id']), n, ctx)['status'] == 'Overdue':
                x['reminders'] = list(x.get('reminders') or []) + [f['asOf']]
    f.setdefault('_ok', []).append(('remind', iid, pre))
    return f


def no_remind5(fx, iid, n):
    """fx with a refused Remind on invoice iid recorded."""
    pre = _bare(fx)
    ctx = M.Ctx(pre, n)
    assert not M.can_remind(M.find_inv(ctx, iid), ctx, n), f'remind {iid} allowed at cp{n}'
    return _ok(fx, ('remind', iid, pre))


def next_inv_id(fx):
    return max(x['id'] for x in fx['invoices']) + 1


def next_line_id(fx):
    return max([l['id'] for x in fx['invoices'] for l in x['lineItems']] + [0]) + 1


def next_pay_id(fx):
    return max([p['id'] for p in fx.get('payments', [])] + [0]) + 1


def _num(x):
    v = D(str(x))
    return int(v) if v == v.to_integral_value() else float(v)


def adj_note(fx, orig_id, lines, n):
    """fx plus an adjustment note against orig_id with the given lines (new line ids are given here). A
    note taking lines off (negative quantities) is issued at once like a credit note, anything beyond what
    the original still owes held as a credit payment; a debit note is sent at once like any invoice sent
    today (due by the usual terms, the client's credit used on it)."""
    f = copy.deepcopy(fx)
    new = next_inv_id(f)
    lid = next_line_id(f)
    ls = []
    for l in lines:
        ls.append(dict(l, id=lid))
        lid += 1
    orig = next(x for x in f['invoices'] if x['id'] == orig_id)
    adj = dict(id=new, clientId=orig['clientId'], status='DRAFT', issueDate=f['asOf'], dueDate=f['asOf'],
               adjustmentOf=orig_id)
    if n >= 226 and orig.get('poNumber'):
        adj['poNumber'] = orig['poNumber']     # cp226: a note carries its invoice's purchase order
    adj['lineItems'] = ls
    f['invoices'].append(adj)
    if M.is_credit_adj(adj):
        before = M.figures(orig, n, M.Ctx(_bare(fx), n))['due']
        adj['status'] = 'SENT'
        ctx = M.Ctx(_bare(f), n)
        dec = M.dec_of(ctx.ccy(orig['clientId']))
        g = M.adj_base(adj, n, ctx, ctx.clients[orig['clientId']], dec)['grand']
        if g > before:
            allocs = []
            if n >= 246:
                # cp246: the excess pays the invoice's unpaid debit notes first, oldest first
                left = g - before
                for x in sorted(M.adj_notes(M.find_inv(ctx, orig_id), ctx, n), key=lambda x: (x['issueDate'], x['id'])):
                    if M.is_credit_adj(x):
                        continue
                    owe = M.figures(x, n, ctx)['due']
                    take = min(owe, left)
                    if take > 0:
                        allocs.append(dict(invoiceId=x['id'], amount=M.major(take, dec), date=f['asOf']))
                        left -= take
            f.setdefault('payments', []).append(dict(id=next_pay_id(f), clientId=orig['clientId'],
                                                     amount=M.major(g - before, dec), date=f['asOf'],
                                                     creditNote=new, allocations=allocs))
        return f
    pre = _bare(f)
    why = M.send_refusal(pre, new, n) if n >= 210 else None
    if why == 'approval' or (n >= 249 and why == 'hold'):
        # cp210: a debit note that needs approval waits as a draft (cp249: so does one for a client on hold)
        f['_ok'] = copy.deepcopy(fx.get('_ok', [])) + [('send', new, pre)]
        return f
    over = n >= 243 and M.figures(M.find_inv(M.Ctx(pre, n), orig_id), n, M.Ctx(pre, n))['status'] == 'Overdue'
    s2 = M.send_state(pre, new, n)
    if over:     # cp243: a note on an overdue invoice is due at once
        next(x for x in s2['invoices'] if x['id'] == new)['dueDate'] = s2['asOf']
    s2['_ok'] = copy.deepcopy(fx.get('_ok', [])) + [('send', new, pre)]
    return s2


def add5(fx, orig_id, line, n):
    """A line added to a sent invoice: billed on a debit adjustment note."""
    return adj_note(fx, orig_id, [line], n)


def _line(fx, orig_id, lid):
    orig = next(x for x in fx['invoices'] if x['id'] == orig_id)
    return copy.deepcopy(next(l for l in orig['lineItems'] if l['id'] == lid))


def remove5(fx, orig_id, lid, n):
    """A line removed from a sent invoice: taken off by a credit adjustment note."""
    l = _line(fx, orig_id, lid)
    l = {k: v for k, v in l.items() if k not in ('disputed', 'billedPct')}
    l['qty'] = _num(-D(str(l['qty'])))
    if n >= 234:
        l['adjustsLine'] = lid
    f = adj_note(fx, orig_id, [l], n)
    if n >= 234:
        # cp234: taking off the last disputed line resolves the dispute with credit
        orig = next(x for x in f['invoices'] if x['id'] == orig_id)
        taken = {al.get('adjustsLine') for x in f['invoices'] if x.get('adjustmentOf') == orig_id
                 and M.is_credit_adj(x) for al in x['lineItems']}
        disputed = [x for x in orig['lineItems'] if x.get('disputed')]
        if orig.get('disputedOn') and not orig.get('disputeResolvedOn') and disputed \
                and all(x['id'] in taken for x in disputed):
            orig['disputeResolvedOn'] = f['asOf']
            orig['disputeCredit'] = True
    return f


def edit5(fx, orig_id, lid, n, **changes):
    """A line of a sent invoice edited: a change of quantity alone is one note for the difference; any other
    change takes the old line off (credit note) and bills the new one (debit note)."""
    old = _line(fx, orig_id, lid)
    old = {k: v for k, v in old.items() if k not in ('disputed', 'billedPct')}
    newl = dict(old, **changes)
    link = dict(adjustsLine=lid) if n >= 234 else {}
    if n >= 244 and set(changes) != {'qty'}:
        # cp244: any other edit is one note for the change in the line's amount
        ctx = M.Ctx(_bare(fx), n)
        orig = M.find_inv(ctx, orig_id)
        client = ctx.clients[orig['clientId']]
        dec = M.dec_of(ctx.ccy(orig['clientId']))

        def amount(line):
            syn = dict(orig, lineItems=[dict(line, id=0)], discountPct=None, discountAmount=None, discountCap=None,
                       surchargePct=None)
            return M.base_figures(syn, n, ctx.settings, client, dec, ctx=ctx, adjustment=True)['lines'][0]['amount']
        diff = amount(newl) - amount(old)
        keep = {k: v for k, v in old.items() if k in ('taxRate', 'taxExempt')}
        line = dict(id=0, description=old['description'], qty=1 if diff > 0 else -1,
                    unitPrice=M.major(abs(diff), dec), **keep, **link)
        return adj_note(fx, orig_id, [line], n)
    if set(changes) == {'qty'}:
        diff = D(str(newl['qty'])) - D(str(old['qty']))
        return adj_note(fx, orig_id, [dict(old, qty=_num(diff), **link)], n)
    f = adj_note(fx, orig_id, [dict(old, qty=_num(-D(str(old['qty']))), **link)], n)
    return adj_note(f, orig_id, [dict(newl, **link)], n)


def rebill_refused(fx, orig_id, n):
    """Why Rebill is refused on an invoice (None when it is allowed)."""
    ctx = M.Ctx(_bare(fx), n)
    inv = M.find_inv(ctx, orig_id)
    if inv.get('status') != 'SENT' or inv.get('creditOf') is not None or inv.get('adjustmentOf') is not None:
        return 'not a sent invoice'
    st = M.figures(inv, n, ctx)['status']
    if st in ('Written off', 'Credited', 'Void') or inv.get('rebilledOn'):
        return st
    if n >= 222 and len(inv.get('reminders') or []) >= 3:
        return 'final notice'
    return None


def rebill5(fx, orig_id, n):
    """fx after Rebill: a credit note (next id) for every line of the original, dated today; the original
    marked rebilled; a replacement draft (the id after) with the original's lines, percentage discount,
    surcharge and purchase order; what was paid on the original held as credit for the replacement."""
    why = rebill_refused(fx, orig_id, n)
    assert why is None, f'rebill of {orig_id} refused at cp{n}: {why}'
    f = copy.deepcopy(fx)
    today = f['asOf']
    orig = next(x for x in f['invoices'] if x['id'] == orig_id)
    cn_id = next_inv_id(f)
    lid = next_line_id(f)
    cn_lines = []
    for l in orig['lineItems']:
        cl = {k: v for k, v in l.items() if k not in ('disputed', 'billedPct')}
        cl.update(id=lid, creditOfLine=l['id'])
        cn_lines.append(cl)
        lid += 1
    f['invoices'].append(dict(id=cn_id, clientId=orig['clientId'], status='SENT', issueDate=today, dueDate=today,
                              creditOf=orig_id, lineItems=cn_lines))
    orig['rebilledOn'] = today
    rep_lines = []
    for l in orig['lineItems']:
        rl = {k: v for k, v in l.items() if k not in ('disputed', 'billedPct')}
        rl['id'] = lid
        rep_lines.append(rl)
        lid += 1
    rep = dict(id=cn_id + 1, clientId=orig['clientId'], status='DRAFT', issueDate=today, dueDate=orig['dueDate'],
               replaces=orig_id)
    for k in ('discountPct', 'surchargePct', 'poNumber'):
        if orig.get(k) is not None:
            rep[k] = orig[k]
    if n >= 211:
        # cp211: an open dispute, milestones and a recurring plan move to the replacement
        for l, rl in zip(orig['lineItems'], rep_lines):
            if l.get('disputed') and orig.get('disputedOn') and not orig.get('disputeResolvedOn'):
                rl['disputed'] = True
        for k in ('disputedOn', 'recurring', 'recurringSince', 'recurUntil'):
            if orig.get(k) is not None and not (k == 'disputedOn' and orig.get('disputeResolvedOn')):
                rep[k] = orig[k]
        if orig.get('disputedOn') and not orig.get('disputeResolvedOn'):
            orig['disputeResolvedOn'] = today
        if orig.get('recurring'):
            orig['recurring'] = False
        if orig.get('milestones'):
            mid = max([m['id'] for x in f['invoices'] for m in x.get('milestones') or []]) + 1
            rep['milestones'] = []
            for m in orig['milestones']:
                rep['milestones'].append(dict(m, id=mid))
                mid += 1
    if n >= 214:
        # cp214: late interest owed on the old invoice is carried to the replacement as an untaxed line
        ctx0 = M.Ctx(_bare(fx), n)
        owed = M.figures(M.find_inv(ctx0, orig_id), n, ctx0).get('interestOwed') or 0
        if owed > 0:
            dec = M.dec_of(ctx0.ccy(orig['clientId']))
            rep_lines.append(dict(id=lid, description=f"Late interest {M.number_of(orig, n, today)}", qty=1,
                                  unitPrice=M.major(owed, dec), carriedInterest=True))
            lid += 1
            orig['interestWaivedOn'] = today
    if n >= 222 and orig.get('reminders'):
        rep['reminders'] = list(orig['reminders'])   # cp222: the reminders move with it
    rep['lineItems'] = rep_lines
    f['invoices'].append(rep)
    if n >= 211:
        ctx = M.Ctx(_bare(f), n)
        o = M.find_inv(ctx, orig_id)
        r = M.find_inv(ctx, rep['id'])
        g_o = M.invoice_grand(o, n, ctx)[0]
        fr = M.figures(r, n, ctx)
        if fr['grand'] <= g_o and (fr.get('approval') or '').startswith('Needs'):
            rep['approvedTotal'] = M.major(fr['grand'], M.dec_of(ctx.ccy(orig['clientId'])))
            rep['approvedOn'] = today
    ctx = M.Ctx(_bare(f), n)
    num = M.number_of(rep, n, today)
    for p in f.get('payments', []):
        mine = [a for a in p['allocations'] if a['invoiceId'] == orig_id]
        if mine:
            p['allocations'] = [a for a in p['allocations'] if a['invoiceId'] != orig_id]
            if not p['allocations']:
                p['reference'] = num
    return f


def owed_on(fx, iid, date, n):
    """What invoice iid owes on a date (for a payment that clears it then), as a fixture number."""
    f = dict(_bare(fx), asOf=date)
    ctx = M.Ctx(f, n)
    inv = M.find_inv(ctx, iid)
    return M.major(M.figures(inv, n, ctx)['due'], M.dec_of(ctx.ccy(inv['clientId'])))


def d5(fx, n):
    """Model values at n (for figures a test computes from, e.g. the amount it pays)."""
    return workspace_values(_bare(fx), n)


# ------------------------------------------------------------------------------ copies at Act V mutations

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
    """Registry entries of the version of base in force before k (Acts I-IV registry + this build)."""
    from acceptance.reference.scenarios import SC
    pool = [s for s in SC if s['spec'] == base and s['n'] < FIRST]
    pool += [dict(spec=r[0], title=r[1], n=r[2], fx=r[3], checks=r[4], label=r[5]) for r in REG if r[0] == base]
    prev = max(s['n'] for s in pool if s['n'] < k)
    return [s for s in pool if s['n'] == prev]


def strip_note(s):
    """lib3.strip_note, also for an earlier copy note with no 'Carries' sentence (it ends at its first full
    stop at a line end)."""
    lines = s.split('\n')
    i = lines.index('')
    j = i + 1
    if lines[j].startswith('// UPDATED for'):
        end = next(x for x in range(j, len(lines)) if lines[x].startswith('test.describe('))
        if any('Carries' in lines[x] for x in range(j, end)):
            return lib3.strip_note(s)
        while not lines[j].rstrip().endswith('.'):
            j += 1
        j += 1
    return lines, i, j


def write_text_copies():
    written = []
    for k, base, header, reps, retire, add_ts, reg in sorted(TEXT_COPIES, key=lambda c: c[0]):
        src = latest_path(base, k)
        s = panel_waits.strip_waits(open(src).read())
        lines, i, j = strip_note(s)
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
            start = len(REG)
            tests = add_ts()
            add_ts = '\n\n'.join(render_test(base, k, t) for t in tests)
            _ok_register(base, k, tests, start)
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


def _ok_register(base, n, tests, start):
    done = set()
    for j in range(start, len(REG)):
        b, title, nn, fx, checks, label = REG[j]
        if fx.get('_ok'):
            ok = sorted(k for k in workspace_values(fx, nn) if k.startswith('ok.'))
            REG[j] = (b, title, nn, fx, checks + [k for k in ok if k not in checks], label)
        done.add((title, label))
    for t in tests:
        for lab, fx in t.states.items():
            key = (t.title, '' if lab == 's' else lab)
            if fx.get('_ok') and key not in done:
                ok = sorted(k for k in workspace_values(fx, n) if k.startswith('ok.'))
                REG.append((base, t.title, n, copy.deepcopy(fx), ok, key[1]))
