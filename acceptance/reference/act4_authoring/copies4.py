"""Earlier specs updated at Act IV mutations."""
from lib4 import *  # noqa
from cps3 import RATES, HV, KK, IN  # noqa

SA = '2026-03-10'

# ------------------------------------------------------------------------- cp152 discounts need approval
FX41a = dict(asOf=SA, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 200)]),
    I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)])])
FX41b = dict(asOf=SA, clients=[A], invoices=[
    I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)], discountPct=30),
    I(4, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)], discountAmount=25,
      discountReason='Damaged goods')])


def t41():
    a = plus(FX41a, inv=[(1, dict(discountPct=25)), (2, dict(discountPct=20))])
    b = plus(FX41b, inv=[(4, dict(approvedTotal=75))])
    c = plus(b, inv=[(4, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    return [T('a discount over a fifth of the subtotal needs approval', '@core', FX41a, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // no reason needed: the discount is taken, and the invoice needs approval instead
        await page.getByTestId('discount-form-pct').fill('25');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv1.discount}'); // 25% of 200.00
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('discount-form-pct').fill('20');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv2.discount}'); // exactly 20%
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv2.approval}');
""", a=a),
            T('refuses to send an invoice whose discount needs approval until it is approved', '@error', FX41b, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv3.discount}'); // 30% of 100.00
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        // a reason is kept, but no longer enough
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv4.discount}');
        await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Damaged goods');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=4 total={b:inv4.grand|plain}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv4.status}');
""", b=b, c=c)]


text_copy(152, 'cp41_discount_reason',
          "UPDATED for cp152 (mutates: [41]): a discount over a fifth of the subtotal no longer needs a reason; "
          "it is accepted and the invoice needs approval instead, so the two reason tests are replaced by tests "
          "of the approval (25% is taken without a reason; the 30% and the 25.00-with-a-reason invoices are "
          "refused until approved). Carries the capped-discount test.",
          reps=[("// An invoice discount that takes off more than 20% of the subtotal (the amount actually taken off,\n"
                 "// after any cap) needs a reason (invoices[].discountReason, entered with the discount and shown on the\n"
                 "// invoice). Such a discount without a reason is refused, and an invoice whose discount needs a reason\n"
                 "// but has none cannot be sent.",
                 "// An invoice discount that takes off more than 20% of the subtotal (the amount actually taken off,\n"
                 "// after any cap) makes the invoice need approval before it can be sent; a reason\n"
                 "// (invoices[].discountReason) is optional, and kept and shown when given."),
                ("    // 30% of 400.00 = 120.00, capped at 50.00 = 12.5% of the subtotal\n",
                 "    // 30% of 400.00 = 120.00, capped at 50.00 = 12.5% of the subtotal: no approval needed\n")],
          retire=['a discount over a fifth of the subtotal needs a reason',
                  'refuses to send an invoice whose discount needs a reason'], add_ts=t41)

# ------------------------------------------------------------------------- cp168 no more retention (the reversal)
M168 = "UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]): retention is gone; "
RET_FIELDS = ('retentionPct', 'retentionCap', 'retentionReleasedOn', 'retentionReleasedAmount')


def strip_ret(fx):
    f = copy.deepcopy(fx)
    for inv in f.get('invoices', []):
        for k in RET_FIELDS:
            inv.pop(k, None)
    for c in f.get('clients', []):
        c.pop('retentionPct', None)
    return f


def ret_reg(rename=None, add_checks=None):
    def reg(carried):
        out = []
        for x in carried:
            title = (rename or {}).get(x['title'], x['title'])
            checks = [c for c in x['checks'] if 'retention' not in c]
            for c in (add_checks or {}).get(title, []):
                if c not in checks:
                    checks.append(c)
            out.append(dict(x, title=title, fx=strip_ret(x['fx']), checks=checks))
        return out
    return reg


def gone(*ids):
    return ''.join(f"        await expect(page.getByTestId('{i}')).toHaveCount(0);\n" for i in ids)


FX55 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
    I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 333.33)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-02-28', [L(2, 'Design', 1, 200)])],
    payments=[P(1, 1, 150, '2026-02-10', [(2, 150)])])


def t55():
    s_ = plus(FX55, inv=[(1, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    p = plus(s_, payments=[P(2, 1, 366.66, SA, [(1, 366.66)])])
    return [T('an invoice holds nothing back', '@core', FX55, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + gone('retention-form-pct', 'retention-form-submit', 'invoice-retention') + """        await page.getByTestId('invoice-send').click();
        // 333.33 + 33.33 tax: all of it is due
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
""" + gone('invoice-release-retention') + """        await page.getByTestId('payment-form-amount').fill('{sent:inv1.due|plain}');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        // the part-paid invoice past its due date owes its last 70.00 and is overdue
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv2.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{p:client1.overdue}');
""", sent=s_, p=p)]


text_copy(168, 'cp55_retention', M168 + "its three tests are replaced by one checking that an invoice has no retention "
          "box or figures and owes, and is paid, in full.",
          reps=[("// A draft can hold back retention (invoices[].retentionPct, 0 to 20 with up to two decimals, from\n"
                 "// the retention form): that percentage of the amount before tax (subtotal minus discount), rounded\n"
                 "// down to the cent, shown on the invoice. While held it is not part of the amount due, takes no\n"
                 "// payments or credit, and never makes the invoice Overdue; once everything else is paid the status\n"
                 "// is Retention held. The Release retention button on a sent invoice with nothing else due releases\n"
                 "// it (invoices[].retentionReleasedOn): it is added to the amount due, falls due 30 days later, and\n"
                 "// RETENTION_RELEASED id=<id> amount=<retention> is written; it is refused while anything else is\n"
                 "// due or there is nothing to release. The client's balance includes retention, held or released;\n"
                 "// the overdue amount includes released retention once it is overdue.",
                 "// Invoices hold nothing back: there is no retention form, retention figure or Release retention\n"
                 "// button, and an invoice owes, and is overdue on, its whole amount.")],
          retire=['holds retention back until it is released',
                  'releases only once the rest is paid, and released retention can fall overdue',
                  'refuses a retention outside 0 to 20'], add_ts=t55)

text_copy(168, 'cp56_credit_note_excess', M168 + "a credit note takes what its original owes and the rest becomes "
          "credit, so the held-retention test is dropped. Carries the other two tests.",
          reps=[("// A credit note may be for more than its original still owes. Issuing it takes off what the\n"
                 "// original owes, then its held retention, and the rest is held on the client's account as a credit\n"
                 "// payment dated the day it is issued",
                 "// A credit note may be for more than its original still owes. Issuing it takes off what the\n"
                 "// original owes, and the rest is held on the client's account as a credit payment dated the day it\n"
                 "// is issued")],
          retire=['a credit note takes held retention before it leaves credit'])

text_copy(168, 'cp57_instalment_plan', M168 + "an invoice can no longer hold retention, so the refusal test drops its "
          "retention case. Carries all three tests.",
          reps=[("An invoice with retention can't have a plan, and credit is not", "Credit is not"),
                ("        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',\n"
                 "          retentionPct: 5,\n"
                 "          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 100 }] },\n", ""),
                ("    // invoice 4 holds back retention, so it can't also have a plan\n"
                 "    await page.getByTestId('invoice-row-4').click();\n"
                 "    await page.getByTestId('plan-form-count').fill('3');\n"
                 "    await page.getByTestId('plan-form-rate').fill('12');\n"
                 "    await page.getByTestId('plan-form-submit').click();\n"
                 "    await expect(page.getByTestId('plan-form-error')).toBeVisible();\n"
                 "    await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);\n", "")],
          reg=lambda carried: [dict(x, fx=dict(strip_ret(x['fx']), invoices=[i for i in x['fx']['invoices'] if i['id'] != 4])
                                    if x['title'] == 'refuses a plan that breaks a rule' else strip_ret(x['fx'])) for x in carried])

FX60 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 3, 111.11)], discountPct=10)],
    payments=[P(1, 1, 300, '2026-03-05', [(1, 300)])])


def t60():
    p = plus(FX60, payments=[P(2, 1, 29.99, SA, [(1, 29.99)])])
    return [T('the whole invoice is due, tax included', '@core', FX60, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 333.33 less 10% (33.33) = 300.00, plus 30.00 tax: 330.00, of which 300.00 is paid
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""" + gone('invoice-retention') + """        await page.getByTestId('payment-form-amount').fill('29.99');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        // 0.01 left is written off: Paid, never Retention held
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{p:inv1.writtenOff}');
""", p=p)]


text_copy(168, 'cp60_retention_before_tax', M168 + "the test of retention before tax is replaced by one showing the "
          "whole invoice, tax included, due and paid.",
          reps=[("// Retention is worked out on the invoice's amount before tax (the subtotal minus the discount),\n"
                 "// still rounded down to the cent, instead of on the grand total. Everything that follows from it\n"
                 "// (the amount due, Retention held, the client's balance) uses that amount.",
                 "// Nothing is held back from an invoice: its amount due is its whole grand total, tax included, less\n"
                 "// what has been paid.")],
          retire=['works retention out before tax'], add_ts=t60)

text_copy(168, 'cp62_early_payment_discount', M168 + "an invoice can't hold retention any more, so invoice 4 now has "
          "an early-payment settle amount too (98.00). Carries all three tests.",
          reps=[("Invoices with retention or a plan get\n// no early discount.", "Invoices with a plan get no early\n// discount."),
                ("          retentionPct: 10,\n", ""),
                ("    // an invoice holding back retention gets no early discount\n"
                 "    await page.getByTestId('invoice-row-4').click();\n"
                 "    await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);",
                 "    // invoice 4 gets the early discount too: 100.00 - 2% = 98.00 settles it now\n"
                 "    await page.getByTestId('invoice-row-4').click();\n"
                 "    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$98.00');")],
          reg=ret_reg(add_checks={'paying the full amount early leaves the discount as credit': ['inv4.settle']}))

text_copy(168, 'cp63_late_interest', M168 + "the description no longer mentions it. Carries both tests.",
          reps=[("(not counting earlier interest or retention)", "(not counting earlier interest)")],
          reg=ret_reg())


def t75():
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-02-15', '2026-03-31', [L(1, 'Licence', 1, 100)], instalments=3, instalmentRate=0)])
    dup = plus(fx1, invoices=[I(4, 1, 'DRAFT', SA, '2026-04-30', [L(2, 'Licence', 1, 100)], instalments=3, instalmentRate=0)])
    fx2 = dict(asOf=SA, clients=[A], invoices=[])
    new = plus(fx2, clients=[dict(id=2, name='Initech', email='ap@initech.example')],
               invoices=[I(5, 2, 'DRAFT', SA, '2026-04-30', [L(3, 'Build', 1, 400)])])
    return [T('duplicating keeps the plan', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-duplicate').click();
        // the copy is issued today, so its instalments fall due on 04-10, 05-10, 06-10
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('{d:inv4.inst1.due}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('{d:inv4.inst3.due}');
        // 110.00 over 3 at 0%: 37.00, 37.00, then the 36.00 left
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('{d:inv4.inst3.payment}');
""" + gone('invoice-retention'), d=dup),
            T('new invoices hold nothing back', '@core', fx2, """
        await expect(page.getByTestId('client-form-retention-pct')).toHaveCount(0);
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Build');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('400');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{new:inv5.grand}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{new:inv5.due}');
""" + gone('invoice-retention'), new=new)]


text_copy(168, 'cp75_client_retention', M168 + "clients have no standard retention, so its tests are replaced by one "
          "showing a duplicate keeping its plan and one showing a new client's invoice holding nothing back.",
          reps=[("// A client can have a standard retention percentage (clients[].retentionPct, set when adding the\n"
                 "// client): their new invoices start with it. Duplicating an invoice keeps that invoice's own\n"
                 "// retention and instalment plan; the copy's schedule is dated from its new issue date.",
                 "// Clients have no standard retention and new invoices hold nothing back. Duplicating an invoice\n"
                 "// keeps its instalment plan; the copy's schedule is dated from its new issue date.")],
          retire=["new invoices start with the client's retention", 'duplicating keeps the plan and the retention',
                  'sets a standard retention when adding a client'], add_ts=t75)

FX83 = dict(asOf=SA, clients=[A], invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 5000)])])


def t83():
    return [T('there is no retention to cap', '@core', FX83, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + gone('retention-form-pct', 'retention-form-cap', 'invoice-retention') + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""")]


text_copy(168, 'cp83_retention_cap', M168 + "with nothing held back there is nothing to cap, so the cap test is "
          "replaced by one checking the retention form and cap are gone.",
          reps=[("// Retention can be capped at a maximum amount (invoices[].retentionCap, entered with the retention\n"
                 "// percentage): the retention is the percentage worked out as usual, but never more than the cap.",
                 "// There is no retention, so no retention cap: the invoice shows no retention or cap boxes and owes\n"
                 "// its whole amount.")],
          retire=['caps the retention at a maximum amount'], add_ts=t83)

FX93 = dict(asOf=SA, clients=[A], invoices=[I(1, 1, 'SENT', '2026-02-01', '2026-04-30', [L(1, 'Build', 1, 1000)])],
            payments=[P(1, 1, 400, '2026-02-20', [(1, 400)])])


def t93():
    return [T('there is no retention to release', '@core', FX93, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + gone('invoice-release-retention', 'retention-release-amount', 'invoice-retention-held') + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 1,000.00 - 400.00
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
""")]


text_copy(168, 'cp93_partial_retention_release', M168 + "nothing is held, so the two release tests are replaced by one "
          "checking that the release controls are gone and the invoice owes the rest of its total.",
          reps=[("// Part of the retention can be released: an amount entered with the Release retention button (empty\n"
                 "// releases all that is held). What has been released (invoices[].retentionReleasedAmount) becomes\n"
                 "// due 30 days after the latest release; the rest stays held. The panel shows the retention still\n"
                 "// held, and RETENTION_RELEASED shows the amount released. An amount of zero or less, with more than\n"
                 "// two decimals, or more than is held is refused.",
                 "// Nothing is held back, so nothing is released: there is no Release retention button, release\n"
                 "// amount or retention-held figure, and the invoice owes what is left of its total.")],
          retire=['releases part of the retention', 'refuses to release more than is still held'], add_ts=t93)

FX98 = dict(asOf='2026-04-30', settings={'lateInterestRate': 12}, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-01-05', '2026-01-31', [L(1, 'Build', 1, 1000)])],
    payments=[P(1, 1, 900, '2026-01-20', [(1, 900)])])


def t98():
    return [T('what is left unpaid earns interest from the end of grace', '@core', FX98, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 100.00 was still owed at the end of the grace week (2026-02-07): 82 days to today,
        // 100.00 x ((1 + 0.12/360)^82 - 1)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""")]


text_copy(168, 'cp98_retention_interest', M168 + "there is no released retention to earn interest, so the test is "
          "replaced by one where the 100.00 left unpaid earns interest from the end of the invoice's grace week.",
          reps=[("// Released retention that is still unpaid once it is overdue (more than the grace period past its\n"
                 "// due date, 30 days after release) earns late interest by the same rule as an invoice, from the end\n"
                 "// of its grace period.",
                 "// With no retention, whatever is left of an invoice after the end of its grace period earns late\n"
                 "// interest from then, by the usual rule.")],
          retire=['released retention earns interest once overdue'], add_ts=t98)

text_copy(168, 'cp106_prices_include_tax', M168 + "the second test no longer holds back 94.95, so the whole 1,041.75 is "
          "due. Carries all three tests (the second renamed).",
          reps=[("// (invoice-net) and each line its net; retention and the early-payment discount are worked out on\n"
                 "// the amount before tax.",
                 "// (invoice-net) and each line its net; the early-payment discount is worked out on the amount\n"
                 "// before tax."),
                ("  test('discounts, retention and exempt lines on prices that include tax'",
                 "  test('discounts and exempt lines on prices that include tax'"),
                ("          retentionPct: 10,\n", ""),
                ("    // retention is 10% of the amount before tax, rounded down\n"
                 "    await expect(page.getByTestId('invoice-retention')).toHaveText('$94.95');\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$946.80');",
                 "    // nothing is held back: the whole grand total is due\n"
                 "    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,041.75');")],
          reg=ret_reg(rename={'discounts, retention and exempt lines on prices that include tax':
                              'discounts and exempt lines on prices that include tax'}))

text_copy(168, 'cp86_write_off', M168 + "the description no longer mentions it. Carries both tests.",
          reps=[("late charges and retention included", "late charges included")], reg=ret_reg())
text_copy(168, 'cp122_interest_cap', M168 + "the description no longer mentions released retention. Carries both "
          "tests.", reps=[("on invoices, instalments and released retention,", "on invoices and instalments,")],
          reg=ret_reg())
text_copy(168, 'cp139_region_grace', M168 + "the description no longer mentions released retention. Carries the "
          "test.", reps=[("their invoices, instalments and released retention become overdue",
                          "their invoices and instalments become overdue")], reg=ret_reg())

# ------------------------------------------------------------------------- cp188 smallest amounts first
M188 = "UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after the overdue invoices, a payment now pays the smallest amount due first; "
ORDER_OLD = ("largest amount due to the smallest (lower id on the same amount), each paid off in full before the\n// next.")
ORDER_NEW = ("smallest amount due to the largest (lower id on the same amount), each paid off in full before the\n// next.")


def realloc(title, pid, allocs):
    def reg(carried):
        out = []
        for x in carried:
            x = dict(x, fx=copy.deepcopy(x['fx']))
            if x['title'] == title:
                for p in x['fx'].get('payments', []):
                    if p['id'] == pid:
                        p['allocations'] = [dict(invoiceId=i, amount=a, **({'date': dd} if dd else {})) for i, a, dd in allocs]
            out.append(x)
        return out
    return reg


def chain(*fns):
    def reg(carried):
        for f in fns:
            carried = f(carried)
        return carried
    return reg


text_copy(188, 'cp22_auto_allocation', M188 + "the 150.00 pays invoice 3 (50.00) and invoice 2 (80.00) and "
          "20.00 of invoice 1, instead of all of invoice 1 and 50.00 of invoice 2. Carries both tests.",
          reps=[("// invoices automatically: overdue invoices first (oldest due date first, lower id on the same date), then the rest from the\n"
                 "// largest amount due to the smallest", "// invoices automatically: overdue invoices first (oldest due date first, lower id on the same date), then the rest from the\n"
                 "// smallest amount due to the largest"),
                ("    // None is overdue yet: invoice 1 (100.00, the largest) is paid off, then invoice 2 (80.00) takes\n"
                 "    // the last 50.00; invoice 3 (50.00) and the draft are untouched.",
                 "    // None is overdue yet: invoice 3 (50.00, the smallest) is paid off, then invoice 2 (80.00), and\n"
                 "    // invoice 1 (100.00) takes the last 20.00; the draft is untouched."),
                ("    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');",
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');"),
                ("    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=50.00');\n"
                 "    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=100.00');",
                 "    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=50.00');\n"
                 "    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=80.00');\n"
                 "    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=20.00');"),
                ("    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00'); // 100.00 - 100.00",
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00'); // 100.00 - 20.00")],
          reg=realloc('applies a payment to the oldest invoices first', 1, [(3, 50, None), (2, 80, None), (1, 20, None)]))

text_copy(188, 'cp24_allocate_by_due_date', M188 + "after overdue invoice 4 the 150.00 pays invoice 3 (40.00), "
          "invoice 2 (60.00) and 20.00 of invoice 1. Carries the test.",
          reps=[(ORDER_OLD, ORDER_NEW),
                ("    // Overdue invoice 4 (due 03-31) takes 30.00; then by amount due, invoice 1 (100.00) 100.00 and\n"
                 "    // invoice 2 (60.00) the last 20.00; invoice 3 (40.00) gets nothing.",
                 "    // Overdue invoice 4 (due 03-31) takes 30.00; then the smallest amount due first: invoice 3 (40.00),\n"
                 "    // invoice 2 (60.00), and invoice 1 (100.00) the last 20.00."),
                ("      'PAYMENT_RECORDED id=1 invoice=4 amount=30.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=1 amount=100.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=2 amount=20.00',",
                 "      'PAYMENT_RECORDED id=1 invoice=4 amount=30.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=3 amount=40.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=1 amount=20.00',"),
                ("    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');",
                 "    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');"),
                ("    await page.getByTestId('invoice-row-2').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 60.00 - 20.00",
                 "    await page.getByTestId('invoice-row-1').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00'); // 100.00 - 20.00")],
          reg=chain(realloc('applies a payment to the earliest due date first', 1, [(4, 30, None), (3, 40, None), (2, 60, None), (1, 20, None)]),
                    lambda c: [dict(x, checks=[k.replace('inv2.due', 'inv1.due') for k in x['checks']]) for x in c]))

text_copy(188, 'cp50_several_references', M188 + "the 120.00 pays invoice 123 (30.00) and invoice 7 (60.00), "
          "then 30.00 of invoice 1. Carries both tests.",
          reps=[("// first (oldest due date first), then the largest amount due first (lower id on the same amount),",
                 "// first (oldest due date first), then the smallest amount due first (lower id on the same amount),"),
                ("    // none of the three is overdue: 1 (100.00, the largest) takes 100.00, then 7 (60.00) the last\n"
                 "    // 20.00; 123 (30.00) gets nothing",
                 "    // none of the three is overdue: 123 (30.00, the smallest) is paid off, then 7 (60.00), and 1\n"
                 "    // (100.00) takes the last 30.00"),
                ("      'PAYMENT_RECORDED id=1 invoice=1 amount=100.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=7 amount=20.00',",
                 "      'PAYMENT_RECORDED id=1 invoice=123 amount=30.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=7 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=1 amount=30.00',"),
                ("    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');",
                 "    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');"),
                ("    await page.getByTestId('invoice-row-7').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 60.00 - 20.00",
                 "    await page.getByTestId('invoice-row-1').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$70.00'); // 100.00 - 30.00")],
          reg=chain(realloc('applies one payment to the invoices its references name', 1, [(123, 30, None), (7, 60, None), (1, 30, None)]),
                    lambda c: [dict(x, checks=[k.replace('inv7.due', 'inv1.due') for k in x['checks']]) for x in c]))

text_copy(188, 'cp64_allocation_priority', M188 + "the 300.00 pays invoices 1 and 2 (overdue), then 3 (30.00), "
          "5 (150.00) and 20.00 of 4; the named 250.00 pays 3, 5 and 70.00 of 4. Carries both tests (the first renamed).",
          reps=[("// first (oldest due date first, lower id on the same date), then the rest from the largest amount\n"
                 "// due to the smallest (lower id on the same amount), each paid off before the next.",
                 "// first (oldest due date first, lower id on the same date), then the rest from the smallest amount\n"
                 "// due to the largest (lower id on the same amount), each paid off before the next."),
                ("    // overdue first, oldest due date first: 1 (due 03-31) 40.00, 2 (04-05) 60.00; then the largest\n"
                 "    // amount due: 4 (200.00). Invoice 3 (due 04-15) is within its grace week, so not overdue.",
                 "    // overdue first, oldest due date first: 1 (due 03-31) 40.00, 2 (04-05) 60.00; then the smallest\n"
                 "    // amount due first: 3 (30.00; due 04-15, within its grace week, so not overdue), 5 (150.00), and\n"
                 "    // 20.00 of 4 (200.00)."),
                ("      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=4 amount=200.00',",
                 "      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=5 amount=150.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=4 amount=20.00',"),
                ("    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$180.00'); // 30.00 + 150.00",
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid late');\n"
                 "    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$180.00'); // 200.00 - 20.00"),
                ("  test('pays overdue invoices first, then the largest'", "  test('pays overdue invoices first, then the smallest'"),
                ("    // none of the three is overdue: largest first, 4 (200.00), then 5 (50.00 of 150.00)\n"
                 "    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([\n"
                 "      'PAYMENT_RECORDED id=1 invoice=4 amount=200.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=5 amount=50.00',\n"
                 "    ]);\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');\n"
                 "    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await page.getByTestId('invoice-row-5').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00'); // 150.00 - 50.00",
                 "    // none of the three is overdue: smallest first, 3 (30.00), then 5 (150.00), then 70.00 of 4\n"
                 "    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([\n"
                 "      'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=5 amount=150.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=4 amount=70.00',\n"
                 "    ]);\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid late');\n"
                 "    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');\n"
                 "    await page.getByTestId('invoice-row-4').click();\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$130.00'); // 200.00 - 70.00")],
          reg=chain(realloc('pays overdue invoices first, then the largest', 1, [(1, 40, None), (2, 60, None), (3, 30, None), (5, 150, None), (4, 20, None)]),
                    lambda c: [dict(x, title='pays overdue invoices first, then the smallest') if x['title'] == 'pays overdue invoices first, then the largest' else x for x in c],
                    realloc('pays named invoices the same way', 1, [(3, 30, None), (5, 150, None), (4, 70, None)]),
                    lambda c: [dict(x, checks=[k.replace('inv5.due', 'inv4.due') for k in x['checks']]) for x in c]))

text_copy(188, 'cp81_apply_credit', M188 + "after overdue invoice 1 the credit pays invoice 3 (150.00) before "
          "invoice 2. Carries both tests.",
          reps=[("// first, then the largest amount due), each paid off before the next,",
                 "// first, then the smallest amount due), each paid off before the next,"),
                ("    // oldest credit first, to overdue invoice 1 (40.00), then the largest amount due, invoice 2;\n"
                 "    // payment 3 is held for draft invoice 4 and stays put",
                 "    // oldest credit first, to overdue invoice 1 (40.00), then the smallest amount due, invoice 3\n"
                 "    // (150.00), then invoice 2; payment 3 is held for draft invoice 4 and stays put"),
                ("      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=2 invoice=2 amount=120.00',",
                 "      'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',\n"
                 "      'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',\n"
                 "      'PAYMENT_RECORDED id=2 invoice=3 amount=90.00',\n"
                 "      'PAYMENT_RECORDED id=2 invoice=2 amount=30.00',"),
                ("    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');",
                 "    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');\n"
                 "    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');"),
                ("toHaveText('$120.00'); // 20.00 + 150.00 - 50.00", "toHaveText('$120.00'); // 170.00 - 50.00")],
          reg=lambda carried: [dict(x, fx=_fx81(x['fx'])) if x['label'] == 'a' else x for x in carried])


def _fx81(fx):
    f = copy.deepcopy(fx)
    for p in f['payments']:
        if p['id'] == 1:
            p['allocations'] = [dict(invoiceId=1, amount=40, date='2026-04-20'), dict(invoiceId=3, amount=60, date='2026-04-20')]
        if p['id'] == 2:
            p['allocations'] = [dict(invoiceId=3, amount=90, date='2026-04-20'), dict(invoiceId=2, amount=30, date='2026-04-20')]
    return f
