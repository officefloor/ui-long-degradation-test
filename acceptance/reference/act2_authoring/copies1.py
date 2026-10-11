"""Act I specs' updated copies at Act II mutations."""
from lib import *  # noqa
from act1copies import act1

SA = '2026-03-10'

# ------------------------------------------------------------------------- cp52 overpayment credit
act1(52, 'cp17_payment_validation',
     "UPDATED for cp52 (mutates: [17, 22, 37, 50]): a payment for more than the amount due is no longer "
     "refused (the rest is held as client credit), so 150.01 against the 150.00 due is dropped from the "
     "refused attempts. Carries all three tests.",
     reps=[("      ['150.01', '2026-03-05'],   // a cent more than the 150.00 due\n", ''),
           ("// payments); the amount must be more than zero, have at most two decimals and be no more than the\n"
            "// amount due; the date",
            "// payments); the amount must be more than zero and have at most two decimals (anything beyond the\n"
            "// amount due is held as credit); the date")])

FX22 = dict(asOf=SA, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-10', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-01-20', '2026-05-31', [L(2, 'Hosting', 1, 80)]),
    I(3, 1, 'SENT', '2026-02-10', '2026-03-31', [L(3, 'Support', 1, 50)]),
    I(4, 1, 'DRAFT', '2026-01-05', '2026-02-28', [L(4, 'Extras', 1, 40)])])


def t22_credit():
    over = plus(FX22, payments=[P(1, 1, 250, '2026-03-09', [(3, 50), (1, 100), (2, 80)])])
    return [T('holds what is paid beyond everything owed as credit', '@core', FX22, """
        await page.getByTestId('client-row-1').click();
        // owed: 100.00 + 80.00 + 50.00 = 230.00 (the draft does not count)
        await page.getByTestId('payment-form-amount').fill('250');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        for (const id of [1, 2, 3]) {
          await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Paid');
        }
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('{over:inv4.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 250.00 - 230.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{over:client1.credit}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{over:client1.balance}');
    """, over=over)]


act1(52, 'cp22_auto_allocation',
     "UPDATED for cp52 (mutates: [17, 22, 37, 50]): a payment bigger than everything the client owes is no "
     "longer refused; the rest is held as credit, so the refusal test is replaced by one paying 250.00 "
     "against 230.00 owed. Carries the allocation test.",
     reps=[("in full before the next. A payment bigger than everything the client owes is refused.",
            "in full before the next. Whatever is paid beyond everything the client owes is held as credit\n"
            "// (CREDIT_HELD payment=<id> amount=<amount>).")],
     retire=['refuses more than the client owes'], add_ts=t22_credit)

FX37 = dict(asOf=SA, clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
    I(12, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 80)]),
    I(7, 2, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Audit', 1, 60)])])


def t37():
    over = plus(FX37, payments=[P(1, 1, 100, '2026-03-09', [(12, 80)], reference='RF24 0000 125')])
    return [T('refuses a mistyped or foreign reference', '@error', FX37, """
        await page.getByTestId('client-row-1').click();
        const attempts = [
          ['50', 'RF24 0000 152'],    // fails the mod-97 check
          ['50', 'RF16 0000 075'],    // valid, but Globex's invoice 7
        ];
        for (const [amount, reference] of attempts) {
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-03-09');
          await page.getByTestId('payment-form-reference').fill(reference);
          await page.getByTestId('payment-form-submit').click();
          await expect(page.getByTestId('payment-form-error')).toBeVisible();
        }
        await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('{s:inv12.status}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{s:inv1.status}');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
    """), T('keeps what a reference payment overpays as credit', '@core', FX37, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-reference').fill('RF24 0000 125'); // invoice 12, 80.00 due
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('{over:inv12.status}');
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{over:inv1.status}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=12 amount=80.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 100.00 - 80.00
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{over:client1.credit}');
    """, over=over)]


act1(52, 'cp37_pay_by_reference',
     "UPDATED for cp52 (mutates: [17, 22, 37, 50]): paying more than the named invoice owes is no longer "
     "refused; the rest is held as credit, so the refusal test keeps only the mistyped and foreign "
     "references and a new test pays 100.00 against 80.00 due. Carries the first test.",
     reps=[("// mistyped, is not one of this client's invoices, or the amount is more than that invoice's amount\n// due.",
            "// mistyped or is not one of this client's invoices; anything paid beyond that invoice's amount due is\n"
            "// held as credit.")],
     retire=['refuses a reference that is mistyped, foreign or overpaid'], add_ts=t37)

FX50 = dict(asOf='2026-04-20', clients=[A, G], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-05-31', [L(1, 'Design', 1, 100)]),
    I(7, 1, 'SENT', '2026-02-01', '2026-04-30', [L(2, 'Hosting', 1, 60)]),
    I(12, 1, 'SENT', '2026-01-15', '2026-03-31', [L(3, 'Support', 1, 40)]),
    I(123, 1, 'SENT', '2026-02-01', '2026-04-30', [L(4, 'Training', 1, 30)]),
    I(58, 2, 'SENT', '2026-02-01', '2026-04-30', [L(5, 'Audit', 1, 10)])])


def t50():
    over = plus(FX50, payments=[P(1, 1, 200, '2026-04-20', [(7, 60), (123, 30), (1, 100)])])
    return [T('refuses a wrong reference and keeps an overpayment as credit', '@core', FX50, """
        await page.getByTestId('client-row-1').click();
        const attempts = [
          ['100', 'INV-0000018, INV-0000019'],            // 1's check digit is 8
          ['100', 'INV-0000018, INV-0000588'],            // invoice 58 is Globex's
        ];
        for (const [amount, references] of attempts) {
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-04-20');
          await page.getByTestId('payment-form-reference').fill(references);
          await page.getByTestId('payment-form-submit').click();
          await expect(page.getByTestId('payment-form-error')).toBeVisible();
        }
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);

        // they owe 100 + 60 + 30 = 190.00 on the three named invoices; the other 10.00 is held
        await page.getByTestId('payment-form-amount').fill('200');
        await page.getByTestId('payment-form-date').fill('2026-04-20');
        await page.getByTestId('payment-form-reference').fill('INV-0000018, RF16 0000 075, INV-0001230');
        await page.getByTestId('payment-form-submit').click();
        for (const id of [1, 7, 123]) {
          await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Paid');
        }
        await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('{over:inv12.status}');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=10.00');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{over:client1.credit}');
    """, over=over)]


act1(52, 'cp50_several_references',
     "UPDATED for cp52 (mutates: [17, 22, 37, 50]): a payment for more than the named invoices owe is no "
     "longer refused; the rest is held as credit, so the refusal test keeps the wrong references and then "
     "pays 200.00 against 190.00 owed. Carries the first test.",
     reps=[("It is refused if any\n// reference is mistyped or not one of the selected client's invoices, or if the payment is more than\n"
            "// those invoices owe together.",
            "It is refused if any\n// reference is mistyped or not one of the selected client's invoices; anything paid beyond what\n"
            "// those invoices owe together is held as credit.")],
     retire=['refuses the payment if any reference is wrong or it is too much'], add_ts=t50)

# ------------------------------------------------------------------------- cp64 allocation priority
PRI = ("overdue invoices first (oldest due date first, lower id on the same date), then the rest from the\n"
       "// largest amount due to the smallest (lower id on the same amount), each paid off in full before the\n// next.")


def _realloc(title, allocs, swap=None):
    def f(carried):
        out = []
        for x in carried:
            x = dict(x)
            if x['title'] == title:
                fx = copy.deepcopy(x['fx'])
                fx['payments'][-1]['allocations'] = [dict(invoiceId=i, amount=a) for i, a in allocs]
                x['fx'] = fx
                if swap:
                    x['checks'] = [swap.get(c, c) for c in x['checks']]
            out.append(x)
        return out
    return f


import copy  # noqa: E402

act1(64, 'cp22_auto_allocation',
     "UPDATED for cp64 (mutates: [22, 24, 50]): automatic payments now pay overdue invoices first, then "
     "the largest amount due, so with none overdue the 150.00 pays invoice 1 (100.00) and 50.00 of "
     "invoice 2 (80.00), leaving invoice 3 untouched. Carries both tests.",
     reps=[("invoices automatically: earliest due date first (lower id first on the same date), each paid off\n"
            "// in full before the next.",
            "invoices automatically: " + PRI),
           ("    // Invoice 3 (due 03-31) takes 50.00, then invoice 1 (due 04-30) its 100.00; invoice 2 (issued\n"
            "    // first but due 05-31) and the draft are untouched.",
            "    // None is overdue yet: invoice 1 (100.00, the largest) is paid off, then invoice 2 (80.00) takes\n"
            "    // the last 50.00; invoice 3 (50.00) and the draft are untouched."),
           ("getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid')",
            "getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent')"),
           ("getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent')",
            "getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid')"),
           ("'PAYMENT_RECORDED id=1 invoice=3 amount=50.00'", "'PAYMENT_RECORDED id=1 invoice=2 amount=50.00'")],
     reg=_realloc('applies a payment to the oldest invoices first', [(1, 100), (2, 50)]))

act1(64, 'cp24_allocate_by_due_date',
     "UPDATED for cp64 (mutates: [22, 24, 50]): after the overdue invoices, a payment now goes to the "
     "largest amount due first, so after overdue invoice 4 the 150.00 pays invoice 1 (100.00) and then "
     "invoice 2 (60.00, the next largest) its last 20.00, leaving invoice 3 untouched. Carries the test.",
     reps=[("// An automatically applied payment pays the invoices with the earliest due date first (lower id\n"
            "// first on the same due date), so overdue invoices are cleared before ones not yet due.",
            "// An automatically applied payment pays the " + PRI),
           ("    // Overdue invoice 4 (due 03-31) takes 30.00, invoice 1 (04-30, lower id) 100.00, invoice 3\n"
            "    // (04-30) the last 20.00; invoice 2 is issued first but due last, so it gets nothing.",
            "    // Overdue invoice 4 (due 03-31) takes 30.00; then by amount due, invoice 1 (100.00) 100.00 and\n"
            "    // invoice 2 (60.00) the last 20.00; invoice 3 (40.00) gets nothing."),
           ("      'PAYMENT_RECORDED id=1 invoice=3 amount=20.00',", "      'PAYMENT_RECORDED id=1 invoice=2 amount=20.00',"),
           ("getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Part paid')",
            "getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent')"),
           ("getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent')",
            "getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid')"),
           ("    await page.getByTestId('invoice-row-3').click();\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$20.00'); // 40.00 - 20.00",
            "    await page.getByTestId('invoice-row-2').click();\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 60.00 - 20.00")],
     reg=_realloc('applies a payment to the earliest due date first', [(4, 30), (1, 100), (2, 20)],
                  swap={'inv3.due': 'inv2.due'}))

act1(64, 'cp50_several_references',
     "UPDATED for cp64 (mutates: [22, 24, 50]): named invoices are now paid overdue first, then largest "
     "amount due first, so the 120.00 pays invoice 1 (100.00) and 20.00 of invoice 7, leaving invoice "
     "123 untouched. Carries both tests.",
     reps=[("The payment is applied to just those invoices, earliest due\n"
            "// date first (lower id on the same date), each paid off before the next.",
            "The payment is applied to just those invoices: overdue ones\n"
            "// first (oldest due date first), then the largest amount due first (lower id on the same amount),\n"
            "// each paid off before the next."),
           ("    // 7 (due 04-30) takes 60.00, 123 (04-30, higher id) 30.00, 1 (05-31) the last 30.00\n"
            "    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([\n"
            "      'PAYMENT_RECORDED id=1 invoice=7 amount=60.00',\n"
            "      'PAYMENT_RECORDED id=1 invoice=123 amount=30.00',\n"
            "      'PAYMENT_RECORDED id=1 invoice=1 amount=30.00',\n"
            "    ]);",
            "    // none of the three is overdue: 1 (100.00, the largest) takes 100.00, then 7 (60.00) the last\n"
            "    // 20.00; 123 (30.00) gets nothing\n"
            "    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([\n"
            "      'PAYMENT_RECORDED id=1 invoice=1 amount=100.00',\n"
            "      'PAYMENT_RECORDED id=1 invoice=7 amount=20.00',\n"
            "    ]);"),
           ("getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Paid')",
            "getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Part paid')"),
           ("getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Paid')",
            "getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Sent')"),
           ("getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid')",
            "getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid')"),
           ("    await page.getByTestId('invoice-row-1').click();\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$70.00'); // 100.00 - 30.00",
            "    await page.getByTestId('invoice-row-7').click();\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 60.00 - 20.00")],
     reg=_realloc('applies one payment to the invoices its references name', [(1, 100), (7, 20)],
                  swap={'inv1.due': 'inv7.due'}))

# ------------------------------------------------------------------------- cp72 tax rounded once
TAXRULE = ("the invoice tax is the lines' exact taxes added up and rounded once, half up to the cent; each line\n"
           "// shows its share of it, split in proportion to the exact taxes by largest remainder.")
M72 = "UPDATED for cp72 (mutates: [14, 19, 20, 29]): the invoice tax is now rounded once on the exact line taxes and shared over the lines, so "

act1(72, 'cp20_line_tax', M72 + "the three 0.335 taxes come to $1.01 (0.34, 0.34, 0.33) instead of $1.02, and the discounted "
     "invoice's 4.275 + 5.225 to $9.50 (4.27 + 5.23). Carries both tests.",
     reps=[("// Tax is worked out line by line: each taxable line's tax is the rate on its amount minus its\n"
            "// discount share, rounded half up to the cent, shown on the line (exempt lines show $0.00). The\n"
            "// invoice tax is the sum of the line taxes.",
            "// Each taxable line's exact tax is the rate on its amount minus its discount share; " + TAXRULE +
            "\n// Exempt lines show $0.00."),
           ("    for (const id of [1, 2, 3]) {\n"
            "      // 10% of 3.35 = 0.335 -> 0.34\n"
            "      await expect(page.getByTestId(`line-row-${id}`).getByTestId('line-tax')).toHaveText('$0.34');\n"
            "    }\n",
            "    // 3 x 0.335 = 1.005 -> 1.01, shared 33 cents each and the 2 left over to the lower ids\n"
            "    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.34');\n"
            "    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.34');\n"
            "    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.33');\n"),
           ("    // 3 x 0.34 = 1.02 (one rounding of 10% of 10.05 would give 1.01)\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.02');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$16.07'); // 3 x 3.35 + 5.00 = 15.05 + 1.02",
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.01');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$16.06'); // 3 x 3.35 + 5.00 = 15.05 + 1.01"),
           ("toHaveText('$4.28'); // 10% of 42.75 = 4.275 -> 4.28",
            "toHaveText('$4.27'); // 4.275 of the 9.50: 427.5 cents -> 427"),
           ("toHaveText('$5.23'); // 10% of 52.25 = 5.225 -> 5.23",
            "toHaveText('$5.23'); // 522.5 -> 522, plus the spare cent (tied fractions, larger exact tax)"),
           ("toHaveText('$9.51'); // 4.28 + 5.23 (10% of 95.00 would be 9.50)",
            "toHaveText('$9.50'); // 4.275 + 5.225 = 9.50 exactly"),
           ("toHaveText('$104.51'); // 100.00 - 5.00 + 9.51", "toHaveText('$104.50'); // 100.00 - 5.00 + 9.50")])

act1(72, 'cp14_tax_exempt_lines', M72 + "the two 12.25 lines are taxed 1.225 + 1.225 = $2.45 instead of 1.23 + 1.23 = "
     "$2.46. Carries both tests; the exempt-line figures are unchanged.",
     reps=[("each taxable line's tax is the workspace rate on its amount minus its share\n"
            "// of the discount, rounded half up to the cent, and the invoice tax adds them up.",
            "each taxable line's exact tax is the workspace rate on its amount minus its\n"
            "// share of the discount; " + TAXRULE),
           ("    // 10% of 12.25 = 1.225 -> 1.23 per line; 1.23 + 1.23 = 2.46\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.46');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$26.96'); // 24.50 + 2.46",
            "    // 10% of 12.25 = 1.225 per line; 1.225 + 1.225 = 2.45, rounded once\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.45');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$26.95'); // 24.50 + 2.45"),
           ("    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.46');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$34.46'); // 32.00 + 2.46",
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.45');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$34.45'); // 32.00 + 2.45")])

act1(72, 'cp19_line_discount', M72 + "7.655 + 1.346 = 9.001 comes to $9.00 (grand total $99.01) instead of 7.66 + 1.35 = "
     "$9.01. Carries both tests; the line through the form has no tax.",
     reps=[("    // per line: 10% of 76.55 = 7.655 -> 7.66; 10% of 13.46 = 1.346 -> 1.35; 7.66 + 1.35 = 9.01\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.01');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$99.02'); // 100.01 - 10.00 + 9.01",
            "    // 10% of 76.55 = 7.655 plus 10% of 13.46 = 1.346 is 9.001, rounded once to 9.00\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.00');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$99.01'); // 100.01 - 10.00 + 9.00")])

act1(72, 'cp29_discount_cap', M72 + "28.125 + 9.375 comes to $37.50 (grand total $412.50) instead of 28.13 + 9.38 = $37.51. "
     "Carries all four tests.",
     reps=[("    // 10% of 281.25 = 28.125 -> 28.13; 10% of 93.75 = 9.375 -> 9.38; 28.13 + 9.38 = 37.51\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$37.51');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$412.51'); // 400.00 - 25.00 + 37.51",
            "    // 10% of 281.25 = 28.125 plus 10% of 93.75 = 9.375 is 37.50 exactly, rounded once\n"
            "    await expect(page.getByTestId('invoice-tax')).toHaveText('$37.50');\n"
            "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$412.50'); // 400.00 - 25.00 + 37.50")])

# ------------------------------------------------------------------------- cp76 no allocation boxes
act1(76, 'cp21_split_payment',
     "UPDATED for cp76 (mutates: [21, 43]): the allocation boxes are gone, so the two tests that split a "
     "payment through them are retired. Carries the test of a payment already split over two invoices.",
     reps=[("// One payment can be spread over several of the selected client's invoices: every sent invoice in\n"
            "// the list has an allocate box (drafts have none). When any box is filled, the payment is recorded\n"
            "// against those invoices instead of the open one. The amounts must add up exactly to the payment,\n"
            "// and each must be more than zero and no more than that invoice's amount due, or the payment is\n"
            "// refused with an error. One PAYMENT_RECORDED line is written per invoice, with the amount applied\n"
            "// to it, and each invoice's panel shows how much of the payment went to it.",
            "// A payment already spread over several of the client's invoices (payments[].allocations) shows, in\n"
            "// each invoice's panel, the whole payment and how much of it went to that invoice.")],
     retire=['splits one payment across several invoices', "refuses a split that doesn't fit"])

act1(76, 'cp43_minimum_part_payment',
     "UPDATED for cp76 (mutates: [21, 43]): payments can no longer be split over allocation boxes, so the "
     "test of a split's parts is retired. Carries the other two tests.",
     reps=[("This applies to a payment\n// against the open invoice, to each amount of a split payment and to a payment by reference;\n",
            "This applies to a payment\n// against the open invoice and to a payment by reference;\n")],
     retire=['each part of a split payment must be at least a tenth'])

# ------------------------------------------------------------------------- cp92 write-off threshold
act1(92, 'cp15_record_payment',
     "UPDATED for cp92 (mutates: [15, 40, 59]): a small balance is now written off only when it is under "
     "$2.00 and no more than 1% of the grand total, so 0.60 left of 55.00 (more than 0.55) stays due: "
     "Part paid with $0.60 due. Carries both tests.",
     reps=[("less than $1.00 left is written off", "a rest under $2.00 and at most 1% of the total is written off"),
           ("    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.60'); // 55.00 - 54.40, under $1.00\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');\n"
            "    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');",
            "    // 55.00 - 54.40 = 0.60 left: more than 1% of 55.00 (0.55), so it stays due\n"
            "    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');\n"
            "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.60');\n"
            "    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');")])

FX40 = dict(asOf=SA, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 100)])])


def t40():
    b = plus(FX40, payments=[P(1, 1, 98.50, '2026-03-09', [(2, 98.50)])])
    return [T('more than 1% of the total stays due', '@core', FX40, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('payment-form-amount').fill('98.50');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        // 1.50 left is under $2.00 but 1.5% of the 100.00 total
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{b:inv2.writtenOff}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv2.status}');
        expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
    """, b=b)]


act1(92, 'cp40_write_off_small_balance',
     "UPDATED for cp92 (mutates: [15, 40, 59]): a small balance is now written off only when it is under "
     "$2.00 and no more than 1% of the grand total, so exactly 1.00 left of 100.00 would now be written "
     "off; that test is replaced by one leaving 1.50 (1.5%), which stays due. Carries the 0.60 test.",
     reps=[("// When payments leave less than $1.00 due on an invoice, the rest is written off: the invoice is\n"
            "// Paid, its amount due is $0.00",
            "// When payments leave less than $2.00 due on an invoice and it is no more than 1% of the grand\n"
            "// total, the rest is written off: the invoice is Paid, its amount due is $0.00")],
     retire=['a dollar or more stays due'], add_ts=t40)
