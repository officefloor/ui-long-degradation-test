"""Act V checkpoints."""
from lib5 import *  # noqa
from cps3 import RATES, KK, HV, IN, RT, RC, cash_pay, tax_lines  # noqa
from cps4 import add_line, pay, open_inv, MS  # noqa

SA = '2026-06-10'          # a Wednesday
NY = {'taxRate': 10, 'regionTaxRates': {'NY': 8.875}}
UM = {'id': 4, 'name': 'Umbrella Co', 'email': 'ap@umbrella.example'}


def edit_line(lid, qty=None, price=None, desc=None, pct=None):
    out = f"        await page.getByTestId('line-row-{lid}').getByTestId('line-edit').click();\n"
    if desc is not None:
        out += f"        await page.getByTestId('line-form-description').fill('{desc}');\n"
    if qty is not None:
        out += f"        await page.getByTestId('line-form-qty').fill('{qty}');\n"
    if price is not None:
        out += f"        await page.getByTestId('line-form-unit-price').fill('{price}');\n"
    if pct is not None:
        out += f"        await page.getByTestId('line-form-percent').fill('{pct}');\n"
    out += "        await page.getByTestId('line-form-submit').click();\n"
    return out


def remove_line(lid):
    return f"        await page.getByTestId('line-row-{lid}').getByTestId('line-remove').click();\n"


def send():
    return "        await page.getByTestId('invoice-send').click();\n"


def send_refused():
    return ("        await page.getByTestId('invoice-send').click();\n"
            "        await expect(page.getByTestId('invoice-send-error')).toBeVisible();\n")


def see(tid, val, row=None, note=''):
    loc = f"page.getByTestId('{row}').getByTestId('{tid}')" if row else f"page.getByTestId('{tid}')"
    c = f' // {note}' if note else ''
    return f"        await expect({loc}).toHaveText('{val}');{c}\n"


def gone(*ids):
    return ''.join(f"        await expect(page.getByTestId('{i}')).toHaveCount(0);\n" for i in ids)


def recorded(state, pid, ccy='USD', only=None):
    """The PAYMENT_RECORDED lines for payment pid's allocations in state, in order, as a toEqual block."""
    p = next(x for x in state['payments'] if x['id'] == pid)
    out = ["        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([\n"]
    for a in p['allocations']:
        if only is None or a['invoiceId'] in only:
            amt = M.plain(M.mr(M.D(str(a['amount'])), M.dec_of(ccy)), ccy)
            out.append(f"          'PAYMENT_RECORDED id={pid} invoice={a['invoiceId']} amount={amt}',\n")
    out.append("        ]);\n")
    return ''.join(out)


def audit(line):
    return f"        await expect.poll(() => auditLines()).toContain('{line}');\n"


# =============================================================================== cp201 sent snapshot


def s201(n):
    adj = n >= 204
    st = dict(NY)
    cl = C(A, region='NY', withholdingPct=10)
    fx1 = dict(asOf=SA, settings=st, clients=[cl], invoices=[
        I(1, 1, 'SENT', '2026-05-04', '2026-06-30', [L(1, 'Build', 1, 1000)], sentTotal=1087.5, sentTax=87.5),
        I(2, 1, 'DRAFT', '2026-06-01', '2026-06-30', [L(2, 'Support', 1, 500)])])
    p = pay5(fx1, P(1, 1, 987.5, SA, []), n, open_id=1)
    s_ = sent5(p, [2], n)
    t1 = T('a sent invoice keeps the total it was sent with', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // sent at 8.75%: 1,000.00 + 87.50; New York's rate is 8.875% now, which would make it 1,088.75
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{s:inv1.sentTotal}');
        await expect(page.getByTestId('invoice-current-total')).toHaveText('{s:inv1.currentTotal}');
        // 10% of the 1,000.00 before tax is withheld: the client owes 987.50
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv1.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
""" + pay('987.50', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=987.50');
        // a draft is priced at today's 8.875%: 500.00 + 44.375 -> 44.38; sending keeps that
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{p:inv2.grand}');
""" + send() + """        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{sent:inv2.sentTotal}');
        await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number={sent:inv2.number} total={sent:inv2.grand|plain}');
""", p=p, sent=s_)
    fx2 = dict(asOf=SA, settings=st, clients=[C(A, region='NY')], invoices=[
        I(3, 1, 'SENT', '2026-05-04', '2026-06-30', [L(3, 'Design', 1, 500)], sentTotal=545, sentTax=45)])
    if adj:
        a = add5(fx2, 3, L(0, 'Extra pages', 1, 100), n)
        body = """        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // sent at 9%: 545.00, where today's 8.875% would give 544.38
        await expect(page.getByTestId('invoice-current-total')).toHaveText('{s:inv3.currentTotal}');
""" + add_line('Extra pages', 1, 100) + """        // the invoice stays as sent; the extra line is billed on an adjustment note, taxed like the
        // invoice's lines at New York's 8.875%: 100.00 + 8.88
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv3.grand}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv3.adjusted}');
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={a:inv4.number} invoice=3 total={a:inv4.grand|plain}');
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-total')).toHaveText('{a:inv4.listTotal}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
"""
        title = 'a line added to a sent invoice leaves its sent total alone'
        states = dict(a=a)
    else:
        r = plus(fx2, lines=[(3, L(4, 'Extra pages', 1, 100))], inv=[(3, dict(status='DRAFT', sentTotal=None, sentTax=None))])
        s2 = sent5(r, [3], n)
        body = """        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // sent at 9%: 545.00, where today's 8.875% would give 544.38
        await expect(page.getByTestId('invoice-current-total')).toHaveText('{s:inv3.currentTotal}');
""" + add_line('Extra pages', 1, 100) + """        // changing it reopens it as a draft, priced and taxed today: 600.00 + 53.25
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv3.status}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{r:inv3.grand}');
        await expect(page.getByTestId('invoice-sent-total')).toHaveCount(0);
""" + send() + """        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{sent:inv3.sentTotal}');
        await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
"""
        title = "reopening a sent invoice lets it be sent again at today's figures"
        states = dict(r=r, sent=s2)
    t2 = T(title, '@core', fx2, body, **states)
    note = None
    if adj:
        note = ("UPDATED for cp204 (mutates: [16, 31, 42, 201]): a sent invoice is no longer reopened by a line change; "
                "the added line is billed on an adjustment note, so the second test now checks the invoice keeping "
                "its sent total and the note's total. Carries both tests (the second renamed).")
    return Spec('cp201_sent_snapshot', 'a sent invoice keeps what it was sent with', """
        Sending an invoice keeps what it was sent with: its grand total and tax (invoices[].sentTotal, sentTax).
        From then on the invoice is worth exactly that, whatever prices, rates or the client's details later
        say: its grand total, tax, amount before tax and everything worked out from them (withholding, amount
        due, late interest, the client's balance) use the figures it was sent with. The panel shows the sent
        total, and, only when today's rules would give a different grand total, that total as the current
        total. A sent invoice with no recorded figures is worth what its lines work out to.""", [t1, t2], n,
        copy_note=note)


cp(201, 'sent_snapshot', """
    Once an invoice has gone out, its figures must not move. When an invoice is sent, keep the grand total
    and tax it was sent with, and from then on treat the invoice as worth exactly that, even if prices, tax
    rates or the client's details change later: its grand total, tax and amount before tax, and everything
    worked out from them (withholding, the amount due, late interest, the client's balance), use the sent
    figures. Show the sent total on a sent invoice, and when the rules today would give a different grand
    total, show that as the current total too (otherwise don't show one). Drafts carry on being worked out
    with today's rules.
""", s201)

# =============================================================================== cp202 duplicate fingerprint


def s202(n):
    rev = n >= 208
    st = {'taxRate': 10, 'duplicateDays': 60}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-05-20', '2026-06-30', [L(1, 'Web design', 2, 500), L(2, 'Hosting', 1, 80)]),
        I(2, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(3, 'Hosting', 1, 80)]),
        I(3, 2, 'SENT', '2026-05-20', '2026-06-30', [L(4, 'Web design', 2, 500), L(5, 'Hosting', 1, 80)]),
        I(4, 1, 'SENT', '2026-03-02', '2026-03-31', [L(6, 'Audit', 1, 300)]),
        I(5, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(7, 'Audit', 1, 300)]),
        I(6, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(9, 'Web design', 1, 500), L(10, 'Web design', 1, 500),
                                                       L(11, 'Hosting', 1, 80)])])
    a = plus(fx1, lines=[(2, L(12, 'web  DESIGN ', 2, 500))])
    b = plus(a, drop_lines=[(2, 12)], lines=[(2, L(12, 'web  DESIGN ', 3, 500))])
    c = plus(b, drop_lines=[(2, 12)], lines=[(2, L(12, 'web  DESIGN ', 2, 500))])
    c_ref = refused5(c, 2, n)
    ap = plus(c_ref, inv=[(2, dict(approvedTotal=1188, approvedOn=SA))])
    s_ = sent5(ap, [2], n)
    if rev:
        SPLIT = ("        // merged, it is two days of design: the same as invoices 1 and 2\n"
                 "        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{sent:inv6.duplicateOf}');\n")
    else:
        SPLIT = ("        // is not the same lines\n"
                 "        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);\n")
    t1 = T('a draft with the same lines as a recent invoice is a possible duplicate', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{s:inv2.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
""" + add_line('web  DESIGN ', 2, 500) + """        // the same lines as invoice 1 in another order, case and spacing: SHA-256 of
        // '1|hosting,1,8000;web design,2,50000', first 8 characters
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{a:inv2.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{a:inv1.number}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv2.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        // three days of design is not the same invoice
""" + edit_line(12, qty=3) + """        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{b:inv2.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
        await expect(page.getByTestId('invoice-approval')).toHaveText('{b:inv2.approval}');
""" + edit_line(12, qty=2) + """        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{c:inv1.number}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        // approved, it can go: 1,080.00 + 108.00
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total={ap:inv2.grand|plain}');
""" + send() + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
        // Globex's invoice with the same lines is another client's (its id is in the fingerprint)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{sent:inv3.fingerprint}');
        // an audit like one sent 100 days ago, outside the 60-day window, is no duplicate
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
        await expect(page.getByTestId('invoice-approval')).toHaveText('{sent:inv5.approval}');
        // the same work split over two lines of one day each
        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{sent:inv6.fingerprint}');
""" + SPLIT + """        await expect(page.getByTestId('invoice-approval')).toHaveText('{sent:inv6.approval}');
""", a=a, b=b, c=c, ap=ap, sent=s_)
    note = None
    if rev:
        note = ("UPDATED for cp208 (mutates: [202]): lines with the same description and unit price are merged "
                "before the fingerprint is taken, so the draft with the design split over two one-day lines is now a "
                "possible duplicate of invoices 1 and 2 and needs approval. Carries the test.")
    return Spec('cp202_duplicate_fingerprint', 'possible duplicate invoices', """
        Every invoice with lines shows a fingerprint: the first 8 characters, in capitals, of the SHA-256
        hash (hex) of the client's id, a '|', then its lines joined by ';' in sorted order, each line written
        as description,quantity,unit price in cents: the description in lower case with runs of spaces made
        one and trimmed, the quantity with no trailing zeros, the unit price the line is charged at (0 for a
        line priced in bands). A draft whose fingerprint equals that of an invoice of the same client sent
        within the workspace's duplicate window (settings.duplicateDays, days before today) is a possible
        duplicate: the panel names that invoice, and the draft needs approval before it can be sent. Adding,
        editing or removing a line checks again.""", [t1], n, copy_note=note)


cp(202, 'duplicate_fingerprint', """
    I nearly billed a client twice for the same work last month. Give every invoice a fingerprint and show
    its first 8 characters in capitals: the SHA-256 hash (in hex) of the client's id, then '|', then the
    invoice's lines sorted and joined with ';', each line written as description,quantity,unit price in
    cents, with the description lower-cased, runs of spaces collapsed to one and trimmed, the quantity
    without trailing zeros (2, 1.5) and the unit price the line is charged at (0 for a line priced in
    bands). Add a duplicate window in days to the workspace. A draft whose fingerprint matches an invoice
    of the same client sent within that many days before today is a possible duplicate: name that invoice
    on the draft and make the draft need approval before it can be sent. If it matches more than one, name
    them all by number, lowest id first, separated by a comma and a space. Check again whenever a line is
    added, edited or removed.
""", s202, algorithm='duplicate-fingerprint')

# =============================================================================== cp203 credit and rebill


def s203(n):
    st = dict(NY, duplicateDays=60)
    cl = C(A, region='NY')
    fx1 = dict(asOf=SA, settings=st, clients=[cl], invoices=[
        I(1, 1, 'SENT', '2026-05-04', '2026-06-30', [L(1, 'Build', 1, 1000), L(2, 'Hosting', 2, 40)],
          sentTotal=1177.2, sentTax=97.2),
        I(2, 1, 'DRAFT', '2026-06-01', '2026-06-30', [L(3, 'Design', 1, 100)])],
        payments=[P(1, 1, 500, '2026-05-20', [(1, 500)])])
    rb = rebill5(fx1, 1, n)
    s_ = sent5(rb, [4], n)
    t1 = T('rebilling cancels an invoice with a full credit note and starts a corrected copy', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // sent at 9% (1,080.00 + 97.20), part paid
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await page.getByTestId('invoice-rebill').click();
        // a credit note for exactly what was sent, which clears it; the 500.00 paid goes back to the client
        // as credit held for the replacement
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=3 number={rb:inv3.number} invoice=1 total={rb:inv3.grand|plain}');
        await expect.poll(() => auditLines()).toContain('INVOICE_REBILLED from={rb:inv1.number} to={rb:inv4.number}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{rb:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{rb:client1.credit}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-replaced-by')).toHaveText('{rb:inv4.number}');
        // the replacement is a draft with the same lines, worked out today at 8.875%: 1,080.00 + 95.85
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{rb:inv4.status}');
        await expect(page.getByTestId('invoice-replaces')).toHaveText('{rb:inv1.number}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{rb:inv4.grand}');
        // the same lines as the invoice it replaces, but that is no duplicate
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
        await expect(page.getByTestId('invoice-approval')).toHaveText('{rb:inv4.approval}');
""" + send() + """        // sending it uses the 500.00 held for it first
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=4 amount=500.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv4.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent:client1.balance}');
        // a draft can't be rebilled
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-rebill').click();
        await expect(page.getByTestId('invoice-rebill-error')).toBeVisible();
""", rb=rb, sent=s_)
    return Spec('cp203_credit_and_rebill', 'credit and rebill', """
        Rebill, on a sent invoice (not void, written off, a credit note or credited), cancels it and starts
        a corrected replacement. It issues a credit note (the next id, dated today, CREDIT_NOTE_ISSUED as
        usual) for exactly what the invoice was sent for, recording the day on the invoice
        (invoices[].rebilledOn), and creates a draft (the id after) for the same client with the invoice's
        lines, percentage discount, surcharge and purchase order, recording which invoice it replaces
        (invoices[].replaces), worked out with today's rules. What had been paid on the invoice comes off
        it and is held as credit for the replacement, used first when the replacement is sent. Writes
        INVOICE_REBILLED from=<number> to=<new number>; each panel shows the other's number. A rebilled or
        fully credited invoice never makes another a possible duplicate. Rebill is refused on anything
        else.""", [t1], n)


cp(203, 'credit_and_rebill', """
    When an invoice went out wrong I want to cancel it and send a corrected one. Give a sent invoice a
    Rebill button: it issues a credit note for exactly what the invoice was sent for (the next id, dated
    today, written up like any credit note) and creates a new draft, with the id after that, for the same
    client with the same lines, percentage discount, surcharge and purchase order number, worked out with
    today's prices and tax. Whatever had been paid on the old invoice comes off it and is held as credit
    for the new one, used on it first when it's sent. Show on each which one it replaces or was replaced
    by, write INVOICE_REBILLED from=<old number> to=<new number>, and don't treat a rebilled or fully
    credited invoice as something a draft can duplicate. Refuse to rebill a draft, a void or written-off
    invoice, a credit note, or one already credited.
""", s203)

# =============================================================================== cp204 line changes on sent invoices


def s204(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, termsDays=30)], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-14', [L(1, 'Design', 4, 120), L(2, 'Hosting', 1, 80)])],
        payments=[P(1, 1, 200, '2026-05-20', [(1, 200)])])
    a = add5(fx1, 1, L(0, 'Copywriting', 2, 45), n)
    b = edit5(a, 1, 1, n, qty=3)
    c = remove5(b, 1, 2, n)
    t1 = T('changing the lines of a sent invoice issues adjustment notes', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 480.00 + 80.00 + 10% tax = 616.00, 200.00 paid
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""" + add_line('Copywriting', 2, 45) + """        // the invoice stays as sent; the new line is billed on an adjustment note sent at once:
        // 90.00 + 9.00, due 30 days from today
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={a:inv2.number} invoice=1 total={a:inv2.grand|plain}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(2);
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{a:inv1.adjusted}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-number')).toHaveText('{a:inv2.number}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('{a:inv2.listTotal}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('{a:inv2.dueDate}');
        // four days of design down to three: one note for the day taken off, -120.00 - 12.00, which comes
        // off what the invoice owes
""" + edit_line(1, qty=3) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={b:inv3.number} invoice=1 total={b:inv3.listTotal|plain}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-total')).toHaveText('{b:inv3.listTotal}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{b:inv1.adjusted}'); // 99.00 - 132.00
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv1.due}'); // 416.00 - 132.00
        // removing the hosting takes it off the same way: -80.00 - 8.00
""" + remove_line(2) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={c:inv4.number} invoice=1 total={c:inv4.listTotal|plain}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{c:inv1.due}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{c:inv1.grand}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{c:client1.balance}'); // 196.00 + 99.00
        // the discount of a sent invoice is fixed
        await page.getByTestId('discount-form-pct').fill('10');
        await page.getByTestId('discount-form-submit').click();
        await expect(page.getByTestId('discount-form-error')).toBeVisible();
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
""", a=a, b=b, c=c)
    fx2 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-05-15', '2026-06-30', [L(5, 'Design', 1, 100), L(6, 'Travel', 1, 50)])],
        payments=[P(1, 1, 165, '2026-05-20', [(5, 165)])])
    d_ = remove5(fx2, 5, 6, n)
    e = add5(d_, 5, L(0, 'Taxi', 1, 30), n)
    t2 = T('a credit adjustment beyond what is owed becomes credit, and the next note uses it', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
""" + remove_line(6) + """        // the paid invoice owes nothing, so all 55.00 of the note is held as credit
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=6 number={d:inv6.number} invoice=5 total={d:inv6.listTotal|plain}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=55.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{d:client1.credit}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{d:inv5.status}');
""" + add_line('Taxi', 1, 30) + """        // the debit note (30.00 + 3.00) is sent like any invoice, so the credit pays it
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=7 amount=33.00');
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('{e:inv7.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{e:client1.credit}');
""", d=d_, e=e)
    return Spec('cp204_sent_line_adjustments', 'adjustment notes', """
        A sent invoice is never reopened. Adding, editing or removing a line of a sent invoice (paid or not;
        not void, written off, a credit note or one with an issued credit note) leaves the invoice and its
        own lines as sent and issues an adjustment note for the change: a new invoice for the same client
        (invoices[].adjustmentOf = the invoice), dated today, numbered ADJ- then the six-digit id and its
        check digit. An added line is billed on a debit note; a removed line is taken off by a credit note
        (the line with its quantity negative); a change of quantity alone is one note for the difference;
        any other edit takes the old line off with a credit note and bills the new line on a debit note.
        A note's lines are priced and taxed like the invoice's (its date, region and rules), with no
        discount or charges of their own. A debit note is sent at once like any invoice sent today (due by
        the usual terms, credit used on it); a credit note comes off what the invoice owes, like a credit
        note, and anything beyond that is held as credit (CREDIT_HELD). Each writes ADJUSTMENT_ISSUED
        id=<id> number=<ADJ-...> invoice=<invoice id> total=<grand total, negative for a credit>; the list
        shows a credit note's total as negative, and the invoice's panel shows the sum of its notes as
        adjusted. A sent invoice's discount can't be changed.""", [t1, t2], n)


cp(204, 'sent_line_adjustments', """
    Reopening a sent invoice to change it rewrites history the client has already seen. Stop doing that:
    when I add, edit or remove a line on a sent invoice (paid or not), leave the invoice and its lines as
    sent and issue an adjustment note for the change instead, a new entry for the same client dated today
    and numbered ADJ- with the six-digit id and check digit. An added line goes on a debit note; a removed
    line comes off on a credit note (the line with a negative quantity); changing only the quantity is
    one note for the difference; any other edit takes the old line off on a credit note and puts the new
    line on a debit note. Price and tax the notes' lines exactly like the invoice's own (its date, region
    and tax rules), with no discount or charges. Send a debit note straight away like any invoice sent
    today; a credit note comes off what the invoice owes like a credit note, with anything beyond that
    held as credit. Write ADJUSTMENT_ISSUED id=<id> number=<ADJ number> invoice=<invoice id>
    total=<total, negative for a credit>, show a credit note's total as negative in the list, and show
    on the invoice the sum of its adjustment notes. Refuse to change a sent invoice's discount. Invoices
    that are void, written off, credit notes or already credited still can't be changed.
""", s204, type_='mutative', mutates=[11, 16, 31, 42, 201], copies=['cp201_sent_snapshot'],
   retires=['cp11_send_invoice.spec.ts::refuses new lines and discount changes on a sent invoice',
            'cp16_reopen_sent_invoice.spec.ts::changing an unpaid sent invoice puts it back to draft',
            'cp16_reopen_sent_invoice.spec.ts::an invoice with a payment stays fixed',
            'cp31_remove_line.spec.ts::removing a line from an unpaid sent invoice reopens it',
            'cp42_edit_line.spec.ts::editing a line of an unpaid sent invoice reopens it',
            "cp201_sent_snapshot.spec.ts::reopening a sent invoice lets it be sent again at today's figures"])

# =============================================================================== cp205 adjustment notes carry the invoice's terms


def s205(n):
    st = {'taxRate': 10, 'withholdingThreshold': 1000}
    fx1 = dict(asOf=SA, settings=st, clients=[C(G, withholdingPct=10)], invoices=[
        I(1, 2, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Build', 1, 950)], discountPct=10, surchargePct=2)])
    a = add5(fx1, 1, L(0, 'Extra build', 1, 200), n)
    pa = pay5(a, P(1, 2, 183.6, SA, []), n, open_id=2)
    t1 = T("an adjustment note carries the invoice's discount and surcharge, and counts towards withholding", '@core', fx1, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-1').click();
        // 950.00 - 95.00 + 17.10 surcharge = 872.10 before tax, under the 1,000.00 threshold: nothing withheld
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv1.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""" + add_line('Extra build', 1, 200) + """        // the note takes the invoice's 10% off (20.00) and its 2% surcharge (3.60), then 10% tax: 201.96
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={a:inv2.number} invoice=1 total={a:inv2.grand|plain}');
        // together they are 872.10 + 183.60 = 1,055.70 before tax, so both withhold 10%
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{a:inv1.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}'); // 959.31 - 87.21
        await expect.poll(() => auditLines()).toContain('WITHHOLDING id=2 amount={a:inv2.withholding|plain}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv2.discount}');
        await expect(page.getByTestId('invoice-surcharge')).toHaveText('{a:inv2.surcharge}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv2.due}'); // 201.96 - 18.36
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{a:client2.balance}');
        // paying the 183.60 it owes settles the note; the withheld 18.36 is never owed
""" + pay('183.60', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{pa:inv2.status}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{pa:client2.balance}');
""", a=a, pa=pa)
    fx2 = dict(asOf=SA, settings={'taxRate': 10}, clients=[C(A, withholdingPct=10)], invoices=[
        I(3, 1, 'SENT', '2026-05-15', '2026-06-30', [L(3, 'Design', 1, 800), L(4, 'Travel', 1, 200)])])
    b = remove5(fx2, 3, 4, n)
    t2 = T('a credit adjustment gives back its share of what was withheld', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // 1,100.00 less 100.00 withheld
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv3.due}');
""" + remove_line(4) + """        // the travel comes off (220.00) and only 10% of the 800.00 left is withheld: 1,100.00 - 80.00 - 220.00
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{b:inv3.adjusted}');
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{b:inv3.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv3.due}');
""", b=b)
    return Spec('cp205_adjustment_terms', "adjustment notes follow the invoice's terms", """
        An adjustment note carries its invoice's percentage discount (taken off the note's lines, rounded down,
        and split over them as usual) and its surcharge percentage. Withholding is judged on an invoice
        together with its adjustment notes: the threshold applies to their amounts before tax added together
        (credit notes taken off), a debit note withholds on its own amount before tax (WITHHOLDING when it is
        issued), and the invoice withholds on its own amount before tax less its credit notes'.""", [t1, t2], n)


cp(205, 'adjustment_terms', """
    An adjustment note should be billed on the same terms as its invoice. Take the invoice's percentage
    discount off the note's lines (rounded down and split over them as usual) and add the invoice's
    surcharge percentage. And judge withholding on the invoice and its notes together: the threshold applies
    to their amounts before tax added up (credit notes taken off); a debit note withholds its percentage of
    its own amount before tax (writing WITHHOLDING when issued), and the invoice withholds on its own amount
    before tax less its credit notes', so a credit note gives back the share that was withheld.
""", s205)

# =============================================================================== cp206 an invoice's notes are paid with it


def s206(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-04', '2026-06-30', [L(1, 'Build', 1, 300)]),
        I(2, 1, 'SENT', '2026-06-01', '2026-06-30', [L(2, 'Hosting', 1, 50)])])
    a = add5(fx1, 1, L(0, 'Extra', 1, 90), n)
    p = pay5(a, P(1, 1, 400, SA, []), n, open_id=1)
    t1 = T("paying an invoice pays its adjustment notes next", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Extra', 1, 90) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={a:inv3.number} invoice=1 total={a:inv3.grand|plain}');
""" + pay('400', SA) + """        // the invoice's 330.00, then the rest on its note (99.00), not on invoice 2
""" + recorded(p, 1) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{p:inv3.status}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{p:inv2.status}');
""", a=a, p=p)
    fx2 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-20', '2026-05-31', [L(1, 'Build', 1, 300)]),
        I(2, 1, 'SENT', '2026-06-01', '2026-07-31', [L(2, 'Extra', 1, 90)], adjustmentOf=1),
        I(3, 1, 'SENT', '2026-06-01', '2026-06-30', [L(3, 'Hosting', 1, 50)])])
    q = pay5(fx2, P(1, 1, 440, SA, []), n)
    t2 = T('a spread payment pays a note straight after its invoice', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
""" + pay('440', SA) + """        // overdue invoice 1 (330.00) first, its note (99.00) straight after it, and only then the smallest,
        // invoice 3, gets the last 11.00
""" + recorded(q, 1) + """        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{q:inv2.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{q:inv3.status}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{q:inv3.due}');
""", q=q)
    return Spec('cp206_adjustment_payments', "an invoice's notes are paid with it", """
        A debit adjustment note is paid together with its invoice. A payment made with the invoice open, or
        naming the invoice's number or reference, pays the invoice and then its debit notes, oldest first,
        before anything is held as credit. When a payment is spread automatically or by Apply credit, a debit
        note is paid straight after its invoice, wherever the invoice comes in the order, whatever the note's
        own due date or amount.""", [t1, t2], n)


cp(206, 'adjustment_payments', """
    A client paying an invoice means to pay its adjustment notes too. When a payment is made with an invoice
    open, or names an invoice's number or reference, pay the invoice and then its debit adjustment notes,
    oldest first, before holding anything as credit. When a payment is spread automatically or by Apply
    credit, pay each debit note straight after its invoice, wherever that invoice comes in the order,
    whatever the note's own due date or amount.
""", s206)

# =============================================================================== cp207 an adjusted invoice is checked for duplicates


def s207(n):
    st = {'duplicateDays': 60}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-20', '2026-06-30', [L(1, 'Design', 2, 100)]),
        I(2, 1, 'SENT', '2026-05-25', '2026-06-30', [L(2, 'Design', 2, 100), L(3, 'Hosting', 1, 80)]),
        I(3, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(4, 'Hosting', 1, 90), L(5, 'design', 2, 100)])])
    a = add5(fx1, 1, L(0, 'Hosting', 1, 90), n)
    t1 = T('a line change that would duplicate another invoice is refused', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // taking the hosting off invoice 2 would leave it the same as invoice 1
        await page.getByTestId('invoice-row-2').click();
""" + remove_line(3) + """        await expect(page.getByTestId('line-form-error')).toBeVisible();
        // and adding the same hosting to invoice 1 would make it the same as invoice 2
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{s:inv1.fingerprint}');
""" + add_line('Hosting', 1, 80) + """        await expect(page.getByTestId('line-form-error')).toBeVisible();
        expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
        // hosting at 90.00 is different: the note is issued and the invoice's fingerprint takes it in
""" + add_line('Hosting', 1, 90) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={a:inv4.number} invoice=1 total={a:inv4.grand|plain}');
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{a:inv1.fingerprint}');
        // so the draft with those lines is a possible duplicate of invoice 1 as adjusted
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{a:inv3.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{a:inv3.duplicateOf}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv3.approval}');
""" + send_refused(), a=a, r=refused5(a, 3, n))
    return Spec('cp207_adjusted_duplicates', 'adjusted invoices and duplicates', """
        A sent invoice's fingerprint is taken over its lines as adjusted: lines its debit adjustment notes added
        count, lines its credit notes took off don't. A line change on a sent invoice that would give it the
        same fingerprint as another invoice of the client sent within the duplicate window is refused (no
        note is issued), and a draft matching an invoice as adjusted is a possible duplicate of it.""", [t1], n)


cp(207, 'adjusted_duplicates', """
    Adjusting an invoice can turn it into a copy of another. Work a sent invoice's fingerprint out over its
    lines as adjusted (lines its debit notes added count, lines its credit notes took off don't), refuse a
    line change on a sent invoice that would give it the same fingerprint as another of the client's
    invoices sent within the duplicate window (issue no note), and treat a draft matching an invoice as
    adjusted as a possible duplicate of it.
""", s207)

# =============================================================================== cp208 split lines still match (revised fingerprint)


def s208(n):
    st = {'duplicateDays': 60}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-20', '2026-06-30', [L(1, 'Training', 3, 200)]),
        I(2, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(2, 'Training', 1, 200), L(3, 'training ', 2, 200)]),
        I(3, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(4, 'Workshop', 1, 500)]),
        I(4, 1, 'DRAFT', '2026-06-09', '2026-06-30', [L(5, 'workshop', 1, 500)])])
    a = plus(fx1, drop_lines=[(2, 3)], lines=[(2, L(3, 'training ', 2, 210))])
    b = sent5(a, [3], n)
    t1 = T('lines with the same description and price count as one, and drafts are checked against drafts', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // one day and two days of training at 200.00 merge into three days: the lines of invoice 1
        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{s:inv2.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{s:inv2.duplicateOf}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
        // at 210.00 the second line is a different price, so nothing merges
""" + edit_line(3, price=210) + """        await expect(page.getByTestId('invoice-fingerprint')).toHaveText('{a:inv2.fingerprint}');
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv2.approval}');
        // two drafts with the same workshop: the later one is the possible duplicate
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{a:inv4.duplicateOf}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv4.approval}');
        // and once the first is sent, the second still matches it
        await page.getByTestId('invoice-row-3').click();
""" + send() + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv3.status}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('{b:inv4.duplicateOf}');
""", a=a, b=b)
    return Spec('cp208_fingerprint_merges_lines', 'split lines still match', """
        Before the fingerprint is taken, lines with the same description (lower case, spaces collapsed and
        trimmed) and the same unit price are merged into one, their quantities added, so work split over
        several lines still matches. A draft is also a possible duplicate of an earlier draft (lower id) of
        the same client with the same fingerprint; the earlier one is not flagged.""", [t1], n)


cp(208, 'fingerprint_merges_lines', """
    Splitting the same work over two lines gets past the duplicate check. Before taking a fingerprint, merge
    lines that have the same description (lower-cased, spaces collapsed and trimmed) and the same unit price
    into one line, adding their quantities. And check drafts against each other too: a draft with the same
    fingerprint as an earlier draft (lower id) of the same client is a possible duplicate of it; the earlier
    one isn't flagged. A draft that matches several invoices still names them all, lowest id first,
    separated by a comma and a space.
""", s208, type_='mutative', mutates=[202], algorithm='duplicate-fingerprint-revised',
   copies=['cp202_duplicate_fingerprint'])

# =============================================================================== cp209 business-day calendar


HOL = ['2026-06-19', '2026-07-04']


def s209(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'holidays': HOL}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, termsDays=10, graceDays=3), C(G, termsDays=20)], invoices=[
        I(1, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-05-20', '2026-06-03', [L(2, 'Design', 1, 1000)]),
        I(3, 1, 'SENT', '2026-05-22', '2026-06-05', [L(3, 'Hosting', 1, 1000)]),
        I(4, 2, 'DRAFT', '2026-06-08', '2026-06-30', [L(4, 'Build', 1, 500)])])
    s_ = sent5(sent5(fx1, [1], n), [4], n)
    t1 = T('terms and grace count business days', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + send() + """        // 10 business days after Wednesday 2026-06-10, skipping two weekends and the 2026-06-19 holiday
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{sent:inv1.dueDate}');
        // due Wednesday 2026-06-03: 3 business days of grace end Monday 2026-06-08, so it is overdue and
        // earns 2 days' interest: 1,100.00 x ((1 + 0.12/360)^2 - 1) = 0.7335 -> 0.73
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{sent:inv2.interest}');
        // due Friday 2026-06-05: grace runs Monday to Wednesday, ending today, so not yet
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{sent:inv3.interest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{sent:client1.overdue}');
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
""" + send() + ("""        // 20 business days: the Saturday holiday, 2026-07-04, is observed on Friday 2026-07-03
""" if n >= 220 else """        // 20 business days: the 2026-07-04 holiday falls on a Saturday anyway
""") + """        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('{sent:inv4.dueDate}');
""", sent=s_)
    st2 = {'taxRate': 10, 'holidays': []}
    fx2 = dict(asOf=SA, settings=st2, clients=[C(G, earlyPayPct=2, earlyPayDays=5)], invoices=[
        I(4, 2, 'SENT', '2026-06-03', '2026-07-31', [L(4, 'Build', 1, 500)])])
    v = d5(fx2, n)
    amt = v['inv4.settle']
    p = pay5(fx2, P(1, 2, float(amt.replace('$', '').replace(',', '')), SA, []), n, open_id=4)
    t2 = T('the early-payment window counts business days', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        // issued Wednesday 2026-06-03: 5 business days run to Wednesday 2026-06-10, so the window is still
        // open today (5 calendar days would have closed it on Monday)
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{s:inv4.settle}'); // 550.00 - 10.00
""" + pay('{s:inv4.settle|plain}', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv4.status}');
        await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=4 amount={p:inv4.earlyDiscount|plain}');
""", p=p)
    return Spec('cp209_business_days', 'a business-day calendar', """
        The workspace can keep a holiday calendar (settings.holidays, a list of dates, possibly empty). With
        one, days in payment terms are business days, Monday to Friday and not a listed holiday: the client's
        own terms, a region's terms and the cap for risky clients make the due date that many business days
        after the issue date (counting from the next day); grace periods, the early-payment window,
        milestones' terms and how long an approval lasts are counted in business days too. Late interest
        still accrues for every calendar day once the grace period has ended. Without a calendar, days are
        calendar days as before.""" + (" A listed holiday falling on a Saturday is observed on the Friday before, "
        "one on a Sunday on the Monday after." if n >= 220 else ""), [t1, t2], n, copy_note=(
        "UPDATED for cp220 (mutates: [209]): a holiday on a weekend is now observed on the nearest weekday, so "
        "Globex's 20 business days skip Friday 2026-07-03 for the Saturday 2026-07-04 holiday and end on "
        "2026-07-10. Carries both tests." if n >= 220 else None))


cp(209, 'business_days', """
    My clients' terms are in working days. Let the workspace keep a list of holidays. Once it has one (even
    an empty list), count every number of days in payment terms as business days, Monday to Friday and not
    a listed holiday, counted from the day after: the client's own terms, a region's terms and the cap for
    risky clients set the due date that many business days after the issue date, and grace periods, the
    early-payment window, a milestone's terms and how long an approval lasts are counted in business days
    as well. Late interest still accrues for every calendar day after the grace period ends. Without a
    holiday list everything stays in calendar days.
""", s209, algorithm='business-day-calendar')

# =============================================================================== cp210 adjustment notes that need approval


def s210(n):
    st = {'taxRate': 10, 'approvalLimit': 500}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, creditLimit=2000)], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 100)])])
    a = add5(fx1, 1, L(0, 'Extra build', 1, 600), n)
    b = plus(a, inv=[(2, dict(approvedTotal=660, approvedOn=SA))])
    c = sent5(b, [2], n)
    d_ = add5(c, 1, L(0, 'Support', 1, 300), n)
    e = remove5(d_, 1, 1, n)
    f_ = sent5(e, [3], n)
    t1 = T('a debit note that needs approval waits as a draft; credit notes never do', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Extra build', 1, 600) + """        // 600.00 + 60.00 = 660.00 is over the 500.00 limit: the note waits as a draft for approval
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv2.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total={b:inv2.grand|plain}');
""" + send() + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={c:inv2.number} invoice=1 total={c:inv2.grand|plain}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{c:client1.balance}'); // 1,210.00 + 660.00
        // 300.00 + 30.00 is within the limit, but would take the client to 2,200.00, over its 2,000.00
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Support', 1, 300) + """        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{d:inv3.status}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{d:inv3.approval}');
        // taking the build off is a credit note: issued at once, with no approval
        await page.getByTestId('invoice-row-1').click();
""" + remove_line(1) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={e:inv4.number} invoice=1 total={e:inv4.listTotal|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('{e:client1.available}');
        // now the support note fits under the limit and goes without approval
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{e:inv3.approval}');
""" + send() + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={f:inv3.number} invoice=1 total={f:inv3.grand|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{f:client1.balance}');
""", a=a, b=b, c=c, d=d_, e=e, f=f_)
    return Spec('cp210_adjustment_approval', 'adjustment notes that need approval', """
        A debit adjustment note is judged for approval like any draft: over the approval limit, a discount of
        more than a fifth, a HIGH-risk client, or taking the client over its credit limit. One that needs
        approval is left as a draft note instead of being sent; approving and then sending it issues it
        (ADJUSTMENT_ISSUED, not INVOICE_SENT). A credit note never needs approval.""", [t1], n)


cp(210, 'adjustment_approval', """
    Adding to a sent invoice shouldn't get round the approval rules. Judge a debit adjustment note for
    approval like any draft (over the approval limit, a discount of more than a fifth, a high-risk client,
    or taking the client over their credit limit). If it needs approval, leave it as a draft note instead
    of sending it; once approved, sending it issues it (ADJUSTMENT_ISSUED rather than INVOICE_SENT). Credit
    notes never need approval.
""", s210)

# =============================================================================== cp211 a rebill carries the invoice's states


def s211(n):
    st = {'taxRate': 10, 'approvalLimit': 1000}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 200, disputed=True)],
          sentTotal=1332, sentTax=132, poNumber='PO-4471', disputedOn='2026-06-01', approvedTotal=1332,
          approvedOn='2026-05-14')])
    rb = rebill5(fx1, 1, n)
    s_ = sent5(rb, [3], n)
    t1 = T('a rebill carries the dispute, the purchase order and the approval', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{s:inv1.disputed}');
        await page.getByTestId('invoice-rebill').click();
        // the replacement: 1,200.00 + 10% = 1,320.00, over the 1,000.00 limit but no more than the
        // 1,332.00 the invoice was approved and sent for, so it is approved already
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{rb:inv3.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{rb:inv3.approval}');
        await expect(page.getByTestId('invoice-po')).toHaveText('PO-4471');
""" + send() + """        // the travel line is still in dispute on the replacement (200.00 + 20.00), not on the old invoice
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{sent:inv3.disputed}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{sent:client1.overdue}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{sent:inv1.disputed}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
""", rb=rb, sent=s_)
    fx2 = dict(asOf=SA, settings=dict(st, regionTaxRates={'NJ': 12}), clients=[C(G, region='NJ')], invoices=[
        I(4, 2, 'SENT', '2026-05-15', '2026-06-30', [L(5, 'Build', 1, 1000)], sentTotal=1100, sentTax=100,
          approvedTotal=1100, approvedOn='2026-05-14')])
    rb2 = rebill5(fx2, 4, n)
    t2 = T('a replacement for more than was approved needs approval again', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-rebill').click();
        // New Jersey's 12% makes it 1,120.00, more than the 1,100.00 approved
        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{rb:inv6.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{rb:inv6.approval}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
""", rb=rb2)
    return Spec('cp211_rebill_carries', 'a rebill carries the invoice with it', """
        Rebill moves an invoice's open states to its replacement: an open dispute (the replacement's lines
        matching the disputed lines stay disputed, from the same day; the old invoice's dispute closes), its
        milestones (with the days they were reached) and a recurring plan (the old invoice stops recurring).
        A replacement whose grand total is no more than what the old invoice was sent for counts as approved
        for that total; one for more needs approval like any draft.""", [t1, t2], n)


cp(211, 'rebill_carries', """
    A rebill shouldn't lose what was going on with the invoice. Move an open dispute to the replacement (the
    lines that were disputed stay disputed there, from the same day, and the old invoice's dispute closes),
    move its milestones with the days they were reached, and move a recurring plan so the old invoice stops
    recurring and the replacement carries on. If the replacement's grand total is no more than what the old
    invoice was sent for, treat it as already approved for that total; if it's more, it needs approval like
    any other draft.
""", s211)

# =============================================================================== cp212 no more instalment plans (the reversal)


def s212(n):
    st = {'taxRate': 10, 'approvalLimit': 1050}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(1, 'Build', 1, 1000)])],
        payments=[P(1, 1, 300, '2026-06-01', [], deposit=True)])
    ap = plus(fx1, inv=[(1, dict(approvedTotal=1100, approvedOn=SA))])
    s_ = sent5(ap, [1], n)
    t1 = T('an invoice has no instalment plan and is due in full', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
        await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
        await expect(page.getByTestId('plan-form-down')).toHaveCount(0);
        await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
        await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
        await expect(page.getByTestId('invoice-plan-fee')).toHaveCount(0);
        // judged on its grand total: 1,100.00 is over the 1,050.00 limit
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={ap:inv1.grand|plain}');
""" + send() + """        // the 300.00 deposit is used on it, and the rest is due in full at the end of next month
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=300.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{sent:inv1.dueDate}');
        await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);
""", ap=ap, sent=s_)
    return Spec('cp212_no_instalment_plans', 'no instalment plans', """
        Instalment plans are gone: there is no plan form, no instalment rows, plan total, plan fee, payoff or
        interest saved, and no skipping an instalment; the workspace has no plan fee and invoices no plan
        fields. Every invoice is due in full on its due date, earns late interest on what it owes once
        overdue, is judged for approval on its grand total, and has the client's credit used on it when it is
        sent.""", [t1], n)

# =============================================================================== cp213 a promise to pay


def promise(amount, date):
    return (f"        await page.getByTestId('invoice-promise-amount').fill('{amount}');\n"
            f"        await page.getByTestId('invoice-promise-date').fill('{date}');\n"
            "        await page.getByTestId('invoice-promise-submit').click();\n")


def s213(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-15', '2026-05-15', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-05-20', '2026-06-30', [L(2, 'Hosting', 1, 50)])])
    a = plus(fx1, inv=[(1, dict(promiseAmount=500, promiseDate='2026-06-20', promisedOn=SA))])
    t1 = T('a promise to pay holds an overdue invoice off until its date', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""" + promise('500', '2026-06-20') + """        await expect.poll(() => auditLines()).toContain('PAYMENT_PROMISED id=1 amount=500.00 date=2026-06-20');
        // no longer overdue, though late interest still runs
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{a:inv1.interest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{a:client1.overdue}');
        // only an overdue invoice can take a promise
        await page.getByTestId('invoice-row-2').click();
""" + promise('20', '2026-06-20') + """        await expect(page.getByTestId('invoice-promise-error')).toBeVisible();
""", a=a)
    fx3 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-15', '2026-05-15', [L(1, 'Build', 1, 1000)], promiseAmount=500,
          promiseDate='2026-06-20', promisedOn='2026-06-10'),
        I(2, 1, 'SENT', '2026-05-20', '2026-06-30', [L(2, 'Hosting', 1, 50)])])
    p1 = pay5(fx3, P(1, 1, 300, SA, [], reference='INV-0000018, INV-0000026'), n)
    p2 = pay5(p1, P(2, 1, 255, SA, []), n, open_id=1)
    t3 = T('a promised invoice is not paid first, and once kept it is overdue again', '@core', fx3, """
        await page.getByTestId('client-row-1').click();
        // naming both invoices: the promised one is not overdue, so the smaller invoice 2 is paid first
        await page.getByTestId('payment-form-amount').fill('300');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-reference').fill('INV-0000018, INV-0000026');
        await page.getByTestId('payment-form-submit').click();
""" + recorded(p1, 1) + """        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p1:inv1.status}');
        // 245.00 + 255.00 keeps the promise of 500.00: what is left is overdue again
""" + pay('255', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p2:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p2:inv1.due}');
""", p1=p1, p2=p2)
    fx2 = dict(asOf=SA, settings=st, clients=[G], invoices=[
        I(3, 2, 'SENT', '2026-04-01', '2026-04-30', [L(3, 'Build', 1, 400)], promiseAmount=200,
          promiseDate='2026-06-05', promisedOn='2026-05-29')])
    t2 = T('a broken promise leaves the invoice overdue and takes no new one', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        // nothing was paid by 2026-06-05
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
""" + promise('200', '2026-06-25') + """        await expect(page.getByTestId('invoice-promise-error')).toBeVisible();
""")
    return Spec('cp213_payment_promise', 'a promise to pay', """
        An overdue invoice can take a promise to pay: an amount (at least 10% of its amount due and no more
        than it) by a date (after today and at most 30 days ahead), recorded with the day it was made
        (invoices[].promiseAmount, promiseDate, promisedOn) and written as PAYMENT_PROMISED id=<id>
        amount=<amount> date=<date>. Until that date, unless payments since the promise reach the promised
        amount, the invoice is Promised rather than Overdue: it is not in the client's overdue amount and is
        not paid first as an overdue invoice when a payment is spread, though late interest still runs. Once
        the promise is kept, anything still owed is overdue as usual. An invoice that is not overdue, or
        whose promise was broken (its date passed short of the amount), takes no promise.""", [t1, t3, t2], n)


cp(213, 'payment_promise', """
    With plans gone, a client who is behind needs another way to catch up. Let me record a promise to pay
    on an overdue invoice: an amount (at least 10% of what it owes, no more than that) by a date (after
    today, no more than 30 days ahead), noting the day it was made, and write PAYMENT_PROMISED id=<invoice
    id> amount=<amount> date=<date>. Until that date, unless what they've paid since reaches the promised
    amount, show the invoice as Promised instead of Overdue: leave it out of the client's overdue amount and
    don't pay it first as an overdue invoice when a payment is spread, but keep charging late interest.
    Once the promise is kept, whatever is still owed is overdue as normal. Refuse a promise on an invoice
    that isn't overdue or whose last promise was broken (its date passed without the amount being paid).
""", s213)

# =============================================================================== cp214 a rebill carries late interest


def s214(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-01', '2026-04-30', [L(1, 'Build', 1, 1000)])])
    rb = rebill5(fx1, 1, n)
    s_ = sent5(rb, [3], n)
    t1 = T("a rebill carries the late interest owed to the replacement", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 1,100.00 overdue since the end of grace on 2026-05-07: 34 days at 12%
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await page.getByTestId('invoice-rebill').click();
        await expect.poll(() => auditLines()).toContain('INTEREST_CARRIED from={rb:inv1.number} to={rb:inv3.number} amount={s:inv1.interest|plain}');
        // the credit note clears the 1,100.00 and the interest stops on the old invoice
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{rb:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{rb:inv1.due}');
        // the replacement bills it as a line of its own, with no tax
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-description')).toHaveText('Late interest {rb:inv1.number}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{rb:inv3.line4.amount}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('{rb:inv3.line4.tax}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{rb:inv3.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{rb:inv3.grand}');
""" + send() + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv3.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent:client1.balance}');
""", rb=rb, sent=s_)
    st2 = dict(st, interestThreshold=20)
    fx2 = dict(asOf=SA, settings=st2, clients=[G], invoices=[
        I(4, 2, 'SENT', '2026-04-01', '2026-04-30', [L(4, 'Build', 1, 1000)], discountPct=10)])
    rb2 = rebill5(fx2, 4, n)
    t2 = T('interest under the threshold is not owed, so nothing is carried', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-rebill').click();
        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(1);
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{rb:inv6.grand}');
        expect(auditLines().filter((l) => l.startsWith('INTEREST_CARRIED'))).toEqual([]);
""", rb=rb2)
    return Spec('cp214_rebill_interest', 'a rebill carries late interest', """
        Rebilling an invoice that owes late interest carries it: the interest owed (once past any threshold)
        stops and is waived on the old invoice, and the replacement gets a line "Late interest <old number>"
        for that amount, quantity 1, which takes no tax, no share of the invoice discount and no surcharge.
        Writes INTEREST_CARRIED from=<old number> to=<new number> amount=<interest>.""", [t1, t2], n)


cp(214, 'rebill_interest', """
    Rebilling an overdue invoice shouldn't wipe out the interest it has run up. When I rebill an invoice that
    owes late interest (above the threshold, if there is one), stop and waive the interest on the old
    invoice and put it on the replacement as a line "Late interest <old invoice number>", quantity 1, for
    that amount, with no tax, no share of the invoice discount and no surcharge. Write
    INTEREST_CARRIED from=<old number> to=<new number> amount=<interest>.
""", s214)

# =============================================================================== cp215 bring a sent invoice up to date


def s215(n):
    st = dict(NY)
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='NY', withholdingPct=10)], invoices=[
        I(1, 1, 'SENT', '2026-05-04', '2026-06-30', [L(1, 'Design', 1, 500)], sentTotal=545, sentTax=45)])
    ctx = M.Ctx(fx1, n)
    g, t = M.invoice_grand(dict(fx1['invoices'][0], sentTotal=None), n, ctx)
    up = plus(fx1, inv=[(1, dict(sentTotal=M.major(g), sentTax=M.major(t)))])
    t1 = T("updating a sent invoice takes today's figures", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // sent at 9%; New York's rate is 8.875% now
        await expect(page.getByTestId('invoice-current-total')).toHaveText('{s:inv1.currentTotal}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 545.00 - 50.00 withheld
        await page.getByTestId('invoice-update').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_UPDATED id=1 from={s:inv1.grand|plain} to={up:inv1.grand|plain}');
        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{up:inv1.sentTotal}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{up:inv1.tax}');
        await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{up:inv1.due}');
        // nothing more to update
        await page.getByTestId('invoice-update').click();
        await expect(page.getByTestId('invoice-update-error')).toBeVisible();
""", up=up)
    fx2 = dict(asOf=SA, settings=st, clients=[C(G, region='NY', creditLimit=1190)], invoices=[
        I(2, 2, 'SENT', '2026-05-04', '2026-06-30', [L(2, 'Build', 1, 1000)], sentTotal=1080, sentTax=80),
        I(3, 2, 'SENT', '2026-05-04', '2026-06-30', [L(3, 'Hosting', 1, 100)], sentTotal=108, sentTax=8)])
    up2 = plus(fx2, inv=[(3, dict(sentTotal=108.88, sentTax=8.88))])
    t2 = T('an update that would take the client over its credit limit is refused', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        // 1,080.00 + 108.00 = 1,188.00 owed of the 1,190.00 limit
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{s:client2.available}');
        // today's 1,088.75 would take the client to 1,196.75
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-current-total')).toHaveText('{s:inv2.currentTotal}');
        await page.getByTestId('invoice-update').click();
        await expect(page.getByTestId('invoice-update-error')).toBeVisible();
        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{s:inv2.sentTotal}');
        // 108.88 for the hosting fits: 1,188.88
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-update').click();
        await expect(page.getByTestId('invoice-sent-total')).toHaveText('{up:inv3.sentTotal}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('{up:client2.available}');
""", up=up2)
    return Spec('cp215_invoice_update', "bringing a sent invoice up to date", """
        Update, on a sent invoice whose current total differs from the total it was sent with, makes today's
        figures its sent figures (grand total and tax), so it owes what today's rules give, and writes
        INVOICE_UPDATED id=<id> from=<old total> to=<new total>. It is refused when there is no difference,
        when the new total is less than what has already been paid on the invoice, and when an increase would
        take the client over its credit limit.""", [t1, t2], n)


cp(215, 'invoice_update', """
    Sometimes I do want a sent invoice to pick up a corrected rate rather than rebilling it. Give a sent
    invoice whose current total differs from what it was sent for an Update button: it makes today's grand
    total and tax its sent figures, so it owes what today's rules say, and writes INVOICE_UPDATED id=<id>
    from=<old total> to=<new total>. Refuse it when there's no difference, when the new total would be less
    than what's already been paid on it, or when the increase would take the client over their credit limit.
""", s215)

# =============================================================================== cp216 no grace for high-risk clients


def s216(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-05-04', '2026-06-05', [L(2, 'Build', 1, 1000)]),
        I(3, 2, 'SENT', '2026-05-04', '2026-06-05', [L(3, 'Build', 1, 1000)])],
        payments=[P(1, 1, 110.48, '2026-04-20', [(1, 110.48)])])
    t1 = T('a high-risk client has no grace period', '@core', fx1, """
        // Acme paid its last invoice (with 13 days' interest, 0.48) 20 days late: HIGH
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('client-row-1').click();
        // due 2026-06-05, five days ago: with no grace it is overdue and earns interest from the due date,
        // 1,100.00 x ((1 + 0.15/360)^5 - 1) at 12% + 3 for a HIGH client
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        // Globex has no history: its invoice due the same day is still within its grace week
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('{s:client2.overdue}');
""")
    return Spec('cp216_no_grace_high_risk', 'no grace for high-risk clients', """
        A client in the HIGH risk band (judged, for an invoice, on the client's other invoices) gets no grace
        period: their invoices are overdue the day after they fall due, and late interest runs from the due
        date, with everything that follows from being overdue.""", [t1], n)


cp(216, 'no_grace_high_risk', """
    A client who is already a slow payer shouldn't get a week's grace on top. For a client in the HIGH risk
    band (judged on their other invoices, as for the higher interest rate), drop the grace period: their
    invoices are overdue the day after they fall due and late interest runs from the due date, with
    everything else that being overdue brings.
""", s216, type_='mutative', mutates=[179], copies=['cp179_risk_interest'])

# =============================================================================== cp217 dunning escalation


def remind():
    return "        await page.getByTestId('invoice-remind').click();\n"


def remind_refused():
    return ("        await page.getByTestId('invoice-remind').click();\n"
            "        await expect(page.getByTestId('invoice-remind-error')).toBeVisible();\n")


def s217(n):
    rev = n >= 228
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-01', '2026-06-01', [L(1, 'Build', 1, 300)]),
        I(2, 1, 'SENT', '2026-04-10', '2026-05-10', [L(2, 'Design', 1, 200)], reminders=['2026-05-20']),
        I(3, 1, 'SENT', '2026-04-10', '2026-05-10', [L(3, 'Hosting', 1, 100)], reminders=['2026-05-30']),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-01', [L(4, 'Audit', 1, 400)], reminders=['2026-04-10', '2026-05-01']),
        I(5, 1, 'SENT', '2026-04-10', '2026-05-10', [L(5, 'Support', 1, 150)], disputedOn='2026-05-25')])
    a = remind5(fx1, 1, n) if not rev else no_remind5(fx1, 1, n)
    a = no_remind5(a, 1, n) if not rev else a
    b = remind5(a, 2, n)
    c = no_remind5(b, 3, n)
    d_ = remind5(c, 4, n)
    e = no_remind5(d_, 5, n)
    t1 = T('reminders escalate a level at a time', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // due 2026-06-01: 9 days overdue, CMT
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv1.dunning}');
""" + (remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=1 level=REMINDER_1');
        // it has gone out, and nothing more is due until it is 14 days old and the invoice 21 days overdue
""" + remind_refused() if not rev else """        // under 10 days overdue: nothing to send yet
""" + remind_refused()) + """        // 31 days overdue, the first reminder sent at 10 days, 21 days ago: the second is due
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{a:inv2.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_2');
        // also 31 days overdue, but its first reminder went out at 20 days, only 11 days ago
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{b:inv3.dunning}');
""" + remind_refused() + """        // 70 days overdue with two reminders sent: a final notice, not yet collections
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{c:inv4.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=FINAL');
        // a disputed invoice is not overdue, so it is not chased
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{d:inv5.dunning}');
""" + remind_refused() + """        expect(auditLines().filter((l) => l.startsWith('REMINDER_SENT'))).toHaveLength({rcount});
""".replace('{rcount}', '2' if rev else '3').replace('CMT', 'under 10 days' if rev else 'so a first reminder is due'),
           a=a, b=b, c=c, d=d_, e=e)
    note = None
    if rev:
        note = ("UPDATED for cp228 (mutates: [217, 218, 219, 221, 222, 223]): the first reminder is due from 10 days "
                "overdue and every later level needs the reminder before it to be 14 days old, so invoice 1 (9 days) "
                "is not chased yet; the others escalate as before. Carries the test.")
    rule = ("NONE under 10 days overdue; REMINDER_1 from 10; REMINDER_2 from 21, FINAL from 45 and COLLECTIONS "
            "from 60, each only once the reminder before it went out at least 14 days earlier"
            if rev else
            "NONE under 7 days overdue; REMINDER_1 from 7; REMINDER_2 from 21 once the first reminder went out at "
            "least 14 days earlier; FINAL from 45 once the second has gone out; COLLECTIONS from 60 once the final "
            "notice has gone out")
    return Spec('cp217_dunning', 'chasing overdue invoices', f"""
        An overdue invoice is chased in levels, shown on the panel (NONE, REMINDER_1, REMINDER_2, FINAL,
        COLLECTIONS), worked out from the days since its due date and the days overdue at which its reminders
        went out (invoices[].reminders, the dates sent): {rule}. A level never skips the one before it. An
        invoice that is not Overdue (paid, within grace, disputed, promised) is at NONE. Remind sends the
        reminder for the level reached when it has not gone out yet, recording today and writing
        REMINDER_SENT id=<id> level=<level>; otherwise it is refused.""", [t1], n, copy_note=note)


cp(217, 'dunning', """
    I need to chase overdue invoices properly. Give each overdue invoice a dunning level, shown on the panel:
    NONE under 7 days past its due date; REMINDER_1 from 7 days; REMINDER_2 from 21 days, but only once the
    first reminder went out at least 14 days earlier; FINAL from 45 days, once the second reminder has gone
    out; COLLECTIONS from 60 days, once the final notice has gone out. Days are counted from the due date,
    and each reminder's history is how many days overdue the invoice was when it went out. A level never
    skips the one before it, and an invoice that isn't overdue (paid, in its grace period, disputed or
    promised) is at NONE. Add a Remind button that sends the reminder for the level reached if that one
    hasn't gone out yet: record the date and write REMINDER_SENT id=<invoice id> level=<level>. Refuse it
    otherwise.
""", s217, algorithm='dunning-escalation')

# =============================================================================== cp218 reminder fees


def s218(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'reminderFees': {'REMINDER_2': 15, 'FINAL': 40}, 'usdPer': RATES}
    fx1 = dict(asOf=SA, settings=st, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'SENT', '2026-04-10', '2026-05-10', [L(1, 'Design', 1, 1000)], reminders=['2026-05-20']),
        I(2, 2, 'SENT', '2026-03-01', '2026-04-01', [L(2, 'Audit', 1, 400)], reminders=['2026-04-10', '2026-05-01'])])
    a = remind5(fx1, 1, n)
    p = pay5(a, P(1, 1, 1110, SA, []), n, open_id=1)
    b = remind5(p, 2, n)
    t1 = T('later reminders charge a fee, owed after the invoice and before its interest', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 1,100.00 + interest
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_FEE id=1 amount=15.00');
        await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('{a:inv1.reminderFees}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        // 1,110.00 pays the invoice's 1,100.00, then 10.00 of the fee; the rest of the fee and the
        // interest are still owed
""" + pay('1110', SA) + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{p:inv1.cashDue}');
        // a final notice to a client in euros: 40.00 US dollars / 1.10 = 36.3636, down to 36.36, on top of
        // the second reminder's 15.00 / 1.10 = 13.63
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_FEE id=2 amount=36.36');
        await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('{b:inv2.reminderFees}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{b:client2.balance}');
""", a=a, p=p, b=b)
    return Spec('cp218_reminder_fees', 'reminder fees', """
        Sending a reminder can charge a fee (settings.reminderFees: an amount in US dollars per level, converted
        to the client's currency at that day's rate and rounded down), written as REMINDER_FEE id=<id>
        amount=<fee> and shown on the panel as the reminder fees charged. A fee is owed with the invoice: it is
        in the amount due, the balance, the overdue amount and the cash due, earns no interest and takes no
        tax. A payment pays the invoice first, then its reminder fees, then its late interest. Waiving interest
        leaves the fees owed; writing the invoice off includes them.""", [t1], n)


cp(218, 'reminder_fees', """
    Chasing costs me money, so the later reminders should carry a fee. Let the workspace set a fee in US
    dollars for each reminder level; when that reminder goes out, charge it on the invoice (converted to the
    client's currency at that day's rate, rounded down), write REMINDER_FEE id=<invoice id> amount=<fee>,
    and show the reminder fees charged on the panel. The fee is owed with the invoice: it counts in the
    amount due, the balance, the overdue amount and the cash due, earns no interest and takes no tax. A
    payment pays the invoice itself first, then the reminder fees, then late interest. Waiving the interest
    leaves the fees owed, and writing the invoice off includes them. Charging a reminder fee starts a new
    interest period, just as a payment does: the interest up to that day is worked out and rounded on its
    own.
""", s218)

# =============================================================================== cp219 an unpaid final notice stops credit


def s219(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-01', [L(1, 'Audit', 1, 400)],
          reminders=['2026-04-10', '2026-05-01', '2026-05-20']),
        I(2, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(2, 'Design', 1, 100)]),
        I(3, 2, 'SENT', '2026-04-10', '2026-05-10', [L(3, 'Hosting', 1, 100)], reminders=['2026-05-20', '2026-06-03']),
        I(4, 2, 'DRAFT', '2026-06-08', '2026-06-30', [L(4, 'Support', 1, 50)])])
    p = pay5(fx1, P(1, 1, 440, SA, []), n)
    t1 = T('an unpaid final notice puts the client on hold, an unpaid second reminder needs approval', '@core', fx1, """
        // Acme's final notice is unpaid: on hold, so its draft can't be sent
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{s:client1.status}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
""" + send_refused() + """        // a payment while on hold pays the overdue invoice first; once it is paid the hold lifts
        await page.getByTestId('payment-form-amount').fill('440');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=440.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{p:client1.status}');
        // though paying 70 days late has made Acme a HIGH risk, whose drafts need approval anyway
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{p:client1.riskBand}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{p:inv2.approval}');
        // Globex's second reminder is unpaid: its draft needs approval
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{p:inv4.approval}');
""", p=p)
    return Spec('cp219_dunning_hold', 'unpaid reminders and credit', """
        While a client has an invoice still overdue after its final notice (its third reminder) went out, the
        client is on hold automatically, with everything a hold means. While a client has an invoice still
        overdue after its second reminder went out, every draft of theirs needs approval.""", [t1], n)


cp(219, 'dunning_hold', """
    Clients who ignore my reminders shouldn't get more credit. While a client has an invoice that is still
    overdue after its final notice (the third reminder) went out, put them on hold automatically, with
    everything a hold means; and while they have one still overdue after its second reminder, make every
    one of their drafts need approval.
""", s219)

# =============================================================================== cp220 weekend holidays are observed (revised calendar)


def s220(n):
    st = {'taxRate': 10, 'holidays': ['2026-07-04', '2026-07-12']}
    fx1 = dict(asOf='2026-06-30', settings=st, clients=[C(A, termsDays=5), C(G, termsDays=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-06-29', '2026-07-31', [L(1, 'Build', 1, 1000)]),
        I(2, 2, 'DRAFT', '2026-06-29', '2026-07-31', [L(2, 'Build', 1, 1000)])])
    s_ = sent5(fx1, [1, 2], n)
    t1 = T('a holiday on a weekend is observed on the nearest weekday', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + send() + """        // Saturday 2026-07-04 is observed on Friday 2026-07-03: 5 business days from Tuesday 2026-06-30 run
        // Wednesday, Thursday, then Monday to Wednesday 2026-07-08
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{sent:inv1.dueDate}');
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + send() + """        // and Sunday 2026-07-12 on Monday 2026-07-13: 10 business days end on Thursday 2026-07-16
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('{sent:inv2.dueDate}');
""", sent=s_)
    st2 = {'taxRate': 10, 'lateInterestRate': 12, 'holidays': ['2026-07-04']}
    fx2 = dict(asOf='2026-07-08', settings=st2, clients=[C(A, graceDays=3)], invoices=[
        I(3, 1, 'SENT', '2026-06-02', '2026-07-02', [L(3, 'Design', 1, 1000)])])
    t2 = T('grace skips an observed holiday', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // due Thursday 2026-07-02: 3 business days of grace are Monday 2026-07-06 to Wednesday 2026-07-08
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
""")
    return Spec('cp220_observed_holidays', 'holidays on weekends', """
        A listed holiday that falls on a Saturday is observed on the Friday before it, and one on a Sunday on
        the Monday after it: that weekday is not a business day, for every count of business days (terms,
        grace, the early-payment window, milestones, approvals and dunning).""", [t1, t2], n)


cp(220, 'observed_holidays', """
    A holiday that falls at the weekend still gives us a day off. When a listed holiday falls on a Saturday,
    treat the Friday before it as the holiday, and when it falls on a Sunday, the Monday after it, for
    every count of business days: terms, grace, the early-payment window, milestones, approvals and dunning.
""", s220, type_='mutative', mutates=[209], algorithm='business-day-calendar-revised',
   copies=['cp209_business_days'])

# =============================================================================== cp221 too little to chase


def s221(n):
    st = {'taxRate': 10, 'dunningMinimum': 25, 'usdPer': RATES}
    fx1 = dict(asOf=SA, settings=st, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'SENT', '2026-04-10', '2026-05-10', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-04-10', '2026-05-10', [L(2, 'Hosting', 1, 30)]),
        I(3, 1, 'SENT', '2026-04-10', '2026-05-10', [L(3, 'Design', 1, 10), L(4, 'Travel', 1, 90)]),
        I(5, 2, 'SENT', '2026-04-10', '2026-05-10', [L(5, 'Hosting', 1, 22.73)])],
        payments=[P(1, 1, 1080, '2026-05-25', [(1, 1080)])])
    a = no_remind5(fx1, 1, n)
    b = remind5(a, 2, n)
    c = remove5(b, 3, 4, n)
    d_ = no_remind5(c, 3, n)
    e = remind5(d_, 5, n)
    t1 = T('an invoice with less than the minimum overdue is not chased', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // 1,100.00 less 1,080.00 paid leaves 20.00 overdue, under the 25.00 minimum
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv1.dunning}');
""" + remind_refused() + """        // 33.00 is enough
        await page.getByTestId('invoice-row-2').click();
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_1');
        // taking the travel off invoice 3 (99.00) leaves 11.00 overdue: no longer chased
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{b:inv3.dunning}');
""" + remove_line(4) + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{c:inv3.due}');
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{c:inv3.dunning}');
""" + remind_refused() + """        // in euros the minimum is 25.00 / 1.10 = 22.7272, down to 22.72: 25.00 owed is chased
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{d:inv5.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=5 level=REMINDER_1');
""", a=a, b=b, c=c, d=d_, e=e)
    return Spec('cp221_dunning_minimum', 'too little to chase', """
        The workspace can set a dunning minimum (settings.dunningMinimum, US dollars converted to the client's
        currency at today's rate, rounded down). An invoice whose overdue amount is under it is at NONE: it
        can't be reminded and its reminders count for nothing until more is overdue.""", [t1], n)


cp(221, 'dunning_minimum', """
    Chasing a client over a few dollars costs more than it brings in. Let the workspace set a dunning minimum
    in US dollars (converted to the client's currency at today's rate, rounded down). An invoice with less
    than that overdue is at NONE: no reminder can go out for it, however late it is.
""", s221)

# =============================================================================== cp222 a rebill can't escape dunning


def s222(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A, UM], invoices=[
        I(1, 1, 'SENT', '2026-04-10', '2026-05-10', [L(1, 'Design', 1, 400)], reminders=['2026-05-20', '2026-06-03']),
        I(2, 4, 'SENT', '2026-03-01', '2026-04-01', [L(2, 'Audit', 1, 400)],
          reminders=['2026-04-10', '2026-05-01', '2026-05-20'])])
    rb = rebill5(fx1, 1, n)
    s_ = sent5(rb, [4], n)
    t1 = T('a replacement keeps the due date and reminders of the invoice it replaces', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv1.dunning}');
        await page.getByTestId('invoice-rebill').click();
        await page.getByTestId('invoice-row-4').click();
""" + send() + """        // sent today but still due 2026-05-10, with its two reminders: overdue at once and not chased again
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('{sent:inv4.dueDate}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv4.status}');
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{sent:inv4.dunning}');
""" + remind_refused() + """        // an invoice whose final notice has gone out can't be rebilled
        await page.getByTestId('client-row-4').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-rebill').click();
        await expect(page.getByTestId('invoice-rebill-error')).toBeVisible();
""", rb=rb, sent=s_)
    fx2 = dict(asOf=SA, settings=st, clients=[G], invoices=[
        I(5, 2, 'SENT', '2026-04-01', '2026-04-30', [L(5, 'Build', 1, 300)], rebilledOn='2026-06-01',
          reminders=['2026-05-10']),
        I(6, 2, 'SENT', '2026-06-01', '2026-06-01', [L(6, 'Build', 1, 300, creditOfLine=5)], creditOf=5),
        I(7, 2, 'DRAFT', '2026-06-01', '2026-04-30', [L(7, 'Build', 1, 300)], replaces=5, reminders=['2026-05-10'])])
    s2 = sent5(fx2, [7], n)
    r2 = remind5(s2, 7, n)
    t2 = T('a replacement made earlier is sent with the old due date', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-7').click();
        await expect(page.getByTestId('invoice-replaces')).toHaveText('{s:inv5.number}');
""" + send() + """        // due 2026-04-30, 41 days ago, first reminder at 10 days, 31 days ago: the second is due
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-due')).toHaveText('{sent:inv7.dueDate}');
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{sent:inv7.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=7 level=REMINDER_2');
""", sent=s2, r=r2)
    return Spec('cp222_dunning_rebill', "a rebill doesn't reset the chasing", """
        Rebilling an invoice that has had reminders moves them to the replacement (invoices[].reminders), and
        the replacement keeps the old invoice's due date when it is sent instead of being re-dated, so it is
        chased from where the old one was. An invoice whose final notice has gone out can't be rebilled.""",
        [t1, t2], n)


cp(222, 'dunning_rebill', """
    Rebilling must not let a late payer start again with a clean slate. When I rebill an invoice that has
    had reminders, move its reminders to the replacement and keep the old invoice's due date on it when it's
    sent, rather than dating it from today, so the chasing carries on where it was. Refuse to rebill an
    invoice once its final notice has gone out.
""", s222)

# =============================================================================== cp223 dunning and late interest


def s223(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'regionMaxInterest': {'NY': 13}}
    fx1 = dict(asOf=SA, settings=st, clients=[A, C(G, region='NY')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-01', [L(1, 'Audit', 1, 1000)],
          reminders=['2026-04-10', '2026-05-01', '2026-05-20']),
        I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)],
          reminders=['2026-03-10', '2026-04-01', '2026-04-20', '2026-05-15']),
        I(3, 2, 'SENT', '2026-03-01', '2026-04-01', [L(3, 'Audit', 1, 1000)],
          reminders=['2026-04-10', '2026-05-01', '2026-05-20'])])
    t1 = T('a final notice raises the interest rate and collections stops it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // C1
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        // handed to collections on 2026-05-15: interest stopped that day
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv2.dunning}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        // NYCMT
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
""".replace('NYCMT', "in New York the 13% maximum caps only the usual 12%, so the final notice still makes it 14%"
               if n >= 232 else "in New York the 13% maximum caps the 14%").replace('C1', (
        "each unpaid final notice makes Acme HIGH for the other: no grace and 3 points more, so 1,100.00 at\n"
        "        // 15% from the due date (2026-04-01) to the final notice on 2026-05-20, then 17%") if n >= 240 else (
        "1,100.00 at 12% from the end of grace (2026-04-08) to the final notice on 2026-05-20, then 14%")))
    return Spec('cp223_dunning_interest', 'chasing and late interest', """
        From the day an invoice's final notice goes out its late interest rate is 2 percentage points higher
        (on top of any rise for a high-risk client, still capped by the region's legal maximum), and from the
        day its collections notice goes out it earns no more late interest.""" if n < 232 else """
        From the day an invoice's final notice goes out its late interest rate is 2 percentage points higher, on
        top of any rise for a high-risk client; the region's legal maximum caps only the usual rate, with the
        rises added on top. From the day its collections notice goes out it earns no more late interest.""",
        [t1], n, copy_note=("UPDATED for cp240 (mutates: [192, 223]): an unpaid final notice now counts in the risk "
                            "score, so each of Acme's two invoices makes it HIGH for the other: no grace and 3 points "
                            "more interest. Carries the test." if n >= 240 else
                            "UPDATED for cp232 (mutates: [179, 223]): the region's maximum now caps only the usual "
                            "rate, so in New York the final notice takes 12% to 14% rather than being held at 13%. "
                            "Carries the test." if n >= 232 else None))


cp(223, 'dunning_interest', """
    A client who has had a final notice should feel it. From the day an invoice's final notice goes out,
    charge late interest on it at 2 percentage points more (on top of any rise for a high-risk client, and
    still within the region's legal maximum); from the day its collections notice goes out, stop charging
    interest on it altogether.
""", s223)

# =============================================================================== cp224 an approval covers a lower total


def s224(n):
    st = {'taxRate': 10, 'approvalLimit': 1000}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-06-01', '2026-06-30', [L(1, 'Build', 1, 1200), L(2, 'Travel', 1, 100)],
          approvedTotal=1430, approvedOn='2026-06-02'),
        I(2, 1, 'DRAFT', '2026-05-01', '2026-06-30', [L(3, 'Build', 1, 1200)], approvedTotal=1320,
          approvedOn='2026-05-08')])
    a = plus(fx1, drop_lines=[(1, 2)])
    b = plus(a, lines=[(1, L(4, 'Support', 1, 150))])
    c = plus(b, inv=[(1, dict(approvedTotal=1485, approvedOn=SA))])
    s_ = sent5(c, [1], n)
    t1 = T('an approval covers a lower total but not a higher one', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv1.approval}');
        // taking the travel off brings it to 1,320.00, under the 1,430.00 approved: still approved
""" + remove_line(2) + """        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
        await expect(page.getByTestId('invoice-approval')).toHaveText('{a:inv1.approval}');
        // 150.00 of support takes it to 1,485.00, over what was approved
""" + add_line('Support', 1, 150) + """        await expect(page.getByTestId('invoice-approval')).toHaveText('{b:inv1.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total={c:inv1.grand|plain}');
""" + send() + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        // an approval still lapses after 30 days, whatever the total
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{sent:inv2.approval}');
""", a=a, b=b, c=c, sent=s_)
    return Spec('cp224_approval_lower_total', 'an approval covers a lower total', """
        An approval covers any grand total up to the one approved: a draft whose total goes down after
        approval stays approved, and only one that goes above the approved total needs approval again. An
        approval still lapses after its time (30 days, 90 for KEY clients, 7 for NEW ones).""", [t1], n)


cp(224, 'approval_lower_total', """
    Asking for a fresh approval because I knocked something off an invoice is a waste of the approver's time.
    Let an approval cover any grand total up to the one approved: if the total goes down it stays approved,
    and only a total above what was approved needs approving again. Approvals still lapse after their time.
""", s224, type_='mutative', mutates=[151, 156], copies=['cp151_approval_limit', 'cp156_approval_changes'])

# =============================================================================== cp225 progress changed after sending


def s225(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30',
          [L(1, 'Build phase', 1, 1234.57, percentComplete=40, billedPct=15), L(2, 'Design', 1, 200)])])
    full = M.D('1234.57')
    old = M.mr(full * 40 / 100)
    new = M.mr(full * 55 / 100)
    a = adj_note(fx1, 1, [L(0, 'Build phase', 1, M.major(new - old))], n)
    t1 = T("changing a sent line's percent complete bills the difference", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 40% of 1,234.57 = 493.828 -> 493.83, less the 15% billed before, 185.1855 -> 185.19
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-billed-pct')).toHaveText('15%');
""" + edit_line(1, pct=55) + """        // 55% = 679.0135 -> 679.01; 679.01 - 493.83 = 185.18 more is billed on a debit note (not 15% of
        // 1,234.57, 185.19), plus 10% tax
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={a:inv2.number} invoice=1 total={a:inv2.grand|plain}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('{a:inv2.listTotal}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-percent')).toHaveText('{a:inv1.line1.percent}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}');
""", a=a)
    fx2 = dict(asOf=SA, settings=st, clients=[G], invoices=[
        I(3, 2, 'SENT', '2026-05-15', '2026-06-30', [L(3, 'Build phase', 1, 2000, percentComplete=60)])])
    b = adj_note(fx2, 3, [L(0, 'Build phase', -1, 300)], n)
    t2 = T('a lower percent complete is credited', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
""" + edit_line(3, pct=45) + """        // 60% down to 45% of 2,000.00: 300.00 and its 30.00 tax come off on a credit note
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={b:inv4.number} invoice=3 total={b:inv4.listTotal|plain}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv3.due}');
""", b=b)
    return Spec('cp225_progress_adjustment', 'progress changed after sending', """
        Changing the percent complete of a line on a sent invoice issues an adjustment note for the change: a
        line with the line's description and the difference between the new and the old percentage's amounts
        (each the percentage of the line's full amount rounded half up on its own; what was billed before is
        unchanged), billed on a debit note or, when lower, taken off on a credit note, priced and taxed like
        the invoice's lines. The invoice's own line keeps the percent it was sent with.""", [t1, t2], n)


cp(225, 'progress_adjustment', """
    Progress figures on a sent invoice get corrected after the fact. When I change the percent complete of a
    line on a sent invoice, issue an adjustment note for the change: one line with the line's description
    for the difference between the new and old percentages' amounts (each worked out as that percentage of
    the line's full amount, rounded half up on its own, with anything billed before left alone), on a debit
    note if it went up or a credit note if it went down, taxed like the invoice's lines. The invoice's own
    line keeps the percent it was sent with.
""", s225)

# =============================================================================== cp226 remittance and adjustment notes


def s226(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Build', 1, 400)], poNumber='PO-7781'),
        I(2, 1, 'SENT', '2026-06-01', '2026-07-31', [L(2, 'Extra', 1, 90)], adjustmentOf=1, poNumber='PO-7781'),
        I(3, 1, 'SENT', '2026-05-20', '2026-06-30', [L(3, 'Hosting', 1, 50)], poNumber='PO-1200')],
        payments=[P(1, 1, 110, '2026-06-01', [(1, 110)], remittance='PO7781')])
    p = pay5(fx1, P(2, 1, 440, SA, [], remittance='po 7781'), n)
    a = add5(p, 1, L(0, 'Travel', 1, 30), n)
    t1 = T("a payment matched to an invoice pays its notes next, and new notes carry its purchase order", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('440');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-remittance').fill('po 7781');
        await page.getByTestId('payment-form-submit').click();
        // 'po 7781' matches PO-7781, and of the invoices carrying it invoice 1 owes the most: its 330.00,
        // then its note's 99.00, before the smaller invoice 3 gets the last 11.00
""" + recorded(p, 2) + """        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('{p:pay1.match}');
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('{p:pay2.match}');
""" + add_line('Travel', 1, 30) + """        // the new note carries PO-7781
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={a:inv4.number} invoice=1 total={a:inv4.grand|plain}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-po')).toHaveText('PO-7781');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{a:inv3.status}');
""", p=p, a=a)
    return Spec('cp226_remittance_notes', 'remittance and adjustment notes', """
        An adjustment note carries its invoice's purchase order number. When remittance text is matched to an
        invoice, that invoice's debit notes are paid straight after it, oldest first, before anything else.""",
        [t1], n)


cp(226, 'remittance_notes', """
    Clients quote the purchase order when they pay, not the adjustment note. Give each adjustment note its
    invoice's purchase order number, and when a payment's remittance text is matched to an invoice, pay that
    invoice's debit notes straight after it, oldest first, before anything else.
""", s226)

# =============================================================================== cp227 generating from an adjusted invoice


def s227(n):
    st = {'taxRate': 10}
    p6 = dict(periodStart='2026-06-01', periodEnd='2026-06-30')
    p7 = dict(periodStart='2026-07-01', periodEnd='2026-07-31')
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(9, 1, 'SENT', '2026-05-01', '2026-05-31',
          [L(1, 'Support plan', 1, 450, periodStart='2026-05-01', periodEnd='2026-05-31')], recurring=True),
        I(10, 1, 'SENT', '2026-06-01', '2026-06-30',
          [L(2, 'Support plan', 1, 450, **p6), L(3, 'Licences', 10, 60, **p6), L(4, 'Setup', 1, 120)],
          recurring=True, recurringFrom=9, recurUntil='2026-12-31')])
    a = edit5(fx1, 10, 3, n, qty=12)
    b = remove5(a, 10, 2, n)
    nid = next_inv_id(b)
    lid = next_line_id(b)
    g = plus(b, invoices=[I(nid, 1, 'DRAFT', SA, SA, [L(lid, 'Licences', 12, 60, **p7)], recurring=True,
                            recurringFrom=10, recurUntil='2026-12-31')])
    g = sent5(g, [nid], n)
    t1 = T('generating from an adjusted invoice copies its lines as adjusted', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // invoice 9 already generated June's invoice 10
        await page.getByTestId('invoice-row-9').click();
        await page.getByTestId('invoice-generate').click();
        await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
        await page.getByTestId('invoice-row-10').click();
""" + edit_line(3, qty=12) + """        // two more licences for June: 120.00 a month for 30 days, 120 x 12 / 365 x 30 = 118.36, plus tax
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=11 number={a:inv11.number} invoice=10 total={a:inv11.grand|plain}');
""" + remove_line(2) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=12 number={b:inv12.number} invoice=10 total={b:inv12.listTotal|plain}');
        await page.getByTestId('invoice-generate').click();
        // July: 12 licences and no support plan, as adjusted; the one-off setup is not copied.
        // 720 x 12 / 365 x 31 = 733.81, plus tax; sent at once
        await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from={g:inv10.number} to={g:inv%d.number}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=%d number={g:inv%d.number} total={g:inv%d.grand|plain}');
        await page.getByTestId('invoice-row-%d').click();
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(1);
        await expect(page.getByTestId('line-row-%d').getByTestId('line-qty')).toHaveText('12');
        await expect(page.getByTestId('line-row-%d').getByTestId('line-period')).toHaveText('2026-07-01 to 2026-07-31');
""".replace('%d', '{nid}').replace('{nid}', str(nid)).replace("line-row-" + str(nid), "line-row-" + str(lid)), a=a, b=b, g=g)
    return Spec('cp227_recurring_adjusted', 'generating from an adjusted invoice', """
        Generate copies a recurring invoice's period lines as adjusted by its adjustment notes: a change of
        quantity carries into the next period, a line taken off by a credit note is not copied, and a line
        added by a debit note with a service period is copied like the invoice's own. An invoice that was
        generated from another (invoices[].recurringFrom) is that one's next period, so the earlier invoice
        can't generate again; the plan still ends at its end date (invoices[].recurUntil).""", [t1], n)


cp(227, 'recurring_adjusted', """
    When I've adjusted a recurring invoice, the next period should follow the adjustments. Make Generate copy
    the period lines as adjusted by the invoice's notes: a quantity changed on a note carries into the next
    period, a line taken off on a credit note isn't copied, and a line with a service period added on a
    debit note is copied like the invoice's own lines. Everything else about generating stays the same.
""", s227)

# =============================================================================== cp228 every level waits two weeks (revised dunning)


def s228(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-30', '2026-05-31', [L(1, 'Build', 1, 300)]),
        I(2, 1, 'SENT', '2026-05-01', '2026-06-01', [L(2, 'Design', 1, 200)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-03-28', [L(3, 'Audit', 1, 400)], reminders=['2026-04-07', '2026-04-28', '2026-06-01']),
        I(4, 1, 'SENT', '2026-03-01', '2026-03-28', [L(4, 'Hosting', 1, 100)], reminders=['2026-04-07', '2026-04-28', '2026-05-20']),
        I(5, 1, 'SENT', '2026-03-21', '2026-04-21', [L(5, 'Support', 1, 150)], reminders=['2026-05-01', '2026-05-31'])])
    a = remind5(fx1, 1, n)
    b = no_remind5(a, 2, n)
    c = no_remind5(b, 3, n)
    d_ = remind5(c, 4, n)
    e = no_remind5(d_, 5, n)
    t1 = T('the first reminder waits ten days and every later level two weeks after the last', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // 10 days overdue: a first reminder
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv1.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=1 level=REMINDER_1');
        // 9 days: nothing yet
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{a:inv2.dunning}');
""" + remind_refused() + """        // 74 days overdue, but its final notice went out at 65 days, only 9 days ago: still FINAL
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{b:inv3.dunning}');
""" + remind_refused() + """        // its final notice went out at 53 days, 21 days ago: collections
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{c:inv4.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=COLLECTIONS');
        // 50 days overdue with a second reminder sent at 40 days: the final notice must wait
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{d:inv5.dunning}');
""" + remind_refused(), a=a, b=b, c=c, d=d_, e=e)
    return Spec('cp228_dunning_revised', 'every level waits two weeks', """
        The dunning levels change: NONE under 10 days overdue; REMINDER_1 from 10; then REMINDER_2 from 21,
        FINAL from 45 and COLLECTIONS from 60, each only once the reminder before it went out at least 14 days
        earlier. A level still never skips the one before it.""", [t1], n)


cp(228, 'dunning_revised', """
    The reminders go out too fast. Start chasing at 10 days overdue instead of 7, and make every level after
    the first wait until the reminder before it is at least 14 days old: REMINDER_2 from 21 days, FINAL
    from 45 and COLLECTIONS from 60, each only once the previous reminder went out 14 or more days earlier.
    A level still never skips the one before it.
""", s228, type_='mutative', mutates=[217], algorithm='dunning-escalation-revised', copies=['cp217_dunning'])

# =============================================================================== cp229 banded units added after sending


def s229(n):
    st = {'taxRate': 10, 'rates': [{'unitType': 'hour', 'tiers': [{'units': 10, 'unitPrice': 100}, {'unitPrice': 90}]}]}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-06-01', '2026-06-30', [L(1, 'Consulting', 8, unitType='hour')]),
        I(2, 1, 'SENT', '2026-06-01', '2026-06-30', [L(2, 'Consulting', 4, unitType='hour')])])
    a = add5(fx1, 1, L(0, 'Consulting', 5, unitType='hour'), n)
    t1 = T("banded units added to a sent invoice continue its bands", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}'); // 8 x 100.00
""" + add_line('Consulting', 5, unit='hour') + """        // hours 9 to 13 of invoice 1: 2 x 100.00 + 3 x 90.00 = 470.00. Not after invoice 2's four hours,
        // billed the same day but after invoice 1 (that would be 5 x 90.00 = 450.00), and not 500.00 as if
        // they were the first five
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={a:inv3.number} invoice=1 total={a:inv3.grand|plain}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{a:inv3.line3.amount}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv3.tax}');
""", a=a)
    return Spec('cp229_banded_adjustments', 'banded units added after sending', """
        Units added to a sent invoice on a debit note for a unit type priced in bands are priced as the next
        units of the bands, after the invoice's own units of that type (and those billed before it that
        month), exactly as if they had been on the invoice; invoices billed after it don't come in between.""", [t1], n)


cp(229, 'banded_adjustments', """
    Adding hours to a sent invoice shouldn't restart the price bands. When a debit note adds units of a type
    priced in bands, price them as the next units after the invoice's own units of that type (and anything
    billed before it that month), just as if they had been on the invoice in the first place: invoices
    billed after it don't come in between.
""", s229)

# =============================================================================== cp230 notes in another currency


def s230(n):
    st = {'taxRate': 10, 'usdPer': RATES, 'fxRates': [{'from': '2026-06-01', 'currency': 'EUR', 'usdPer': 1.2}],
          'rates': [{'unitType': 'day', 'unitPrice': 660}]}
    fx1 = dict(asOf=SA, settings=st, clients=[C(G, currency='EUR')], invoices=[
        I(1, 2, 'SENT', '2026-05-04', '2026-06-30', [L(1, 'Workshop', 1, unitType='day')])])
    a = add5(fx1, 1, L(0, 'Workshop', 1, unitType='day'), n)
    p = pay5(a, P(1, 2, 660, SA, []), n, open_id=2)
    t1 = T("a note is converted at its invoice's rate and its exchange difference measured from it", '@core', fx1, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Workshop', 1, unit='day') + """        // the price list's 660.00 US dollars at the invoice's rate of 1.10: €600.00 (today's 1.20 would give €550.00)
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('{a:inv2.line2.unitPrice}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv2.grand}');
""" + pay('660', SA) + """        // paid today at 1.20: 660.00 x (1.20 - 1.10) = 66.00 US dollars of exchange difference
        await expect(page.getByTestId('invoice-fx-difference')).toHaveText('{p:inv2.fxDiff}');
        await expect.poll(() => auditLines()).toContain('FX_DIFFERENCE id=2 payment=1 amount={p:inv2.fxDiff|plain}');
""", a=a, p=p)
    return Spec('cp230_currency_adjustments', 'adjustment notes in another currency', """
        An adjustment note for a client in another currency converts anything priced in US dollars at its
        invoice's date rate, like the invoice's own lines, and its exchange difference on payments is measured
        from that rate too.""", [t1], n)


cp(230, 'currency_adjustments', """
    Adjustment notes for my euro clients must be in the same money as the invoice. Convert anything priced
    in US dollars on a note at its invoice's date rate, like the invoice's own lines, and measure the note's
    exchange difference on payments from that same rate.
""", s230)

# =============================================================================== cp231 early discount after a credit note


def s231(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, earlyPayPct=2, earlyPayDays=10)], invoices=[
        I(1, 1, 'SENT', '2026-06-05', '2026-07-31', [L(1, 'Build', 1, 800), L(2, 'Travel', 1, 200)])])
    a = remove5(fx1, 1, 2, n)
    v = d5(a, n)
    p = pay5(a, P(1, 1, float(M.plain(M.mr(M.D(v['inv1.settle'].replace('$', '').replace(',', ''))))), SA, []), n, open_id=1)
    b = add5(p, 1, L(0, 'Extra', 1, 50), n)
    t1 = T('a credit note lowers the early-payment discount; a debit note gets none', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 2% of 1,000.00: 1,100.00 - 20.00
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{s:inv1.settle}');
""" + remove_line(2) + """        // 2% of the 800.00 left: 16.00; 1,100.00 - 220.00 - 16.00
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{a:inv1.settle}');
""" + pay('{a:inv1.settle|plain}', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=16.00');
""" + add_line('Extra', 1, 50) + """        // the debit note is owed in full: no early discount on it
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv3.due}');
""", a=a, p=p, b=b)
    return Spec('cp231_early_discount_adjustments', 'early discount and adjustment notes', """
        An invoice's early-payment discount is worked out on its amount before tax less what its credit notes
        and credit adjustment notes take off before tax, so the settle amount follows. A debit adjustment note
        has no early-payment discount of its own.""", [t1], n)


cp(231, 'early_discount_adjustments', """
    The early-payment discount should be on what the client is really paying for. Work it out on the
    invoice's amount before tax less what its credit notes and credit adjustment notes take off (before
    tax), so the settle amount drops with them; a debit adjustment note gets no early-payment discount.
""", s231)

# =============================================================================== cp232 the regional cap applies to the usual rate only


def s232(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'regionMaxInterest': {'NY': 10}}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='NY'), C(G, region='NY')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-04-01', '2026-05-01', [L(2, 'Build', 1, 1000)]),
        I(3, 2, 'SENT', '2026-04-01', '2026-05-01', [L(3, 'Build', 1, 1000)], reminders=['2026-05-11', '2026-05-25', '2026-06-01'])])
    owed = owed_on(fx1, 1, '2026-04-20', n)
    fx1['payments'] = [P(1, 1, owed, '2026-04-20', [(1, owed)])]
    t1 = T('additions for risk and dunning go on top of the capped rate', '@core', fx1, """
        // Acme paid its last invoice, with its interest, 20 days late: HIGH, so no grace and 3 points more
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // New York caps the usual 12% at 10%, then the 3 points: 13% on 1,100.00 from 2026-05-01, 40 days
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        // Globex: 10% from the end of grace, 12% from its final notice on 2026-06-01
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
""")
    return Spec('cp232_cap_usual_rate', 'the regional cap and the additions', """
        A region's legal maximum interest rate caps only the usual late interest rate (the client's own, else
        the workspace's); the 3 points for a high-risk client and the 2 points after a final notice are added
        on top of the capped rate.""", [t1], n)


cp(232, 'cap_usual_rate', """
    My lawyer says the regional cap is on the base rate, and the extra charges for risk and dunning are
    penalties that sit on top. Apply a region's maximum interest rate to the usual rate only (the client's
    own or the workspace's), then add the 3 points for a high-risk client and the 2 points after a final
    notice on top of the capped rate.
""", s232, type_='mutative', mutates=[179, 223], copies=['cp179_risk_interest', 'cp223_dunning_interest'])

# =============================================================================== cp233 notes are chased with their invoice


def s233(n):
    st = {'taxRate': 10, 'reminderFees': {'REMINDER_2': 15}, 'dunningMinimum': 25}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-10', '2026-05-10', [L(1, 'Design', 1, 300)], reminders=['2026-05-20']),
        I(2, 1, 'SENT', '2026-05-01', '2026-05-15', [L(2, 'Extra', 1, 90)], adjustmentOf=1),
        I(3, 1, 'SENT', '2026-04-10', '2026-05-10', [L(3, 'Hosting', 1, 20)]),
        I(4, 1, 'SENT', '2026-05-01', '2026-05-15', [L(4, 'Extra', 1, 10)], adjustmentOf=3),
        I(9, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(9, 'Support', 1, 50)])])
    a = no_remind5(fx1, 2, n)
    b = remind5(a, 1, n)
    c = remind5(b, 3, n)
    r = refused5(c, 9, n, 'approval')
    t1 = T("a debit note is chased with its invoice", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // the note is at its invoice's level and has no reminder of its own
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{s:inv2.dunning}');
""" + remind_refused() + """        await page.getByTestId('invoice-row-1').click();
""" + remind() + """        // the reminder covers the overdue note too; the fee is charged once, on the invoice
        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=1 level=REMINDER_2');
        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_2');
        expect(auditLines().filter((l) => l.startsWith('REMINDER_FEE'))).toEqual(['REMINDER_FEE id=1 amount=15.00']);
        await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('{b:inv1.reminderFees}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('{b:inv2.reminderFees}');
        // 22.00 overdue on invoice 3 is under the 25.00 minimum, but with its note's 11.00 it is 33.00
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{b:inv3.dunning}');
""" + remind() + """        await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=REMINDER_1');
        // with invoice 1 unpaid after its second reminder, a new draft needs approval before it can go
        await page.getByTestId('invoice-row-9').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{c:inv9.approval}');
""" + send_refused(), a=a, b=b, c=c, r=r)
    fx2 = dict(asOf=SA, settings={'taxRate': 10}, clients=[G], invoices=[
        I(5, 2, 'SENT', '2026-03-20', '2026-04-20', [L(5, 'Audit', 1, 200)]),
        I(6, 2, 'SENT', '2026-04-01', '2026-05-01', [L(6, 'Build', 1, 300)], reminders=['2026-05-11']),
        I(7, 2, 'SENT', '2026-05-01', '2026-05-15', [L(7, 'Extra', 1, 100)], adjustmentOf=6)])
    q = pay5(fx2, P(1, 2, 450, SA, []), n)
    if n >= 248:
        order = ("        // invoice 6 has had a reminder and is at REMINDER_2, ahead of the older invoice 5 at REMINDER_1:\n"
                 "        // its 330.00 and its note's 110.00 first, then 10.00 of invoice 5\n")
    else:
        order = ("        // invoice 5 (due 2026-04-20) is at REMINDER_1 and invoice 6 at REMINDER_2; overdue first, oldest\n"
                 "        // due date first: invoice 5 (220.00), then invoice 6 (230.00 of 330.00) before its note\n")
    t2 = T('a spread payment pays chased invoices in turn', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('payment-form-amount').fill('450');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-submit').click();
""" + order + recorded(q, 1) + """        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{q:inv6.due}');
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{q:inv5.due}');
""", q=q)
    return Spec('cp233_notes_dunned', 'notes chased with their invoice', """
        A debit adjustment note is chased with its invoice, not on its own: it shows its invoice's dunning level
        while it is overdue and can't be reminded itself. Reminding an invoice sends the reminder for each of
        its overdue debit notes as well (REMINDER_SENT for each), charging the reminder fee once, on the
        invoice. An invoice's overdue amount, for the dunning minimum, includes its overdue debit notes.""",
        [t1, t2], n, copy_note=("UPDATED for cp248 (mutates: [188, 233]): overdue invoices are now paid highest dunning "
                                "level first, so the 450.00 goes to invoice 6 (REMINDER_2) and its note before the older "
                                "invoice 5 (REMINDER_1). Carries both tests." if n >= 248 else None))


cp(233, 'notes_dunned', """
    An adjustment note shouldn't get its own separate chasing. Chase a debit note together with its invoice:
    while it's overdue it shows its invoice's dunning level and can't be reminded by itself; reminding the
    invoice sends the same reminder for each of its overdue debit notes (a REMINDER_SENT for each) but
    charges the reminder fee only once, on the invoice; and count its overdue notes in the invoice's overdue
    amount when judging the dunning minimum.
""", s233)

# =============================================================================== cp234 crediting the disputed lines resolves the dispute


def s234(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-01', '2026-04-30', [L(1, 'Build', 1, 1000), L(2, 'Travel', 1, 200, disputed=True),
                                                     L(3, 'Taxi', 1, 50, disputed=True)], disputedOn='2026-05-20')])
    a = remove5(fx1, 1, 2, n)
    b = remove5(a, 1, 3, n)
    owed = M.major(M.figures(M.find_inv(M.Ctx(b, n), 1), n, M.Ctx(b, n))['due'])
    pb = pay5(b, P(1, 1, owed, SA, []), n, open_id=1)
    t1 = T('taking off the last disputed line resolves the dispute and waives the interest held back', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{s:inv1.disputed}'); // 220.00 + 55.00
""" + remove_line(2) + """        // the taxi is still in dispute
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{a:inv1.disputed}');
""" + remove_line(3) + """        await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
        await expect(page.getByTestId('invoice-disputed')).toHaveText('{b:inv1.disputed}');
        // 1,375.00 earns interest from 2026-05-07 to the dispute on 2026-05-20, then only the build's
        // 1,100.00: nothing is charged for the disputed lines while they were in dispute
        await expect(page.getByTestId('invoice-interest')).toHaveText('{b:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv1.due}');
""" + pay('{b:inv1.due|plain}', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{pb:inv1.status}');
""", a=a, b=b, pb=pb)
    fx2 = dict(asOf=SA, settings=st, clients=[G], invoices=[
        I(3, 2, 'SENT', '2026-04-01', '2026-04-30', [L(4, 'Build', 1, 1000)], disputedOn='2026-05-01',
          disputeResolvedOn='2026-05-21', disputeCredit=True),
        I(4, 2, 'SENT', '2026-04-01', '2026-04-30', [L(5, 'Build', 1, 1000)], disputedOn='2026-05-01',
          disputeResolvedOn='2026-05-21')])
    t2 = T('a dispute resolved with credit owes no interest for its time in dispute', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        // resolved with a credit note: no interest for 2026-05-01 to 2026-05-21
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        // resolved without one: the interest held back is owed
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv4.interest}');
""")
    return Spec('cp234_credit_resolves_dispute', 'crediting disputed lines', """
        Taking a disputed line off a sent invoice (a credit adjustment note) takes it out of the dispute; taking
        off the last disputed line resolves the dispute with credit (invoices[].disputeResolvedOn,
        disputeCredit; DISPUTE_RESOLVED id=<id>), so the interest held back while it was disputed is waived,
        as for any dispute resolved with a credit note.""", [t1, t2], n)


cp(234, 'credit_resolves_dispute', """
    When I take a disputed line off an invoice, that's the dispute settled in the client's favour. Taking a
    disputed line off a sent invoice takes it out of the dispute, and taking off the last disputed line
    resolves the dispute with credit (write DISPUTE_RESOLVED id=<invoice id>), so the interest held back while
    it was disputed is waived, just as when a dispute is resolved with a credit note.
""", s234)

# =============================================================================== cp235 due dates land on business days


def s235(n):
    st = {'taxRate': 10, 'holidays': ['2026-11-30']}
    fx1 = dict(asOf='2026-09-15', settings=st, clients=[A, C(G, termsDays=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-09-14', '2026-10-31', [L(1, 'Build', 1, 500)]),
        I(2, 2, 'DRAFT', '2026-09-14', '2026-10-31', [L(2, 'Build', 1, 500)])])
    s_ = sent5(fx1, [1, 2], n)
    t1 = T('a due date on a weekend moves to the next business day', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + send() + """        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number={sent:inv1.number} total={sent:inv1.grand|plain}');
        // the end of next month, Saturday 2026-10-31, moves to Monday 2026-11-02
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{sent:inv1.dueDate}');
        await expect(page.getByTestId('invoice-reference')).toHaveText('{sent:inv1.reference}');
        // 10 business days already end on a business day: Tuesday 2026-09-29
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + send() + """        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('{sent:inv2.dueDate}');
""", sent=s_)
    fx2 = dict(asOf='2026-10-14', settings=st, clients=[A], invoices=[
        I(3, 1, 'DRAFT', '2026-10-13', '2026-11-30', [L(3, 'Build', 1, 500)])])
    s2 = sent5(fx2, [3], n)
    t2 = T('a due date on a holiday moves to the next business day', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
""" + send() + """        // the end of next month, Monday 2026-11-30, is a holiday: due Tuesday 2026-12-01
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('{sent:inv3.dueDate}');
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{sent:inv3.number}');
""", sent=s2)
    return Spec('cp235_due_on_business_days', 'due dates on business days', """
        With a holiday calendar, a due date set when an invoice is sent that falls on a Saturday, a Sunday or a
        holiday (as observed) moves to the next business day.""", [t1, t2], n, copy_note=(
        "UPDATED for cp236 (mutates: [7, 18, 235]): invoices issued from 2026-07-01 take an ISO 7064 MOD 11-2 check "
        "character, so invoice 1 sent on 2026-09-15 is INV-000001X with reference RF02 0000 01X, and invoice 3 is "
        "INV-0000036. Carries both tests." if n >= 236 else None))


cp(235, 'due_on_business_days', """
    An invoice due on a Saturday or a holiday isn't really due until the next working day. When the workspace
    has a holiday list and sending gives an invoice a due date on a Saturday, a Sunday or a holiday (as
    observed), move it to the next business day.
""", s235)

# =============================================================================== cp236 a MOD 11-2 check character (revised invoice numbers)


def s236(n):
    st = {'taxRate': 10}
    D7 = '2026-07-15'
    fx1 = dict(asOf=D7, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-06-20', '2026-07-31', [L(1, 'Design', 1, 100)]),
        I(5, 1, 'DRAFT', '2026-07-14', '2026-08-31', [L(4, 'Support', 1, 60)]),
        I(28, 1, 'SENT', '2026-07-02', '2026-08-31', [L(2, 'Build', 1, 500)]),
        I(36, 1, 'SENT', '2026-07-01', '2026-08-31', [L(3, 'Hosting', 1, 80)], poNumber='PO-5521')])
    p = pay5(fx1, P(1, 1, 550, D7, [], reference='RF46 0000 28X'), n)
    q = pay5(p, P(2, 1, 88, D7, [], remittance='PO 5521'), n)
    s_ = sent5(q, [5], n)
    t1 = T('invoices issued from July take a MOD 11-2 check character, in their references too', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // invoice 28, issued on 2026-07-02, is INV-000028X: the Luhn form of its number is no invoice of the client
        await page.getByTestId('payment-form-amount').fill('550');
        await page.getByTestId('payment-form-date').fill('2026-07-15');
        await page.getByTestId('payment-form-reference').fill('INV-0000281');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        // its reference is built from the six digits and the X
        await page.getByTestId('payment-form-reference').fill('RF46 0000 28X');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=28 amount=550.00');
        // remittance matching names the new numbers
        await page.getByTestId('payment-form-amount').fill('88');
        await page.getByTestId('payment-form-date').fill('2026-07-15');
        await page.getByTestId('payment-form-reference').fill('');
        await page.getByTestId('payment-form-remittance').fill('PO 5521');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=36 amount=88.00');
        await page.getByTestId('invoice-row-36').click();
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('{q:pay2.match}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{q:inv36.status}');
        // 000028: p stays 0 over the four zeros, then (0 + 2) x 2 = 4 and (4 + 8) x 2 = 24, mod 11 = 2;
        // (12 - 2) mod 11 = 10 is written X
        await page.getByTestId('invoice-row-28').click();
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{q:inv28.number}');
        await expect(page.getByTestId('invoice-reference')).toHaveText('{q:inv28.reference}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{q:inv28.status}');
        // issued in June: invoice 1 keeps its Luhn digit
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{q:inv1.number}');
        await expect(page.getByTestId('invoice-reference')).toHaveText('{q:inv1.reference}');
        // a draft shown today takes the new check character, and keeps it when sent
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{q:inv5.number}');
""" + send() + """        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=5 number={sent:inv5.number} total={sent:inv5.grand|plain}');
""", p=p, q=q, sent=s_)
    return Spec('cp236_mod11_numbers', 'a MOD 11-2 check character', """
        Invoices, credit notes and adjustment notes issued on or after 2026-07-01 (and drafts from then on)
        are numbered with an ISO 7064 MOD 11-2 check character instead of the Luhn digit: over the six digits
        of the id, p starts at 0 and for each digit becomes (p + digit) x 2 mod 11; the check is (12 - p) mod
        11, written X when it is 10. Their RF payment reference is built from the six digits and that check
        character, and references and remittance matching use the new numbers. Anything issued before then
        keeps its number.""", [t1], n)


cp(236, 'mod11_numbers', """
    Our new bank validates invoice numbers with ISO 7064 MOD 11-2. From 2026-07-01, number invoices, credit
    notes and adjustment notes (and drafts shown from then on) with a MOD 11-2 check character instead of
    the Luhn digit: over the six digits of the id, start with p = 0 and for each digit set p to (p + digit)
    x 2 mod 11; the check is (12 - p) mod 11, written X when it comes to 10. Build the RF payment reference
    from the six digits and that check character, and use the new numbers wherever a number or reference
    is typed or matched. Anything issued before 2026-07-01 keeps the number it has.
""", s236, type_='mutative', mutates=[7, 18, 235], algorithm='luhn-invoice-number-revised',
   copies=['cp235_due_on_business_days'])

# =============================================================================== cp237 payments on non-business days


def s237(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'holidays': ['2026-06-19']}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, graceDays=3)], invoices=[
        I(1, 1, 'SENT', '2026-05-01', '2026-06-01', [L(1, 'Build', 1, 1000)])])
    p = pay5(fx1, P(1, 1, 1100, '2026-06-06', []), n, open_id=1)
    t1 = T('a payment dated on a weekend counts from the next business day', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // due Monday 2026-06-01; 3 business days of grace end Thursday 2026-06-04
""" + pay('1100', '2026-06-06') + """        // paid on Saturday 2026-06-06, received Monday 2026-06-08: 4 days of interest on 1,100.00 at 12%,
        // 1,100.00 x ((1 + 0.12/360)^4 - 1) = 1.4678 -> 1.47, still owed (counting to Saturday would give 0.73)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{p:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
""", p=p)
    fx2 = dict(asOf='2026-06-24', settings=st, clients=[C(G, termsDays=5)], invoices=[
        I(2, 2, 'SENT', '2026-06-11', '2026-06-18', [L(2, 'Design', 1, 100)])])
    q = pay5(fx2, P(1, 2, 110, '2026-06-19', []), n, open_id=2)
    t2 = T('a payment dated on a holiday counts from the next business day', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + pay('110', '2026-06-19') + """        // paid on the 2026-06-19 holiday, received Monday 2026-06-22, after the 2026-06-18 due date
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{q:inv2.status}');
        await expect(page.getByTestId('invoice-paid-date')).toHaveText('{q:inv2.paidDate}');
""", q=q)
    return Spec('cp237_payment_value_date', 'payments on non-business days', """
        With a holiday calendar, a payment dated on a Saturday, a Sunday or a holiday (as observed) counts as
        received on the next business day: late interest runs to that day, and it is the paid date (for Paid
        late and the risk score) and the date judged for the early-payment window.""", [t1, t2], n)


cp(237, 'payment_value_date', """
    Money paid at the weekend doesn't reach us until Monday. With a holiday list, treat a payment dated on a
    Saturday, a Sunday or a holiday (as observed) as received on the next business day: late interest runs
    until then, and that's the paid date for Paid late and the risk score, and the date judged for the
    early-payment window.
""", s237)

# =============================================================================== cp238 a deposit from a client behind on reminders


def s238(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-10', '2026-05-10', [L(1, 'Hosting', 1, 100)], reminders=['2026-05-20', '2026-06-03']),
        I(2, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(2, 'Build', 1, 1000)])])
    a = plus(fx1, inv=[(2, dict(approvedTotal=1100, approvedOn=SA))])
    r = refused5(a, 2, n, 'deposit')
    dep = pay5(r, P(1, 1, 330, SA, [], deposit=True, reference='INV-0000026'), n)
    s_ = sent5(dep, [2], n)
    t1 = T('a client with an unpaid second reminder must pay 30% up front', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv2.approval}');
        await page.getByTestId('invoice-approve').click();
        await expect.poll(() => auditLines().some((l) => l.startsWith('INVOICE_APPROVED id=2 '))).toBe(true);
        // approved, but 30% of 1,100.00 must be held for it first
""" + send_refused() + """        await page.getByTestId('payment-form-deposit').check();
        await page.getByTestId('payment-form-amount').fill('330');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-reference').fill('INV-0000026');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines()).toContain('DEPOSIT_RECORDED id=1 client=1 amount=330.00');
""" + send() + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=330.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv2.due}');
""", a=a, r=r, dep=dep, sent=s_)
    return Spec('cp238_dunned_deposit', 'a deposit from a client behind on reminders', """
        While a client has an invoice still overdue after its second reminder went out, a draft of theirs can
        only be sent once the deposits held for it are worth at least 30% of its grand total (after any
        conversion fee or card surcharge), as for a high-risk client, even when it has been approved.""", [t1], n)


cp(238, 'dunned_deposit', """
    A client ignoring my second reminder should pay up front for new work. While a client has an invoice
    still overdue after its second reminder, only let me send one of their drafts once the deposits held for
    it are worth at least 30% of its grand total (after any conversion fee or card surcharge), just as for a
    high-risk client, even if it has been approved. A replacement for an invoice I've rebilled isn't held
    back by this: it bills work already invoiced.
""", s238)

# =============================================================================== cp239 collections write-off


def s239(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Audit', 1, 400)],
          reminders=['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-01']),
        I(2, 1, 'SENT', '2026-05-01', '2026-06-30', [L(2, 'Design', 1, 200)]),
        I(3, 2, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Audit', 1, 400)],
          reminders=['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-20']),
        I(4, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(4, 'Support', 1, 80)])])
    r = refused5(fx1, 4, n, 'approval')
    t1 = T('an invoice is written off 30 days after its collections notice', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // collections notice on 2026-05-01: written off on 2026-05-31
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{s:inv1.writtenOff}');
        // out of the balance, and no longer an unpaid final notice holding the client
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{s:client1.status}');
        // counted as paid on 2026-05-31, 91 days late: HIGH
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{s:client1.riskScore}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv4.approval}');
""" + send_refused() + """        // Globex's collections notice is only 21 days old
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('{s:client2.status}');
""", r=r)
    return Spec('cp239_collections_write_off', 'written off after collections', """
        An invoice still owing 30 days after its collections notice went out is written off that day, exactly
        as a write-off by hand: status Written off, the amount written off shown, out of the balance and
        overdue amount, no more interest, and counted in the risk score as paid on the day it was written off.""",
        [t1], n)


cp(239, 'collections_write_off', """
    Once an invoice has been with collections for a month I give up on it. If an invoice still owes something
    30 days after its collections notice went out, write it off that day, just as if I had written it off by
    hand: it shows Written off and the amount written off, leaves the balance and the overdue amount, earns no
    more interest, and counts in the risk score as paid on the day it was written off.
""", s239)

# =============================================================================== cp240 an unpaid final notice counts in the risk score


def s240(n):
    st = {'taxRate': 10, 'lateInterestRate': 12, 'approvalLimit': 5000}
    fx1 = dict(asOf=SA, settings=st, clients=[G], invoices=[
        I(1, 2, 'SENT', '2026-03-21', '2026-04-21', [L(1, 'Audit', 1, 400)], reminders=['2026-05-01', '2026-05-15', '2026-06-01']),
        I(2, 2, 'SENT', '2026-05-15', '2026-06-05', [L(2, 'Build', 1, 1000)]),
        I(3, 2, 'DRAFT', '2026-06-08', '2026-06-30', [L(3, 'Design', 1, 100)])])
    t1 = T('an unpaid final notice counts in the risk score as if paid today', '@core', fx1, """
        // nothing paid yet, but the final notice is unpaid 50 days after the due date: a score of 50.0
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('{s:client2.riskScore}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('{s:client2.riskBand}');
        await page.getByTestId('client-row-2').click();
        // so its other invoice has no grace and 3 points more interest: 15% from 2026-06-05
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{s:inv3.approval}');
""" + send_refused(), r=refused5(fx1, 3, n, 'approval'))
    return Spec('cp240_risk_final_notice', 'unpaid final notices and risk', """
        An invoice still overdue after its final notice went out counts in its client's risk score as if it
        were paid today, with its days late so far, with everything the score drives.""", [t1], n)


cp(240, 'risk_final_notice', """
    A client sitting on a final notice is a bad risk even if they've never paid anything late before, because
    they haven't paid at all. Count an invoice that is still overdue after its final notice in the client's
    risk score as if it were paid today, with its days late so far, and let that drive everything the score
    drives.
""", s240, type_='mutative', mutates=[192, 223], copies=['cp223_dunning_interest'])

# =============================================================================== cp241 a kept promise waives its interest


def s241(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-01', '2026-04-30', [L(1, 'Build', 1, 1000)], promiseAmount=600,
          promiseDate='2026-06-20', promisedOn='2026-05-27'),
        I(2, 1, 'SENT', '2026-04-01', '2026-04-30', [L(2, 'Design', 1, 1000)], promiseAmount=600,
          promiseDate='2026-06-20', promisedOn='2026-05-27')],
        payments=[P(1, 1, 300, '2026-06-01', [(1, 300)]), P(2, 1, 300, '2026-06-01', [(2, 300)])])
    p = pay5(fx1, P(3, 1, 300, SA, []), n, open_id=1)
    t1 = T('keeping a promise waives the interest that ran while it stood', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
""" + pay('300', SA) + """        // 300.00 + 300.00 since 2026-05-27 keeps the promise of 600.00 by 2026-06-20: the interest from
        // 2026-05-27 to today is waived; what ran from the end of grace (2026-05-07) to the promise stays
        await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount={p:inv1.promiseWaived|plain}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{p:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv1.due}');
        // invoice 2's promise still stands, its interest running
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{p:inv2.interest}');
""", p=p)
    return Spec('cp241_promise_kept', 'a kept promise waives its interest', """
        When payments since a promise to pay reach the promised amount by its date, the late interest that ran
        from the day the promise was made until the day it was kept is waived (INTEREST_WAIVED id=<id>
        amount=<waived>); interest from before the promise stays owed, and interest after it runs as usual
        on what is still overdue.""", [t1], n)


cp(241, 'promise_kept', """
    A client who keeps their promise should be rewarded. When payments since a promise reach the promised
    amount by its date, waive the late interest that ran from the day the promise was made to the day it was
    kept (write INTEREST_WAIVED id=<invoice id> amount=<waived>). Interest from before the promise stays owed,
    and whatever is still overdue afterwards earns interest as usual. The day the promise is made and the day
    it is kept each start a new interest period, so the interest waived is that period's own, worked out and
    rounded on its own.
""", s241)

# =============================================================================== cp242 a credit note keeps the minimum charge


def s242(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, minimumCharge=300)], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Design', 1, 250), L(2, 'Travel', 1, 100)])])
    a = remove5(fx1, 1, 2, n)
    pa = pay5(a, P(1, 1, 330, SA, []), n, open_id=1)
    fx2 = dict(asOf=SA, settings=st, clients=[C(G, minimumCharge=300)], invoices=[
        I(3, 2, 'SENT', '2026-05-15', '2026-06-30', [L(3, 'Design', 1, 450), L(4, 'Travel', 1, 100)])])
    b = remove5(fx2, 3, 4, n)
    t1 = T('a credit note never takes an invoice below its minimum charge', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 350.00 of lines, over the 300.00 minimum
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv1.minimumCharge}');
""" + remove_line(2) + """        // taking the travel off would leave 250.00: 50.00 of the credit is kept back as the minimum charge,
        // so the note credits 50.00 + 5.00 tax
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={a:inv2.number} invoice=1 total={a:inv2.listTotal|plain}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{a:inv2.minimumCharge}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}'); // 385.00 - 55.00
""" + pay('330', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{pa:inv1.status}');
""", a=a, pa=pa)
    t2 = T('above the minimum the whole line is credited', '@core', fx2, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
""" + remove_line(4) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number={b:inv4.number} invoice=3 total={b:inv4.listTotal|plain}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv3.due}');
""", b=b)
    return Spec('cp242_credit_keeps_minimum', 'credit notes and the minimum charge', """
        A credit adjustment note never takes its invoice below its minimum charge: when its lines, after the
        invoice's discount and with its surcharge, would leave the invoice (with its earlier notes) under the
        minimum, the part that would is kept back on the note as a minimum charge, taxed at the standard rate
        on its own (rounded half up), and the note credits only the rest.""", [t1, t2], n)


cp(242, 'credit_keeps_minimum', """
    Taking lines off an invoice mustn't get round my minimum charge. When a credit note would leave its
    invoice (with any earlier notes) below the minimum charge, keep back on the note the part that would,
    as a minimum charge taxed at the standard rate on its own (rounded half up), and credit only the rest.
""", s242)

# =============================================================================== cp243 a note on an overdue invoice is due at once


def s243(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, termsDays=30)], invoices=[
        I(1, 1, 'SENT', '2026-04-01', '2026-05-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-06-01', '2026-06-01', [L(2, 'Extra', 1, 300)], adjustmentOf=1),
        I(3, 1, 'SENT', '2026-05-20', '2026-06-19', [L(3, 'Design', 1, 200)])])
    a = add5(fx1, 1, L(0, 'Travel', 1, 80), n)
    b = add5(a, 3, L(0, 'Copy', 1, 40), n)
    t1 = T('a note on an overdue invoice is due at once, with no grace', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // issued and due on 2026-06-01 with its invoice already overdue: overdue the next day, 330.00 earning
        // interest from 2026-06-01
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Travel', 1, 80) + """        // a new note on the overdue invoice is due today rather than in 30 days
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('{a:inv4.dueDate}');
        // on an invoice that is not overdue the usual terms apply
        await page.getByTestId('invoice-row-3').click();
""" + add_line('Copy', 1, 40) + """        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('{b:inv5.dueDate}');
""", a=a, b=b)
    return Spec('cp243_note_due_at_once', 'notes on overdue invoices', """
        A debit adjustment note on an invoice that is overdue when it is issued is due the day it is issued and
        has no grace period: it is overdue from the next day and earns late interest from its due date. Notes
        on other invoices keep the usual terms.""", [t1], n)


cp(243, 'note_due_at_once', """
    Extra charges on an invoice that is already overdue shouldn't get fresh terms. Make a debit adjustment
    note on an invoice that is overdue when the note is issued due that same day, with no grace period, so it
    is overdue from the next day and earns late interest from its due date. Notes on invoices that aren't
    overdue keep the usual terms.
""", s243)

# =============================================================================== cp244 an edit is one note for the change (revised notes)


def s244(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Design', 3, 33.33), L(2, 'Hosting', 1, 80, taxExempt=True)])])
    a = edit5(fx1, 1, 1, n, unitPrice=36.67)
    b = edit5(a, 1, 2, n, qty=2, unitPrice=70)
    t1 = T('editing a sent line issues one note for the change in its amount', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + edit_line(1, price=36.67) + """        // 3 x 33.33 = 99.99 becomes 3 x 36.67 = 110.01: one debit note for 10.02, taxed 1.00 (10% of 10.02),
        // not 99.99 off and 110.01 back on (10.00 and 11.00 of tax)
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={a:inv2.number} invoice=1 total={a:inv2.grand|plain}');
        expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toHaveLength(1);
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{a:inv2.line3.amount}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv2.tax}');
        // an untaxed line edited: 80.00 becomes 2 x 70.00 = 140.00, a debit note for 60.00 with no tax
        await page.getByTestId('invoice-row-1').click();
""" + edit_line(2, qty=2, price=70) + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={b:inv3.number} invoice=1 total={b:inv3.grand|plain}');
        await expect(page.getByTestId('invoice-adjusted')).toHaveText('{b:inv1.adjusted}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{b:client1.balance}');
""", a=a, b=b)
    return Spec('cp244_edit_one_note', 'an edit is one note', """
        Any edit of a sent line other than a change of quantity alone is now one adjustment note for the change
        in the line's amount: a line with the line's description, quantity 1 (or -1 when the amount went down,
        on a credit note) and the difference as its price, keeping the line's tax rate or exemption. A change of
        quantity alone is still one note for the difference in quantity.""", [t1], n)


cp(244, 'edit_one_note', """
    Two adjustment notes for one edit confuse my clients. When I edit a line of a sent invoice in any way other
    than just its quantity, issue a single note for the change in the line's amount: a line with the line's
    description, quantity 1 (a credit note with quantity -1 if the amount went down) and the difference as
    its price, keeping the line's tax rate or exemption. Changing only the quantity still gives one note for
    the difference in quantity.
""", s244, type_='mutative', mutates=[42, 204],
   retires=['cp42_edit_line.spec.ts::editing a line of a sent invoice takes the old line off and bills the new one'])

# =============================================================================== cp245 short terms after a final notice


def s245(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Audit', 1, 400)], reminders=['2026-03-11', '2026-04-01', '2026-05-01']),
        I(2, 1, 'SENT', '2026-05-15', '2026-05-15', [L(2, 'Audit', 1, 400, creditOfLine=1)], creditOf=1),
        I(3, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(3, 'Design', 1, 200)]),
        I(4, 2, 'SENT', '2025-11-01', '2025-12-01', [L(4, 'Audit', 1, 400)], reminders=['2025-12-11', '2026-01-01', '2026-02-01']),
        I(5, 2, 'SENT', '2026-02-15', '2026-02-15', [L(5, 'Audit', 1, 400, creditOfLine=4)], creditOf=4),
        I(6, 2, 'DRAFT', '2026-06-08', '2026-06-30', [L(6, 'Design', 1, 200)])])
    s_ = sent5(fx1, [3, 6], n)
    t1 = T('a client given a final notice in the last 90 days gets at most 7 days', '@core', fx1, """
        // Acme's final notice went out on 2026-05-01, 40 days ago (the invoice was later credited)
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('{s:client1.riskBand}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
""" + send() + """        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('{sent:inv3.dueDate}');
        // Globex's was on 2026-02-01, 129 days ago: the usual end of next month
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-6').click();
""" + send() + """        await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-due')).toHaveText('{sent:inv6.dueDate}');
""", sent=s_)
    return Spec('cp245_terms_after_final', 'short terms after a final notice', """
        A client one of whose invoices had its final notice in the last 90 days gets at most 7 days' terms on
        an invoice sent now (as for a high-risk client), however the final notice ended.""", [t1], n)


cp(245, 'terms_after_final', """
    A client who needed a final notice recently doesn't get long terms. If any of a client's invoices had its
    final notice in the last 90 days, however it ended, make an invoice sent to them due no more than 7 days
    after it is sent, as for a high-risk client.
""", s245)

# =============================================================================== cp246 credit pays the invoice's notes


def s246(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Design', 1, 100), L(2, 'Travel', 1, 50)]),
        I(2, 1, 'SENT', '2026-05-20', '2026-06-30', [L(3, 'Hosting', 1, 40)]),
        I(3, 1, 'SENT', '2026-06-01', '2026-07-31', [L(4, 'Extra', 1, 30)], adjustmentOf=1),
        I(4, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(5, 'Support', 1, 60)])],
        payments=[P(1, 1, 165, '2026-05-20', [(1, 165)])])
    a = remove5(fx1, 1, 2, n)
    b = sent5(a, [4], n)
    t1 = T("a credit note's excess pays the invoice's unpaid notes first", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + remove_line(2) + """        // the paid invoice owes nothing, so the 55.00 pays its note's 33.00 and only 22.00 is held as credit
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=3 amount=33.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=22.00');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{a:inv3.status}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}');
        // the 22.00 is used on the next invoice sent
        await page.getByTestId('invoice-row-4').click();
""" + send() + """        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=4 amount=22.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv4.due}');
""", a=a, b=b)
    return Spec('cp246_credit_pays_notes', "a credit note pays the invoice's notes", """
        When a credit note (or credit adjustment note) is for more than its invoice still owes, the rest pays the
        invoice's unpaid debit adjustment notes first, oldest first (PAYMENT_RECORDED for each), and only what is
        left after them is held as credit (CREDIT_HELD).""", [t1], n)


cp(246, 'credit_pays_notes', """
    Credit left over from crediting an invoice should settle that invoice's own extra charges first. When a
    credit note or credit adjustment note is for more than its invoice still owes, use the rest on the
    invoice's unpaid debit notes, oldest first (writing PAYMENT_RECORDED for each), and hold only what's left
    after that as credit.
""", s246)

# =============================================================================== cp247 a promise covers the notes


def s247(n):
    st = {'taxRate': 10, 'lateInterestRate': 12}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-04-01', '2026-04-30', [L(1, 'Build', 1, 1000)], promiseAmount=400,
          promiseDate='2026-06-25', promisedOn='2026-06-01'),
        I(2, 1, 'SENT', '2026-05-01', '2026-05-15', [L(2, 'Extra', 1, 200)], adjustmentOf=1)],
        payments=[P(1, 1, 180, '2026-06-03', [(1, 180)])])
    p = pay5(fx1, P(2, 1, 220, SA, []), n, open_id=2)
    t1 = T("a promise holds off the invoice's notes too, and payments on them count towards it", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // the note is held off with its invoice's promise
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""" + pay('220', SA) + """        // 180.00 on the invoice and 220.00 on its note make the 400.00 promised: kept
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv2.status}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{p:inv1.status}');
        await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount={p:inv1.promiseWaived|plain}');
""", p=p)
    return Spec('cp247_promise_notes', "a promise covers the invoice's notes", """
        A promise to pay on an invoice also holds off its overdue debit adjustment notes (they are Promised too),
        and payments on those notes since the promise count towards the promised amount.""", [t1], n)


cp(247, 'promise_notes', """
    When a client promises to pay an invoice, the promise should cover its adjustment notes too. While the
    promise stands, show its overdue debit notes as Promised as well, and count payments on those notes since
    the promise towards the promised amount.
""", s247)

# =============================================================================== cp248 the most chased first (revised payment order)


def s248(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-01', [L(1, 'Audit', 1, 100)]),
        I(2, 1, 'SENT', '2026-03-15', '2026-04-15', [L(2, 'Build', 1, 300)], reminders=['2026-04-25', '2026-05-10']),
        I(3, 1, 'SENT', '2026-04-01', '2026-05-01', [L(3, 'Design', 1, 200)], reminders=['2026-05-11']),
        I(4, 1, 'SENT', '2026-05-20', '2026-06-30', [L(4, 'Hosting', 1, 50)])])
    p = pay5(fx1, P(1, 1, 500, SA, []), n)
    t1 = T('a spread payment pays the most chased overdue invoice first', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('500');
        await page.getByTestId('payment-form-date').fill('2026-06-10');
        await page.getByTestId('payment-form-submit').click();
        // invoice 2 has reached FINAL (330.00), then invoice 3 REMINDER_2 (only 170.00 of 220.00 left), and the
        // oldest, invoice 1 at REMINDER_1, waits
""" + recorded(p, 1) + """        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{p:inv1.status}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{p:inv1.dunning}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-dunning')).toHaveText('{p:inv3.dunning}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{p:inv3.due}');
""", p=p)
    return Spec('cp248_most_chased_first', 'the most chased first', """
        When a payment is spread automatically, across several references or by Apply credit, overdue invoices
        are paid highest dunning level first (COLLECTIONS, then FINAL, REMINDER_2, REMINDER_1, NONE), and on the
        same level oldest due date first (lower id on the same date); then the rest as before.""", [t1], n)


cp(248, 'most_chased_first', """
    The invoices I've chased hardest are the ones I most need paid. When a payment is spread automatically,
    across several references or by Apply credit, pay overdue invoices in order of how far their chasing has
    gone (COLLECTIONS first, then FINAL, REMINDER_2, REMINDER_1, NONE), oldest due date first within a level
    (lower id on the same date), and then everything else as before. A payment from a client on hold still
    pays their overdue invoices oldest due date first.
""", s248, type_='mutative', mutates=[188, 233], copies=['cp233_notes_dunned'])

# =============================================================================== cp249 notes wait while a client is on hold


def s249(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, onHold=True)], invoices=[
        I(1, 1, 'SENT', '2026-05-15', '2026-06-30', [L(1, 'Build', 1, 500), L(2, 'Travel', 1, 100)])])
    a = add5(fx1, 1, L(0, 'Extra', 1, 80), n)
    b = remove5(a, 1, 2, n)
    c = plus(b, clients=[])
    c['clients'][0]['onHold'] = False
    d_ = sent5(c, [2], n)
    t1 = T('a debit note waits while the client is on hold; a credit note does not', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + add_line('Extra', 1, 80) + """        // the note is left as a draft
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
""" + remove_line(2) + """        // taking the travel off is issued at once
        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number={b:inv3.number} invoice=1 total={b:inv3.listTotal|plain}');
        await page.getByTestId('invoice-row-2').click();
""" + send_refused() + """        // once the hold is lifted the note can go
        await page.getByTestId('client-row-1').getByTestId('client-hold').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('{c:client1.status}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
""" + send() + """        await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number={d:inv2.number} invoice=1 total={d:inv2.grand|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{d:client1.balance}');
""", a=a, b=b, c=c, d=d_)
    return Spec('cp249_hold_notes', 'notes wait while on hold', """
        A debit adjustment note for a client on hold (for any reason) is left as a draft note instead of being
        sent, and sending it is refused until the hold ends; a credit note is issued at once whatever the hold.""",
        [t1], n)


cp(249, 'hold_notes', """
    Putting a client on hold should stop extra charges going out too. While a client is on hold, for whatever
    reason, leave a debit adjustment note as a draft instead of sending it, and refuse to send it until the
    hold ends. Credit notes still go out straight away.
""", s249)

# =============================================================================== cp250 writing off an invoice writes off its notes


def s250(n):
    st = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-03-31', [L(1, 'Build', 1, 500)]),
        I(2, 1, 'SENT', '2026-05-01', '2026-05-31', [L(2, 'Extra', 1, 100)], adjustmentOf=1),
        I(3, 1, 'SENT', '2026-05-20', '2026-06-30', [L(3, 'Hosting', 1, 50)]),
        I(4, 2, 'SENT', '2026-02-01', '2026-03-01', [L(4, 'Audit', 1, 400)],
          reminders=['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-01']),
        I(5, 2, 'SENT', '2026-04-20', '2026-05-04', [L(5, 'Extra', 1, 60)], adjustmentOf=4),
        I(6, 1, 'DRAFT', '2026-06-08', '2026-06-30', [L(6, 'Support', 1, 80)])])
    w = plus(fx1, inv=[(1, dict(writtenOffOn=SA))])
    r = refused5(w, 6, n, 'approval')
    t1 = T("writing an invoice off writes off its notes too", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-write-off').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount={w:inv1.writtenOff|plain}');
        await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=2 amount={w:inv2.writtenOff|plain}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{w:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{w:client1.balance}');
        // both count as paid today: 71 days late, then 10 (0.5 x 10 + 0.5 x 71 = 40.5)
        await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('{w:client1.riskScore}');
        // so Acme is HIGH and its draft needs two approvals
        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId('invoice-approval')).toHaveText('{w:inv6.approval}');
""" + send_refused() + """        // Globex's invoice went with collections; its note went with it on 2026-05-31
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{w:inv5.status}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{w:inv5.writtenOff}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{w:client2.balance}');
""", w=w, r=r)
    return Spec('cp250_write_off_notes', "an invoice's notes go with it", """
        When an invoice is written off, by hand or after collections, its debit adjustment notes still owing are
        written off the same day, each writing INVOICE_WRITTEN_OFF id=<note id> amount=<amount> and counted in
        the risk score as paid that day.""", [t1], n)


cp(250, 'write_off_notes', """
    When I give up on an invoice, its adjustment notes should go with it. Whenever an invoice is written off,
    by hand or after collections, write off its debit notes that still owe something the same day, writing
    INVOICE_WRITTEN_OFF id=<note id> amount=<amount> for each, and count them in the risk score as paid that
    day.
""", s250)
