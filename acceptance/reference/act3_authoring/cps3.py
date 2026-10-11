"""Act III checkpoints."""
from lib3 import *  # noqa
from cps import inst_rows  # noqa

SA = '2026-03-10'
RT = {'taxRate': 10, 'regionTaxRates': {'NY': 8.875, 'CA': 7.25, 'OR': 0}}
IN = {'id': 3, 'name': 'Initech', 'email': 'ap@initech.example'}
RATES = {'EUR': 1.1, 'GBP': 1.25, 'JPY': 0.0066, 'CHF': 1.13}
KK = {'id': 3, 'name': 'Kaisha KK', 'email': 'ap@kaisha.example', 'currency': 'JPY'}
HV = {'id': 5, 'name': 'Helvetia AG', 'email': 'ap@helvetia.example', 'currency': 'CHF'}


def tax_lines(label, inv, ids):
    return '\n'.join(f"        await expect(page.getByTestId('line-row-{i}').getByTestId('line-tax')).toHaveText('{{{label}:inv{inv}.line{i}.tax}}');"
                     for i in ids)


def pay_applied(fx, pmt, inv_id, n):
    """fx plus pmt, all of what it can pay off (after card surcharge and conversion fee) applied to inv_id."""
    f = plus(fx, payments=[pmt])
    amt = num(V(f, n)[f"pay{pmt['id']}.applied"])
    f['payments'][-1]['allocations'] = [dict(invoiceId=inv_id, amount=amt)]
    return f


# =============================================================================== cp101 region tax


def s101(n):
    fx1 = dict(asOf=SA, settings=RT, clients=[C(A, region='NY'), C(G, region='OR'), C(IN, region='TX')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Design', 3, 33.35), L(2, 'Hosting', 1, 19.99), L(3, 'Handbook', 2, 12.5, taxRate=5)], discountPct=10),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 3, 33.35), L(5, 'Handbook', 2, 12.5, taxRate=5)]),
        I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(6, 'Design', 3, 33.35)])])
    if n >= 116:
        once = ("Per rate, 9.58855 at 8.875%\n        // rounds to 9.59 and 1.125 at 5% to 1.13: 10.72")
    else:
        once = "10.7135625 rounds once to 10.71"
    t1 = T("taxes each client's invoices at their region's rate", '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // New York, 8.875%: 8.875% of 90.05 (100.05 less its 10.00 share of the discount) = 7.9919375,
        // of 17.99 = 1.5966125; the handbook keeps its own 5%: 1.125. {once}
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv1.tax}}');
""" + tax_lines('s', 1, (1, 2, 3)) + f"""
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv1.grand}}'); // 145.04 - 14.50 + {'10.72' if n >= 116 else '10.71'}
        // Oregon charges no tax; the handbook's own rate still applies
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('{{s:inv2.line4.tax}}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv2.tax}}'); // 5% of 25.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv2.grand}}');
        // Texas has no rate listed: the workspace's 10%
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv3.tax}}'); // 10% of 100.05 = 10.005
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv3.grand}}');
""")
    fx2 = dict(asOf=SA, settings=RT, clients=[A], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 49.99)])])
    new = plus(fx2, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', region='CA')],
               invoices=[I(2, 2, 'DRAFT', SA, '2026-04-30', [L(2, 'Design', 2, 49.99)])])
    t2 = T('adds a client with a region', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-region').fill('CA');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('2');
        await page.getByTestId('line-form-unit-price').fill('49.99');
        await page.getByTestId('line-form-submit').click();
        // California, 7.25% of 99.98 = 7.24855
        await expect(page.getByTestId('invoice-tax')).toHaveText('{new:inv2.tax}');
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('{new:inv2.grand}');
        // a client with no region keeps the workspace rate: 10% of 99.98
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{new:inv1.tax}');
""", new=new)
    return Spec('cp101_region_tax', 'tax by client region', f"""
        A client can have a region (clients[].region, the Region box on the client form). Their invoices
        are taxed at that region's rate from the workspace's regional rates (settings.regionTaxRates,
        region -> percentage) instead of the workspace rate; with no region, or a region that has no
        rate listed, the workspace rate applies. A line's own tax rate still wins, exempt lines and
        tax-exempt clients pay none, and the invoice tax is still rounded once {'per rate ' if n >= 116 else ''}on the exact
        line taxes and shared over the lines.""", [t1, t2], n, copy_note=note101(n))


def note101(n):
    if n >= 116:
        return ("UPDATED for cp116 (mutates: [72, 101, 106]): the tax is now rounded once per rate, so the New "
                "York invoice's 8.875% lines (9.58855 -> 9.59) and its 5% handbook (1.125 -> 1.13) come to 10.72 "
                "instead of 10.71. Carries both tests.")
    return None


cp(101, 'region_tax', """
    Tax depends on where my client is. Let me give a client a region (a Region box on the client form,
    saved with the client) and tax their invoices at that region's rate from the workspace's regional
    rates, instead of the workspace rate. A client with no region, or in a region with no rate
    listed, keeps the workspace rate. A line with its own tax rate keeps it, exempt lines and
    tax-exempt clients still pay nothing, and the invoice tax is still worked out once on the exact
    line taxes (after discounts) and shared over the lines.
""", s101)

# =============================================================================== cp102 reverse charge
RC = dict(RT, homeRegion='NY')


def s102(n):
    fx1 = dict(asOf=SA, settings=RC, clients=[C(A, region='NY')])
    ok = plus(fx1, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', region='CA',
                                 taxNumber='CA 2048 1630 17')])
    t1 = T('refuses a tax number that fails its check', '@error', fx1, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-region').fill('CA');
        // the check digits of 20481630 are 97 - (20481630 mod 97 = 80) = 17, not 71; and a number
        // needs two letters and ten digits
        for (const number of ['CA2048163071', 'CA20481630', '2048163017CA']) {
          await page.getByTestId('client-form-tax-number').fill(number);
          await page.getByTestId('client-form-submit').click();
          await expect(page.getByTestId('client-form-error')).toBeVisible();
          await expect(page.getByTestId('client-row-2')).toHaveCount(0);
        }
        await page.getByTestId('client-form-tax-number').fill('CA 2048 1630 17');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Umbrella Co');
""", ok=ok)
    fx2 = dict(asOf=SA, settings=RC, clients=[
        C(A, region='NY', taxNumber='NY1234567894'), C(G, region='CA', taxNumber='CA2048163017'),
        C(IN, region='CA', taxNumber='CA2048163071')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 3, 33.35), L(2, 'Handbook', 2, 12.5, taxRate=5)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Design', 3, 33.35), L(4, 'Handbook', 2, 12.5, taxRate=5)],
          discountPct=10),
        I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Design', 3, 33.35)])])
    sent = plus(fx2, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    t2 = T('charges no tax to a registered client outside the home region', '@core', fx2, """
        // the workspace is in New York; Globex is in California with a valid tax number
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
""" + tax_lines('s', 2, (3, 4)) + """
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}'); // 125.05 - 12.50, no tax
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number={sent:inv2.number} total={sent:inv2.grand|plain}');
        await expect.poll(() => auditLines()).toContain('REVERSE_CHARGE id=2 number={sent:inv2.number} total={sent:inv2.grand|plain}');
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
        // a valid number in the home region is taxed as usual: 8.875% of 100.05 + 5% of 25.00
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        // a number that fails its check counts for nothing: California's 7.25% of 100.05
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv3.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}');
""", sent=sent)
    tests = [t1, t2]
    note = None
    if n >= 124:
        fx3 = dict(asOf=SA, settings=RC, clients=[C(A, region='CA', taxNumber='NY1234567894')], invoices=[
            I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 3, 33.35)])])
        tests.append(T("a number from another region does not count", '@core', fx3, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // a valid New York number for a California client: California's 7.25% of 100.05
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
"""))
        note = ("UPDATED for cp124 (mutates: [102, 117]): a tax number now counts only when its two letters are "
                "the client's region; the tests' clients all quote their own region's number, so their figures "
                "hold, and a new test shows a California client with a New York number taxed as usual. Carries "
                "both tests.")
    region_rule = (", and whose two letters are the region they are taxed in," if n >= 124 else "")
    return Spec('cp102_reverse_charge', 'reverse charge for registered clients', f"""
        A client can have a tax number (clients[].taxNumber, on the client form): two letters then ten
        digits, spaces ignored, where the last two digits are 97 minus the remainder of the first eight
        divided by 97 (a remainder of 0 gives 97). The client form refuses a number that is not in that
        form or fails the check. A client with a valid tax number{region_rule} whose region is not the
        workspace's home region (settings.homeRegion) is reverse charged: no tax on any line, the panel
        shows "Reverse charge", and sending writes REVERSE_CHARGE id=<id> number=<number> total=<grand
        total> after INVOICE_SENT. A number that fails the check counts as no number.""", tests, n,
        copy_note=note)


cp(102, 'reverse_charge', """
    Registered businesses in other regions account for the tax themselves. Let me record a client's tax
    number on the client form: two letters then ten digits (spaces ignored), where the last two
    digits are a check: 97 minus the remainder when the first eight digits are divided by 97 (a
    remainder of 0 gives 97). Refuse a number that isn't in that form or fails the check. When a
    client has a valid tax number and their region is not the workspace's home region, their invoices
    are reverse charged: no tax on any line, the panel says "Reverse charge", and sending writes
    REVERSE_CHARGE id=<invoice id> number=<invoice number> total=<grand total> after INVOICE_SENT.
    Clients in the home region, or whose number fails the check, are taxed as usual.
""", s102, algorithm='tax-number-check')

# =============================================================================== cp103 rate card
CARD = [{'unitType': 'hour', 'unitPrice': 95}, {'unitType': 'day', 'unitPrice': 680}]
T10 = {'taxRate': 10}


def s103(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=CARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Consulting', 7.5, unitType='hour'), L(2, 'Workshop', 2, unitType='day', discountPct=10),
           L(3, 'Travel', 1, 120.4)], discountPct=5)])
    t1 = T("prices a line from the client's rate card", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('{s:inv1.line1.unitPrice}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-type')).toHaveText('hour');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}'); // 7.5 x 95.00
        await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('{s:inv1.line2.unitPrice}');
        // 2 x 680.00 = 1,360.00 less its own 10% (136.00)
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{s:inv1.subtotal}'); // 712.50 + 1,224.00 + 120.40
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv1.discount}'); // 5% of 2,056.90, rounded down
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
""")
    fx2 = dict(asOf=SA, settings=T10, clients=[C(A, rates=CARD), G], invoices=[
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(3, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)])])
    a = plus(fx2, lines=[(2, L(3, 'Support', 3, unitType='hour')), (2, L(4, 'Support', 2, 80, unitType='hour'))])
    t2 = T('adds a line by unit type', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // no unit price: the card's 95.00 an hour
        await page.getByTestId('line-form-description').fill('Support');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('3');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('{a:inv2.line3.unitPrice}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{a:inv2.line3.amount}');
        // a price typed in wins over the card
        await page.getByTestId('line-form-description').fill('Support');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('2');
        await page.getByTestId('line-form-unit-price').fill('80');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{a:inv2.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv2.grand}'); // (100.00 + 285.00 + 160.00) + 10%
        // a unit type the card does not have, with no price, is refused
        await page.getByTestId('line-form-description').fill('Retainer');
        await page.getByTestId('line-form-unit-type').fill('week');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId(/^line-row-\\d+$/)).toHaveCount(3);
        // Globex has no rate card
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('line-form-description').fill('Support');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv3.grand}');
""", a=a)
    return Spec('cp103_rate_card', 'rate card', """
        A client can have a rate card (clients[].rates: unitType and unitPrice). A line can have a unit
        type (lineItems[].unitType, the line form's unit type box, shown on the line); with no unit
        price of its own it is priced at the client's rate for that unit type, shown as its unit price,
        and then discounted, taxed and totalled like any line. A price entered on the line wins over the
        card. A line with no price whose unit type is not on the client's card is refused.""", [t1, t2], n)


cp(103, 'rate_card', """
    I bill most work from each client's rate card. Give clients a rate card (a price per unit type, such
    as hour or day) and let a line have a unit type: a unit type box on the line form, shown on the
    line. A line with a unit type and no unit price of its own is priced at the client's rate for that
    unit type, shows that as its unit price, and is then discounted, taxed and totalled like any other
    line. A price typed on the line wins over the card. Refuse a line with no price whose unit type
    isn't on the client's card.
""", s103)

# =============================================================================== cp104 early discount before tax
EP = dict(A, earlyPayPct=2, earlyPayDays=10)


def s104(n):
    fx1 = dict(asOf='2026-03-05', settings=RT, clients=[C(EP, region='NY')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000), L(2, 'Handbook', 2, 12.5, taxRate=5)],
          discountPct=4)])
    v = V(fx1, n)
    st = num(v['inv1.settle'])
    a = plus(fx1, payments=[P(1, 1, st, '2026-03-05', [(1, st)])])
    t1 = T('the early discount is worked out before tax', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 1,025.00 less the 4% discount (41.00) = 984.00 before tax; 2% of that is 19.68
        // (2% of the grand total would be 21.40)
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-settle-amount')).toHaveText('{s:inv1.settle}');
        await page.getByTestId('payment-form-amount').fill('{s:inv1.settle|plain}');
        await page.getByTestId('payment-form-date').fill('2026-03-05');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-early-discount')).toHaveText('{a:inv1.earlyDiscount}');
        await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount={a:inv1.earlyDiscount|plain}');
""", a=a)
    return Spec('cp104_early_discount_before_tax', 'early discount before tax', """
        The early-payment discount is the client's percentage of the invoice's amount before tax (after
        its discounts), rounded down to the cent, no longer of the grand total; the amount that settles
        early is still the amount due minus that discount.""", [t1], n)


cp(104, 'early_discount_before_tax', """
    The early-payment discount shouldn't be worked out on the tax. Make it the client's percentage of
    the invoice's amount before tax (after its discounts), rounded down to the cent, instead of the
    grand total. Everything else about it stays the same: the settle amount is still the amount due
    minus the early discount.
""", s104, type_='mutative', mutates=[62], copies=['cp62_early_payment_discount'])

# =============================================================================== cp105 tiered rates
TIERS = [{'units': 10, 'unitPrice': 20}, {'units': 40, 'unitPrice': 15}, {'unitPrice': 12}]
TCARD = [{'unitType': 'licence', 'tiers': TIERS}, {'unitType': 'hour', 'unitPrice': 95}]


def s105(n):
    across = n >= 112
    fx1 = dict(asOf=SA, settings=RT, clients=[C(A, region='NY', rates=TCARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Licences', 60, unitType='licence'), L(2, 'Licences', 12.5, unitType='licence', discountPct=10),
           L(3, 'Setup', 2, unitType='hour')], discountPct=5)])
    l2 = ("// line 2 carries on from unit 61: 12.5 x 12.00 = 150.00, less its own 10% (15.00)" if across else
          "// line 2: 10 x 20.00 + 2.5 x 15.00 = 237.50, less its own 10% (23.75)")
    t1 = T('prices a unit type in progressive tiers', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the first 10 licences at 20.00, the next 40 at 15.00, the rest at 12.00:
        // 10 x 20.00 + 40 x 15.00 + 10 x 12.00 = 920.00 (all 60 at 12.00 would be 720.00)
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{{s:inv1.line1.amount}}');
        {l2}
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{{s:inv1.line2.amount}}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{{s:inv1.line3.amount}}'); // 2 x 95.00
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{{s:inv1.subtotal}}');
        await expect(page.getByTestId('invoice-discount')).toHaveText('{{s:inv1.discount}}'); // 5%, rounded down
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv1.tax}}'); // 8.875% after the discount, rounded once
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv1.grand}}');
""")
    fx2 = dict(asOf=SA, settings={'taxRate': 10, 'usdPer': RATES}, clients=[
        C(A, rates=TCARD), C(KK, rates=[{'unitType': 'licence', 'tiers': [{'units': 100, 'unitPrice': 150},
                                                                         {'unitPrice': 120.5}]}])],
        invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
                  I(2, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Licences', 150, unitType='licence')])])
    a = plus(fx2, lines=[(1, L(3, 'Licences', 25, unitType='licence'))])
    b = plus(fx2, lines=[(1, L(3, 'Licences', 55, unitType='licence'))])
    t2 = T('reprices a tiered line when its quantity changes', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('line-form-description').fill('Licences');
        await page.getByTestId('line-form-unit-type').fill('licence');
        await page.getByTestId('line-form-qty').fill('25');
        await page.getByTestId('line-form-submit').click();
        // 10 x 20.00 + 15 x 15.00
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{a:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}'); // (100.00 + 425.00) + 10%
        await page.getByTestId('line-row-3').getByTestId('line-edit').click();
        await page.getByTestId('line-form-qty').fill('55');
        await page.getByTestId('line-form-submit').click();
        // 10 x 20.00 + 40 x 15.00 + 5 x 12.00
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{b:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{b:inv1.grand}');
        // yen tiers: 100 x 150 + 50 x 120.5 = 21,025 yen
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv2.line2.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
""", a=a, b=b)
    note = None
    if across:
        note = ("UPDATED for cp112 (mutates: [105]): a unit type's tiers now count all the invoice's lines of it "
                "together, so the second licence line carries on from unit 61 at 12.00 (135.00) instead of starting "
                "the bands again (213.75). Carries both tests.")
    hdr = ("all of the invoice's lines of that unit type are counted together, in line order, so a later line "
           "carries on from the units before it" if across else "each line starts the bands from its first unit")
    return Spec('cp105_tiered_rates', 'tiered rates', f"""
        A rate card entry can price its unit type in progressive tiers instead of one price
        (clients[].rates[].tiers: units in the band and unitPrice, the last band with no units for the
        rest): each band's units are charged at that band's price, like tax brackets, and the line's
        amount is the total, rounded to the cent (whole yen for yen clients); {hdr}. The line is then
        discounted, taxed and totalled as usual, and a change of quantity reprices it.""", [t1, t2], n,
        copy_note=note)


cp(105, 'tiered_rates', """
    Some unit types get cheaper the more a client buys. Let a rate card entry be priced in tiers
    instead of a single price: bands of units, each with its own unit price, the last band covering
    everything above. Charge them progressively, like tax brackets: for example with the first 10 at
    20.00, the next 40 at 15.00 and the rest at 12.00, 60 units cost 10 x 20.00 + 40 x 15.00 + 10 x
    12.00 = 920.00. A line of that unit type with no price of its own costs the total of its bands,
    rounded to the cent (whole yen for yen clients); each line starts from the first band. The line is
    then discounted, taxed and totalled like any other, and changing its quantity reprices it.
""", s105, algorithm='tiered-pricing')

# =============================================================================== cp106 prices include tax


def s106(n):
    per_rate = n >= 116
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, pricesIncludeTax=True), G], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 10), L(2, 'Hosting', 1, 5), L(3, 'Pens', 1, 1.13)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 1, 10), L(5, 'Hosting', 1, 5), L(6, 'Pens', 1, 1.13)])])
    t1 = T('takes the tax out of prices that include it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the grand total is the prices themselves: 10.00 + 5.00 + 1.13
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // the tax inside 16.13 at 10%: 16.13 - 16.13 / 1.1 = 16.13 - 14.66 = 1.47
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv1.net}');
        // per line: 10.00 / 1.1 = 9.09 (tax 0.91), 5.00 / 1.1 = 4.55 (0.45), 1.13 / 1.1 = 1.03 (0.10) is
        // 1.46, a cent short of 1.47: the cent goes to the largest line (10.00), 0.92
""" + tax_lines('s', 1, (1, 2, 3)) + """
        await expect(page.getByTestId('line-row-1').getByTestId('line-net')).toHaveText('{s:inv1.line1.net}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('{s:inv1.line2.net}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-net')).toHaveText('{s:inv1.line3.net}');
        // the same lines for a client whose prices exclude tax: 16.13 + 10%
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv2.net}');
""")
    fx2 = dict(asOf=SA, settings=T10, clients=[C(A, pricesIncludeTax=True)], invoices=[
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30',
          [L(4, 'Build', 1, 1100), L(5, 'Book', 1, 52.5, taxRate=5), L(6, 'Postage', 1, 4.99, taxExempt=True)],
          discountPct=10, retentionPct=10)])
    book = ("the book is taxed at its own 5%, reconciled on its own" if per_rate else
            "the book's own 5% is not used: every taxable line is at the client's 10%")
    t2 = T('discounts, retention and exempt lines on prices that include tax', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // 1,157.49 less 10% (115.74); the discount is shared over the lines before the tax is taken out;
        // {book};
        // postage is exempt, so no tax inside it
        await expect(page.getByTestId('invoice-discount')).toHaveText('{{s:inv2.discount}}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{{s:inv2.grand}}'); // 1,157.49 - 115.74
        await expect(page.getByTestId('invoice-tax')).toHaveText('{{s:inv2.tax}}');
""" + tax_lines('s', 2, (4, 5, 6)) + """
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv2.net}');
        // retention is 10% of the amount before tax, rounded down
        await expect(page.getByTestId('invoice-retention')).toHaveText('{s:inv2.retention}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
""")
    fx3 = dict(asOf=SA, settings=T10, clients=[A])
    d = plus(fx3, clients=[dict(id=2, name='Corner Shop', email='till@corner.example', pricesIncludeTax=True)])
    d['invoices'] = [I(1, 2, 'DRAFT', SA, '2026-04-30', [L(1, 'Design', 1, 110)])]
    t3 = T('adds a client whose prices include tax', '@core', fx3, """
        await page.getByTestId('client-form-name').fill('Corner Shop');
        await page.getByTestId('client-form-email').fill('till@corner.example');
        await page.getByTestId('client-form-prices-include-tax').check();
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('110');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{d:inv1.grand}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{d:inv1.tax}'); // 110.00 - 110.00 / 1.1
        await expect(page.getByTestId('invoice-net')).toHaveText('{d:inv1.net}');
""", d=d)
    note = None
    if per_rate:
        note = ("UPDATED for cp116 (mutates: [72, 101, 106]): tax is now worked out once per rate, and on prices that "
                "include tax a line's own rate is used and reconciled with the other lines at that rate, so the "
                "book's 5% is honoured. Carries all three tests.")
    rate_rule = ("each line at its own rate (a line's own rate, else the client's), the lines at each rate "
                 "reconciled together" if per_rate else
                 "every taxable line at the client's rate (a line's own rate is not used)")
    return Spec('cp106_prices_include_tax', 'prices that include tax', f"""
        A client's prices can include tax (clients[].pricesIncludeTax, a box on the client form). Their
        line amounts, discounts and grand total are then tax-inclusive, and the tax is taken out of them,
        {rate_rule}: each line's net is its amount after its discount share divided by 1 + the rate,
        rounded to the cent, and its tax the rest; the invoice tax is the total minus the total divided by
        1 + the rate, rounded once, and any cents by which the line taxes miss it go one at a time to the
        lines with the largest amounts (the earlier line on a tie), so net + tax is always the line's
        amount. Exempt lines have no tax inside them. The panel shows the amount before tax (invoice-net)
        and each line its net; retention and the early-payment discount are worked out on the amount before
        tax.""", [t1, t2, t3], n, copy_note=note)


cp(106, 'prices_include_tax', """
    Some of my clients are quoted prices that already include tax. Let me tick "prices include tax" on
    the client form. For those clients the line amounts, discounts and grand total include the tax,
    and the tax is taken out of them at the client's rate (every taxable line at that rate; exempt
    lines have none): each line's net is its amount after its share of the discount divided by 1 plus
    the rate, rounded to the cent, and its tax is the rest. The invoice tax is the total minus the
    total divided by 1 plus the rate, rounded once; if the line taxes don't add up to it, move the
    missing (or extra) cents one at a time onto the lines with the largest amounts (the earlier line
    on a tie), adjusting their net so net plus tax is always the line amount. Show the amount before
    tax on every invoice and each line's net. Retention and the early-payment discount are worked out
    on the amount before tax.
""", s106, algorithm='tax-inclusive-reconcile')

# =============================================================================== cp107 minimum charge
MC = dict(RT, minimumCharge=50, usdPer=RATES)


def s107(n):
    fx1 = dict(asOf=SA, settings=MC, clients=[C(A, region='NY'), C(G, currency='EUR')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 30)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 60)], discountPct=20),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 80)]),
        I(4, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 1, 30)]),
        I(5, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(5, 'Design', 1, 20)], creditOf=3)])
    t1 = T('tops a small invoice up to the minimum charge', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 30.00 is 20.00 short of the 50.00 minimum; the 50.00 is taxed at New York's 8.875% = 4.4375
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv1.minimumCharge}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{s:inv1.line1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // 30.00 + 20.00 + 4.44
        // the minimum is compared after the discount: 60.00 - 20% = 48.00, 2.00 short
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv2.discount}');
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv2.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv3.minimumCharge}');
        // a credit note gets no minimum charge
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv5.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv5.grand}'); // 20.00 + 8.875%
        // in euros: $50.00 / 1.10 = 45.4545, rounded down to €45.45; taxed at the workspace 10%
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv4.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv4.grand}'); // 45.45 + 4.545 -> 4.55
""")
    a = plus(fx1, lines=[(1, L(6, 'Hosting', 1, 25))])
    t2 = T('drops the minimum charge once the lines reach it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('line-form-description').fill('Hosting');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('25');
        await page.getByTestId('line-form-submit').click();
        // 30.00 + 25.00 = 55.00 is over the minimum
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{a:inv1.minimumCharge}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv1.tax}'); // 8.875% of 55.00 = 4.88125
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
""", a=a)
    return Spec('cp107_minimum_charge', 'minimum charge', """
        When an invoice's amount after its discounts is below the workspace's minimum charge
        (settings.minimumCharge, in US dollars, converted to the client's currency at the issue date's
        rate and rounded down to its step), the difference is added as a minimum charge: shown on the
        panel ($0.00 when none), not discounted, taxed at the client's standard rate (their region's,
        else the workspace's; none for exempt or reverse-charged clients) as if it were one more line,
        part of the grand total and of the amount before tax. Credit notes and invoices with no lines
        get none.""", [t1, t2], n)


cp(107, 'minimum_charge', """
    Small jobs aren't worth invoicing below a minimum. When an invoice's amount after its discounts is
    below the workspace's minimum charge (set in US dollars, converted to the client's currency at the
    issue date's rate and rounded down like other conversions), add the difference as a minimum
    charge. Show it on the panel ($0.00 when there is none). It isn't discounted; it is taxed at the
    client's standard rate (their region's, else the workspace's; nothing for exempt or reverse-charged
    clients) as if it were one more line in the invoice's tax, and it is part of the grand total and of
    the amount before tax, so retention and early-payment discounts include it. Credit notes and
    invoices with no lines get no minimum charge.
""", s107)

# =============================================================================== cp108 exempt clients and line rates


def s108(n):
    fx1 = dict(asOf=SA, settings=MC, clients=[C(A, region='NY', taxExempt=True),
                                              C(G, region='CA', taxNumber='CA2048163017')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Catering', 1, 18.4), L(2, 'Wine', 1, 13.35, taxRate=12.5), L(3, 'Delivery', 1, 6, taxExempt=True)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Catering', 1, 60), L(5, 'Wine', 1, 13.35, taxRate=12.5)])])
    s = dict(MC, homeRegion='NY')
    fx1['settings'] = s
    t1 = T("a tax-exempt client still pays a line's own rate", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the exemption covers the general rate only: the wine keeps its own 12.5% (12.5% of 13.35 = 1.66875)
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{s:inv1.line1.tax}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('{s:inv1.line2.tax}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('{s:inv1.line3.tax}');
        // 18.40 + 13.35 + 6.00 = 37.75 is topped up by 12.25 to the 50.00 minimum, which is not taxed
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv1.minimumCharge}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // 50.00 + 1.67
        // a reverse-charged client pays no tax at all
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
""")
    return Spec('cp108_exempt_client_line_rates', 'exempt clients and line rates', """
        A tax-exempt client is exempt from the general rate only (their region's or the workspace's): a
        line with its own tax rate is still taxed at that rate. Their exempt lines and minimum charge are
        not taxed, and a reverse-charged client still pays no tax at all.""", [t1], n)


cp(108, 'exempt_client_line_rates', """
    A client's tax exemption only covers the general sales tax. For a tax-exempt client, still charge a
    line's own tax rate when it has one (the general rate, their region's or the workspace's, stays at
    nothing, and so does the tax on their minimum charge). Reverse-charged clients still pay no tax at
    all.
""", s108, type_='mutative', mutates=[49])

# =============================================================================== cp109 cash payments


def cash_pay(amount, date, method='CASH'):
    return f"""        await page.getByTestId('payment-form-method').selectOption('{method}');
        await page.getByTestId('payment-form-amount').fill('{amount}');
        await page.getByTestId('payment-form-date').fill('{date}');
        await page.getByTestId('payment-form-submit').click();
"""


def s109(n):
    down = n >= 120
    st = {'taxRate': 10, 'usdPer': RATES}
    fx1 = dict(asOf=SA, settings=st, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Beans', 1, 11.25)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Beans', 1, 11.24)]),
        I(3, 2, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Beans', 1, 11.25)])])
    v = V(fx1, n)
    c1, c2, c3 = num(v['inv1.cashDue']), num(v['inv2.cashDue']), num(v['inv3.cashDue'])
    a = plus(fx1, payments=[P(1, 1, c1, SA, [(1, c1)], method='CASH')])
    b = plus(a, payments=[P(2, 1, c2, SA, [(2, c2)], method='CASH')])
    c = plus(b, payments=[P(3, 2, c3, SA, [(3, c3)], method='CASH')])
    if down:
        r1 = "// 11.25 + 1.13 tax = 12.38: in cash, down to 12.35 (the client's favour), 0.03 less"
        r2 = "// 12.36 rounds down to 12.35"
        h1 = "the 12.35 settles it; the 0.03 is the cash rounding, not left owing"
    else:
        r1 = "// 11.25 + 1.13 tax = 12.38: in cash, to the nearest 0.05 is 12.40, 0.02 more"
        r2 = "// 12.36 rounds down to 12.35"
        h1 = "the 12.40 settles it; the extra 0.02 is the cash rounding, not credit"
    t1 = T('settles an invoice in cash to the nearest five cents', '@core', fx1, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        {r1}
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{{s:inv1.cashDue}}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{{s:inv1.cashRounding}}');
""" + cash_pay('{s:inv1.cashDue|plain}', SA) + f"""        // {h1}
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{{a:inv1.status}}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{{a:inv1.due}}');
        await expect(page.getByTestId('invoice-paid')).toHaveText('{{a:inv1.paid}}');
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{{a:inv1.cashDue}}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{{a:inv1.cashRounding}}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount={{a:inv1.paid|plain}}');
        await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=1 amount={{a:inv1.cashRounding|plain}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{{a:client1.credit}}');

        await page.getByTestId('invoice-row-2').click();
        {r2}
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{{a:inv2.cashDue}}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{{a:inv2.cashRounding}}');
""" + cash_pay('{a:inv2.cashDue|plain}', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv2.status}');
        await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=2 amount={b:inv2.cashRounding|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{b:client1.balance}');
        // euro cash rounds the same way: 12.38 euros
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{b:inv3.cashDue}');
""" + cash_pay('{b:inv3.cashDue|plain}', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{c:inv3.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{c:inv3.due}');
""", a=a, b=b, c=c)
    fx2 = dict(asOf=SA, settings=st, clients=[A, KK], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Beans', 1, 11.25)]),
        I(4, 3, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Beans', 1, 2125)])])
    part = plus(fx2, payments=[P(1, 1, 5, SA, [(1, 5)], method='CASH')])
    t2 = T('cash must be counted out in five cents against the open invoice', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        // no invoice open: cash is refused
""" + cash_pay('12.40', SA) + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await page.getByTestId('invoice-row-1').click();
        // 12.38 cannot be counted out in coins of five cents
""" + cash_pay('12.38', SA) + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        // cash comes only in the client's own currency
        await page.getByTestId('payment-form-currency').selectOption('EUR');
""" + cash_pay('12.40', SA) + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-paid')).toHaveText('{s:inv1.paid}');
        expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
        // part of it in cash is fine: 12.38 - 5.00 leaves 7.38
        await page.getByTestId('payment-form-currency').selectOption('USD');
""" + cash_pay('5', SA) + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{part:inv1.due}');
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{part:inv1.cashDue}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{part:inv1.status}');
        // yen have no coins smaller than one yen: nothing to round
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{part:inv4.cashDue}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{part:inv4.cashRounding}');
""", part=part)
    note = None
    if down:
        note = ("UPDATED for cp120 (mutates: [109]): cash now always rounds down to the 0.05 below, so the 12.38 "
                "invoice settles in cash for 12.35 (rounding -0.03) instead of 12.40. Carries both tests.")
    rule = "rounded down to the 0.05 below" if down else "rounded half up to the nearest 0.05"
    return Spec('cp109_cash_payments', 'cash payments', f"""
        A payment can be taken in cash (payments[].method 'CASH'; the payment form's method, BANK by
        default). The panel shows what is due in cash: the amount due {rule} (invoice-cash-due), and the
        difference (invoice-cash-rounding, signed). A cash payment of exactly the cash amount due settles
        the invoice: it is Paid with nothing due, the difference is the cash rounding (CASH_ROUNDING
        id=<invoice id> amount=<signed difference>), never credit or a balance left owing, and the
        rounding stays shown. Cash must be a multiple of 0.05 (whole yen for yen clients), in the
        client's own currency, and taken against the open invoice; otherwise it is refused. Yen need no
        rounding.""", [t1, t2], n, copy_note=note)


cp(109, 'cash_payments', """
    Some clients pay in cash, and there are no one- or two-cent coins. Add a method to the payment form
    (bank transfer by default, or cash). Show on the invoice the amount due in cash, which is the
    amount due rounded half up to the nearest 0.05, and the difference it makes (for example 12.38 is
    12.40 in cash, +0.02; 12.36 is 12.35, -0.01). A cash payment of exactly that cash amount settles
    the invoice: it's Paid with nothing due, and the difference is a cash rounding, written as
    CASH_ROUNDING id=<invoice id> amount=<signed difference>, never held as credit or left owing; keep
    showing the rounding afterwards. Cash must be a multiple of 0.05 (whole yen for yen clients), in the client's own currency,
    and taken against the invoice that is open; refuse it otherwise. Yen clients pay whole yen in cash,
    so there is nothing to round for them.
""", s109, algorithm='cash-rounding')

# =============================================================================== cp110 surcharge


def s110(n):
    fx1 = dict(asOf=SA, settings=MC, clients=[C(A, region='NY')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 4, 50)], discountPct=10),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 40)], surchargePct=10)])
    a = plus(fx1, inv=[(1, dict(surchargePct=7.5))])
    t1 = T('adds a percentage surcharge after the discount', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('surcharge-form-pct').fill('7.5');
        await page.getByTestId('surcharge-form-submit').click();
        // 200.00 less 10% = 180.00; 7.5% of that is 13.50, not discounted
        await expect(page.getByTestId('invoice-surcharge')).toHaveText('{a:inv1.surcharge}');
        await expect(page.getByTestId('invoice-discount')).toHaveText('{a:inv1.discount}');
        // 8.875% of 180.00 + 13.50 = 193.50 is 17.173125
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}'); // 193.50 + 17.17
        await expect(page.getByTestId('invoice-net')).toHaveText('{a:inv1.net}');
        // the surcharge counts towards the minimum: 40.00 + 4.00 is topped up by 6.00 to 50.00
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-surcharge')).toHaveText('{a:inv2.surcharge}');
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{a:inv2.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv2.grand}');
""", a=a)
    fx2 = dict(asOf=SA, settings=MC, clients=[C(A, region='NY')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 100)])])
    t2 = T('refuses a surcharge out of range or on a sent invoice', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        for (const pct of ['25.01', '-1']) {
          await page.getByTestId('surcharge-form-pct').fill(pct);
          await page.getByTestId('surcharge-form-submit').click();
          await expect(page.getByTestId('surcharge-form-error')).toBeVisible();
        }
        await expect(page.getByTestId('invoice-surcharge')).toHaveText('{s:inv1.surcharge}');
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('surcharge-form-pct').fill('5');
        await page.getByTestId('surcharge-form-submit').click();
        await expect(page.getByTestId('surcharge-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}');
""")
    return Spec('cp110_surcharge', 'surcharge', """
        A draft invoice can carry a surcharge (invoices[].surchargePct, the surcharge box on the panel,
        0 to 25%): that percentage of the invoice's amount after its discounts, rounded down to the cent,
        shown on the panel. It is not discounted, it is taxed at the client's standard rate like the
        minimum charge, and it counts towards the minimum charge, which only tops up what is still short
        after it. A surcharge below 0, above 25% or on a sent invoice is refused.""", [t1, t2], n)


cp(110, 'surcharge', """
    Rush jobs carry a surcharge. Let me set a surcharge percentage on a draft invoice (a box on the
    invoice panel): the surcharge is that percentage of the invoice's amount after its discounts,
    rounded down to the cent, and is shown on the panel. It isn't discounted; it's taxed at the
    client's standard rate in the invoice's tax, like the minimum charge; and it counts towards the
    minimum charge, which now only tops up whatever is still short after the surcharge. Refuse a
    surcharge below 0 or above 25%, or on an invoice that has been sent.
""", s110)

# =============================================================================== cp111 card surcharge
CS = {'cardSurchargePct': 2.5}


def s111(n):
    fx1 = dict(asOf=SA, settings=CS, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Hosting', 1, 50)])])
    a = plus(fx1, payments=[P(1, 1, 102.5, SA, [(1, 100)], method='CARD')])
    b = plus(a, payments=[P(2, 1, 60, SA, [(2, 50)], method='CARD')])
    t1 = T('takes the card surcharge out of a card payment', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + cash_pay('102.50', SA, 'CARD') + """        // 102.50 / 1.025 = 100.00 pays the invoice; 2.50 of it is the card surcharge
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$102.50');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-surcharge')).toHaveText('{a:pay1.surcharge}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{a:inv1.paid}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=1 amount={a:pay1.surcharge|plain}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=100.00');
        // no invoice open: 60.00 by card is 60 / 1.025 = 58.536 -> 58.54 after the 1.46 surcharge; 50.00
        // pays invoice 2 and 8.54 is held as credit
        await page.getByTestId('client-row-1').click();
""" + cash_pay('60', SA, 'CARD') + """        await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=2 amount={b:pay2.surcharge|plain}');
        await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=2 amount=50.00');
        await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=8.54');
        await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('{b:client1.credit}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{b:client1.balance}');
""", a=a, b=b)
    fx2 = dict(asOf=SA, settings=CS, clients=[A], invoices=[
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 200)])])
    ok = plus(fx2, payments=[P(1, 1, 20.5, SA, [(3, 20)], method='CARD')])
    t2 = T('the minimum part payment counts what reaches the invoice', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        // 10% of 200.00 is 20.00; 20.00 by card is only 19.51 after the surcharge
""" + cash_pay('20', SA, 'CARD') + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await expect(page.getByTestId('invoice-paid')).toHaveText('{s:inv3.paid}');
""" + cash_pay('20.50', SA, 'CARD') + """        await expect(page.getByTestId('invoice-paid')).toHaveText('{ok:inv3.paid}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{ok:inv3.due}');
""", ok=ok)
    return Spec('cp111_card_surcharge', 'card surcharge', """
        A payment can be made by card (payments[].method 'CARD'). Part of it is the workspace's card
        surcharge (settings.cardSurchargePct): the surcharge is the amount minus the amount divided by 1
        + the rate, rounded half up to the cent, shown on the payment row and written as
        CARD_SURCHARGE payment=<payment id> amount=<surcharge>. Only the rest pays invoices, counts for
        the minimum part payment, or is held as credit.""", [t1, t2], n)


cp(111, 'card_surcharge', """
    Card payments cost me a fee, so I pass it on. Add card as a payment method. When a client pays by
    card, part of what they pay is the workspace's card surcharge: the surcharge is the amount paid
    minus the amount divided by 1 plus the surcharge rate, rounded half up to the cent (at 2.5%,
    102.50 by card is 100.00 plus 2.50 surcharge). Show the surcharge on the payment row and write
    CARD_SURCHARGE payment=<payment id> amount=<surcharge> before the PAYMENT_RECORDED lines. Only the
    rest pays invoices, counts towards the minimum part payment, or is held as credit.
""", s111)

# =============================================================================== cp112 tiers across lines


def s112(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=TCARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Licences', 8, unitType='licence'), L(2, 'Licences', 5, unitType='licence'),
           L(3, 'Licences', 40, unitType='licence'), L(4, 'Setup', 1, unitType='hour')])])
    r = plus(fx1, drop_lines=[(1, 1)])
    t1 = T("counts a unit type's tiers over all its lines", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // units 1-8 at 20.00 = 160.00; units 9-13: 2 x 20.00 + 3 x 15.00 = 85.00;
        // units 14-53: 37 x 15.00 + 3 x 12.00 = 591.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // (836.00 + 95.00) + 10%
        // without the first line the others move down the bands: units 1-5 = 100.00, units 6-45:
        // 5 x 20.00 + 35 x 15.00 = 625.00
        await page.getByTestId('line-row-1').getByTestId('line-remove').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{after:inv1.line2.amount}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{after:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{after:inv1.grand}');
""", after=r)
    return Spec('cp112_tiers_across_lines', 'tiers across lines', """
        A unit type priced in tiers counts all of the invoice's lines of that unit type together: lines
        are taken in line order (lower id first), each carrying on through the bands from where the
        line before it stopped, and each line's amount is the exact charge for its own units, rounded
        to the cent. Adding, changing or removing one of them reprices the others.""", [t1], n)


cp(112, 'tiers_across_lines', """
    Tiered prices should reward the whole order, not each line. Count all of an invoice's lines of a
    tiered unit type together: take them in line order (lower id first), each line carrying on through
    the bands from where the previous one stopped, and charge each line for its own units at the bands
    they fall in (the exact charge, rounded to the cent). Adding, changing or removing one of those
    lines reprices the others.
""", s112, type_='mutative', mutates=[105], algorithm='tiered-pricing-revised', copies=['cp105_tiered_rates'])

# =============================================================================== cp113 price list
PL = [{'unitType': 'hour', 'unitPrice': 120}, {'unitType': 'licence', 'tiers': [{'units': 10, 'unitPrice': 20},
                                                                                 {'unitPrice': 15}]}]


def s113(n):
    st = {'taxRate': 10, 'usdPer': RATES, 'rates': PL}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, rates=[{'unitType': 'hour', 'unitPrice': 95}]), KK, HV], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Consulting', 2, unitType='hour'), L(2, 'Licences', 12, unitType='licence')]),
        I(2, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Consulting', 3, unitType='hour')]),
        I(3, 5, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(4, 'Consulting', 2.5, unitType='hour'), L(5, 'Licences', 12, unitType='licence')])])
    t1 = T('falls back to the workspace price list, converted', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // Acme's own card has hours (95.00); licences come from the price list: 10 x 20.00 + 2 x 15.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        // in yen: $120.00 / 0.0066 = 18,181.8, rounded down to 18,181 an hour
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('{s:inv2.line3.unitPrice}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv2.line3.amount}'); // 3 x 18,181
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        // in Swiss francs: 120 / 1.13 = 106.19, down to CHF 106.15; 2.5 x 106.15 = 265.375 -> 265.38;
        // each band converted: 20 / 1.13 = 17.699 -> 17.65, 15 / 1.13 = 13.274 -> 13.25
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('{s:inv3.line4.unitPrice}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{s:inv3.line4.amount}');
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{s:inv3.line5.amount}'); // 10 x 17.65 + 2 x 13.25
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}');
""")
    return Spec('cp113_price_list', 'workspace price list', """
        The workspace has a price list (settings.rates: unitType with unitPrice or tiers, in US
        dollars). A line with a unit type the client's own card does not have, and no price of its own,
        is priced from the price list, each price (or band price) converted to the client's currency at
        the invoice's issue-date rate and rounded down to its step. A unit type on neither is refused.""",
        [t1], n)


cp(113, 'price_list', """
    Keep a workspace price list for unit types a client's own card doesn't cover. It's in US dollars,
    with a single price or tiers per unit type, just like a rate card. A line whose unit type isn't on
    the client's card, with no price of its own, is priced from the price list: each price, or each
    band's price, converted to the client's currency at the invoice's issue-date rate and rounded down
    to the currency's step, like other conversions. A unit type on neither is refused as before.
""", s113)

# =============================================================================== cp114 billing increments
ICARD = [{'unitType': 'hour', 'unitPrice': 95, 'increment': 0.25},
         {'unitType': 'licence', 'increment': 5, 'tiers': [{'units': 10, 'unitPrice': 20}, {'units': 40, 'unitPrice': 15},
                                                           {'unitPrice': 12}]}]


def s114(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=ICARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Consulting', 1.6, unitType='hour'), L(2, 'Support', 2, 80, unitType='hour', discountPct=10),
           L(3, 'Licences', 12, unitType='licence'), L(4, 'Licences', 7, unitType='licence')])])
    a = plus(fx1, lines=[(1, L(5, 'Call', 0.1, unitType='hour'))])
    t1 = T('bills a unit type in whole increments', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // hours go in quarters: 1.6 is billed as 1.75 hours, 1.75 x 95.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line1.billedQty}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        // even at its own price: 2 hours is already whole quarters, 2 x 80.00 less 10%
        await expect(page.getByTestId('line-row-2').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line2.billedQty}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        // licences go in packs of 5: 12 -> 15 (10 x 20.00 + 5 x 15.00), then 7 -> 10 carries on at 15.00
        await expect(page.getByTestId('line-row-3').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line3.billedQty}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line4.billedQty}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{s:inv1.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // a six-minute call is a quarter of an hour
        await page.getByTestId('line-form-description').fill('Call');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('0.1');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-5').getByTestId('line-qty')).toHaveText('0.1');
        await expect(page.getByTestId('line-row-5').getByTestId('line-billed-qty')).toHaveText('{a:inv1.line5.billedQty}');
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{a:inv1.line5.amount}'); // 0.25 x 95.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
""", a=a)
    return Spec('cp114_billing_increments', 'billing increments', """
        A rate card entry can have an increment (clients[].rates[].increment, e.g. 0.25 of an hour or a
        pack of 5). Any line of that unit type is billed on its quantity rounded up to the next whole
        increment, shown as the line's billed quantity next to the quantity entered; the line is priced,
        and counted through the tiers, on the billed quantity.""", [t1], n)


cp(114, 'billing_increments', """
    I bill time in quarter hours and licences in packs. Let a rate card entry have an increment (such as
    0.25 for hours, or 5 for licences): any line of that unit type, even one with its own price, is
    billed on its quantity rounded up to the next whole increment. Show that billed quantity on the
    line next to the quantity entered, and price the line on it, tiers included: the billed units are
    what count through the bands.
""", s114)

# =============================================================================== cp115 dated tax rates
DT = dict(RT, taxRateChanges=[{'region': 'NY', 'from': '2026-04-01', 'rate': 9.25}])


def s115(n):
    fx1 = dict(asOf='2026-04-10', settings=DT, clients=[C(A, region='NY'), C(G, region='CA')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-20', '2026-04-30', [L(1, 'Design', 1, 1000)]),
        I(2, 1, 'SENT', '2026-03-15', '2026-04-30', [L(2, 'Design', 1, 1000)]),
        I(3, 1, 'SENT', '2026-04-05', '2026-04-30', [L(3, 'Design', 1, 200)], creditOf=2),
        I(4, 2, 'SENT', '2026-04-05', '2026-05-31', [L(4, 'Design', 1, 1000)])])
    sent = plus(fx1, inv=[(1, dict(status='SENT', issueDate='2026-04-10', dueDate='2026-05-31'))])
    t1 = T('taxes at the rate in force on the issue date', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // issued in March, before New York's rate went up to 9.25% on 2026-04-01: 8.875%
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await page.getByTestId('invoice-send').click();
        // sending makes it issued today, so the new rate applies: 9.25% of 1,000.00
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{sent:inv1.grand}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number={sent:inv1.number} total={sent:inv1.grand|plain}');
        // invoice 2 was issued on 2026-03-15 and keeps 8.875%; its credit note, issued in April, is
        // taxed like it: 8.875% of 200.00
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv2.tax}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv3.tax}');
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-total')).toHaveText('{sent:inv3.listTotal}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv2.due}'); // 1,088.75 - 217.75
        // California's rate has not changed
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv4.tax}');
""", sent=sent)
    return Spec('cp115_dated_tax_rates', 'dated tax rates', """
        A region's rate can change on a date (settings.taxRateChanges: region, from, rate). An invoice
        is taxed at its region's rate in force on its issue date (the latest change from on or before
        it, else the regional rate), so sending a draft, which makes it issued today, can change its
        tax. A credit note is taxed at the rate of the invoice it credits.""", [t1], n)


cp(115, 'dated_tax_rates', """
    Regional tax rates change. Let the workspace record a region's new rate and the date it takes
    effect. Tax an invoice at the rate in force in its region on its issue date (the latest change on
    or before that date, otherwise the regional rate). Sending a draft makes it issued today, so its
    tax follows the rate in force today. A credit note is taxed at the rate of the invoice it credits,
    whenever it is issued.
""", s115)

# =============================================================================== cp116 tax per rate


def s116(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[A, C(G, pricesIncludeTax=True)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Book', 1, 22.5, taxRate=5), L(2, 'Design', 1, 20.05)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(3, 'Design', 1, 10), L(4, 'Book', 1, 10.5, taxRate=5), L(5, 'Pens', 1, 1.13)])])
    t1 = T('works the tax out once for each rate', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 5%: 1.125 -> 1.13; 10%: 2.005 -> 2.01; the invoice tax is 3.14 (one rounding of 3.13 would give 3.13)
        await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('{s:inv1.line1.tax}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('{s:inv1.line2.tax}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // 42.55 + 3.14
        // prices including tax: the 10% lines are reconciled together (10.00 and 1.13: 0.91 + 0.10, the
        // tax inside 11.13 is 11.13 - 10.12 = 1.01), the book at its own 5% (10.50 - 10.00 = 0.50)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + tax_lines('s', 2, (3, 4, 5)) + """
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv2.net}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
""")
    return Spec('cp116_tax_per_rate', 'tax per rate', """
        The tax is worked out once for each rate: the exact taxes of the lines (and charges) at one rate
        are added up and rounded half up, and shared over those lines as before; the invoice tax is the
        total over the rates. For prices that include tax, a line's own rate is now used, and the lines
        at each rate are reconciled on their own (the tax inside their total, the missing cents to the
        largest of them).""", [t1], n)


cp(116, 'tax_per_rate', """
    The tax office wants the tax rounded per rate, not over the whole invoice. Work the tax out once
    for each rate: add up the exact taxes of the lines (and charges) taxed at that rate, round that
    half up, and share it over those lines the same way as before; the invoice tax is the total of
    the rates. For clients whose prices include tax, use a line's own rate when it has one, and take
    the tax out of each rate's lines on their own: the tax inside those lines' total, with any missing
    cents going to the largest of them.
""", s116, type_='mutative', mutates=[72, 101, 106], algorithm='tax-inclusive-reconcile-revised',
   copies=['cp101_region_tax', 'cp106_prices_include_tax'])

# =============================================================================== cp117 withholding


def s117(n):
    fx1 = dict(asOf=SA, settings=RT, clients=[C(A, region='NY', withholdingPct=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Consulting', 1, 1000), L(2, 'Handbook', 2, 12.5, taxRate=5)])])
    sent = plus(fx1, inv=[(1, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    paid = plus(sent, payments=[P(1, 1, num(V(sent, n)['inv1.due']), SA, [(1, num(V(sent, n)['inv1.due']))])])
    t1 = T("withholds part of the client's payment for their tax office", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 10% of the 1,025.00 before tax is withheld; the client pays the grand total less that
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv1.withholding}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}'); // 1,025.00 + 88.75 + 1.25
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 1,115.00 - 102.50
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('WITHHOLDING id=1 amount={sent:inv1.withholding|plain}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{sent:client1.balance}');
        await page.getByTestId('payment-form-amount').fill('{sent:inv1.due|plain}');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{paid:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{paid:inv1.due}');
""", sent=sent, paid=paid)
    fx2 = dict(asOf='2026-01-31', settings=RT, clients=[C(A, region='NY', withholdingPct=10)], invoices=[
        I(2, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)])])
    pl = plus(fx2, inv=[(2, dict(instalments=2, instalmentRate=0))])
    t2 = T('an instalment plan spreads what the client pays', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('plan-form-count').fill('2');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        // 1,088.75 less 100.00 withheld = 988.75 over 2: 494.375, rounded up to 495.00, then 493.75
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{pl:inv2.inst1.payment}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('{pl:inv2.inst2.payment}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{pl:inv2.planTotal}');
""", pl=pl)
    fx3 = dict(asOf=SA, settings=RT, clients=[A])
    d = plus(fx3, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', withholdingPct=5)])
    d['invoices'] = [I(1, 2, 'DRAFT', SA, '2026-04-30', [L(1, 'Design', 1, 100)])]
    t3 = T('sets a withholding rate when adding a client', '@core', fx3, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-withholding-pct').fill('5');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('100');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{d:inv1.withholding}'); // 5% of 100.00
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{d:inv1.due}'); // 110.00 - 5.00
""", d=d)
    tests = [t1, t2, t3]
    note = None
    if n >= 124:
        fx4 = dict(asOf=SA, settings=RC, clients=[C(G, region='CA', taxNumber='CA2048163017', withholdingPct=10)],
                   invoices=[I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Consulting', 1, 1000)])])
        tests.append(T('a reverse-charged invoice has no withholding', '@core', fx4, """
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv2.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
"""))
        note = ("UPDATED for cp124 (mutates: [102, 117]): a reverse-charged invoice now carries no withholding; "
                "the three tests' clients are taxed as usual, so their figures hold, and a new test shows a "
                "reverse-charged client paying the whole 1,000.00. Carries all three tests.")
    rc_rule = " Credit notes and reverse-charged invoices have none." if n >= 124 else " Credit notes have none."
    return Spec('cp117_withholding', 'withholding tax', f"""
        A client can withhold tax (clients[].withholdingPct, on the client form): their invoices show the
        withholding, that percentage of the amount before tax rounded down to the cent, which the client
        never pays: the amount due, balance and everything worked out from what is owed leave it out, and
        the invoice is Paid once the rest is paid. Sending writes WITHHOLDING id=<id> amount=<withheld>.
        An instalment plan spreads the grand total less the withholding.{rc_rule}""",
        tests, n, copy_note=note)


cp(117, 'withholding', """
    Some clients have to withhold part of what they pay me and hand it to their tax office. Let me set a
    withholding percentage on the client form. Their invoices show the withholding: that percentage of
    the amount before tax, rounded down to the cent. The client never pays it: leave it out of the
    amount due, the client's balance and everything worked out from what's owed (late charges,
    instalment plans, the small-balance write-off), so the invoice is Paid once the rest is paid.
    Sending writes WITHHOLDING id=<invoice id> amount=<withheld>. Credit notes have no withholding.
""", s117)

# =============================================================================== cp118 minimum units
MCARD = [{'unitType': 'callout', 'unitPrice': 85, 'increment': 0.5, 'minUnits': 2},
         {'unitType': 'licence', 'minUnits': 5, 'tiers': [{'units': 10, 'unitPrice': 20}, {'unitPrice': 15}]}]


def s118(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=MCARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Call-out', 0.4, unitType='callout'), L(2, 'Call-out', 3.2, unitType='callout', discountPct=10),
           L(3, 'Licences', 3, unitType='licence'), L(4, 'Licences', 9, unitType='licence')])])
    a = plus(fx1, inv=[(1, dict(lineItems=[l if l['id'] != 3 else dict(l, qty=7) for l in fx1['invoices'][0]['lineItems']]))])
    t1 = T('bills at least the minimum units of a unit type', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 0.4 of a call-out is 0.5 in half steps, but a call-out is at least 2: billed 2 x 85.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line1.billedQty}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        // 3.2 -> 3.5 x 85.00 = 297.50, less its own 10%
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        // 3 licences are billed as the minimum 5 (units 1-5 at 20.00); the next line's 9 are units 6-14:
        // 5 x 20.00 + 4 x 15.00 = 160.00
        await expect(page.getByTestId('line-row-3').getByTestId('line-billed-qty')).toHaveText('{s:inv1.line3.billedQty}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{s:inv1.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // 7 licences are over the minimum: units 1-7, so the other line moves to units 8-16
        await page.getByTestId('line-row-3').getByTestId('line-edit').click();
        await page.getByTestId('line-form-qty').fill('7');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{after:inv1.line3.amount}'); // 7 x 20.00
        // 3 x 20.00 + 6 x 15.00
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{after:inv1.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{after:inv1.grand}');
""", after=a)
    return Spec('cp118_minimum_units', 'minimum units', """
        A rate card entry can have minimum units (clients[].rates[].minUnits): a line of that unit type
        is billed at least that many units, after rounding up to its increment. The billed quantity
        shows it, and the line is priced and counted through the tiers on it.""", [t1], n)


cp(118, 'minimum_units', """
    Some work has a minimum: a call-out is at least two hours, a licence order at least five. Let a rate
    card entry have minimum units: a line of that unit type is billed at least that many units, after
    rounding its quantity up to the increment. Show it as the billed quantity, and price the line, and
    count it through the tiers, on that.
""", s118)

# =============================================================================== cp119 net prices when reverse charged


def s119(n):
    fx1 = dict(asOf=SA, settings=RC, clients=[C(A, region='CA', taxNumber='CA2048163017', pricesIncludeTax=True),
                                             C(G, region='CA', pricesIncludeTax=True)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 107.25), L(2, 'Pens', 1, 10)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 107.25), L(4, 'Pens', 1, 10)])])
    t1 = T('a reverse-charged client pays the prices without their tax', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // the prices include California's 7.25%: 107.25 / 1.0725 = 100.00, 10.00 / 1.0725 = 9.32;
        // reverse charged, the client pays only the 109.32 net, and no tax is charged
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
        await expect(page.getByTestId('line-row-1').getByTestId('line-net')).toHaveText('{s:inv1.line1.net}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('{s:inv1.line2.net}');
""" + tax_lines('s', 1, (1, 2)) + """
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv1.net}');
        // without a tax number the same prices are paid in full, 7.93 of them tax
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
""")
    return Spec('cp119_net_prices_reverse_charge', 'net prices when reverse charged', """
        When a client whose prices include tax is reverse charged, the tax is taken out of their prices
        as usual (lines reconciled to the invoice tax) but not charged: they pay the net, the lines show
        their net and no tax, and the grand total is the amount before tax.""", [t1], n)


cp(119, 'net_prices_reverse_charge', """
    A reverse-charged client shouldn't pay tax that's built into my prices. When a client whose prices
    include tax is reverse charged, take the tax out of the prices exactly as usual (at their region's
    rate, reconciled to the cent) but don't charge it: they pay only the net. The lines show their net
    and no tax, the invoice tax is zero, and the grand total is the amount before tax.
""", s119)

# =============================================================================== cp120 cash rounds down


def s120(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Beans', 1, 11.25)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Beans', 1, 11.22)])])
    a = plus(fx1, payments=[P(1, 1, 12.35, SA, [(1, 12.35)], method='CASH')])
    t1 = T("cash always rounds down in the client's favour", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 12.38 in cash is 12.35 (half up would give 12.40)
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{s:inv1.cashDue}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{s:inv1.cashRounding}');
""" + cash_pay('12.35', SA) + """        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=1 amount=-0.03');
        // a cash rounding, not a small balance written off
        expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv1.writtenOff}');
        // 11.22 + 1.12 = 12.34 in cash is 12.30
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-cash-due')).toHaveText('{a:inv2.cashDue}');
        await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('{a:inv2.cashRounding}');
""", a=a)
    return Spec('cp120_cash_rounds_down', 'cash rounds down', """
        The amount due in cash is now always rounded down to the 0.05 below, in the client's favour,
        never up; a cash payment of that amount settles the invoice with the (negative) cash rounding,
        and nothing is written off.""", [t1], n)


cp(120, 'cash_rounds_down', """
    Rounding cash up upsets my clients. From now on round the amount due in cash down to the 0.05 below,
    always in the client's favour (12.38 is 12.35 in cash, 12.34 is 12.30). Paying exactly that in cash
    still settles the invoice, with the cash rounding written as before.
""", s120, type_='mutative', mutates=[109], algorithm='cash-rounding-revised', copies=['cp109_cash_payments'])

# =============================================================================== cp121 overtime
OCARD = [{'unitType': 'hour', 'unitPrice': 95}, {'unitType': 'visit', 'tiers': [{'units': 2, 'unitPrice': 80},
                                                                               {'unitPrice': 60}]}]


def s121(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=OCARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Visits', 3, unitType='visit'), L(2, 'Weekend visits', 2, unitType='visit', overtime=True),
           L(3, 'Support', 1, 33.33, overtime=True)], discountPct=5)])
    a = plus(fx1, lines=[(1, L(4, 'Night work', 2.25, unitType='hour', overtime=True))])
    t1 = T('charges overtime at time and a half', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // visits 1-3: 2 x 80.00 + 60.00 = 220.00; the weekend visits are units 4-5 at 60.00 x 1.5 = 90.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        // 33.33 x 1.5 = 49.995, a unit price of 50.00
        await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('{s:inv1.line3.unitPrice}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv1.discount}'); // 5% of 450.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        await page.getByTestId('line-form-description').fill('Night work');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('2.25');
        await page.getByTestId('line-form-overtime').check();
        await page.getByTestId('line-form-submit').click();
        // 95.00 x 1.5 = 142.50 an hour; 2.25 x 142.50 = 320.625
        await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('{a:inv1.line4.unitPrice}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{a:inv1.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
""", a=a)
    return Spec('cp121_overtime', 'overtime', """
        A line can be overtime (lineItems[].overtime, a box on the line form): its unit price, from the
        card, the price list or typed in, is 1.5 times the price, rounded half up to the cent; for a
        tiered unit type each band's price is, and overtime units count through the bands with the
        others. The line is then discounted, taxed and totalled as usual.""", [t1], n)


cp(121, 'overtime', """
    Work out of hours costs time and a half. Add an overtime box on the line form. An overtime line's
    unit price is 1.5 times its price (from the rate card, the price list or typed in), rounded half up
    to the cent; for a tiered unit type, each band's price is 1.5 times, and overtime units still count
    through the bands together with the other lines of that unit type. Discounts, tax and totals then
    work on the overtime amount.
""", s121)

# =============================================================================== cp122 interest cap by region
IC = {'lateInterestRate': 12, 'regionMaxInterest': {'NY': 9}}


def s122(n):
    capped_plan = n >= 148
    fx1 = dict(asOf='2026-04-30', settings=IC, clients=[C(A, region='NY'), C(G, region='CA'),
                                                        C(IN, region='NY', interestRate=18)], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 2, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)]),
        I(3, 3, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)])])
    t1 = T("caps late interest at the region's legal maximum", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // New York allows at most 9%: 1,000.00 x ((1 + 0.09/360)^53 - 1) from the end of grace (2026-03-08)
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        // California has no cap: the workspace's 12%
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        // Initech's own 18% is capped at New York's 9% too
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
        await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('{s:client3.overdue}');
""")
    fx2 = dict(asOf='2026-04-30', settings=IC, clients=[C(A, region='NY')], invoices=[
        I(4, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = num(V(fx2, n)['inv4.inst1.payment'])
    fx2['payments'] = [P(1, 1, first, '2026-02-27', [(4, first)])]
    plan_c = ("its own 12% is capped at 9% too: 1,000.00 x 0.0075 / (1 - 1.0075^-3) = 338.34, rounded up to "
              "339.00" if capped_plan else "the plan's own 12% stays: 340.0221 rounded up to 341.00")
    t2 = T('an overdue instalment earns interest at the capped rate', '@core', fx2, f"""
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-4').click();
        // {plan_c}
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{{s:inv4.inst1.payment}}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('{{s:inv4.inst2.interest}}');
        // instalment 2 (due 2026-03-31) is overdue from 2026-04-07: late interest at New York's 9%
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('{{s:inv4.inst2.lateInterest}}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{{s:inv4.interest}}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{{s:client1.overdue}}');
""")
    note = None
    if capped_plan:
        note = ("UPDATED for cp148 (mutates: [57, 122]): the regional cap now applies to an instalment plan's own "
                "rate too, so the New York plan at 12% is worked out at 9% (339.00 a month instead of 341.00). "
                "Carries both tests.")
    plan_rule = (" It also caps an instalment plan's own rate." if capped_plan else "")
    return Spec('cp122_interest_cap', 'interest cap by region', f"""
        A region can have a legal maximum interest rate (settings.regionMaxInterest, region -> annual %).
        Late interest for a client in that region, on invoices, instalments and released retention, is
        worked out at the lower of their usual rate (their own, else the workspace's) and the cap.{plan_rule}""",
        [t1, t2], n, copy_note=note)


cp(122, 'interest_cap', """
    Some regions cap the interest I can charge. Let the workspace record a region's legal maximum
    annual rate. Late interest for a client in that region (on invoices, overdue instalments and
    released retention) is worked out at the lower of their usual rate (their own, else the
    workspace's) and that cap, by the usual daily compounding.
""", s122)

# =============================================================================== cp123 volume discount
VD = {'taxRate': 10, 'usdPer': RATES, 'volumeDiscounts': [{'over': 1000, 'pct': 3}, {'over': 5000, 'pct': 6}]}


def s123(n):
    fx1 = dict(asOf=SA, settings=VD, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000), L(2, 'Hosting', 1, 200.5)], discountPct=2),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Build', 1, 1200)], discountPct=10),
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Build', 1, 5200)], discountCap=200),
        I(4, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Build', 1, 950)]),
        I(5, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(6, 'Build', 1, 1000)])])
    t1 = T('gives a volume discount on large invoices', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 1,200.50 is over 1,000.00: 3% (36.01) beats the invoice's own 2% (24.01)
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv1.discount}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('{s:inv1.line1.share}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('{s:inv1.line2.share}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // the invoice's own 10% is larger
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv2.discount}');
        // over 5,000.00: 6% of 5,200.00 = 312.00, held to the 200.00 cap
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv3.discount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv3.grand}');
        // exactly 1,000.00 is not over the threshold
        await page.getByTestId('invoice-row-5').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv5.discount}');
        // in euros the threshold is 1,000 / 1.10 = 909.09: €950.00 gets 3% (28.50)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv4.discount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv4.grand}');
""")
    return Spec('cp123_volume_discount', 'volume discount', """
        The workspace can give volume discounts (settings.volumeDiscounts: over, pct, the thresholds in US
        dollars converted to the client's currency at the issue date's rate, rounded down). An invoice
        whose subtotal is over a threshold gets the percentage of the highest one it passes, rounded down
        to the cent, as its discount when that is more than its own discount; it is then capped, split
        over the lines and taxed like any invoice discount.""", [t1], n)


cp(123, 'volume_discount', """
    Big orders get a volume discount. Let the workspace list thresholds with a percentage, for example
    over 1,000.00 3% and over 5,000.00 6% (in US dollars, converted to the client's currency at the
    issue date's rate and rounded down). An invoice whose subtotal is over a threshold gets the
    percentage of the highest threshold it passes, rounded down to the cent, as its discount whenever
    that is more than the invoice's own discount. It then works like any invoice discount: held to the
    discount cap, shared over the lines, and taken off before tax.
""", s123)

# =============================================================================== cp124 reverse charge needs the region's number


def s124(n):
    fx1 = dict(asOf=SA, settings=dict(RC, taxRate=10), clients=[
        C(A, region='CA', taxNumber='NY1234567894'), C(G, region='CA', taxNumber='CA2048163017', withholdingPct=10)],
        invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 1000)]),
                  I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 1000)])])
    t1 = T("reverse charges only a number from the client's own region, with no withholding", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // a valid number, but a New York one for a California client: taxed at 7.25%
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // reverse charged: no tax, and nothing withheld either
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv2.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
""")
    return Spec('cp124_reverse_charge_region_number', "reverse charge needs the region's number", """
        A client is reverse charged only when their valid tax number's two letters are the region they
        are taxed in. A reverse-charged invoice has no withholding.""", [t1], n)


cp(124, 'reverse_charge_region_number', """
    Tighten the reverse charge. A client only counts as registered in their region when their tax
    number's two letters are that region's code (and the number passes its check), so a California
    client quoting a New York number is taxed in California as usual. And a reverse-charged invoice
    carries no withholding: the client pays it all.
""", s124, type_='mutative', mutates=[102, 117], copies=['cp102_reverse_charge', 'cp117_withholding'])

# =============================================================================== cp125 client minimum charge


def s125(n):
    fx1 = dict(asOf=SA, settings=MC, clients=[C(A, region='NY', minimumCharge=0), C(G, currency='EUR', minimumCharge=40),
                                              C(IN, region='NY')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 30)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 30)]),
        I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 30)])])
    t1 = T("a client's own minimum charge replaces the workspace's", '@core', fx1, """
        // Acme's minimum is 0: no minimum charge at all
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv1.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // Globex's own €40.00, in its currency, not the workspace's $50.00 converted (€45.45)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv2.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}'); // 40.00 + 10%
        // no minimum of its own: the workspace's 50.00
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv3.minimumCharge}');
""")
    fx2 = dict(asOf=SA, settings=MC, clients=[A])
    d = plus(fx2, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', minimumCharge=75)])
    d['invoices'] = [I(1, 2, 'DRAFT', SA, '2026-04-30', [L(1, 'Design', 1, 60)])]
    t2 = T('sets a minimum charge when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-minimum-charge').fill('75');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Design');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-unit-price').fill('60');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{d:inv1.minimumCharge}'); // 75.00 - 60.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{d:inv1.grand}'); // 75.00 + 10%
""", d=d)
    return Spec('cp125_client_minimum_charge', 'client minimum charge', """
        A client can have their own minimum charge (clients[].minimumCharge, on the client form), in their
        own currency with no conversion; it replaces the workspace's for their invoices, and 0 means no
        minimum charge at all.""", [t1, t2], n)


cp(125, 'client_minimum_charge', """
    Let me set a client's own minimum charge on the client form. It's in the client's own currency (no
    conversion) and replaces the workspace minimum for their invoices; a minimum of 0 means they never
    get a minimum charge.
""", s125)

# =============================================================================== cp126 rate form


def rate_form(unit, price):
    return f"""        await page.getByTestId('rate-form-unit').fill('{unit}');
        await page.getByTestId('rate-form-price').fill('{price}');
        await page.getByTestId('rate-form-submit').click();
"""


def s126(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=[{'unitType': 'hour', 'unitPrice': 95}])], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Consulting', 2, unitType='hour')]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Support', 1, unitType='hour'), L(3, 'Design', 1, 100)])])
    sent = plus(fx1, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30',
                                   lineItems=[L(2, 'Support', 1, 95, unitType='hour'), L(3, 'Design', 1, 100)]))])
    after = copy.deepcopy(sent)
    after['clients'][0]['rates'] = [{'unitType': 'hour', 'unitPrice': 110}, {'unitType': 'day', 'unitPrice': 700}]
    after['invoices'][0]['lineItems'].append(L(4, 'Workshop', 1, unitType='day'))
    t1 = T("changing a rate reprices drafts but not sent invoices", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv2.status}');
""" + rate_form('hour', '110') + rate_form('day', '700') + """        // the draft's hours follow the card: 2 x 110.00
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('{after:inv1.line1.unitPrice}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{after:inv1.line1.amount}');
        await page.getByTestId('line-form-description').fill('Workshop');
        await page.getByTestId('line-form-unit-type').fill('day');
        await page.getByTestId('line-form-qty').fill('1');
        await page.getByTestId('line-form-submit').click();
        await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('{after:inv1.line4.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{after:inv1.grand}'); // (220.00 + 700.00) + 10%
        // the sent invoice keeps the 95.00 it was sent with
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-unit-price')).toHaveText('{after:inv2.line2.unitPrice}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{after:inv2.grand}'); // (95.00 + 100.00) + 10%
        await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('{after:client1.balance}');
""", sent=sent, after=after)
    fx2 = dict(asOf=SA, settings=T10, clients=[C(A, rates=[{'unitType': 'hour', 'unitPrice': 95}])], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Consulting', 2, unitType='hour')])])
    t2 = T('refuses a rate without a unit type or a price above zero', '@error', fx2, """
        await page.getByTestId('client-row-1').click();
""" + rate_form('', '100') + """        await expect(page.getByTestId('rate-form-error')).toBeVisible();
""" + rate_form('hour', '0') + """        await expect(page.getByTestId('rate-form-error')).toBeVisible();
""" + rate_form('hour', '12.345') + """        await expect(page.getByTestId('rate-form-error')).toBeVisible();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}'); // 2 x 95.00
""")
    return Spec('cp126_rate_form', 'editing the rate card', """
        With a client selected, the rate form (unit type and price) adds a rate to their card or
        replaces the one for that unit type. Lines of the client's draft invoices priced from the card
        are repriced straight away; a sent invoice keeps the prices it was sent with (sending stores
        each card price on its line). A rate needs a unit type and a price above zero with at most two
        decimals.""", [t1, t2], n)


cp(126, 'rate_form', """
    Let me edit a client's rate card on the workspace: with a client selected, a rate form with a unit
    type and a price adds that rate to their card, or replaces the price for that unit type. Their
    draft invoices' lines priced from the card are repriced straight away, with everything that follows
    from them (discounts, charges, tax, totals). An invoice that has been sent keeps the prices it was
    sent with: sending fixes each card price on its line. Refuse a rate with no unit type, or a price
    that isn't above zero with at most two decimals.
""", s126)

# =============================================================================== cp127 unit-type tax rate
BCARD = [{'unitType': 'book', 'unitPrice': 12.5, 'taxRate': 5}, {'unitType': 'hour', 'unitPrice': 95}]


def s127(n):
    fx1 = dict(asOf=SA, settings=RT, clients=[C(A, region='NY', rates=BCARD), C(G, region='NY', rates=BCARD,
                                                                                 pricesIncludeTax=True)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Books', 3, unitType='book'), L(2, 'Consulting', 2, unitType='hour'),
           L(3, 'Gift book', 1, unitType='book', taxRate=0)], discountPct=4),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Books', 3, unitType='book'), L(5, 'Consulting', 2, unitType='hour')])])
    t1 = T('taxes a unit type at its own rate', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // books are taxed at the card's 5% instead of New York's 8.875%; the gift book's own 0% wins
""" + tax_lines('s', 1, (1, 2, 3)) + """
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // prices including tax: the books' 5% is taken out on its own (37.50 - 37.50 / 1.05 = 1.79)
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + tax_lines('s', 2, (4, 5)) + """
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        await expect(page.getByTestId('invoice-net')).toHaveText('{s:inv2.net}');
""")
    return Spec('cp127_unit_type_tax_rate', 'tax rate by unit type', """
        A rate card entry can carry a tax rate (clients[].rates[].taxRate): lines of that unit type are
        taxed at it instead of the client's regional or workspace rate, unless the line has its own rate.
        It is a rate like any other in the tax worked out per rate, and for prices that include tax.""",
        [t1], n)


cp(127, 'unit_type_tax_rate', """
    Some things I sell are taxed at a reduced rate. Let a rate card entry carry its own tax rate: lines
    of that unit type are taxed at it instead of the client's regional or workspace rate, unless the
    line has a rate of its own. It's a rate like any other when the tax is worked out per rate, and when
    the tax is taken out of prices that include it.
""", s127)

# =============================================================================== cp128 no more late fees (the reversal)


def s128(n):
    st = {'lateInterestRate': 12}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)])])
    a = plus(fx1, payments=[P(1, 1, 500, '2026-04-30', [(1, 500)])])
    w = plus(a, inv=[(1, dict(interestWaivedOn='2026-04-30'))])
    t1 = T('an overdue invoice is charged interest but no late fee', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // overdue since 2026-03-09: interest on the 1,000.00 from the end of grace (53 days), no fee
        await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}'); // 1,000.00 + 17.82
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        // a payment pays the invoice first, then the interest
        await page.getByTestId('payment-form-amount').fill('500');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}'); // 500.00 + 17.82
        // waiving writes off the interest alone
        await page.getByTestId('invoice-waive').click();
        await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount={w:inv1.waived|plain}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{w:inv1.due}');
""", a=a, w=w)
    fx2 = dict(asOf='2026-04-30', settings=st, clients=[A], invoices=[
        I(2, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12)])
    first = num(V(fx2, n)['inv2.inst1.payment'])
    fx2['payments'] = [P(1, 1, first, '2026-02-27', [(2, first)])]
    t2 = T('an overdue instalment is charged no late fee', '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // instalment 2 (due 2026-03-31) is overdue: late interest only
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{s:inv2.inst2.status}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-fee')).toHaveCount(0);
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('{s:inv2.inst2.lateInterest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
""")
    return Spec('cp128_no_late_fees', 'no more late fees', """
        No late fee is charged any more, on invoices or instalments: the late fee figures are gone from
        the panel and the instalment rows, and the workspace has no late fee setting. Overdue invoices
        and instalments still earn late interest; a payment pays what the invoice (or instalment) owes
        first, then the interest, and waiving writes off the unpaid interest.""", [t1, t2], n)


cp(128, 'no_late_fees', """
    Late fees cause more arguments than they bring in. Stop charging them altogether, on invoices and on
    instalments: remove the late fee from the invoice panel and the instalment rows, and drop the late
    fee setting. Late interest stays exactly as it is. A payment now pays what the invoice (or
    instalment) itself owes first and then its late interest, and waiving writes off the unpaid
    interest.
""", s128, type_='mutative', mutates=[65, 70, 91, 95, 96, 100], retires=[
    'cp65_late_fee.spec.ts::charges a late fee once an invoice is overdue',
    'cp70_waive_interest.spec.ts::waives the late interest and fee charged so far',
    'cp91_late_fee_cap.spec.ts::never charges a late fee of more than a tenth of the invoice',
    'cp95_instalment_late_fee.spec.ts::charges the late fee on an overdue instalment',
    'cp100_late_fee_percentage.spec.ts::charges 2% of what is owed, at least $10.00'])

# =============================================================================== cp129 interest threshold


def s129(n):
    st = {'usdPer': RATES, 'lateInterestRate': 12, 'interestThreshold': 5}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, KK], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-01', [L(2, 'Design', 1, 200)]),
        I(3, 3, 'SENT', '2026-02-15', '2026-03-15', [L(3, 'Consulting', 1, 50000)])])
    a = plus(fx1, payments=[P(1, 1, 200, '2026-04-30', [(2, 200)])])
    t1 = T('charges no late interest until it reaches the threshold', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 17.82 of interest is over the 5.00 threshold: all of it is owed
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        // 22 days on 200.00 from 2026-04-08 is 1.47, under 5.00: nothing is charged yet
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv2.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        // paying the 200.00 clears it: the interest under the threshold is never collected
        await page.getByTestId('payment-form-amount').fill('200');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv2.status}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv2.due}');
        // in yen the threshold is 5 / 0.0066 = 757.57, down to 757; 39 days on 50,000 is 652 yen
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{a:inv3.interest}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv3.due}');
""", a=a)
    return Spec('cp129_interest_threshold', 'late interest threshold', """
        Late interest on an invoice (without a plan) is only charged once its total reaches the workspace
        threshold (settings.interestThreshold, in US dollars converted at the issue date's rate, rounded
        down). Below it the invoice shows no interest and none is owed: a payment of what the invoice
        itself owes settles it. From the threshold on, all of its interest is owed as usual.""", [t1], n)


cp(129, 'interest_threshold', """
    Now that late interest is the only late charge, don't bother with tiny amounts of it. Set a
    threshold in US dollars (converted to the client's currency at the invoice's issue-date rate,
    rounded down). Until an invoice's late interest adds up to the threshold, it shows no interest and
    none is owed, so paying what the invoice itself owes settles it and the interest is never
    collected. Once its interest reaches the threshold, all of it is owed as usual. This is for
    invoices without an instalment plan.
""", s129)

# =============================================================================== cp130 conversion fee


def s130(n):
    st = {'usdPer': RATES, 'fxFeePct': 1.5, 'cardSurchargePct': 2.5}
    fx1 = dict(asOf=SA, settings=st, clients=[A, HV, KK], invoices=[
        I(1, 5, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(2, 3, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Consulting', 1, 20000)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 200)])])
    a = pay_applied(fx1, P(1, 5, 100, SA, [], currency='EUR'), 1, n)
    b = pay_applied(a, P(2, 3, 100, SA, [], currency='USD'), 2, n)
    c = pay_applied(b, P(3, 1, 100, SA, [], currency='EUR', method='CARD'), 3, n)
    t1 = T('takes a conversion fee off a payment in another currency', '@core', fx1, """
        await page.getByTestId('client-row-5').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        // 100 x 1.10 / 1.13 = 97.345, down to CHF 97.30; 1.5% of that is 1.4595 -> 1.46; 95.84 is applied
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-fx-fee')).toHaveText('{a:pay1.fxFee}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{a:inv1.paid}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        await expect.poll(() => auditLines()).toContain('FX_FEE payment=1 amount={a:pay1.fxFee|plain}');
        // $100 for yen: 100 / 0.0066 = 15,151.5, down to 15,151; 1.5% = 227.265 -> 227; 14,924 applied
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('payment-form-currency').selectOption('USD');
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-row-2').getByTestId('payment-fx-fee')).toHaveText('{b:pay2.fxFee}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv2.due}');
        // €100 by card for a dollar client: $110.00 converted; the 1.65 fee and the 2.68 card surcharge
        // (110 - 110 / 1.025 = 2.68) both come off it, leaving 105.67 to pay the invoice
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('payment-form-method').selectOption('CARD');
        await page.getByTestId('payment-form-currency').selectOption('EUR');
        await page.getByTestId('payment-form-amount').fill('100');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-row-3').getByTestId('payment-fx-fee')).toHaveText('{c:pay3.fxFee}');
        await expect(page.getByTestId('payment-row-3').getByTestId('payment-surcharge')).toHaveText('{c:pay3.surcharge}');
        await expect(page.getByTestId('payment-row-3').getByTestId('payment-allocated')).toHaveText('{c:inv3.paid}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{c:inv3.due}');
""", a=a, b=b, c=c)
    return Spec('cp130_conversion_fee', 'conversion fee', """
        A payment in a currency other than the client's loses the workspace's conversion fee
        (settings.fxFeePct): that percentage of the converted amount, rounded half up to the client's
        currency (whole yen), shown on the payment row and written as FX_FEE payment=<id> amount=<fee>.
        Only the rest pays invoices or is held as credit; a card payment loses its card surcharge, worked
        out on the converted amount, as well.""", [t1], n)


cp(130, 'conversion_fee', """
    My bank charges me for converting foreign payments, so pass it on. When a client pays in a currency
    other than their own, take the workspace's conversion fee off it: that percentage of the converted
    amount, rounded half up (whole yen for yen clients). Show the fee on the payment row and write
    FX_FEE payment=<payment id> amount=<fee> before its PAYMENT_RECORDED lines. Only the rest pays
    invoices, counts towards the minimum part payment, or is held as credit. A foreign card payment
    loses both: the card surcharge is worked out on the converted amount too.
""", s130)

# =============================================================================== cp131 dated rate card
DCARD = [{'unitType': 'hour', 'unitPrice': 95}, {'unitType': 'hour', 'unitPrice': 105, 'from': '2026-04-01'},
         {'unitType': 'licence', 'tiers': [{'units': 10, 'unitPrice': 20}, {'unitPrice': 15}]},
         {'unitType': 'licence', 'from': '2026-04-01', 'tiers': [{'units': 10, 'unitPrice': 22}, {'unitPrice': 16}]}]


def s131(n):
    fx1 = dict(asOf='2026-04-10', settings=T10, clients=[C(A, rates=DCARD)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-20', '2026-04-30', [L(1, 'Consulting', 2, unitType='hour'),
                                                      L(2, 'Licences', 12, unitType='licence')]),
        I(2, 1, 'SENT', '2026-03-15', '2026-04-30', [L(3, 'Consulting', 2, unitType='hour')])])
    sent = plus(fx1, inv=[(1, dict(status='SENT', issueDate='2026-04-10', dueDate='2026-05-31'))])
    t1 = T('prices a line at the rate in force on the issue date', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // issued on 2026-03-20, before the new rates of 2026-04-01: 2 x 95.00, and 10 x 20.00 + 2 x 15.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        await page.getByTestId('invoice-send').click();
        // sent today, 2026-04-10: 2 x 105.00, and 10 x 22.00 + 2 x 16.00
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('{sent:inv1.line1.unitPrice}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{sent:inv1.line1.amount}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{sent:inv1.line2.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{sent:inv1.grand}'); // (210.00 + 252.00) + 10%
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number={sent:inv1.number} total={sent:inv1.grand|plain}');
        // invoice 2 was issued on 2026-03-15 at 95.00 an hour
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{sent:inv2.line3.amount}');
""", sent=sent)
    return Spec('cp131_dated_rates', 'dated rates', """
        A rate card or price list entry can take effect from a date (rates[].from); an entry with no date
        has always applied. A line is priced at the entry for its unit type in force on the invoice's
        issue date (the latest one from on or before it), so sending a draft, which makes it issued
        today, prices it at today's rates, and the sent invoice then keeps them.""", [t1], n)


cp(131, 'dated_rates', """
    My rates go up from time to time. Let a rate card or price list entry take effect from a date (an
    entry without a date has always applied). Price a line at the entry for its unit type in force on
    the invoice's issue date: the latest one from on or before that date, single price or tiers. Since
    sending a draft makes it issued today, sending prices it at today's rates, and the sent invoice
    keeps them.
""", s131)

# =============================================================================== cp132 negotiated rates take no invoice discount


def s132(n):
    st = dict(VD, rates=PL)
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, rates=[{'unitType': 'hour', 'unitPrice': 95}])], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Consulting', 10, unitType='hour'), L(2, 'Licences', 12, unitType='licence'), L(3, 'Hardware', 1, 300),
           L(4, 'Cabling', 1, 120.4)], discountPct=10)])
    t1 = T('takes the invoice discount off lines not priced from a rate card', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 950.00 + 230.00 + 300.00 + 120.40 = 1,600.40; the discount is 10% of the 420.40 not priced from
        // the card or the price list: 42.04 (the 3% volume discount, 12.61, is smaller)
        await expect(page.getByTestId('invoice-subtotal')).toHaveText('{s:inv1.subtotal}');
        await expect(page.getByTestId('invoice-discount')).toHaveText('{s:inv1.discount}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('{s:inv1.line1.share}');
        await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('{s:inv1.line2.share}');
        await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('{s:inv1.line3.share}');
        await expect(page.getByTestId('line-row-4').getByTestId('line-discount-share')).toHaveText('{s:inv1.line4.share}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
""")
    return Spec('cp132_rates_not_discounted', 'rate-card lines take no invoice discount', """
        Lines priced from a rate card or the price list are already at a negotiated price: the invoice
        discount (a percentage, a fixed amount or the volume discount) is worked out on, and shared over,
        the other lines only. Their own line discounts still apply, and the volume threshold still looks
        at the whole subtotal.""", [t1], n)


cp(132, 'rates_not_discounted', """
    Rate-card prices are already negotiated, so don't discount them again. The invoice discount, whether
    a percentage, a fixed amount or the volume discount, is now worked out on the lines that are not
    priced from a rate card or the price list, and shared over those lines only. A line's own discount
    still applies, and the volume thresholds still look at the whole subtotal.
""", s132, type_='mutative', mutates=[103, 105, 121, 127],
   copies=['cp103_rate_card', 'cp105_tiered_rates', 'cp121_overtime', 'cp127_unit_type_tax_rate'])

# =============================================================================== cp133 monthly volume


def s133(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=TCARD)], invoices=[
        I(1, 1, 'SENT', '2026-03-02', '2026-04-30', [L(1, 'Licences', 30, unitType='licence')]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(2, 'Licences', 25, unitType='licence')]),
        I(3, 1, 'SENT', '2026-02-20', '2026-03-31', [L(3, 'Licences', 40, unitType='licence')]),
        I(4, 1, 'VOID', '2026-03-03', '2026-04-30', [L(4, 'Licences', 15, unitType='licence')])])
    sent = plus(fx1, inv=[(2, dict(status='SENT', issueDate=SA, dueDate='2026-04-30'))])
    t1 = T("counts the units already billed to the client this month", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        // invoice 1, the first in March: units 1-30 = 10 x 20.00 + 20 x 15.00
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        // invoice 2 carries on from unit 31: 20 x 15.00 + 5 x 12.00 = 360.00 (on its own it would be 425.00);
        // February's invoice and the void one don't count
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv2.line2.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        await page.getByTestId('invoice-send').click();
        // sent today, still in March and after invoice 1
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{sent:inv2.line2.amount}');
        await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number={sent:inv2.number} total={sent:inv2.grand|plain}');
        // February's 40 licences were priced on their own: 10 x 20.00 + 30 x 15.00
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{sent:inv3.line3.amount}');
""", sent=sent)
    return Spec('cp133_monthly_volume', 'volume across the month', """
        A tiered unit type's bands count the client's whole month: units of it already billed on the
        client's other sent invoices issued earlier in the same calendar month (on the same date, the
        lower invoice id first) come first, and the invoice's own lines carry on through the bands from
        there. Drafts, void invoices and credit notes don't count; sending a draft dates it today.""",
        [t1], n)


cp(133, 'monthly_volume', """
    Volume pricing should reward a client's whole month, not one invoice. When pricing a tiered unit
    type, count first the units of it already billed on the client's other sent invoices issued earlier
    in the same calendar month (on the same date, the lower invoice id first); this invoice's lines then
    carry on through the bands from there. Drafts, void invoices and credit notes don't count, and
    remember that sending a draft dates it today.
""", s133)

# =============================================================================== cp134 client discount on rates


def s134(n):
    st = {'taxRate': 10, 'usdPer': RATES, 'rates': PL}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, rates=[{'unitType': 'hour', 'unitPrice': 95}], rateDiscountPct=7.5),
                                              C(KK, rateDiscountPct=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Consulting', 4, unitType='hour'), L(2, 'Licences', 12, unitType='licence'),
           L(3, 'Support', 2, 80, unitType='hour'), L(4, 'Night work', 1, unitType='hour', overtime=True)]),
        I(2, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Consulting', 3, unitType='hour')])])
    t1 = T("takes the client's discount off their rates", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 7.5% off the card's 95.00 = 87.875 -> 87.88 an hour
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('{s:inv1.line1.unitPrice}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}'); // 4 x 87.88
        // price-list bands too: 20.00 -> 18.50 and 15.00 -> 13.875 -> 13.88; 10 x 18.50 + 2 x 13.88
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv1.line2.amount}');
        // a price typed in is not discounted
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv1.line3.amount}');
        // overtime on the discounted rate: 87.88 x 1.5 = 131.82
        await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('{s:inv1.line4.unitPrice}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // yen: $120.00 is 18,181 yen; 10% off is 16,362.9 -> 16,363
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-5').getByTestId('line-unit-price')).toHaveText('{s:inv2.line5.unitPrice}');
        await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('{s:inv2.line5.amount}');
""")
    fx2 = dict(asOf=SA, settings=st, clients=[A])
    d = plus(fx2, clients=[dict(id=2, name='Umbrella Co', email='ap@umbrella.example', rateDiscountPct=5)])
    d['invoices'] = [I(1, 2, 'DRAFT', SA, '2026-04-30', [L(1, 'Consulting', 2, unitType='hour')])]
    t2 = T('sets a rate discount when adding a client', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Umbrella Co');
        await page.getByTestId('client-form-email').fill('ap@umbrella.example');
        await page.getByTestId('client-form-rate-discount-pct').fill('5');
        await page.getByTestId('client-form-submit').click();
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-new').click();
        await page.getByTestId('line-form-description').fill('Consulting');
        await page.getByTestId('line-form-unit-type').fill('hour');
        await page.getByTestId('line-form-qty').fill('2');
        await page.getByTestId('line-form-submit').click();
        // the price list's 120.00 less 5% = 114.00 an hour
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{d:inv1.line1.amount}');
""", d=d)
    return Spec('cp134_rate_discount', 'discount on rates', """
        A client can have a discount on rates (clients[].rateDiscountPct, on the client form): every price
        a line takes from their rate card or the price list, each band's price included, is reduced by
        that percentage, rounded half up to the cent (whole yen) per unit, after conversion and before
        overtime. Prices typed on a line are not reduced.""", [t1, t2], n)


cp(134, 'rate_discount', """
    Some clients have negotiated a discount on my rates. Let me set a rate discount percentage on the
    client form: every price a line takes from their rate card or the price list, each tier band's price
    included, is reduced by that percentage, rounded half up to the cent (whole yen for yen clients) per
    unit, after converting a price-list price to their currency and before any overtime. A price typed
    on the line is not reduced, and these lines still take no invoice discount.
""", s134)

# =============================================================================== cp135 exemption expiry


def s135(n):
    fx1 = dict(asOf='2026-04-10', settings=T10, clients=[C(A, taxExempt=True, taxExemptUntil='2026-03-31')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-20', '2026-04-30', [L(1, 'Catering', 1, 400), L(2, 'Wine', 1, 40, taxRate=12.5)]),
        I(2, 1, 'SENT', '2026-03-15', '2026-04-30', [L(3, 'Catering', 1, 400)]),
        I(3, 1, 'SENT', '2026-04-05', '2026-04-30', [L(4, 'Catering', 1, 100)], creditOf=2)])
    sent = plus(fx1, inv=[(1, dict(status='SENT', issueDate='2026-04-10', dueDate='2026-05-31'))])
    t1 = T('a tax exemption ends on its expiry date', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // issued 2026-03-20, inside the exemption: only the wine's own 12.5% (5.00)
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await page.getByTestId('invoice-send').click();
        // issued today, after the exemption ended on 2026-03-31: 10% on the catering, 12.5% on the wine
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{sent:inv1.grand}');
        // invoice 2 was issued inside it; its April credit note is treated like it
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv2.tax}');
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv3.tax}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv2.due}'); // 400.00 - 100.00
""", sent=sent)
    fx2 = dict(asOf=SA, settings=T10, clients=[A])
    d = plus(fx2, clients=[dict(id=2, name='Food Bank', email='office@foodbank.example', taxExempt=True,
                                taxExemptUntil='2026-12-31')])
    t2 = T('records when an exemption ends', '@core', fx2, """
        await page.getByTestId('client-form-name').fill('Food Bank');
        await page.getByTestId('client-form-email').fill('office@foodbank.example');
        await page.getByTestId('client-form-tax-exempt').check();
        await page.getByTestId('client-form-exempt-until').fill('2026-12-31');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Food Bank');
        // an end date without the exemption ticked is refused
        await page.getByTestId('client-form-name').fill('Initech');
        await page.getByTestId('client-form-email').fill('ap@initech.example');
        await page.getByTestId('client-form-tax-exempt').uncheck();
        await page.getByTestId('client-form-exempt-until').fill('2026-12-31');
        await page.getByTestId('client-form-submit').click();
        await expect(page.getByTestId('client-form-error')).toBeVisible();
        await expect(page.getByTestId('client-row-3')).toHaveCount(0);
""", d=d)
    return Spec('cp135_exemption_expiry', 'tax exemption expiry', """
        A tax exemption can end (clients[].taxExemptUntil, the date box next to the exemption on the
        client form, refused without the exemption): the client is exempt only on invoices issued on or
        before that date, so sending a draft after it, which dates it today, taxes it. A credit note is
        treated like the invoice it credits.""", [t1, t2], n)


cp(135, 'exemption_expiry', """
    Tax exemption certificates expire. Let me give a tax-exempt client an exemption end date on the
    client form (refuse an end date if the client isn't marked exempt). The client is exempt only on
    invoices issued on or before that date; later invoices are taxed as usual. Sending a draft dates it
    today, so a draft sent after the end date is taxed. A credit note is treated like the invoice it
    credits.
""", s135)

# =============================================================================== cp136 minimum part payment of what is due


def s136(n):
    st = {'cardSurchargePct': 2.5}
    fx1 = dict(asOf=SA, settings=st, clients=[A], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1000)])],
        payments=[P(1, 1, 600, '2026-03-05', [(1, 600)])])
    a = plus(fx1, payments=[P(2, 1, 40, SA, [(1, 40)])])
    b = plus(a, payments=[P(3, 1, 36.9, SA, [(1, 36)], method='CARD')])
    t1 = T('a part payment must be a tenth of what is still due', '@error', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 400.00 is still due: the minimum is 40.00 (a tenth of the 1,000.00 total would be 100.00)
        await page.getByTestId('payment-form-amount').fill('39.99');
        await page.getByTestId('payment-form-date').fill('2026-03-10');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('payment-form-error')).toBeVisible();
        await page.getByTestId('payment-form-amount').fill('40');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv1.due}');
        // now a tenth of 360.00 = 36.00 must reach the invoice: 36.85 by card is only 35.95 after the surcharge
""" + cash_pay('36.85', SA, 'CARD') + """        await expect(page.getByTestId('payment-form-error')).toBeVisible();
""" + cash_pay('36.90', SA, 'CARD') + """        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{b:inv1.due}'); // 360.00 - 36.00
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{b:inv1.status}');
""", a=a, b=b)
    return Spec('cp136_minimum_part_of_due', 'minimum part payment of what is due', """
        A part payment must now bring at least 10% of what the invoice still owes (its amount due) to
        it, rather than 10% of its grand total, unless it settles it; what reaches the invoice is what
        counts, after any card surcharge or conversion fee.""", [t1], n)


cp(136, 'minimum_part_of_due', """
    The minimum part payment is too high once an invoice is mostly paid. Make it 10% of what the invoice
    still owes (its amount due when the payment arrives) instead of 10% of its grand total. A payment
    that settles the invoice is still always accepted, and what counts is what reaches the invoice,
    after any card surcharge or conversion fee.
""", s136, type_='mutative', mutates=[43])

# =============================================================================== cp137 place of supply


def s137(n):
    st = dict(RC, taxRate=10)
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='CA'), C(G, region='CA', taxNumber='CA2048163017')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Installation', 1, 1000)]),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Installation', 1, 1000)]),
        I(3, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Installation', 1, 1000)], supplyRegion='OR')])
    a = plus(fx1, inv=[(1, dict(supplyRegion='NY')), (2, dict(supplyRegion='NY'))])
    t1 = T('taxes an invoice where the work was done', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}'); // California's 7.25%
        await page.getByTestId('invoice-supply-region').fill('NY');
        await page.getByTestId('invoice-supply-region-submit').click();
        // done in New York: 8.875%
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{a:inv1.grand}');
        // done in Oregon: no tax
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv3.tax}');
        // Globex is reverse charged in California, but work done in the home region is taxed there
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
        await page.getByTestId('invoice-supply-region').fill('NY');
        await page.getByTestId('invoice-supply-region-submit').click();
        await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{a:inv2.tax}');
""", a=a)
    return Spec('cp137_place_of_supply', 'place of supply', """
        A draft invoice can name the region where the work is done (invoices[].supplyRegion, the place of
        supply box on the panel). It is then taxed at that region's rate, and reverse charged only when
        that region is not the home region (with the client's valid number for it); without one, the
        client's region applies.""", [t1], n)


cp(137, 'place_of_supply', """
    When I do work on site in another region, that region's tax applies. Let me set the place of supply
    on a draft invoice (a region box on the panel). The invoice is then taxed at that region's rate
    instead of the client's, and the reverse charge depends on that region: work done in the home
    region is taxed even for a registered client, and the client's tax number must be for the region
    of supply. Without a place of supply, the client's region applies as before.
""", s137)

# =============================================================================== cp138 credit notes and surcharges


def s138(n):
    fx1 = dict(asOf=SA, settings=dict(RT, minimumCharge=50), clients=[C(A, region='NY')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 4, 50), L(2, 'Hosting', 1, 30)], surchargePct=10),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Design', 1, 50, creditOfLine=1)], creditOf=1)])
    sent = plus(fx1, inv=[(2, dict(status='SENT', issueDate=SA))])
    t1 = T('a credit note gives back the surcharge on what it credits', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // crediting 50.00 of design: 10% surcharge on it is 5.00, and 8.875% on 55.00 is 4.88125
        await expect(page.getByTestId('invoice-surcharge')).toHaveText('{s:inv2.surcharge}');
        await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('{s:inv2.minimumCharge}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}');
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={sent:inv2.number} invoice=1 total={sent:inv2.grand|plain}');
        await page.getByTestId('invoice-row-1').click();
        // 230.00 + 23.00 + 8.875% = 275.45; less the 59.88 credited
        await expect(page.getByTestId('invoice-credited')).toHaveText('{sent:inv1.credited}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
""", sent=sent)
    return Spec('cp138_credit_note_surcharge', 'credit notes and surcharges', """
        A credit note against an invoice with a surcharge carries the same surcharge percentage on what it
        credits (rounded down to the cent, taxed like the original's), so the surcharge is given back in
        proportion. A credit note never gets a minimum charge.""", [t1], n)


cp(138, 'credit_note_surcharge', """
    When I credit part of a surcharged invoice, give back the surcharge on that part too. A credit note
    against an invoice with a surcharge carries the same surcharge percentage on what it credits
    (rounded down to the cent, and taxed at the same rate as the original's surcharge). Credit notes
    still never get a minimum charge.
""", s138)

# =============================================================================== cp139 regional grace


def s139(n):
    st = {'lateInterestRate': 12, 'regionGraceDays': {'NY': 30, 'OR': 0}}
    fx1 = dict(asOf='2026-03-20', settings=st, clients=[C(A, region='NY'), C(G, region='OR'),
                                                         C(IN, region='NY', graceDays=3)], invoices=[
        I(1, 1, 'SENT', '2026-02-01', '2026-03-01', [L(1, 'Build', 1, 1000)]),
        I(2, 2, 'SENT', '2026-02-01', '2026-03-01', [L(2, 'Build', 1, 1000)]),
        I(3, 3, 'SENT', '2026-02-01', '2026-03-01', [L(3, 'Build', 1, 1000)])])
    t1 = T("gives a region's statutory grace period", '@core', fx1, """
        // New York gives 30 days: due 2026-03-01, not overdue until after 2026-03-31
        await page.getByTestId('client-row-1').click();
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('{s:inv1.status}');
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        // Oregon gives none: interest from the due date, 19 days on 1,000.00 at 12%
        await page.getByTestId('client-row-2').click();
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('{s:inv2.status}');
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv2.interest}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('{s:client2.overdue}');
        // a client's own grace still wins: Initech's 3 days, 16 days of interest
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{s:inv3.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv3.interest}');
""")
    return Spec('cp139_region_grace', 'regional grace periods', """
        A region can set a statutory grace period (settings.regionGraceDays, region -> days). A client in
        that region without a grace period of their own gets it instead of the usual 7 days, for when
        their invoices, instalments and released retention become overdue and when late interest starts.""",
        [t1], n)


cp(139, 'region_grace', """
    Some regions require a longer, or allow a shorter, grace period. Let the workspace set a grace
    period per region. A client in that region who has no grace period of their own gets the region's
    instead of the usual 7 days: it decides when their invoices, instalments and released retention
    become overdue and when late interest starts.
""", s139)

# =============================================================================== cp140 write off only under five cents


def s140(n):
    fx1 = dict(asOf=SA, settings={'usdPer': RATES}, clients=[A, KK], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 100)]),
        I(2, 1, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 100)]),
        I(3, 3, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Consulting', 1, 5000)]),
        I(4, 3, 'SENT', '2026-03-01', '2026-04-30', [L(4, 'Consulting', 1, 5000)])])
    a = plus(fx1, payments=[P(1, 1, 99.96, SA, [(1, 99.96)]), P(2, 1, 99.5, SA, [(2, 99.5)]),
                            P(3, 3, 4993, SA, [(3, 4993)]), P(4, 3, 4992, SA, [(4, 4992)])])
    t1 = T('writes off only what is worth less than five cents', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        const pays = [['1', '99.96'], ['2', '99.50']];
        for (const [id, amount] of pays) {
          await page.getByTestId(`invoice-row-${id}`).click();
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-03-10');
          await page.getByTestId('payment-form-submit').click();
        }
        // 0.04 left is under $0.05: written off
        await page.getByTestId('invoice-row-1').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv1.writtenOff}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        // 0.50 left now stays due
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv2.due}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv2.status}');
        // yen: 7 yen is worth 7 x 0.0066 = $0.046, written off; 8 yen is $0.053 and stays due
        await page.getByTestId('client-row-3').click();
        const yen = [['3', '4993'], ['4', '4992']];
        for (const [id, amount] of yen) {
          await page.getByTestId(`invoice-row-${id}`).click();
          await page.getByTestId('payment-form-amount').fill(amount);
          await page.getByTestId('payment-form-date').fill('2026-03-10');
          await page.getByTestId('payment-form-submit').click();
        }
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-written-off')).toHaveText('{a:inv3.writtenOff}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{a:inv4.due}');
        await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
          'INVOICE_WRITTEN_OFF id=1 amount=0.04',
          'INVOICE_WRITTEN_OFF id=3 amount=7',
        ]);
""", a=a)
    return Spec('cp140_write_off_under_five_cents', 'write off under five cents', """
        After a payment, what is left on an invoice is written off only when it is worth less than $0.05
        at the workspace rates (and no more than 1% of the grand total); anything else stays due.""",
        [t1], n)


cp(140, 'write_off_under_five_cents', """
    Writing off up to $2.00 is costing me money. From now on, after a payment, only write off what's left
    when it is worth less than $0.05 at the workspace rates (and still no more than 1% of the grand
    total). Anything more stays due.
""", s140, type_='mutative', mutates=[40, 43, 61, 92], copies=['cp61_foreign_payments'], retires=[
    'cp40_write_off_small_balance.spec.ts::writes off less than a dollar left due',
    'cp92_write_off_threshold.spec.ts::writes off less than $2.00 that is no more than 1% of the total'])

# =============================================================================== cp141 withholding threshold


def s141(n):
    st = {'taxRate': 10, 'usdPer': RATES, 'withholdingThreshold': 500}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, withholdingPct=10), C(G, currency='EUR', withholdingPct=10)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 1, 400)]),
        I(2, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 450), L(3, 'Hosting', 1, 50)]),
        I(3, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 1, 450)]),
        I(4, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Design', 1, 460)])])
    after = plus(fx1, drop_lines=[(2, 3)])
    t1 = T('withholds only from the threshold up', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 400.00 before tax is under the 500.00 threshold: nothing withheld
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv1.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv1.due}');
        // 500.00 reaches it: 10% withheld
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv2.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{s:inv2.due}'); // 550.00 - 50.00
        // removing the hosting line takes it back under
        await page.getByTestId('line-row-3').getByTestId('line-remove').click();
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{after:inv2.withholding}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{after:inv2.due}');
        // in euros the threshold is 500 / 1.10 = 454.5454, down to €454.54
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv3.withholding}');
        await page.getByTestId('invoice-row-4').click();
        await expect(page.getByTestId('invoice-withholding')).toHaveText('{s:inv4.withholding}');
""", after=after)
    return Spec('cp141_withholding_threshold', 'withholding threshold', """
        Withholding only applies to invoices whose amount before tax is at least the workspace threshold
        (settings.withholdingThreshold, in US dollars converted at the issue date's rate, rounded down);
        below it nothing is withheld and the client pays the whole invoice.""", [t1], n)


cp(141, 'withholding_threshold', """
    Withholding only applies above a certain size of invoice. Let the workspace set a withholding
    threshold in US dollars (converted to the client's currency at the issue date's rate, rounded
    down): an invoice whose amount before tax is below it has nothing withheld, and the client pays all
    of it. At or above the threshold, withholding works as before.
""", s141)

# =============================================================================== cp142 regional payment terms


def s142(n):
    st = {'taxRate': 10, 'regionTermsDays': {'NY': 45}}
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='NY'), C(G, region='NY', termsDays=14), C(IN, region='CA')],
               invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-03-31', [L(1, 'Design', 1, 100)]),
                         I(2, 2, 'DRAFT', '2026-03-01', '2026-03-15', [L(2, 'Design', 1, 100)]),
                         I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 100)])])
    t1 = T("sets the due date from the client's region's terms", '@core', fx1, """
        // sent today, 2026-03-10: New York gives 45 days, due 2026-04-24
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-04-24');
        // the client's own 14 days win: 2026-03-24
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-03-24');
        // California has no terms: the end of next month
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-04-30');
        // a new invoice for a New York client starts with the region's terms
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-new').click();
        await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-04-24');
""")
    fx2 = dict(asOf='2026-05-01', settings={'lateInterestRate': 12, 'regionTermsDays': {'NY': 45}},
               clients=[C(A, region='NY')], invoices=[I(5, 1, 'DRAFT', '2026-03-10', '2026-04-24', [L(1, 'Build', 1, 1000)])])
    sent = plus(fx2, inv=[(5, dict(status='SENT', issueDate='2026-05-01', dueDate='2026-06-15'))])
    t2 = T("sending re-dates the due date by the region's terms", '@core', fx2, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-5').click();
        await page.getByTestId('invoice-send').click();
        // issued 2026-05-01: 45 days on is 2026-06-15, so it is not overdue and earns no interest
        await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('2026-06-15');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{sent:inv5.status}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{sent:inv5.interest}');
""", sent=sent)
    return Spec('cp142_region_terms', 'regional payment terms', """
        A region can have standard payment terms (settings.regionTermsDays, region -> days). A client in
        that region with no terms of their own gets invoices due that many days after the issue date
        (new invoices, and again when sent), instead of the end of the next month.""", [t1, t2], n)


cp(142, 'region_terms', """
    Payment terms differ by region. Let the workspace set standard terms in days for a region. For a
    client in that region with no terms of their own, an invoice is due that many days after its issue
    date, both when it's created and when sending re-dates it, instead of the end of the next month.
    A client's own terms still win.
""", s142)

# =============================================================================== cp143 plan fee


def s143(n):
    st = {'usdPer': RATES, 'planFee': 30}
    fx1 = dict(asOf='2026-01-31', settings=st, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)]),
        I(2, 2, 'DRAFT', '2026-01-31', '2026-02-28', [L(2, 'Consulting', 1, 1000)])])
    a = plus(fx1, inv=[(1, dict(instalments=3, instalmentRate=12, planDownPct=10))])
    b = plus(a, inv=[(2, dict(instalments=2, instalmentRate=0))])
    t1 = T('adds the plan fee to what is spread over the instalments', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('3');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-down').fill('10');
        await page.getByTestId('plan-form-submit').click();
        // down payment 10% of 1,000.00 = 100.00; then 900.00 + the 30.00 fee = 930.00 over 3 at 12%:
        // 930 x 0.01 / (1 - 1.01^-3) = 316.22, rounded up to 317.00
        await expect(page.getByTestId('invoice-plan-fee')).toHaveText('{a:inv1.planFee}');
        await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-payment')).toHaveText('{a:inv1.inst0.payment}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{a:inv1.inst1.payment}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('{a:inv1.inst1.interest}');
        await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('{a:inv1.inst3.payment}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{a:inv1.planTotal}');
        // in euros the fee is 30 / 1.10 = 27.27: 1,027.27 over 2 is 513.635, rounded up to 514.00
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('plan-form-count').fill('2');
        await page.getByTestId('plan-form-rate').fill('0');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('invoice-plan-fee')).toHaveText('{b:inv2.planFee}');
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{b:inv2.inst1.payment}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('{b:inv2.inst2.payment}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{b:inv2.planTotal}');
""", a=a, b=b)
    return Spec('cp143_plan_fee', 'instalment plan fee', """
        Setting up an instalment plan adds the workspace plan fee (settings.planFee, in US dollars
        converted at the issue date's rate, rounded down), shown on the panel, to the amount spread over
        the instalments (after any down payment): it earns the plan's interest and is part of the plan
        total, the payoff and the minimum instalment check.""", [t1], n)


cp(143, 'plan_fee', """
    Instalment plans cost me admin, so charge a plan fee. When a plan is set up, add the workspace's plan
    fee (in US dollars, converted to the client's currency at the issue date's rate, rounded down) to
    the amount spread over the instalments, after any down payment. Show the fee on the invoice. It
    earns the plan's interest like the rest, and counts in the plan total, the payoff amount and the
    minimum instalment check.
""", s143)

# =============================================================================== cp144 drafts at today's rates


def s144(n):
    st = dict(DT, taxRate=10)
    fx1 = dict(asOf='2026-04-10', settings=st, clients=[C(A, region='NY', rates=DCARD),
                                                        C(G, taxExempt=True, taxExemptUntil='2026-03-31')], invoices=[
        I(1, 1, 'DRAFT', '2026-03-20', '2026-04-30', [L(1, 'Consulting', 2, unitType='hour')]),
        I(2, 1, 'SENT', '2026-03-20', '2026-04-30', [L(2, 'Consulting', 2, unitType='hour')]),
        I(3, 2, 'DRAFT', '2026-03-20', '2026-04-30', [L(3, 'Catering', 1, 400)])])
    t1 = T("a draft is priced and taxed at today's rates", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // dated 2026-03-20 but still a draft: today's 105.00 an hour and today's 9.25% New York rate
        await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('{s:inv1.line1.unitPrice}');
        await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('{s:inv1.line1.amount}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}'); // 9.25% of 210.00
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // the sent invoice of the same date keeps March's 95.00 and 8.875%
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('{s:inv2.line2.amount}');
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
        // Globex's exemption ended on 2026-03-31, so its draft is taxed today: 10% of 400.00
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv3.tax}');
""")
    return Spec('cp144_drafts_at_todays_rates', "drafts at today's rates", """
        A draft is priced and taxed as of today, whatever date it carries, since it will be dated today
        when sent: the rate card or price list entry in force today, today's exchange rates for anything
        converted from US dollars, this month's volume for tiers, the region's tax rate in force today, and
        the client's tax exemption as it stands today. Sent invoices and credit notes keep the rates of
        their issue date.""", [t1], n)


cp(144, 'drafts_at_todays_rates', """
    A draft shouldn't show last month's prices and tax when it will be dated today once I send it. Price
    and tax a draft as of today, whatever date it carries: the rate card or price list entry in force
    today, today's exchange rates for anything converted from US dollars (price-list prices, the
    minimum charge, volume thresholds, the plan fee), this month's volume for tiered prices, the
    region's tax rate in force today, and the client's tax exemption as it stands today. Sent invoices
    and their credit notes keep the rates of their issue date.
""", s144, type_='mutative', mutates=[115, 131, 135],
   copies=['cp115_dated_tax_rates', 'cp131_dated_rates', 'cp135_exemption_expiry'])

# =============================================================================== cp145 crediting tiered lines


def s145(n):
    fx1 = dict(asOf=SA, settings=T10, clients=[C(A, rates=TCARD)], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Licences', 60, unitType='licence'), L(2, 'Setup', 2, unitType='hour')]),
        I(2, 1, 'DRAFT', '2026-03-05', '2026-04-30', [L(3, 'Licences', 15, unitType='licence', creditOfLine=1)], creditOf=1)])
    sent = plus(fx1, inv=[(2, dict(status='SENT', issueDate=SA))])
    t1 = T('credits tiered units from the top band down', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-2').click();
        // the invoice billed units 1-60; crediting 15 gives back units 46-60, the cheapest:
        // 10 x 12.00 + 5 x 15.00 = 195.00 (15 from the first band would be 275.00)
        await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('{s:inv2.line3.amount}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv2.grand}'); // 195.00 + 10%
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number={sent:inv2.number} invoice=1 total={sent:inv2.grand|plain}');
        await page.getByTestId('invoice-row-1').click();
        // 920.00 + 190.00 + 10% = 1,221.00, less the 214.50 credited
        await expect(page.getByTestId('invoice-credited')).toHaveText('{sent:inv2.grand}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{sent:inv1.due}');
""", sent=sent)
    return Spec('cp145_credit_tiered_lines', 'crediting tiered lines', """
        Crediting units of a line priced in tiers gives back its last units first: the credited line is
        priced at the exact charge of the top units of the bands the original line used, rounded to the
        cent, then taxed like the original.""", [t1], n)


cp(145, 'credit_tiered_lines', """
    When I credit some units of a line priced in tiers, give back its last units first, not the most
    expensive ones. Price the credited line at the exact charge of the top units of the bands the
    original line used (crediting 15 of 60 licences gives back units 46 to 60), rounded to the cent and
    then taxed like the original.
""", s145)

# =============================================================================== cp146 regions that round tax down


def s146(n):
    st = dict(RT, regionRoundDown=['CA'])
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='CA'), C(G, region='CA', pricesIncludeTax=True), C(IN, region='NY')],
               invoices=[I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30', [L(1, 'Design', 2, 49.99)]),
                         I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(2, 'Design', 1, 10), L(3, 'Pens', 1, 2.5)]),
                         I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 2, 49.99)])])
    t1 = T('rounds tax down in regions that require it', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // 7.25% of 99.98 = 7.24855: California rounds it down to 7.24
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv1.tax}');
        await expect(page.getByTestId('invoice-grand-total')).toHaveText('{s:inv1.grand}');
        // prices including tax: 12.50 - 12.50 / 1.0725 = 0.84499, down to 0.84; per line 10.00 / 1.0725 = 9.32
        // (tax 0.68) and 2.50 / 1.0725 = 2.33 (0.17) make 0.85, so a cent comes back off the larger line
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv2.tax}');
""" + tax_lines('s', 2, (2, 3)) + """
        await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('{s:inv2.line2.net}');
        // New York rounds half up as usual: 8.875% of 99.98 = 8.873225
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await expect(page.getByTestId('invoice-tax')).toHaveText('{s:inv3.tax}');
""")
    return Spec('cp146_region_round_down', 'regions that round tax down', """
        In the regions the workspace lists as rounding tax down (settings.regionRoundDown), each rate's
        tax on an invoice taxed there is rounded down to the cent instead of half up, and for prices that
        include tax the tax taken out is rounded down before it is reconciled over the lines.""", [t1], n)


cp(146, 'region_round_down', """
    Some regions require tax to be rounded down. Let the workspace list those regions. On an invoice
    taxed in one of them, round each rate's tax down to the cent instead of half up; for prices that
    include tax, round the tax inside them down too before sharing it over the lines.
""", s146)

# =============================================================================== cp147 card surcharge cap


def s147(n):
    st = {'usdPer': RATES, 'cardSurchargePct': 2.5, 'cardSurchargeCap': 15}
    fx1 = dict(asOf=SA, settings=st, clients=[A, C(G, currency='EUR')], invoices=[
        I(1, 1, 'SENT', '2026-03-01', '2026-04-30', [L(1, 'Build', 1, 1010)]),
        I(2, 2, 'SENT', '2026-03-01', '2026-04-30', [L(2, 'Build', 1, 1100)]),
        I(3, 1, 'SENT', '2026-03-01', '2026-04-30', [L(3, 'Design', 1, 100)])])
    a = pay_applied(fx1, P(1, 1, 1025, SA, [], method='CARD'), 1, n)
    b = pay_applied(a, P(2, 2, 1025, SA, [], method='CARD'), 2, n)
    c = pay_applied(b, P(3, 1, 102.5, SA, [], method='CARD'), 3, n)
    t1 = T('caps the card surcharge', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
""" + cash_pay('1025', SA, 'CARD') + """        // 2.5% would be 25.00; the cap is 15.00, so 1,010.00 pays the invoice
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-surcharge')).toHaveText('{a:pay1.surcharge}');
        await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('{a:inv1.paid}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        // a small payment is under the cap: 102.50 is 100.00 + 2.50
        await page.getByTestId('invoice-row-3').click();
""" + cash_pay('102.50', SA, 'CARD') + """        await expect(page.getByTestId('payment-row-3').getByTestId('payment-surcharge')).toHaveText('{c:pay3.surcharge}');
        // in euros the cap is 15 / 1.10 = 13.636, down to €13.63
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
""" + cash_pay('1025', SA, 'CARD') + """        await expect(page.getByTestId('payment-row-2').getByTestId('payment-surcharge')).toHaveText('{c:pay2.surcharge}');
        await expect(page.getByTestId('invoice-amount-due')).toHaveText('{c:inv2.due}'); // 1,100.00 - 1,011.37
        await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=2 amount={c:pay2.surcharge|plain}');
""", a=a, b=b, c=c)
    return Spec('cp147_card_surcharge_cap', 'card surcharge cap', """
        The card surcharge on one payment is never more than the workspace cap (settings.cardSurchargeCap,
        in US dollars converted at the payment date's rate, rounded down); the rest of the payment pays
        invoices as usual.""", [t1], n)


cp(147, 'card_surcharge_cap', """
    The card surcharge on big payments is out of proportion. Cap it: the surcharge on one card payment is
    never more than the workspace cap (in US dollars, converted to the client's currency at the payment
    date's rate and rounded down). Everything above that pays the invoices as usual.
""", s147)

# =============================================================================== cp148 plan rates capped too


def s148(n):
    fx1 = dict(asOf='2026-01-31', settings=IC, clients=[C(A, region='NY'), C(G, region='CA')], invoices=[
        I(1, 1, 'DRAFT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)]),
        I(2, 2, 'DRAFT', '2026-01-31', '2026-02-28', [L(2, 'Consulting', 1, 1000)])])
    a = plus(fx1, inv=[(1, dict(instalments=3, instalmentRate=12)), (2, dict(instalments=3, instalmentRate=12))])
    t1 = T("caps an instalment plan's rate at the region's maximum", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('plan-form-count').fill('3');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-submit').click();
        // New York allows 9%: 1,000.00 x 0.0075 / (1 - 1.0075^-3) = 338.34, rounded up to 339.00
""" + inst_rows(a, 1, (1, 2, 3), 'a') + """
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{a:inv1.planTotal}');
        // California has no cap: 12%, 340.02 rounded up to 341.00
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('plan-form-count').fill('3');
        await page.getByTestId('plan-form-rate').fill('12');
        await page.getByTestId('plan-form-submit').click();
        await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('{a:inv2.inst1.payment}');
        await expect(page.getByTestId('invoice-plan-total')).toHaveText('{a:inv2.planTotal}');
""", a=a)
    return Spec('cp148_plan_rate_cap', 'plan rates capped', """
        A region's legal maximum interest rate now also caps the rate of an instalment plan for a client in
        that region: the plan is worked out at the lower of its own rate and the cap.""", [t1], n)


cp(148, 'plan_rate_cap', """
    The regional interest cap applies to my instalment plans too. For a client in a region with a legal
    maximum rate, work an instalment plan out at the lower of the plan's rate and that cap.
""", s148, type_='mutative', mutates=[122], copies=['cp122_interest_cap'])

# =============================================================================== cp149 interest threshold on plans


def s149(n):
    st = {'lateInterestRate': 12, 'interestThreshold': 5}
    fx1 = dict(asOf='2026-04-30', settings=st, clients=[A, G], invoices=[
        I(1, 1, 'SENT', '2026-01-31', '2026-02-28', [L(1, 'Consulting', 1, 1000)], instalments=3, instalmentRate=12),
        I(2, 2, 'SENT', '2026-01-31', '2026-02-28', [L(2, 'Consulting', 1, 10000)], instalments=3, instalmentRate=12)])
    p1 = num(V(fx1, n)['inv1.inst1.payment'])
    p2 = num(V(fx1, n)['inv2.inst1.payment'])
    fx1['payments'] = [P(1, 1, p1, '2026-02-27', [(1, p1)]), P(2, 2, p2, '2026-02-27', [(2, p2)])]
    v = V(fx1, n)
    due2 = num(v['inv1.inst2.payment'])
    a = plus(fx1, payments=[P(3, 1, due2, '2026-04-30', [(1, due2)])])
    t1 = T("an instalment plan's late interest waits for the threshold", '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        // instalment 2 (341.00, due 2026-03-31) has earned 2.62 since 2026-04-07: under 5.00, not charged
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{s:inv1.inst2.status}');
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('{s:inv1.inst2.lateInterest}');
        await expect(page.getByTestId('invoice-interest')).toHaveText('{s:inv1.interest}');
        await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('{s:client1.overdue}');
        // paying the 341.00 clears the instalment
        await page.getByTestId('payment-form-amount').fill('{s:inv1.inst2.payment|plain}');
        await page.getByTestId('payment-form-date').fill('2026-04-30');
        await page.getByTestId('payment-form-submit').click();
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-status')).toHaveText('{a:inv1.inst2.status}');
        await expect(page.getByTestId('invoice-panel-status')).toHaveText('{a:inv1.status}');
        // ten times the plan: 3,401.00 overdue earns 26.17, over the threshold, so it is all owed
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('{a:inv2.inst2.lateInterest}');
        await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('{a:client2.overdue}');
""", a=a)
    return Spec('cp149_plan_interest_threshold', 'interest threshold on plans', """
        The late interest threshold applies to invoices with an instalment plan too: until the late
        interest of all the plan's instalments adds up to the threshold, none of it is shown or owed (the
        instalments show $0.00 of late interest, and paying an instalment's own amount clears it); from
        then on all of it is owed as usual.""", [t1], n)


cp(149, 'plan_interest_threshold', """
    Apply the late interest threshold to instalment plans as well. Until the late interest of all of a
    plan's overdue instalments adds up to the threshold, show none and collect none, so paying an
    instalment's own amount clears it. Once the plan's late interest reaches the threshold, all of it
    is owed as usual.
""", s149)

# =============================================================================== cp150 tax report on sending


def s150(n):
    st = dict(RC, taxRate=10)
    fx1 = dict(asOf=SA, settings=st, clients=[C(A, region='NY'), C(G, region='CA', taxNumber='CA2048163017'),
                                              C(IN, region='NY', pricesIncludeTax=True)], invoices=[
        I(1, 1, 'DRAFT', '2026-03-01', '2026-04-30',
          [L(1, 'Design', 2, 120), L(2, 'Handbook', 2, 12.5, taxRate=5), L(3, 'Postage', 1, 6.4, taxExempt=True)],
          surchargePct=10, discountPct=5),
        I(2, 2, 'DRAFT', '2026-03-01', '2026-04-30', [L(4, 'Design', 2, 120)]),
        I(3, 3, 'DRAFT', '2026-03-01', '2026-04-30', [L(5, 'Design', 1, 108.88), L(6, 'Handbook', 1, 10.5, taxRate=5)])])
    sent = plus(fx1, inv=[(i, dict(status='SENT', issueDate=SA, dueDate='2026-04-30')) for i in (1, 2, 3)])
    t1 = T('reports the tax charged at each rate when an invoice is sent', '@core', fx1, """
        await page.getByTestId('client-row-1').click();
        await page.getByTestId('invoice-row-1').click();
        await page.getByTestId('invoice-send').click();
        // per rate, after the 5% discount: postage 0%; the handbook 5%; the design and the 10%
        // surcharge at New York's 8.875%
        await expect.poll(() => auditLines().filter((l) => l.startsWith('TAX_CHARGED'))).toEqual([
          '{sent:inv1.taxReport.0}',
          '{sent:inv1.taxReport.5}',
          '{sent:inv1.taxReport.8.875}',
        ]);
        await expect(page.getByTestId('invoice-tax')).toHaveText('{sent:inv1.tax}');
        // reverse charged: everything at 0%
        await page.getByTestId('client-row-2').click();
        await page.getByTestId('invoice-row-2').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('{sent:inv2.taxReport.0}');
        // prices including tax: the net and the tax taken out at each rate
        await page.getByTestId('client-row-3').click();
        await page.getByTestId('invoice-row-3').click();
        await page.getByTestId('invoice-send').click();
        await expect.poll(() => auditLines()).toContain('{sent:inv3.taxReport.5}');
        await expect.poll(() => auditLines()).toContain('{sent:inv3.taxReport.8.875}');
""", sent=sent)
    return Spec('cp150_tax_report', 'tax report on sending', """
        Sending an invoice writes, after INVOICE_SENT, one TAX_CHARGED id=<id> rate=<rate> net=<amount>
        tax=<tax> line for each tax rate on it, lowest rate first: the rate as a plain number, the amount
        before tax of the lines and charges at that rate (after discounts) and the tax worked out for that
        rate. Untaxed lines and charges are reported at rate 0, and a reverse-charged invoice reports
        everything at rate 0. For prices that include tax the amount is the net.""", [t1], n)


cp(150, 'tax_report', """
    My accountant needs the tax broken down by rate. When an invoice is sent, write after INVOICE_SENT
    one line for each tax rate on it, lowest rate first: TAX_CHARGED id=<invoice id> rate=<rate as a
    plain number, e.g. 8.875> net=<amount before tax at that rate> tax=<tax at that rate>. The amount is
    that of the lines, surcharge and minimum charge taxed at that rate, after discounts (the net for
    prices that include tax), and the tax is that rate's tax as worked out on the invoice. Untaxed lines
    and charges go under rate 0, and a reverse-charged invoice reports everything under rate 0.
""", s150)
