"""Act II checkpoints, in order. Each registers its request and a spec function spec(n) -> Spec,
where n is the version (its own checkpoint, or a later mutation that ships an updated copy)."""
from lib import *  # noqa

SA = '2026-03-10'

# =============================================================================== cp51 deposits


def s51(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 80)]),
        I(2, 1, 'DRAFT', '2026-03-02', '2026-04-30', [L(2, 'Hosting', 1, 50)])])
    dep = plus(fx1, payments=[P(1, 1, 100, '2026-03-05', [])])
    sent1 = plus(dep, inv=[(1, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))], alloc=[(1, 1, 80, SA)])
    sent2 = plus(sent1, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))], alloc=[(1, 2, 20, SA)])
    t1 = T('holds a deposit as credit and uses it when an invoice is sent', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // even with a draft open, a deposit goes to the client's account, not the invoice
        await page.getByTestId('payment-form-deposit').check();
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines()).toContain('DEPOSIT_RECORDED id=1 client=1 amount=100.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{dep:client1.credit}');
        // nothing sent yet, less 100.00 of credit
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{dep:client1.balance}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{dep:inv1.status}');

        await page.getByTestId('invoice-send').click();
        // sent today: the 80.00 invoice takes 80.00 of the credit on the day it is sent
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent1:inv1.status}');
        await expect(page.getByTestId('invoice-paid')).toHaveText('{sent1:inv1.paid}');
        await expect(page.getByTestId('invoice-paid-date')).toHaveText('{sent1:inv1.paidDate}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount={sent1:inv1.paid|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent1:client1.credit}'); // 100.00 - 80.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent1:client1.balance}');

        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        // only 20.00 of credit is left for the 50.00 invoice
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent2:inv2.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent2:inv2.due}'); // 50.00 - 20.00
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=20.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent2:client1.credit}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent2:client1.balance}');
    """, dep=dep, sent1=sent1, sent2=sent2)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        # paid 14 days after issue, so the client stays LOW risk once risk scores arrive (cp161) and
        # invoice 6 can still be sent
        I(5, 1, 'SENT', '2026-02-15', '2026-02-20', [L(1, 'Design', 1, 40)]),
        I(6, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 70)])],
        payments=[P(3, 1, 100, '2026-02-01', [(5, 40, '2026-03-01')]), P(4, 1, 30, '2026-01-15', [])])
    sent = plus(fx2, inv=[(6, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))],
                alloc=[(4, 6, 30, SA), (3, 6, 40, SA)])
    t2 = T('uses the oldest credit first and counts it as paid on the day it is applied', '@core', fx2, """
        // payment 3 (100.00 on 2026-02-01) was applied to invoice 5 only on 2026-03-01, after its
        // 2026-02-20 due date; payment 4 is a 30.00 deposit
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}'); // 60.00 + 30.00
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-paid-date')).toHaveText('{s:inv5.paidDate}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv5.status}');

        await page.getByTestId('invoice-row-6').click();
        await page.getByTestId('invoice-send').click();
        // the oldest credit first: payment 4 (2026-01-15) gives 30.00, then payment 3 the other 40.00
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=4 invoice=6 amount=30.00',
          'PAYMENT_RECORDED id=3 invoice=6 amount=40.00',
        ]);
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv6.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv6.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent:client1.credit}'); // 90.00 - 70.00
    """, sent=sent)
    return Spec('cp51_deposits', 'deposits held as credit', """
        A payment can be recorded as a deposit (the Deposit box on the payment form): the whole amount is
        held on the client's account as credit, applied to no invoice even when one is open, and
        DEPOSIT_RECORDED id=<payment id> client=<client id> amount=<amount> is written. Any part of a
        payment not applied to an invoice (payments[].allocations adding up to less than its amount) is
        credit. The client list shows each client's unused credit and takes it off their balance. Sending
        an invoice uses the client's credit on it straight away, up to its amount due, the oldest payment
        first (lower id on the same date), writing PAYMENT_RECORDED for each payment used. Credit used is
        recorded as applied on that day (allocations[].date), and counts as paid on that day for the paid
        date and Paid late.""", [t1, t2], n)


cp(51, 'deposits', """
    Let me take a deposit before I've invoiced a client. With a client selected, ticking Deposit on
    the payment form records the whole payment as credit on the client's account, applied to no
    invoice, even if an invoice is open (it still needs an amount over zero with at most two decimals
    and a date not after today), and writes DEPOSIT_RECORDED id=<payment id> client=<client id>
    amount=<amount>. Show each client's unused credit in the client list and take it off their balance
    (a balance can go below zero). When I send one of their invoices, use their credit on it straight
    away, up to its amount due: the oldest payment's credit first (lower id on the same date), writing
    PAYMENT_RECORDED id=<payment id> invoice=<invoice id> amount=<amount used> for each payment used.
    Credit used this way counts as paid on the day it was applied, for the paid date and Paid late.
""", s51)


def V(fx, n):
    return workspace_values(fx, n)


def num(money_str):
    """A formatted amount as the number typed into a form / seeded (e.g. '$1,234.50' -> 1234.5)."""
    v = float(plain_of(money_str))
    return int(v) if v == int(v) else v


# =============================================================================== cp52 overpayment


def s52(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Retainer', 1, 150)]),
        I(2, 1, 'DRAFT', '2026-03-02', '2026-04-30', [L(2, 'Design', 1, 30)])])
    a = plus(fx1, payments=[P(1, 1, 200, '2026-03-09', [(1, 150)])])
    b = plus(a, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))], alloc=[(1, 2, 30, SA)])
    t1 = T('keeps what an open-invoice payment overpays as credit', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('payment-form-amount').fill('200');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 150.00 settles the invoice; the other 50.00 is held on the client's account
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$200.00');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{a:inv1.paid}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=150.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=50.00'); // 200.00 - 150.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}');

        // the held credit pays the next invoice sent
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv2.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=30.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{b:client1.credit}'); // 50.00 - 30.00
    """, a=a, b=b)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-10', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(3, 1, 'SENT', '2026-02-10', '2026-03-31', [L(2, 'Support', 1, 50)]),
        I(12, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Hosting', 1, 80)])])
    r = plus(fx2, payments=[P(1, 1, 100, '2026-03-09', [(12, 80)], reference='RF24 0000 125')])
    au = plus(r, payments=[P(2, 1, 170, '2026-03-09', [(1, 100), (3, 50)])])
    t2 = T('a reference or automatic payment beyond what is owed is held as credit', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-reference').fill('RF24 0000 125'); // invoice 12, 80.00 due
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('{r:inv12.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 100.00 - 80.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{r:client1.credit}');

        // no invoice open, no reference: 170.00 against the 150.00 still owed
        await page.getByTestId('payment-form-reference').fill('');
        await page.getByTestId('payment-form-amount').fill('170');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{au:inv1.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{au:inv3.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=1 amount=100.00');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=3 amount=50.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00'); // 170.00 - 150.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{au:client1.credit}'); // 20.00 + 20.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{au:client1.balance}');
    """, r=r, au=au)
    return Spec('cp52_overpayment_credit', 'overpayments held as credit', """
        A payment for more than the invoices it goes to still owe is no longer refused: against the open
        invoice, by reference or applied automatically, they are paid as usual and the rest is held on
        the client's account as credit, writing CREDIT_HELD payment=<payment id> amount=<amount held>.
        The payment shows its whole amount and, per invoice, the part applied there. Held credit is used
        like a deposit when the client's next invoice is sent.""", [t1, t2], n)


cp(52, 'overpayment_credit', """
    Stop refusing payments for more than is owed. When a payment against the open invoice, by
    reference or references, or applied automatically is more than the invoices it goes to still
    owe, pay them as usual and keep the rest on the client's account as credit, writing CREDIT_HELD
    payment=<payment id> amount=<amount kept>. Only a split over the invoice boxes must still add up
    exactly to the payment, and no box may be more than its invoice's amount due.
""", s52, type_='mutative', mutates=[17, 22, 37, 50], retires=[
    'cp22_auto_allocation.spec.ts::refuses more than the client owes',
    'cp37_pay_by_reference.spec.ts::refuses a reference that is mistyped, foreign or overpaid',
    'cp50_several_references.spec.ts::refuses the payment if any reference is wrong or it is too much'])

# =============================================================================== cp53 refunds


def s53(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 25)])],
        payments=[P(1, 1, 50, '2026-01-20', []), P(2, 1, 120, '2026-02-10', [(1, 100)]),
                  P(3, 1, 40, '2026-02-05', [], refunded=10)])
    r = plus(fx1, pay=[(1, dict(refunded=50)), (3, dict(refunded=30))])
    sent = plus(r, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))],
                alloc=[(3, 2, 10, SA), (2, 2, 15, SA)])
    t1 = T('refunds the oldest credit first', '@core', fx1, """
        // credit: payment 1 50.00 + payment 2 20.00 (120.00 - 100.00) + payment 3 30.00 (40.00 - 10.00 refunded)
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}');
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('refund-form-amount').fill('70');
        await page.getByTestId('refund-form-date').fill('2026-03-09');
        await page.getByTestId('refund-form-submit').click();
        // payment 1 (2026-01-20) gives all its 50.00, then payment 3 (2026-02-05) 20.00 of its 30.00
        await expect.poll(() => auditLines().filter((l) => l.startsWith('CREDIT_REFUNDED'))).toEqual([
          'CREDIT_REFUNDED payment=1 amount=50.00',
          'CREDIT_REFUNDED payment=3 amount=20.00',
        ]);
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{r:client1.credit}'); // 100.00 - 70.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{r:client1.balance}');

        // what is left: payment 3's last 10.00, then payment 2's 20.00
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=3 invoice=2 amount=10.00',
          'PAYMENT_RECORDED id=2 invoice=2 amount=15.00',
        ]);
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{sent:client1.credit}'); // 30.00 - 25.00
    """, r=r, sent=sent)
    fx2 = dict(asOf=SA, clients=[A], invoices=[I(3, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 50)])],
               payments=[P(5, 1, 60, '2026-02-10', [(3, 50)], refunded=5), P(6, 1, 20, '2026-02-20', [])])
    t2 = T('refuses a refund that breaks a rule, and reversing a refunded payment', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        const bad = [
          ['0', '2026-03-09'],       // not more than zero
          ['10.005', '2026-03-09'],  // three decimals
          ['10', '2026-03-11'],      // after today (2026-03-10)
          ['10', '2026-02-15'],      // the last 5.00 would come from payment 6, made on 2026-02-20
          ['25.01', '2026-03-09'],   // credit is 5.00 + 20.00 = 25.00
        ];
        for (const [amount, date] of bad) {
          await page.getByTestId('refund-form-amount').fill(amount);
          await page.getByTestId('refund-form-date').fill(date);
          await page.getByTestId('refund-form-submit').click();
          await expect(page.getByTestId('refund-form-error')).toBeVisible();
        }
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}');
        expect(auditLines().filter((l) => l.startsWith('CREDIT_REFUNDED'))).toEqual([]);

        // payment 5 has had a refund, so it can no longer be reversed
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('payment-row-5').getByTestId('payment-reverse').click();
        await expect(page.getByTestId('payment-reverse-error')).toBeVisible();
        await expect(page.getByTestId('invoice-paid')).toHaveText('{s:inv3.paid}');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_REVERSED'))).toEqual([]);
    """)
    return Spec('cp53_refunds', 'refund unused credit', """
        A client's unused credit can be refunded from the refund form (amount and date, client level).
        The refund comes out of the oldest payment's unused credit first (lower id on the same date),
        then the next, recorded on each payment as refunded (payments[].refunded), writing
        CREDIT_REFUNDED payment=<payment id> amount=<amount taken from it> for each. A refund of zero or
        less, with more than two decimals, after today, before a payment it would come from, or bigger
        than the client's credit is refused. Refunded credit is never used on an invoice, and a payment
        that has had a refund can no longer be reversed.""", [t1, t2], n)


cp(53, 'refunds', """
    Let me refund unused credit to the selected client: a refund form with an amount and a date. The
    refund comes out of the oldest payment's unused credit first (lower id on the same date), then the
    next, and writes CREDIT_REFUNDED payment=<payment id> amount=<amount taken from it> for each
    payment it comes from. Refuse a refund of zero or less, with more than two decimals, dated after
    today or before a payment it would come from, or bigger than the client's unused credit.
    Refunded credit can't be used on an invoice any more, and the client's credit and balance change
    straight away. A payment that has had a refund can't be reversed any more: refuse it with a
    message.
""", s53)

# =============================================================================== cp54 credit notes


def s54(n):
    T10 = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=T10, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Extras', 1, 20)]),
        I(9, 1, 'SENT', '2026-03-01', '2026-04-30',
          [L(2, 'Design', 2, 45), L(3, 'Hosting', 1, 20, taxExempt=True)])],
        payments=[P(1, 1, 30, '2026-03-05', [(9, 30)])])
    d1 = plus(fx1, invoices=[I(10, 1, 'DRAFT', SA, '2026-04-30', [L(4, 'Design', 1, 45)], creditOf=9)])
    cn = plus(d1, inv=[(10, dict(status='SENT'))])
    t1 = T('issues a credit note against a part-paid invoice', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-9').click();
        await page.getByTestId('invoice-credit').click();
        // a new draft credit note, the next invoice id (10), numbered CN- with its Luhn digit
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{d1:inv10.number}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('45');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{d1:inv10.subtotal}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{d1:inv10.tax}'); // 10% of 45.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{d1:inv10.grand}');
        await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-total')).toHaveText('{d1:inv10.listTotal}');

        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{cn:inv10.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=10 number={cn:inv10.number} invoice=9 total=49.50');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);

        // invoice 9: 90.00 + 20.00 exempt + 9.00 tax = 119.00, less 30.00 paid and 49.50 credited
        await page.getByTestId('invoice-row-9').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{cn:inv9.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{cn:inv9.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{cn:inv9.status}');
        // 22.00 (invoice 3) + 39.50; the credit note itself does not count
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{cn:client1.balance}');
    """, d1=d1, cn=cn)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 60)]),
        I(11, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Design', 1, 45)], creditOf=4)],
        payments=[P(2, 1, 20, '2026-03-05', [(4, 20)])])
    over = plus(fx2, inv=[(11, dict(status='SENT', issueDate=SA))])
    over = plus(over, payments=[P(3, 1, 5, SA, [], creditNote=11)])
    t2 = T('refuses a credit note for more than the invoice still owes', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-11').click();
        // 45.00 against the 40.00 invoice 4 still owes (60.00 - 20.00)
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{s:inv4.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv4.due}');
        expect(auditLines().filter((l) => l.startsWith('CREDIT_NOTE_ISSUED'))).toEqual([]);
    """)
    t2b = T('a credit note for more than is owed leaves the rest as credit', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-11').click();
        // 45.00 against the 40.00 invoice 4 still owes (60.00 - 20.00)
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{over:inv11.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=11 number={over:inv11.number} invoice=4 total=45.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=3 amount=5.00'); // 45.00 - 40.00
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{over:inv4.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{over:inv4.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{over:inv4.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{over:client1.credit}');
    """, over=over)
    fx3 = dict(asOf=SA, clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 60)]),
        I(12, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Design', 1, 60)], creditOf=5)])
    full = plus(fx3, inv=[(12, dict(status='SENT', issueDate=SA))])
    t3 = T('a fully credited invoice is Credited and can no longer change', '@core', fx3, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-12').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{full:inv5.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{full:client1.balance}');
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{full:inv5.due}'); // 60.00 - 60.00 credited
        // no payments, but the issued credit note keeps it from being reopened or voided
        await page.getByTestId('invoice-void').click();
        await expect(page.getByTestId('invoice-void-error')).toBeVisible();
        await page.getByTestId('line-form-description').fill('Extra');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('10');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{full:inv5.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED') || l.startsWith('INVOICE_VOIDED'))).toEqual([]);
    """, full=full)
    tests = [t1, t2b if n >= 56 else t2, t3]
    note = None
    if n >= 56:
        note = ("UPDATED for cp56 (mutates: [54]): a credit note may now be for more than the original still "
                "owes; the rest is held as client credit (a credit payment, CREDIT_HELD), so the 45.00 credit "
                "note against 40.00 owed is issued, leaving invoice 4 Paid and 5.00 of credit. Carries the other "
                "two tests.")
    hdr = """
        A sent invoice can be credited: the Credit note button creates a draft credit note for it (an
        invoice with invoices[].creditOf naming the original), the next invoice id, numbered CN- with
        the six-digit id and its Luhn digit, and opens it. Its lines are added like any draft; it has no
        discount and is taxed like the original. Its total is negative in the invoice list. Sending it
        issues it: status Credit note, CREDIT_NOTE_ISSUED id=<id> number=<CN number> invoice=<original
        id> total=<grand total> (no INVOICE_SENT), and its total comes off the original's amount due,
        shown on the original as Credited. """ + (
        "A credit note for more than the original still owes is issued too: the original takes what it "
        "owes and the rest is held on the client's account as a credit payment "
        "(payments[].creditNote), writing CREDIT_HELD payment=<payment id> amount=<amount>." if n >= 56 else
        "A credit note for more than the original still owes is refused.") + """ An original cleared by
        credit notes with nothing paid is Credited. An invoice with an issued credit note can no longer be
        changed, reopened or voided."""
    return Spec('cp54_credit_notes', 'credit notes', hdr, tests, n, copy_note=note)


cp(54, 'credit_notes', """
    Let me credit a sent invoice. A Credit note button on a sent invoice creates a draft credit note
    for it: a separate entry in the client's invoice list with the next invoice id, numbered CN- then
    the six-digit id and its Luhn check digit (the same rule as invoice numbers), and opens it. I add
    lines to it like any draft; it has no discount, and its tax works like the original's (line rates,
    exempt lines, tax-exempt clients). Its total shows as a negative amount in the invoice list.
    Sending it issues it: its status becomes Credit note, it writes CREDIT_NOTE_ISSUED id=<id>
    number=<CN number> invoice=<original id> total=<grand total> instead of INVOICE_SENT, and its
    grand total comes off the original invoice's amount due, shown on the original as Credited ($0.00
    when nothing has been). Refuse to issue a credit note for more than the original still owes. A
    credit note takes no payments and doesn't count in the client's balance itself. An original that
    credit notes clear with nothing paid is Credited; with payments it is Paid as usual. Once an
    invoice has an issued credit note, it can't be changed, reopened or voided.
""", s54)

# =============================================================================== cp55 retention


def s55(n):
    T10 = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=T10, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 333.33)])])
    r = plus(fx1, inv=[(1, dict(retentionPct=2.5))])
    sent = plus(r, inv=[(1, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    due = V(sent, n)['inv1.due']
    paid = plus(sent, payments=[P(1, 1, num(due), SA, [(1, num(due))])])
    rel = plus(paid, inv=[(1, dict(retentionReleasedOn=SA))])
    pre = n >= 60
    t1 = T('holds retention back until it is released', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('retention-form-pct').fill('2.5');
        await page.getByTestId('retention-form-submit').click();
        // {'2.5% of the 333.33 before tax = 8.33325' if pre else '333.33 + 33.33 tax = 366.66; 2.5% = 9.1665'}, rounded down
        await expect(page.getByTestId('invoice-retention')).toHaveText('{{r:inv1.retention}}');
        await page.getByTestId('invoice-send').click();
        // 366.66 less the {{sent:inv1.retention}} held back
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{sent:inv1.due}}');
        await page.getByTestId('payment-form-amount').fill('{{sent:inv1.due|plain}}');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{paid:inv1.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{paid:inv1.status}}');
        // the balance still includes the retention; none of it is overdue
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{{paid:client1.balance}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{paid:client1.overdue}}');

        await page.getByTestId('invoice-release-retention').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{rel:inv1.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{rel:inv1.status}}');
        await expect.poll(() => auditLines()).toContain('RETENTION_RELEASED id=1 amount={{rel:inv1.retention|plain}}');
    """, r=r, sent=sent, paid=paid, rel=rel)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-04-30', [L(1, 'Design', 1, 200)], retentionPct=10),
        I(3, 1, 'SENT', '2025-12-01', '2025-12-31', [L(2, 'Build', 1, 100)], retentionPct=10,
          retentionReleasedOn='2026-01-15'),
        I(4, 1, 'SENT', '2025-12-01', '2025-12-31', [L(3, 'Build', 1, 100)], retentionPct=10)],
        payments=[P(1, 1, 100, '2026-02-10', [(2, 100)]), P(2, 1, 90, '2025-12-20', [(3, 90)]),
                  P(3, 1, 90, '2025-12-20', [(4, 90)])])
    t2 = T('releases only once the rest is paid, and released retention can fall overdue', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // invoice 2 still owes 80.00 besides its 20.00 retention
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        await page.getByTestId('invoice-release-retention').click();
        await expect(page.getByTestId('invoice-release-error')).toBeVisible();
        expect(auditLines().filter((l) => l.startsWith('RETENTION_RELEASED'))).toEqual([]);
        // invoice 3's 10.00 was released on 2026-01-15, due 30 days later: more than 7 days ago
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{s:inv3.status}');
        // invoice 4 is long past its due date, but only its held retention is left
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{s:inv4.status}');
        // 80.00 + 20.00 held + 10.00 + 10.00 held; only invoice 3's released 10.00 is overdue
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
    """)
    fx3 = dict(asOf=SA, clients=[A], invoices=[I(5, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 100)])])
    t3 = T('refuses a retention outside 0 to 20', '@error', fx3, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
        for (const pct of ['20.01', '-1', '2.555']) {
          await page.getByTestId('retention-form-pct').fill(pct);
          await page.getByTestId('retention-form-submit').click();
          await expect(page.getByTestId('retention-form-error')).toBeVisible();
        }
        await expect(page.getByTestId('invoice-retention')).toHaveText('{s:inv5.retention}');
    """)
    note = None
    if n >= 60:
        note = ("UPDATED for cp60 (mutates: [55]): retention is now worked out on the amount before tax "
                "(subtotal minus discount), so 2.5% of 333.33 holds back $8.33 instead of $9.16 of the "
                "366.66 grand total, and the amounts due change with it. Carries all three tests.")
    hdr = f"""
        A draft can hold back retention (invoices[].retentionPct, 0 to 20 with up to two decimals, from the
        retention form): that percentage of the {'amount before tax (subtotal minus discount)' if pre else 'grand total'},
        rounded down to the cent, shown on the invoice. While held it is not part of the amount due, takes
        no payments or credit, and never makes the invoice Overdue; once everything else is paid the status
        is Retention held. The Release retention button on a sent invoice with nothing else due releases
        it (invoices[].retentionReleasedOn): it is added to the amount due, falls due 30 days later, and
        RETENTION_RELEASED id=<id> amount=<retention> is written; it is refused while anything else is due
        or there is nothing to release. The client's balance includes retention, held or released; the
        overdue amount includes released retention once it is overdue."""
    return Spec('cp55_retention', 'retention', hdr, [t1, t2, t3], n, copy_note=note)


cp(55, 'retention', """
    Some clients hold back retention until a job is signed off. Let me set a retention percentage on a
    draft (0 to 20, up to two decimals). The retention is that percentage of the grand total, rounded
    down to the cent; show it on the invoice. It is held back: the amount due is the grand total minus
    credit notes, payments and the retention still held, so payments and credit can't go towards it
    while it's held, and it never makes the invoice Overdue. Once everything else is paid the invoice
    shows Retention held instead of Paid. Let me release the retention on a sent invoice once nothing
    else is due (refuse it otherwise, or when there's nothing to release): it is added to the amount
    due, falls due 30 days after the day it was released, and writes RETENTION_RELEASED id=<id>
    amount=<retention>. The client's balance includes retention, held or released; their overdue
    amount includes released retention once it is overdue (the usual week's grace applies).
""", s55)

# =============================================================================== cp56 credit note excess


def s56(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(7, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(8, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Design', 1, 50)], creditOf=7),
        I(9, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Hosting', 1, 15)])],
        payments=[P(1, 1, 70, '2026-03-02', [(7, 70)])])
    a = plus(fx1, inv=[(8, dict(status='SENT', issueDate=SA))], payments=[P(2, 1, 20, SA, [], creditNote=8)])
    b = plus(a, inv=[(9, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))], alloc=[(2, 9, 15, SA)])
    t1 = T('a credit note for more than is owed leaves the rest as credit', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-8').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv8.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=8 number={a:inv8.number} invoice=7 total=50.00');
        // invoice 7 owed 30.00 (100.00 - 70.00): the other 20.00 becomes credit payment 2
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00');
        await page.getByTestId('invoice-row-7').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{a:inv7.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv7.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv7.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}');

        // the credit pays the next invoice sent, but can't be reversed like a payment
        await page.getByTestId('invoice-row-9').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv9.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=9 amount=15.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{b:client1.credit}'); // 20.00 - 15.00
        await page.getByTestId('payment-row-2').getByTestId('payment-reverse').click();
        await expect(page.getByTestId('payment-reverse-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv9.status}');
    """, a=a, b=b)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(10, 1, 'SENT', '2026-02-01', '2026-04-30', [L(1, 'Build', 1, 100)], retentionPct=10),
        I(11, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Build', 1, 30)], creditOf=10)],
        payments=[P(1, 1, 90, '2026-02-20', [(10, 90)])])
    c = plus(fx2, inv=[(11, dict(status='SENT', issueDate=SA))], payments=[P(2, 1, 20, SA, [], creditNote=11)])
    t2 = T('a credit note takes held retention before it leaves credit', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // 90.00 paid; only the 10.00 retention is left, held
        await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-status')).toHaveText('{s:inv10.status}');
        await page.getByTestId('invoice-row-11').click();
        await page.getByTestId('invoice-send').click();
        // the 30.00 credit note clears the 10.00 retention; 20.00 is held as credit
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=20.00');
        await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-status')).toHaveText('{c:inv10.status}');
        await page.getByTestId('invoice-row-10').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{c:inv10.credited}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{c:client1.balance}'); // 20.00 credit
    """, c=c)
    fx3 = dict(asOf=SA, clients=[A], invoices=[
        I(20, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 50)]),
        I(21, 1, 'SENT', '2026-03-01', '2026-03-31', [L(2, 'Design', 1, 80)], creditOf=20),
        I(22, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Hosting', 1, 20)])],
        payments=[P(1, 1, 30, '2026-03-01', [], creditNote=21)])
    d = plus(fx3, inv=[(22, dict(status='SENT', issueDate=SA))], alloc=[(1, 22, 20, SA)])
    t3 = T('credit from an earlier credit note is used like any credit', '@core', fx3, """
        // credit note 21 (80.00) cleared invoice 20's 50.00 and left 30.00 as credit payment 1
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}');
        await page.getByTestId('client-row-1').click();
        await expect(page.getByTestId('invoice-row-20').getByTestId('invoice-status')).toHaveText('{s:inv20.status}');
        await page.getByTestId('invoice-row-22').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=22 amount=20.00');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{d:inv22.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{d:client1.credit}'); // 30.00 - 20.00
    """, d=d)
    return Spec('cp56_credit_note_excess', 'credit notes beyond what is owed', """
        A credit note may be for more than its original still owes. Issuing it takes off what the original
        owes, then its held retention, and the rest is held on the client's account as a credit payment
        dated the day it is issued (payments[].creditNote names the credit note), writing CREDIT_HELD
        payment=<payment id> amount=<amount>. The original shows only what it took as Credited. Credit from
        a credit note is used and refunded like any other credit, but cannot be reversed.""", [t1, t2, t3], n)


cp(56, 'credit_note_excess', """
    A credit note can now be for more than the original still owes. When it's issued, it takes off
    what the original still owes, then any retention it is holding back, and anything left over goes
    onto the client's account as credit: record it as a credit payment dated the day the credit note
    is issued, write CREDIT_HELD payment=<payment id> amount=<amount>, and show on the original only
    what it took as Credited. That credit is used and refunded like any other credit, but it can't be
    reversed.
""", s56, type_='mutative', mutates=[54], copies=['cp54_credit_notes'],
   retires=['cp54_credit_notes.spec.ts::refuses a credit note for more than the invoice still owes'])

# =============================================================================== cp57 instalment plan
REV84 = 84   # annuity-instalments-revised


def inst_rows(state, inv, ks, label):
    out = []
    for k in ks:
        out.append(f"        await expect(page.getByTestId('instalment-row-{k}').getByTestId('instalment-due')).toHaveText('{{{label}:inv{inv}.inst{k}.due}}');")
        for f, key in (('payment', 'payment'), ('interest', 'interest'), ('principal', 'principal'), ('balance', 'balance')):
            out.append(f"        await expect(page.getByTestId('instalment-row-{k}').getByTestId('instalment-{f}')).toHaveText('{{{label}:inv{inv}.inst{k}.{key}}}');")
    return '\n'.join(out)


def s57(n):
    fx1 = dict(asOf='2026-01-31', clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)])])
    pl = plus(fx1, inv=[(1, dict(instalments=3, instalmentRate=12))])
    sent = plus(pl, inv=[(1, dict(status='SENT'))])
    rev = n >= REV84
    if rev:
        arith = """// i = 12 / 12 / 100 = 0.01; 1000 x 0.01 / (1 - 1.01^-3) = 340.0221, rounded up to 341.00
        // month 1: 1000.00 x 0.01 = 10.00 interest, 331.00 principal, 669.00 left; month 2: 6.69,
        // 334.31, 334.69 left; the last pays the 334.69 left plus 3.3469 -> 3.35 = 338.04"""
    else:
        arith = """// i = 12 / 12 / 100 = 0.01; 1000 x 0.01 / (1 - 1.01^-3) = 340.0221 -> 340.02
        // month 1: 1000.00 x 0.01 = 10.00 interest, 330.02 principal, 669.98 left; month 2: 6.6998 ->
        // 6.70, 333.32, 336.66 left; the last pays the 336.66 left plus 3.3666 -> 3.37 = 340.03"""
    t1 = T('spreads a draft over monthly instalments', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('3');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-submit').click();
        {arith}
        // due on the 31st of each month, or the month's last day: 02-28, 03-31, 04-30
""" + inst_rows(pl, 1, (1, 2, 3), 'pl') + """
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{pl:inv1.planTotal}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{pl:inv1.due}');

        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=1000.00');
""", pl=pl, sent=sent)
    fx2 = dict(asOf='2026-03-31', clients=[A], invoices=[
        I(2, 1, 'DRAFT', '2026-02-15', '2026-03-31', [L(1, 'Licence', 1, 100)], instalments=3, instalmentRate=0)],
        payments=[P(1, 1, 50, '2026-03-01', [])])
    sent2 = plus(fx2, inv=[(2, dict(status='SENT', issueDate='2026-03-31', dueDate='2026-04-30'))])
    t2 = T('sending dates the instalments from the day it is sent', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // at 0% each instalment is 100.00 / 3 = 33.33{', rounded up to 34.00,' if rev else ''} and the last pays the rest
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('{{s:inv2.inst1.due}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('{{s:inv2.inst3.payment}}');
        await page.getByTestId('invoice-send').click();
        // issued 2026-03-31: due 04-30, 05-31, 06-30
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('{{sent:inv2.inst1.due}}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('{{sent:inv2.inst2.due}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('{{sent:inv2.inst3.due}}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{{sent:inv2.inst1.payment}}');
        // the client's 50.00 credit is not used on a planned invoice
        await expect(page.getByTestId('invoice-paid')).toHaveText('{{sent:inv2.paid}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{sent:inv2.due}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{{sent:client1.credit}}');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
""", sent=sent2)
    fx3 = dict(asOf=SA, clients=[A], invoices=[
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Licence', 1, 100)]),
        I(4, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 100)], retentionPct=5)])
    t3 = T('refuses a plan that breaks a rule', '@error', fx3, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        const bad = [
          ['1', '12'],       // at least 2 instalments
          ['25', '12'],      // at most 24
          ['2.5', '12'],     // a whole number
          ['3', '30.01'],    // a rate from 0 to 30
          ['3', '-1'],
          ['3', '12.345'],   // at most two decimals
        ];
        for (const [count, rate] of bad) {
          await page.getByTestId('plan-form-count').fill(count);
          await page.getByTestId('plan-form-rate').fill(rate);
          await page.getByTestId('plan-form-submit').click();
          await expect(page.getByTestId('plan-form-error')).toBeVisible();
        }
        await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);
        // invoice 4 holds back retention, so it can't also have a plan
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('plan-form-count').fill('3');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('plan-form-error')).toBeVisible();
        await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);
""")
    note = None
    if rev:
        note = ("UPDATED for cp84 (mutates: [57, 58, 71, 73]): the equal instalment is now rounded up to the "
                "next whole dollar and the last instalment pays what is left, so the 1,000.00 plan is 341.00, "
                "341.00 and 338.04 instead of 340.02, 340.02 and 340.03. Carries all three tests.")
    hdr = f"""
        A draft can be spread over monthly instalments (invoices[].instalments, 2 to 24, and
        invoices[].instalmentRate, an annual rate from 0 to 30 with up to two decimals, from the plan
        form). The schedule is an ordinary loan of the grand total: monthly rate i = annual rate / 12 /
        100; the instalment is P x i / (1 - (1 + i)^-n), {'rounded up to the next whole dollar' if rev else 'rounded half up to the cent'} (P / n at 0%);
        each month's interest is the balance still owed x i, rounded half up to the cent, its principal
        the instalment minus the interest, and the last instalment pays off the whole remaining balance
        plus its interest so the schedule ends at exactly zero. Instalment k is due k months after the
        issue date on the same day (the month's last day when shorter). Each instalment row shows its due
        date, payment, interest, principal and remaining balance; the plan total is the sum of the
        instalments and the amount due is the plan total minus what is paid. Sending dates the schedule
        from the new issue date. An invoice with retention can't have a plan, and credit is not used on
        a planned invoice."""
    return Spec('cp57_instalment_plan', 'instalment plans', hdr, [t1, t2, t3], n, copy_note=note)


cp(57, 'instalment_plan', """
    Let me spread a draft invoice over monthly instalments: a number of instalments (2 to 24) and an
    annual interest rate (0 to 30, up to two decimals). Work the schedule out from the grand total as
    an ordinary loan: the monthly rate i is the annual rate / 12 / 100, and the instalment is P x i /
    (1 - (1 + i)^-n), rounded half up to the cent (P / n, rounded half up, at 0%). For each
    instalment, the interest is the balance still owed x i, rounded half up to the cent; the principal
    is the instalment minus the interest; the new balance is the balance minus the principal. The last
    instalment instead pays off the whole remaining balance plus its interest, so the schedule always
    ends at exactly zero. Instalment k is due k months after the issue date on the same day of the
    month (the month's last day when it is shorter). Show each instalment with its due date, payment,
    interest, principal and remaining balance, and the plan total (the sum of the instalments). The
    amount due on a planned invoice is the plan total minus what has been paid. Sending keeps the plan
    and dates it from the new issue date. An invoice can't have both retention and a plan, and the
    client's credit is not used automatically on a planned invoice.
""", s57, algorithm='annuity-instalments')

# =============================================================================== cp58 instalment payments


def s58(n):
    fx1 = dict(asOf='2026-04-10', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = V(plus(fx1), n)['inv1.inst1.payment']
    fx1['payments'] = [P(1, 1, num(first), '2026-02-27', [(1, num(first))])]
    v = V(fx1, n)
    second = num(v['inv1.inst2.payment'])
    p2 = plus(fx1, payments=[P(2, 1, 400, '2026-04-10', [(1, 400)])])
    t1 = T('pays instalments in order and goes overdue by instalment', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        // instalment 1 was paid; instalment 2 was due 2026-03-31, more than 7 days ago
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{{s:inv1.status}}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{{s:inv1.nextDue}}');
        // only the unpaid overdue instalment is overdue; the balance is the plan total less what is paid
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{{s:client1.balance}}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('{{s:inv1.inst1.status}}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{{s:inv1.inst2.status}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('{{s:inv1.inst3.status}}');

        // less than the {{s:inv1.inst2.payment}} still unpaid on instalment 2
        await page.getByTestId('payment-form-amount').fill('200');
        await page.getByTestId('payment-form-date').fill('2026-04-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await page.getByTestId('payment-form-amount').fill('400');
        await page.getByTestId('payment-form-submit').click();
        // instalment 2 takes {{s:inv1.inst2.payment}}, instalment 3 the rest of the 400.00
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{{p2:inv1.inst2.status}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-paid')).toHaveText('{{p2:inv1.inst3.paid}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('{{p2:inv1.inst3.status}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{p2:inv1.status}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{p2:inv1.due}}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('{{p2:inv1.nextDue}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{p2:client1.overdue}}');
""", p2=p2)
    fx2 = dict(asOf='2026-04-10', clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-03-01', '2026-03-31', [L(1, 'Licence', 1, 90)], instalments=3, instalmentRate=0)],
        payments=[P(3, 1, 28, '2026-03-20', [(2, 28)])])
    q = plus(fx2, payments=[P(4, 1, 2, '2026-04-10', [(2, 2)])])
    t2 = T('a payment must cover the earliest unpaid instalment, not a tenth of the total', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // 30.00 a month: instalment 1 (due 2026-04-01) has 2.00 left and is overdue
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('{s:inv2.inst1.status}');
        // 2.00 is under 10% of the 90.00 total but covers what instalment 1 still needs
        await page.getByTestId('payment-form-amount').fill('2');
        await page.getByTestId('payment-form-date').fill('2026-04-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('{q:inv2.inst1.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{q:inv2.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{q:inv2.due}'); // 90.00 - 30.00
        // 1.00 is short of the 30.00 instalment 2 needs, and settles nothing
        await page.getByTestId('payment-form-amount').fill('1');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-paid')).toHaveText('{q:inv2.paid}');
""", q=q)
    note = None
    if n >= REV84:
        note = ("UPDATED for cp84 (mutates: [57, 58, 71, 73]): instalments are now rounded up to the next "
                "whole dollar, so the 1,000.00 plan's instalments are 341.00, 341.00 and 338.04 and the figures "
                "after each payment change with them. Carries both tests.")
    return Spec('cp58_instalment_payments', 'paying instalments', """
        Payments on a planned invoice pay its instalments in order, each paid off before the next. Each
        instalment row shows what has been paid on it and its status: Paid, Part paid, Overdue (more than
        7 days past its due date and not paid off) or Due. A planned invoice is Overdue when any
        instalment is, instead of by its own due date; the client's overdue amount counts only what is
        unpaid on overdue instalments; and the invoice list shows the next unpaid instalment's due date.
        A payment on a planned invoice must be at least what is still unpaid on the earliest unpaid
        instalment unless it settles the plan; the 10% minimum does not apply to it.""", [t1, t2], n, copy_note=note)


cp(58, 'instalment_payments', """
    Payments on a planned invoice pay its instalments in order: each instalment is paid off before the
    next one. Show what has been paid on each instalment and its status: Paid, Part paid, Overdue
    (more than 7 days past its due date and not paid off) or Due. A planned invoice is Overdue when
    any of its instalments is Overdue, instead of going by the invoice's own due date, and the
    client's overdue amount counts only what is unpaid on overdue instalments. In the invoice list, a
    planned invoice's due date is its next unpaid instalment's due date. A payment on a planned invoice
    must be at least what is still unpaid on its earliest unpaid instalment, unless it settles the
    whole plan; the 10% minimum part payment doesn't apply to planned invoices.
""", s58)

# =============================================================================== cp59 client currency
RATES = {'EUR': 1.1, 'GBP': 1.25, 'JPY': 0.0066, 'CHF': 1.13}
KK = {'id': 3, 'name': 'Kaisha KK', 'email': 'ap@kaisha.example', 'currency': 'JPY'}


def s59(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10, 'usdPer': RATES}, clients=[KK], invoices=[
        I(4, 3, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Consulting', 3, 1234), L(2, 'Support', 1.5, 999)],
          discountPct=12.5),
        I(5, 3, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Licence', 1, 10000)])])
    v = V(fx1, n)
    g4 = num(v['inv4.grand'])
    g5 = num(v['inv5.grand'])
    a = plus(fx1, payments=[P(1, 3, g4 - 140, '2026-03-09', [(4, g4 - 140)])])
    b = plus(a, payments=[P(2, 3, g5 - 160, '2026-03-09', [(5, g5 - 160)])])
    t1 = T('bills a yen client in whole yen', '@core', fx1, f"""
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-4').click();
        // 3 x 1,234 = 3,702; 1.5 x 999 = 1,498.5 -> 1,499 (whole yen, half up)
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{{s:inv4.line2.amount}}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{{s:inv4.subtotal}}');
        // 12.5% of 5,201 = 650.125 -> 650, split 3,702 : 1,499 by largest remainder
        await expect(page.getByTestId('invoice-discount')).toHaveText('{{s:inv4.discount}}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('{{s:inv4.line1.share}}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{{s:inv4.line1.tax}}'); // 10% of (3,702 - 463) = 323.9
        await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('{{s:inv4.line2.tax}}'); // 10% of (1,499 - 187) = 131.2
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv4.grand}}');
        // amounts I enter for a yen client are whole yen
        await page.getByTestId('payment-form-amount').fill('100.5');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        // leaves 140 yen, worth 140 x 0.0066 = $0.92: {'but that is more than 1% of 5,006, so it stays due' if n >= 92 else 'written off'}
        await page.getByTestId('payment-form-amount').fill('{g4 - 140}');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{{a:inv4.writtenOff}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv4.status}}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=4 amount={g4 - 140}');
        {"expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);" if n >= 92 else "await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=4 amount=140');"}
        // 10,000 + 1,000 tax; leaving 160 yen, worth 160 x 0.0066 = $1.06: it stays due
        await page.getByTestId('invoice-row-5').click();
        await page.getByTestId('payment-form-amount').fill('{g5 - 160}');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{b:inv5.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{b:inv5.status}}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-balance')).toHaveText('{{b:client3.balance}}');
""", a=a, b=b)
    fx2 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[
        A, C(G, currency='EUR'), {'id': 5, 'name': 'Helvetia AG', 'email': 'ap@helvetia.example', 'currency': 'CHF'},
        {'id': 6, 'name': 'Britco Ltd', 'email': 'ap@britco.example', 'currency': 'GBP'}], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(2, 2, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 2, 617.25)]),
        I(3, 5, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 99.95)]),
        I(4, 6, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Design', 3, 4.1)])])
    added = plus(fx2, clients=[{'id': 7, 'name': 'Initech', 'email': 'ap@initech.example', 'currency': 'EUR'}],
                 invoices=[I(5, 7, 'DRAFT', SA, '2026-04-30', [L(5, 'Hosting', 2, 12.25)])])
    t2 = T("shows each client's money in their currency", '@core', fx2, """
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{s:client1.balance}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('{s:client2.balance}'); // 2 x 617.25
        await expect(page.getByTestId('client-row-5').getByTestId('client-balance')).toHaveText('{s:client5.balance}');
        await expect(page.getByTestId('client-row-6').getByTestId('client-balance')).toHaveText('{s:client6.balance}'); // 3 x 4.10
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-currency').selectOption('EUR');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-7').getByTestId('client-balance')).toHaveText('{added:client7.credit}');
        await page.getByTestId('client-row-7').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Hosting');
        await page.getByTestId('line-form-qty').fill('2');
        await page.getByTestId('line-form-unit-price').fill('12.25');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{added:inv5.grand}'); // 2 x 12.25
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-total')).toHaveText('{added:inv5.grand}');
""", added=added)
    return Spec('cp59_client_currency', 'clients billed in their own currency', f"""
        A client can be billed in their own currency (clients[].currency, chosen when adding the client:
        USD by default, EUR, GBP, JPY or CHF). Everything on their invoices, payments, credit and balance
        is in that currency with its symbol: $1,234.50, €1,234.50, £1,234.50, ¥1,235, CHF 1,234.50. Yen
        have no decimals: every amount for a yen client is rounded to the whole yen wherever it would be
        rounded to the cent, amounts entered for them must be whole yen, and audit lines show whole yen.
        A small balance is written off when it is worth less than {'$2.00 at the workspace rates and is no more than 1% of the grand total' if n >= 92 else '$1.00 at the workspace rates'}
        (settings.usdPer: the US dollars one unit of each currency is worth).""", [t1, t2], n, copy_note=(
        "UPDATED for cp92 (mutates: [15, 40, 59]): a small balance is now written off only when it is under "
        "$2.00 and no more than 1% of the grand total, so the 140 yen left of 5,006 stays due. Carries both "
        "tests.") if n >= 92 else None)


cp(59, 'client_currency', """
    Some clients are billed in their own currency. Let me pick one when I add a client: USD (the
    default), EUR, GBP, JPY or CHF. Everything on that client's invoices, payments, credit and balance
    is in their currency and shown with its symbol: €1,234.50, £1,234.50, ¥1,235 (yen have no
    decimals), CHF 1,234.50. For a yen client every amount is in whole yen: wherever I'd round to the
    cent, round half up to the whole yen instead (or down, where the rule rounds down), amounts I
    enter for them must be whole yen, and audit lines show whole yen. The workspace has exchange rates
    (the US dollars one unit of each currency is worth). A small balance is written off when it is
    worth less than $1.00 at those rates, rather than when it is less than 1.00 of the client's
    currency.
""", s59)

# =============================================================================== cp60 retention before tax


def s60(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)], discountPct=10)])
    r = plus(fx1, inv=[(1, dict(retentionPct=5))])
    sent = plus(r, inv=[(1, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    due = num(V(sent, n)['inv1.due'])
    paid = plus(sent, payments=[P(1, 1, due, SA, [(1, due)])])
    t1 = T('works retention out before tax', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('retention-form-pct').fill('5');
        await page.getByTestId('retention-form-submit').click();
        // 1,000.00 - 100.00 discount = 900.00 before tax (990.00 with tax): 5% of 900.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{r:inv1.grand}');
        await expect(page.getByTestId('invoice-retention')).toHaveText('{r:inv1.retention}');
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}'); // 990.00 - 45.00
        await page.getByTestId('payment-form-amount').fill('{sent:inv1.due|plain}');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{paid:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{paid:client1.balance}');
""", r=r, sent=sent, paid=paid)
    return Spec('cp60_retention_before_tax', 'retention before tax', """
        Retention is worked out on the invoice's amount before tax (the subtotal minus the discount),
        still rounded down to the cent, instead of on the grand total. Everything that follows from it
        (the amount due, Retention held, the client's balance) uses that amount.""", [t1], n)


cp(60, 'retention_before_tax', """
    I'm holding back retention on tax my clients pay over anyway. Work the retention out on the
    invoice's amount before tax (the subtotal minus the discount), still rounded down to the cent,
    instead of on the grand total.
""", s60, type_='mutative', mutates=[55], copies=['cp55_retention'])

# =============================================================================== cp61 FX payments
HV = {'id': 5, 'name': 'Helvetia AG', 'email': 'ap@helvetia.example', 'currency': 'CHF'}


def s61(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[HV, KK], invoices=[
        I(1, 5, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 48.70)]),
        I(2, 3, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Consulting', 1, 20000)])])
    rev = n >= 88
    chf = V(plus(fx1, payments=[P(1, 5, 50, '2026-03-09', [], currency='EUR')]), n)['client5.credit']
    a = plus(fx1, payments=[P(1, 5, 50, '2026-03-09', [(1, num(chf))], currency='EUR')])
    jpy = V(plus(fx1, payments=[P(2, 3, 100, '2026-03-09', [], currency='EUR')]), n)['client3.credit']
    b = plus(a, payments=[P(2, 3, 100, '2026-03-09', [(2, num(jpy))], currency='EUR')])
    t1 = T('converts a payment in another currency through dollars', '@core', fx1, f"""
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('50');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 50 x 1.10 / 1.13 = 48.6725... {'rounded down' if rev else 'rounded half up'} to CHF 0.05
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('€50.00');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{{a:inv1.paid}}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount={{a:inv1.paid|plain}}');
        // CHF 0.05 left, worth about $0.06: written off
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{{a:inv1.writtenOff}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');

        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 100 x 1.10 / 0.0066 = 16,666.67 -> whole yen
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('{{b:inv2.paid}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{b:inv2.due}}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-balance')).toHaveText('{{b:client3.balance}}');
""", a=a, b=b)
    fx2 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[A, C(G, currency='EUR')], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 150)]),
        I(4, 2, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 50)])])
    c = plus(fx2, payments=[P(1, 1, 80, '2026-03-09', [(3, 100)], currency='GBP')])
    eur = V(plus(c, payments=[P(2, 2, 10000, '2026-03-09', [], currency='JPY')]), n)['client2.credit']
    dd = plus(c, payments=[P(2, 2, 10000, '2026-03-09', [(4, 50)], currency='JPY')])
    t2 = T('checks and holds credit on the converted amount', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('payment-form-currency').selectOption('GBP');
        await page.getByTestId('payment-form-amount').fill('80');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 80 x 1.25 = 100.00, of the 150.00 due
        await expect(page.getByTestId('invoice-paid')).toHaveText('{{c:inv3.paid}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{c:inv3.due}}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('£80.00');

        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('payment-form-currency').selectOption('JPY');
        await page.getByTestId('payment-form-amount').fill('10000');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 10,000 x 0.0066 / 1.10 = €60.00: €50.00 pays the invoice, €10.00 is held as credit
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-amount')).toHaveText('¥10,000');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{dd:inv4.status}}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=10.00');
        await expect(page.getByTestId('client-row-2').getByTestId('client-credit')).toHaveText('{{dd:client2.credit}}');
""", c=c, dd=dd)
    note = None
    if rev:
        note = ("UPDATED for cp88 (mutates: [61, 74, 79]): conversions now round down to the target "
                "currency's step, so €50 pays CHF 48.65 still but €100 pays ¥16,666 (not ¥16,667), leaving "
                "¥3,334 due. Carries both tests.")
    hdr = f"""
        A payment can be made in another currency (payments[].currency, the payment form's currency; the
        client's own by default). It is converted into the client's currency through US dollars at the
        workspace rates: amount x (dollars per unit paid) / (dollars per unit of the client's currency),
        {'rounded down' if rev else 'rounded half up'} to the client's currency step (whole yen, CHF 0.05, otherwise the cent). The
        converted amount is what is applied and checked (amount due, minimum part payment, write-off,
        credit held) and is what PAYMENT_RECORDED shows; the payment row shows the amount in the currency
        paid and the part applied in the client's currency."""
    return Spec('cp61_foreign_payments', 'payments in another currency', hdr, [t1, t2], n, copy_note=note)


cp(61, 'foreign_payments', """
    Clients sometimes pay in another currency. Let me pick the payment's currency on the payment form
    (the client's own by default). Convert the amount into the client's currency through US dollars at
    the workspace rates: amount x (dollars per unit of the currency paid) / (dollars per unit of the
    client's currency), then round half up to the client's currency step: whole yen for JPY, 0.05 for
    CHF, the cent for the others. That converted amount is what is applied, and every check uses it:
    the amount due, the minimum part payment, the write-off of a small balance and any credit held.
    Show the payment's amount in the currency it was paid in and what was applied in the client's
    currency, and write the converted amount in PAYMENT_RECORDED.
""", s61, algorithm='fx-triangulation')

# =============================================================================== cp62 early-payment discount
EP = dict(A, earlyPayPct=2, earlyPayDays=10)


def s62(n):
    fx1 = dict(asOf='2026-03-05', settings={'taxRate': 10}, clients=[EP], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1122.33)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Design', 1, 500)])])
    v = V(fx1, n)
    st = num(v['inv1.settle'])
    a = plus(fx1, payments=[P(1, 1, st, '2026-03-05', [(1, st)])])
    b = plus(a, payments=[P(2, 1, 539, '2026-03-05', [(2, 539)])])
    t1 = T('settles early for the discounted amount', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 1,122.33 + 112.23 tax = 1,234.56; 2% = 24.6912, rounded down to 24.69; issued 2026-03-01,
        // so the 10-day window is open today (2026-03-05)
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{s:inv1.settle}');
        await page.getByTestId('payment-form-amount').fill('{s:inv1.settle|plain}');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{a:inv1.earlyDiscount}');
        await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount={a:inv1.earlyDiscount|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}'); // invoice 2 only

        // invoice 2's window closed on 2026-02-11: no early amount, the full total is due
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
        await page.getByTestId('payment-form-amount').fill('539');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}'); // 550.00 - 539.00
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv2.status}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{b:inv2.earlyDiscount}');
""", a=a, b=b)
    fx2 = dict(asOf='2026-03-05', clients=[EP], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 300)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 100)], retentionPct=10)])
    c = plus(fx2, payments=[P(1, 1, 300, '2026-03-05', [(3, 294)])])
    t2 = T('paying the full amount early leaves the discount as credit', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('payment-form-amount').fill('300');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        // 300.00 - 2% (6.00) = 294.00 settles it; the other 6.00 is held as credit
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv3.status}');
        await expect(page.getByTestId('invoice-paid')).toHaveText('{c:inv3.paid}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{c:inv3.earlyDiscount}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=6.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{c:client1.credit}');
        // an invoice holding back retention gets no early discount
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
""", c=c)
    fx3 = dict(asOf=SA, clients=[A])
    d = plus(fx3, clients=[{'id': 2, 'name': 'Initech', 'email': 'ap@initech.example', 'earlyPayPct': 2,
                            'earlyPayDays': 10}])
    d['invoices'] = [I(1, 2, 'SENT', SA, '2026-04-30', [L(1, 'Design', 1, 100)])]
    t3 = T('sets early-payment terms when adding a client', '@core', fx3, """
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-early-pct').fill('2');
        await page.getByTestId('client-form-early-days').fill('10');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('100');
        await page.getByTestId('line-form-submit').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{d:inv1.settle}'); // 100.00 - 2%
""", d=d)
    return Spec('cp62_early_payment_discount', 'early-payment discount', """
        A client can have an early-payment discount (clients[].earlyPayPct and clients[].earlyPayDays,
        set when adding the client). If an invoice of theirs is paid off within that many days of its
        issue date, the early discount (the percentage of the grand total, rounded down to the cent)
        comes off: a payment dated within the window that brings what is paid (plus credit notes) up to
        the grand total minus the early discount settles the invoice. It is Paid with nothing due, the
        panel shows the early discount taken ($0.00 otherwise) and EARLY_DISCOUNT id=<invoice id>
        amount=<discount> is written. While the window is open the panel shows the amount that would
        settle it now. Anything paid beyond that is held as credit. Invoices with retention or a plan
        get no early discount.""", [t1, t2, t3], n)


cp(62, 'early_payment_discount', """
    Some clients get an early-payment discount: a percentage and a number of days, set when I add the
    client. If one of their invoices is paid off within that many days of its issue date, they may
    pay that percentage less: the early discount is the percentage of the grand total, rounded down to
    the cent (whole yen for yen clients). A payment dated within the window that brings what has been
    paid (plus any credit notes) up to the grand total minus the early discount settles the invoice:
    it is Paid, its amount due is zero, the panel shows the early discount taken ($0.00 otherwise),
    and it writes EARLY_DISCOUNT id=<invoice id> amount=<discount>. While the window is open, show the
    amount that would settle it now (the amount due minus the early discount). Anything paid beyond
    that is held as credit. Invoices with retention or an instalment plan get no early discount.
""", s62)

# =============================================================================== cp63 compound late interest
LI = {'lateInterestRate': 12}


def s63(n):
    late = n >= 68
    B = '360' if n >= 80 else '365'
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-01-15', '2026-02-15', [L(2, 'Build', 1, 2000)])],
        payments=[P(1, 1, 500, '2026-03-17', [(2, 500)])])
    v = V(fx1, n)
    d1 = num(v['inv1.due'])
    pd = plus(fx1, payments=[P(2, 1, d1, '2026-04-30', [(1, d1)])])
    if late:
        a1 = f"// from the end of the grace week (2026-03-08) to today: 53 days; 1,000.00 x ((1 + 0.12/{B})^53 - 1)"
        a2 = """// invoice 2: 2,000.00 from 2026-02-22 to the payment on 2026-03-17 (23 days), then what is
        // still owed after the 500.00 pays that interest first, from 2026-03-17 to today (44 days)"""
        if n >= 96:
            a2 = """// invoice 2: 2,000.00 from 2026-02-22 to the payment on 2026-03-17 (23 days); the 500.00 pays
        // the invoice first, so 1,500.00 earns interest from 2026-03-17 to today (44 days)"""
    else:
        a1 = "// due 2026-03-01, 60 days ago: 1,000.00 x ((1 + 0.12/365)^60 - 1) = 19.9186 (simple interest: 19.73)"
        a2 = """// invoice 2: 2,000.00 for the 30 days to the payment on 2026-03-17, then what is still owed
        // after the 500.00 pays that interest first, for the 44 days to today"""
    t1 = T('charges daily compound interest on an overdue invoice', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        {a1}
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{s:inv1.status}}');
        await page.getByTestId('invoice-row-2').click();
        {a2}
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv2.due}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{{s:client1.balance}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');

        // paying everything, interest included, clears it
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('payment-form-amount').fill('{{s:inv1.due|plain}}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{pd:inv1.due}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{pd:inv1.interest}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{pd:inv1.status}}');
""", pd=pd)
    fx2 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-20', '2026-04-20', [L(1, 'Design', 1, 100)]),
        I(4, 1, 'SENT', '2026-03-25', '2026-04-25', [L(2, 'Design', 1, 100)])],
        payments=[P(1, 1, 100, '2026-04-25', [(3, 100)])])
    t2 = T('charges nothing when paid within the grace week', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // invoice 3 was paid 5 days after its due date: late, but within the week's grace
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        // invoice 4 is 5 days past due: not overdue yet
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv4.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv4.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv4.status}');
""")
    note = None
    if n >= 96:
        note = ("UPDATED for cp96 (mutates: [63, 80, 86]): a payment now pays the invoice before its late "
                "interest, so invoice 2's 500.00 leaves 1,500.00 earning interest and its first period's "
                "interest unpaid: its interest and amount due change. Carries both tests.")
    elif n >= 80:
        note = ("UPDATED for cp80 (mutates: [63, 65, 66, 68, 70]): late interest now uses an Actual/360 day "
                "count, so the 53 days on 1,000.00 earn $17.82 instead of $17.57 and every interest figure "
                "rises with it. Carries both tests.")
    elif late:
        note = ("UPDATED for cp68 (mutates: [63, 65, 66]): interest now runs from the end of the grace week, "
                "not the due date, so the 1,000.00 invoice due 2026-03-01 earns 53 days of interest by "
                "2026-04-30 instead of 60. Carries both tests.")
    hdr = f"""
        Overdue invoices earn late interest at the workspace's annual rate (settings.lateInterestRate).
        Once an invoice has been more than 7 days past its due date with something owing, interest runs
        from {'the end of that week (7 days after the due date)' if late else 'the due date'}, compounded daily at rate / {B} (Actual/{B}): a balance B owing for d days
        earns B x ((1 + rate / 100 / {B})^d - 1), rounded half up to the cent. Each payment starts a new
        period; every period earns interest on what the invoice still owed during it (not counting
        earlier interest or retention) and the periods' interest is added up. A payment pays {'what the invoice itself owes first, then the late fee, then the interest' if n >= 96 else 'interest earned so far first, then the invoice'}. The panel shows the interest charged; it is part of the
        amount due, the client's balance and overdue amount, and keeps the invoice Overdue until paid.
        Nothing is charged if everything was paid within the week's grace. Planned invoices don't earn
        it."""
    return Spec('cp63_late_interest', 'late interest', hdr, [t1, t2], n, copy_note=note)


cp(63, 'late_interest', """
    Charge late interest on overdue invoices at an annual rate set for the workspace. Once an invoice
    has been more than 7 days past its due date with something still owing, interest runs from the
    due date, compounded daily at the annual rate / 365 for each day (Actual/365): a balance B owing
    for d days earns B x ((1 + rate / 100 / 365)^d - 1), rounded half up to the cent. Each payment made
    after the due date starts a new period: every period earns interest on what the invoice still owed
    during it (not counting interest already earned, or retention), and the periods' interest is added
    up. A payment pays off the interest earned so far first, then the invoice. Show the interest
    charged on the invoice; it is part of the amount due, the client's balance and their overdue
    amount, and it keeps the invoice Overdue until it is paid. Nothing is charged if everything was
    paid within the week's grace. Invoices on an instalment plan don't earn this interest.
""", s63, algorithm='compound-late-interest')

# =============================================================================== cp64 allocation priority


def s64(n):
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 40)]),
        I(2, 1, 'SENT', '2026-02-05', '2026-04-05', [L(2, 'Hosting', 1, 60)]),
        I(3, 1, 'SENT', '2026-03-15', '2026-04-15', [L(3, 'Support', 1, 30)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-05-31', [L(4, 'Build', 1, 200)]),
        I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(5, 'Training', 1, 150)])])
    a = plus(fx1, payments=[P(1, 1, 300, '2026-04-20', [(1, 40), (2, 60), (4, 200)])])
    b = plus(fx1, payments=[P(1, 1, 250, '2026-04-20', [(4, 200), (5, 50)])])
    t1 = T('pays overdue invoices first, then the largest', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('300');
        await page.getByTestId('payment-form-date').fill('2026-04-20');
        await page.getByTestId('payment-form-submit').click();
        // overdue first, oldest due date first: 1 (due 03-31) 40.00, 2 (04-05) 60.00; then the largest
        // amount due: 4 (200.00). Invoice 3 (due 04-15) is within its grace week, so not overdue.
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',
          'PAYMENT_RECORDED id=1 invoice=4 amount=200.00',
        ]);
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{a:inv3.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{a:inv5.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}'); // 30.00 + 150.00
""", a=a)
    t2 = T('pays named invoices the same way', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('250');
        await page.getByTestId('payment-form-date').fill('2026-04-20');
        await page.getByTestId('payment-form-reference').fill('{s:inv3.number}, {s:inv4.number}, {s:inv5.number}');
        await page.getByTestId('payment-form-submit').click();
        // none of the three is overdue: largest first, 4 (200.00), then 5 (50.00 of 150.00)
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=4 amount=200.00',
          'PAYMENT_RECORDED id=1 invoice=5 amount=50.00',
        ]);
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{b:inv3.status}');
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{b:inv5.status}');
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv5.due}'); // 150.00 - 50.00
""", b=b)
    return Spec('cp64_allocation_priority', 'payment priority', """
        A payment applied automatically, or across several references, pays the client's overdue
        invoices first (oldest due date first, lower id on the same date), then the rest from the largest
        amount due to the smallest (lower id on the same amount), each paid off before the next.""",
        [t1, t2], n)


cp(64, 'allocation_priority', """
    Change the order a payment is spread in when it's applied automatically or across several
    references: pay the overdue invoices first, oldest due date first (lower id on the same date);
    then the rest from the largest amount due to the smallest (lower id on the same amount), paying
    each off before the next. That clears what is late, then as much of the biggest debts as possible.
""", s64, type_='mutative', mutates=[22, 24, 50])

# =============================================================================== cp65 late fee


def s65(n):
    late = n >= 68
    fx1 = dict(asOf='2026-04-30', settings={'usdPer': RATES, 'lateInterestRate': 12, 'lateFee': 25},
               clients=[A, HV], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 5, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 500)])])
    a = plus(fx1, payments=[P(1, 1, 125, '2026-04-30', [(1, 125)])])
    t1 = T('charges a late fee once an invoice is overdue', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // overdue since 2026-03-09: {'2% of 1,000.00 = 20.00' if n >= 100 else 'a 25.00'} fee, plus interest on the 1,000.00 only
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv1.lateFee}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        // {'a 125.00 payment (at least the 10% minimum) pays the invoice first: 125.00 less is owed' if n >= 96 else 'a 125.00 payment (at least the 10% minimum) pays the fee first, then the interest, then the invoice'}
        await page.getByTestId('payment-form-amount').fill('125');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{a:inv1.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');

        // {'2% of CHF 500.00 = CHF 10.00, more than $10.00 (CHF 8.80)' if n >= 100 else 'for a franc client the $25.00 fee is converted: 25 / 1.13 = 22.12 -> CHF 22.10'}
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv2.lateFee}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv2.due}}');
        await expect(page.getByTestId('client-row-5').getByTestId('client-overdue')).toHaveText('{{s:client5.overdue}}');
""", a=a)
    fx2 = dict(asOf='2026-04-30', settings={'lateFee': 25}, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-20', '2026-04-20', [L(1, 'Design', 1, 100)]),
        I(4, 1, 'SENT', '2026-03-25', '2026-04-25', [L(2, 'Design', 1, 100)])],
        payments=[P(1, 1, 100, '2026-04-25', [(3, 100)])])
    t2 = T('charges no fee within the grace week', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{s:inv3.lateFee}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{s:inv4.lateFee}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv4.due}');
""")
    note = None
    if n >= 80:
        note = ("UPDATED for cp80 (mutates: [63, 65, 66, 68, 70]): late interest now uses an Actual/360 day "
                "count, so the interest beside the fees, and the amounts due, are higher; the fees are "
                "unchanged. Carries both tests.")
    elif late:
        note = ("UPDATED for cp68 (mutates: [63, 65, 66]): late interest now runs from the end of the grace "
                "week, so the overdue invoices earn 53 days of interest instead of 60 and the amounts due "
                "change with it; the fees are unchanged. Carries both tests.")
    if n >= 100:
        note = ("UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed with a "
                "$10.00 minimum, so the 1,000.00 invoice is charged 20.00 and the CHF 500.00 invoice CHF 10.00 "
                "instead of the flat $25.00. Carries both tests.")
    return Spec('cp65_late_fee', 'late fee', f"""
        {'A late fee of 2% of what is owed (at least $10.00, at most 10% of the grand total)' if n >= 100 else 'A fixed late fee (settings.lateFee, in US dollars)'} is charged once on an invoice when it becomes
        Overdue, if something is still owed then; for a client billed in another currency it is
        converted through US dollars to their currency's step. The panel shows the fee charged ($0.00
        when none); it is part of the amount due, the balance and the overdue amount, earns no interest,
        and a payment pays it {'after the invoice itself and before the interest' if n >= 96 else 'first, before interest and the invoice'}. Nothing is charged when the invoice
        is paid within the week's grace; planned invoices are not charged it.""", [t1, t2], n, copy_note=note)


cp(65, 'late_fee', """
    Charge a fixed late fee, a workspace setting in US dollars, once on an invoice when it becomes
    Overdue (if something is still owed then). For a client billed in another currency, convert the
    fee from dollars to their currency the same way as a payment in another currency, rounded to their
    currency's step. Show the late fee charged on the invoice ($0.00 when none). It is part of the
    amount due, the client's balance and their overdue amount, earns no interest, and a payment pays
    it first, before any interest and then the invoice. Nothing is charged when the invoice is paid
    within the week's grace, and invoices on an instalment plan aren't charged it.
""", s65)

# =============================================================================== cp66 interest on instalments


def s66(n):
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = num(V(fx1, n)['inv1.inst1.payment'])
    fx1['payments'] = [P(1, 1, first, '2026-02-27', [(1, first)])]
    v = V(fx1, n)
    owe = num(v['client1.overdue'])
    a = plus(fx1, payments=[P(2, 1, owe, '2026-04-30', [(1, owe)])])
    late = n >= 68
    t1 = T('an overdue instalment earns late interest', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // instalment 2 (due 2026-03-31) is unpaid: {'23 days from the end of its grace week' if late else '30 days of interest from its due date'}
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('{{s:inv1.inst2.lateInterest}}');
        // instalment 3 is due today, not overdue
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-late-interest')).toHaveText('{{s:inv1.inst3.lateInterest}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
        // paying exactly that clears instalment 2 and its interest
        await page.getByTestId('payment-form-amount').fill('{{s:client1.overdue|plain}}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{{a:inv1.inst2.status}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-status')).toHaveText('{{a:inv1.inst3.status}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{a:client1.overdue}}');
""", a=a)
    note = None
    notes = []
    if n >= 68:
        notes.append("cp68: interest now runs from the end of the grace week (23 days instead of 30)")
    if n >= 80:
        notes.append("cp80: interest uses an Actual/360 day count")
    if n >= 84:
        notes.append("cp84: instalments are rounded up to the whole dollar (341.00, 341.00, 338.04)")
    if notes:
        k = max(m for m in MUTS if m <= n)
        note = (f"UPDATED for cp{k} (mutates: {MUTS[k]}): " + "; ".join(notes) +
                ", so the overdue instalment's interest and the amounts change. Carries the test.")
    return Spec('cp66_instalment_interest', 'late interest on instalments', f"""
        Planned invoices earn late interest instalment by instalment: an instalment more than 7 days past
        its due date without being paid off earns interest by the same rule as an invoice, from {'the end of its grace week' if late else 'its own due date'},
        on its unpaid part, in periods split by payments. Payments go to each instalment's interest
        before the instalment itself, earliest instalment first. Each instalment row shows its late
        interest; the invoice's interest is their total, part of the amount due and of the client's
        overdue amount.""", [t1], n, copy_note=note)


MUTS = {68: [63, 65, 66], 80: [63, 65, 66, 68, 70], 84: [57, 58, 66, 71, 73]}

cp(66, 'instalment_interest', """
    Planned invoices should earn late interest too, instalment by instalment. An instalment that has
    been more than 7 days past its due date without being paid off earns interest by the same rule as
    an invoice, from its own due date, on its unpaid part, with a new period at each payment. Payments
    go to an instalment's late interest before the instalment itself, earliest instalment first. Show
    each instalment's late interest; the invoice's interest is their total, and it is part of the
    amount due and of the client's overdue amount.
""", s66)

# =============================================================================== cp67 earmarked deposits


def s67(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 80)]),
        I(2, 1, 'DRAFT', '2026-03-02', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
        payments=[P(1, 1, 30, '2026-03-01', [])])
    ref2 = V(fx1, n)['inv2.reference']
    dep = plus(fx1, payments=[P(2, 1, 60, '2026-03-05', [], reference=ref2)])
    s1 = plus(dep, inv=[(1, dict(status='SENT', issueDate=SA))], alloc=[(1, 1, 30, SA)])
    s2 = plus(s1, inv=[(2, dict(status='SENT', issueDate=SA))], alloc=[(2, 2, 50, SA)])
    t1 = T('holds a deposit for one invoice', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-deposit').check();
        await page.getByTestId('payment-form-amount').fill('60');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-reference').fill('{s:inv2.reference}'); // draft invoice 2
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{dep:client1.credit}'); // 30.00 + 60.00
        // invoice 1 may only use the 30.00 that isn't held for invoice 2
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s1:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s1:inv1.due}'); // 80.00 - 30.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s1:client1.credit}');
        // invoice 2 uses its own deposit first; the 10.00 left over becomes ordinary credit
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s2:inv2.status}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=30.00',
          'PAYMENT_RECORDED id=2 invoice=2 amount=50.00',
        ]);
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s2:client1.credit}');
""", dep=dep, s1=s1, s2=s2)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 40)])],
        payments=[P(3, 1, 40, '2026-03-01', [], reference='RF56 0000 034'), P(4, 1, 20, '2026-03-02', [])])
    ref3 = V(fx2, n)['inv3.reference']
    assert ref3 == 'RF56 0000 034', ref3
    r = plus(fx2, pay=[(4, dict(refunded=20))])
    t2 = T("refunds and other invoices can't touch a held deposit", '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        // payment 3 is held for draft invoice 3; only payment 4's 20.00 can be refunded
        await page.getByTestId('refund-form-amount').fill('30');
        await page.getByTestId('refund-form-date').fill('2026-03-09');
        await page.getByTestId('refund-form-submit').click();
        await expect(page.getByTestId('refund-form-error')).toBeVisible();
        await page.getByTestId('refund-form-amount').fill('20');
        await page.getByTestId('refund-form-submit').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=4 amount=20.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{r:client1.credit}');
        // a deposit can only be held for one of the client's drafts
        await page.getByTestId('payment-form-deposit').check();
        await page.getByTestId('payment-form-amount').fill('10');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-reference').fill('{s:inv4.reference}'); // invoice 4 is sent
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        expect(auditLines().filter((l) => l.startsWith('DEPOSIT_RECORDED'))).toEqual([]);
""", r=r)
    return Spec('cp67_held_deposits', 'deposits held for an invoice', """
        A deposit recorded with a reference (an RF reference or invoice number of one of the client's
        drafts, payments[].reference) is held for that invoice: when it is sent it uses that deposit
        first, before any other credit; no other invoice uses it and refunds skip it while that invoice
        is a draft. Whatever is left of it once its invoice has been sent is ordinary credit. A deposit
        naming anything but one of the client's drafts is refused.""", [t1, t2], n)


cp(67, 'held_deposits', """
    Let me hold a deposit for one particular invoice: when I tick Deposit and also give a reference
    (the RF reference or invoice number of one of the client's drafts), keep it for that invoice.
    When that invoice is sent it uses this deposit first, before any other credit. No other invoice
    may use it, and refunds can't take it, while that invoice is still a draft; whatever is left of it
    after its invoice has been sent is ordinary credit. Refuse a deposit whose reference isn't one of
    the client's drafts.
""", s67)

# =============================================================================== cp68 interest after grace


def s68(n):
    B = '360' if n >= 80 else '365'
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-04-15', [L(2, 'Build', 1, 1000)])])
    t1 = T('counts interest from the end of the grace week', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // due 2026-03-01: interest from 2026-03-08 to 2026-04-30 is 53 days, not 60
        // 1,000.00 x ((1 + 0.12/{B})^53 - 1)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        // due 2026-04-15: 2026-04-22 to today is 8 days
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
""")
    note = None
    if n >= 80:
        note = ("UPDATED for cp80 (mutates: [63, 65, 66, 68, 70]): late interest now uses an Actual/360 day "
                "count, so both invoices' interest is higher. Carries the test.")
    return Spec('cp68_interest_after_grace', 'interest after the grace week', """
        Late interest is counted from the end of the week's grace (7 days after the due date, or after
        an instalment's due date) instead of from the due date itself; everything else about it is
        unchanged.""", [t1], n, copy_note=note)


cp(68, 'interest_after_grace', """
    Clients say it's unfair to charge interest for the week's grace. Count late interest from the end
    of the grace week (7 days after the due date, or after an instalment's due date) instead of from
    the due date. Everything else about it stays the same.
""", s68, type_='mutative', mutates=[63, 65, 66], copies=['cp63_late_interest', 'cp65_late_fee', 'cp66_instalment_interest'])

# =============================================================================== cp69 void returns credit


def s69(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 80)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])],
        payments=[P(1, 1, 100, '2026-02-20', [(1, 80, '2026-03-01')]), P(2, 1, 30, '2026-03-05', [(2, 30)])])
    v = plus(fx1, inv=[(1, dict(status='VOID'))], pay=[(1, dict(allocations=[]))])
    t1 = T('voiding an invoice paid by credit puts the credit back', '@core', fx1, """
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}'); // 100.00 - 80.00
        await page.getByTestId('client-row-1').click();
        // invoice 1 was paid only by credit used when it was sent
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-void').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{v:inv1.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_RETURNED payment=1 amount=80.00');
        await expect.poll(() => auditLines()).toContain('INVOICE_VOIDED id=1 number=INV-0000018');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{v:client1.credit}');
        // 20.00 still due on invoice 2, less 100.00 of credit
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{v:client1.balance}');
        // invoice 2 has a payment recorded against it: it still can't be voided
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-void').click();
        await expect(page.getByTestId('invoice-void-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{v:inv2.status}');
""", v=v)
    return Spec('cp69_void_returns_credit', 'voiding returns used credit', """
        A sent invoice whose only payments are credit used on it when it was sent (allocations with
        their own applied date) can be voided: the credit goes back to the client's account, unused
        again, writing CREDIT_RETURNED payment=<payment id> amount=<amount> for each payment as well as
        INVOICE_VOIDED. An invoice with a payment recorded against it still can't be voided.""", [t1], n)


cp(69, 'void_returns_credit', """
    Let me void a sent invoice even when it has been paid, as long as all it was paid with is credit
    used on it automatically when it was sent. Voiding puts that credit back on the client's account,
    unused again, and writes CREDIT_RETURNED payment=<payment id> amount=<amount> for each payment it
    came from, as well as INVOICE_VOIDED. An invoice with a payment I recorded against it still can't
    be voided.
""", s69)

# =============================================================================== cp70 waive interest


def s70(n):
    B = '360' if n >= 80 else '365'
    st = {'lateInterestRate': 12, 'lateFee': 25}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(3, 1, 'SENT', '2026-04-01', '2026-05-31', [L(3, 'Design', 1, 100)])])
    w = plus(fx1, inv=[(1, dict(interestWaivedOn='2026-04-30'))])
    t1 = T('waives the late interest and fee charged so far', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv1.lateFee}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await page.getByTestId('invoice-waive').click();
        // the {'20.00' if n >= 100 else '25.00'} fee and the interest so far are written off; the 1,000.00 is still overdue
        await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount={{w:inv1.waived|plain}}');
        await expect(page.getByTestId('invoice-waived')).toHaveText('{{w:inv1.waived}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{w:inv1.interest}}');
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{w:inv1.lateFee}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{w:inv1.due}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{w:inv1.status}}');
        // nothing to waive on an invoice that isn't overdue
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-waive').click();
        await expect(page.getByTestId('invoice-waive-error')).toBeVisible();
""", w=w)
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-01-01', '2026-02-01', [L(1, 'Build', 1, 1000)], interestWaivedOn='2026-03-31')])
    t2 = T('interest starts again from the day it was waived', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // waived on 2026-03-31: since then 30 days on the 1,000.00 still owed, and no second fee
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}'); // 1,000.00 x ((1 + 0.12/{B})^30 - 1)
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv2.lateFee}}');
        await expect(page.getByTestId('invoice-waived')).toHaveText('{{s:inv2.waived}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv2.due}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
""")
    note = None
    if n >= 100:
        note = ("UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed, so "
                "the 1,000.00 invoice's fee is 20.00 and the totals waived change. Carries both tests.")
    elif n >= 80:
        note = ("UPDATED for cp80 (mutates: [63, 65, 66, 68, 70]): late interest now uses an Actual/360 day "
                "count, so the interest charged and waived is higher. Carries both tests.")
    return Spec('cp70_waive_interest', 'waive late charges', """
        The Waive button on an overdue invoice writes off the late interest and late fee still unpaid on
        it (invoices[].interestWaivedOn records the day), writing INTEREST_WAIVED id=<id>
        amount=<amount>; the panel shows the total waived. Interest then starts again from that day on
        what is still owed, and no new fee is charged. Waiving is refused when there is nothing to
        waive.""", [t1, t2], n, copy_note=note)


cp(70, 'waive_interest', """
    Let me waive the late charges on an overdue invoice: a Waive button writes off whatever late
    interest and late fee is still unpaid on it, writes INTEREST_WAIVED id=<id> amount=<amount
    waived>, and shows the total waived on the invoice. From that day interest starts again on what is
    still owed (no new late fee is charged). Refuse it when there is nothing to waive.
""", s70)

# =============================================================================== cp71 plan payoff


def s71(n):
    fx1 = dict(asOf='2026-03-15', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = num(V(fx1, n)['inv1.inst1.payment'])
    fx1['payments'] = [P(1, 1, first, '2026-02-27', [(1, first)])]
    po = num(V(fx1, n)['inv1.payoff'])
    a = plus(fx1, payments=[P(2, 1, 700, '2026-03-15', [(1, po)])])
    rev = n >= REV84
    t1 = T('pays off a plan early without the future interest', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // instalment 1 is paid; neither later instalment is due yet, so the payoff is the principal
        // still owed ({'669.00' if rev else '333.32 + 336.66'}) without their interest
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        await expect(page.getByTestId('invoice-payoff')).toHaveText('{{s:inv1.payoff}}');
        await page.getByTestId('payment-form-amount').fill('700');
        await page.getByTestId('payment-form-date').fill('2026-03-15');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{a:inv1.due}}');
        // the interest of instalments 2 and 3 is dropped
        await expect(page.getByTestId('invoice-interest-saved')).toHaveText('{{a:inv1.saved}}');
        await expect.poll(() => auditLines()).toContain('PLAN_SETTLED id=1 saved={{a:inv1.saved|plain}}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=1 amount={{s:inv1.payoff|plain}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{{a:client1.credit}}'); // 700.00 - {{s:inv1.payoff|plain}}
""", a=a)
    fx2 = dict(asOf='2026-04-10', clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)],
        payments=[P(1, 1, first, '2026-02-27', [(2, first)])])
    t2 = T('the payoff includes the interest of instalments already due', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // instalment 2 fell due on 2026-03-31, so its interest is owed; only instalment 3's interest
        // is dropped
        await expect(page.getByTestId('invoice-payoff')).toHaveText('{{s:inv2.payoff}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv2.due}}');
""")
    note = None
    if rev:
        note = ("UPDATED for cp84 (mutates: [57, 58, 71, 73]): instalments are now rounded up to the whole "
                "dollar (341.00, 341.00, 338.04), so the principal still owed after the first and the payoff "
                "and interest saved change. Carries both tests.")
    return Spec('cp71_plan_payoff', 'paying off a plan early', """
        A planned invoice shows its payoff: the principal still owed on all its instalments, plus what
        is unpaid of the interest of instalments already due (due on or before today) and any late
        interest. A payment of at least the payoff settles the plan: the interest of the instalments not
        yet due is dropped and shown as interest saved, the invoice is Paid, anything beyond is held as
        credit, and PLAN_SETTLED id=<id> saved=<interest saved> is written.""", [t1, t2], n, copy_note=note)


cp(71, 'plan_payoff', """
    Let clients pay off an instalment plan early. On a planned invoice show the payoff amount: the
    principal still owed on all its instalments, plus whatever is unpaid of the interest of
    instalments already due (due date on or before today), plus any late interest. A payment of at
    least the payoff settles the plan: the interest of the instalments not yet due is dropped and
    shown as interest saved, the invoice is Paid, anything paid beyond the payoff is held as credit,
    and it writes PLAN_SETTLED id=<id> saved=<interest saved>.
""", s71)

# =============================================================================== cp72 tax rounded once


def s72(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Badge', 1, 3.35), L(2, 'Lanyard', 1, 3.35), L(3, 'Pass', 1, 3.35)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(4, 'Book', 1, 10.10, taxRate=5), L(5, 'Course', 1, 20.05), L(6, 'Pen', 1, 0.15)])])
    t1 = T('rounds the invoice tax once and shares it over the lines', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 3 x 0.335 = 1.005 -> 1.01 (rounding each line would give 1.02); shared 101 cents over equal
        // exact taxes: 33 each, the 2 left over to the lower ids
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{s:inv1.line1.tax}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('{s:inv1.line2.tax}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('{s:inv1.line3.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await page.getByTestId('invoice-row-2').click();
        // exact: 5% of 10.10 = 0.505, 10% of 20.05 = 2.005, 10% of 0.15 = 0.015; total 2.525 -> 2.53
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('{s:inv2.line4.tax}');
        await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('{s:inv2.line5.tax}');
        await expect(page.getByTestId('line-row-6').getByTestId('line-tax')).toHaveText('{s:inv2.line6.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
""")
    return Spec('cp72_tax_rounded_once', 'tax rounded once', """
        The invoice's tax is worked out once: every line's exact tax (its rate on its amount minus its
        discount share, unrounded) is added up and the total rounded half up to the cent. Each line shows
        its share of that tax, split in proportion to the lines' exact taxes like the discount split
        (whole cents first, leftover cents to the largest remainders; ties to the larger exact tax, then
        the lower line id), so the line taxes add up exactly to the invoice tax.""", [t1], n)


cp(72, 'tax_rounded_once', """
    Rounding tax on every line makes my invoices a cent or two off what the tax office expects. Work
    the invoice's tax out once: add up every line's exact tax (its rate on its amount minus its share
    of the discount, unrounded) and round the total half up to the cent. Then show each line's tax as
    its share of that total, split in proportion to the lines' exact taxes the same way the discount
    is split: each line gets the whole cents of its share first, the cents left over go to the largest
    leftover fractions, and on a tie to the line with the larger exact tax, then the lower id. The
    line taxes always add up exactly to the invoice tax.
""", s72, type_='mutative', mutates=[14, 19, 20, 29])

# =============================================================================== cp73 credit note on a plan


def s73(n):
    fx1 = dict(asOf='2026-03-15', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12),
        I(2, 1, 'DRAFT', '2026-03-10', '2026-04-30', [L(2, 'Consulting', 1, 100)], creditOf=1)])
    first = num(V(fx1, n)['inv1.inst1.payment'])
    fx1['payments'] = [P(1, 1, first, '2026-02-27', [(1, first)])]
    a = plus(fx1, inv=[(2, dict(status='SENT', issueDate='2026-03-15'))])
    rev = n >= REV84
    t1 = T('a credit note on a plan re-works the instalments still to come', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={{a:inv2.number}} invoice=1 total=100.00');
        await page.getByTestId('invoice-row-1').click();
        // instalments 2 and 3 fall due after today: {'669.00' if rev else '669.98'} principal before them, less 100.00,
        // over 2 months at 12%{': 569.00 x 0.01 / (1 - 1.01^-2) = 288.76, rounded up to 289.00' if rev else ': 569.98 x 0.01 / (1 - 1.01^-2) = 289.27'}
""" + inst_rows(a, 1, (2, 3), 'a') + f"""
        // instalment 1 is unchanged
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{{a:inv1.inst1.payment}}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{{a:inv1.planTotal}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{a:inv1.due}}');
""", a=a)
    fx2 = dict(asOf='2026-04-10', clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12),
        I(4, 1, 'DRAFT', '2026-04-10', '2026-05-31', [L(2, 'Consulting', 1, 100)], creditOf=3)],
        payments=[P(1, 1, first, '2026-02-27', [(3, first)])])
    t2 = T('refuses a credit note on a plan with an overdue instalment', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        // instalment 2 (due 2026-03-31) is overdue
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{s:inv3.planTotal}');
""")
    note = None
    if rev:
        note = ("UPDATED for cp84 (mutates: [57, 58, 71, 73]): instalments are now rounded up to the whole "
                "dollar, so the original schedule and the re-worked instalments change (289.00 then the rest). "
                "Carries both tests.")
    return Spec('cp73_credit_note_on_plan', 'credit notes on a plan', """
        A credit note on a planned invoice comes off its remaining plan instead of its amount due: the
        instalments due after the credit note's issue date are worked out again by the plan's rule, from
        the principal still owed before them minus the credit note, over the same number of instalments
        at the plan's rate, keeping their due dates; earlier instalments are unchanged. A credit note on a
        plan with an overdue instalment, or for more than that principal, is refused.""", [t1, t2], n, copy_note=note)


cp(73, 'credit_note_on_plan', """
    A credit note on a planned invoice should come off the plan, not the amount due. When it's issued,
    work the instalments due after its issue date out again by the same rule: from the principal
    still owed before them minus the credit note, over the same number of instalments at the plan's
    rate, keeping their due dates. Instalments due before then stay as they were. Refuse a credit note
    on a plan with an overdue instalment, or for more than that principal.
""", s73)

# =============================================================================== cp74 dated rates


def s74(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES, 'fxRates': [{'from': '2026-03-01', 'currency': 'EUR', 'usdPer': 1.2}]},
               clients=[HV], invoices=[I(1, 5, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 200)])],
               payments=[P(1, 5, 50, '2026-02-25', [(1, 48.65)], currency='EUR')])
    amt = num(V(plus(fx1, payments=[P(2, 5, 50, '2026-03-05', [], currency='EUR')]), n)['client5.credit'])
    a = plus(fx1, payments=[P(2, 5, 50, '2026-03-05', [(1, amt)], currency='EUR')])
    rev = n >= 88
    t1 = T('converts at the rate in force on the payment date', '@core', fx1, f"""
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-1').click();
        // paid 2026-02-25, before the 1.20 rate: 50 x 1.10 / 1.13 = 48.67 -> CHF 48.65
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('CHF 48.65');
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('50');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        // from 2026-03-01 a euro is worth $1.20: 50 x 1.20 / 1.13 = 53.097 -> {'down' if rev else 'half up'} to CHF 0.05
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('CHF {amt:.2f}');
        await expect(page.getByTestId('invoice-paid')).toHaveText('{{a:inv1.paid}}'); // 48.65 + {amt:.2f}
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{a:inv1.due}}');
""", a=a)
    note = None
    if rev:
        note = ("UPDATED for cp88 (mutates: [61, 74, 79]): conversions now round down to the step, so the "
                "second payment (53.097) is CHF 53.05 instead of 53.10. Carries the test.")
    return Spec('cp74_dated_rates', 'exchange rates by date', f"""
        Exchange rates can change over time: settings.fxRates lists dated rates (from a date, for a
        currency, the US dollars one unit is worth). Anything converted on a date — a payment in another
        currency, the late fee when it is charged, the dollar value of a small balance — uses the latest
        dated rate on or before that date, or the standing rate (settings.usdPer) before any.""", [t1], n, copy_note=note)


cp(74, 'dated_rates', """
    Exchange rates move. Let me give the workspace dated rates: from a date, for a currency, the US
    dollars one unit is worth. Whenever something is converted on a date — a payment in another
    currency on its payment date, the late fee on the day it is charged, the dollar value of a small
    balance on the day of the payment — use the latest dated rate on or before that date, or the
    standing rate if there is none yet.
""", s74)

# =============================================================================== cp75 client retention


def s75(n):
    fx1 = dict(asOf=SA, settings={'taxRate': 10}, clients=[dict(A, retentionPct=5)], invoices=[
        I(3, 1, 'SENT', '2026-02-15', '2026-03-31', [L(1, 'Licence', 1, 100)], instalments=3, instalmentRate=0),
        I(5, 1, 'SENT', '2026-02-15', '2026-03-31', [L(2, 'Build', 1, 200)], retentionPct=10)])
    new = plus(fx1, invoices=[I(6, 1, 'DRAFT', SA, '2026-04-30', [L(3, 'Build', 1, 100)], retentionPct=5)])
    dup = plus(fx1, invoices=[I(6, 1, 'DRAFT', SA, '2026-04-30', [L(3, 'Licence', 1, 100)], instalments=3, instalmentRate=0),
                              I(7, 1, 'DRAFT', SA, '2026-04-30', [L(4, 'Build', 1, 200)], retentionPct=10)])
    t1 = T("new invoices start with the client's retention", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Build');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('100');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-retention')).toHaveText('{new:inv6.retention}'); // 5% of 100.00 before tax
""", new=new)
    t2 = T('duplicating keeps the plan and the retention', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-duplicate').click();
        // the copy is issued today, so its instalments fall due on 04-10, 05-10, 06-10
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('{dup:inv6.inst1.due}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('{dup:inv6.inst3.due}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('{dup:inv6.inst3.payment}');
        // a duplicate keeps the invoice's own retention (10%), not the client's 5%
        await page.getByTestId('invoice-row-5').click();
        await page.getByTestId('invoice-duplicate').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
        await expect(page.getByTestId('invoice-retention')).toHaveText('{dup:inv7.retention}'); // 10% of 200.00
""", dup=dup)
    fx3 = dict(asOf=SA, clients=[A])
    add = plus(fx3, clients=[{'id': 2, 'name': 'Initech', 'email': 'ap@initech.example', 'retentionPct': 2.5}])
    add['invoices'] = [I(1, 2, 'DRAFT', SA, '2026-04-30', [L(1, 'Build', 1, 400)], retentionPct=2.5)]
    t3 = T('sets a standard retention when adding a client', '@core', fx3, """
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-retention-pct').fill('2.5');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Build');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('400');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-retention')).toHaveText('{add:inv1.retention}'); // 2.5% of 400.00
""", add=add)
    note = None
    if n >= REV84:
        note = ("UPDATED for cp84 (mutates: [57, 58, 66, 71, 73, 75]): instalments are now rounded up to the "
                "whole dollar, so the duplicated 110.00 plan at 0% is 37.00, 37.00 and 36.00. Carries all "
                "three tests.")
    return Spec('cp75_client_retention', 'standard retention', """
        A client can have a standard retention percentage (clients[].retentionPct, set when adding the
        client): their new invoices start with it. Duplicating an invoice keeps that invoice's own
        retention and instalment plan; the copy's schedule is dated from its new issue date.""", [t1, t2, t3], n,
        copy_note=note)


cp(75, 'client_retention', """
    Let me give a client a standard retention percentage when I add them (0 to 20, up to two
    decimals): their new invoices start with that retention. When I duplicate an invoice, keep that
    invoice's own retention and its instalment plan (the copy's instalments are dated from its new
    issue date), not the client's standard.
""", s75)

# =============================================================================== cp76 REVERSAL: no allocation boxes


def s76(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 120)]),
        I(6, 1, 'SENT', '2026-03-01', '2026-03-31', [L(2, 'Hosting', 1, 50)])],
        payments=[P(1, 1, 150, '2026-03-05', [(5, 100), (6, 30)])])
    a = plus(fx1, payments=[P(2, 1, 40, '2026-03-09', [(6, 20), (5, 20)])])
    t1 = T('invoices no longer have allocation boxes', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-allocate')).toHaveCount(0);
        await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-allocate')).toHaveCount(0);
        // a payment already split over both invoices still shows its part on each
        await page.getByTestId('invoice-row-6').click();
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$30.00');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv6.due}'); // 50.00 - 30.00
        // with no invoice open, a payment is spread automatically: none overdue, so the largest
        // amount due first (20.00 each), each paid off before the next
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('40');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=2 invoice=5 amount=20.00',
          'PAYMENT_RECORDED id=2 invoice=6 amount=20.00',
        ]);
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('{a:inv5.status}');
        await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('{a:inv6.status}');
""", a=a)
    return Spec('cp76_no_allocation_boxes', 'no allocation boxes', """
        The invoice list has no allocation boxes any more: a payment goes to the open invoice, to the
        invoices its references name, or is spread automatically. Payments already split over several
        invoices keep their parts.""", [t1], n)


cp(76, 'no_allocation_boxes', """
    The allocation boxes in the invoice list cause more mistakes than they save. Take them away: a
    payment goes to the open invoice, to the invoices its references name, or is spread automatically,
    as now. Payments already split over several invoices keep their parts and still show them.
""", s76, type_='mutative', mutates=[21, 43], retires=[
    'cp21_split_payment.spec.ts::splits one payment across several invoices',
    "cp21_split_payment.spec.ts::refuses a split that doesn't fit",
    'cp43_minimum_part_payment.spec.ts::each part of a split payment must be at least a tenth'])

# =============================================================================== cp77 references with amounts
FX50 = dict(asOf='2026-04-20', clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Design', 1, 100)]),
    I(7, 1, 'SENT', '2026-02-01', '2026-04-30', [L(2, 'Hosting', 1, 60)]),
    I(12, 1, 'SENT', '2026-01-15', '2026-03-31', [L(3, 'Support', 1, 40)]),
    I(123, 1, 'SENT', '2026-02-01', '2026-04-30', [L(4, 'Training', 1, 30)])])


def s77(n):
    a = plus(FX50, payments=[P(1, 1, 150, '2026-04-20', [(1, 50), (123, 30), (7, 60)])])
    t1 = T('a reference can carry the amount it gets', '@core', FX50, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('150');
        await page.getByTestId('payment-form-date').fill('2026-04-20');
        await page.getByTestId('payment-form-reference').fill('INV-0000018=50, RF16 0000 075, INV-0001230=30');
        await page.getByTestId('payment-form-submit').click();
        // 50.00 to invoice 1 and 30.00 to invoice 123 as stated; the other 70.00 to invoice 7 (60.00),
        // and the last 10.00 is held as credit
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=50.00');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=123 amount=30.00');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=7 amount=60.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=10.00');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('{a:inv7.status}');
        await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('{a:inv123.status}');
        await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('{a:inv12.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}'); // 100.00 - 50.00
""", a=a)
    t2 = T('refuses amounts that do not fit', '@error', FX50, """
        await page.getByTestId('client-row-1').click();
        const attempts = [
          'INV-0000018=80, RF16 0000 075=30',   // 110.00 is more than the 100.00 paid
          'INV-0000018=0, RF16 0000 075',       // an amount must be more than zero
          'RF16 0000 075=61',                   // invoice 7 owes 60.00
          'INV-0000018=9.99',                   // under 10% of invoice 1's 100.00
          'INV-0000018=10.005',                 // three decimals
        ];
        for (const references of attempts) {
          await page.getByTestId('payment-form-amount').fill('100');
          await page.getByTestId('payment-form-date').fill('2026-04-20');
          await page.getByTestId('payment-form-reference').fill(references);
          await page.getByTestId('payment-form-submit').click();
          await expect(page.getByTestId('payment-form-error')).toBeVisible();
        }
        for (const id of [1, 7, 123]) {
          await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Sent');
        }
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
""")
    return Spec('cp77_reference_amounts', 'references with amounts', """
        A reference typed on the payment form may carry an amount after an equals sign
        (INV-0000018=50): that amount goes to that invoice, the rest of the payment goes to the references
        without an amount in the usual order (overdue first, then the largest amount due), and anything
        left is held as credit. Refused when the stated amounts come to more than the payment, or one is
        zero or less, has more than two decimals, is more than that invoice owes, or is below the
        minimum part payment.""", [t1, t2], n)


cp(77, 'reference_amounts', """
    Now the boxes are gone I still need to split a payment my way. When I type references, let each
    one carry an amount after an equals sign, like INV-0000018=50 or RF16 0000 075=40: that amount
    goes to that invoice. The rest of the payment goes to the references without an amount, in the
    usual order, and anything left is held as credit. Refuse it if the amounts come to more than the
    payment, or any amount is zero or less, has more than two decimals, is more than that invoice
    still owes, or is below the minimum part payment.
""", s77)

# =============================================================================== cp78 client grace days


def s78(n):
    B = '360' if n >= 80 else '365'
    fx1 = dict(asOf='2026-04-20', settings=LI, clients=[dict(A, graceDays=0), dict(G, graceDays=21)], invoices=[
        I(1, 1, 'SENT', '2026-03-15', '2026-04-15', [L(1, 'Design', 1, 1000)]),
        I(2, 2, 'SENT', '2026-03-01', '2026-04-01', [L(2, 'Design', 1, 1000)]),
        I(3, 2, 'SENT', '2026-02-25', '2026-03-25', [L(3, 'Design', 1, 1000)])])
    t1 = T("uses each client's own grace period", '@core', fx1, f"""
        // Acme has no grace: due 2026-04-15, overdue since, interest for 5 days: 1,000.00 x ((1 + 0.12/{B})^5 - 1)
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
        await page.getByTestId('client-row-1').click();
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{{s:inv1.status}}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        // Globex has 21 days: invoice 2 (19 days late) is not overdue and earns nothing yet
        await page.getByTestId('client-row-2').click();
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{{s:inv2.status}}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}');
        // invoice 3 (26 days late) is overdue, with interest from 2026-04-15, 21 days after its due date
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{{s:inv3.status}}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv3.interest}}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('{{s:client2.overdue}}');
""")
    fx2 = dict(asOf='2026-04-20', clients=[A])
    t2 = T('sets a grace period when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-grace-days').fill('31');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-form-error')).toBeVisible();
        await page.getByTestId('client-form-grace-days').fill('14');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Initech');
""")
    note = None
    if n >= 80:
        note = ("UPDATED for cp80 (mutates: [63, 65, 66, 68, 70, 78]): late interest now uses an Actual/360 "
                "day count, so the interest on the overdue invoices is higher. Carries both tests.")
    return Spec('cp78_client_grace', "clients' own grace period", """
        A client can have their own grace period in days (clients[].graceDays, 0 to 30, set when adding
        the client) instead of the standard 7: their invoices and instalments become Overdue, start
        earning late interest and are charged the late fee only once that many days have passed since
        the due date.""", [t1, t2], n, copy_note=note)


cp(78, 'client_grace', """
    Let me give a client their own grace period in days (0 to 30) when I add them, instead of the
    standard week. For that client, invoices and instalments become Overdue, start earning late
    interest and are charged the late fee only once that many days have passed since the due date.
""", s78)

# =============================================================================== cp79 refunds in another currency


def s79(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[HV, KK], payments=[
        P(1, 5, 100, '2026-03-01', []), P(2, 3, 10000, '2026-03-01', [])])
    rev = n >= 88
    chf = convert_minor = None
    from acceptance.reference.model import convert as _conv
    chf = _conv(40, 'EUR', 'CHF', fx1['settings'], '2026-03-09', n) / 100
    jpy = _conv(30, 'USD', 'JPY', fx1['settings'], '2026-03-09', n)
    a = plus(fx1, pay=[(1, dict(refunded=chf)), (2, dict(refunded=jpy))])
    t1 = T('refunds credit in another currency', '@core', fx1, f"""
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('refund-form-currency').selectOption('EUR');
        await page.getByTestId('refund-form-amount').fill('40');
        await page.getByTestId('refund-form-date').fill('2026-03-09');
        await page.getByTestId('refund-form-submit').click();
        // 40 x 1.10 / 1.13 = 38.938... {'down' if rev else 'half up'} to CHF 0.05 comes off the CHF 100.00 credit
        await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=1 amount={chf:.2f}');
        await expect(page.getByTestId('client-row-5').getByTestId('client-credit')).toHaveText('{{a:client5.credit}}');
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('refund-form-currency').selectOption('USD');
        await page.getByTestId('refund-form-amount').fill('30');
        await page.getByTestId('refund-form-date').fill('2026-03-09');
        await page.getByTestId('refund-form-submit').click();
        // 30 / 0.0066 = 4,545.45 -> whole yen
        await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=2 amount={jpy}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-credit')).toHaveText('{{a:client3.credit}}');
        // $100 would be 15,152 yen, more than the credit left
        await page.getByTestId('refund-form-amount').fill('100');
        await page.getByTestId('refund-form-submit').click();
        await expect(page.getByTestId('refund-form-error')).toBeVisible();
        await expect(page.getByTestId('client-row-3').getByTestId('client-credit')).toHaveText('{{a:client3.credit}}');
""", a=a)
    note = None
    if rev:
        note = ("UPDATED for cp88 (mutates: [61, 74, 79]): conversions now round down, so €40 takes CHF "
                "38.90 (not 38.95) and $30 takes ¥4,545 as before. Carries the test.")
    return Spec('cp79_foreign_refunds', 'refunds in another currency', f"""
        A refund can be paid out in another currency (the refund form's currency, the client's own by
        default): the amount entered is in that currency and comes off the client's credit converted
        into their currency through US dollars at the rates on the refund date, {'rounded down' if rev else 'rounded half up'} to their
        currency's step; CREDIT_REFUNDED shows the amount in the client's currency. A refund whose
        converted amount is more than the credit is refused.""", [t1], n, copy_note=note)


cp(79, 'foreign_refunds', """
    Let me refund credit in another currency: pick the refund's currency on the refund form (the
    client's own by default). The amount I enter is in that currency; convert it into the client's
    currency through US dollars at the rates on the refund date, rounded to their currency's step, and
    take that off their credit. CREDIT_REFUNDED shows the amount in the client's currency. Refuse it
    when the converted amount is more than their credit.
""", s79)

# =============================================================================== cp80 interest Actual/360


def s80(n):
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-01-15', '2026-02-15', [L(2, 'Build', 1, 2000)])],
        payments=[P(1, 1, 500, '2026-03-17', [(2, 500)])])
    t1 = T('counts interest on a 360-day year', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 53 days from the end of the grace week: 1,000.00 x ((1 + 0.12/360)^53 - 1) (17.57 on 365 days)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        // 2,000.00 for the 23 days to the payment, then what is still owed for the 44 days to today
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""")
    note = None
    if n >= 96:
        note = ("UPDATED for cp96 (mutates: [63, 80, 86]): a payment now pays the invoice before its late "
                "interest, so invoice 2's 500.00 leaves 1,500.00 earning interest from 2026-03-17 and the "
                "interest before it unpaid. Carries the test.")
    return Spec('cp80_interest_360', 'interest on a 360-day year', """
        Late interest (on invoices and on instalments) is compounded daily at the annual rate / 360
        (Actual/360) instead of / 365: a balance B owing for d days earns B x ((1 + rate / 100 / 360)^d
        - 1), rounded half up to the cent. Everything else about it is unchanged.""", [t1], n, copy_note=note)


cp(80, 'interest_360', """
    My bank charges interest on a 360-day year, so I'll do the same. Compound late interest daily at
    the annual rate / 360 instead of / 365 (Actual/360): a balance B owing for d days earns B x ((1 +
    rate / 100 / 360)^d - 1), rounded half up to the cent. This applies to invoices and instalments
    alike; everything else about late interest stays the same.
""", s80, type_='mutative', mutates=[63, 65, 66, 68, 70, 78], algorithm='compound-late-interest-revised',
   copies=['cp63_late_interest', 'cp65_late_fee', 'cp66_instalment_interest', 'cp68_interest_after_grace',
           'cp70_waive_interest', 'cp78_client_grace'])

# =============================================================================== cp81 apply credit now


def s81(n):
    fx1 = dict(asOf='2026-04-20', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 40)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-05-31', [L(2, 'Build', 1, 200)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Training', 1, 150)]),
        I(4, 1, 'DRAFT', '2026-04-01', '2026-05-31', [L(4, 'Extras', 1, 50)])],
        payments=[P(1, 1, 100, '2026-01-10', []), P(2, 1, 120, '2026-02-01', []),
                  P(3, 1, 50, '2026-04-02', [], reference='RF34 0000 042')])
    ref4 = V(fx1, n)['inv4.reference']
    assert ref4 == 'RF34 0000 042', ref4
    D20 = '2026-04-20'
    a = plus(fx1, alloc=[(1, 1, 40, D20), (1, 2, 60, D20), (2, 2, 120, D20)])
    t1 = T('applies unused credit to what the client owes', '@core', fx1, """
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{s:client1.credit}'); // 100 + 120 + 50
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('client-apply-credit').click();
        // oldest credit first, to overdue invoice 1 (40.00), then the largest amount due, invoice 2;
        // payment 3 is held for draft invoice 4 and stays put
        await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
          'PAYMENT_RECORDED id=1 invoice=1 amount=40.00',
          'PAYMENT_RECORDED id=1 invoice=2 amount=60.00',
          'PAYMENT_RECORDED id=2 invoice=2 amount=120.00',
        ]);
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{a:inv2.status}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('{a:inv3.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{a:client1.balance}'); // 20.00 + 150.00 - 50.00
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-paid-date')).toHaveText('{a:inv1.paidDate}');
""", a=a)
    fx2 = dict(asOf='2026-04-20', clients=[A], invoices=[I(5, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 40)])],
               payments=[P(1, 1, 40, '2026-03-05', [(5, 40)])])
    t2 = T('refuses when there is no credit or nothing owed', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('client-apply-credit').click();
        await expect(page.getByTestId('client-apply-credit-error')).toBeVisible();
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
""")
    return Spec('cp81_apply_credit', 'apply credit now', """
        Apply credit (with a client selected) uses the client's unused credit on what they owe now: the
        oldest credit first, to their sent invoices in the payment order (overdue first, oldest due
        date first, then the largest amount due), each paid off before the next, writing PAYMENT_RECORDED
        for each payment and invoice and counting as paid today. Deposits held for a draft are not used.
        It is refused when there is no credit to use or nothing owed.""", [t1, t2], n)


cp(81, 'apply_credit', """
    Give me an Apply credit button for the selected client: use their unused credit on what they owe
    right now, without waiting for the next invoice to be sent. Take the oldest credit first and spread
    it over their sent invoices in the usual payment order (overdue first, oldest due date first, then
    the largest amount due), each paid off before the next, writing PAYMENT_RECORDED for each payment
    and invoice; it counts as paid today. Deposits held for a draft stay put. Refuse it, with a
    message, when there is no credit to use or nothing owed.
""", s81)

# =============================================================================== cp82 exchange difference
FXR = [{'from': '2026-03-01', 'currency': 'EUR', 'usdPer': 1.2}, {'from': '2026-04-01', 'currency': 'EUR', 'usdPer': 1.05}]


def s82(n):
    fx1 = dict(asOf='2026-04-10', settings={'usdPer': RATES, 'fxRates': FXR}, clients=[C(G, currency='EUR')], invoices=[
        I(1, 2, 'SENT', '2026-02-15', '2026-05-31', [L(1, 'Design', 1, 500)]),
        I(2, 2, 'SENT', '2026-03-10', '2026-05-31', [L(2, 'Design', 1, 50)])],
        payments=[P(1, 2, 200, '2026-02-20', [(1, 200)]), P(2, 2, 100, '2026-03-05', [(1, 100)])])
    a = plus(fx1, payments=[P(3, 2, 50, '2026-04-05', [(2, 50)])])
    t1 = T('shows the exchange difference on a foreign invoice', '@core', fx1, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-1').click();
        // issued at $1.10 a euro: €200 paid at 1.10 makes no difference; €100 paid at 1.20 is a $10.00 gain
        await expect(page.getByTestId('invoice-fx-difference')).toHaveText('{s:inv1.fxDiff}');
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('payment-form-amount').fill('50');
        await page.getByTestId('payment-form-date').fill('2026-04-05');
        await page.getByTestId('payment-form-submit').click();
        // issued at 1.20, paid at 1.05: 50 x 1.05 - 50 x 1.20 = -7.50
        await expect(page.getByTestId('invoice-fx-difference')).toHaveText('{a:inv2.fxDiff}');
        await expect.poll(() => auditLines()).toContain('FX_DIFFERENCE id=2 payment=3 amount=-7.50');
""", a=a)
    note = None
    return Spec('cp82_exchange_difference', 'exchange difference', """
        An invoice of a client billed in another currency shows its exchange difference in US dollars:
        for each payment applied to it, the applied amount's dollar value at the rate on the payment date
        minus its dollar value at the rate on the invoice's issue date, each rounded half up to the cent,
        added up (a loss is negative). Recording a payment on such an invoice writes FX_DIFFERENCE
        id=<invoice id> payment=<payment id> amount=<that payment's difference>.""", [t1], n, copy_note=note)


cp(82, 'exchange_difference', """
    For clients billed in another currency, show each invoice's exchange difference in US dollars: for
    every payment applied to it, the applied amount's dollar value at the rate on the payment date
    minus its dollar value at the rate on the invoice's issue date, each rounded half up to the cent,
    added up (a loss shows as negative). When I record a payment on such an invoice, write
    FX_DIFFERENCE id=<invoice id> payment=<payment id> amount=<that payment's difference>.
""", s82)

# =============================================================================== cp83 retention cap


def s83(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 2000)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(2, 'Build', 1, 500)], retentionPct=10, retentionCap=100)])
    r = plus(fx1, inv=[(1, dict(retentionPct=10, retentionCap=150))])
    t1 = T('caps the retention at a maximum amount', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('retention-form-pct').fill('10');
        await page.getByTestId('retention-form-cap').fill('150');
        await page.getByTestId('retention-form-submit').click();
        // 10% of 2,000.00 is 200.00, capped at 150.00
        await expect(page.getByTestId('invoice-retention')).toHaveText('{r:inv1.retention}');
        // a cap above the percentage changes nothing: 10% of 500.00 = 50.00
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-retention')).toHaveText('{s:inv2.retention}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}'); // 500.00 - 50.00
""", r=r)
    return Spec('cp83_retention_cap', 'retention cap', """
        Retention can be capped at a maximum amount (invoices[].retentionCap, entered with the retention
        percentage): the retention is the percentage worked out as usual, but never more than the cap.""",
        [t1], n)


cp(83, 'retention_cap', """
    Let me cap retention at a maximum amount, entered with the retention percentage: the retention is
    worked out as usual but is never more than the cap. Everything that follows from it (the amount
    due, Retention held, the client's balance) uses the capped amount.
""", s83)

# =============================================================================== cp84 annuity revised


def s84(n):
    fx1 = dict(asOf='2026-01-31', clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 2400)])])
    pl = plus(fx1, inv=[(1, dict(instalments=6, instalmentRate=9))])
    t1 = T('rounds the instalment up to a whole dollar', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('6');
        await page.getByTestId('plan-form-rate').fill('9');
        await page.getByTestId('plan-form-submit').click();
        // i = 9 / 12 / 100 = 0.0075; 2,400.00 x 0.0075 / (1 - 1.0075^-6) = 410.5617, rounded up to 411.00;
        // the last instalment pays what is left, so it comes out smaller
""" + inst_rows(pl, 1, (1, 6), 'pl') + """
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{pl:inv1.planTotal}');
""", pl=pl)
    return Spec('cp84_whole_dollar_instalments', 'whole-dollar instalments', """
        The equal monthly instalment of a plan is rounded up to the next whole dollar (whole currency
        unit) instead of half up to the cent; interest is still worked out each month on the balance and
        rounded half up to the cent, and the last instalment still pays whatever is left plus its
        interest, so it comes out smaller and the schedule ends at zero.""", [t1], n)


cp(84, 'whole_dollar_instalments', """
    Clients want round instalments. Round a plan's equal monthly instalment up to the next whole
    dollar (whole unit of the client's currency) instead of to the cent. Interest is still the balance
    x the monthly rate, rounded half up to the cent, and the last instalment still pays whatever is
    left plus its interest, so it comes out smaller and the plan still ends at exactly zero.
""", s84, type_='mutative', mutates=[57, 58, 66, 71, 73, 75], algorithm='annuity-instalments-revised',
   copies=['cp57_instalment_plan', 'cp58_instalment_payments', 'cp66_instalment_interest', 'cp71_plan_payoff',
           'cp73_credit_note_on_plan', 'cp75_client_retention'])

# =============================================================================== cp85 down payment


def s85(n):
    fx1 = dict(asOf='2026-01-31', clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1200)])])
    pl = plus(fx1, inv=[(1, dict(instalments=6, instalmentRate=9, planDownPct=20))])
    t1 = T('takes a down payment before the instalments', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('6');
        await page.getByTestId('plan-form-rate').fill('9');
        await page.getByTestId('plan-form-down').fill('20');
        await page.getByTestId('plan-form-submit').click();
        // 20% of 1,200.00 = 240.00, due on the issue date, with no interest
        await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-due')).toHaveText('{pl:inv1.inst0.due}');
        await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-payment')).toHaveText('{pl:inv1.inst0.payment}');
        await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-balance')).toHaveText('{pl:inv1.inst0.balance}');
        // the other 960.00 over 6 months at 9%: 960.00 x 0.0075 / (1 - 1.0075^-6) = 164.22, rounded up to 165.00
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{pl:inv1.inst1.payment}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('{pl:inv1.inst1.interest}'); // 960.00 x 0.0075
        await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-payment')).toHaveText('{pl:inv1.inst6.payment}');
        await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-balance')).toHaveText('{pl:inv1.inst6.balance}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{pl:inv1.planTotal}');
""", pl=pl)
    fx2 = dict(asOf='2026-02-20', clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Licence', 1, 600)], instalments=3, instalmentRate=0, planDownPct=50)])
    t2 = T('an unpaid down payment falls overdue like an instalment', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        // the 300.00 down payment was due on 2026-02-01, more than 7 days ago
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-status')).toHaveText('{s:inv2.inst0.status}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('{s:inv2.inst1.status}');
""")
    return Spec('cp85_plan_down_payment', 'down payment on a plan', """
        A plan can start with a down payment (invoices[].planDownPct, a percentage from the plan form):
        that percentage of the grand total, rounded down to the cent, is instalment 0, due on the issue
        date with no interest; the instalments are worked out on the rest by the plan's rule. Instalment
        0 is paid first and falls overdue like any instalment.""", [t1, t2], n)


cp(85, 'plan_down_payment', """
    Let me ask for a down payment on an instalment plan: a percentage (0 to 50, up to two decimals) on
    the plan form. That percentage of the grand total, rounded down to the cent, is instalment 0, due
    on the issue date with no interest. The monthly instalments are worked out by the usual rule on
    what is left. Instalment 0 is paid first and falls overdue like any other instalment.
""", s85)

# =============================================================================== cp86 manual write-off


def s86(n):
    B = '360' if n >= 80 else '365'
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(3, 1, 'SENT', '2026-04-01', '2026-05-31', [L(3, 'Design', 1, 100)])],
        payments=[P(1, 1, 400, '2026-03-20', [(1, 400)])])
    w = plus(fx1, inv=[(1, dict(writtenOffOn='2026-04-30'))])
    v = V(fx1, n)
    t1 = T('writes off what is left of an invoice', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        await page.getByTestId('invoice-write-off').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{w:inv1.status}}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{{w:inv1.writtenOff}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{w:inv1.due}}');
        await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount={{w:inv1.writtenOff|plain}}');
        // it no longer counts towards the balance or the overdue amount
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{{w:client1.balance}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{w:client1.overdue}}');
        // and takes no more payments
        await page.getByTestId('payment-form-amount').fill('10');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
""", w=w)
    fx2 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)], writtenOffOn='2026-04-01'),
        I(4, 1, 'DRAFT', '2026-04-01', '2026-05-31', [L(2, 'Design', 1, 100)])])
    t2 = T('a written-off invoice stops earning interest', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // written off on 2026-04-01: interest only for the 24 days from 2026-03-08, 1,000.00 x ((1 + 0.12/{B})^24 - 1)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{{s:inv2.writtenOff}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{s:inv2.status}}');
        // a draft can't be written off
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('invoice-write-off').click();
        await expect(page.getByTestId('invoice-write-off-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
""")
    note = None
    if n >= 96:
        note = ("UPDATED for cp96 (mutates: [63, 80, 86]): a payment now pays the invoice before its late "
                "interest, so the 400.00 leaves 600.00 earning interest from 2026-03-20 and the amount "
                "written off changes. Carries both tests.")
    return Spec('cp86_write_off', 'write off an invoice', """
        The Write off button on a sent invoice with something owed writes off everything still owed on
        it, late charges and retention included (invoices[].writtenOffOn records the day): its status is
        Written off, the panel shows the amount written off, nothing is due, it stops earning interest,
        no longer counts in the client's balance or overdue amount and takes no more payments;
        INVOICE_WRITTEN_OFF id=<id> amount=<amount> is written. Drafts, void invoices and invoices with
        nothing owed can't be written off.""", [t1, t2], n, copy_note=note)


cp(86, 'write_off', """
    Some debts won't be paid. Give me a Write off button on a sent invoice that still has something
    owed: it writes off everything still owed on it, late interest, late fee and retention included,
    and writes INVOICE_WRITTEN_OFF id=<id> amount=<amount>. Its status becomes Written off, the panel
    shows the amount written off, nothing is due, it stops earning interest, no longer counts in the
    client's balance or overdue amount, and takes no more payments. Refuse it, with a message, on a
    draft, a void invoice or one with nothing owed.
""", s86)

# =============================================================================== cp87 client interest rate


def s87(n):
    B = '360' if n >= 80 else '365'
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[dict(A, interestRate=18), dict(G, interestRate=0),
                                                         {'id': 3, 'name': 'Initech', 'email': 'ap@initech.example'}],
               invoices=[I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
                         I(2, 2, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)]),
                         I(3, 3, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)])])
    t1 = T("charges each client's own interest rate", '@core', fx1, f"""
        // all three owe 1,000.00, due 2026-03-01: 53 days of interest from the end of the grace week
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}'); // at 18%: 1,000.00 x ((1 + 0.18/{B})^53 - 1)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv2.interest}}'); // 0%: no interest
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{s:inv2.status}}');
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv3.interest}}'); // the workspace's 12%
""")
    fx2 = dict(asOf='2026-04-30', clients=[A])
    t2 = T('sets an interest rate when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-interest-rate').fill('30.01');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-form-error')).toBeVisible();
        await page.getByTestId('client-form-interest-rate').fill('8.5');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Initech');
""")
    return Spec('cp87_client_interest_rate', "clients' own interest rate", """
        A client can have their own late-interest rate (clients[].interestRate, 0 to 30 with up to two
        decimals, set when adding the client) used instead of the workspace rate; 0 means they are never
        charged late interest. Everything else about late interest is unchanged.""", [t1, t2], n)


cp(87, 'client_interest_rate', """
    Let me give a client their own late-interest rate when I add them (0 to 30, up to two decimals),
    used instead of the workspace's rate for their invoices and instalments; 0 means they are never
    charged late interest.
""", s87)

# =============================================================================== cp88 conversions round down


def s88(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[HV, KK], invoices=[
        I(1, 5, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(2, 3, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Consulting', 1, 20000)])])
    a = plus(fx1, payments=[P(1, 5, 49, '2026-03-09', [(1, 47.65)], currency='EUR')])
    b = plus(a, payments=[P(2, 3, 100, '2026-03-09', [(2, 16666)], currency='EUR')])
    t1 = T('rounds a conversion down to the step', '@core', fx1, """
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('49');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 49 x 1.10 / 1.13 = 47.699: down to CHF 47.65 (half up would give 47.70)
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{a:inv1.paid}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 100 x 1.10 / 0.0066 = 16,666.67: down to 16,666 yen
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-allocated')).toHaveText('{b:inv2.paid}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}');
""", a=a, b=b)
    return Spec('cp88_conversions_round_down', 'conversions round down', """
        Every conversion between currencies (payments and refunds in another currency, the late fee)
        still goes through US dollars, but is rounded down to the target currency's step (whole yen, CHF
        0.05, the cent) instead of half up, so a client is never credited more than was received.""", [t1], n)


cp(88, 'conversions_round_down', """
    I keep losing a fraction on every foreign payment. Round every currency conversion down to the
    target currency's step (whole yen, CHF 0.05, the cent) instead of half up — payments and refunds
    in another currency and the late fee alike — so a client is never credited more than I received.
    Work conversions out exactly, in decimals rather than floating point, so a figure that lands on a
    step stays on it: ¥10,000 at $0.0066 a yen is $66.00, which at $1.10 a euro is exactly €60.00,
    not €59.99.
""", s88, type_='mutative', mutates=[61, 74, 79], algorithm='fx-triangulation-revised',
   copies=['cp61_foreign_payments', 'cp74_dated_rates', 'cp79_foreign_refunds'])

# =============================================================================== cp89 credit a line


def s89(n):
    T10 = {'taxRate': 10}
    fx1 = dict(asOf=SA, settings=T10, clients=[A], invoices=[
        I(9, 1, 'SENT', '2026-03-01', '2026-04-30',
          [L(2, 'Design', 2, 45, discountPct=10), L(3, 'Hosting', 1, 20, taxExempt=True)])])
    a = plus(fx1, invoices=[I(10, 1, 'DRAFT', SA, '2026-04-30',
                              [L(4, 'Design', 2, 45, discountPct=10, creditOfLine=2)], creditOf=9)])
    t1 = T("credits one of an invoice's lines", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-9').click();
        await page.getByTestId('line-row-2').getByTestId('line-credit').click();
        // a draft credit note (invoice 10) with a copy of the line: 2 x 45.00 less its 10% discount, taxed 10%
        await expect(page.getByTestId('invoice-panel-number')).toHaveText('{a:inv10.number}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-description')).toHaveText('Design');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{a:inv10.line4.amount}'); // 90.00 - 9.00
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv10.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv10.grand}');
""", a=a)
    fx2 = dict(asOf=SA, settings=T10, clients=[A], invoices=[
        I(9, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 2, 45), L(3, 'Hosting', 1, 20)]),
        I(10, 1, 'SENT', '2026-03-05', '2026-04-30', [L(4, 'Design', 1, 45, creditOfLine=2)], creditOf=9),
        I(11, 1, 'DRAFT', '2026-03-06', '2026-04-30', [L(5, 'Design', 2, 45, creditOfLine=2)], creditOf=9)])
    t2 = T('cannot credit more of a line than was invoiced', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        // 1 of the 2 Design lines is already credited, so 2 more is too many
        await page.getByTestId('invoice-row-11').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-send-error')).toBeVisible();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
        await page.getByTestId('invoice-row-9').click();
        await expect(page.getByTestId('invoice-credited')).toHaveText('{s:inv9.credited}'); // 45.00 + 4.50 tax
""")
    return Spec('cp89_credit_a_line', 'credit a line', """
        Each line of a sent invoice has a Credit button: it starts a draft credit note for the invoice
        (or adds to the one already in draft) with a copy of the line, its quantity, price, discount,
        tax rate and exemption, marked as crediting that line (lineItems[].creditOfLine). A credit note
        that would credit more of a line than was invoiced, counting issued credit notes, is refused when
        it is issued.""", [t1, t2], n)


cp(89, 'credit_a_line', """
    Give each line of a sent invoice a Credit button: it starts a draft credit note for that invoice,
    or adds to the one already in draft, with a copy of the line (description, quantity, unit price,
    discount, tax rate and exemption), marked as crediting that line. I can then lower the quantity as
    usual. Refuse to issue a credit note that would credit more of a line than was invoiced, counting
    the credit notes already issued.
""", s89)

# =============================================================================== cp90 early discount on credit used at send


def s90(n):
    fx1 = dict(asOf=SA, clients=[EP], invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 300)])],
               payments=[P(1, 1, 500, '2026-02-20', [])])
    a = plus(fx1, inv=[(1, dict(status='SENT', issueDate=SA))], alloc=[(1, 1, 294, SA)])
    t1 = T('credit used on sending settles early with the discount', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-send').click();
        // sent today, inside the early window: 300.00 less 2% (6.00) is all the credit has to pay
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=294.00');
        await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=6.00');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{a:inv1.earlyDiscount}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{a:client1.credit}'); // 500.00 - 294.00
""", a=a)
    return Spec('cp90_early_discount_on_credit', 'early discount on credit used', """
        Credit used on an invoice when it is sent counts as an early payment: for a client with an
        early-payment discount, only the amount that settles it early (the grand total minus the early
        discount) is taken from the credit, and if the credit covers it the invoice is settled with the
        early discount (EARLY_DISCOUNT is written).""", [t1], n)


cp(90, 'early_discount_on_credit', """
    When credit is used on an invoice as it's sent, it should count as paying early. For a client with
    an early-payment discount, only take the amount that settles it early (the grand total minus the
    early discount) from their credit, and when the credit covers that, settle the invoice with the
    early discount exactly as an early payment would.
""", s90)

# =============================================================================== cp91 late fee cap


def s91(n):
    fx1 = dict(asOf='2026-04-30', settings={'usdPer': RATES, 'lateFee': 25}, clients=[A, HV], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)]),
        I(3, 5, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Design', 1, 150)])])
    pct = n >= 100
    t1 = T('never charges a late fee of more than a tenth of the invoice', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // {'2% of 100.00 = 2.00, at least $10.00; ' if pct else 'the $25.00 fee is '}more than 10% of 100.00: capped at 10.00
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv1.lateFee}}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv2.lateFee}}'); // {'2% of 1,000.00 = 20.00' if pct else 'under 10% of 1,000.00'}
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-3').click();
        // {'$10.00 = 10 / 1.13 = 8.849, down to CHF 8.80' if pct else 'CHF 22.10'} against 10% of CHF 150.00 = 15.00
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv3.lateFee}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv3.due}}');
""")
    note = None
    if pct:
        note = ("UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed with a "
                "$10.00 minimum, so the 1,000.00 invoice is charged 20.00 and the franc invoice CHF 8.80; the "
                "10% cap still holds the 100.00 invoice to 10.00. Carries the test.")
    return Spec('cp91_late_fee_cap', 'late fee cap', """
        A late fee is never more than 10% of the invoice's grand total, rounded down to the cent: a
        larger fee is capped at that.""", [t1], n, copy_note=note)


cp(91, 'late_fee_cap', """
    A late fee shouldn't dwarf a small invoice. Never charge a late fee of more than 10% of the
    invoice's grand total (rounded down to the cent); cap it there.
""", s91)

# =============================================================================== cp92 write-off threshold


def s92(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 500)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 50)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 300)])])
    a = plus(fx1, payments=[P(1, 1, 498.50, '2026-03-09', [(1, 498.50)]), P(2, 1, 49.50, '2026-03-09', [(2, 49.50)]),
                            P(3, 1, 297.50, '2026-03-09', [(3, 297.50)])])
    t1 = T('writes off less than $2.00 that is no more than 1% of the total', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        const pays = [['1', '498.50'], ['2', '49.50'], ['3', '297.50']];
        for (const [id, amount] of pays) {
          await page.getByTestId(`invoice-row-${id}`).click();
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-03-09');
          await page.getByTestId('payment-form-submit').click();
        }
        // 1.50 left of 500.00: under $2.00 and 0.3% of the total, written off
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv1.writtenOff}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        // 0.50 left of 50.00 is 1%: written off
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv2.writtenOff}');
        // 2.50 left of 300.00 is $2.00 or more: it stays due
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv3.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv3.status}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
          'INVOICE_WRITTEN_OFF id=1 amount=1.50',
          'INVOICE_WRITTEN_OFF id=2 amount=0.50',
        ]);
""", a=a)
    fx2 = dict(asOf=SA, clients=[A], invoices=[I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 60)])])
    b = plus(fx2, payments=[P(1, 1, 59.30, '2026-03-09', [(4, 59.30)])])
    t2 = T('keeps a small balance that is more than 1% of the total', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-4').click();
        await page.getByTestId('payment-form-amount').fill('59.30');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 0.70 left is under $1.00, but more than 1% of 60.00 (0.60): it stays due
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv4.due}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{b:inv4.writtenOff}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv4.status}');
""", b=b)
    return Spec('cp92_write_off_threshold', 'small balance write-off', """
        After a payment, what is left on an invoice is written off only when it is worth less than $2.00
        at the workspace rates and is no more than 1% of the invoice's grand total; otherwise it stays
        due.""", [t1, t2], n)


cp(92, 'write_off_threshold', """
    Change when a small balance is written off after a payment: only when what is left is worth less
    than $2.00 (at the workspace rates) and is no more than 1% of the invoice's grand total. Anything
    else stays due, however small.
""", s92, type_='mutative', mutates=[15, 40, 59], copies=['cp59_client_currency'],
   retires=['cp40_write_off_small_balance.spec.ts::a dollar or more stays due'])

# =============================================================================== cp93 partial retention release


def s93(n):
    fx1 = dict(asOf=SA, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Build', 1, 1000)], retentionPct=10)],
        payments=[P(1, 1, 900, '2026-02-20', [(1, 900)])])
    r = plus(fx1, inv=[(1, dict(retentionReleasedOn=SA, retentionReleasedAmount=40))])
    t1 = T('releases part of the retention', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await page.getByTestId('retention-release-amount').fill('40');
        await page.getByTestId('invoice-release-retention').click();
        // 40.00 of the 100.00 is released and due; 60.00 stays held
        await expect.poll(() => auditLines()).toContain('RETENTION_RELEASED id=1 amount=40.00');
        await expect(page.getByTestId('invoice-retention')).toHaveText('{r:inv1.retention}');
        await expect(page.getByTestId('invoice-retention-held')).toHaveText('{r:inv1.retentionHeld}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{r:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{r:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{r:client1.balance}'); // 40.00 + 60.00
""", r=r)
    fx2 = dict(asOf=SA, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Build', 1, 1000)], retentionPct=10,
          retentionReleasedOn='2026-03-01', retentionReleasedAmount=30)],
        payments=[P(1, 1, 930, '2026-02-20', [(2, 930)])])
    t2 = T('refuses to release more than is still held', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // 30.00 of the 100.00 was released (and has been paid); 70.00 is still held
        await expect(page.getByTestId('invoice-retention-held')).toHaveText('{s:inv2.retentionHeld}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        for (const amount of ['70.01', '0', '10.005']) {
          await page.getByTestId('retention-release-amount').fill(amount);
          await page.getByTestId('invoice-release-retention').click();
          await expect(page.getByTestId('invoice-release-error')).toBeVisible();
        }
        await expect(page.getByTestId('invoice-retention-held')).toHaveText('{s:inv2.retentionHeld}');
        expect(auditLines().filter((l) => l.startsWith('RETENTION_RELEASED'))).toEqual([]);
""")
    return Spec('cp93_partial_retention_release', 'release part of the retention', """
        Part of the retention can be released: an amount entered with the Release retention button
        (empty releases all that is held). What has been released (invoices[].retentionReleasedAmount)
        becomes due 30 days after the latest release; the rest stays held. The panel shows the retention
        still held, and RETENTION_RELEASED shows the amount released. An amount of zero or less, with more
        than two decimals, or more than is held is refused.""", [t1, t2], n)


cp(93, 'partial_retention_release', """
    Let me release only part of the retention: an amount next to the Release retention button (left
    empty, it releases everything still held). What has been released is added to the amount due and
    falls due 30 days after the latest release; the rest stays held. Show the retention still held on
    the invoice, and write the amount released in RETENTION_RELEASED. Refuse an amount of zero or
    less, with more than two decimals, or more than is still held. A release recorded before now
    without an amount released everything that was held.
""", s93)

# =============================================================================== cp94 minimum instalment


def s94(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[A, C(G, currency='EUR'), KK], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Licence', 1, 100)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Licence', 1, 100)]),
        I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Licence', 1, 20000)])])
    ok = plus(fx1, inv=[(2, dict(instalments=4, instalmentRate=0))])
    t1 = T('refuses a plan whose instalment is worth under $25', '@error', fx1, """
        // 100.00 over 6 at 0%: 16.67, rounded up to 17.00, worth under $25
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('6');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('plan-form-error')).toBeVisible();
        // €100.00 over 4: €25.00, worth 25 x 1.10 = $27.50
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('plan-form-count').fill('4');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{ok:inv2.inst1.payment}');
        // 20,000 yen over 6: 3,334 yen, worth 3,334 x 0.0066 = $22.00
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('plan-form-count').fill('6');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('plan-form-error')).toBeVisible();
        await expect(page.getByTestId(/^instalment-row-\\d+$/)).toHaveCount(0);
""", ok=ok)
    return Spec('cp94_minimum_instalment', 'minimum instalment', """
        A plan is refused when its monthly instalment would be worth less than $25.00 at today's rates.""", [t1], n)


cp(94, 'minimum_instalment', """
    Small instalments cost more to chase than they bring in. Refuse a plan whose monthly instalment
    would be worth less than $25.00 at today's exchange rates, with a message.
""", s94)

# =============================================================================== cp95 late fee on instalments


def s95(n):
    fx1 = dict(asOf='2026-04-30', settings={'lateFee': 25}, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = num(V(fx1, n)['inv1.inst1.payment'])
    fx1['payments'] = [P(1, 1, first, '2026-02-27', [(1, first)])]
    owe = num(V(fx1, n)['client1.overdue'])
    a = plus(fx1, payments=[P(2, 1, owe, '2026-04-30', [(1, owe)])])
    pct = n >= 100
    t1 = T('charges the late fee on an overdue instalment', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // instalment 2 (due 2026-03-31) is overdue: {'2% of it, at least $10.00' if pct else 'the $25.00 fee'}, no more than 10% of the instalment
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-fee')).toHaveText('{{s:inv1.inst2.fee}}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-late-fee')).toHaveText('{{s:inv1.inst3.fee}}');
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv1.lateFee}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
        await page.getByTestId('payment-form-amount').fill('{{s:client1.overdue|plain}}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{{a:inv1.inst2.status}}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');
""", a=a)
    note = None
    if pct:
        note = ("UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed with a "
                "$10.00 minimum, so the overdue 341.00 instalment is charged 10.00 instead of 25.00. Carries "
                "the test.")
    return Spec('cp95_instalment_late_fee', 'late fee on instalments', f"""
        Planned invoices are charged the late fee too: once per instalment, when it becomes Overdue,
        never more than 10% of that instalment. Each instalment row shows its late fee; the invoice's late
        fee is their total, part of the amount due and the client's overdue amount, and a payment pays an
        instalment's {'own amount first, then its fee, then its interest' if n >= 96 else 'fee first, then its interest, then the instalment'}.""", [t1], n, copy_note=note)


cp(95, 'instalment_late_fee', """
    Charge the late fee on planned invoices too: once for each instalment, when it becomes Overdue,
    never more than 10% of that instalment's amount. Show each instalment's late fee; the invoice's
    late fee is their total and is part of the amount due and the client's overdue amount. A payment
    pays an instalment's fee first, then its late interest, then the instalment.
""", s95)

# =============================================================================== cp96 application order


def s96(n):
    st = {'lateInterestRate': 12, 'lateFee': 25}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-15', '2026-02-15', [L(1, 'Build', 1, 2000)])],
        payments=[P(1, 1, 500, '2026-03-17', [(1, 500)])])
    t1 = T('a payment pays the invoice before its late charges', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the 500.00 paid on 2026-03-17 all went to the 2,000.00, leaving 1,500.00 to earn interest
        // from then; the {'40.00 fee (2% of 2,000.00)' if n >= 100 else '25.00 fee'} and the interest to 2026-03-17 are still unpaid
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{{s:inv1.lateFee}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv1.interest}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{s:inv1.due}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
""")
    note = None
    if n >= 100:
        note = ("UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed, so "
                "the 2,000.00 invoice is charged 40.00 instead of 25.00. Carries the test.")
    return Spec('cp96_invoice_before_charges', 'invoice paid before late charges', """
        A payment now pays what the invoice (or instalment) itself still owes first, then its late fee,
        then its late interest, so less of the invoice is left earning interest.""", [t1], n, copy_note=note)


cp(96, 'invoice_before_charges', """
    Change the order a payment is used in on an invoice with late charges: pay off what the invoice
    (or instalment) itself still owes first, then the late fee, then the late interest, so that less
    of it is left earning interest.
""", s96, type_='mutative', mutates=[63, 80, 86], copies=['cp63_late_interest', 'cp80_interest_360', 'cp86_write_off'])

# =============================================================================== cp97 credit notes in interest periods


def s97(n):
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-04-01', '2026-04-30', [L(2, 'Build', 1, 200)], creditOf=1)])
    t1 = T('a credit note cuts the interest only from its issue date', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 1,000.00 from 2026-03-08 to the credit note on 2026-04-01 (24 days), then 800.00 to today (29 days)
        await expect(page.getByTestId('invoice-credited')).toHaveText('{s:inv1.credited}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
""")
    return Spec('cp97_credit_note_interest', 'credit notes and late interest', """
        A credit note on an invoice earning late interest reduces what the invoice owes from the credit
        note's issue date: the interest periods are split there too, and interest before that date is
        worked out on the amount owed before the credit.""", [t1], n)


cp(97, 'credit_note_interest', """
    A credit note shouldn't wipe out interest that was already running. When an invoice earning late
    interest is credited, count the credit only from the credit note's issue date: split the interest
    periods there too, so interest before that date is still worked out on what was owed before the
    credit.
""", s97)

# =============================================================================== cp98 interest on released retention


def s98(n):
    fx1 = dict(asOf='2026-04-30', settings=LI, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-05', '2026-01-31', [L(1, 'Build', 1, 1000)], retentionPct=10,
          retentionReleasedOn='2026-02-10')],
        payments=[P(1, 1, 900, '2026-01-20', [(1, 900)])])
    t1 = T('released retention earns interest once overdue', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the 100.00 released on 2026-02-10 was due 2026-03-12; from the end of its grace week
        // (2026-03-19) to today is 42 days: 100.00 x ((1 + 0.12/360)^42 - 1)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""")
    return Spec('cp98_retention_interest', 'interest on released retention', """
        Released retention that is still unpaid once it is overdue (more than the grace period past its
        due date, 30 days after release) earns late interest by the same rule as an invoice, from the end
        of its grace period.""", [t1], n)


cp(98, 'retention_interest', """
    Released retention that clients sit on should earn late interest like anything else. Once released
    retention is overdue (more than the grace period past its due date, 30 days after it was
    released) and still unpaid, charge late interest on it by the usual rule, from the end of its
    grace period.
""", s98)

# =============================================================================== cp99 instalment holiday


def s99(n):
    fx1 = dict(asOf='2026-02-15', clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    sk = plus(fx1, inv=[(1, dict(skippedInstalment=1))])
    t1 = T('skips an instalment and spreads it over the rest', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('instalment-row-1').getByTestId('instalment-skip').click();
        await expect.poll(() => auditLines()).toContain('INSTALMENT_SKIPPED id=1 instalment=1');
        // instalment 1 pays only its interest (1,000.00 x 0.01 = 10.00); the 1,000.00 is re-spread over
        // the 2 left: 1,000.00 x 0.01 / (1 - 1.01^-2) = 507.51, rounded up to 508.00
""" + inst_rows(sk, 1, (1, 2, 3), 'sk') + """
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{sk:inv1.planTotal}');
""", sk=sk)
    fx2 = dict(asOf='2026-04-10', clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12),
        I(3, 1, 'SENT', '2026-03-31', '2026-04-30', [L(2, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12,
          skippedInstalment=1)])
    t2 = T('refuses to skip an overdue or the last instalment', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // instalment 1 (due 2026-02-28) is overdue; instalment 3 is the last
        for (const k of [1, 3]) {
          await page.getByTestId(`instalment-row-${k}`).getByTestId('instalment-skip').click();
          await expect(page.getByTestId('instalment-skip-error')).toBeVisible();
        }
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{s:inv2.planTotal}');
        expect(auditLines().filter((l) => l.startsWith('INSTALMENT_SKIPPED'))).toEqual([]);
        // invoice 3 already skipped instalment 1: it pays only its interest, and 2 and 3 are re-spread
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('{s:inv3.inst1.principal}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{s:inv3.inst1.payment}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('{s:inv3.inst2.payment}');
""")
    return Spec('cp99_instalment_holiday', 'instalment holiday', """
        An unpaid instalment that is not yet overdue and not the last can be skipped
        (invoices[].skippedInstalment): it pays only its interest, its principal stays owed, and the
        instalments after it are worked out again by the plan's rule on that balance over the instalments
        left, keeping their due dates. INSTALMENT_SKIPPED id=<invoice id> instalment=<number> is written.
        Skipping an overdue, paid or last instalment is refused.""", [t1, t2], n)


cp(99, 'instalment_holiday', """
    Let a client skip one instalment. A Skip button on an unpaid instalment that isn't overdue or the
    last one turns it into an interest-only payment (its interest as usual, no principal) and works
    the instalments after it out again by the plan's rule, from the balance still owed over the
    instalments left, keeping their due dates. Write INSTALMENT_SKIPPED id=<invoice id>
    instalment=<number>. Refuse to skip an overdue, paid or last instalment.
""", s99)

# =============================================================================== cp100 late fee as a percentage


def s100(n):
    fx1 = dict(asOf='2026-04-30', settings={'usdPer': RATES, 'lateFee': 25}, clients=[A, KK], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 2000)]),
        I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Design', 1, 300)]),
        I(3, 3, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Consulting', 1, 50000)])])
    t1 = T('charges 2% of what is owed, at least $10.00', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{s:inv1.lateFee}'); // 2% of 2,000.00
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{s:inv2.lateFee}'); // 2% of 300.00 = 6.00, at least 10.00
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        // 2% of 50,000 yen is 1,000; $10.00 is 10 / 0.0066 = 1,515.15, down to 1,515 yen
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveText('{s:inv3.lateFee}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('{s:client3.overdue}');
""")
    return Spec('cp100_late_fee_percentage', 'late fee as a percentage', """
        The late fee is now 2% of what is owed when it is charged (the invoice's or instalment's unpaid
        amount, before late charges), rounded down to the cent, but at least $10.00 converted to the
        client's currency, and still never more than 10% of the invoice's grand total (or the
        instalment).""", [t1], n)


cp(100, 'late_fee_percentage', """
    A flat late fee is too much on small invoices and too little on big ones. Make the late fee 2% of
    what is owed when it's charged (the unpaid amount of the invoice or instalment, before any late
    charges), rounded down to the cent, but at least $10.00 (converted to the client's currency as
    usual), and still never more than 10% of the invoice's grand total, or of the instalment. The
    late fee setting stays as the switch: with a late fee set, charge this percentage fee whatever
    amount it holds; with none set, charge no late fee, as now.
""", s100, type_='mutative', mutates=[65, 70, 91, 95, 96], copies=['cp65_late_fee', 'cp70_waive_interest',
                                                                  'cp91_late_fee_cap', 'cp95_instalment_late_fee',
                                                                  'cp96_invoice_before_charges'])
