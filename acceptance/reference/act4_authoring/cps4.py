"""Act IV checkpoints."""
from lib4 import *  # noqa
from cps import inst_rows  # noqa
from cps3 import RATES, KK, HV, IN, RT, RC, cash_pay, pay_applied, tax_lines  # noqa

SA = '2026-03-10'
AL = {'taxRate': 10, 'approvalLimit': 5000}


def add_line(desc, qty, price=None, unit=None, start=None, end=None, pct=None):
    out = f"        await page.getByTestId('line-form-description').fill('{desc}');\n"
    if unit:
        out += f"        await page.getByTestId('line-form-unit-type').fill('{unit}');\n"
    out += f"        await page.getByTestId('line-form-qty').fill('{qty}');\n"
    if price is not None:
        out += f"        await page.getByTestId('line-form-unit-price').fill('{price}');\n"
    if start:
        out += f"        await page.getByTestId('line-form-period-start').fill('{start}');\n"
        out += f"        await page.getByTestId('line-form-period-end').fill('{end}');\n"
    if pct is not None:
        out += f"        await page.getByTestId('line-form-percent').fill('{pct}');\n"
    out += "        await page.getByTestId('line-form-submit').click();\n"
    return out


def pay(amount, date, ref=None, remittance=None):
    out = f"        await page.getByTestId('payment-form-amount').fill('{amount}');\n"
    out += f"        await page.getByTestId('payment-form-date').fill('{date}');\n"
    if ref is not None:
        out += f"        await page.getByTestId('payment-form-reference').fill('{ref}');\n"
    if remittance is not None:
        out += f"        await page.getByTestId('payment-form-remittance').fill('{remittance}');\n"
    out += "        await page.getByTestId('payment-form-submit').click();\n"
    return out


def sent(fx, ids, date, due=None):
    """fx with drafts sent on date (issued that day; due date re-dated when given)."""
    upd = []
    for i in ids:
        u = dict(status='SENT', issueDate=date)
        if due:
            u['dueDate'] = due
        upd.append((i, u))
    return plus(fx, inv=upd)


def open_inv(c, i):
    return (f"        await page.getByTestId('client-row-{c}').click();\n"
            f"        await page.getByTestId('invoice-row-{i}').click();\n")


# =============================================================================== cp151 approval limit


def s151(n):
    exact = 156 <= n < 224        # cp224: an approval covers a lower total again
    on = dict(approvedOn=SA) if n >= 156 else {}
    fx1 = dict(asOf=SA, settings=AL, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 4800)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 400)])])
    a = plus(fx1, inv=[(1, dict(approvedTotal=5280, **on))])
    b = plus(a, lines=[(1, L(3, 'Support', 2, 150))])
    c = plus(b, inv=[(1, dict(approvedTotal=5610, **on))])
    d_ = plus(c, drop_lines=[(1, 3)])
    if exact:
        e = plus(d_, inv=[(1, dict(approvedTotal=5280, **on))])
        lower = """        // removing it again changes the total: an approval is for the exact amount, so it needs approval again
        await expect(page.getByTestId('invoice-approval')).toHaveText('{d:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([
          'INVOICE_APPROVED id=1 total={a:inv1.grand|plain}',
          'INVOICE_APPROVED id=1 total={c:inv1.grand|plain}',
          'INVOICE_APPROVED id=1 total={e:inv1.grand|plain}',
        ]);
"""
    else:
        e = d_
        lower = """        // removing it again brings the total back within the 5,610.00 approved: still approved
        await expect(page.getByTestId('invoice-approval')).toHaveText('{d:inv1.approval}');
"""
    s_ = sent(e, [1], SA, '2026-04-30')
    s2 = sent(s_, [2], SA, '2026-04-30')
    t1 = T('an invoice over the approval limit must be approved before it is sent', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 4,800.00 + 10% tax = 5,280.00, over the 5,000.00 limit
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await page.getByTestId('invoice-approve').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={a:inv1.grand|plain}');
        // a line that takes the total above what was approved needs approval again
""" + add_line('Support', 2, 150) + """        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{b:inv1.grand}'); // 5,280.00 + 330.00
        await expect(page.getByTestId('invoice-approval')).toHaveText('{b:inv1.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={c:inv1.grand|plain}');
        await page.getByTestId('line-row-3').getByTestId('line-remove').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{d:inv1.grand}');
""" + lower + """        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number={sent:inv1.number} total={sent:inv1.grand|plain}');
        // within the limit no approval is needed, and none can be given
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{sent:inv2.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect(page.getByTestId('invoice-approve-error')).toBeVisible();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s2:inv2.status}');
""", a=a, b=b, c=c, d=d_, e=e, sent=s_, s2=s2)
    st = dict(AL, usdPer=RATES)
    fx2 = dict(asOf=SA, settings=st, clients=[C(G, currency='EUR')], invoices=[
        I(3, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Build', 1, 4132.23)]),
        I(4, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Build', 1, 4132.24)])])
    dsc = plus(fx2, inv=[(4, dict(discountPct=1))])
    t2 = T("converts the limit to the client's currency", '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        // 5,000.00 US dollars / 1.10 = 4,545.4545, down to €4,545.45: a total of exactly that is not over it
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}'); // 4,132.23 + 413.22
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        // one cent more is
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv4.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
        // a 1% discount brings it back within the limit: 4,090.92 + 409.09
        await page.getByTestId('discount-form-pct').fill('1');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{d:inv4.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{d:inv4.approval}');
""", d=dsc)
    note = None
    if exact:
        note = ("UPDATED for cp156 (mutates: [151]): an approval is now for the exact total, so removing the "
                "support line again (5,610.00 back to 5,280.00) needs a third approval before the invoice can be "
                "sent. Carries both tests.")
    if n >= 224:
        note = ("UPDATED for cp224 (mutates: [151, 156]): an approval covers any total up to the one approved again "
                "(for as long as it lasts), so removing the support line (5,610.00 back to 5,280.00) leaves the invoice "
                "approved and it is sent without a third approval. Carries both tests.")
    rule = ("Approving records the approved total and the day (invoices[].approvedTotal, approvedOn); any change "
            "to the grand total afterwards, up or down, needs approval again, and an approval lapses 30 days "
            "after it was given." if exact else
            "Approving records the approved total and the day (invoices[].approvedTotal, approvedOn); the approval "
            "stands while the grand total is not above it and it has not lapsed, and a change that takes the total "
            "above it needs approval again." if n >= 224 else
            "Approving records the approved total (invoices[].approvedTotal); the approval stands while the "
            "grand total is not above it, and a change that takes the total above it needs approval again.")
    return Spec('cp151_approval_limit', 'approval over a limit', f"""
        A draft whose grand total (before any withholding) is over the workspace approval limit
        (settings.approvalLimit, in US dollars converted to the client's currency at the invoice's date rate,
        rounded down) needs approval: the panel shows its approval ("Not needed", "Needs approval" or
        "Approved"), sending it is refused until it is approved, and the Approve button approves it, writing
        INVOICE_APPROVED id=<id> total=<grand total>. Approving an invoice that needs no approval is refused.
        {rule} Credit notes never need approval.""", [t1, t2], n, copy_note=note)


cp(151, 'approval_limit', """
    Big invoices need a second look before they go out. Add an approval limit to the workspace (in US
    dollars). A draft whose grand total, before any withholding, is over the limit (converted to the
    client's currency at the invoice's date rate, rounded down) needs approval: show on the invoice
    whether approval is "Not needed", "Needs approval" or "Approved", refuse to send it while it needs
    approval, and give me an Approve button that approves it and writes INVOICE_APPROVED id=<invoice
    id> total=<grand total>. Refuse to approve an invoice that doesn't need it. Keep the approved total:
    the approval stands while the grand total is no higher, but a change that takes the total above
    what was approved needs approving again. Credit notes never need approval.
""", s151)

# =============================================================================== cp152 discounts need approval, not a reason


def s152(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 200)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 200)])])
    a = plus(fx1, inv=[(1, dict(discountPct=25))])
    b = plus(a, inv=[(1, dict(approvedTotal=165))])
    c = sent(b, [1], SA, '2026-04-30')
    d_ = plus(c, inv=[(2, dict(discountPct=20, discountReason='Loyalty'))])
    e = sent(d_, [2], SA, '2026-04-30')
    t1 = T('a discount of more than a fifth needs approval instead of a reason', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 25% with no reason is accepted now
        await page.getByTestId('discount-form-pct').fill('25');
        await page.getByTestId('discount-form-reason').fill('');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv1.discount}'); // 25% of 200.00
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={b:inv1.grand|plain}'); // 150.00 + 15.00
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv1.status}');
        // exactly a fifth needs no approval; a reason is still kept when given
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('discount-form-pct').fill('20');
        await page.getByTestId('discount-form-reason').fill('Loyalty');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{d:inv2.discount}');
        await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Loyalty');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{d:inv2.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{e:inv2.status}');
""", a=a, b=b, c=c, d=d_, e=e)
    fx2 = dict(asOf=SA, settings={'approvalLimit': 1200}, clients=[A], invoices=[
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 1500)], discountPct=15),
        I(4, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Build', 1, 1500)], discountAmount=600, discountCap=400),
        I(5, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Build', 1, 1300)], discountPct=10)])
    t2 = T('the discount and the limit each call for approval', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // 15% off 1,500.00 leaves 1,275.00: a small discount, but over the 1,200.00 limit
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        // a 600.00 discount capped at 400.00 takes off 26.7%: 1,100.00 is within the limit, but the
        // discount is more than a fifth
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv4.discount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv4.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
        // 10% off 1,300.00 leaves 1,170.00: neither
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv5.approval}');
""")
    return Spec('cp152_discount_approval', 'large discounts need approval', """
        An invoice discount that takes off more than a fifth of the subtotal (the amount actually taken off,
        after any cap) no longer needs a reason: the discount is accepted with or without one (a reason
        given is still kept and shown), and instead the invoice needs approval, whatever its total, before
        it can be sent. A discount of exactly a fifth needs none.""", [t1, t2], n)


cp(152, 'discount_approval', """
    Typing a reason for a big discount proves nothing. Stop requiring a reason: accept any discount with or
    without one (keep and show a reason when one is given). Instead, an invoice whose discount takes off
    more than a fifth of the subtotal (what is actually taken off, after any cap) needs approval before
    it can be sent, whatever its total, just like an invoice over the approval limit. Exactly a fifth
    needs no approval.
""", s152, type_='mutative', mutates=[41], retires=[
    'cp41_discount_reason.spec.ts::a discount over a fifth of the subtotal needs a reason',
    'cp41_discount_reason.spec.ts::refuses to send an invoice whose discount needs a reason'])

# =============================================================================== cp153 credit limit


def s153(n):
    cl = C(A, creditLimit=1000)
    fx1 = dict(asOf=SA, clients=[cl], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 600)]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Build', 1, 450)]),
        I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Support', 1, 60)])],
        payments=[P(1, 1, 100, '2026-03-02', [])])
    a = sent(fx1, [2], SA, '2026-04-30')
    a = plus(a, alloc=[(1, 2, 100, SA)])
    ap = plus(a, inv=[(3, dict(approvedTotal=60, approvedOn=SA))])
    ov = sent(ap, [3], SA, '2026-04-30')
    over = ""
    if n >= 180:
        over = ("        // it needs approval instead, and once approved it can go out over the limit, putting the client on hold\n"
                "        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv3.approval}');\n"
                "        await page.getByTestId('invoice-approve').click();\n"
                "        await expect.poll(() => auditLines().some((l) => l.startsWith('INVOICE_APPROVED id=3 '))).toBe(true);\n"
                "        await page.getByTestId('invoice-send').click();\n"
                "        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{ov:inv3.status}');\n"
                "        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{ov:client1.available}');\n"
                "        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{ov:client1.status}');\n")
    t1 = T("refuses to send an invoice that would take the client over its credit limit", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // 600.00 owed less 100.00 of credit = 500.00; 500.00 of the 1,000.00 limit is left
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{s:client1.available}');
        // 500.00 + 450.00 = 950.00 is within the limit; the credit is used on it as usual
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv2.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=100.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{a:client1.available}');
        // 950.00 + 60.00 = 1,010.00 would be over it
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([
          'INVOICE_SENT id=2 number={a:inv2.number} total={a:inv2.grand|plain}',
        ]);
""" + over, a=a, ap=ap, ov=ov)
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[C(G, creditLimit=2900, withholdingPct=10)], invoices=[
        I(4, 2, 'SENT', '2026-02-01', '2026-03-01', [L(4, 'Design', 1, 1000)]),
        I(5, 2, 'DRAFT', '2026-04-20', '2026-05-31', [L(5, 'Build', 1, 1800)])])
    b = sent(fx2, [5], '2026-04-30', '2026-05-31')
    t2 = T('counts late interest but not withholding against the limit', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        // the overdue invoice owes 1,100.00 less 100.00 withheld, plus its late interest
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{s:client2.balance}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{s:client2.available}');
        // the draft's grand total is 1,980.00, but 180.00 of it is withheld: the client will owe 1,800.00 of it
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv5.grand}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv5.status}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{b:client2.available}');
""", b=b)
    fx3 = dict(asOf=SA, clients=[C(A, creditLimit=500)], invoices=[
        I(5, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(5, 'Design', 1, 300)]),
        I(6, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(6, 'Build', 1, 250)]),
        I(7, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(7, 'Support', 1, 150)])])
    c = sent(fx3, [5, 7], SA, '2026-04-30')
    new = plus(fx3, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', creditLimit=750)])
    t3 = T('sending all drafts stops short of the limit', '@core', fx3, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-send-all').click();
        // 300.00 is sent; 300.00 + 250.00 would be over the 500.00 limit, so invoice 6 stays a draft;
        // 300.00 + 150.00 = 450.00 is within it
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{c:inv5.status}');
        await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('{c:inv6.status}');
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('{c:inv7.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{c:client1.available}');
        // a limit can be set when adding a client
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-credit-limit').fill('750');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{new:client2.available}');
""", c=c, new=new)
    note = None
    send_rule = ("Sending an invoice is refused when the balance plus what the invoice will add to it (its grand "
                 "total less any withholding) would be over the limit.")
    if n >= 180:
        note = ("UPDATED for cp180 (mutates: [153]): a draft that would take the client over the limit now needs "
                "approval rather than being refused outright, so invoice 3 is approved and sent, taking the client "
                "to -10.00 available and on hold. Carries all three tests.")
        send_rule = ("A draft whose sending would take the balance plus what it adds (its grand total less any "
                     "withholding) over the limit needs approval, and once approved it can be sent.")
    return Spec('cp153_credit_limit', 'credit limit', f"""
        A client can have a credit limit (clients[].creditLimit, in their currency; the client form's credit
        limit box). The client list shows what is still available under it: the limit minus the client's
        balance (so late interest counts and unused credit helps). {send_rule} Send all drafts sends the
        drafts it can, lowest id first, each judged on the balance after the ones before it, and leaves the
        rest as drafts.""", [t1, t2, t3], n, copy_note=note)


cp(153, 'credit_limit', """
    I need to stop extending credit to clients who already owe too much. Let me give a client a credit
    limit in their currency (a box on the client form) and show in the client list how much is still
    available: the limit minus their balance. Refuse to send an invoice when the client's balance plus
    what the invoice adds to it (its grand total less any withholding) would go over the limit. Send all
    drafts sends what it can, lowest id first, judging each on the balance after the ones before it,
    and leaves the others as drafts.
""", s153)

# =============================================================================== cp154 client hold


def s154(n):
    auto = n >= 160
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 300)]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Build', 1, 200)]),
        # from cp160 the test's payment clears invoice 3; issued 14 days before, so the client stays LOW risk
        I(3, 1, 'SENT', *(('2026-02-24', '2026-02-25') if auto else ('2026-01-15', '2026-02-15')),
          [L(3, 'Hosting', 1, 80)])])
    held = plus(fx1, clients=[], inv=[])
    held['clients'][0]['onHold'] = True
    if auto:
        p1 = plus(held, payments=[P(1, 1, 100, SA, [(3, 80)])])
        pay_txt = """        // a payment from a client on hold pays its overdue invoices first, oldest due date first: invoice 3's
        // 80.00; only the other 20.00 is held as credit, even with invoice 1 open
""" + pay('100', SA) + """        await expect(page.getByTestId('invoice-paid')).toHaveText('{p:inv1.paid}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{p:client1.credit}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=80.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{p:inv3.status}');
"""
        p2 = plus(p1, clients=[], inv=[])
        p2['clients'][0]['onHold'] = False
        p2 = plus(p2, alloc=[(1, 1, 20, SA)])
        apply_txt = "        // nothing is applied by itself; Apply credit now uses the 20.00 on invoice 1\n"
        rec = 'PAYMENT_RECORDED id=1 invoice=1 amount=20.00'
    else:
        p1 = plus(held, payments=[P(1, 1, 100, SA, [])])
        pay_txt = """        // a payment from a client on hold pays nothing, even with an invoice open: it is all held as credit
""" + pay('100', SA) + """        await expect(page.getByTestId('invoice-paid')).toHaveText('{p:inv1.paid}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{p:client1.credit}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=100.00');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{p:inv3.status}');
"""
        p2 = plus(p1, clients=[], inv=[])
        p2['clients'][0]['onHold'] = False
        # Apply credit: overdue first (invoice 3, 80.00), then the largest amount due (invoice 1)
        p2 = plus(p2, alloc=[(1, 3, 80, SA), (1, 1, 20, SA)])
        apply_txt = "        // nothing is applied by itself; Apply credit pays the overdue invoice 3, then 20.00 of invoice 1\n"
        rec = 'PAYMENT_RECORDED id=1 invoice=3 amount=80.00'
    s_ = sent(p2, [2], SA, '2026-04-30')
    t1 = T('a client on hold gets no invoices and its payments wait as credit', '@core', fx1, """
        await page.getByTestId('client-row-1').getByTestId('client-hold').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{h:client1.status}');
        await expect.poll(() => auditLines()).toContain('CLIENT_HELD id=1');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{h:inv2.status}');
        await page.getByTestId('invoice-row-1').click();
""" + pay_txt + """        await page.getByTestId('client-apply-credit').click();
        await expect(page.getByTestId('client-apply-credit-error')).toBeVisible();
        await page.getByTestId('client-row-1').getByTestId('client-hold').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{q:client1.status}');
        await expect.poll(() => auditLines()).toContain('CLIENT_RELEASED id=1');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{p:client1.credit}');
""" + apply_txt + """        await page.getByTestId('client-apply-credit').click();
        await expect.poll(() => auditLines()).toContain('""" + rec + """');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{q:client1.credit}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{q:inv1.status}');
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
""", h=held, p=p1, q=p2, sent=s_)
    fx2 = dict(asOf=SA, clients=[C(A, onHold=True), G], invoices=[
        I(4, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(4, 'Design', 1, 120)]),
        I(5, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(5, 'Build', 1, 80)])])
    rel = plus(fx2, clients=[], inv=[])
    rel['clients'][0]['onHold'] = False
    s2 = sent(rel, [4, 5], SA, '2026-04-30')
    t2 = T('sending all drafts waits until the hold is lifted', '@core', fx2, """
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{s:client1.status}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('{s:client2.status}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-send-all').click();
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{s:inv4.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{s:inv5.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);
        await page.getByTestId('client-row-1').getByTestId('client-hold').click();
        await expect.poll(() => auditLines()).toContain('CLIENT_RELEASED id=1');
        await page.getByTestId('invoice-send-all').click();
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{s2:inv4.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{s2:inv5.status}');
""", s2=s2)
    note = None
    if auto:
        note = ("UPDATED for cp160 (mutates: [154]): a payment from a client on hold now pays its overdue invoices "
                "first, so the 100.00 clears the overdue 80.00 and only 20.00 waits as credit (it was all credit). "
                "Carries both tests.")
    pays = ("A payment recorded for a client on hold pays the client's overdue invoices first, oldest due date "
            "first (lower id on the same date), whatever invoice is open or referenced; the rest is held as "
            "credit (CREDIT_HELD payment=<id> amount=<amount>)." if auto else
            "A payment recorded for a client on hold pays no invoice, whatever invoice is open or referenced: it "
            "is all held as credit (CREDIT_HELD payment=<id> amount=<amount>, no PAYMENT_RECORDED).")
    return Spec('cp154_client_hold', 'client hold', f"""
        A client can be put on hold (clients[].onHold) with the Hold button on their row, which also lifts
        it; the row shows the client's status ("Active" or "On hold"), and holding or releasing writes
        CLIENT_HELD id=<id> or CLIENT_RELEASED id=<id>. While a client is on hold their invoices cannot be
        sent (send all drafts sends none) and Apply credit is refused. {pays} Lifting the hold applies
        nothing by itself.""", [t1, t2], n, copy_note=note)


cp(154, 'client_hold', """
    Sometimes I have to stop dealing with a client until things are sorted out. Give each client row a Hold
    button that puts the client on hold or lifts it, show the client's status (Active or On hold), and
    write CLIENT_HELD id=<client id> or CLIENT_RELEASED id=<client id>. While a client is on hold, refuse
    to send their invoices (Send all drafts sends none), refuse Apply credit, and don't let their payments
    pay anything: whatever invoice is open or referenced, the whole payment is held as credit, written as
    CREDIT_HELD payment=<payment id> amount=<amount>. Lifting the hold doesn't apply anything by itself.
""", s154)

# =============================================================================== cp155 calendar proration


def s155(n):
    revised = n >= 176
    st = {'taxRate': 10, 'approvalLimit': 1500}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Support plan', 1, 450, periodStart='2026-01-20', periodEnd='2026-02-10'), L(2, 'Setup', 1, 120)],
          discountPct=10)])
    a = plus(fx1, lines=[(1, L(3, 'Hosting', 2, 600, periodStart='2026-02-15', periodEnd='2026-03-14'))])
    b = plus(a, lines=[(1, L(4, 'Licences', 1, 90, periodStart='2026-03-01', periodEnd='2026-03-31'))])
    v = V(fx1, n)
    if revised:
        c1 = ("// 450.00 a month is 450 x 12 / 365 = 14.7945 a day; 2026-01-20 to 2026-02-10 is 22 days:\n"
              "        // 325.4795, rounded once to 325.48 (whole calendar months would give 334.91)")
        c3 = ("// 1,200.00 a month for 2026-02-15 to 2026-03-14, 28 days at 1,200 x 12 / 365 a day = 1,104.6575\n"
              "        // -> 1,104.66")
        c4 = "// all of March, 31 days: 90 x 12 / 365 x 31 = 91.73, not 90.00"
    else:
        c1 = ("// 450.00 a month for 2026-01-20 to 2026-02-10: 450 x 12/31 = 174.1935 in January and 450 x 10/28 =\n"
              "        // 160.7143 in February, 334.9078 together, rounded once: 334.91 (each month rounded on its own\n"
              "        // would make 334.90; 22 days of a 30-day month 330.00)")
        c3 = ("// 1,200.00 a month for 2026-02-15 to 2026-03-14: 1,200 x 14/28 + 1,200 x 14/31 = 600.00 + 541.9355\n"
              "        // = 1,141.94")
        c4 = "// all of March is the whole month: 90.00"
    t1 = T('prorates a service period by calendar days', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-period')).toHaveText('2026-01-20 to 2026-02-10');
        {c1}
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{{s:inv1.line1.amount}}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{{s:inv1.subtotal}}');
        // the 10% discount ({v['inv1.discount']}) is shared over the lines in proportion
        await expect(page.getByTestId('invoice-discount')).toHaveText('{{s:inv1.discount}}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('{{s:inv1.line1.share}}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv1.tax}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv1.grand}}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{{s:inv1.approval}}');
""" + add_line('Hosting', 2, 600, start='2026-02-15', end='2026-03-14') + f"""        {c3}
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{{a:inv1.line3.amount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{a:inv1.grand}}');
        // now over the 1,500.00 approval limit
        await expect(page.getByTestId('invoice-approval')).toHaveText('{{a:inv1.approval}}');
""" + add_line('Licences', 1, 90, start='2026-03-01', end='2026-03-31') + f"""        {c4}
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{{b:inv1.line4.amount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{b:inv1.grand}}');
        // a period that ends before it starts is refused
""" + add_line('Licences', 1, 90, start='2026-03-31', end='2026-03-01') + """        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(4);
""", a=a, b=b)
    fx2 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[KK], invoices=[
        I(2, 3, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(5, 'Support plan', 1, 50000, periodStart='2026-02-20', periodEnd='2026-03-05', discountPct=5)])])
    yen = ("// 50,000 yen a month: 50,000 x 9/28 + 50,000 x 5/31 = 16,071.43 + 8,064.52 = 24,135.94 -> 24,136,\n"
           "        // less its own 5% (1,206)") if not revised else (
           "// 50,000 yen a month is 50,000 x 12 / 365 a day; 14 days: 23,013.70 -> 23,014, less its own 5% (1,150)")
    t2 = T('prorates in whole yen', '@core', fx2, f"""
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        {yen}
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{{s:inv2.line5.amount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv2.grand}}');
""")
    note = None
    if revised:
        note = ("UPDATED for cp176 (mutates: [155, 157, 165, 175]): a service period is now charged per day at the "
                "monthly amount x 12 / 365, so January 20 to February 10 costs 325.48 instead of 334.91, and a "
                "whole March 91.73 instead of 90.00. Carries both tests.")
        rule = ("is charged by the day: the day rate is the monthly amount x 12 / 365, times the days in the period "
                "(both ends included), rounded half up to the cent (whole yen) once")
    else:
        rule = ("is prorated by calendar month: for each month the period touches, the monthly amount x the "
                "period's days in that month / the days in that month; the parts are added exactly and rounded "
                "half up to the cent (whole yen) once, so a whole month costs the monthly amount")
    return Spec('cp155_calendar_proration', 'service periods', f"""
        A line can have a service period (lineItems[].periodStart and periodEnd, from the line form's period
        boxes; shown on the line as "<start> to <end>"). Its quantity x unit price is then the price for a
        whole month, and the line's amount {rule}. The line's own discount, the invoice discount and its
        split, tax and totals then work on that amount as usual. A period ending before it starts is
        refused.""", [t1, t2], n, copy_note=note)


cp(155, 'calendar_proration', """
    I bill support plans by the month, but they rarely start on the first. Let a line have a service period
    (a start and an end date on the line form, shown on the line as "<start> to <end>"). For such a line
    the quantity x unit price is the price of a whole month, and the line is charged for its period by
    calendar month: for each month the period touches, the monthly price x the days of the period in that
    month / the days in that month (both ends of the period count). Add the parts up exactly and round
    half up to the cent (whole yen for yen clients) only once at the end. So 450.00 a month from
    2026-01-20 to 2026-02-10 is 450 x 12/31 + 450 x 10/28 = 334.91, and a whole month costs exactly the
    monthly price. The line's own discount, the invoice discount, tax and totals then work on that amount
    as usual. Refuse a period that ends before it starts.
""", s155, algorithm='calendar-proration')

# =============================================================================== cp156 approvals for the exact amount, and lapsing


def s156(n):
    st = {'taxRate': 10, 'approvalLimit': 1000}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1200)], approvedTotal=1320, approvedOn='2026-02-07'),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 1200)], approvedTotal=1320, approvedOn='2026-02-08'),
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 1200)], approvedTotal=1320, approvedOn='2026-03-02')])
    a = plus(fx1, inv=[(3, dict(discountPct=2))])
    b = plus(a, inv=[(3, dict(approvedTotal=1293.6, approvedOn=SA))])
    c = sent(b, [3], SA, '2026-04-30')
    lower = """        // a 2% discount lowers the total to 1,293.60, which is not the 1,320.00 approved
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        await page.getByTestId('discount-form-pct').fill('2');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv3.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv3.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=3 total={b:inv3.grand|plain}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv3.status}');
"""
    if n >= 224:
        c = sent(a, [3], SA, '2026-04-30')
        lower = """        // a 2% discount lowers the total to 1,293.60, within the 1,320.00 approved: still approved
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        await page.getByTestId('discount-form-pct').fill('2');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv3.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv3.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv3.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([]);
"""
    t1 = T('an approval is for the exact total and lapses after 30 days', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // approved on 2026-02-07: 31 days ago, so it has lapsed
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        // approved on 2026-02-08: 30 days ago, still good
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
""" + lower, a=a, b=b, c=c)
    rule = ("any change to the grand total afterwards, up or down, means the invoice needs approval again" if n < 224
            else "a lower grand total stays approved, a higher one needs approval again")
    note = None
    if n >= 224:
        note = ("UPDATED for cp224 (mutates: [151, 156]): an approval covers any total up to the one approved again, so "
                "the 2% discount (1,320.00 down to 1,293.60) leaves invoice 3 approved and it is sent without a fresh "
                "approval; lapsing after 30 days is unchanged. Carries the test.")
    return Spec('cp156_approval_changes', 'approvals for the exact total', f"""
        An approval is for the grand total approved (invoices[].approvedTotal) and the day it was given
        (invoices[].approvedOn, recorded by the Approve button): {rule}, and an approval lapses once more
        than 30 days have passed since it was given (approved on 2026-02-08, it is still good on 2026-03-10 but
        not on 2026-03-11).""" if n >= 224 else """
        An approval is for the exact grand total approved (invoices[].approvedTotal) and the day it was given
        (invoices[].approvedOn, recorded by the Approve button): any change to the grand total afterwards, up
        or down, means the invoice needs approval again, and an approval lapses once more than 30 days have
        passed since it was given (approved on 2026-02-08, it is still good on 2026-03-10 but not on
        2026-03-11).""", [t1], n, copy_note=note)


cp(156, 'approval_changes', """
    An approved invoice shouldn't change behind the approver's back. Make an approval good only for the
    exact grand total that was approved: any change to the total afterwards, up or down, needs approving
    again. And approvals don't last forever: record the day it was approved, and once more than 30 days
    have passed since then (approved on 2026-02-08, it is still good on 2026-03-10 but not the day after)
    the invoice needs approval again.
""", s156, type_='mutative', mutates=[151], copies=['cp151_approval_limit'])

# =============================================================================== cp157 recurring invoices


def s157(n):
    revised = n >= 176
    st = {'taxRate': 10, 'approvalLimit': 1000}
    fx1 = dict(asOf='2026-02-03', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-20', '2026-02-28',
          [L(1, 'Support plan', 1, 450, periodStart='2026-01-20', periodEnd='2026-01-31'),
           L(2, 'Licences', 10, 60, periodStart='2026-01-20', periodEnd='2026-01-31'),
           L(3, 'Setup', 1, 120)], discountPct=5, recurring=True)])
    gen = plus(fx1, invoices=[I(2, 1, 'DRAFT', '2026-02-03', '2026-03-31',
                                [L(4, 'Support plan', 1, 450, periodStart='2026-02-01', periodEnd='2026-02-28'),
                                 L(5, 'Licences', 10, 60, periodStart='2026-02-01', periodEnd='2026-02-28')],
                                discountPct=5, recurring=True, recurringFrom=1)])
    v = V(fx1, n)
    jan = (f"// January 20-31 of 450.00 and 600.00 a month: {v['inv1.line1.amount']} and {v['inv1.line2.amount']}, "
           "plus the one-off setup")
    t1 = T('generates the next period of a recurring invoice', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        {jan}
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv1.grand}}');
        await page.getByTestId('invoice-generate').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from={{s:inv1.number}} to={{g:inv2.number}}');
        // the new draft, dated today, bills all of February for the recurring lines only, with the 5% discount
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{g:inv2.status}}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-issue')).toHaveText('2026-02-03');
        await expect(page.getByTestId('line-row-4').getByTestId('line-period')).toHaveText('2026-02-01 to 2026-02-28');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{{g:inv2.line4.amount}}');
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{{g:inv2.line5.amount}}');
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(2);
        await expect(page.getByTestId('invoice-discount')).toHaveText('{{g:inv2.discount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{g:inv2.grand}}');
        // a whole month takes it over the 1,000.00 approval limit
        await expect(page.getByTestId('invoice-approval')).toHaveText('{{g:inv2.approval}}');
        // each invoice generates its next period once, and only once it has been sent
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        await expect(page.getByTestId(/^invoice-row-\\d+$/)).toHaveCount(2);
""", g=gen)
    fx2 = dict(asOf='2026-02-03', settings={'taxRate': 10}, clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-01-02', '2026-01-31', [L(7, 'Hosting', 1, 200, periodStart='2026-01-01', periodEnd='2026-01-31')]),
        I(6, 1, 'SENT', '2026-01-02', '2026-01-31', [L(8, 'Design', 1, 500)], recurring=True)])
    on = plus(fx2, inv=[(5, dict(recurring=True))])
    g2 = plus(on, invoices=[I(7, 1, 'DRAFT', '2026-02-03', '2026-03-31',
                              [L(9, 'Hosting', 1, 200, periodStart='2026-02-01', periodEnd='2026-02-28')],
                              recurring=True, recurringFrom=5)])
    t2 = T('marks an invoice as recurring', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // not recurring yet: nothing to generate
        await page.getByTestId('invoice-row-5').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        await page.getByTestId('invoice-recurring').check();
        await page.getByTestId('invoice-generate').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from={g:inv5.number} to={g:inv7.number}');
        await page.getByTestId('invoice-row-7').click();
        await expect(page.getByTestId('line-row-9').getByTestId('line-period')).toHaveText('2026-02-01 to 2026-02-28');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{g:inv7.grand}'); // FEBC
        // a recurring invoice with no service period has nothing to repeat
        await page.getByTestId('invoice-row-6').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
""".replace('FEBC', '28 days at 200 x 12 / 365 = 184.11, + 10%' if revised else '200.00 + 10%'), g=g2)
    note = None
    if revised:
        note = ("UPDATED for cp176 (mutates: [155, 157, 165, 175]): service periods are now charged by the day at 12/365 "
                "of the monthly price, so January 20-31 and the 28 days of February cost less than before. Carries "
                "both tests.")
    return Spec('cp157_recurring_invoices', 'recurring invoices', """
        An invoice can be recurring (invoices[].recurring, the panel's Recurring box). Generate on a sent
        recurring invoice creates the next period's draft for the same client, dated today with the usual
        due date: a copy of each line that has a service period, with the period moved to the whole
        calendar month after the latest period end on the invoice (lines without a period are one-offs and
        are not copied), and the invoice's percentage discount and surcharge; the new draft is recurring
        and records where it came from (invoices[].recurringFrom). New ids continue from the highest.
        Generating writes INVOICE_GENERATED from=<number> to=<new number>. It is refused for a draft, an
        invoice that is not recurring or has no service period, or one that has already generated its next
        period. The new draft is priced, taxed and checked for approval like any other.""", [t1, t2], n,
        copy_note=note)


cp(157, 'recurring_invoices', """
    My support plans repeat every month. Let me mark an invoice as recurring (a Recurring box on the
    invoice) and give a sent recurring invoice a Generate button that creates the next period's draft
    for the same client, dated today with the usual due date. It copies every line that has a service
    period, with the period moved to the whole calendar month after the latest period end on the invoice;
    lines without a period are one-off charges and aren't copied. Keep the invoice's percentage discount
    and surcharge, make the new draft recurring too, and remember which invoice it came from. Write
    INVOICE_GENERATED from=<invoice number> to=<new invoice number>. Refuse to generate from a draft, from
    an invoice that isn't recurring or has no line with a period, or from one that has already generated
    its next period. The new draft is priced, taxed and needs approval like any other.
""", s157)

# =============================================================================== cp158 disputes


def s158(n):
    st = {'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'DRAFT', '2026-04-01', '2026-05-31', [L(2, 'Design', 1, 100)])])
    dis = plus(fx1, inv=[(1, dict(disputedOn='2026-04-30'))])
    if n >= 172:
        # 200.00, not the 100.00 the refusal used: from cp136 a part payment must reach a tenth of the
        # 1,017.82 due, and 100.00 is refused for that whatever the dispute rules say
        pd = plus(dis, inv=[(1, dict(disputeResolvedOn='2026-04-30'))], payments=[P(1, 1, 200, '2026-04-30', [(1, 200)])])
        payblock = ("        // a payment made with it open is accepted and settles the dispute\n" + pay('200', '2026-04-30') +
                    "        await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');\n"
                    "        await expect(page.getByTestId('invoice-paid')).toHaveText('{pd:inv1.paid}');\n"
                    "        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{pd:inv1.status}');\n")
    else:
        pd = dis
        payblock = ("        // it takes no payment while in dispute\n" + pay('100', '2026-04-30') +
                    "        await expect(page.getByTestId('payment-form-error')).toBeVisible();\n"
                    "        await expect(page.getByTestId('invoice-paid')).toHaveText('{d:inv1.paid}');\n")
    t1 = T('puts an overdue invoice in dispute', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        await page.getByTestId('invoice-dispute').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{d:inv1.status}');
        // 1,000.00 and the interest so far
        await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount={d:inv1.due|plain}');
        // still owed, but no longer overdue
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{d:client1.balance}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{d:client1.overdue}');
PAYBLOCK        // a draft can't be disputed
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-dispute').click();
        await expect(page.getByTestId('invoice-dispute-error')).toBeVisible();
""".replace('PAYBLOCK', payblock), d=dis, pd=pd)
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)], disputedOn='2026-04-01'),
        I(4, 1, 'SENT', '2026-04-01', '2026-04-20', [L(4, 'Design', 1, 100)]),
        I(5, 1, 'SENT', '2026-04-01', '2026-05-31', [L(5, 'Support', 1, 80)])])
    p = plus(fx2, payments=[P(1, 1, 150, '2026-04-30', [(4, num(V(fx2, n)['inv4.due'])), (5, 150 - num(V(fx2, n)['inv4.due']))])])
    r = plus(p, inv=[(3, dict(disputeResolvedOn='2026-04-30'))])
    res_c = ("// resolving it makes it overdue again and charges the interest held back: 53 days from 2026-03-08"
             if n >= 164 else "// resolving it makes it overdue again, with interest from today")
    t2 = T('an invoice in dispute earns no interest and payments pass it by', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // interest ran from the end of grace (2026-03-08) until the dispute on 2026-04-01: 24 days, then stopped
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        await page.getByTestId('client-row-1').click();
        // paid with no invoice open: the overdue invoice 4 first (100.00 and its interest), the rest on
        // invoice 5; the disputed invoice 3 is LASTWORD
""" + pay('150', '2026-04-30') + """        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{p:inv4.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{p:inv5.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{p:inv3.status}');
        RESC
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-resolve').click();
        await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=3');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{r:inv3.interest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{r:client1.overdue}');
""".replace('RESC', res_c).replace('LASTWORD', 'left until last, and nothing is left for it' if n >= 172 else 'passed over though it is the oldest'), p=p, r=r)
    note = None
    if n >= 172:
        note = ("UPDATED for cp172 (mutates: [158]): a payment made with a disputed invoice open is now accepted and "
                "resolves the dispute, so a 200.00 payment is paid on invoice 1 (a payment was refused); automatic payments reach "
                "disputed invoices last. Carries both tests.")
    elif n >= 164:
        note = ("UPDATED for cp164 (mutates: [158, 163]): resolving a dispute now charges the interest it held back, "
                "so invoice 3 owes 53 days' interest once resolved instead of the 24 days before the dispute. "
                "Carries both tests.")
    res = ("Resolve ends the dispute (invoices[].disputeResolvedOn, today; DISPUTE_RESOLVED id=<id>): the invoice "
           "then owes the interest held back, as if it had never been disputed, and its status is worked out as "
           "usual." if n >= 164 else
           "Resolve ends the dispute (invoices[].disputeResolvedOn, today; DISPUTE_RESOLVED id=<id>): interest "
           "starts again from that day on what is still owed, and its status is worked out as usual.")
    pays = ("a payment made with it open is accepted and resolves the dispute that day, and automatic payments and "
            "Apply credit reach it only after every undisputed invoice." if n >= 172 else
            "it takes no payment (one made while it is open is refused) and automatic payments and Apply credit pass "
            "over it.")
    return Spec('cp158_disputes', 'disputes', f"""
        A sent invoice with something due can be put in dispute with the Dispute button
        (invoices[].disputedOn, today), writing INVOICE_DISPUTED id=<id> amount=<amount due>; a draft, or an
        invoice with nothing due, can't. While in dispute its status is "Disputed", it earns no late interest
        (interest up to the dispute date stays), it is left out of the client's overdue amount but still in
        their balance, {pays} {res}""", [t1, t2], n, copy_note=note)


cp(158, 'disputes', """
    Clients sometimes dispute an invoice, and while they do I can't chase it. Give a sent invoice that still
    has something due a Dispute button (refuse it on drafts and on invoices with nothing due) that writes
    INVOICE_DISPUTED id=<invoice id> amount=<amount due>. While it is disputed show its status as Disputed,
    stop its late interest (keep what had built up before), leave it out of the client's overdue amount
    (it still counts in their balance), refuse payments made with it open, and have automatic payments and
    Apply credit pass over it. A Resolve button ends the dispute and writes DISPUTE_RESOLVED id=<invoice
    id>: from that day interest runs again on what is still owed and its status goes back to normal.
""", s158)

# =============================================================================== cp159 remittance matching


def s159(n):
    revised = n >= 184
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Refit', 1, 400)], poNumber='Marina Refit'),
        I(2, 1, 'SENT', '2026-03-01', '2026-05-15', [L(2, 'Lighting', 1, 900)], poNumber='Paint Lights'),
        I(3, 1, 'SENT', '2026-03-01', '2026-03-31', [L(3, 'Hull', 1, 60)], poNumber='Hull Paint'),
        I(4, 1, 'DRAFT', '2026-04-01', '2026-05-31', [L(4, 'Deck', 1, 250)])])
    po = plus(fx1, inv=[(4, dict(poNumber='Deck Works'))])
    if n >= 188:
        # no match; the overdue invoice 3 (60.00), then the smallest amount due first: invoice 1 (400.00),
        # then invoice 2 (40.00)
        a = plus(po, payments=[P(1, 1, 500, '2026-04-20', [(3, 60), (1, 400), (2, 40)], remittance='marina lights')])
        first = """        // "marina lights" is most like "Marina Refit", but 0.888 is under 0.90: nothing matches, and the
        // payment goes in the usual order, the overdue invoice 3, then the smallest amounts due first
""" + pay('500', '2026-04-20', remittance='marina lights') + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',
          'PAYMENT_RECORDED id=1 invoice=1 amount=400.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=40.00',
        ]);
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{a:pay1.match}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
"""
        due_c = "// 900.00 - 40.00 - 100.00"
    elif revised:
        # 0.888 is under 0.90: no match; the overdue invoice 3 (60.00), then the largest, invoice 2 (440.00)
        a = plus(po, payments=[P(1, 1, 500, '2026-04-20', [(3, 60), (2, 440)], remittance='marina lights')])
        first = """        // "marina lights" is most like "Marina Refit", but 0.888 is under 0.90: nothing matches, and the
        // payment goes in the usual order, the overdue invoice 3 then the largest, invoice 2
""" + pay('500', '2026-04-20', remittance='marina lights') + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=440.00',
        ]);
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{a:pay1.match}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{a:inv1.status}');
"""
        due_c = "// 900.00 - 440.00 - 100.00"
    else:
        # 500.00 with "marina lights": invoice 1 (400.00), then the rest automatically: overdue invoice 3
        # (60.00), then the largest, invoice 2 (40.00)
        a = plus(po, payments=[P(1, 1, 500, '2026-04-20', [(1, 400), (3, 60), (2, 40)], remittance='marina lights')])
        first = """        // "marina lights" is most like "Marina Refit" (0.888, the shared "mari" counts for more) though
        // plain Jaro would put "Paint Lights" first (0.868 against 0.814)
""" + pay('500', '2026-04-20', remittance='marina lights') + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=400.00',
          'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=40.00',
        ]);
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{a:pay1.match}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match-score')).toHaveText('{a:pay1.matchScore}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
"""
        due_c = "// 900.00 - 40.00 - 100.00"
    b = plus(a, payments=[P(2, 1, 100, '2026-04-20', [(2, 100)], remittance='thanks')])
    t1 = T('pays the invoice whose purchase order the remittance matches best', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // a purchase order number can be added to an invoice
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-po-input').fill('Deck Works');
        await page.getByTestId('invoice-po-submit').click();
        await expect(page.getByTestId('invoice-po')).toHaveText('Deck Works');
        await page.getByTestId('client-row-1').click();
""" + first + """        // nothing close enough: paid in the usual order, matching nothing
        await page.getByTestId('client-row-1').click();
""" + pay('100', '2026-04-20', remittance='thanks') + """        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('{b:pay2.match}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}'); DUEC
""".replace('DUEC', due_c), a=a, b=b)
    fx2 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-03-01', '2026-05-31', [L(5, 'Paint', 1, 300)], poNumber='Hull Paint'),
        I(6, 1, 'SENT', '2026-03-05', '2026-05-15', [L(6, 'Paint', 1, 200)], poNumber='Hull Paint'),
        I(7, 1, 'SENT', '2026-03-05', '2026-05-15', [L(7, 'Paint', 1, 500)], poNumber='Hull paint 2', disputedOn='2026-04-10')])
    if revised:
        c = plus(fx2, payments=[P(1, 1, 200, '2026-04-20', [(5, 200)], remittance='HULL PAINT')])
        tie, paid, other = "invoice 5 owes more (300.00 against 200.00), so it is paid first", 5, 6
    else:
        c = plus(fx2, payments=[P(1, 1, 200, '2026-04-20', [(6, 200)], remittance='HULL PAINT')])
        tie, paid, other = "invoice 6 is due first", 6, 5
    t2 = T('two equally good matches go to the earlier due date', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        // both purchase orders match exactly (case does not count): {tie}. The disputed
        // invoice 7 is not open to payments, however close its purchase order
""" + pay('200', '2026-04-20', remittance='HULL PAINT') + f"""        await page.getByTestId('invoice-row-{paid}').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{{c:pay1.match}}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match-score')).toHaveText('{{c:pay1.matchScore}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{c:inv{paid}.status}}');
        await expect(page.getByTestId('invoice-row-{other}').getByTestId('invoice-status')).toHaveText('{{c:inv{other}.status}}');
""", c=c)
    note = None
    rule = ("at least 0.90; equal similarities go to the larger amount due, then the earlier due date, then the lower "
            "id" if revised else "at least 0.85; equal similarities go to the earlier due date, then the lower id")
    if n >= 188:
        note = ("UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after overdue invoices a payment now pays the "
                "smallest amount due first, so the unmatched 500.00 pays invoice 1 (400.00) before invoice 2 "
                "(40.00) instead of 440.00 on invoice 2. Carries both tests.")
    elif revised:
        note = ("UPDATED for cp184 (mutates: [159, 181]): a match now needs 0.90 and ties go to the larger amount due, "
                "so \"marina lights\" (0.888) matches nothing and the payment goes in the usual order, and of the two "
                "exact \"Hull Paint\" matches invoice 5 (300.00) is paid instead of invoice 6. Carries both tests.")
    return Spec('cp159_remittance_matching', 'remittance matching', f"""
        An invoice can carry the client's purchase order number (invoices[].poNumber; the panel's PO box,
        shown on the panel). The payment form takes remittance text (payments[].remittance). A payment with
        remittance text and no open invoice or reference first pays the client's open invoice whose purchase
        order number is most like the text, by Jaro-Winkler similarity on the lower-cased strings (matching
        window half the longer length less one, transpositions halved, a common prefix of up to four
        characters boosted by 0.1), when that similarity is {rule}. The rest is applied automatically as
        usual. Disputed invoices and invoices with nothing due are not candidates. The payment row shows the
        matched invoice number (empty when none) and the similarity to three decimals, rounded half up.""",
        [t1, t2], n, copy_note=note)


cp(159, 'remittance_matching', """
    Clients pay with their own wording on the remittance, usually something like their purchase order.
    Let me keep the client's purchase order number on an invoice (a PO box on the invoice) and type the
    remittance text on the payment form. When a payment has remittance text and no invoice is open and no
    reference is given, pay first the client's open invoice whose purchase order is most like the text,
    using Jaro-Winkler similarity on the lower-cased strings: count characters that match within a window
    of half the longer string's length minus one, halve the transpositions, jaro = (m/len1 + m/len2 + (m -
    t)/m) / 3, then add the common prefix (up to 4 characters) x 0.1 x (1 - jaro). Only a similarity of at
    least 0.85 counts; if two invoices are equally similar take the earlier due date, then the lower id.
    Whatever is left of the payment is applied automatically as usual. Disputed invoices and invoices with
    nothing due aren't candidates. Show on the payment row which invoice number it matched (blank if none)
    and the similarity to three decimals, rounded half up.
""", s159, algorithm='remittance-matching')

# =============================================================================== cp160 holds over the limit


def s160(n):
    fx1 = dict(asOf=SA, clients=[C(A, creditLimit=500)], invoices=[
        # paid on 2026-03-10, 14 days after issue: LOW risk from cp161, so invoice 4 can still be sent
        I(1, 1, 'SENT', '2026-02-24', '2026-02-25', [L(1, 'Design', 1, 300)]),
        I(2, 1, 'SENT', '2026-01-20', '2026-02-26', [L(2, 'Build', 1, 250)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Support', 1, 100)]),
        I(4, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(4, 'Hosting', 1, 10)])])
    a = plus(fx1, payments=[P(1, 1, 400, SA, [(1, 300), (2, 100)])])
    b = sent(a, [4], SA, '2026-04-30')
    t1 = T('a client over its credit limit is on hold until it is back within it', '@core', fx1, """
        // 650.00 owed against a 500.00 limit: on hold by itself
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{s:client1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{s:client1.available}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // the payment goes to the overdue invoices, oldest due date first, not the open one
""" + pay('400', SA) + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=300.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=100.00',
        ]);
        await expect(page.getByTestId('invoice-paid')).toHaveText('{a:inv3.paid}');
        // 250.00 owed now: back within the limit, so no longer on hold
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{a:client1.status}');
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
""", a=a, b=b)
    return Spec('cp160_over_limit_hold', 'on hold over the limit', """
        A client whose balance is over their credit limit is on hold automatically (shown "On hold", with
        all that a hold means) until their balance is back within the limit; the Hold button can't lift it
        while they are over. A payment recorded for a client on hold now pays their overdue invoices first,
        oldest due date first (lower id on the same date), whatever invoice is open; only what is left is
        held as credit.""", [t1], n)


cp(160, 'over_limit_hold', """
    A client who owes more than their credit limit should be on hold without me having to remember. Put a
    client on hold automatically while their balance is over their credit limit (the Hold button can't
    lift that), and take them off once they are back within it. And a payment from a client on hold
    shouldn't just sit there: let it pay their overdue invoices first, oldest due date first (lower id on
    the same date), whatever invoice is open, and hold only the rest as credit.
""", s160, type_='mutative', mutates=[154], copies=['cp154_client_hold'])

# =============================================================================== cp161 payment risk score


def s161(n):
    revised = n >= 192
    fx1 = dict(asOf=SA, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2025-11-10', '2026-01-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2025-11-01', '2026-01-31', [L(2, 'Design', 1, 100)]),
        I(3, 1, 'SENT', '2025-12-01', '2026-01-31', [L(3, 'Design', 1, 100)]),
        I(4, 1, 'SENT', '2026-01-19', '2026-02-28', [L(4, 'Build', 1, 200)]),
        I(5, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(5, 'Hosting', 1, 50)]),
        I(6, 2, 'SENT', '2026-03-01', '2026-04-30', [L(6, 'Design', 1, 100)])],
        payments=[P(1, 1, 100, '2025-11-30', [(1, 100)]), P(2, 1, 100, '2025-12-11', [(2, 100)]),
                  P(3, 1, 100, '2025-12-31', [(3, 100)])])
    a = plus(fx1, payments=[P(4, 1, 200, SA, [(4, 200)])])
    if revised:
        c1 = ("// days late, oldest payment first: none of the three was late (0, 0, 0): a score of 0.0")
        c2 = ("// invoice 4 was due 2026-02-28 and is paid 10 days late: 0.5 x 10 + 0.5 x 0 = 5.0, MEDIUM from 5")
        c3 = "// only HIGH clients need approval whatever the size: this small invoice needs none"
    else:
        c1 = ("// oldest payment first: invoice 1 took 20 days, invoice 2 40 and invoice 3 30:\n"
              "        // 20, then 0.3 x 40 + 0.7 x 20 = 26, then 0.3 x 30 + 0.7 x 26 = 27.2 (in invoice order it would be\n"
              "        // 40, 34, 32.8; the plain average 30.0)")
        c2 = "// invoice 4 issued 2026-01-19 is paid today, after 50 days: 0.3 x 50 + 0.7 x 27.2 = 34.04"
        c3 = "// every invoice of a high-risk client needs approval, however small"
    t1 = T('scores how quickly a client pays', '@core', fx1, f"""
        {c1}
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{{s:client1.riskScore}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{{s:client1.riskBand}}');
        // a client who has paid nothing yet has no score
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('{{s:client2.riskScore}}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{{s:client2.riskBand}}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{{s:inv5.approval}}');
        await page.getByTestId('invoice-row-4').click();
""" + pay('200', SA) + f"""        {c2}
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{{a:client1.riskScore}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{{a:client1.riskBand}}');
        {c3}
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{{a:inv5.approval}}');
        await page.getByTestId('invoice-send').click();
""" + ("""        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv5.status}');
""" if V(a, n)['client1.riskBand'] == 'HIGH' else """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv5.status}');
"""), a=a, b=sent(a, [5], SA, '2026-04-30'))
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-01-01', '2026-01-31', [L(2, 'Design', 1, 100)]),
        I(3, 1, 'SENT', '2026-01-01', '2026-01-31', [L(3, 'Design', 1, 100)]),
        I(4, 1, 'SENT', '2026-01-05', '2026-01-31', [L(4, 'Design', 1, 100, creditOfLine=3)], creditOf=3)],
        payments=[P(1, 1, 100, '2026-01-11', [(1, 100)]), P(2, 1, 60, '2026-03-01', [(2, 60)])])
    t2c = ("invoice 1 was paid before it was due (0 days late)" if revised else "invoice 1 was paid in 10 days")
    t2c += "; 2 is only part paid and 3 was cleared by a credit note"
    t2 = T('only invoices paid in full count', '@core', fx2, """
        // T2C
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{s:client1.riskScore}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
""".replace('T2C', t2c))
    note = None
    if revised:
        note = ("UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the score now averages the days late (after the due "
                "date, 0 when on time) with weight 0.5, banded LOW under 5 days, MEDIUM under 15, so the client "
                "first scores 0.0 and then 5.0 (MEDIUM) instead of 27.2 and 34.0 (HIGH). Carries both tests.")
        rule = ("the days late of each invoice paid in full (the paid date less the due date, 0 when paid by then), "
                "averaged oldest payment first with weight 0.5 (first value, then 0.5 x next + 0.5 x average), to "
                "one decimal half up; LOW under 5, MEDIUM under 15, HIGH from 15")
    else:
        rule = ("the days each invoice paid in full took to pay (the paid date less the issue date), averaged "
                "oldest payment first with weight 0.3 (first value, then 0.3 x next + 0.7 x average), to one "
                "decimal half up; LOW under 15, MEDIUM under 30, HIGH from 30")
    return Spec('cp161_payment_risk_score', 'payment risk score', f"""
        Each client row shows a payment risk score and band: {rule}. Part-paid invoices, credit notes and
        invoices cleared without payment don't count; a client with no invoice paid in full shows "-" and
        LOW. Every invoice of a HIGH client needs approval before it can be sent, whatever its total.""",
        [t1, t2], n, copy_note=note)


cp(161, 'payment_risk_score', """
    I want to see at a glance who pays slowly. Give every client a payment risk score in the client list:
    take each of their invoices that has been paid in full, the number of days from its issue date to the
    date it was paid, and average them oldest payment first with an exponential weight of 0.3 (start
    with the first; then each next one counts 0.3 and the average so far 0.7), shown to one decimal
    rounded half up. Show the band next to it: LOW under 15 days, MEDIUM under 30, HIGH from 30. A client
    with nothing paid in full shows "-" and LOW. Part-paid invoices, credit notes and invoices cleared
    without a payment don't count. Every invoice of a HIGH client needs approval before it can be sent,
    whatever its size.
""", s161, algorithm='payment-risk-score')

# =============================================================================== cp162 deposits from high-risk clients


def s162(n):
    revised = n >= 192
    # two invoices paid in 40 and 50 days: 40, then 0.3 x 50 + 0.7 x 40 = 43.0, HIGH
    hist = [I(1, 1, 'SENT', '2025-12-01', '2025-12-31', [L(1, 'Design', 1, 100)]),
            I(2, 1, 'SENT', '2025-12-15', '2026-01-15', [L(2, 'Design', 1, 100)])]
    if revised:
        # cp192 scores days late with weight 0.5: 10 and 19 days late -> 10, then 0.5 x 19 + 0.5 x 10 = 14.5,
        # MEDIUM; so the history is made later to stay HIGH: 20 and 29 days late -> 24.5
        hist = [I(1, 1, 'SENT', '2025-11-11', '2025-11-21', [L(1, 'Design', 1, 100)]),
                I(2, 1, 'SENT', '2025-11-17', '2026-01-05', [L(2, 'Design', 1, 100)])]
    fx1 = dict(asOf=SA, clients=[A], invoices=hist + [
        I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Build', 1, 1000)])],
        payments=[P(1, 1, 100, '2026-01-10', [(1, 100)]), P(2, 1, 100, '2026-02-03', [(2, 100)]),
                  P(3, 1, 200, '2026-03-05', [], reference=rf_reference(invoice_number_luhn(3)[4:]))])
    ap = plus(fx1, inv=[(3, dict(approvedTotal=1000, **({'approvedOn': SA} if n >= 156 else {}),
                                 **({'approvals': 2} if n >= 200 else {})))])
    dep = plus(ap, payments=[P(4, 1, 100, SA, [], reference=invoice_number_luhn(3))])
    s_ = sent(dep, [3], SA, '2026-04-30')
    s_ = plus(s_, alloc=[(3, 3, 200, SA), (4, 3, 100, SA)])
    second = ("        // a high-risk client's invoice takes two approvals\n"
              "        await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 1 more approval');\n"
              "        await page.getByTestId('invoice-approve').click();\n") if n >= 200 else ""
    hist_c = ("// days late 20 and 29: 20, then 0.5 x 29 + 0.5 x 20 = 24.5, HIGH" if revised else
              "// paid in 40 and then 50 days: 40, then 0.3 x 50 + 0.7 x 40 = 43.0, HIGH")
    t1 = T('a high-risk client must pay a deposit before an invoice is sent', '@core', fx1, f"""
        {hist_c}
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{{s:client1.riskBand}}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-approve').click();
{second}        await expect(page.getByTestId('invoice-approval')).toHaveText('{{ap:inv3.approval}}');
        // approved, but the 200.00 deposit held for it is only 20% of the 1,000.00: 300.00 is needed
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{ap:inv3.status}}');
        await page.getByTestId('payment-form-deposit').check();
""" + pay('100', SA, ref=invoice_number_luhn(3)) + """        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{d:client1.credit}');
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        // the deposits held for it are used straight away, oldest first
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv3.status}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED id=3') || l.startsWith('PAYMENT_RECORDED id=4'))).toEqual([
          'PAYMENT_RECORDED id=3 invoice=3 amount=200.00',
          'PAYMENT_RECORDED id=4 invoice=3 amount=100.00',
        ]);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv3.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent:client1.credit}');
""", ap=ap, d=dep, sent=s_)
    st = {'usdPer': RATES, 'fxFeePct': 2}
    fx2 = dict(asOf=SA, settings=st, clients=[C(G, currency='EUR')], invoices=[
        I(5, 2, 'SENT', '2025-10-01', '2025-10-31', [L(5, 'Design', 1, 100)]),
        I(6, 2, 'DRAFT', '2026-03-05', '2026-04-30', [L(6, 'Build', 1, 500)], approvedTotal=500,
          **({'approvedOn': SA} if n >= 156 else {}), **({'approvals': 2} if n >= 200 else {}))],
        payments=[P(5, 2, 100, '2026-01-20' if not revised else '2025-11-30', [(5, 100)]),
                  P(6, 2, 165, '2026-03-05', [], currency='USD', reference=invoice_number_luhn(6))])
    t2 = T('the deposit counts what it is worth after conversion', '@core', fx2, """
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{s:client2.riskBand}');
        // 165.00 US dollars is 150.00 euros, less the 2% conversion fee (3.00): 147.00, under 30% of €500.00
        await expect(page.getByTestId('client-row-2').getByTestId('client-credit')).toHaveText('{s:client2.credit}');
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-6').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv6.status}');
""")
    note = None
    if n >= 200:
        note = ("UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): every invoice of a high-risk client now needs two "
                "approvals, so the draft is approved twice before the deposit rule is tried, and the euro draft "
                "carries both approvals. Carries both tests.")
    elif revised:
        note = ("UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the risk score now averages days late with weight 0.5, "
                "so the high-risk history is now two invoices paid 20 and 29 days late (24.5); the deposit rule is "
                "unchanged. Carries both tests.")
    return Spec('cp162_risk_deposit', 'deposits from high-risk clients', """
        A draft of a HIGH-risk client can only be sent once the deposits held for it (payments recorded as
        deposits with its reference) are worth at least 30% of its grand total, in the client's currency
        after any conversion fee or card surcharge; until then sending is refused, even when it is
        approved. When it is sent its deposits are used on it first, oldest first, as usual.""", [t1, t2], n,
        copy_note=note)


cp(162, 'risk_deposit', """
    For a client in the HIGH risk band I want money up front. Only let me send one of their drafts once the
    deposits held for it (taken with Deposit ticked and its reference) add up to at least 30% of its grand
    total, counting what the deposits are worth in the client's currency after any conversion fee or card
    surcharge. Refuse to send it until then, even if it has been approved. Once it is sent its deposits are
    used on it first, oldest first, as they are today.
""", s162)

# =============================================================================== cp163 disputing lines


def s163(n):
    restored = n >= 164
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 200)], discountPct=5)])
    d1 = plus(fx1, inv=[(1, dict(disputedOn='2026-04-30'))])
    d1['invoices'][0]['lineItems'][1]['disputed'] = True
    v = V(d1, n)
    und = num(v['inv1.due']) - num(v['inv1.disputed'])
    und = round(und, 2)
    p = plus(d1, payments=[P(1, 1, und, '2026-04-30', [(1, und)])])
    t1 = T('disputes only the lines the client queries', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('line-row-2').getByTestId('line-dispute').click();
        // the travel line after its 10.00 share of the discount, with its 10% tax: 190.00 + 19.00
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{d:inv1.disputed}');
        await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount={d:inv1.disputed|plain}');
        // the rest is still overdue
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{d:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{d:client1.overdue}');
        // paying everything that isn't in dispute leaves only the disputed lines
        await page.getByTestId('payment-form-amount').fill('{d:client1.overdue|plain}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{p:client1.overdue}');
""", d=d1, p=p)
    fx2 = dict(asOf='2026-04-30', settings={'lateInterestRate': 12}, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000), L(4, 'Travel', 1, 200, disputed=True)],
          disputedOn='2026-04-01')])
    r = plus(fx2, inv=[(2, dict(disputeResolvedOn='2026-04-30'))])
    if restored:
        rc = ("// resolved: the interest held back on the travel line is owed after all, as if it had never been\n"
              "        // disputed: 53 days on 1,200.00")
    else:
        rc = "// resolved: the whole invoice is owed again; interest on the travel line starts again from today"
    t2 = T('interest stops only on the disputed lines', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // 1,200.00 earned interest from 2026-03-08 to the dispute on 2026-04-01 (24 days); since then only the
        // undisputed 1,000.00 has (29 days)
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{{s:inv2.disputed}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{s:inv2.status}}');
        await page.getByTestId('invoice-resolve').click();
        {rc}
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{{r:inv2.disputed}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{r:inv2.interest}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{r:client1.overdue}}');
""", r=r)
    note = None
    if restored:
        note = ("UPDATED for cp164 (mutates: [158, 163]): resolving a dispute now charges the interest it held back, "
                "so once resolved the invoice owes 53 days' interest on all 1,200.00. Carries both tests.")
    res = ("Resolving the dispute charges the interest that was held back, as if there had been no dispute."
           if restored else "Resolving the dispute makes the whole invoice owed again, earning interest from that day.")
    return Spec('cp163_disputed_lines', 'disputing lines', f"""
        On a sent invoice a line's Dispute action (lineItems[].disputed) puts just those lines in dispute
        (invoices[].disputedOn, today), writing INVOICE_DISPUTED id=<id> amount=<disputed amount>. The panel
        shows the amount in dispute: the disputed lines' amounts after their share of the invoice discount,
        with their tax ($0.00 when nothing is disputed). From the dispute date that amount earns no interest
        and is not overdue (nor in the client's overdue amount), while the rest of the invoice is owed,
        overdue and paid as usual; once only the disputed amount is left the status is Disputed. {res}""",
        [t1, t2], n, copy_note=note)


cp(163, 'disputed_lines', """
    Usually a client only queries one or two lines. Give each line of a sent invoice a Dispute action that
    puts just that line in dispute (write INVOICE_DISPUTED id=<invoice id> amount=<amount in dispute>) and
    show the amount in dispute on the invoice: the disputed lines after their share of the invoice discount,
    plus their tax. From the dispute date that amount earns no late interest and doesn't count as overdue
    (nor in the client's overdue amount); the rest of the invoice stays owed, overdue and payable as usual.
    When only the disputed amount is left, the invoice is Disputed. Resolving the dispute makes the whole
    invoice owed again, with interest from that day.
""", s163)

# =============================================================================== cp164 interest held back by a dispute


def s164(n):
    st = {'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)], disputedOn='2026-04-01')])
    r = plus(fx1, inv=[(1, dict(disputeResolvedOn='2026-04-30'))])
    t1 = T('resolving a dispute charges the interest it held back', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // in dispute since 2026-04-01: interest ran only from 2026-03-08, 24 days
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await page.getByTestId('invoice-resolve').click();
        // resolved: 53 days' interest from 2026-03-08, as if never disputed (24 days would leave 8.03)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{r:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{r:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{r:client1.overdue}');
""", r=r)
    return Spec('cp164_dispute_interest', 'interest after a dispute', """
        A dispute only holds late interest back while it lasts: once it is resolved, the invoice owes the
        interest it would have earned with no dispute at all, including the days in dispute.""", [t1], n)


cp(164, 'dispute_interest', """
    A dispute shouldn't let a client off the interest if it turns out they owed the money all along. Keep
    stopping late interest while an invoice (or a line) is in dispute, but when the dispute is resolved,
    charge the interest it held back: the invoice then owes the interest it would have earned had it
    never been disputed, the days in dispute included.
""", s164, type_='mutative', mutates=[158, 163], copies=['cp158_disputes', 'cp163_disputed_lines'])

# =============================================================================== cp165 recurring until a date


def s165(n):
    revised = n >= 176
    st = {'taxRate': 10}
    fx1 = dict(asOf='2026-03-02', settings=st, clients=[A, C(G, onHold=True)], invoices=[
        I(1, 1, 'SENT', '2026-02-02', '2026-03-31',
          [L(1, 'Support plan', 1, 450, periodStart='2026-02-01', periodEnd='2026-02-28')], recurring=True),
        I(3, 2, 'SENT', '2026-02-02', '2026-03-31',
          [L(3, 'Hosting', 1, 200, periodStart='2026-02-01', periodEnd='2026-02-28')], recurring=True)])
    u = plus(fx1, inv=[(1, dict(recurUntil='2026-03-17'))])
    g = plus(u, invoices=[I(4, 1, 'DRAFT', '2026-03-02', '2026-04-30',
                            [L(4, 'Support plan', 1, 450, periodStart='2026-03-01', periodEnd='2026-03-17')],
                            recurring=True, recurringFrom=1, recurUntil='2026-03-17')])
    s_ = sent(g, [4], '2026-03-02', '2026-04-30')
    c = ("// the last period runs from 2026-03-01 to the 17th: 450 x 12 / 365 x 17 = 251.51" if revised else
         "// the last period runs from 2026-03-01 to the 17th: 450 x 17/31 = 246.77")
    # from cp175 Generate sends the draft itself when nothing stops it, so there is no Send to press
    # (before cp176 the click is kept, but only while the invoice is still a draft, so that an app at cp175
    # that has already sent it is not failed on a Send it no longer offers)
    send = ("        // nothing stops it, so Generate sent it straight away\n" if revised else
            "        if ((await page.getByTestId('invoice-panel-status').textContent())?.trim() === 'Draft') {\n"
            "          await page.getByTestId('invoice-send').click();\n"
            "        }\n")
    t1 = T('stops a recurring invoice on its end date', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-recur-until').fill('2026-03-17');
        await page.getByTestId('invoice-recur-until-submit').click();
        await page.getByTestId('invoice-generate').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from={{g:inv1.number}} to={{g:inv4.number}}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-period')).toHaveText('2026-03-01 to 2026-03-17');
        {c}
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{{g:inv4.line4.amount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{g:inv4.grand}}');
{send}        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{sent:inv4.status}}');
        // its next period would start after the end date: nothing more to generate
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        // nothing is generated for a client on hold
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        await expect(page.getByTestId(/^invoice-row-\\d+$/)).toHaveCount(1);
""", g=g, sent=s_)
    note = None
    if revised:
        note = ("UPDATED for cp176 (mutates: [155, 157, 165, 175]): service periods are now charged by the day at 12/365 "
                "of the monthly price, so March 1-17 costs 251.51 instead of 246.77. Carries the test.")
    return Spec('cp165_recurring_until', 'recurring until a date', """
        A recurring invoice can have an end date (invoices[].recurUntil, the panel's Recurring until box),
        which the drafts it generates keep. The period a generated draft bills stops at the end date when it
        falls inside that month (and is prorated as usual); once the next period would start after it,
        Generate is refused. Generate is also refused for a client on hold.""", [t1], n, copy_note=note)


cp(165, 'recurring_until', """
    Recurring plans end. Let me give a recurring invoice an end date (a Recurring until box on the
    invoice); the drafts it generates keep it. When the next period runs past the end date, the generated
    line's period stops on the end date and is prorated as usual; once the next period would start after
    the end date, refuse to generate. Also refuse to generate anything for a client who is on hold.
""", s165)

# =============================================================================== cp166 approval limits by client tier


def s166(n):
    st = {'usdPer': RATES, 'approvalLimit': 5000, 'tierApprovalLimits': {'KEY': 20000, 'NEW': 1000}}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, tier='KEY'), C(G, tier='NEW', currency='GBP'), IN], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 8000)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 800)]),
        I(3, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 801)]),
        I(4, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Build', 1, 6000)])])
    t1 = T("uses the approval limit of the client's tier", '@core', fx1, """
        // a key account may go to 20,000.00 without approval
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        // a new client's limit is 1,000.00 US dollars: 1,000 / 1.25 = £800.00
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        // a client with no tier keeps the workspace's 5,000.00
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
""")
    fx2 = dict(asOf=SA, settings=st, clients=[A], invoices=[])
    new = plus(fx2, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', tier='NEW')],
               invoices=[I(5, 2, 'DRAFT', SA, '2026-04-30', [L(5, 'Build', 1, 1500)])])
    t2 = T('sets the tier when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-tier').selectOption('NEW');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
""" + add_line('Build', 1, 1500) + """        await expect(page.getByTestId('invoice-approval')).toHaveText('{new:inv5.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
""", new=new)
    return Spec('cp166_tier_limits', 'approval limits by tier', """
        A client can have a tier (clients[].tier: STANDARD by default, KEY or NEW; the client form's tier
        list). The workspace can set an approval limit per tier (settings.tierApprovalLimits, tier -> US
        dollars); a client whose tier has one uses it instead of the workspace approval limit, converted to
        their currency the same way.""", [t1, t2], n)


cp(166, 'tier_limits', """
    Key accounts shouldn't need approval for routine invoices, and new clients should need it sooner. Give
    each client a tier on the client form (STANDARD by default, KEY or NEW) and let the workspace set an
    approval limit per tier in US dollars. A client whose tier has a limit uses it instead of the workspace
    approval limit (converted to their currency the same way); other clients keep the workspace limit.
""", s166)

# =============================================================================== cp167 percent complete


def s167(n):
    st = {'taxRate': 10, 'approvalLimit': 5000}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, rates=[{'unitType': 'day', 'unitPrice': 1234.56}])], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 12000, percentComplete=40)], discountPct=10)])
    a = plus(fx1, lines=[(1, L(2, 'Design', 1, unitType='day', percentComplete=33.3))])
    b = plus(a, lines=[(1, L(3, 'Testing', 2, 900, percentComplete=100))])
    t1 = T('bills a line by its percent complete', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-percent')).toHaveText('{s:inv1.line1.percent}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}'); // 40% of 12,000.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // 4,800.00 - 10% + 10% tax
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
""" + add_line('Design', 1, unit='day', pct='33.3') + """        // 33.3% of the card's 1,234.56 a day = 411.10848, rounded half up
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{a:inv1.line2.amount}');
        // the 10% invoice discount comes off the typed-in line only (card prices take none)
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv1.discount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
        // over the 5,000.00 limit now
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
""" + add_line('Testing', 2, 900, pct=100) + """        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{b:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{b:inv1.grand}');
        // nothing done, or more than all of it, is refused
""" + add_line('Testing', 1, 900, pct=0) + """        await expect(page.getByTestId('line-form-error')).toBeVisible();
""" + add_line('Testing', 1, 900, pct=120) + """        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(3);
""", a=a, b=b)
    return Spec('cp167_percent_complete', 'percent complete', """
        A line can be billed by percent complete (lineItems[].percentComplete, more than 0 and at most 100;
        the line form's percent box, shown on the line as e.g. "40%"): its amount is that percentage of its
        full amount (quantity x its price, whether typed, from the card or the price list), rounded half up
        to the cent, before its own discount, the invoice discount, tax and totals. Other values are
        refused.""", [t1], n)


cp(167, 'percent_complete', """
    For long jobs I bill by progress. Let a line carry a percent complete (a percent box on the line form,
    shown on the line, e.g. "40%"; more than 0 and at most 100, refuse anything else). Its amount is that
    percentage of its full amount, quantity x its price whether typed in or from the rate card or price
    list, rounded half up to the cent. The line's own discount, the invoice discount, tax, totals and the
    approval check then work on that amount.
""", s167)

# =============================================================================== cp168 no more retention (the reversal)
RET_MUT = [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]


def s168(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-04-30', [L(2, 'Design', 1, 500)]),
        I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Design', 1, 200, creditOfLine=2)], creditOf=2)],
        payments=[P(1, 1, 450, '2026-02-20', [(2, 450)])])
    s_ = sent(fx1, [1], SA, '2026-04-30')
    cn = sent(s_, [3], SA)
    # the 220.00 credit note (200.00 + 10% tax) clears the 100.00 still owed and leaves 120.00 as credit
    t1 = T('invoices no longer hold anything back', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // no retention box on the client form, the invoice or anywhere else
        await expect(page.getByTestId('client-form-retention-pct')).toHaveCount(0);
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('retention-form-pct')).toHaveCount(0);
        await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
        await page.getByTestId('invoice-send').click();
        // the whole 1,100.00 is due
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
        await expect(page.getByTestId('invoice-release-retention')).toHaveCount(0);
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent:client1.balance}');
        // a 220.00 credit note against an invoice that owes 100.00 leaves 120.00 as credit straight away
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount={cn:client1.credit|plain}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{cn:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{cn:client1.credit}');
""", sent=s_, cn=plus(cn, payments=[P(2, 1, 120, SA, [], creditNote=3)]))
    return Spec('cp168_no_retention', 'no more retention', """
        Invoices no longer hold back retention: there is no retention box on the client form or the
        invoice, no retention figures or release button on the panel, and no Retention held status. An
        invoice owes its whole amount from the day it is sent, its payments, credit and credit notes apply
        to all of it (a credit note's excess goes straight to credit), it can have an instalment plan or an
        early-payment discount, and its late interest and overdue amount are worked out on all of it.""",
        [t1], n)


cp(168, 'no_retention', """
    We've stopped holding back retention on our contracts, and it complicates everything. Remove it
    completely: no standard retention on the client form, no retention box, retention figures or release
    button on the invoice, and no Retention held status. Every invoice now owes its whole amount once it is
    sent; payments, credit and credit notes apply to all of it (a credit note bigger than what is owed puts
    the rest straight into credit), any invoice can have an instalment plan or an early-payment discount,
    and late interest and overdue amounts are worked out on the whole invoice. Drop the retention data
    too.
""", s168, type_='mutative', mutates=RET_MUT, retires=[
    'cp55_retention.spec.ts::holds retention back until it is released',
    'cp55_retention.spec.ts::releases only once the rest is paid, and released retention can fall overdue',
    'cp55_retention.spec.ts::refuses a retention outside 0 to 20',
    'cp56_credit_note_excess.spec.ts::a credit note takes held retention before it leaves credit',
    'cp60_retention_before_tax.spec.ts::works retention out before tax',
    'cp75_client_retention.spec.ts::new invoices start with the client\'s retention',
    'cp75_client_retention.spec.ts::duplicating keeps the plan and the retention',
    'cp75_client_retention.spec.ts::sets a standard retention when adding a client',
    'cp83_retention_cap.spec.ts::caps the retention at a maximum amount',
    'cp93_partial_retention_release.spec.ts::releases part of the retention',
    'cp93_partial_retention_release.spec.ts::refuses to release more than is still held',
    'cp98_retention_interest.spec.ts::released retention earns interest once overdue',
    'cp106_prices_include_tax.spec.ts::discounts, retention and exempt lines on prices that include tax'])

# =============================================================================== cp169 milestones


def ms_form(desc, pct):
    return (f"        await page.getByTestId('milestone-form-description').fill('{desc}');\n"
            f"        await page.getByTestId('milestone-form-pct').fill('{pct}');\n"
            "        await page.getByTestId('milestone-form-submit').click();\n")


def MS(i, desc, pct, **kw):
    return dict(id=i, description=desc, pct=pct, **kw)


def s169(n):
    revised = n >= 196
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 3333.34)])])
    ms = [MS(1, 'Design', 35), MS(2, 'Build', 35), MS(3, 'Handover', 30)]
    a = plus(fx1, inv=[(1, dict(milestones=copy.deepcopy(ms)))])
    s_ = sent(a, [1], SA, '2026-04-30')
    r = copy.deepcopy(s_)
    r['invoices'][0]['milestones'][0]['reachedOn'] = SA
    v = V(r, n)
    m1 = num(v['inv1.ms1.amount'])
    p = plus(r, payments=[P(1, 1, m1, SA, [(1, m1)])])
    if revised:
        sp = ("// 3,666.67 split 35/35/30: each share rounded down (1,283.33, 1,283.33, 1,100.00) and the last\n"
              "        // milestone takes the cent left over: 1,100.01")
    else:
        sp = ("// 3,666.67 split 35/35/30: 1,283.3345, 1,283.3345 and 1,100.001; the cent left over goes to the\n"
              "        // largest remainder, the first of the two equal ones: 1,283.34, 1,283.33, 1,100.00")
    t1 = T('bills an invoice by milestones as they are reached', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + ms_form('Design', 35) + ms_form('Build', 35) + ms_form('Handover', 30) + f"""        // 3,333.34 + 10% tax = 3,666.67
        {sp}
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-amount')).toHaveText('{{a:inv1.ms1.amount}}');
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('{{a:inv1.ms2.amount}}');
        await expect(page.getByTestId('milestone-row-3').getByTestId('milestone-amount')).toHaveText('{{a:inv1.ms3.amount}}');
        // the percentages may not add up to more than 100
""" + ms_form('Extra', 5) + """        await expect(page.getByTestId('milestone-form-error')).toBeVisible();
        await expect(page.getByTestId(/^milestone-row-\\d+$/)).toHaveCount(3);
        await page.getByTestId('invoice-send').click();
        // nothing is owed until a milestone is reached
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{sent:inv1.ms1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent:client1.balance}');
        await page.getByTestId('milestone-row-1').getByTestId('milestone-reach').click();
        await expect.poll(() => auditLines()).toContain('MILESTONE_REACHED id=1 milestone=1 amount={r:inv1.ms1.amount|plain}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{r:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv1.status}');
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{r:inv1.ms1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{r:client1.balance}');
""" + pay('{r:inv1.ms1.amount|plain}', SA) + """        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{p:inv1.ms1.status}');
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('{p:inv1.ms2.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
""", a=a, sent=s_, r=r, p=p)
    fx2 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 2000)],
          milestones=[MS(4, 'Start', 25), MS(5, 'Finish', 75)]),
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 500)], milestones=[MS(6, 'Start', 50)])],
        payments=[P(1, 1, 300, '2026-03-02', [])])
    r2 = copy.deepcopy(fx2)
    r2['invoices'][0]['milestones'][0]['reachedOn'] = SA
    r2['payments'][0]['allocations'] = [dict(invoiceId=2, amount=300, date=SA)]
    t2 = T("reaching a milestone uses the client's credit", '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}');
        await page.getByTestId('milestone-row-4').getByTestId('milestone-reach').click();
        // 25% of 2,200.00 = 550.00 is owed, and the 300.00 of credit is used on it straight away
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=300.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{r:inv2.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{r:client1.credit}');
        await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('{r:inv2.ms4.status}');
        // milestones that don't add up to 100% can't be sent
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv3.status}');
""", r=r2)
    note = None
    if revised:
        note = ("UPDATED for cp196 (mutates: [169, 170, 178, 185]): each milestone's share is now rounded down and "
                "the last milestone takes what is left, so the 3,666.67 splits 1,283.33, 1,283.33 and 1,100.01 "
                "(it was 1,283.34, 1,283.33, 1,100.00). Carries both tests.")
        split_rule = ("each milestone's percentage of what the client pays (the grand total less withholding), rounded "
                      "down to the cent, the last milestone taking whatever is left")
    else:
        split_rule = ("what the client pays (the grand total less withholding) split by the milestones' percentages, "
                      "the cents left over going one each to the largest remainders (the lower id on a tie)")
    return Spec('cp169_milestones', 'milestone billing', f"""
        A draft can be billed by milestones (invoices[].milestones: id, description, pct; the milestone form,
        each row showing its amount and status). Their percentages must be over 0 and add up to no more than
        100, and to exactly 100 before the invoice can be sent. A milestone's amount is {split_rule}. Once
        sent, only reached milestones are owed: Reach (milestones[].reachedOn, today) writes MILESTONE_REACHED
        id=<invoice id> milestone=<id> amount=<amount> and uses the client's credit on it as sending does.
        Until then a milestone is Pending and is not due, in the balance or overdue; reached milestones are
        due on the invoice's due date and paid in order. With nothing owed now but milestones still pending,
        the invoice is "Awaiting milestone".""", [t1, t2], n, copy_note=note)


cp(169, 'milestones', """
    Without retention I need another way to hold back money on big jobs: bill them by milestones. Let me
    add milestones to a draft (a description and a percentage each; refuse percentages that are 0 or
    less or would take the total over 100) and refuse to send it unless they add up to exactly 100. Each
    milestone is worth its percentage of what the client pays (grand total less withholding), with the
    cents left over going one each to the largest remainders (lower id on a tie) so they add up exactly;
    show each one's amount and status. Once sent, a milestone is owed only when I mark it reached (a Reach
    button, written as MILESTONE_REACHED id=<invoice id> milestone=<milestone id> amount=<amount>), and
    reaching it uses the client's credit on it just like sending does. Pending milestones aren't due,
    aren't in the balance and can't be overdue; reached ones are due on the invoice's due date and are
    paid in order. When nothing is owed yet but milestones are still pending, show the invoice as Awaiting
    milestone.
""", s169)

# =============================================================================== cp170 milestone due dates


def s170(n):
    st = {'lateInterestRate': 12}
    ms = [MS(1, 'Design', 40, reachedOn='2026-03-01'), MS(2, 'Build', 40, reachedOn='2026-04-20'), MS(3, 'Handover', 20)]
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, C(G, termsDays=30)], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-06-30', [L(1, 'Build', 1, 5000)], milestones=copy.deepcopy(ms)),
        I(2, 2, 'SENT', '2026-02-01', '2026-06-30', [L(2, 'Build', 1, 5000)],
          milestones=[MS(4, 'Design', 40, reachedOn='2026-03-25'), MS(5, 'Build', 60)])])
    v = V(fx1, n)
    owe1 = num(v['inv1.ms1.amount']) + num(v['inv1.ms1.lateInterest'])
    p = plus(fx1, payments=[P(1, 1, owe1, '2026-04-30', [(1, owe1)])])
    t1 = T('each reached milestone falls due on its own', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // reached 2026-03-01, due 14 days later; past its grace week since 2026-03-22: 39 days of interest
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-due')).toHaveText('{s:inv1.ms1.due}');
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{s:inv1.ms1.status}');
        // reached 2026-04-20: due 2026-05-04, not yet overdue
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-due')).toHaveText('{s:inv1.ms2.due}');
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('{s:inv1.ms2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{s:inv1.nextDue}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        // paying the first milestone and its interest leaves the second, due 2026-05-04
""" + pay('{s:client1.overdue|plain}', '2026-04-30') + """        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{p:inv1.ms1.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{p:inv1.nextDue}');
        // a client with 30-day terms: reached 2026-03-25, due 2026-04-24, still in its grace week
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-due')).toHaveText('{p:inv2.ms4.due}');
        await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('{p:inv2.ms4.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{p:inv2.interest}');
""", p=p)
    return Spec('cp170_milestone_due', 'milestone due dates', """
        A reached milestone falls due the client's terms (clients[].termsDays) after the day it was reached,
        or 14 days when they have none, shown on its row. It is overdue once its grace period has passed with
        something unpaid, earning late interest on its unpaid amount from then by the usual rule; the
        invoice is Overdue while any milestone is, the client's overdue amount counts the overdue milestones
        with their interest, payments pay reached milestones by due date (then id), each milestone's amount and
        then its interest, and the invoice list shows the due date of the next milestone with something owing.""", [t1], n)


cp(170, 'milestone_due', """
    A milestone reached in May can't have been due in March. Make each reached milestone fall due the
    client's payment terms after the day it was reached (14 days if they have none) and show its due date
    on its row. Once its grace period has passed with something unpaid it is overdue and earns late
    interest on what is unpaid, by the usual rule; the invoice is Overdue while any of its milestones is,
    the client's overdue amount counts the overdue milestones and their interest, payments go to reached
    milestones in due-date order (each milestone's amount, then its interest), and the invoice list shows the due date of the next
    milestone that still has something owing.
""", s170)

# =============================================================================== cp171 resolving a dispute with a credit note


def s171(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 200, disputed=True)],
          disputedOn='2026-04-01')])
    cn = plus(fx1, inv=[(1, dict(disputeResolvedOn='2026-04-30', disputeCredit=True))],
              invoices=[I(2, 1, 'SENT', '2026-04-30', '2026-04-30', [L(3, 'Travel', 1, 200, creditOfLine=2)], creditOf=1)])
    t1 = T('resolves a dispute by crediting the disputed lines', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{s:inv1.disputed}'); // 200.00 + 20.00 tax
        await page.getByTestId('invoice-resolve-credit').click();
        // a credit note for the travel line, taxed like the original, is issued today and the dispute ends
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={cn:inv2.number} invoice=1 total={cn:inv2.grand|plain}');
        await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
        await expect(page.getByTestId('invoice-credited')).toHaveText('{cn:inv1.credited}');
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{cn:inv1.disputed}');
        // no interest on the credited line for the time it was in dispute: 1,320.00 for 24 days, then the
        // undisputed 1,100.00 for 29
        await expect(page.getByTestId('invoice-interest')).toHaveText('{cn:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{cn:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{cn:inv1.status}');
""", cn=cn)
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-02-01', '2026-05-31', [L(4, 'Build', 1, 300)], disputedOn='2026-04-20')],
        payments=[P(1, 1, 110, '2026-04-10', [(3, 110)])])
    cn2 = plus(fx2, inv=[(3, dict(disputeResolvedOn='2026-04-30', disputeCredit=True))],
               invoices=[I(4, 1, 'SENT', '2026-04-30', '2026-04-30', [L(5, 'Build', 1, 300, creditOfLine=4)], creditOf=3)],
               payments=[P(2, 1, 110, '2026-04-30', [], creditNote=4)])
    t2 = T('a credit for a whole disputed invoice leaves what was paid as credit', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-resolve-credit').click();
        // the whole invoice was in dispute: all of it is credited (330.00), 220.00 against what it owed and the
        // 110.00 already paid back as credit
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=110.00');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{cn:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{cn:client1.credit}');
""", cn=cn2)
    return Spec('cp171_dispute_credit', 'resolving a dispute with a credit', """
        A dispute can be resolved with a credit (the Resolve with credit button; invoices[].disputeCredit):
        a credit note is issued today for the disputed lines, each credited in full (the whole invoice when it
        was disputed as a whole), taxed like the original and applied as credit notes are (CREDIT_NOTE_ISSUED,
        then any excess held as credit); the dispute is resolved (DISPUTE_RESOLVED). The interest held back on
        the disputed amount during the dispute is not charged; the rest of the invoice is owed as usual.""",
        [t1, t2], n)


cp(171, 'dispute_credit', """
    When a client turns out to be right, I settle the dispute with a credit note. Give a disputed invoice a
    Resolve with credit button: it issues a credit note dated today for the disputed lines, each credited in
    full (all of the invoice's lines if the whole invoice was disputed), taxed like the original and
    applied like any credit note (anything beyond what the invoice owes becomes credit), and then resolves
    the dispute. Don't charge the interest that was held back on the disputed amount while it was in
    dispute; the rest of the invoice is owed as usual.
""", s171)

# =============================================================================== cp172 paying a disputed invoice


def s172(n):
    st = {'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)], disputedOn='2026-04-01'),
        I(2, 1, 'SENT', '2026-04-01', '2026-05-31', [L(2, 'Design', 1, 100)])])
    v = V(plus(fx1, inv=[(1, dict(disputeResolvedOn='2026-04-30'))]), n)
    owed = num(v['inv1.due'])
    a = plus(fx1, inv=[(1, dict(disputeResolvedOn='2026-04-30'))], payments=[P(1, 1, 500, '2026-04-30', [(1, 500)])])
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)], disputedOn='2026-04-01'),
        I(4, 1, 'SENT', '2026-04-01', '2026-05-31', [L(4, 'Design', 1, 100)])])
    b = plus(fx2, payments=[P(1, 1, 400, '2026-04-30', [(4, 100), (3, 300)])])
    t1 = T('paying a disputed invoice settles the dispute', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        // a payment with it open is accepted: the client has stopped disputing it
""" + pay('500', '2026-04-30') + """        await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=500.00');
        // the interest held back is owed again: 1,000.00 + 53 days' interest, less 500.00
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
""", a=a)
    t2 = T('automatic payments reach disputed invoices last', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // with no invoice open the undisputed invoice 4 is paid first; what is left goes to the disputed one
        // instead of becoming credit, and it stays disputed
""" + pay('400', '2026-04-30') + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=4 amount=100.00',
          'PAYMENT_RECORDED id=1 invoice=3 amount=300.00',
        ]);
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{b:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{b:client1.credit}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv3.due}');
""", b=b)
    return Spec('cp172_dispute_payment', 'paying a disputed invoice', """
        A payment made with a disputed invoice open is accepted: it resolves the dispute that day
        (DISPUTE_RESOLVED id=<id>, with the interest held back owed again) and pays the invoice as usual.
        Automatic payments and Apply credit still pay every undisputed invoice first, in the usual order,
        but what is left then goes to disputed invoices (oldest due date first, lower id on ties), which
        stay disputed, before anything becomes credit.""", [t1, t2], n)


cp(172, 'dispute_payment', """
    Clients do pay disputed invoices, and refusing their money is silly. Accept a payment made with a
    disputed invoice open: it means they've accepted it, so resolve the dispute that day (DISPUTE_RESOLVED,
    with the held-back interest owed again) and apply the payment as usual. Automatic payments and Apply
    credit should still pay every undisputed invoice first, in the usual order, but then put what's left on
    disputed invoices (oldest due date first, lower id on ties), which stay disputed, rather than turning it
    into credit.
""", s172, type_='mutative', mutates=[158], copies=['cp158_disputes'])

# =============================================================================== cp173 progress claims


def s173(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-10', '2026-03-31',
          [L(1, 'Build', 1, 987.65, percentComplete=15), L(2, 'Design', 2, 3000, percentComplete=40),
           L(3, 'Setup', 1, 200)])])
    claim = plus(fx1, invoices=[I(2, 1, 'DRAFT', SA, '2026-04-30',
                                  [L(4, 'Build', 1, 987.65, percentComplete=15, billedPct=15),
                                   L(5, 'Design', 2, 3000, percentComplete=40, billedPct=40)], claimFrom=1)])
    a = copy.deepcopy(claim)
    a['invoices'][1]['lineItems'][0]['percentComplete'] = 45
    b = copy.deepcopy(a)
    b['invoices'][1]['lineItems'][1]['percentComplete'] = 70
    t1 = T('claims the progress made since the last invoice', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-next-claim').click();
        await expect.poll(() => auditLines()).toContain('PROGRESS_CLAIM from={claim:inv1.number} to={claim:inv2.number}');
        await page.getByTestId('invoice-row-2').click();
        // the progress lines only, billed so far at 15% and 40%: nothing more to bill yet
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(2);
        await expect(page.getByTestId('line-row-4').getByTestId('line-billed-pct')).toHaveText('{claim:inv2.line4.billedPct}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{claim:inv2.line4.amount}');
        await page.getByTestId('line-row-4').getByTestId('line-edit').click();
        await page.getByTestId('line-form-percent').fill('45');
        await page.getByTestId('line-form-submit').click();
        // 45% of 987.65 = 444.44 less the 148.15 already billed at 15% = 296.29 (30% of it would be 296.30)
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{a:inv2.line4.amount}');
        await page.getByTestId('line-row-5').getByTestId('line-edit').click();
        await page.getByTestId('line-form-percent').fill('70');
        await page.getByTestId('line-form-submit').click();
        // 70% of 6,000.00 less the 40% billed: 4,200.00 - 2,400.00
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{b:inv2.line5.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{b:inv2.grand}');
        // progress can't go backwards
        await page.getByTestId('line-row-5').getByTestId('line-edit').click();
        await page.getByTestId('line-form-percent').fill('30');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{b:inv2.line5.amount}');
        // each invoice is claimed from once
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-next-claim').click();
        await expect(page.getByTestId('invoice-next-claim-error')).toBeVisible();
""", claim=claim, a=a, b=b)
    return Spec('cp173_progress_claims', 'progress claims', """
        Next claim on a sent invoice with percent-complete lines creates the next claim: a draft for the same
        client, dated today, with a copy of each percent-complete line (invoices[].claimFrom records where it
        came from) whose billed percentage (lineItems[].billedPct, shown as e.g. "40%") is that line's
        percentage so far, writing PROGRESS_CLAIM from=<number> to=<new number>. A claimed line's amount is
        its new percentage of its full amount less its billed percentage of it, each rounded half up to the
        cent; its percentage can't be set to less than it has billed, nor over 100. Other lines are not
        copied; a draft, an invoice with no percent-complete line or one already claimed from is refused.""",
        [t1], n)


cp(173, 'progress_claims', """
    On long jobs I send a claim each month for the progress since the last one. Give a sent invoice with
    percent-complete lines a Next claim button: it creates a draft for the same client, dated today, with a
    copy of each percent-complete line showing the percentage already billed (the line's percentage on
    the invoice it came from), and writes PROGRESS_CLAIM from=<invoice number> to=<new invoice number>.
    When I raise a line's percentage, it bills the new percentage of its full amount less the billed
    percentage of it, each rounded half up to the cent separately. Refuse a percentage below what has
    already been billed, or over 100. Lines without a percentage aren't copied, and claiming again from the
    same invoice, from a draft or from an invoice with no percent-complete line is refused.
""", s173)

# =============================================================================== cp174 shorter terms for risky clients


def s174(n):
    revised = n >= 192
    if revised:
        # days late, weight 0.5: MEDIUM from 5, HIGH from 15
        med = [I(1, 1, 'SENT', '2025-12-01', '2025-12-31', [L(1, 'Design', 1, 100)])]
        medp = [P(1, 1, 100, '2026-01-10', [(1, 100)])]       # 10 days late -> 10.0 MEDIUM
        high = [I(2, 2, 'SENT', '2025-11-01', '2025-11-30', [L(2, 'Design', 1, 100)])]
        highp = [P(2, 2, 100, '2026-01-04', [(2, 100)])]      # 35 days late -> 35.0 HIGH
        hist = "one invoice paid 10 days late (10.0, MEDIUM)"
        hist2 = "one paid 35 days late (35.0, HIGH)"
    else:
        med = [I(1, 1, 'SENT', '2025-12-01', '2025-12-31', [L(1, 'Design', 1, 100)])]
        medp = [P(1, 1, 100, '2025-12-21', [(1, 100)])]       # 20 days -> 20.0 MEDIUM
        high = [I(2, 2, 'SENT', '2025-11-01', '2025-11-30', [L(2, 'Design', 1, 100)])]
        highp = [P(2, 2, 100, '2025-12-16', [(2, 100)])]      # 45 days -> 45.0 HIGH
        hist = "one invoice paid in 20 days (20.0, MEDIUM)"
        hist2 = "one paid in 45 days (45.0, HIGH)"
    on = {'approvedOn': SA} if n >= 156 else {}
    fx1 = dict(asOf=SA, clients=[A, C(G, termsDays=30), IN, C({'id': 4, 'name': 'Hooli', 'email': 'ap@hooli.example'}, termsDays=10)],
               invoices=med + high + [
                   I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Build', 1, 400)]),
                   I(4, 2, 'DRAFT', '2026-03-05', '2026-04-30', [L(4, 'Build', 1, 400)], approvedTotal=400, **on,
                     **({'approvals': 2} if n >= 200 else {})),
                   I(5, 3, 'DRAFT', '2026-03-05', '2026-04-30', [L(5, 'Build', 1, 400)]),
                   I(6, 4, 'SENT', '2025-12-01', '2025-12-31', [L(6, 'Design', 1, 100)]),
                   I(7, 4, 'DRAFT', '2026-03-05', '2026-04-30', [L(7, 'Build', 1, 400)])],
               payments=medp + highp + [P(3, 2, 120, '2026-03-05', [], reference=invoice_number_luhn(4)),
                                        P(4, 4, 100, medp[0]['date'], [(6, 100)])])
    s_ = plus(fx1, inv=[(3, dict(status='SENT', issueDate=SA, dueDate='2026-03-31')),
                        (4, dict(status='SENT', issueDate=SA, dueDate='2026-03-17')),
                        (5, dict(status='SENT', issueDate=SA, dueDate='2026-04-30')),
                        (7, dict(status='SENT', issueDate=SA, dueDate='2026-03-20'))],
              alloc=[(3, 4, 120, SA)])
    t1 = T('gives risky clients less time to pay', '@core', fx1, f"""
        // Acme has {hist}: at most 21 days instead of the end of next month
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{{s:client1.riskBand}}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('{{sent:inv3.dueDate}}');
        // Globex has {hist2}: at most 7 days, not its 30-day terms
        // (the draft is approved and its 30% deposit is held)
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{{s:client2.riskBand}}');
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('{{sent:inv4.dueDate}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{sent:inv4.due}}'); // 400.00 less the 120.00 deposit
        // a LOW client keeps the usual terms
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-5').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('{{sent:inv5.dueDate}}');
        // terms shorter than the cap are kept: Hooli is MEDIUM with 10-day terms
        await page.getByTestId('client-row-4').click();
        await page.getByTestId('invoice-row-7').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-due')).toHaveText('{{sent:inv7.dueDate}}');
""", sent=s_)
    note = None
    if n >= 200:
        note = ("UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): a high-risk client's invoice now needs two approvals, "
                "so Globex's draft carries both; the terms rule is unchanged. Carries the test.")
    elif revised:
        note = ("UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the risk score now averages days late, so the "
                "histories are invoices paid 10 and 35 days late (MEDIUM and HIGH); the terms rule is unchanged. "
                "Carries the test.")
    return Spec('cp174_risk_terms', 'shorter terms for risky clients', """
        When an invoice is sent, a MEDIUM-risk client's due date is at most 21 days after the issue date and a
        HIGH-risk client's at most 7 days, in place of whatever their terms would give when that is later;
        shorter terms are kept. LOW-risk clients keep their usual terms.""", [t1], n, copy_note=note)


cp(174, 'risk_terms', """
    Slow payers shouldn't get long terms. When I send an invoice to a client in the MEDIUM risk band, make it
    due no more than 21 days after the issue date; for a HIGH client, no more than 7 days. If their usual
    terms would give an earlier due date, keep that. LOW clients keep their usual terms.
""", s174)

# =============================================================================== cp175 recurring invoices sent on their own


def s175(n):
    revised = n >= 176
    st = {'taxRate': 10, 'approvalLimit': 1000}
    fx1 = dict(asOf='2026-03-02', settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-02-02', '2026-02-28',
          [L(1, 'Support plan', 1, 450, periodStart='2026-02-01', periodEnd='2026-02-28')], recurring=True),
        I(2, 2, 'SENT', '2026-02-02', '2026-02-28',
          [L(2, 'Licences', 20, 60, periodStart='2026-02-01', periodEnd='2026-02-28')], recurring=True)],
        payments=[P(1, 1, 100, '2026-02-20', [])])
    g = plus(fx1, invoices=[I(3, 1, 'SENT', '2026-03-02', '2026-04-30',
                              [L(3, 'Support plan', 1, 450, periodStart='2026-03-01', periodEnd='2026-03-31')],
                              recurring=True, recurringFrom=1)], alloc=[(1, 3, 100, '2026-03-02')])
    g2 = plus(g, invoices=[I(4, 2, 'DRAFT', '2026-03-02', '2026-04-30',
                             [L(4, 'Licences', 20, 60, periodStart='2026-03-01', periodEnd='2026-03-31')],
                             recurring=True, recurringFrom=2)])
    t1 = T('sends a generated invoice straight away when nothing stops it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-generate').click();
        // March's 450.00 + 10% needs no approval, so it goes out at once and uses the 100.00 of credit
        await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from={g:inv1.number} to={g:inv3.number}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=3 number={g:inv3.number} total={g:inv3.grand|plain}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=100.00');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{g:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{g:client1.balance}');
        // 20 licences at 60.00 is over the approval limit: it waits as a draft
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{g2:inv4.status}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{g2:inv4.approval}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT id=4'))).toEqual([]);
""", g=g, g2=g2)
    note = None
    if revised:
        note = ("UPDATED for cp176 (mutates: [155, 157, 165, 175]): March is now charged by the day, 450 x 12 / 365 x 31 = "
                "458.63 rather than 450.00, so the invoice sent and the balance change. Carries the test.")
    return Spec('cp175_recurring_autosend', 'recurring invoices sent on their own', """
        A draft created by Generate is sent at once, exactly as if I had sent it (the same dates, audit lines
        and use of credit), when nothing would stop it being sent: it needs no approval, the client is not on
        hold, it keeps the client within their credit limit and needs no deposit. Otherwise it stays a draft.""",
        [t1], n, copy_note=note)


cp(175, 'recurring_autosend', """
    I don't want to click Send on every routine monthly invoice. When Generate creates the next period's
    draft, send it straight away, exactly as if I had sent it myself (same dates, audit lines and use of
    credit), whenever nothing would stop it: it needs no approval, the client isn't on hold, it keeps them
    within their credit limit and no deposit is needed. Otherwise leave it as a draft for me.
""", s175)

# =============================================================================== cp176 proration by the day (revised)


def s176(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Support plan', 1, 450, periodStart='2026-01-20', periodEnd='2026-02-10'),
           L(2, 'Hosting', 1, 90, periodStart='2026-03-01', periodEnd='2026-03-31'),
           L(3, 'Hosting', 1, 90, periodStart='2026-02-01', periodEnd='2026-02-28')])])
    t1 = T('charges a service period by the day', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 450.00 a month is 450 x 12 / 365 = 14.794521 a day: 22 days = 325.479452 -> 325.48
        // (by calendar month it was 334.91)
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        // a whole month is no longer the monthly price: 31 days of March = 91.73, 28 days of February = 82.85
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
""")
    return Spec('cp176_proration_by_day', 'proration by the day', """
        A line with a service period is now charged by the day: the day rate is the monthly amount x 12 / 365,
        times the days in the period (both ends included), rounded half up to the cent (whole yen) once. A
        whole calendar month therefore costs 28, 30 or 31 days' worth, not the monthly amount.""", [t1], n)


cp(176, 'proration_by_day', """
    My accountant wants service periods charged by the day, the same every month. Work out a day rate of the
    monthly price x 12 / 365 and charge it for every day of the period, both ends included, rounding half up
    to the cent (whole yen) once at the end. So 450.00 a month from 2026-01-20 to 2026-02-10 is 22 days x
    14.794521 = 325.48, and a whole month is 28, 30 or 31 days' worth rather than exactly the monthly
    price. This applies everywhere a period is charged, including generated recurring invoices.
""", s176, type_='mutative', mutates=[155, 157, 165, 175], algorithm='calendar-proration-revised',
   copies=['cp155_calendar_proration', 'cp157_recurring_invoices', 'cp165_recurring_until', 'cp175_recurring_autosend'])

# =============================================================================== cp177 crediting part of a service period


def s177(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-11', '2026-03-31',
          [L(1, 'Support plan', 1, 450, periodStart='2026-01-20', periodEnd='2026-02-10'), L(2, 'Setup', 1, 120)])])
    cn = plus(fx1, invoices=[I(2, 1, 'DRAFT', SA, '2026-04-30',
                               [L(3, 'Support plan', 1, 450, periodStart='2026-01-20', periodEnd='2026-02-10',
                                  creditOfLine=1)], creditOf=1)])
    ed = copy.deepcopy(cn)
    ed['invoices'][1]['lineItems'][0]['periodStart'] = '2026-02-01'
    iss = sent(ed, [2], SA)
    t1 = T('credits part of a service period by the day', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('line-row-1').getByTestId('line-credit').click();
        // the credit line copies the period: all of it would credit the whole charge
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-period')).toHaveText('2026-01-20 to 2026-02-10');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{cn:inv2.line3.amount}');
        // a period reaching outside the one billed is refused
        await page.getByTestId('line-row-3').getByTestId('line-edit').click();
        await page.getByTestId('line-form-period-start').fill('2026-02-01');
        await page.getByTestId('line-form-period-end').fill('2026-02-15');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-form-error')).toBeVisible();
        // crediting 2026-02-01 to 2026-02-10: 10 days at 450 x 12 / 365 = 147.95, plus 10% tax like the original
        await page.getByTestId('line-row-3').getByTestId('line-edit').click();
        await page.getByTestId('line-form-period-start').fill('2026-02-01');
        await page.getByTestId('line-form-period-end').fill('2026-02-10');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{ed:inv2.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{ed:inv2.grand}');
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={iss:inv2.number} invoice=1 total={iss:inv2.grand|plain}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{iss:inv1.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{iss:inv1.due}');
""", cn=cn, ed=ed, iss=iss)
    return Spec('cp177_period_credit', 'crediting part of a period', """
        Crediting a line with a service period copies the period onto the credit line, and the credit line's
        period can be shortened (with the line form's period boxes) to credit just part of it, charged by the
        day like any period. A credit period that is not inside the period the line billed is refused.""",
        [t1], n)


cp(177, 'period_credit', """
    When a client cancels part of a plan I credit the days they didn't use. When I credit a line that has a
    service period, copy the period onto the credit line and let me shorten it with the period boxes, so
    the credit is just those days, charged by the day like any period and taxed like the original. Refuse
    a credit period that isn't inside the period the line billed.
""", s177)

# =============================================================================== cp178 disputing a milestone


def s178(n):
    st = {'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-06-30', [L(1, 'Build', 1, 5000)],
          milestones=[MS(1, 'Design', 40, reachedOn='2026-03-01'), MS(2, 'Build', 40, reachedOn='2026-04-20'),
                      MS(3, 'Handover', 20)])])
    d1 = copy.deepcopy(fx1)
    d1['invoices'][0]['milestones'][0]['disputedOn'] = '2026-04-30'
    v = V(d1, n)
    m2 = num(v['inv1.ms2.amount'])
    p = plus(d1, payments=[P(1, 1, m2, '2026-04-30', [(1, m2)])])
    t1 = T('disputes a reached milestone', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await page.getByTestId('milestone-row-1').getByTestId('milestone-dispute').click();
        // the overdue design milestone (2,000.00 and its 26.17 of interest) is in dispute
        await expect.poll(() => auditLines()).toContain('INVOICE_DISPUTED id=1 amount={d:inv1.disputed|plain}');
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{d:inv1.ms1.status}');
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{d:inv1.disputed}');
        // the build milestone is still due but not yet overdue
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{d:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{d:client1.overdue}');
        // a payment goes to the build milestone, passing the disputed one
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('{d:inv1.ms2.amount}');
""" + pay('{d:inv1.ms2.amount|plain}', '2026-04-30') + """        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('{p:inv1.ms2.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
""", d=d1, p=p)
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-06-30', [L(2, 'Build', 1, 5000)],
          milestones=[MS(4, 'Design', 40, reachedOn='2026-03-01', disputedOn='2026-04-01'), MS(5, 'Build', 60)])])
    r = copy.deepcopy(fx2)
    del r['invoices'][0]['milestones'][0]['disputedOn']
    r['invoices'][0]['disputeResolvedOn'] = '2026-04-30'
    t2 = T('a disputed milestone earns no interest until it is resolved', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // in dispute since 2026-04-01: interest ran from 2026-03-22 for 10 days only
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await page.getByTestId('invoice-resolve').click();
        // resolved: the interest held back is owed, 39 days in all, and it is overdue again
        await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('{r:inv2.ms4.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{r:inv2.interest}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv2.status}');
""", r=r)
    return Spec('cp178_milestone_dispute', 'disputing a milestone', """
        A reached milestone can be disputed with its row's Dispute action (milestones[].disputedOn, today),
        writing INVOICE_DISPUTED id=<invoice id> amount=<what the milestone owes>. A disputed milestone shows
        Disputed, earns no interest from that day, is not overdue (nor in the client's overdue amount) and
        takes no payment: payments go to the other reached milestones. The panel shows the amount in dispute,
        and the invoice is Disputed when nothing else is owed. Resolve clears it, and the interest held back
        is owed as for any dispute.""", [t1, t2], n)


cp(178, 'milestone_dispute', """
    Clients dispute milestones too ("that isn't finished"). Give each reached milestone a Dispute action
    (write INVOICE_DISPUTED id=<invoice id> amount=<what the milestone owes>): it shows Disputed, stops
    earning interest, doesn't count as overdue (nor in the client's overdue amount) and takes no payments,
    which go to the other reached milestones instead. Show the amount in dispute on the invoice, and show
    the invoice as Disputed when nothing else is owed. Resolve ends it, with the held-back interest owed
    as for any dispute.
""", s178)

# =============================================================================== cp179 higher interest for high-risk clients


def s179(n):
    revised = n >= 192
    st = {'lateInterestRate': 12, 'regionMaxInterest': {'NY': 13}}
    # each client has one invoice that took 60 days to pay, on its due date (HIGH); after cp192 the score is
    # days late, so the history is an invoice paid 46 days late, its late interest included
    if revised:
        hist = lambda i, c: I(i, c, 'SENT', '2025-11-01', '2025-11-30', [L(i, 'Design', 1, 100)])
        tmp = dict(asOf='2026-01-15', settings=st, clients=[A], invoices=[hist(1, 1)])
        owed = num(V(tmp, n)['inv1.due'])
        pays = [P(1, 1, owed, '2026-01-15', [(1, owed)]), P(2, 2, owed, '2026-01-15', [(2, owed)])]
    else:
        hist = lambda i, c: I(i, c, 'SENT', '2025-11-01', '2025-12-31', [L(i, 'Design', 1, 100)])
        pays = [P(1, 1, 100, '2025-12-31', [(1, 100)]), P(2, 2, 100, '2025-12-31', [(2, 100)])]
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, C(G, region='NY'), IN], invoices=[
        hist(1, 1), hist(2, 2),
        I(3, 1, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)]),
        I(4, 2, 'SENT', '2026-02-01', '2026-03-01', [L(4, 'Build', 1, 1000)]),
        I(5, 3, 'SENT', '2026-02-01', '2026-03-01', [L(5, 'Build', 1, 1000)])],
        payments=pays)
    t1 = T('high-risk clients pay three points more late interest', '@core', fx1, """
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // 12% + 3 = 15% on 1,000.00 from 2026-03-08: 53 days
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        // in New York the legal maximum of 13% still caps it
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv4.interest}');
        // a client with no history pays the usual 12%
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv5.interest}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('{s:client3.overdue}');
""")
    note = None
    if revised:
        note = ("UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the risk score now averages days late, so the "
                "high-risk history is an invoice paid 46 days late; the interest rule is unchanged. Carries the test.")
    return Spec('cp179_risk_interest', 'higher interest for high-risk clients', """
        A HIGH-risk client's late interest rate is 3 percentage points above the rate that would otherwise
        apply (on invoices, instalments and milestones), still capped by their region's legal maximum. The
        band used for an invoice is the one its client's other invoices give, so an invoice's own late
        payment never raises its own rate.""",
        [t1], n, copy_note=note)


cp(179, 'risk_interest', """
    Slow payers cost me more to carry. Charge clients in the HIGH risk band late interest at 3 percentage
    points above their usual rate, on invoices, instalments and milestones alike; their region's legal
    maximum still caps it. Judge the band for an invoice on the client's other invoices, so an invoice's own
    late payment doesn't raise its own rate.
""", s179)

# =============================================================================== cp180 approval lets an invoice go over the credit limit


def s180(n):
    fx1 = dict(asOf=SA, clients=[C(A, creditLimit=1000)], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 900)]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Build', 1, 250)])])
    ap = plus(fx1, inv=[(2, dict(approvedTotal=250, approvedOn=SA))])
    s_ = sent(ap, [2], SA, '2026-04-30')
    t1 = T('an approved invoice may take the client over its limit', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // 900.00 + 250.00 would be over the 1,000.00 limit: it needs approval
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total=250.00');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
        // now over the limit, the client is on hold
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{sent:client1.available}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{sent:client1.status}');
""", ap=ap, sent=s_)
    return Spec('cp180_approved_over_limit', 'approval over the credit limit', """
        A draft that would take the client over their credit limit is no longer simply refused: it needs
        approval (shown "Needs approval"), and once approved it can be sent even though it takes them over;
        the client is then on hold for being over the limit. Send all drafts still leaves such drafts unless
        they are approved.""", [t1], n)


cp(180, 'approved_over_limit', """
    Sometimes a trusted client needs to go over their credit limit. Instead of always refusing, make a draft
    that would take the client over their limit need approval; once approved, let it be sent even though it
    takes them over (they then go on hold for being over the limit as usual). Send all drafts still leaves
    such drafts unless they've been approved.
""", s180, type_='mutative', mutates=[153], copies=['cp153_credit_limit'])

# =============================================================================== cp181 several purchase orders in one remittance


def s181(n):
    revised = n >= 184
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Refit', 1, 400)], poNumber='Marina Refit'),
        I(2, 1, 'SENT', '2026-03-01', '2026-05-15', [L(2, 'Paint', 1, 300)], poNumber='Hull Paint'),
        I(3, 1, 'SENT', '2026-03-01', '2026-05-20', [L(3, 'Deck', 1, 900)], poNumber='Deck Works')])
    a = plus(fx1, payments=[P(1, 1, 800, '2026-04-20', [(2, 300), (1, 400), (3, 100)], remittance='hull paint; marina refit')])
    t1 = T('pays each purchase order a remittance names, in order', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // two purchase orders: the hull paint first (300.00), then the marina refit (400.00); the last 100.00
        // goes on automatically, to the deck works
""" + pay('800', '2026-04-20', remittance='hull paint; marina refit') + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=2 amount=300.00',
          'PAYMENT_RECORDED id=1 invoice=1 amount=400.00',
          'PAYMENT_RECORDED id=1 invoice=3 amount=100.00',
        ]);
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{a:pay1.match}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match-score')).toHaveText('{a:pay1.matchScore}');
""", a=a)
    fx2 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(4, 1, 'SENT', '2026-03-01', '2026-05-31', [L(4, 'Paint', 1, 200)], poNumber='Hull Paint'),
        I(5, 1, 'SENT', '2026-03-01', '2026-05-15', [L(5, 'Paint', 1, 250)], poNumber='Hull Paint')])
    if revised:
        b = plus(fx2, payments=[P(1, 1, 450, '2026-04-20', [(5, 250), (4, 200)], remittance='hull paint; hull paint')])
        c = "the larger amount due first: invoice 5 (250.00), then invoice 4"
    else:
        b = plus(fx2, payments=[P(1, 1, 450, '2026-04-20', [(5, 250), (4, 200)], remittance='hull paint; hull paint')])
        c = "invoice 5, due first, then invoice 4"
    t2 = T('the same purchase order twice matches two invoices', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        // an invoice is matched only once: {c}
""" + pay('450', '2026-04-20', remittance='hull paint; hull paint') + """        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{b:pay1.match}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{b:inv5.status}');
""", b=b)
    note = None
    if revised:
        note = ("UPDATED for cp184 (mutates: [159, 181]): matching now needs 0.90 and equally good matches go to the "
                "larger amount due first; both tests' matches are exact, and invoice 5 is both due first and larger, "
                "so their results hold. Carries both tests.")
    return Spec('cp181_remittance_split', 'several purchase orders in one remittance', """
        Remittance text may name several purchase orders separated by semicolons. Each part is matched in turn
        as a remittance is, to an open invoice not already matched by an earlier part; the payment pays the
        matched invoices in that order, then the rest automatically. The payment row shows the matched invoice
        numbers and their similarities, comma separated, in that order.""", [t1, t2], n, copy_note=note)


cp(181, 'remittance_split', """
    One payment often covers several purchase orders, listed with semicolons. Match each part of the
    remittance in turn, the same way as a whole remittance, against the open invoices not already matched by
    an earlier part; pay the matched invoices in that order and apply the rest automatically. Show on the
    payment row all the matched invoice numbers and their similarities, comma separated, in order.
""", s181)

# =============================================================================== cp182 two approvals for the biggest invoices


def s182(n):
    st = {'taxRate': 10, 'approvalLimit': 5000}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 9100)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 9090.90)])])
    a1 = plus(fx1, inv=[(1, dict(approvedTotal=10010, approvedOn=SA, approvals=1))])
    a2 = plus(fx1, inv=[(1, dict(approvedTotal=10010, approvedOn=SA, approvals=2))])
    s_ = sent(a2, [1], SA, '2026-04-30')
    t1 = T('an invoice over twice the limit needs two approvals', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 9,100.00 + 10% = 10,010.00, more than twice the 5,000.00 limit
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a1:inv1.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a2:inv1.approval}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([
          'INVOICE_APPROVED id=1 total=10010.00',
          'INVOICE_APPROVED id=1 total=10010.00',
        ]);
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        // ONEAPP
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
""".replace("ONEAPP", "9,090.90 + 909.09 = 9,999.99 is more than one and a half times the limit: two approvals too" if n >= 200 else "9,090.90 + 909.09 = 9,999.99 is not more than twice the limit: one approval"), a1=a1, a2=a2, sent=s_)
    fx2 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 9100)], approvedTotal=10010, approvedOn=SA, approvals=2)])
    ch = plus(fx2, lines=[(3, L(4, 'Support', 1, 10))])
    t2 = T('a change after two approvals needs both again', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
""" + add_line('Support', 1, 10) + """        await expect(page.getByTestId('invoice-approval')).toHaveText('{ch:inv3.approval}');
""", ch=ch)
    note = None
    when = "more than twice the approval limit (as converted)"
    if n >= 200:
        note = ("UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): two approvals are now needed from one and a half "
                "times the limit, so the 9,999.99 invoice needs two as well (it needed one). Carries both tests.")
        when = ("more than one and a half times the approval limit (as converted), or that belongs to a HIGH-risk "
                "client,")
    return Spec('cp182_two_approvals', 'two approvals', f"""
        A draft whose grand total is {when} needs two approvals of the same total (invoices[].approvals counts
        them; each writes INVOICE_APPROVED): it shows "Needs 2 approvals", then "Needs 1 more approval", then
        "Approved", and can't be sent before. A change to the total needs both again.""", [t1, t2], n,
        copy_note=note)


cp(182, 'two_approvals', """
    The biggest invoices need a second approver. When a draft's grand total is more than twice the approval
    limit, require two approvals of that same total before it can be sent: show "Needs 2 approvals", then
    "Needs 1 more approval" after the first, then "Approved". Each approval writes INVOICE_APPROVED as usual.
    A change to the total afterwards needs both approvals again. An invoice approved before now, with no count
    of approvals kept, has one approval.
""", s182)

# =============================================================================== cp183 disputed amounts and the credit limit


def s183(n):
    fx1 = dict(asOf=SA, clients=[C(A, creditLimit=1000)], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Build', 1, 800)], disputedOn='2026-03-05'),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 150)]),
        I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Support', 1, 500)])])
    s_ = sent(fx1, [3], SA, '2026-04-30')
    t1 = T('amounts in dispute do not count against the credit limit', '@core', fx1, """
        // owed 950.00, but the 800.00 in dispute does not count: 850.00 of the 1,000.00 is available
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{s:client1.available}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv3.status}');
        // 1,450.00 owed, 650.00 of it counted: not over the limit, so not on hold
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{sent:client1.available}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{sent:client1.status}');
""", sent=s_)
    return Spec('cp183_dispute_credit_limit', 'disputes and the credit limit', """
        Amounts in dispute (whole invoices, lines or milestones) still count in the client's balance, but not
        against their credit limit: what is available, the check when sending and the automatic hold all use
        the balance less the amounts in dispute.""", [t1], n)


cp(183, 'dispute_credit_limit', """
    A client shouldn't lose their credit because of an invoice they're disputing. Keep amounts in dispute
    (whole invoices, lines or milestones) in their balance, but leave them out of everything to do with the
    credit limit: the amount available, the check when sending and the automatic hold all work on the
    balance less what is in dispute.
""", s183)

# =============================================================================== cp184 stricter remittance matching (revised)


def s184(n):
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Refit', 1, 400)], poNumber='Marina Refit'),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-01', [L(2, 'Lighting', 1, 900)], poNumber='Paint Lights'),
        I(3, 1, 'SENT', '2026-03-01', '2026-05-10', [L(3, 'Paint', 1, 150)], poNumber='Hull Paint'),
        I(4, 1, 'SENT', '2026-03-01', '2026-05-20', [L(4, 'Paint', 1, 450)], poNumber='Hull Paint')])
    a = plus(fx1, payments=[P(1, 1, 400, '2026-04-20', [(2, 400)], remittance='marina lights')])
    b = plus(a, payments=[P(2, 1, 450, '2026-04-20', [(4, 450)], remittance='Hull Paint')])
    t1 = T('matches only very similar purchase orders, the larger amount first', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // "marina lights" is 0.888 like "Marina Refit": under 0.90 now, so nothing matches and the payment
        // goes in the usual order, to the overdue invoice 2 first
""" + pay('400', '2026-04-20', remittance='marina lights') + """        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=400.00');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{a:pay1.match}');
        // two exact matches: the larger amount due (invoice 4, 450.00) before the earlier due date (invoice 3)
        await page.getByTestId('client-row-1').click();
""" + pay('450', '2026-04-20', remittance='Hull Paint') + """        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('{b:pay2.match}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{b:inv3.status}');
""", a=a, b=b)
    return Spec('cp184_remittance_revised', 'stricter remittance matching', """
        A remittance now matches a purchase order only at a Jaro-Winkler similarity of 0.90 or more, and of
        equally similar open invoices the one with the larger amount due is paid first (then the earlier due
        date, then the lower id).""", [t1], n)


cp(184, 'remittance_revised', """
    The remittance matching picks the wrong invoice too often. Only count a purchase order as matched at a
    similarity of 0.90 or more, and when invoices are equally similar pay the one with the larger amount due
    first (then the earlier due date, then the lower id).
""", s184, type_='mutative', mutates=[159, 181], algorithm='remittance-matching-revised',
   copies=['cp159_remittance_matching', 'cp181_remittance_split'])

# =============================================================================== cp185 deposits on milestones


def s185(n):
    num1 = invoice_number_luhn(1)
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 2000)],
          milestones=[MS(1, 'Start', 50), MS(2, 'Finish', 50)])],
        payments=[P(1, 1, 600, '2026-03-02', [], reference=num1), P(2, 1, 100, '2026-03-01', [])])
    s_ = sent(fx1, [1], SA, '2026-04-30')
    r = copy.deepcopy(s_)
    r['invoices'][0]['milestones'][0]['reachedOn'] = SA
    r['payments'][0]['allocations'] = [dict(invoiceId=1, amount=600, date=SA)]
    r['payments'][1]['allocations'] = [dict(invoiceId=1, amount=100, date=SA)]
    t1 = T('a deposit for a milestone invoice waits for its milestones', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-send').click();
        // nothing is owed on sending, so the 600.00 deposit held for it and the 100.00 of credit stay put
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent:client1.credit}');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
        // reaching the first milestone (1,000.00) uses the deposit held for the invoice first, then other
        // credit, even though that credit (2026-03-01) is older than the deposit (2026-03-02)
        await page.getByTestId('milestone-row-1').getByTestId('milestone-reach').click();
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=600.00',
          'PAYMENT_RECORDED id=2 invoice=1 amount=100.00',
        ]);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{r:inv1.due}');
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('{r:inv1.ms1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{r:client1.credit}');
""", sent=s_, r=r)
    return Spec('cp185_milestone_deposits', 'deposits on milestones', """
        Sending an invoice billed by milestones uses no credit (nothing is owed yet), and a deposit held for it
        stays held for it. Each time one of its milestones is reached, the deposits held for the invoice are
        used on it first (oldest first), then the client's other credit, as when an invoice is sent.""", [t1], n)


cp(185, 'milestone_deposits', """
    I take deposits against milestone jobs. When an invoice billed by milestones is sent, nothing is owed,
    so don't use any credit then, and keep a deposit held for it held for it. Each time a milestone is
    reached, use the deposits held for that invoice on it first (oldest first) and then the client's other
    credit, just as sending an invoice does.
""", s185)

# =============================================================================== cp186 yearly price rise on recurring invoices


def s186(n):
    revised = n >= 176
    st = {'taxRate': 10}
    fx1 = dict(asOf='2026-03-02', settings=st, clients=[C(A, upliftPct=4)], invoices=[
        I(1, 1, 'SENT', '2026-02-02', '2026-02-28',
          [L(1, 'Support plan', 1, 450, periodStart='2026-02-01', periodEnd='2026-02-28'),
           L(2, 'Licences', 3, 33.33, periodStart='2026-02-01', periodEnd='2026-02-28')],
          recurring=True, recurringSince='2025-03-01')])
    g = plus(fx1, invoices=[I(2, 1, 'SENT', '2026-03-02', '2026-04-30',
                              [L(3, 'Support plan', 1, 468, periodStart='2026-03-01', periodEnd='2026-03-31'),
                               L(4, 'Licences', 3, 34.66, periodStart='2026-03-01', periodEnd='2026-03-31')],
                              recurring=True, recurringFrom=1, recurringSince='2026-03-01')])
    fx2 = dict(asOf='2026-03-02', settings=st, clients=[A], invoices=[])
    new = plus(fx2, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', upliftPct=2.5)])
    t1 = T('raises recurring prices on each anniversary', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-generate').click();
        // March starts a year after the plan began on 2025-03-01, so the client's 4% rise applies to each unit
        // price, rounded half up: 450.00 -> 468.00, 33.33 -> 34.6632 -> 34.66
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('{g:inv2.line3.unitPrice}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('{g:inv2.line4.unitPrice}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{g:inv2.line4.amount}');
        // it needs no approval, so it is sent at once
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{g:inv2.status}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number={g:inv2.number} total={g:inv2.grand|plain}');
""", g=g)
    t2 = T('sets the yearly rise when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-uplift-pct').fill('2.5');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Umbrella Co');
""", new=new)
    return Spec('cp186_recurring_uplift', 'yearly price rise', """
        A client can have a yearly price rise (clients[].upliftPct, on the client form). A recurring invoice
        knows when its plan began (invoices[].recurringSince: the first period's start when it is first made
        recurring, kept by the drafts it generates). When Generate makes a period that starts on or after the
        next anniversary of that date, each typed unit price on the copied lines goes up by the client's
        percentage, rounded half up to the cent, and the new draft's plan date moves on a year; lines priced
        from a rate card or the price list keep that price.""", [t1, t2], n)


cp(186, 'recurring_uplift', """
    Plans go up once a year. Let me set a yearly price rise for a client (a percentage on the client form).
    A recurring invoice remembers when its plan began (the first period's start when I make it recurring;
    the drafts it generates keep it). When Generate makes a period starting on or after the next
    anniversary of that date, raise each typed unit price on the copied lines by the client's percentage,
    rounded half up to the cent, and move the plan date on a year. Lines priced from a rate card or the
    price list keep that price.
""", s186)

# =============================================================================== cp187 early discount for low-risk clients only


def s187(n):
    revised = n >= 192
    ep = dict(earlyPayPct=2, earlyPayDays=10)
    if revised:
        hist = [I(1, 1, 'SENT', '2025-12-01', '2025-12-31', [L(1, 'Design', 1, 100)])]
        hp = [P(1, 1, 110, '2026-01-08', [(1, 110)])]      # 8 days late: 8.0, MEDIUM
        hc = "paid an invoice 8 days late (8.0, MEDIUM)"
    else:
        hist = [I(1, 1, 'SENT', '2025-12-01', '2026-01-31', [L(1, 'Design', 1, 100)])]
        hp = [P(1, 1, 110, '2025-12-21', [(1, 110)])]      # 20 days: 20.0, MEDIUM
        hc = "took 20 days to pay its last invoice (20.0, MEDIUM)"
    fx1 = dict(asOf='2026-03-05', settings={'taxRate': 10}, clients=[C(A, **ep), C(G, **ep)], invoices=hist + [
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 1000)]),
        I(3, 2, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 1000)])], payments=hp)
    st3 = num(V(fx1, n)['inv3.settle'])
    a = plus(fx1, payments=[P(2, 2, st3, '2026-03-05', [(3, st3)])])
    t1 = T('only low-risk clients get the early-payment discount', '@core', fx1, f"""
        // Acme {hc}: no early discount
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{{s:client1.riskBand}}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv2.due}}');
        // Globex has no history (LOW): 2% of the 1,000.00 before tax comes off if paid now
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{{s:inv3.settle}}');
""" + pay('{s:inv3.settle|plain}', '2026-03-05') + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{a:inv3.earlyDiscount}');
""", a=a)
    note = None
    if revised:
        note = ("UPDATED for cp192 (mutates: [161, 162, 174, 179, 187]): the risk score now averages days late, so "
                "Acme's history is an invoice paid 8 days late (MEDIUM); the early-discount rule is unchanged. "
                "Carries the test.")
    return Spec('cp187_early_discount_low_risk', 'early discount for low-risk clients', """
        Only clients in the LOW risk band get the early-payment discount: a MEDIUM or HIGH client's invoices
        show no settle amount and are owed in full, however early they are paid. The band used for an invoice
        is the one the client's other invoices give.""", [t1], n, copy_note=note)


cp(187, 'early_discount_low_risk', """
    Early-payment discounts are wasted on slow payers. Only give the early-payment discount to clients in
    the LOW risk band; for MEDIUM and HIGH clients show no settle amount and expect the full amount however
    early they pay. Judge the band for an invoice on the client's other invoices.
""", s187)

# =============================================================================== cp188 smallest amounts first


def s188(n):
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 40)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-05-31', [L(2, 'Build', 1, 200)]),
        I(3, 1, 'SENT', '2026-03-15', '2026-05-15', [L(3, 'Support', 1, 30)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Training', 1, 150)])])
    a = plus(fx1, payments=[P(1, 1, 200, '2026-04-20', [(1, 40), (3, 30), (4, 130)])])
    b = plus(a, payments=[P(2, 1, 100, '2026-04-20', [(4, 20), (2, 80)])])
    t1 = T('after the overdue invoices, pays the smallest amounts first', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
""" + pay('200', '2026-04-20') + """        // the overdue invoice 1 (40.00) first; then the smallest amount due first: invoice 3 (30.00), then
        // 130.00 of invoice 4 (150.00); invoice 2 (200.00) gets nothing (largest first would have put 160.00 on it)
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
          'PAYMENT_RECORDED id=1 invoice=3 amount=30.00',
          'PAYMENT_RECORDED id=1 invoice=4 amount=130.00',
        ]);
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{a:inv4.status}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}'); // 200.00 + 20.00
        // named invoices are paid the same way: invoice 4's last 20.00 before invoice 2
""" + pay('100', '2026-04-20', ref=f"{invoice_number_luhn(2)}, {invoice_number_luhn(4)}") + """        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED id=2'))).toEqual([
          'PAYMENT_RECORDED id=2 invoice=4 amount=20.00',
          'PAYMENT_RECORDED id=2 invoice=2 amount=80.00',
        ]);
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}'); // 200.00 - 80.00
""", a=a, b=b)
    return Spec('cp188_smallest_first', 'smallest amounts first', """
        A payment applied automatically, across several references, or by Apply credit pays the overdue
        invoices first (oldest due date first, lower id on the same date), then the rest from the smallest
        amount due to the largest (lower id on the same amount), each paid off before the next; disputed
        amounts still come last.""", [t1], n)


cp(188, 'smallest_first', """
    I'd rather close invoices than leave lots of them part paid. When a payment is spread automatically,
    across several references, or by Apply credit, still pay overdue invoices first (oldest due date
    first), but then pay the smallest amount due first instead of the largest (lower id on equal amounts),
    each paid off before the next. Disputed invoices still come last.
""", s188, type_='mutative', mutates=[22, 24, 50, 64, 81, 159], copies=['cp159_remittance_matching'],
   retires=['cp64_allocation_priority.spec.ts::pays overdue invoices first, then the largest'])

# =============================================================================== cp189 plans judged on their total


def s189(n):
    st = {'approvalLimit': 1000}
    fx1 = dict(asOf='2026-01-31', settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 980)]),
        I(2, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(2, 'Consulting', 1, 980)])])
    a = plus(fx1, inv=[(1, dict(instalments=6, instalmentRate=12))])
    v = V(a, n)
    ap = plus(a, inv=[(1, dict(approvedTotal=num(v['inv1.planTotal']), approvedOn='2026-01-31'))])
    b = plus(ap, inv=[(2, dict(instalments=2, instalmentRate=0))])
    t1 = T('an instalment plan is judged on what it will collect', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}'); // 980.00 is within the limit
        await page.getByTestId('plan-form-count').fill('6');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-submit').click();
        // 980 x 0.01 / (1 - 1.01^-6) = 169.10, rounded up to 170.00 a month: the plan collects more than 1,000.00
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{a:inv1.planTotal}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={ap:inv1.planTotal|plain}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{ap:inv1.approval}');
        // an interest-free plan collects just the 980.00
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('plan-form-count').fill('2');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{b:inv2.approval}');
""", a=a, ap=ap, b=b)
    return Spec('cp189_plan_approval', 'plans judged on their total', """
        A draft with an instalment plan is judged for approval on the plan total (with its interest and plan
        fee) instead of the grand total, and an approval of it is for that plan total (INVOICE_APPROVED
        total=<plan total>); changing the plan changes the amount to approve.""", [t1], n)


cp(189, 'plan_approval', """
    An instalment plan can collect a good deal more than the invoice. For a draft with a plan, check the
    approval limit against the plan total (interest and plan fee included) rather than the grand total, and
    approve that plan total (INVOICE_APPROVED total=<plan total>), so changing the plan needs approving
    again.
""", s189)

# =============================================================================== cp190 approved drafts use up the credit limit


def s190(n):
    fx1 = dict(asOf=SA, clients=[C(A, creditLimit=1000)], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 300)]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Build', 1, 500)], discountPct=25, approvedTotal=375,
          approvedOn=SA),
        I(3, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Support', 1, 300)]),
        I(4, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(4, 'Hosting', 1, 50)])])
    s_ = sent(fx1, [3], SA, '2026-04-30')
    t1 = T('approved drafts count against the credit limit', '@core', fx1, """
        // 300.00 owed and the approved draft's 375.00 committed: 325.00 of the 1,000.00 is left
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{s:client1.available}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{sent:client1.available}');
        // 600.00 + 375.00 + 50.00 would pass the limit: the small draft now needs approval
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{sent:inv4.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
""", sent=s_)
    return Spec('cp190_committed_credit', 'approved drafts and the credit limit', """
        A client's approved drafts are commitments: what they will add to the balance (grand total less
        withholding) is taken off what is available under the credit limit, and counted when judging whether
        another draft would take the client over it. Sending an approved draft moves it from committed to
        owed.""", [t1], n)


cp(190, 'committed_credit', """
    An approved draft is as good as sent, so count it against the client's credit limit: take what each
    approved draft will add to the balance (grand total less withholding) off the amount available, and
    include it when judging whether another draft would take the client over their limit. Once an approved
    draft is sent it simply moves from committed to owed.
""", s190)

# =============================================================================== cp191 approvals that last by tier


def s191(n):
    st = {'approvalLimit': 1000}
    on = lambda d_: dict(approvedTotal=1500, approvedOn=d_)
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, tier='KEY'), C(G, tier='NEW'), IN], invoices=[
        I(1, 1, 'DRAFT', '2026-01-05', '2026-04-30', [L(1, 'Build', 1, 1500)], **on('2026-01-09')),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 1500)], **on('2026-03-02')),
        I(3, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 1500)], **on('2026-03-03')),
        I(4, 3, 'DRAFT', '2026-02-01', '2026-04-30', [L(4, 'Build', 1, 1500)], **on('2026-02-07'))])
    t1 = T("an approval lasts as long as the client's tier allows", '@core', fx1, """
        // a key account's approval lasts 90 days: given 60 days ago, still good
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        // a new client's lasts 7: 8 days ago has lapsed, 7 days ago has not
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        // everyone else keeps 30 days: 31 days ago has lapsed
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
""")
    return Spec('cp191_approval_expiry_tier', 'approvals that last by tier', """
        How long an approval lasts depends on the client's tier: 90 days for KEY clients, 7 days for NEW
        clients and 30 days for everyone else, counted from the day it was given.""", [t1], n)


cp(191, 'approval_expiry_tier', """
    Approvals for key accounts lapse too quickly, and new clients' too slowly. Let an approval last 90 days
    for a KEY client and only 7 days for a NEW client; everyone else keeps 30 days, counted from the day it
    was given.
""", s191)

# =============================================================================== cp192 risk from days late (revised)


def s192(n):
    st = {'taxRate': 0}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2025-10-01', '2025-11-30', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2025-11-01', '2025-12-31', [L(2, 'Design', 1, 100)]),
        I(3, 1, 'SENT', '2025-12-01', '2026-01-31', [L(3, 'Design', 1, 100)]),
        I(4, 2, 'SENT', '2026-01-01', '2026-01-15', [L(4, 'Design', 1, 100)]),
        I(5, 2, 'SENT', '2026-01-10', '2026-01-31', [L(5, 'Design', 1, 100)])],
        payments=[P(1, 1, 100, '2025-11-30', [(1, 100)]), P(2, 1, 100, '2026-01-10', [(2, 100)]),
                  P(3, 1, 100, '2026-02-04', [(3, 100)]), P(4, 2, 100, '2026-01-20', [(4, 100)]),
                  P(5, 2, 100, '2026-02-20', [(5, 100)])])
    t1 = T('scores how late a client pays', '@core', fx1, """
        // Acme took 60, 70 and 65 days to pay (it was HIGH), but paid 0, 10 and 4 days late:
        // 0, then 0.5 x 10 + 0.5 x 0 = 5, then 0.5 x 4 + 0.5 x 5 = 4.5: LOW (under 5)
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{s:client1.riskScore}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        // Globex paid 5 and 20 days late: 5, then 0.5 x 20 + 0.5 x 5 = 12.5: MEDIUM (under 15)
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('{s:client2.riskScore}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{s:client2.riskBand}');
""")
    return Spec('cp192_risk_days_late', 'risk from days late', """
        The payment risk score now uses how late each invoice paid in full was paid: the paid date less the due
        date, 0 when paid by the due date, averaged oldest payment first with a weight of 0.5 (the first value,
        then 0.5 x the next + 0.5 x the average so far), to one decimal half up. The bands are LOW under 5
        days, MEDIUM under 15 and HIGH from 15.""", [t1], n)


cp(192, 'risk_days_late', """
    Days to pay punishes clients I give long terms to. Base the risk score on how late each invoice paid in
    full was paid instead: its paid date less its due date, 0 if paid on time. Average them oldest payment
    first with a weight of 0.5 (start with the first; then each next one counts half and the average so far
    half), to one decimal rounded half up, and band them LOW under 5 days late, MEDIUM under 15, HIGH from
    15. Everything that uses the band uses the new one.
""", s192, type_='mutative', mutates=[161, 162, 174, 179, 187], algorithm='payment-risk-score-revised',
   copies=['cp161_payment_risk_score', 'cp162_risk_deposit', 'cp174_risk_terms', 'cp179_risk_interest',
           'cp187_early_discount_low_risk'])

# =============================================================================== cp193 write-offs count against the score


def s193(n):
    fx1 = dict(asOf='2026-04-30', clients=[A], invoices=[
        I(1, 1, 'SENT', '2025-12-01', '2025-12-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-01-01', '2026-01-31', [L(2, 'Design', 1, 300)], writtenOffOn='2026-03-12'),
        I(3, 1, 'DRAFT', '2026-04-20', '2026-05-31', [L(3, 'Build', 1, 200)])],
        payments=[P(1, 1, 100, '2026-01-02', [(1, 100)])])
    t1 = T('a written-off invoice counts as paid very late', '@core', fx1, """
        // paid 2 days late, then invoice 2 written off on 2026-03-12, 40 days late: 2, then 0.5 x 40 + 0.5 x 2
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{s:client1.riskScore}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        // HIGHC
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
""".replace("HIGHC", "HIGH: the draft needs two approvals" if n >= 200 else "HIGH: the draft needs approval"))
    note = None
    if n >= 200:
        note = ("UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): every invoice of a high-risk client now needs two "
                "approvals, so the draft shows Needs 2 approvals. Carries the test.")
    return Spec('cp193_risk_write_offs', 'write-offs and the risk score', """
        An invoice written off by hand counts in the client's risk score as if it had been paid on the day it
        was written off (so as late as that was).""", [t1], n, copy_note=note)


cp(193, 'risk_write_offs', """
    A client whose invoice I had to write off shouldn't look like a good payer. Count an invoice written off
    by hand in the risk score as if it had been paid on the day it was written off.
""", s193)

# =============================================================================== cp194 half the approval limit for medium risk


def s194(n):
    st = {'approvalLimit': 1000, 'usdPer': RATES}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, C(G, currency='EUR'), IN], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Design', 1, 100)]),
        I(2, 2, 'SENT', '2026-01-01', '2026-01-31', [L(2, 'Design', 1, 100)]),
        I(3, 1, 'DRAFT', '2026-04-20', '2026-05-31', [L(3, 'Build', 1, 600)]),
        I(4, 2, 'DRAFT', '2026-04-20', '2026-05-31', [L(4, 'Build', 1, 455)]),
        I(5, 3, 'DRAFT', '2026-04-20', '2026-05-31', [L(5, 'Build', 1, 600)])],
        payments=[P(1, 1, 100, '2026-02-10', [(1, 100)]), P(2, 2, 100, '2026-02-10', [(2, 100)])])
    t1 = T('a medium-risk client has half the approval limit', '@core', fx1, """
        // paid 10 days late: MEDIUM, so 500.00 instead of 1,000.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        // in euros: 500 / 1.10 = 454.5454, down to €454.54, and €455.00 is over it
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
        // a LOW client keeps the whole limit
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv5.approval}');
""")
    return Spec('cp194_medium_risk_limit', 'half the limit for medium risk', """
        A MEDIUM-risk client's approval limit is half of the one that would otherwise apply (the workspace's
        or their tier's), in US dollars before it is converted to their currency.""", [t1], n)


cp(194, 'medium_risk_limit', """
    Clients in the MEDIUM risk band should need approval sooner. Halve their approval limit (the workspace's
    or their tier's, halved in US dollars before converting it to their currency).
""", s194)

# =============================================================================== cp195 the undisputed part of an invoice is paid in turn


def s195(n):
    st = {'lateInterestRate': 0}
    fx1 = dict(asOf='2026-04-30', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Build', 1, 600), L(2, 'Travel', 1, 200, disputed=True)],
          disputedOn='2026-04-10'),
        I(2, 1, 'SENT', '2026-04-01', '2026-05-31', [L(3, 'Design', 1, 150)])])
    a = plus(fx1, payments=[P(1, 1, 900, '2026-04-30', [(1, 600), (2, 150), (1, 150)])])
    t1 = T('pays the undisputed part of an invoice in turn and its disputed part last', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
""" + pay('900', '2026-04-30') + """        // the overdue invoice 1's undisputed 600.00 first, then invoice 2 (150.00); only then 150.00 of the
        // travel line in dispute
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=600.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=150.00',
          'PAYMENT_RECORDED id=1 invoice=1 amount=150.00',
        ]);
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{a:inv1.disputed}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
""", a=a)
    return Spec('cp195_disputed_part_last', 'the disputed part paid last', """
        When a payment is applied automatically or by Apply credit, an invoice with only some lines in dispute
        has its undisputed part paid in the usual order; its disputed part waits with the disputed invoices
        and is paid only after every undisputed amount. Each part paid writes its own PAYMENT_RECORDED.""",
        [t1], n)


cp(195, 'disputed_part_last', """
    An invoice with one disputed line shouldn't hold up the rest. When a payment is spread automatically or
    by Apply credit, pay the undisputed part of a partly disputed invoice in the usual order, and leave its
    disputed part with the disputed invoices, to be paid only after everything undisputed. Write a
    PAYMENT_RECORDED for each part paid.
""", s195)

# =============================================================================== cp196 milestone shares rounded down (revised split)


def s196(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 3333.34)],
          milestones=[MS(1, 'Design', 35), MS(2, 'Build', 35), MS(3, 'Handover', 30)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 999.99)],
          milestones=[MS(4, 'Start', 30), MS(5, 'Middle', 30), MS(6, 'End', 40)])])
    t1 = T("rounds each milestone's share down and gives the last one the rest", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 3,666.67 split 35/35/30: 1,283.3345 and 1,283.3345 round down to 1,283.33; the last takes
        // 3,666.67 - 2,566.66 = 1,100.01 (the largest remainder would have put the cent on the first)
        await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-amount')).toHaveText('{s:inv1.ms1.amount}');
        await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('{s:inv1.ms2.amount}');
        await expect(page.getByTestId('milestone-row-3').getByTestId('milestone-amount')).toHaveText('{s:inv1.ms3.amount}');
        // 1,099.99 split 30/30/40: 329.997 -> 329.99 twice, and the last 440.01
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-amount')).toHaveText('{s:inv2.ms4.amount}');
        await expect(page.getByTestId('milestone-row-6').getByTestId('milestone-amount')).toHaveText('{s:inv2.ms6.amount}');
""")
    return Spec('cp196_milestone_rounding', 'milestone shares rounded down', """
        A milestone's amount is now its percentage of what the client pays (grand total less withholding),
        rounded down to the cent, except the last milestone, which takes whatever is left so they add up
        exactly.""", [t1], n)


cp(196, 'milestone_rounding', """
    My client's accounts team checks milestone amounts with a calculator and the stray cent confuses them.
    Work each milestone out as its percentage of what the client pays, rounded down to the cent, and let
    the last milestone take whatever is left so they still add up exactly.
""", s196, type_='mutative', mutates=[169], copies=['cp169_milestones'])

# =============================================================================== cp197 ending a plan early credits the unused days


def s197(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-02', '2026-03-31',
          [L(1, 'Support plan', 1, 450, periodStart='2026-03-01', periodEnd='2026-03-31'), L(2, 'Setup', 1, 120)],
          recurring=True)])
    cn = plus(fx1, inv=[(1, dict(recurUntil='2026-03-15'))],
              invoices=[I(2, 1, 'SENT', SA, SA, [L(3, 'Support plan', 1, 450, periodStart='2026-03-16',
                                                    periodEnd='2026-03-31', creditOfLine=1)], creditOf=1)])
    t1 = T('ending a plan inside a billed period credits the days after it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-recur-until').fill('2026-03-15');
        await page.getByTestId('invoice-recur-until-submit').click();
        // March was billed in full; 2026-03-16 to 2026-03-31 is credited: 16 days at 450 x 12 / 365 = 236.71,
        // plus 10% tax like the original. The one-off setup is not credited
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={cn:inv2.number} invoice=1 total={cn:inv2.grand|plain}');
        await expect(page.getByTestId('invoice-credited')).toHaveText('{cn:inv1.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{cn:inv1.due}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-period')).toHaveText('2026-03-16 to 2026-03-31');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{cn:inv2.line3.amount}');
        // and the plan has ended: nothing more to generate
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
""", cn=cn)
    return Spec('cp197_recurring_cancel_credit', 'ending a plan early', """
        Setting a recurring invoice's end date before the end of a period it has already billed issues a
        credit note, dated today, for the days after the end date: each line with a service period is credited
        for the part of its period after the end date, charged by the day and taxed like the original (lines
        without a period are not credited). It is issued like any credit note (CREDIT_NOTE_ISSUED, any excess
        held as credit), and the plan ends.""", [t1], n)


cp(197, 'recurring_cancel_credit', """
    When a client cancels mid-month I owe them the rest of the month. If I set a recurring invoice's end date
    before the end of a period it has already billed, issue a credit note dated today for the days after the
    end date: each line with a service period credited for the part of its period after that date, charged
    by the day and taxed like the original (one-off lines aren't credited). Issue it like any credit note,
    with anything beyond what the invoice owes held as credit, and the plan ends there.
""", s197)

# =============================================================================== cp198 half the credit limit for high-risk clients


def s198(n):
    fx1 = dict(asOf='2026-04-30', clients=[C(A, creditLimit=2000), C(G, creditLimit=2000)], invoices=[
        I(1, 1, 'SENT', '2026-01-01', '2026-01-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-04-01', '2026-05-31', [L(2, 'Build', 1, 600)]),
        I(3, 1, 'DRAFT', '2026-04-20', '2026-05-31', [L(3, 'Support', 1, 500)]),
        I(4, 2, 'SENT', '2026-04-01', '2026-05-31', [L(4, 'Build', 1, 600)])],
        payments=[P(1, 1, 100, '2026-02-20', [(1, 100)])])
    t1 = T("a high-risk client's credit limit counts as half", '@core', fx1, """
        // Acme paid its last invoice 20 days late: HIGH, so its 2,000.00 limit counts as 1,000.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{s:client1.available}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // 600.00 + 500.00 is over 1,000.00 (though well within 2,000.00): APPC
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        // Globex has no history: all of its 2,000.00
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{s:client2.available}');
""".replace('APPC', 'it needs approval, two for a HIGH client' if n >= 200 else 'it needs approval'))
    note = None
    if n >= 200:
        note = ("UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): every invoice of a high-risk client now "
                "needs two approvals, so the draft over the halved limit shows Needs 2 approvals. Carries the test.")
    return Spec('cp198_high_risk_limit', 'half the credit limit for high risk', """
        A HIGH-risk client's credit limit counts as half of what is set, rounded down to the cent, for what is
        available, the check when sending and the automatic hold.""", [t1], n, copy_note=note)


cp(198, 'high_risk_limit', """
    I don't want a slow payer running up as much as a good one. For a client in the HIGH risk band, count
    their credit limit as half of what I set (rounded down to the cent): for what is available, the check
    when sending and the automatic hold.
""", s198)

# =============================================================================== cp199 a long dispute puts the client on hold


def s199(n):
    fx1 = dict(asOf=SA, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-01-10', '2026-02-10', [L(1, 'Build', 1, 800)], disputedOn='2026-02-06'),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Design', 1, 100)]),
        I(3, 2, 'SENT', '2026-02-10', '2026-03-31', [L(3, 'Build', 1, 800)], disputedOn='2026-02-15')])
    r = plus(fx1, inv=[(1, dict(disputeResolvedOn=SA))])
    s_ = sent(r, [2], SA, '2026-04-30')
    t1 = T('a dispute left open over 30 days puts the client on hold', '@core', fx1, """
        // Acme's dispute has been open since 2026-02-06, 32 days: on hold
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{s:client1.status}');
        // Globex's since 2026-02-15, 23 days: not yet
        await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('{s:client2.status}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        // resolving the dispute lifts the hold
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-resolve').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{r:client1.status}');
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
""", r=r, sent=s_)
    return Spec('cp199_dispute_hold', 'long disputes put clients on hold', """
        A client with a dispute (an invoice, its lines or a milestone) still open more than 30 days after it was
        raised is on hold automatically, with all that a hold means, until it is resolved.""", [t1], n)


cp(199, 'dispute_hold', """
    A dispute dragging on for a month means something is wrong with the relationship. Put a client on hold
    automatically while any of their disputes (a whole invoice, some lines or a milestone) has been open for
    more than 30 days, and lift it once that dispute is resolved.
""", s199)

# =============================================================================== cp200 two approvals sooner


def s200(n):
    st = {'approvalLimit': 1000}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, G], invoices=[
        I(1, 1, 'DRAFT', '2026-04-20', '2026-05-31', [L(1, 'Build', 1, 1600)]),
        I(2, 1, 'DRAFT', '2026-04-20', '2026-05-31', [L(2, 'Build', 1, 1400)]),
        I(3, 2, 'SENT', '2026-01-01', '2026-01-31', [L(3, 'Design', 1, 100)]),
        I(4, 2, 'DRAFT', '2026-04-20', '2026-05-31', [L(4, 'Hosting', 1, 80)])],
        payments=[P(1, 2, 100, '2026-02-25', [(3, 100)])])
    a = plus(fx1, inv=[(1, dict(approvedTotal=1600, approvedOn='2026-04-30', approvals=1))])
    t1 = T('two approvals from one and a half times the limit, and for high-risk clients', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // 1,600.00 is more than one and a half times the 1,000.00 limit (but not twice it)
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        // 1,400.00 is not: one approval
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv2.approval}');
        // Globex paid 25 days late (HIGH): even 80.00 takes two approvals
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{a:client2.riskBand}');
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv4.approval}');
""", a=a)
    return Spec('cp200_two_approvals_sooner', 'two approvals sooner', """
        Two approvals are now needed for a draft whose grand total (or plan total) is more than one and a half
        times the approval limit, instead of twice, and for every invoice of a HIGH-risk client.""", [t1], n)


cp(200, 'two_approvals_sooner', """
    Two approvers should look at more invoices. Require two approvals once a draft's total (its plan total if
    it has a plan) is more than one and a half times the approval limit rather than twice, and for every
    invoice of a client in the HIGH risk band, whatever its size.
""", s200, type_='mutative', mutates=[162, 174, 182, 193, 198],
   copies=['cp162_risk_deposit', 'cp174_risk_terms', 'cp182_two_approvals', 'cp193_risk_write_offs',
           'cp198_high_risk_limit'])
