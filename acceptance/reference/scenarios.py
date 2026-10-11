"""Scenario registry: every figure/status a spec asserts, with the data it is computed from.

Each scenario: spec basename (without .spec.ts), test title, the checkpoint n of the version that
asserts it, a fixture (the seed, plus anything the test's actions add), and the keys it checks.
check.py evaluates them under the rules of every later checkpoint to find what a mutation changes.
"""
import copy
from acceptance.reference.model import *

A = {'id': 1, 'name': 'Acme Ltd', 'email': 'ops@acme.example'}
G = {'id': 2, 'name': 'Globex Corp', 'email': 'billing@globex.example'}


def C(**kw):
    return dict(A, **kw)


def L(i, d, q, p, **kw):
    return dict(id=i, description=d, qty=q, unitPrice=p, **kw)


def I(i, c, st, iss, due, lines, **kw):
    r = dict(id=i, clientId=c, status=st, issueDate=iss, dueDate=due, lineItems=lines)
    r.update(kw)
    return r


def P(i, c, amt, date, allocs, **kw):
    return dict(id=i, clientId=c, amount=amt, date=date,
                allocations=[dict(invoiceId=a, amount=b) for a, b in allocs], **kw)


SC = []


def S(spec, title, n, fx, checks, label=''):
    SC.append(dict(spec=spec, title=title, n=n, fx=copy.deepcopy(fx), checks=checks, label=label))


def plus(fx, **kw):
    """fixture with extra rows appended (actions in the test)."""
    f = copy.deepcopy(fx)
    for k, v in kw.items():
        if k == 'lines':
            for inv_id, line in v:
                next(i for i in f['invoices'] if i['id'] == inv_id)['lineItems'].append(line)
        elif k == 'payments':
            f.setdefault('payments', []).extend(v)
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
            # credit used on an invoice: (payment id, invoice id, amount, date applied)
            for pid, iid, amt, date in v:
                next(p for p in f['payments'] if p['id'] == pid)['allocations'].append(
                    dict(invoiceId=iid, amount=amt, date=date))
        elif k == 'pay':
            for pid, upd in v:
                next(p for p in f['payments'] if p['id'] == pid).update(upd)
        elif k == 'invoices':
            f['invoices'].extend(v)
        elif k == 'clients':
            f['clients'].extend(v)
        else:
            raise KeyError(k)
    return f


def values(fx, n):
    return workspace_values(fx, n)


ASOF = '2026-03-10'

# ---------------------------------------------------------------- cp03 client invoices
fx = dict(asOf=ASOF, clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 45), L(2, 'Hosting', 1, 10)]),
    I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Copywriting', 3, 20)]),
    I(3, 2, 'SENT', '2026-03-02', '2026-04-30', [L(4, 'Audit', 1, 500)])])
S('cp03_client_invoices', "lists only the selected client's invoices", 3, fx,
  ['inv1.status', 'inv1.grand', 'inv2.status', 'inv2.grand', 'inv3.status', 'inv3.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Support', 1.25, 10.10), L(2, 'Support call', 1.25, 10.10)])])
S('cp03_client_invoices', 'totals an invoice from its fractional-quantity lines', 3, fx, ['inv1.grand'])

# ---------------------------------------------------------------- cp04 line rounding
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Consulting', 2.5, 10.25), L(2, 'Review', 0.75, 30.10), L(3, 'Calls', 1.5, 0.35)])])
S('cp04_line_rounding', 'rounds each line before adding them up', 4, fx, ['inv1.grand'])

# ---------------------------------------------------------------- cp05 invoice panel
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 45), L(2, 'Hosting', 1.5, 12.35)])])
S('cp05_invoice_panel', 'opens an invoice with its lines and totals', 5, fx,
  ['inv1.status', 'inv1.line1.amount', 'inv1.line2.amount', 'inv1.subtotal', 'inv1.grand'])

# ---------------------------------------------------------------- cp06 line form
fx = dict(asOf=ASOF, clients=[A, G], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 45)]),
    I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(7, 'Audit', 1, 500)])])
S('cp06_line_form', 'adds a line and updates the totals', 6, plus(fx, lines=[(1, L(8, 'Hosting', 1.5, 12.35))]),
  ['inv1.line8.amount', 'inv1.subtotal', 'inv1.grand'])

# ---------------------------------------------------------------- cp09 percentage discount
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Licences', 4, 25.25)], discountPct=12.5)])
S('cp09_invoice_discount', 'takes a seeded percentage off the subtotal', 9, fx,
  ['inv1.subtotal', 'inv1.discount', 'inv1.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 45), L(2, 'Hosting', 1, 10)])])
S('cp09_invoice_discount', 'applies a discount I enter', 9, plus(fx, inv=[(2, dict(discountPct=15))]),
  ['inv2.discount', 'inv2.grand'])
S('cp09_invoice_discount', 'refuses a percentage outside 0 to 100', 9, fx, ['inv2.discount', 'inv2.grand'])

# ---------------------------------------------------------------- cp10 tax
T10 = {'taxRate': 10}
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Licences', 3, 33.35)])])
S('cp10_tax', 'adds tax at the workspace rate', 10, fx, ['inv1.subtotal', 'inv1.tax', 'inv1.grand'])
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Retainer', 2, 100)], discountPct=10)])
S('cp10_tax', 'charges tax alongside a discount', 10, fx, ['inv2.discount', 'inv2.tax', 'inv2.grand'])

# ---------------------------------------------------------------- cp11 send
fx = dict(asOf='2026-03-05', settings=T10, clients=[A], invoices=[
    I(7, 1, 'DRAFT', '2026-02-10', '2026-03-31', [L(1, 'Design', 2, 45)])])
S('cp11_send_invoice', 'sends a draft and records it', 11, plus(fx, inv=[(7, dict(status='SENT'))]),
  ['inv7.status', 'inv7.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[I(9, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 50)])])
S('cp11_send_invoice', 'refuses new lines and discount changes on a sent invoice', 11, fx,
  ['inv9.status', 'inv9.discount', 'inv9.subtotal'])

# ---------------------------------------------------------------- cp12 discount before tax
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Retainer', 2, 100)], discountPct=10),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Licences', 3, 33.35)], discountPct=12.5)])
S('cp12_discount_before_tax', 'charges tax on what is left after the discount', 12, fx,
  ['inv1.discount', 'inv1.tax', 'inv1.grand', 'inv2.discount', 'inv2.tax', 'inv2.grand'])

# ---------------------------------------------------------------- cp13 discount split
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Plan A', 1, 20), L(2, 'Plan B', 1, 20), L(3, 'Plan C', 1, 20)], discountPct=16.67)])
S('cp13_discount_split', 'shares a discount evenly with the leftover cent to the lowest line', 13, fx,
  ['inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.line3.share', 'inv1.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Setup', 2, 7.51), L(2, 'Training', 1, 18.46), L(3, 'Licences', 4, 5.79), L(4, 'Support', 1, 43.36)],
      discountPct=10)])
S('cp13_discount_split', 'gives the leftover cents to the largest remainders', 13, fx,
  ['inv2.discount', 'inv2.line1.share', 'inv2.line2.share', 'inv2.line3.share', 'inv2.line4.share', 'inv2.grand'])

# ---------------------------------------------------------------- cp14 exempt lines
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Consulting', 1, 80), L(2, 'Postage', 1, 20, taxExempt=True)], discountPct=10)])
S('cp14_tax_exempt_lines', 'charges tax only on taxable lines after their discount share', 14, fx,
  ['inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.tax', 'inv1.grand'])
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Workshop', 1, 12.25), L(2, 'Workbook', 1, 12.25)])])
S('cp14_tax_exempt_lines', 'adds an exempt line through the form', 14, fx, ['inv2.tax', 'inv2.grand'], 'before')
S('cp14_tax_exempt_lines', 'adds an exempt line through the form', 14,
  plus(fx, lines=[(2, L(3, 'Postage', 1, 7.5, taxExempt=True))]), ['inv2.subtotal', 'inv2.tax', 'inv2.grand'], 'after')

# ---------------------------------------------------------------- cp15 payments
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Retainer', 1, 200)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Hosting', 1, 50)])],
    payments=[P(1, 1, 70, '2026-03-05', [(1, 70)]), P(2, 1, 54.40, '2026-03-06', [(2, 54.40)])])
S('cp15_record_payment', 'shows the payments made and what is still due', 15, fx,
  ['inv1.grand', 'inv1.paid', 'inv1.due', 'inv1.status', 'inv2.grand', 'inv2.paid', 'inv2.due', 'inv2.status'])
fx = dict(asOf=ASOF, clients=[A, G], invoices=[
    I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Audit', 1, 99.50)]),
    I(3, 2, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Audit', 1, 10)])],
    payments=[P(4, 2, 10, '2026-03-01', [(3, 10)])])
S('cp15_record_payment', 'recording payments moves the invoice to Part paid then Paid', 15,
  plus(fx, payments=[P(5, 1, 49.50, '2026-03-06', [(2, 49.50)])]), ['inv2.paid', 'inv2.due', 'inv2.status'], 'first')
S('cp15_record_payment', 'recording payments moves the invoice to Part paid then Paid', 15,
  plus(fx, payments=[P(5, 1, 49.50, '2026-03-06', [(2, 49.50)]), P(6, 1, 50, '2026-03-08', [(2, 50)])]),
  ['inv2.paid', 'inv2.due', 'inv2.status'], 'second')

# ---------------------------------------------------------------- cp16 reopen
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(6, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 80)])])
S('cp16_reopen_sent_invoice', 'changing an unpaid sent invoice puts it back to draft', 16,
  plus(fx, lines=[(5, L(3, 'Extra pages', 1, 20))], inv=[(5, dict(status='DRAFT')), (6, dict(status='DRAFT', discountPct=10))]),
  ['inv5.status', 'inv5.subtotal', 'inv6.status', 'inv6.discount', 'inv6.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[I(7, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)])],
          payments=[P(1, 1, 30, '2026-03-05', [(7, 30)])])
S('cp16_reopen_sent_invoice', 'an invoice with a payment stays fixed', 16, fx, ['inv7.status', 'inv7.subtotal', 'inv7.discount'])
# cp11 copy at 16: the locked invoice has a payment
fx = dict(asOf=ASOF, clients=[A], invoices=[I(9, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 50)])],
          payments=[P(1, 1, 10, '2026-03-05', [(9, 10)])])
S('cp11_send_invoice', 'refuses new lines and discount changes on a sent invoice', 16, fx,
  ['inv9.status', 'inv9.discount', 'inv9.subtotal'])
fx = dict(asOf='2026-03-05', settings=T10, clients=[A], invoices=[
    I(7, 1, 'DRAFT', '2026-02-10', '2026-03-31', [L(1, 'Design', 2, 45)])])
S('cp11_send_invoice', 'sends a draft and records it', 16, plus(fx, inv=[(7, dict(status='SENT'))]),
  ['inv7.status', 'inv7.grand'])

# ---------------------------------------------------------------- cp17 payment validation
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Retainer', 1, 150)]),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 40)])])
S('cp17_payment_validation', 'refuses a payment that breaks a rule', 17, fx, ['inv1.paid', 'inv1.due', 'inv1.status', 'inv2.status'])
S('cp17_payment_validation', 'accepts a payment of exactly the amount due', 17,
  plus(fx, payments=[P(1, 1, 150, '2026-03-10', [(1, 150)])]), ['inv1.paid', 'inv1.due', 'inv1.status'])

# ---------------------------------------------------------------- cp18 RF reference
fx = dict(asOf=ASOF, clients=[A], invoices=[I(12, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 80)])],
          payments=[P(3, 1, 20, '2026-03-03', [(12, 20)], reference='RF24 0000 125')])
S('cp18_payment_reference', "records a payment quoting the invoice's reference", 18,
  plus(fx, payments=[P(4, 1, 30, '2026-03-09', [(12, 30)])]), ['inv12.reference', 'inv12.paid', 'inv12.due', 'inv12.status'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(12, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 80)]),
    I(7, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 20)])])
S('cp18_payment_reference', "refuses a mistyped reference or another invoice's reference", 18, fx,
  ['inv12.paid', 'inv12.due', 'inv7.reference'])

# ---------------------------------------------------------------- cp19 line discount
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Licences', 3, 33.35, discountPct=15), L(2, 'Support', 1, 14.96)], discountPct=10)])
S('cp19_line_discount', 'a line discount comes off before the invoice discount', 19, fx,
  ['inv1.line1.discount', 'inv1.line1.amount', 'inv1.line2.amount', 'inv1.subtotal', 'inv1.discount',
   'inv1.line1.share', 'inv1.line2.share', 'inv1.tax', 'inv1.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)])])
S('cp19_line_discount', 'adds a discounted line through the form', 19,
  plus(fx, lines=[(2, L(2, 'Hosting', 2, 12.5, discountPct=20))]),
  ['inv2.line2.discount', 'inv2.line2.amount', 'inv2.subtotal', 'inv2.grand'])

# ---------------------------------------------------------------- cp20 per-line tax
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Badge', 1, 3.35), L(2, 'Lanyard', 1, 3.35), L(3, 'Pass', 1, 3.35), L(4, 'Postage', 1, 5, taxExempt=True)])])
S('cp20_line_tax', 'rounds tax on each line and adds the line taxes', 20, fx,
  ['inv1.line1.tax', 'inv1.line2.tax', 'inv1.line3.tax', 'inv1.line4.tax', 'inv1.tax', 'inv1.grand'])
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Workshop', 1, 45), L(2, 'Venue', 1, 55)], discountPct=5)])
S('cp20_line_tax', "taxes each line after its share of the discount", 20, fx,
  ['inv2.line1.share', 'inv2.line2.share', 'inv2.line1.tax', 'inv2.line2.tax', 'inv2.tax', 'inv2.grand'])

# ---------------------------------------------------------------- cp21 split payment
fx = dict(asOf=ASOF, clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)]),
    I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Extras', 1, 30)]),
    I(4, 2, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Audit', 1, 10)])],
    payments=[P(7, 2, 10, '2026-03-02', [(4, 10)])])
S('cp21_split_payment', 'splits one payment across several invoices', 21,
  plus(fx, payments=[P(8, 1, 100, '2026-03-09', [(1, 60), (2, 40)])]),
  ['inv1.status', 'inv1.due', 'inv2.status', 'inv2.paid', 'inv2.due', 'inv3.status'])
S('cp21_split_payment', "refuses a split that doesn't fit", 21, fx, ['inv1.status', 'inv2.status'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 120)]),
    I(6, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
    payments=[P(1, 1, 150, '2026-03-05', [(5, 100), (6, 50)])])
S('cp21_split_payment', 'shows each invoice its part of a split payment', 21, fx,
  ['inv5.paid', 'inv5.due', 'inv5.status', 'inv6.paid', 'inv6.due', 'inv6.status'])

# ---------------------------------------------------------------- cp22 automatic allocation
fx22 = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-10', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-01-20', '2026-05-31', [L(2, 'Hosting', 1, 80)]),
    I(3, 1, 'SENT', '2026-02-10', '2026-03-31', [L(3, 'Support', 1, 50)]),
    I(4, 1, 'DRAFT', '2026-01-05', '2026-02-28', [L(4, 'Extras', 1, 40)])])
S('cp22_auto_allocation', 'applies a payment to the oldest invoices first', 22,
  plus(fx22, payments=[P(1, 1, 150, '2026-03-09', [(2, 80), (1, 70)])]),
  ['inv1.status', 'inv1.due', 'inv2.status', 'inv3.status', 'inv4.status'])
S('cp22_auto_allocation', 'refuses more than the client owes', 22, fx22,
  ['inv1.status', 'inv2.status', 'inv3.status'])
S('cp22_auto_allocation', 'applies a payment to the oldest invoices first', 24,
  plus(fx22, payments=[P(1, 1, 150, '2026-03-09', [(3, 50), (1, 100)])]),
  ['inv1.status', 'inv1.due', 'inv2.status', 'inv3.status', 'inv4.status'])
S('cp22_auto_allocation', 'refuses more than the client owes', 24, fx22, ['inv1.status', 'inv2.status', 'inv3.status'])

# ---------------------------------------------------------------- cp23 overdue
fx23 = dict(asOf='2026-04-15', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Hosting', 1, 100)]),
    I(3, 1, 'SENT', '2026-02-01', '2026-03-31', [L(3, 'Support', 1, 100)]),
    I(4, 1, 'SENT', '2026-03-01', '2026-04-15', [L(4, 'Training', 1, 100)]),
    I(5, 1, 'DRAFT', '2026-02-01', '2026-03-31', [L(5, 'Extras', 1, 100)]),
    I(6, 1, 'SENT', '2026-03-01', '2026-04-10', [L(6, 'Licences', 1, 100)])],
    payments=[P(1, 1, 40, '2026-03-20', [(2, 40)]), P(2, 1, 100, '2026-03-20', [(3, 100)])])
S('cp23_overdue', 'marks invoices still owing after their due date Overdue', 23, fx23,
  ['inv1.status', 'inv2.status', 'inv3.status', 'inv4.status', 'inv5.status', 'inv6.status'])
fx = dict(asOf='2026-04-15', clients=[A], invoices=[I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)])])
S('cp23_overdue', 'a part payment leaves an overdue invoice Overdue', 23,
  plus(fx, payments=[P(1, 1, 30, '2026-04-15', [(1, 30)])]), ['inv1.status', 'inv1.due'])

# ---------------------------------------------------------------- cp24 due-date order
fx = dict(asOf='2026-04-20', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-01-15', '2026-05-31', [L(2, 'Hosting', 1, 60)]),
    I(3, 1, 'SENT', '2026-02-01', '2026-04-30', [L(3, 'Support', 1, 40)]),
    I(4, 1, 'SENT', '2026-03-05', '2026-03-31', [L(4, 'Training', 1, 30)])])
S('cp24_allocate_by_due_date', 'applies a payment to the earliest due date first', 24,
  plus(fx, payments=[P(1, 1, 150, '2026-04-20', [(4, 30), (1, 100), (3, 20)])]),
  ['inv4.due', 'inv1.status', 'inv3.status', 'inv3.due', 'inv2.status'])

# ---------------------------------------------------------------- cp25 client balance
fx25 = dict(asOf='2026-04-20', settings=T10, clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-04-01', '2026-05-31', [L(2, 'Hosting', 1, 50)]),
    I(3, 1, 'DRAFT', '2026-04-01', '2026-05-31', [L(3, 'Extras', 1, 40)]),
    I(4, 2, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Audit', 1, 200)])],
    payments=[P(1, 1, 30, '2026-03-15', [(1, 30)]), P(2, 2, 220, '2026-04-10', [(4, 220)])])
S('cp25_client_balance', 'shows what each client owes and how much is overdue', 25, fx25,
  ['client1.balance', 'client1.overdue', 'client2.balance', 'client2.overdue', 'inv1.status'])
S('cp25_client_balance', 'a payment lowers the balance straight away', 25,
  plus(fx25, payments=[P(3, 1, 20, '2026-04-20', [(2, 20)])]), ['client1.balance', 'client1.overdue', 'inv2.due'])

# ---------------------------------------------------------------- cp26 void
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])])
S('cp26_void_invoice', 'voids an unpaid sent invoice', 26, fx, ['client1.balance'], 'before')
S('cp26_void_invoice', 'voids an unpaid sent invoice', 26, plus(fx, inv=[(1, dict(status='VOID'))]),
  ['inv1.status', 'client1.balance'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Extras', 1, 30)]),
    I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Support', 1, 60)])],
    payments=[P(1, 1, 20, '2026-03-05', [(4, 20)])])
S('cp26_void_invoice', 'refuses to void a draft or an invoice with payments', 26, fx, ['inv3.status', 'inv4.status'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(5, 1, 'VOID', '2026-01-01', '2026-02-28', [L(5, 'Design', 1, 70)]),
    I(6, 1, 'SENT', '2026-02-01', '2026-04-30', [L(6, 'Hosting', 1, 40)])])
S('cp26_void_invoice', 'a void invoice takes no payments', 26,
  plus(fx, payments=[P(1, 1, 40, '2026-03-09', [(6, 40)])]), ['inv5.status', 'inv6.status', 'client1.balance'])

# ---------------------------------------------------------------- cp27 fixed discount
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Strategy', 1, 33.33), L(2, 'Research', 1, 33.33), L(3, 'Report', 1, 33.34)], discountAmount=10)])
S('cp27_fixed_discount', 'splits a fixed discount across the lines', 27, fx,
  ['inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.line3.share', 'inv1.tax', 'inv1.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 40)], discountPct=10)])
S('cp27_fixed_discount', 'one kind of discount replaces the other', 27, fx, ['inv2.discount'], 'seeded')
S('cp27_fixed_discount', 'one kind of discount replaces the other', 27,
  plus(fx, inv=[(2, dict(discountPct=None, discountAmount=5))]), ['inv2.discount', 'inv2.grand'], 'amount')
S('cp27_fixed_discount', 'one kind of discount replaces the other', 27,
  plus(fx, inv=[(2, dict(discountPct=20))]), ['inv2.discount', 'inv2.grand'], 'pct')
S('cp27_fixed_discount', 'refuses a fixed discount bigger than the subtotal', 27, fx, ['inv2.discount'])

# ---------------------------------------------------------------- cp29 cap
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Platform', 1, 300), L(2, 'Onboarding', 1, 100)],
      discountPct=10, discountCap=25),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Platform', 1, 400)], discountPct=10, discountCap=60)])
S('cp29_discount_cap', 'caps a percentage discount at the maximum', 29, fx,
  ['inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.tax', 'inv1.grand', 'inv2.discount'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Kit', 1, 200, discountPct=10), L(2, 'Cables', 1, 20)],
      discountPct=10, discountCap=30)])
S('cp29_discount_cap', 'caps alongside line discounts', 29, fx, ['inv3.subtotal', 'inv3.discount', 'inv3.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(4, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Kit', 1, 300)], discountAmount=50, discountCap=25)])
S('cp29_discount_cap', 'caps alongside a fixed discount', 29, fx, ['inv4.discount', 'inv4.grand'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(5, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Platform', 1, 400)])])
S('cp29_discount_cap', 'sets a cap through the form', 29,
  plus(fx, inv=[(5, dict(discountPct=10, discountCap=25))]), ['inv5.discount', 'inv5.grand'])

# ---------------------------------------------------------------- cp30 reversal
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
    payments=[P(1, 1, 90, '2026-03-02', [(1, 60), (2, 30)]), P(2, 1, 20, '2026-03-04', [(1, 20)])])
S('cp30_payment_reversal', 'reversing a split payment undoes it on every invoice', 30, fx,
  ['inv1.paid', 'inv1.due', 'inv1.status'], 'before')
S('cp30_payment_reversal', 'reversing a split payment undoes it on every invoice', 30, plus(fx, reverse=[1]),
  ['inv1.paid', 'inv1.due', 'inv1.status', 'inv2.status', 'client1.balance'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Support', 1, 50)])],
          payments=[P(3, 1, 50, '2026-03-02', [(3, 50)], reversed=True)])
S('cp30_payment_reversal', 'a reversed payment does not count', 30, fx, ['inv3.status', 'inv3.paid', 'inv3.due'])

# ---------------------------------------------------------------- cp31 line removal
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Design', 1, 60), L(2, 'Build', 1, 30), L(3, 'Hosting', 1, 10.01)], discountPct=10)])
S('cp31_remove_line', 'removing a line recalculates the discount and tax', 31, fx,
  ['inv1.subtotal', 'inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.line3.share', 'inv1.tax', 'inv1.grand'], 'before')
S('cp31_remove_line', 'removing a line recalculates the discount and tax', 31, plus(fx, drop_lines=[(1, 3)]),
  ['inv1.subtotal', 'inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.tax', 'inv1.grand'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Package', 1, 60), L(2, 'Extras', 1, 10)], discountAmount=14)])
S('cp31_remove_line', 'refuses to remove a line below a fixed discount', 31, fx, ['inv2.subtotal', 'inv2.discount'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40), L(2, 'Extras', 1, 10)])])
S('cp31_remove_line', 'removing a line from an unpaid sent invoice reopens it', 31,
  plus(fx, drop_lines=[(3, 2)], inv=[(3, dict(status='DRAFT'))]), ['inv3.status', 'inv3.subtotal'], 'after')

# ---------------------------------------------------------------- cp32 cap covers everything
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Kit', 1, 300, discountPct=10), L(2, 'Cables', 1, 100)],
      discountPct=5, discountCap=25),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Kit', 1, 100, discountPct=5), L(4, 'Cables', 1, 100)],
      discountPct=10, discountCap=20)])
S('cp32_cap_all_discounts', 'the cap includes line discounts', 32, fx,
  ['inv1.subtotal', 'inv1.discount', 'inv1.grand', 'inv2.subtotal', 'inv2.discount', 'inv2.grand'])

# ---------------------------------------------------------------- cp33 line tax rate
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Consulting', 1, 100), L(2, 'Handbook', 1, 40.10, taxRate=5),
       L(3, 'Postage', 1, 9.90, taxExempt=True, taxRate=5), L(4, 'Gift card', 1, 25, taxRate=0)])])
S('cp33_line_tax_rate', 'taxes each line at its own rate', 33, fx,
  ['inv1.line1.tax', 'inv1.line2.tax', 'inv1.line3.tax', 'inv1.line4.tax', 'inv1.tax', 'inv1.subtotal', 'inv1.grand'])
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 50)])])
S('cp33_line_tax_rate', 'adds a line with its own rate', 33,
  plus(fx, lines=[(2, L(2, 'Software', 1, 10, taxRate=20))]), ['inv2.line2.tax', 'inv2.tax', 'inv2.grand'])

# ---------------------------------------------------------------- cp34 duplicate
fx = dict(asOf='2026-05-20', settings=T10, clients=[A, G], invoices=[
    I(7, 1, 'SENT', '2026-03-01', '2026-04-30',
      [L(3, 'Design', 2, 45, discountPct=5), L(4, 'Hosting', 1, 20, taxExempt=True)], discountPct=10),
    I(30, 2, 'SENT', '2026-03-01', '2026-06-30', [L(41, 'Audit', 1, 100)])],
    payments=[P(1, 1, 50, '2026-03-10', [(7, 50)])])
dup = plus(fx)
dup['invoices'].append(I(31, 1, 'DRAFT', '2026-05-20', '2026-06-30',
                         [L(42, 'Design', 2, 45, discountPct=5), L(43, 'Hosting', 1, 20, taxExempt=True)], discountPct=10))
S('cp34_duplicate_invoice', 'duplicates an invoice as a new draft', 34, dup,
  ['inv31.status', 'inv31.number', 'inv31.subtotal', 'inv31.discount', 'inv31.tax', 'inv31.grand',
   'inv31.paid', 'inv31.due', 'inv31.line42.amount', 'inv31.line43.amount'])

# ---------------------------------------------------------------- cp36 revised tie-break
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
      [L(1, 'Basic', 1, 20.05), L(2, 'Premium', 1, 40.05), L(3, 'Standard', 1, 39.90)], discountPct=10)])
S('cp36_discount_split_ties', 'a tied leftover cent goes to the larger line', 36, fx,
  ['inv1.discount', 'inv1.line1.share', 'inv1.line2.share', 'inv1.line3.share'])

# ---------------------------------------------------------------- cp37 pay by reference
fx = dict(asOf=ASOF, clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(12, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 80)]),
    I(7, 2, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Audit', 1, 60)])])
S('cp37_pay_by_reference', 'applies a payment to the invoice its reference names', 37,
  plus(fx, payments=[P(1, 1, 50, '2026-03-09', [(12, 50)])]), ['inv12.status', 'inv12.due', 'inv1.status', 'inv12.reference'])
S('cp37_pay_by_reference', 'refuses a reference that is mistyped, foreign or overpaid', 37, fx,
  ['inv12.status', 'inv1.status', 'inv7.reference'])

# ---------------------------------------------------------------- cp38 send all
fx = dict(asOf=ASOF, clients=[C(termsDays=30), G], invoices=[
    I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 20)]),
    I(3, 1, 'DRAFT', '2026-02-01', '2026-03-31', [L(2, 'Hosting', 1, 100)]),
    I(4, 1, 'DRAFT', '2026-02-15', '2026-03-31', [L(3, 'Support', 1, 50)]),
    I(5, 1, 'DRAFT', '2026-02-20', '2026-03-31', []),
    I(6, 2, 'DRAFT', '2026-02-20', '2026-03-31', [L(4, 'Audit', 1, 10)])])
S('cp38_send_all_drafts', "sends every one of the client's drafts that has lines", 38,
  plus(fx, inv=[(3, dict(status='SENT', issueDate=ASOF, dueDate='2026-04-09')),
                (4, dict(status='SENT', issueDate=ASOF, dueDate='2026-04-09'))]),
  ['inv2.status', 'inv3.status', 'inv3.number', 'inv3.grand', 'inv4.status', 'inv4.number', 'inv4.grand', 'inv5.status'])

# ---------------------------------------------------------------- cp39 paid date
fx39 = dict(asOf='2026-04-20', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Hosting', 1, 100)]),
    I(3, 1, 'SENT', '2026-02-01', '2026-03-31', [L(3, 'Support', 1, 100)])],
    payments=[P(1, 1, 50, '2026-03-10', [(1, 50)]), P(2, 1, 50, '2026-03-25', [(1, 50)]),
              P(3, 1, 30, '2026-03-20', [(2, 30)]), P(4, 1, 70, '2026-04-05', [(2, 70)]),
              P(5, 1, 60, '2026-04-02', [(3, 60)]), P(6, 1, 40, '2026-03-15', [(3, 40)])])
S('cp39_paid_date', 'shows the date the clearing payment was made', 39, fx39,
  ['inv1.status', 'inv1.paidDate', 'inv2.status', 'inv2.paidDate', 'inv3.status', 'inv3.paidDate'])
S('cp39_paid_date', 'reversing the clearing payment takes the paid date away', 39, plus(fx39, reverse=[2]),
  ['inv1.status', 'inv1.due'])

# ---------------------------------------------------------------- cp40 write-off
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 100)])])
S('cp40_write_off_small_balance', 'writes off less than a dollar left due', 40,
  plus(fx, payments=[P(1, 1, 99.40, '2026-03-09', [(1, 99.40)])]),
  ['inv1.status', 'inv1.paid', 'inv1.due', 'inv1.writtenOff'])
S('cp40_write_off_small_balance', 'a dollar or more stays due', 40,
  plus(fx, payments=[P(1, 1, 99, '2026-03-09', [(2, 99)])]), ['inv2.status', 'inv2.due', 'inv2.writtenOff'])

# ---------------------------------------------------------------- cp41 discount reason
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 200)]),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)])])
S('cp41_discount_reason', 'a discount over a fifth of the subtotal needs a reason', 41,
  plus(fx, inv=[(1, dict(discountPct=25, discountReason='Loyalty')), (2, dict(discountPct=20))]),
  ['inv1.discount', 'inv2.discount'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)], discountPct=30),
    I(4, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)], discountAmount=25, discountReason='Damaged goods')])
S('cp41_discount_reason', 'refuses to send an invoice whose discount needs a reason', 41, fx,
  ['inv3.status', 'inv3.discount', 'inv4.discount'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(5, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Platform', 1, 400)], discountPct=30, discountCap=50)])
S('cp41_discount_reason', 'a capped discount within a fifth needs no reason', 41, fx, ['inv5.discount', 'inv5.grand'])

# ---------------------------------------------------------------- cp42 edit line
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
    [L(1, 'Design', 2, 45), L(2, 'Hosting', 1, 10.01, discountPct=5), L(3, 'Postage', 1, 4.99, taxExempt=True)], discountPct=10)])
S('cp42_edit_line', 'editing a line works the whole invoice out again', 42, fx, ['inv1.grand'], 'before')
S('cp42_edit_line', 'editing a line works the whole invoice out again', 42,
  plus(fx, inv=[(1, dict(lineItems=[L(1, 'Design', 2, 45), L(2, 'Hosting', 3, 10.01, discountPct=5),
                                     L(3, 'Postage', 1, 4.99, taxExempt=True)]))]),
  ['inv1.line2.discount', 'inv1.line2.amount', 'inv1.subtotal', 'inv1.discount', 'inv1.line1.share', 'inv1.line2.share',
   'inv1.line3.share', 'inv1.line1.tax', 'inv1.line2.tax', 'inv1.tax', 'inv1.grand'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40)]),
    I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
    payments=[P(1, 1, 20, '2026-03-05', [(4, 20)])])
S('cp42_edit_line', 'editing a line of an unpaid sent invoice reopens it', 42,
  plus(fx, inv=[(3, dict(status='DRAFT', lineItems=[L(1, 'Design', 1, 45)]))]),
  ['inv3.status', 'inv3.subtotal', 'inv4.subtotal', 'inv4.status'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Package', 1, 60), L(2, 'Extras', 1, 10)], discountAmount=14)])
S('cp42_edit_line', 'refuses an edit that breaks a rule', 42, fx, ['inv2.subtotal'], 'before')
S('cp42_edit_line', 'refuses an edit that breaks a rule', 42,
  plus(fx, inv=[(2, dict(lineItems=[L(1, 'Package', 1, 4), L(2, 'Extras', 1, 10)]))]), ['inv2.subtotal', 'inv2.grand'], 'after')

# ---------------------------------------------------------------- cp43 minimum part payment
fx = dict(asOf=ASOF, settings=T10, clients=[A], invoices=[I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 200)])])
S('cp43_minimum_part_payment', 'a part payment must be at least a tenth of the total', 43,
  plus(fx, payments=[P(1, 1, 22, '2026-03-09', [(1, 22)])]), ['inv1.grand', 'inv1.paid', 'inv1.due', 'inv1.status'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 100)])],
    payments=[P(1, 1, 95, '2026-03-02', [(2, 95)]), P(2, 1, 90, '2026-03-02', [(3, 90)])])
S('cp43_minimum_part_payment', 'a smaller payment that settles the invoice is accepted', 43, fx,
  ['inv2.due', 'inv3.due'], 'before')
S('cp43_minimum_part_payment', 'a smaller payment that settles the invoice is accepted', 43,
  plus(fx, payments=[P(3, 1, 5, '2026-03-09', [(2, 5)]), P(4, 1, 9.50, '2026-03-09', [(3, 9.50)])]),
  ['inv2.status', 'inv2.due', 'inv3.status', 'inv3.due', 'inv3.writtenOff'], 'after')
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])])
S('cp43_minimum_part_payment', 'each part of a split payment must be at least a tenth', 43, fx, ['inv4.status', 'inv5.status'])

# ---------------------------------------------------------------- cp44 grace
fx = dict(asOf='2026-04-20', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-13', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-12', [L(2, 'Hosting', 1, 60)])])
S('cp44_overdue_grace', 'an invoice is overdue only after a week past its due date', 44, fx,
  ['inv1.status', 'inv2.status', 'client1.balance', 'client1.overdue'])

# ---------------------------------------------------------------- cp45 number as reference
fx = dict(asOf=ASOF, clients=[A], invoices=[I(7, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)])])
S('cp45_number_as_reference', 'accepts the invoice number as the reference', 45,
  plus(fx, payments=[P(1, 1, 40, '2026-03-09', [(7, 40)])]), ['inv7.paid', 'inv7.reference'])
S('cp45_number_as_reference', 'refuses an invoice number with a wrong check digit', 45, fx, ['inv7.paid'])
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(123, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 60)])])
S('cp45_number_as_reference', 'pays the invoice a number names when none is open', 45,
  plus(fx, payments=[P(1, 1, 60, '2026-03-09', [(123, 60)])]), ['inv123.status', 'inv1.status', 'inv123.number'])

# ---------------------------------------------------------------- cp47 client standard discount
fx = dict(asOf=ASOF, clients=[C(discountPct=5)], invoices=[I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)], discountPct=12)])
new = plus(fx)
new['invoices'].append(I(2, 1, 'DRAFT', ASOF, '2026-04-30', [L(2, 'Design', 1, 200)], discountPct=5))
S('cp47_client_standard_discount', "a new invoice starts with the client's discount", 47, new, ['inv2.discount', 'inv2.grand'])
dup = plus(fx)
dup['invoices'].append(I(2, 1, 'DRAFT', ASOF, '2026-04-30', [L(2, 'Design', 1, 100)], discountPct=12))
S('cp47_client_standard_discount', "duplicating keeps the invoice's own discount", 47, dup, ['inv2.discount', 'inv2.grand'])
fx = dict(asOf=ASOF, clients=[A, {'id': 2, 'name': 'Initech', 'email': 'ap@initech.example', 'discountPct': 7.5}],
          invoices=[I(3, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
                    I(4, 2, 'DRAFT', ASOF, '2026-04-30', [L(2, 'Design', 1, 100)], discountPct=7.5)])
S('cp47_client_standard_discount', 'sets a standard discount when adding a client', 47, fx, ['inv4.discount', 'inv4.grand'])

# ---------------------------------------------------------------- cp48 round down
fx = dict(asOf=ASOF, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Licences', 4, 25.25)], discountPct=12.5),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Kit', 3, 33.35, discountPct=15)])])
S('cp48_discounts_round_down', 'percentage discounts round down to the cent', 48, fx,
  ['inv1.discount', 'inv1.grand', 'inv2.line2.discount', 'inv2.line2.amount', 'inv2.grand'])

# ---------------------------------------------------------------- cp49 tax-exempt client
fx = dict(asOf=ASOF, settings=T10, clients=[C(taxExempt=True), G], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100), L(2, 'Handbook', 1, 50, taxRate=5)]),
    I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 100)])])
S('cp49_tax_exempt_client', "charges no tax on a tax-exempt client's invoices", 49, fx,
  ['inv1.line1.tax', 'inv1.line2.tax', 'inv1.tax', 'inv1.grand', 'inv2.tax', 'inv2.grand'])

# ---------------------------------------------------------------- cp50 several references
fx50 = dict(asOf='2026-04-20', clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Design', 1, 100)]),
    I(7, 1, 'SENT', '2026-02-01', '2026-04-30', [L(2, 'Hosting', 1, 60)]),
    I(12, 1, 'SENT', '2026-01-15', '2026-03-31', [L(3, 'Support', 1, 40)]),
    I(123, 1, 'SENT', '2026-02-01', '2026-04-30', [L(4, 'Training', 1, 30)]),
    I(58, 2, 'SENT', '2026-02-01', '2026-04-30', [L(5, 'Audit', 1, 10)])])
S('cp50_several_references', 'applies one payment to the invoices its references name', 50,
  plus(fx50, payments=[P(1, 1, 120, '2026-04-20', [(7, 60), (123, 30), (1, 30)])]),
  ['inv7.status', 'inv123.status', 'inv1.status', 'inv1.due', 'inv12.status'])
S('cp50_several_references', 'refuses the payment if any reference is wrong or it is too much', 50, fx50,
  ['inv1.status', 'inv7.status', 'inv123.status'])


# ---------------------------------------------------------------- copies at mutations
def copy_at(spec, k):
    prev = max(s['n'] for s in SC if s['spec'] == spec and s['n'] < k)
    for s in [s for s in SC if s['spec'] == spec and s['n'] == prev]:
        SC.append(dict(s, n=k, fx=copy.deepcopy(s['fx'])))


for spec, k in [('cp03_client_invoices', 4), ('cp10_tax', 12), ('cp14_tax_exempt_lines', 20),
                ('cp11_send_invoice', 28), ('cp29_discount_cap', 32), ('cp13_discount_split', 36),
                ('cp15_record_payment', 40), ('cp23_overdue', 44), ('cp09_invoice_discount', 48),
                ('cp12_discount_before_tax', 48), ('cp19_line_discount', 48)]:
    copy_at(spec, k)


from acceptance.reference.scenarios_act2 import register as _act2   # noqa: E402
_act2(S, SC, copy_at)

from acceptance.reference.scenarios_act3 import register as _act3   # noqa: E402
_act3(S, SC, copy_at)

from acceptance.reference.scenarios_act4 import register as _act4   # noqa: E402
_act4(S, SC, copy_at)

from acceptance.reference.scenarios_act5 import register as _act5   # noqa: E402
_act5(S, SC, copy_at)
