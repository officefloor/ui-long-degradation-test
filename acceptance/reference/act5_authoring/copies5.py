"""Earlier specs updated at Act V mutations."""
from lib5 import *  # noqa
from cps3 import RATES, HV, KK, IN  # noqa
from cps5 import add5, remove5, edit5, add_line, edit_line, remove_line, see, gone, audit  # noqa

S3 = '2026-03-10'

# ------------------------------------------------------------------------- cp204 adjustment notes instead of reopening
M204 = "UPDATED for cp204 (mutates: [16, 31, 42, 201]): a sent invoice is no longer reopened; "


def t16():
    fx = dict(asOf=S3, clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(6, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 80)])])
    a = add5(fx, 5, L(0, 'Extra pages', 1, 20), 204)
    fx2 = dict(asOf=S3, clients=[A], invoices=[
        I(7, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)])],
        payments=[P(1, 1, 30, '2026-03-05', [(7, 30)])])
    b = add5(fx2, 7, L(0, 'Extra pages', 1, 20), 204)
    return [T('a line added to a sent invoice is billed on an adjustment note', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
""" + add_line('Extra pages', 1, 20) + """        // the invoice stays sent with its one line; the 20.00 goes on adjustment note 7
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{a:inv5.subtotal}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv5.status}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv5.adjusted}');
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=7 number={a:inv7.number} invoice=5 total={a:inv7.grand|plain}');
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-total')).toHaveText('{a:inv7.listTotal}');
        // a sent invoice's discount can't be changed
        await page.getByTestId('invoice-row-6').click();
        await page.getByTestId('discount-form-pct').fill('10');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('discount-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv6.discount}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv6.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
""", a=a),
            T('a part-paid invoice takes adjustment notes too', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-7').click();
""" + add_line('Extra pages', 1, 20) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=8 number={b:inv8.number} invoice=7 total={b:inv8.grand|plain}');
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(1);
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{b:inv7.subtotal}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv7.status}');
        await expect(page.getByTestId('invoice-row-8').getByTestId('invoice-status')).toHaveText('{b:inv8.status}');
        await page.getByTestId('discount-form-pct').fill('10');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('discount-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{b:inv7.discount}');
""", b=b)]


text_copy(204, 'cp16_reopen_sent_invoice', M204 + "a line added to a sent invoice, paid or not, is billed on an "
          "adjustment note and the invoice stays as sent, and a sent invoice's discount is always fixed. Both "
          "tests are replaced by tests of that. Carries neither earlier test.",
          reps=[("// A sent invoice with no payments can still be changed: adding a line or changing the discount puts\n"
                 "// it back to Draft (to be sent again) and writes INVOICE_REOPENED id=<id>. Once any payment has been\n"
                 "// recorded against it, changes are refused with an error.",
                 "// A line added to a sent invoice, paid or not, is billed on an adjustment note (ADJUSTMENT_ISSUED);\n"
                 "// the invoice stays as sent. A sent invoice's discount can't be changed.")],
          retire=['changing an unpaid sent invoice puts it back to draft', 'an invoice with a payment stays fixed'],
          add_ts=t16)


def t31():
    fx = dict(asOf=S3, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40), L(2, 'Extras', 1, 10)])])
    a = remove5(fx, 3, 2, 204)
    return [T('removing a line from a sent invoice takes it off on a credit adjustment note', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
""" + remove_line(2) + """        // the invoice keeps both lines as sent; a credit note takes the 10.00 off what it owes
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={a:inv4.number} invoice=3 total={a:inv4.listTotal|plain}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{a:inv3.subtotal}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv3.adjusted}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv3.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
""", a=a)]


text_copy(204, 'cp31_remove_line', M204 + "removing a line from a sent invoice takes it off on a credit adjustment "
          "note, so the reopening test is replaced by one of that. Carries the other two tests.",
          reps=[("// A line can be removed from a draft, or from a sent invoice with no payments (which reopens it as a\n"
                 "// draft, writing INVOICE_REOPENED). The subtotal, discount and its split, tax and totals are worked\n"
                 "// out again.",
                 "// A line can be removed from a draft; the subtotal, discount and its split, tax and totals are\n"
                 "// worked out again. Removing a line from a sent invoice takes it off on a credit adjustment note\n"
                 "// instead (ADJUSTMENT_ISSUED), leaving the invoice as sent.")],
          retire=['removing a line from an unpaid sent invoice reopens it'], add_ts=t31)


def t42():
    fx = dict(asOf=S3, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
        payments=[P(1, 1, 20, '2026-03-05', [(4, 20)])])
    a = edit5(fx, 3, 1, 204, unitPrice=45)
    b = edit5(a, 4, 2, 204, unitPrice=60)
    return [T('editing a line of a sent invoice takes the old line off and bills the new one', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
""" + edit_line(1, price=45) + """        // a new price: a credit note takes the 40.00 line off and a debit note bills it at 45.00
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=5 number={a:inv5.number} invoice=3 total={a:inv5.listTotal|plain}');
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=6 number={a:inv6.number} invoice=3 total={a:inv6.grand|plain}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{a:inv3.subtotal}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv3.adjusted}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        // the part-paid invoice: the 50.00 taken off leaves the 20.00 paid as credit, which the 60.00
        // debit note then uses
        await page.getByTestId('invoice-row-4').click();
""" + edit_line(2, price=60) + """        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=8 amount=20.00');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
        await page.getByTestId('invoice-row-8').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv8.due}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
""", a=a, b=b)]


text_copy(204, 'cp42_edit_line', M204 + "editing a line of a sent invoice, paid or not, issues adjustment notes, so "
          "the reopening test is replaced by one of that. Carries the other two tests.",
          reps=[("// totals. Editing a sent invoice with no payments reopens it as a draft (INVOICE_REOPENED); one with\n"
                 "// a payment refuses the edit; an edit that would leave less than a fixed discount is refused.",
                 "// totals. Editing a line of a sent invoice, paid or not, issues adjustment notes instead and leaves\n"
                 "// the invoice as sent; an edit that would leave less than a fixed discount is refused.")],
          retire=['editing a line of an unpaid sent invoice reopens it'], add_ts=t42)

# ------------------------------------------------------------------------- cp212 no more instalment plans (the reversal)
from harness import fixtures as _F  # noqa: E402
from cps5 import pay as pay_form, send as send_click  # noqa: E402

PLAN_CPS = [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148, 149, 189]
M212 = f"UPDATED for cp212 (mutates: [{', '.join(str(x) for x in PLAN_CPS)}]): instalment plans are gone; "
PLAN_GONE = gone('plan-form-count', 'plan-form-rate', 'plan-form-submit', 'invoice-plan-total') + \
    "        await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);\n"
RETIRED_212 = []


def comment_block(base, k):
    """The feature description of base's version in force before k (the comment under any copy note)."""
    s = open(latest_path(base, k)).read()
    lines, i, j = strip_note(s)
    end = next(x for x in range(j, len(lines)) if lines[x].startswith('test.describe('))
    return '\n'.join(lines[j:end])


def plan_copy(base, note, desc, add_ts, keep=()):
    """Ship base at 212 with its plan tests retired, its description replaced and add_ts added."""
    titles = _F.test_titles(latest_path(base, 212))
    retire = [t for t in titles if t not in keep]
    RETIRED_212.extend(f'{base}.spec.ts::{t}' for t in retire)
    if 'Carries' not in note:
        note += ' Carries none of the earlier tests.'
    text_copy(212, base, M212 + note, reps=[(comment_block(base, 212), '\n'.join(wrap_comment(desc)))],
              retire=retire, add_ts=add_ts)


def _due_test(title, fx, iid, extra='', states=None, intro=''):
    """A draft billed and sent in full: no plan form, the whole grand total due by the usual terms."""
    s_ = sent5(fx, [iid], 212)
    st = dict(sent=s_)
    st.update(states or {})
    return T(title, '@core', fx, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-{iid}').click();
""" + intro + PLAN_GONE + send_click() + f"""        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{sent:inv{iid}.due}}');
        await expect(page.getByTestId('invoice-row-{iid}').getByTestId('invoice-due')).toHaveText('{{sent:inv{iid}.dueDate}}');
""" + extra, **st)


T10 = {'taxRate': 10}


def t57():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1200)])])
    return [_due_test('an invoice is billed in full, with no instalment plan', fx, 1,
                      intro="        // 1,200.00 + 120.00, all due at the end of next month when sent\n")]


plan_copy('cp57_instalment_plan', "the plan tests are replaced by one showing an invoice billed and due in full.",
          "There are no instalment plans: an invoice has no plan form or instalments and is due in full on its "
          "due date.", t57)


def t58():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1200)])])
    p = pay5(fx, P(1, 1, 150, S3, []), 212, open_id=1)
    return [T('a part payment is judged on the whole amount due', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + """        // 10% of the 1,320.00 due is 132.00: 100.00 is too little
""" + pay_form('100', S3) + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
""" + pay_form('150', S3) + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
""", p=p)]


plan_copy('cp58_instalment_payments', "payments no longer fill instalments, so both tests are replaced by one of a "
          "part payment judged on the whole amount due.",
          "There are no instalments: a part payment must be at least 10% of the invoice's amount due, unless it "
          "settles it.", t58)


def t66():
    fx = dict(asOf=S3, settings=dict(T10, lateInterestRate=12), clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Build', 1, 1000)])])
    return [T('an overdue invoice earns late interest on its whole amount', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + """        // 1,100.00 from the end of the grace week (2026-02-07) to 2026-03-10: 31 days at 12% (Actual/360)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
""")]


plan_copy('cp66_instalment_interest', "the instalment interest test is replaced by one of an overdue invoice earning "
          "interest on its whole amount.",
          "There are no instalments: an overdue invoice earns late interest on everything it still owes.", t66)


def t71():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 900)])])
    p = pay5(fx, P(1, 1, 990, S3, []), 212, open_id=1)
    return [T('there is no plan to pay off: paying the amount due settles the invoice', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + gone('invoice-payoff', 'invoice-interest-saved') + pay_form('990', S3) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        expect(auditLines().filter((l) => l.startsWith('PLAN_SETTLED'))).toEqual([]);
""", p=p)]


plan_copy('cp71_plan_payoff', "there is no plan to pay off early, so both tests are replaced by one showing the amount "
          "due settling the invoice.",
          "There are no instalment plans, so no payoff figure, interest saved or PLAN_SETTLED: paying the amount "
          "due settles an invoice.", t71)


def t73():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 200)]),
        I(2, 1, 'SENT', '2026-03-05', '2026-03-05', [L(3, 'Travel', 1, 200, creditOfLine=2)], creditOf=1)])
    return [T('a credit note comes straight off the invoice', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + """        // 1,320.00 less the 220.00 credited
        await expect(page.getByTestId('invoice-credited')).toHaveText('{s:inv1.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""")]


plan_copy('cp73_credit_note_on_plan', "a credit note no longer re-works instalments, so both tests are replaced by one "
          "showing a credit note coming straight off what the invoice owes.",
          "There are no instalment plans: an issued credit note comes off what its invoice owes.", t73)


def t75():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)])])
    return [T('duplicating copies the lines and nothing else', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-duplicate').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
""" + PLAN_GONE + """        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
""")]


plan_copy('cp75_client_retention', "a duplicate has no plan to keep, so that test is replaced by one showing the copy "
          "with the lines alone. Carries the other test.",
          "Clients have no standard retention and new invoices hold nothing back. Duplicating an invoice copies "
          "its lines; there is no plan to copy.", t75, keep=['new invoices hold nothing back'])


def t84():
    fx = dict(asOf=S3, settings=T10, clients=[C(A, termsDays=30)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)])])
    return [_due_test('an invoice is not split into instalments', fx, 1,
                      intro="        // 1,000.00 + 100.00, due in full 30 days after it is sent\n")]


plan_copy('cp84_whole_dollar_instalments', "the instalment rounding test is replaced by one of an invoice due in full.",
          "There are no instalments to round: an invoice is due in full.", t84)


def t85():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 2000)])])
    return [_due_test('there is no down payment: the whole invoice is due', fx, 1,
                      intro=gone('plan-form-down'))]


plan_copy('cp85_plan_down_payment', "there is no down payment, so both tests are replaced by one of the whole invoice "
          "due.", "There are no instalment plans or down payments: the whole invoice is due on its due date.", t85)


def t94():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Hosting', 1, 60)])])
    return [_due_test('a small invoice is due in full', fx, 1)]


plan_copy('cp94_minimum_instalment', "the minimum instalment test is replaced by one of a small invoice due in full.",
          "There are no instalments, so no minimum instalment: every invoice is due in full.", t94)


def t95():
    fx = dict(asOf=S3, settings=dict(T10, lateInterestRate=12), clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Build', 1, 500)])])
    return [T('an overdue invoice earns interest and no fee', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + gone('invoice-late-fee') + """        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 550.00 + interest
""")]


plan_copy('cp95_instalment_late_fee', "there are no instalments, so the test is replaced by one of an overdue invoice "
          "earning interest and no fee.",
          "There are no instalments; an overdue invoice earns late interest and no fee.", t95)


def t99():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 800)])])
    return [T('there are no instalments to skip', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + gone('instalment-skip') + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""")]


plan_copy('cp99_instalment_holiday', "there are no instalments to skip, so both tests are replaced by one showing that.",
          "There are no instalments, so none can be skipped: the invoice is due in full.", t99)


def t117():
    fx = dict(asOf=S3, settings=T10, clients=[C(A, withholdingPct=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)])])
    return [_due_test('the client owes the grand total less the withholding, in one go', fx, 1,
                      intro="        // 1,100.00 less 100.00 withheld\n")]


plan_copy('cp117_withholding', "the plan test is replaced by one showing the grand total less withholding due in one go. "
          "Carries the other three tests.",
          "A client can withhold tax (clients[].withholdingPct, on the client form): their invoices show the "
          "withholding, that percentage of the amount before tax rounded down to the cent, which the client never "
          "pays: the amount due, balance and everything worked out from what is owed leave it out, and the invoice "
          "is Paid once the rest is paid. Sending writes WITHHOLDING id=<id> amount=<withheld>. Credit notes and "
          "reverse-charged invoices have none.", t117,
          keep=["withholds part of the client's payment for their tax office", 'sets a withholding rate when adding a client',
                'a reverse-charged invoice has no withholding'])
plan_copy('cp122_interest_cap', "the instalment test is dropped. Carries the invoice test.",
          "A region can have a legal maximum interest rate (settings.regionMaxInterest, region -> annual %). Late "
          "interest for a client in that region is worked out at the lower of their usual rate (their own, else the "
          "workspace's) and the cap.", lambda: [], keep=["caps late interest at the region's legal maximum"])
plan_copy('cp128_no_late_fees', "the instalment test is dropped. Carries the invoice test.",
          "No late fee is charged any more: the late fee figures are gone from the panel, and the workspace has no "
          "late fee setting. Overdue invoices still earn late interest; a payment pays what the invoice owes first, "
          "then the interest, and waiving writes off the unpaid interest.", lambda: [],
          keep=['an overdue invoice is charged interest but no late fee'])


def t143():
    fx = dict(asOf=S3, settings=T10, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1500)])])
    return [_due_test('there is no plan fee', fx, 1, intro=gone('invoice-plan-fee'))]


plan_copy('cp143_plan_fee', "there is no plan fee, so the test is replaced by one showing that.",
          "There are no instalment plans, so no plan fee: the workspace has no plan fee setting and an invoice is due "
          "in full.", t143)


def t148():
    fx = dict(asOf=S3, settings=dict(T10, lateInterestRate=18, regionMaxInterest={'NY': 9}),
              clients=[C(A, region='NY')], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Build', 1, 1000)])])
    return [T('an overdue invoice in a capped region earns the capped rate', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + """        // 9%, not 18%, for the 31 days after the grace week
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
""")]


plan_copy('cp148_plan_rate_cap', "there is no plan rate to cap, so the test is replaced by one of an overdue invoice "
          "earning the capped rate.",
          "There are no instalment plans; a region's maximum interest rate caps an overdue invoice's late interest.",
          t148)


def t149():
    fx = dict(asOf=S3, settings=dict(T10, lateInterestRate=12, interestThreshold=5), clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-02-28', [L(1, 'Build', 1, 400)]),
        I(2, 1, 'SENT', '2026-01-01', '2026-01-31', [L(2, 'Build', 1, 1000)])])
    return [T("an invoice's late interest waits for the threshold", '@core', fx, """
        await page.getByTestId('client-row-1').click();
""" + PLAN_GONE + """        // 440.00 for 3 days: under 5.00, so none yet
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        // 1,100.00 for 31 days is over it
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
""")]


plan_copy('cp149_plan_interest_threshold', "there are no plans, so the test is replaced by one of an invoice's interest "
          "waiting for the threshold.",
          "There are no instalment plans; an invoice's late interest is not shown or owed until it reaches the "
          "interest threshold.", t149)


def t189():
    fx = dict(asOf='2026-01-31', settings={'approvalLimit': 1000}, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 980)]),
        I(2, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(2, 'Consulting', 1, 1020)])])
    return [T('approval is judged on the grand total', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + PLAN_GONE + """        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
""")]


plan_copy('cp189_plan_approval', "approval is judged on the grand total again, so the plan test is replaced by one of "
          "that.", "There are no instalment plans: approval is judged on an invoice's grand total.", t189)


import cps5 as _c5  # noqa: E402
cp(212, 'no_instalment_plans', """
    Instalment plans cause more trouble than they're worth now that adjustment notes and rebilling cover
    corrections. Remove them completely: no plan form, no instalment rows, no plan total, plan fee, payoff,
    interest saved or skipping, and no plan fee setting. Every invoice is due in full on its due date, earns
    late interest on what it owes once it's overdue, is judged for approval on its grand total, and has the
    client's credit used on it when it's sent, like any other.
""", _c5.s212, type_='mutative', mutates=PLAN_CPS, retires=RETIRED_212)

# ------------------------------------------------------------------------- cp216 no grace for high-risk clients


def desc_post(desc):
    """A post-render edit replacing a copy's feature description (the comment under its copy note)."""
    def fn(text):
        lines, i, j = strip_note(text)
        # the copy's own note is the first comment block; the description runs to test.describe
        k = i + 1
        while not lines[k].rstrip().endswith('.') or 'Carries' not in ' '.join(lines[i + 1:k + 1]):
            k += 1
        end = next(x for x in range(k, len(lines)) if lines[x].startswith('test.describe('))
        return '\n'.join(lines[:k + 1] + wrap_comment(desc) + lines[end:])
    return fn


copy_note(216, 'cp179_risk_interest',
          "UPDATED for cp216 (mutates: [179]): a HIGH-risk client now has no grace period, so the two HIGH clients' "
          "invoices earn interest from their due date, 2026-03-01 (60 days), instead of from 2026-03-08; the "
          "client with no history keeps its grace week. Carries the test.",
          reps=[("    // 12% + 3 = 15% on 1,000.00 from 2026-03-08: 53 days\n",
                 "    // 12% + 3 = 15% on 1,000.00 from its due date, 2026-03-01, with no grace for a HIGH client: 60 days\n")],
          post=desc_post("A HIGH-risk client's late interest rate is 3 percentage points above the rate that would "
                         "otherwise apply (on invoices and milestones), still capped by their region's legal maximum, "
                         "and runs from the due date: a HIGH-risk client has no grace period. The band used for an "
                         "invoice is the one its client's other invoices give, so an invoice's own late payment never "
                         "raises its own rate."))

# ------------------------------------------------------------------------- cp232 the cap applies to the usual rate only
copy_note(232, 'cp179_risk_interest',
          "UPDATED for cp232 (mutates: [179, 223]): the region's maximum now caps the usual rate only, so the New "
          "York client's 12% is under its 13% cap and the 3 points go on top: 15%, as for the client with no cap. "
          "Carries the test.",
          reps=[("    // 12% + 3 = 15% on 1,000.00 from 2026-03-08: 53 days\n",
                 "    // 12% + 3 = 15% on 1,000.00 from its due date, 2026-03-01, with no grace for a HIGH client: 60 days\n"),
                ("    // in New York the legal maximum of 13% still caps it\n",
                 "    // in New York the 13% maximum caps only the usual 12%, so the 3 points still go on top\n")],
          post=desc_post("A HIGH-risk client's late interest rate is 3 percentage points above the rate that would "
                         "otherwise apply (on invoices and milestones), and runs from the due date: a HIGH-risk client "
                         "has no grace period. A region's legal maximum caps only the usual rate; the 3 points go on "
                         "top. The band used for an invoice is the one its client's other invoices give, so an "
                         "invoice's own late payment never raises its own rate."))

# ------------------------------------------------------------------------- cp244 an edit is one note


def t42_244():
    fx = dict(asOf=S3, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
        payments=[P(1, 1, 20, '2026-03-05', [(4, 20)])])
    a = edit5(fx, 3, 1, 244, unitPrice=45)
    b = edit5(a, 4, 2, 244, unitPrice=60)
    return [T('editing a line of a sent invoice issues one note for the change', '@core', fx, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
""" + edit_line(1, price=45) + """        // a new price: one debit note for the 5.00 more
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=5 number={a:inv5.number} invoice=3 total={a:inv5.grand|plain}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{a:inv3.subtotal}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv3.adjusted}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        // the part-paid invoice: one debit note for the 10.00 more; the 20.00 paid stays on the invoice
        await page.getByTestId('invoice-row-4').click();
""" + edit_line(2, price=60) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=6 number={b:inv6.number} invoice=4 total={b:inv6.grand|plain}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv4.due}');
        expect(auditLines().filter((l) => l.startsWith('CREDIT_HELD') || l.startsWith('INVOICE_REOPENED'))).toEqual([]);
""", a=a, b=b)]


text_copy(244, 'cp42_edit_line', "UPDATED for cp244 (mutates: [42, 204]): editing a sent line other than its quantity "
          "now issues one note for the change in its amount, so the price edits give single debit notes of 5.00 and "
          "10.00 instead of a credit and a debit note each. Carries the other two tests.",
          reps=[("// totals. Editing a line of a sent invoice, paid or not, issues adjustment notes instead and leaves\n"
                 "// the invoice as sent; an edit that would leave less than a fixed discount is refused.",
                 "// totals. Editing a line of a sent invoice, paid or not, issues an adjustment note for the change in\n"
                 "// its amount instead and leaves the invoice as sent; an edit that would leave less than a fixed\n"
                 "// discount is refused.")],
          retire=['editing a line of a sent invoice takes the old line off and bills the new one'], add_ts=t42_244)
