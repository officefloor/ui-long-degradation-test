"""Earlier specs updated at Act III mutations."""
from lib3 import *  # noqa
from cps3 import RATES, HV, KK, IN  # noqa

# ------------------------------------------------------------------------- cp104 early discount before tax
copy_note(104, 'cp62_early_payment_discount',
          "UPDATED for cp104 (mutates: [62]): the early discount is now worked out on the amount before tax, so "
          "the 1,122.33 invoice (1,234.56 with tax) settles early with 22.44 off instead of 24.69. Carries all "
          "three tests.",
          reps=[("// 1,122.33 + 112.23 tax = 1,234.56; 2% = 24.6912, rounded down to 24.69; issued 2026-03-01,",
                 "// 1,122.33 + 112.23 tax = 1,234.56; 2% of the 1,122.33 before tax = 22.4466, rounded down to\n"
                 "    // 22.44; issued 2026-03-01,"),
                ("(the percentage of the grand total, rounded down to the cent)",
                 "(the percentage of the amount before tax, rounded down to the cent)")])

# ------------------------------------------------------------------------- cp108 exempt clients and line rates
text_copy(108, 'cp49_tax_exempt_client',
          "UPDATED for cp108 (mutates: [49]): a tax-exempt client now still pays a line's own tax rate, so the "
          "5% handbook line is taxed 2.50 and the grand total is $152.50. Carries both tests.",
          reps=[("// A client can be tax exempt (clients[].taxExempt, ticked when adding the client): their invoices\n"
                 "// charge no tax on any line, whatever the line's own rate.",
                 "// A client can be tax exempt (clients[].taxExempt, ticked when adding the client): their invoices\n"
                 "// charge no general tax, but a line with its own tax rate is still taxed at that rate."),
                ("    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.00');\n"
                 "    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');\n"
                 "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$150.00'); // 100.00 + 50.00",
                 "    // the handbook keeps its own 5%: 5% of 50.00\n"
                 "    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$2.50');\n"
                 "    await expect(page.getByTestId('invoice-tax')).toHaveText('$2.50');\n"
                 "    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$152.50'); // 100.00 + 50.00 + 2.50")],
          reg=lambda carried: carried)

# ------------------------------------------------------------------------- cp116 tax per rate
FX72 = dict(asOf='2026-03-10', settings={'taxRate': 10}, clients=[A], invoices=[
    I(7, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Book', 1, 22.5, taxRate=5), L(2, 'Design', 1, 20.05)])])


def t72():
    return [T('rounds each rate on its own', '@core', FX72, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-7').click();
        // 5% of 22.50 = 1.125 -> 1.13 and 10% of 20.05 = 2.005 -> 2.01: 3.14, not 3.13
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{s:inv7.line1.tax}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('{s:inv7.line2.tax}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv7.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv7.grand}');
""")]


text_copy(116, 'cp72_tax_rounded_once',
          "UPDATED for cp116 (mutates: [72, 101, 106]): the tax is now rounded once per rate, not once over the "
          "invoice; both tests' figures still hold, and a new test shows a 5% line and a 10% line coming to "
          "1.13 + 2.01 = 3.14 where a single rounding gave 3.13. Carries both tests.",
          reps=[("// The invoice's tax is worked out once: every line's exact tax (its rate on its amount minus its\n"
                 "// discount share, unrounded) is added up and the total rounded half up to the cent. Each line shows\n"
                 "// its share of that tax,",
                 "// The invoice's tax is worked out once per rate: the exact taxes (rate on amount minus discount\n"
                 "// share, unrounded) of the lines at each rate are added up and rounded half up to the cent, and the\n"
                 "// invoice tax is the total over the rates. Each line shows its share of its\n// rate's tax,"),
                ("// exact: 5% of 10.10 = 0.505, 10% of 20.05 = 2.005, 10% of 0.15 = 0.015; total 2.525 -> 2.53",
                 "// 5% of 10.10 = 0.505 -> 0.51; 10% of 20.05 = 2.005 plus 10% of 0.15 = 0.015 is 2.02; 2.53")],
          add_ts=t72)

# ------------------------------------------------------------------------- cp128 no more late fees
import re as _re  # noqa: E402

M128 = "UPDATED for cp128 (mutates: [65, 70, 91, 95, 96, 100]): late fees are no longer charged and their figures are gone; "


def strip_fee(fx):
    f = copy.deepcopy(fx)
    s = f.get('settings')
    if s and 'lateFee' in s:
        s.pop('lateFee')
        if not s:
            f.pop('settings')
    return f


def no_fee_reg(carried):
    out = []
    for x in carried:
        x = dict(x, fx=strip_fee(x['fx']),
                 checks=[c for c in x['checks'] if 'lateFee' not in c and not c.endswith('.fee')])
        out.append(x)
    return out


FEE_LINE = _re.compile(r"(await expect\(page\.getByTestId\('[^']+'\)(?:\.getByTestId\('[^']+'\))?)\)\.toHaveText\('[^']*'\);[^\n]*")


def fee_lines(text):
    """Late-fee assertions become 'gone' assertions."""
    out = []
    for line in text.split('\n'):
        if "late-fee')" in line and 'toHaveText' in line:
            line = FEE_LINE.sub(lambda m: m.group(1) + ').toHaveCount(0);', line)
        out.append(line)
    return '\n'.join(out)


RATES_TS = "usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 }"
FX65 = dict(asOf='2026-04-30', settings={'usdPer': RATES, 'lateInterestRate': 12}, clients=[A, HV], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
    I(2, 5, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 500)])])


def t65():
    a = plus(FX65, payments=[P(1, 1, 30, '2026-04-30', [(1, 30)])])
    return [T('charges interest but no late fee once an invoice is overdue', '@core', FX65, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // overdue since 2026-03-09: interest on the 1,000.00, and no fee
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        // a 30.00 payment pays the invoice first: 30.00 less is owed
        await page.getByTestId('payment-form-amount').fill('30');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv2.due}');
        await expect(page.getByTestId('client-row-5').getByTestId('client-overdue')).toHaveText('{a:client5.overdue}');
""", a=a)]


text_copy(128, 'cp65_late_fee',
          M128 + "the overdue-invoice test is replaced by one charging only interest (1,000.00 + 17.82 due), and "
          "the grace-week test now checks that no fee appears. Carries the grace-week test.",
          reps=[("// A late fee of 2% of what is owed (at least $10.00, at most 10% of the grand total) is charged\n"
                 "// once on an invoice when it becomes Overdue, if something is still owed then; for a client billed\n"
                 "// in another currency it is converted through US dollars to their currency's step. The panel shows\n"
                 "// the fee charged ($0.00 when none); it is part of the amount due, the balance and the overdue\n"
                 "// amount, earns no interest, and a payment pays it after the invoice itself and before the\n"
                 "// interest. Nothing is charged when the invoice is paid within the week's grace; planned invoices\n"
                 "// are not charged it.",
                 "// No late fee is charged on an overdue invoice: the panel shows no late fee, and what is due is the\n"
                 "// invoice plus its late interest, the invoice paid first."),
                ("      settings: { lateFee: 25 },\n", "")],
          retire=['charges a late fee once an invoice is overdue'], add_ts=t65, reg=no_fee_reg)
POSTS[128] = [fee_lines]

FX70 = dict(asOf='2026-04-30', settings={'lateInterestRate': 12}, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
    I(3, 1, 'SENT', '2026-04-01', '2026-05-31', [L(3, 'Design', 1, 100)])])


def t70():
    w = plus(FX70, inv=[(1, dict(interestWaivedOn='2026-04-30'))])
    return [T('waives the late interest charged so far', '@core', FX70, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await page.getByTestId('invoice-waive').click();
        // the interest so far is written off; the 1,000.00 is still overdue
        await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount={w:inv1.waived|plain}');
        await expect(page.getByTestId('invoice-waived')).toHaveText('{w:inv1.waived}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{w:inv1.interest}');
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{w:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{w:inv1.status}');
        // nothing to waive on an invoice that isn't overdue
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-waive').click();
        await expect(page.getByTestId('invoice-waive-error')).toBeVisible();
""", w=w)]


_v70 = V(strip_fee(dict(asOf='2026-04-30', settings={'lateInterestRate': 12, 'lateFee': 25}, clients=[A], invoices=[
    I(2, 1, 'SENT', '2026-01-01', '2026-02-01', [L(1, 'Build', 1, 1000)], interestWaivedOn='2026-03-31')])), 128)
text_copy(128, 'cp70_waive_interest',
          M128 + "waiving writes off the late interest alone, so the first test is replaced by one waiving only the "
          "17.82 of interest, and the second waives 17.14 of interest instead of 37.14 with the fee. Carries the "
          "second test.",
          reps=[("// The Waive button on an overdue invoice writes off the late interest and late fee still unpaid on\n"
                 "// it (invoices[].interestWaivedOn records the day), writing INTEREST_WAIVED id=<id>\n"
                 "// amount=<amount>; the panel shows the total waived. Interest then starts again from that day on\n"
                 "// what is still owed, and no new fee is charged.",
                 "// The Waive button on an overdue invoice writes off the late interest still unpaid on it\n"
                 "// (invoices[].interestWaivedOn records the day), writing INTEREST_WAIVED id=<id> amount=<amount>;\n"
                 "// the panel shows the total waived. Interest then starts again from that day on what is still\n"
                 "// owed."),
                ("      settings: { lateInterestRate: 12, lateFee: 25 },\n", "      settings: { lateInterestRate: 12 },\n"),
                ("    // waived on 2026-03-31: since then 30 days on the 1,000.00 still owed, and no second fee\n",
                 "    // waived on 2026-03-31: since then 30 days on the 1,000.00 still owed\n"),
                ("    await expect(page.getByTestId('invoice-waived')).toHaveText('$37.14');",
                 f"    await expect(page.getByTestId('invoice-waived')).toHaveText('{_v70['inv2.waived']}');")],
          retire=['waives the late interest and fee charged so far'], add_ts=t70, reg=no_fee_reg)

FX91 = dict(asOf='2026-04-30', settings={'usdPer': RATES}, clients=[A, HV], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)]),
    I(3, 5, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Design', 1, 150)])])


def t91():
    return [T('charges no late fee on an overdue invoice', '@core', FX91, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv1.status}');
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv3.due}');
""")]


text_copy(128, 'cp91_late_fee_cap',
          M128 + "with no fee there is nothing to cap, so the cap test is replaced by one checking that the three "
          "overdue invoices carry no fee and owe only their totals.",
          reps=[("// A late fee is never more than 10% of the invoice's grand total, rounded down to the cent: a\n"
                 "// larger fee is capped at that.",
                 "// No late fee is charged, however large or small the overdue invoice: it owes its total and any\n"
                 "// late interest only.")],
          retire=['never charges a late fee of more than a tenth of the invoice'], add_ts=t91, reg=no_fee_reg)

FX95 = dict(asOf='2026-04-30', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)],
    payments=[P(1, 1, 341, '2026-02-27', [(1, 341)])])


def t95():
    a = plus(FX95, payments=[P(2, 1, 341, '2026-04-30', [(1, 341)])])
    return [T('charges no late fee on an overdue instalment', '@core', FX95, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // instalment 2 (due 2026-03-31) is overdue, with no fee
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{s:inv1.inst2.status}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        await page.getByTestId('payment-form-amount').fill('{s:client1.overdue|plain}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{a:inv1.inst2.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
""", a=a)]


text_copy(128, 'cp95_instalment_late_fee',
          M128 + "the overdue instalment is no longer charged a fee, so the test is replaced by one where 341.00 "
          "clears the overdue instalment.",
          reps=[("// Planned invoices are charged the late fee too: once per instalment, when it becomes Overdue,\n"
                 "// never more than 10% of that instalment. Each instalment row shows its late fee; the invoice's\n"
                 "// late fee is their total, part of the amount due and the client's overdue amount, and a payment\n"
                 "// pays an instalment's own amount first, then its fee, then its interest.",
                 "// An overdue instalment is charged no late fee: neither the instalment rows nor the panel show one,\n"
                 "// and the client's overdue amount is the overdue instalments with their late interest.")],
          retire=['charges the late fee on an overdue instalment'], add_ts=t95, reg=no_fee_reg)

_v96 = V(dict(asOf='2026-04-30', settings={'lateInterestRate': 12}, clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-01-15', '2026-02-15', [L(1, 'Build', 1, 2000)])],
    payments=[P(1, 1, 500, '2026-03-17', [(1, 500)])]), 128)
text_copy(128, 'cp96_invoice_before_charges',
          M128 + "the 2,000.00 invoice is no longer charged its 40.00 fee, so 1,500.00 and the interest are due. "
          "Carries the test.",
          reps=[("// A payment now pays what the invoice (or instalment) itself still owes first, then its late fee,\n"
                 "// then its late interest, so less of the invoice is left earning interest.",
                 "// A payment pays what the invoice (or instalment) itself still owes first, then its late interest,\n"
                 "// so less of the invoice is left earning interest."),
                ("      settings: { lateInterestRate: 12, lateFee: 25 },\n", "      settings: { lateInterestRate: 12 },\n"),
                ("    // from then; the 40.00 fee (2% of 2,000.00) and the interest to 2026-03-17 are still unpaid\n",
                 "    // from then; the interest to 2026-03-17 is still unpaid, and there is no fee\n"),
                ("toHaveText('$1,577.55');", f"toHaveText('{_v96['inv1.due']}');")],
          reg=no_fee_reg)

FX100 = dict(asOf='2026-04-30', settings={'usdPer': RATES}, clients=[A, KK], invoices=[
    I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 2000)]),
    I(2, 1, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Design', 1, 300)]),
    I(3, 3, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Consulting', 1, 50000)])])


def t100():
    return [T('charges no late fee, however much is owed', '@core', FX100, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('{s:client3.overdue}');
""")]


text_copy(128, 'cp100_late_fee_percentage',
          M128 + "the 2% fee test is replaced by one checking that overdue invoices of 2,000.00, 300.00 and 50,000 "
          "yen owe only their totals.",
          reps=[("// The late fee is now 2% of what is owed when it is charged (the invoice's or instalment's unpaid\n"
                 "// amount, before late charges), rounded down to the cent, but at least $10.00 converted to the\n"
                 "// client's currency, and still never more than 10% of the invoice's grand total (or the\n"
                 "// instalment).",
                 "// No late fee is charged on an overdue invoice, whatever it owes: the panel shows none and the\n"
                 "// overdue amount is what the invoice itself owes.")],
          retire=['charges 2% of what is owed, at least $10.00'], add_ts=t100, reg=no_fee_reg)

# ------------------------------------------------------------------------- cp132 rate-card lines take no invoice discount
M132 = "UPDATED for cp132 (mutates: [103, 105, 121, 127]): the invoice discount is now worked out on lines not priced from a rate card or the price list only, so "
copy_note(132, 'cp103_rate_card', M132 + "the 5% comes off the 120.40 travel line alone (6.02) instead of the whole "
          "2,056.90. Carries both tests.",
          reps=[("toHaveText('$6.02'); // 5% of 2,056.90, rounded down",
                 "toHaveText('$6.02'); // 5% of the 120.40 travel line, the only one not from the card")])
copy_note(132, 'cp105_tiered_rates', M132 + "the invoice's 5% has nothing to come off: every line is priced from the "
          "card. Carries both tests.",
          reps=[("toHaveText('$0.00'); // 5%, rounded down",
                 "toHaveText('$0.00'); // every line is priced from the card: nothing to take 5% off"),
                ("// 8.875% after the discount, rounded once", "// 8.875%, rounded once")])
copy_note(132, 'cp121_overtime', M132 + "the 5% comes off the 50.00 typed-in support line only (2.50) instead of all "
          "450.00. Carries the test.",
          reps=[("toHaveText('$2.50'); // 5% of 450.00", "toHaveText('$2.50'); // 5% of the 50.00 support line, the only one not from the card")])
copy_note(132, 'cp127_unit_type_tax_rate', M132 + "the 4% discount no longer applies: every line of the invoice is priced "
          "from the card. Carries the test.")

# ------------------------------------------------------------------------- cp136 minimum part payment of what is due
FX43 = dict(asOf='2026-03-10', clients=[A], invoices=[I(4, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 200)])],
            payments=[P(1, 1, 150, '2026-03-02', [(4, 150)])])


def t43():
    a = plus(FX43, payments=[P(2, 1, 5, '2026-03-09', [(4, 5)])])
    return [T('a part payment must be a tenth of what is still due', '@error', FX43, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-4').click();
        // 50.00 is still due, so the minimum is 5.00 (a tenth of the 200.00 total would be 20.00)
        await page.getByTestId('payment-form-amount').fill('4.99');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await page.getByTestId('payment-form-amount').fill('5');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv4.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv4.status}');
""", a=a)]


text_copy(136, 'cp43_minimum_part_payment',
          "UPDATED for cp136 (mutates: [43]): the minimum part payment is now 10% of the amount still due "
          "rather than of the grand total; the first test's invoice is unpaid, so 22.00 is still its "
          "minimum, and a new test accepts 5.00 against 50.00 still due on a 200.00 invoice. Carries both "
          "tests.",
          reps=[("// A part payment on an invoice must be at least 10% of its grand total, unless it settles the\n",
                 "// A part payment on an invoice must be at least 10% of its amount due, unless it settles the\n"),
                ("    // 10% of 220.00 = 22.00\n", "    // nothing paid yet: 10% of the 220.00 due = 22.00\n")],
          add_ts=t43)

# ------------------------------------------------------------------------- cp140 write off only under five cents
M140 = "UPDATED for cp140 (mutates: [40, 43, 61, 92]): a small balance is now written off only when it is worth less than $0.05 (and at most 1% of the total); "
FX40b = dict(asOf='2026-03-10', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 100)])])


def t40b():
    a = plus(FX40b, payments=[P(1, 1, 99.96, '2026-03-09', [(1, 99.96)])])
    return [T('writes off less than five cents left due', '@core', FX40b, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{s:inv1.writtenOff}');
        await page.getByTestId('payment-form-amount').fill('99.96');
        await page.getByTestId('payment-form-date').fill('2026-03-09');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-paid')).toHaveText('{a:inv1.paid}');
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv1.writtenOff}'); // 100.00 - 99.96
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount=0.04');
""", a=a)]


text_copy(140, 'cp40_write_off_small_balance',
          M140 + "0.60 left of 100.00 now stays due, so that test is replaced by one leaving 0.04. Carries the 1.50 "
          "test.",
          reps=[("// When payments leave less than $2.00 due on an invoice and it is no more than 1% of the grand\n"
                 "// total, the rest is written off:",
                 "// When payments leave less than $0.05 due on an invoice and it is no more than 1% of the grand\n"
                 "// total, the rest is written off:"),
                ("// total, the rest is written off: the invoice is Paid, its amount due is $0.00 and the panel shows the amount written off ($0.00 when nothing is).",
                 "// total, the rest is written off: the invoice is Paid, its amount due is $0.00 and the panel shows\n"
                 "// the amount written off ($0.00 when nothing is)."),
                ("    // 1.50 left is under $2.00 but 1.5% of the 100.00 total\n",
                 "    // 1.50 left is not under $0.05: it stays due\n")],
          retire=['writes off less than a dollar left due'], add_ts=t40b)

_v43 = V(plus(dict(asOf='2026-03-10', clients=[A], invoices=[
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
    I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 100)])],
    payments=[P(1, 1, 95, '2026-03-02', [(2, 95)]), P(2, 1, 90, '2026-03-02', [(3, 90)])]),
    payments=[P(3, 1, 9.5, '2026-03-09', [(3, 9.5)])]), 140)
text_copy(140, 'cp43_minimum_part_payment',
          M140 + "the 9.50 paid against 10.00 due no longer settles invoice 3 by writing off 0.50; it is a part "
          "payment (at least a tenth of what is due) leaving 0.50 due. Carries all three tests.",
          reps=[("(including leaving less than $1.00, which is written off)",
                 "(including leaving less than $0.05, which is written off)"),
                ("    // 9.50 is under the 10.00 minimum but leaves 0.50, which is written off\n",
                 "    // 9.50 is at least a tenth of the 10.00 due; it leaves 0.50, which is too much to write off\n"),
                ("    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.50');\n"
                 "    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');\n"
                 "    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');\n  });\n\n"
                 "  test('a part payment must be a tenth",
                 f"    await expect(page.getByTestId('invoice-written-off')).toHaveText('{_v43['inv3.writtenOff']}');\n"
                 f"    await expect(page.getByTestId('invoice-amount-due')).toHaveText('{_v43['inv3.due']}');\n"
                 f"    await expect(page.getByTestId('invoice-panel-status')).toHaveText('{_v43['inv3.status']}');\n  }});\n\n"
                 "  test('a part payment must be a tenth")])

copy_note(140, 'cp61_foreign_payments',
          M140 + "the CHF 0.05 left after the euro payment is worth about $0.06, so it now stays due and the "
          "invoice is Part paid. Carries both tests.",
          reps=[("    // CHF 0.05 left, worth about $0.06: written off\n",
                 "    // CHF 0.05 left is worth about $0.06, not under $0.05: it stays due\n")])

FX92 = dict(asOf='2026-03-10', clients=[A], invoices=[
    I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 500)]),
    I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 50)])])


def t92():
    a = plus(FX92, payments=[P(1, 1, 499.97, '2026-03-09', [(1, 499.97)]), P(2, 1, 49.5, '2026-03-09', [(2, 49.5)])])
    return [T('writes off less than five cents that is no more than 1% of the total', '@core', FX92, """
        await page.getByTestId('client-row-1').click();
        const pays = [['1', '499.97'], ['2', '49.50']];
        for (const [id, amount] of pays) {
          await page.getByTestId(`invoice-row-${id}`).click();
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-03-09');
          await page.getByTestId('payment-form-submit').click();
        }
        // 0.03 left of 500.00: written off
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv1.writtenOff}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        // 0.50 left of 50.00 is 1%, but not under $0.05: it stays due
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv2.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv2.status}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
          'INVOICE_WRITTEN_OFF id=1 amount=0.03',
        ]);
""", a=a)]


text_copy(140, 'cp92_write_off_threshold',
          M140 + "the test writing off 1.50 and 0.50 is replaced by one writing off 0.03 and keeping 0.50 due. "
          "Carries the 0.70 test.",
          reps=[("// After a payment, what is left on an invoice is written off only when it is worth less than $2.00\n",
                 "// After a payment, what is left on an invoice is written off only when it is worth less than $0.05\n"),
                ("    // 0.70 left is under $1.00, but more than 1% of 60.00 (0.60): it stays due\n",
                 "    // 0.70 left is not under $0.05 (and more than 1% of 60.00): it stays due\n")],
          retire=['writes off less than $2.00 that is no more than 1% of the total'], add_ts=t92)

# ------------------------------------------------------------------------- cp144 drafts at today's rates
M144 = "UPDATED for cp144 (mutates: [115, 131, 135]): a draft is now priced and taxed as of today, whatever its date, so "
copy_note(144, 'cp115_dated_tax_rates', M144 + "the March-dated draft is already taxed at New York's new 9.25% "
          "(92.50) before it is sent. Carries the test.",
          reps=[("    // issued in March, before New York's rate went up to 9.25% on 2026-04-01: 8.875%\n",
                 "    // dated in March, but a draft is taxed at today's rate: New York's 9.25% since 2026-04-01\n"),
                ("    // sending makes it issued today, so the new rate applies: 9.25% of 1,000.00\n",
                 "    // sending makes it issued today: still 9.25% of 1,000.00\n")])
copy_note(144, 'cp131_dated_rates', M144 + "the March-dated draft already shows the April rates (210.00 and "
          "252.00) before it is sent. Carries the test.",
          reps=[("    // issued on 2026-03-20, before the new rates of 2026-04-01: 2 x 95.00, and 10 x 20.00 + 2 x 15.00\n",
                 "    // dated 2026-03-20, but a draft is priced at today's rates: 2 x 105.00, and 10 x 22.00 + 2 x 16.00\n"),
                ("    // sent today, 2026-04-10: 2 x 105.00, and 10 x 22.00 + 2 x 16.00\n",
                 "    // sent today, 2026-04-10: the same rates, now kept\n")])
copy_note(144, 'cp135_exemption_expiry', M144 + "the March-dated draft is already taxed (45.00) because the exemption "
          "ended before today. Carries both tests.",
          reps=[("    // issued 2026-03-20, inside the exemption: only the wine's own 12.5% (5.00)\n",
                 "    // dated 2026-03-20, but a draft is taxed as of today, after the exemption ended: 10% and 12.5%\n"),
                ("    // issued today, after the exemption ended on 2026-03-31: 10% on the catering, 12.5% on the wine\n",
                 "    // issued today: still 10% on the catering and 12.5% on the wine\n")])
