"""Workspace rule model (authoring aid, never shown to the agent): figures for an invoice and a
client under the rules in force at checkpoint n.

Act I rules (cp1-50), Act II rules (cp51-100), Act III rules (cp101-150), Act IV rules (cp151-200) and Act V
rules (cp201-250) are all keyed by checkpoint, so a scenario can be evaluated at its own checkpoint and at every
later one (check_scenarios.py). Act V also models sending (send_refusal, send_state), payment routing (route,
pay_order) and Apply credit (apply_credit), so a test's actions are re-checked at every later checkpoint
('ok.' values, ok_values). Later acts' rules are triggered by fixture fields earlier acts never seed
(deposits, credit notes, retention, plans, currency, interest ...; regions, tax numbers, rate cards,
charges, payment methods ...; approval limits, credit limits, holds, service periods, disputes,
purchase orders, milestones ...), so they leave earlier figures alone; a mutation changes a rule for
everything, and its blast radius is what check_scenarios.py reports.

Algorithm figures use acceptance/reference/algorithms.py. Amounts are integer minor units of the
client's currency (cents; whole yen for JPY).
"""
import sys, datetime as dt, calendar
from decimal import Decimal as D, ROUND_HALF_UP, ROUND_FLOOR
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from acceptance.reference.algorithms import (cents, money, invoice_number_luhn, rf_reference, invoice_number_mod11,
                                             dunning_level_revised,
                                             fingerprint as sha_fingerprint, fingerprint_revised, add_business_days,
                                             observed_holidays,
                                             business_days_between, dunning_level,
                                             rf_valid, largest_remainder, luhn_check_digit,
                                             largest_remainder_revised as lr_revised,
                                             annuity_schedule, annuity_schedule_revised,
                                             compound_interest, triangulate, triangulate_revised,
                                             tax_number_valid, tiered_exact, tax_inclusive_split,
                                             cash_rounding, cash_rounding_revised,
                                             calendar_prorate, calendar_prorate_revised, jaro_winkler,
                                             ewma_days_to_pay, risk_band, risk_band_revised)

CCY = {'USD': ('$', 2), 'EUR': ('€', 2), 'GBP': ('£', 2), 'JPY': ('¥', 0), 'CHF': ('CHF ', 2)}


def dec_of(ccy):
    return CCY[ccy][1]


def fmt(minor, ccy='USD'):
    sym, dec = CCY[ccy]
    return money(minor, sym, dec)


def plain(minor, ccy='USD'):
    """Money as an audit line writes it: a plain decimal in the currency (whole yen for JPY)."""
    dec = dec_of(ccy)
    sign = '-' if minor < 0 else ''
    m = abs(minor)
    return f"{sign}{m}" if dec == 0 else f"{sign}{m // 100}.{m % 100:02d}"


def mr(x, dec=2):
    """Round a Decimal amount (major units) to minor units, half up."""
    return int((D(x) * 10 ** dec).quantize(D(1), rounding=ROUND_HALF_UP))


def rnd_pct(c, pct, n):
    """A percentage of c minor units, half up (cp48 on: rounded down)."""
    v = D(c) * D(str(pct)) / 100
    return int(v.quantize(D(1), rounding=ROUND_FLOOR if n >= 48 else ROUND_HALF_UP))


def floor_pct(c, pct):
    return int((D(c) * D(str(pct)) / 100).quantize(D(1), rounding=ROUND_FLOOR))


def split(total, weights, n):
    if total == 0 or sum(w for _, w in weights) == 0:
        return {i: 0 for i, _ in weights}
    if n >= 36:
        return lr_revised(total, weights)
    return largest_remainder(total, weights)


def d(s):
    return dt.date.fromisoformat(s)


def add_months(s, k):
    x = d(s)
    y, m = divmod(x.month - 1 + k, 12)
    y += x.year
    m += 1
    return dt.date(y, m, min(x.day, calendar.monthrange(y, m)[1])).isoformat()


def plus_days(s, k):
    return (d(s) + dt.timedelta(days=k)).isoformat()


def days_between(a, b):
    return (d(b) - d(a)).days


def end_of_next_month(s):
    x = d(s)
    y, mth = (x.year + (x.month == 12), x.month % 12 + 1)
    return dt.date(y, mth, calendar.monthrange(y, mth)[1]).isoformat()


# ------------------------------------------------------------------------------ algorithms in
# minor units of any currency (cross-checked against the reference for cents)

def annuity(principal, rate, count, dec, n):
    if dec == 2:
        return (annuity_schedule_revised if n >= 84 else annuity_schedule)(principal, str(rate), count)
    P = D(principal) / 10 ** dec
    i = D(str(rate)) / 100 / 12
    raw = P / count if i == 0 else P * i / (1 - (1 + i) ** -count)
    pay = (int(raw.quantize(D(1), rounding='ROUND_CEILING')) * 10 ** dec) if n >= 84 else mr(raw, dec)
    bal, rows = principal, []
    for k in range(1, count + 1):
        interest = mr(D(bal) / 10 ** dec * i, dec)
        principal_k = bal if k == count else pay - interest
        rows.append({"n": k, "payment": principal_k + interest, "interest": interest,
                     "principal": principal_k, "balance": bal - principal_k})
        bal -= principal_k
    return rows


def compound(balance, rate, days, dec, n):
    """Late interest (cp63); cp80 on: Actual/360."""
    if balance <= 0 or days <= 0:
        return 0
    basis = 360 if n >= 80 else 365
    if dec == 2:
        return compound_interest(balance, str(rate), days, basis=basis)
    r = D(str(rate)) / 100 / basis
    return mr(D(balance) / 10 ** dec * ((1 + r) ** days - 1), dec)


def rate_at(settings, ccy, date, n):
    """US dollars one unit of ccy is worth on date (cp74 on: dated rates, latest on or before)."""
    if ccy == 'USD':
        return D(1)
    if n >= 74 and date:
        best = None
        for r in settings.get('fxRates', []):
            if r['currency'] == ccy and r['from'] <= date and (best is None or r['from'] >= best['from']):
                best = r
        if best:
            return D(str(best['usdPer']))
    return D(str(settings.get('usdPer', {})[ccy]))


def convert(amount_major, frm, to, settings, date, n):
    """Minor units of `to` for an amount of `frm` (through USD, the target's step, cp61)."""
    if frm == to:
        return mr(D(str(amount_major)), dec_of(to))
    usd = {c: str(rate_at(settings, c, date, n)) for c in (frm, to) if c != 'USD'}
    v = (triangulate_revised if n >= 88 else triangulate)(str(amount_major), frm, to, usd)
    return int(v * 10 ** dec_of(to))


# ------------------------------------------------------------------------------ Act III helpers

CHARGE_IDS = {'sur': 10 ** 9 + 1, 'min': 10 ** 9 + 2}   # charges rank after every line in a split


def region_of(inv, client, n):
    """The region an invoice is taxed in: the client's (cp101), or its place of supply (cp137)."""
    if n >= 137 and inv.get('supplyRegion'):
        return inv['supplyRegion']
    return client.get('region') if n >= 101 else None


def region_rate(settings, region, date, n):
    """The tax rate of a region on a date (cp101; dated changes from cp115), or None."""
    if not region:
        return None
    if n >= 115 and date:
        best = None
        for c in settings.get('taxRateChanges') or []:
            if c['region'] == region and c['from'] <= date and (best is None or c['from'] >= best['from']):
                best = c
        if best:
            return D(str(best['rate']))
    rates = settings.get('regionTaxRates') or {}
    if region in rates:
        return D(str(rates[region]))
    return None


def reverse_charged(inv, client, settings, n):
    """cp102: a client with a valid tax number taxed in a region other than the home region pays no
    tax (reverse charge); cp124: the number's two letters must be that region."""
    if n < 102:
        return False
    region = region_of(inv, client, n)
    home = settings.get('homeRegion')
    num = client.get('taxNumber')
    if not (region and home and num and region != home and tax_number_valid(num)):
        return False
    if n >= 124 and ''.join(num.split()).upper()[:2] != region.upper():
        return False
    return True


def capped_rate(rate, client, settings, n):
    """cp122: a late-interest rate is capped at the client's region's legal maximum."""
    if n < 122 or rate is None:
        return rate
    cap = (settings.get('regionMaxInterest') or {}).get(client.get('region'))
    if cap is not None and D(str(cap)) < D(str(rate)):
        return cap
    return rate


def tax_date(inv, ctx, n):
    """The date an invoice's tax rates are read on: its issue date; a credit note uses its original's
    (cp115)."""
    if n >= 115 and ctx is not None and inv.get('creditOf') is not None:
        orig = next((x for x in ctx.invoices if x['id'] == inv['creditOf']), None)
        if orig is not None:
            return draft_date(orig, ctx, n)
    return draft_date(inv, ctx, n)


def draft_date(inv, ctx, n):
    """cp144: a draft is taxed and priced at today's rates (it will be dated today when sent)."""
    if n >= 144 and ctx is not None and inv.get('status', 'DRAFT') == 'DRAFT':
        return ctx.asof
    return inv.get('issueDate')


def rate_entry(inv, line, n, client, settings, ctx=None):
    """The rate-card entry pricing a line's unit type: the client's card (cp103), else the workspace
    price list in US dollars (cp113, flagged for conversion); dated entries from cp131."""
    ut = line.get('unitType')
    if n < 103 or not ut:
        return None
    date = draft_date(inv, ctx, n)

    def pick(entries):
        c = [e for e in entries if e.get('unitType') == ut]
        if n >= 131:
            c = [e for e in c if not e.get('from') or (date and e['from'] <= date)]
            c.sort(key=lambda e: e.get('from') or '')
            return c[-1] if c else None
        return c[0] if c else None
    e = pick(client.get('rates') or [])
    if e is not None:
        return dict(e, _usd=False)
    if n >= 113:
        e = pick(settings.get('rates') or [])
        if e is not None:
            return dict(e, _usd=True)
    return None


def ceil_to(q, inc):
    k = (q / inc).to_integral_value(rounding='ROUND_CEILING')
    return k * inc


def qty_str(q):
    q = D(q).normalize()
    s = format(q, 'f')
    return s


def tax_inclusive_minor(gross, rate, dec, round_down=False):
    """tax_inclusive_split in minor units of any currency (cents cross-checked with the reference).
    round_down (cp146): the invoice tax target is rounded down instead of half up."""
    k = 1 + D(str(rate)) / 100
    nets = [mr(D(g) / 10 ** dec / k, dec) for g in gross]
    taxes = [g - x for g, x in zip(gross, nets)]
    tg = sum(gross)
    exact = D(tg) - D(tg) / k
    target = int(exact.quantize(D(1), rounding=ROUND_FLOOR if round_down else ROUND_HALF_UP))
    diff = target - sum(taxes)
    order = sorted(range(len(gross)), key=lambda j: (-gross[j], j))
    step = 1 if diff > 0 else -1
    for j in order[:abs(diff)]:
        taxes[j] += step
        nets[j] -= step
    if dec == 2 and not round_down:
        assert (nets, taxes) == tuple(map(list, tax_inclusive_split(gross, str(rate)))), (gross, rate)
    return nets, taxes


# ------------------------------------------------------------------------------ Act I figures

def base_figures(inv, n, settings, client, dec, credit_note=False, ctx=None, adjustment=False):
    """Subtotal, discount, discount split, charges, tax and grand total, in minor units (adjustment, cp204:
    an adjustment note's lines, which take no minimum charge or volume discount)."""
    m = lambda x: mr(x, dec)
    lines = inv.get('lineItems', [])
    out = {'lines': {}}
    ccy = ctx.ccy(inv['clientId']) if ctx is not None else 'USD'
    orig = None
    if credit_note and ctx is not None:
        orig = next((x for x in ctx.invoices if x['id'] == inv.get('creditOf')), None)
    raws = {l['id']: D(str(l['qty'])) * D(str(l.get('unitPrice') or 0)) for l in lines}
    entries = {l['id']: rate_entry(inv, l, n, client, settings, ctx) for l in lines}
    carded = {i for i, e in entries.items() if e is not None and
              next(l for l in lines if l['id'] == i).get('unitPrice') is None}
    billed = {}
    unit_price = {}
    if n < 4:
        subtotal = m(sum(raws.values(), D(0)))
        nets = {i: m(r) for i, r in raws.items()}
        ldisc = {i: 0 for i in raws}
        amts = dict(nets)
    else:
        amts = {}
        offsets = {}
        if n >= 133 and ctx is not None and not credit_note:
            offsets = month_units(inv, ctx, n, client, settings)
        for l in sorted(lines, key=lambda l: l['id']) if n >= 112 else lines:
            i = l['id']
            e = entries[i]
            if n < 103 or e is None:
                pr = D(str(l.get('unitPrice') or 0))
                if n >= 121 and l.get('overtime'):
                    pr = D(m(pr * D('1.5'))) / 10 ** dec
                amts[i] = m(D(str(l['qty'])) * pr)
                unit_price[i] = pr
                billed[i] = D(str(l['qty']))
                continue
            q = D(str(l['qty']))
            if n >= 114 and e.get('increment'):
                q = ceil_to(q, D(str(e['increment'])))
            if n >= 118 and e.get('minUnits') is not None:
                q = max(q, D(str(e['minUnits'])))
            billed[i] = q
            ot = n >= 121 and l.get('overtime')
            date = draft_date(inv, ctx, n)

            def up(p, usd=False, card=True):
                p = D(str(p))
                if usd:
                    p = D(convert(p, 'USD', ccy, settings, date, n)) / 10 ** dec
                if card and n >= 134 and client.get('rateDiscountPct'):
                    # cp134: the client's discount on card and price-list prices, per unit
                    p = D(m(p * (100 - D(str(client['rateDiscountPct']))) / 100)) / 10 ** dec
                if ot:
                    p = D(m(p * D('1.5'))) / 10 ** dec
                return p
            if l.get('unitPrice') is not None:
                price = up(l['unitPrice'], card=False)
                unit_price[i] = price
                amts[i] = m(q * price)
            elif n >= 105 and e.get('tiers'):
                tiers = [(t.get('units'), str(up(t['unitPrice'], e['_usd']))) for t in e['tiers']]
                start = D(0)
                if n >= 112:
                    start = offsets.get(l['unitType'], D(0))
                    offsets[l['unitType']] = start + q
                amts[i] = mr(tiered_exact(start + q, tiers) - tiered_exact(start, tiers), dec)
                unit_price[i] = None
            else:
                price = up(e['unitPrice'], e['_usd'])
                unit_price[i] = price
                amts[i] = m(q * price)
        if credit_note and n >= 145 and orig is not None:
            # a credited tiered line is priced from the top of the original line's bands
            ob = base_figures(orig, n, settings, client, dec, credit_note=False, ctx=ctx)
            for l in lines:
                ol = l.get('creditOfLine')
                if ol is not None and ol in ob.get('_tiered', {}):
                    tq, start, tiers = ob['_tiered'][ol]
                    cq = D(str(l['qty']))
                    amts[l['id']] = mr(tiered_exact(start + tq, tiers) - tiered_exact(start + tq - cq, tiers), dec)
        if n >= 167:
            # cp167: a line billed by percent complete is that share of its full amount, half up
            for l in lines:
                if l.get('percentComplete') is not None:
                    full = D(amts[l['id']]) / 10 ** dec
                    amts[l['id']] = mr(full * D(str(l['percentComplete'])) / 100, dec)
                    if n >= 173 and l.get('billedPct'):
                        # cp173: a progress claim bills the percentage now less what was billed before
                        amts[l['id']] -= mr(full * D(str(l['billedPct'])) / 100, dec)
        if n >= 155:
            # cp155: a line with a service period is its whole-month amount prorated by calendar days
            for l in lines:
                if l.get('periodStart') and l.get('periodEnd'):
                    amts[l['id']] = prorate_minor(amts[l['id']], l['periodStart'], l['periodEnd'], dec, n)
        ldisc = {}
        for l in lines:
            p = l.get('discountPct') if n >= 19 else None
            ldisc[l['id']] = rnd_pct(amts[l['id']], p, n) if p else 0
        nets = {i: amts[i] - ldisc[i] for i in amts}
        subtotal = sum(nets.values())
    # tiered lines' band positions (for crediting them, cp145)
    out['_tiered'] = {}
    if n >= 105:
        offs = {}
        for l in sorted(lines, key=lambda l: l['id']):
            e = entries[l['id']]
            if e is not None and l.get('unitPrice') is None and e.get('tiers') and l['id'] in billed:
                ot = n >= 121 and l.get('overtime')
                start = offs.get(l['unitType'], D(0)) if n >= 112 else D(0)
                offs[l['unitType']] = start + billed[l['id']]
                tiers = []
                for t in e['tiers']:
                    pr = D(str(t['unitPrice']))
                    if e['_usd']:
                        pr = D(convert(pr, 'USD', ccy, settings, draft_date(inv, ctx, n), n)) / 10 ** dec
                    if n >= 134 and client.get('rateDiscountPct'):
                        pr = D(m(pr * (100 - D(str(client['rateDiscountPct']))) / 100)) / 10 ** dec
                    if ot:
                        pr = D(m(pr * D('1.5'))) / 10 ** dec
                    tiers.append((t.get('units'), str(pr)))
                out['_tiered'][l['id']] = (billed[l['id']], start, tiers)
    # the invoice discount (cp132: lines priced from the rate card take none)
    eligible = [l for l in lines if not (n >= 132 and l['id'] in carded) and not (n >= 214 and l.get('carriedInterest'))]
    base_sub = sum(nets[l['id']] for l in eligible)
    disc = 0
    fixed = False
    if credit_note:
        pass
    elif n >= 27 and inv.get('discountAmount') is not None:
        disc = m(D(str(inv['discountAmount'])))
        fixed = True
    elif n >= 9 and inv.get('discountPct'):
        disc = rnd_pct(base_sub, inv['discountPct'], n)
    volume = False
    if n >= 123 and not credit_note and not adjustment and settings.get('volumeDiscounts'):
        best = None
        for v in settings['volumeDiscounts']:
            over = convert(v['over'], 'USD', ccy, settings, draft_date(inv, ctx, n), n)
            if subtotal > over and (best is None or D(str(v['over'])) > D(str(best['over']))):
                best = v
        if best is not None:
            vd = floor_pct(base_sub, best['pct'])
            if vd > disc:
                disc, fixed, volume = vd, False, True
    cap = None if credit_note else inv.get('discountCap')
    if n >= 29 and cap is not None:
        capc = m(D(str(cap)))
        if n < 32:
            if not fixed:
                disc = min(disc, capc)
        else:
            disc = max(0, min(disc, capc - sum(ldisc.values())))
    shares = split(disc, [(l['id'], nets[l['id']]) for l in eligible], n) if n >= 13 else {l['id']: 0 for l in lines}
    for l in lines:
        shares.setdefault(l['id'], 0)
    # charges after the discount: surcharge (cp110), minimum charge (cp107)
    charges = {}
    net_lines = subtotal - disc
    spct = None
    if n >= 110:
        spct = inv.get('surchargePct') if not credit_note else (
            orig.get('surchargePct') if (n >= 138 and orig is not None) else None)
    if spct:
        carried = sum(nets[l['id']] for l in lines if n >= 214 and l.get('carriedInterest'))
        charges['sur'] = floor_pct(net_lines - carried, spct)
    if n >= 107 and not credit_note and not adjustment and lines:
        minimum = None
        if n >= 125 and client.get('minimumCharge') is not None:
            minimum = m(D(str(client['minimumCharge'])))
        elif settings.get('minimumCharge') is not None:
            minimum = convert(settings['minimumCharge'], 'USD', ccy, settings, draft_date(inv, ctx, n), n)
        if minimum is not None:
            top = minimum - (net_lines + charges.get('sur', 0))
            if top > 0:
                charges['min'] = top
    # tax
    tdate = tax_date(inv, ctx, n)
    region = region_of(inv, client, n)
    rc = reverse_charged(inv, client, settings, n)
    exempt_client = n >= 49 and bool(client.get('taxExempt'))
    if exempt_client and n >= 135 and client.get('taxExemptUntil') and tdate and tdate > client['taxExemptUntil']:
        exempt_client = False
    rr = region_rate(settings, region, tdate, n) if n >= 101 else None
    std = rr if rr is not None else (D(str(settings.get('taxRate', 0))) if n >= 10 else D(0))
    inclusive = n >= 106 and bool(client.get('pricesIncludeTax'))

    def rate_of(l, ignore_rc=False):
        if rc and not ignore_rc:
            return D(0)
        if exempt_client:
            if n >= 108 and l.get('taxRate') is not None:
                return D(str(l['taxRate']))
            return D(0)
        if n >= 14 and l.get('taxExempt'):
            return D(0)
        if n >= 214 and l.get('carriedInterest'):
            return D(0)      # cp214: interest carried to a replacement is not taxed
        if n >= 33 and l.get('taxRate') is not None:
            return D(str(l['taxRate']))
        e = entries.get(l.get('id'))
        if n >= 127 and e is not None and e.get('taxRate') is not None:
            return D(str(e['taxRate']))
        if n >= 10:
            return std
        return D(0)

    def charge_rate(ignore_rc=False):
        if (rc and not ignore_rc) or exempt_client:
            return D(0)
        return std
    ltax = {}
    ctax = {}
    round_down = n >= 146 and region in (settings.get('regionRoundDown') or [])
    if n < 12:
        tax = m(D(subtotal) / 10 ** dec * rate_of({}) / 100)
    elif n < 14:
        tax = m(D(subtotal - disc) / 10 ** dec * rate_of({}) / 100)
    elif n < 20:
        base = sum((nets[l['id']] - shares[l['id']]) for l in lines if rate_of(l) != 0)
        rates = {rate_of(l) for l in lines if rate_of(l) != 0}
        assert len(rates) <= 1
        r = rates.pop() if rates else D(0)
        tax = m(D(base) / 10 ** dec * r / 100)
    elif n < 72:
        for l in lines:
            ltax[l['id']] = m(D(nets[l['id']] - shares[l['id']]) / 10 ** dec * rate_of(l) / 100)
        tax = sum(ltax.values())
    else:
        # items: each line's amount after its discount share, then the charges
        items = [(l['id'], nets[l['id']] - shares[l['id']], l) for l in lines]
        items += [(CHARGE_IDS[k], v, None) for k, v in charges.items()]

        def item_rate(it, ignore_rc=False):
            r = rate_of(it[2], ignore_rc) if it[2] is not None else charge_rate(ignore_rc)
            if inclusive and n < 116 and r != 0:
                r = charge_rate(ignore_rc) if it[2] is not None else r   # cp106: one rate, the client's
                if exempt_client or (rc and not ignore_rc):
                    r = D(0)
            return r
        taxes = {}
        report = {}    # rate -> [net, tax] (cp150)
        if inclusive:
            net_rc = n >= 119 and rc
            groups = {}
            for it in items:
                r = item_rate(it, ignore_rc=net_rc)
                if r != 0 and it[1] > 0:
                    groups.setdefault(r if n >= 116 else 'one', []).append((it, r))
            for g, its in groups.items():
                r = its[0][1]
                nn, tt = tax_inclusive_minor([x[0][1] for x in its], r, dec, round_down)
                for (it, _), t in zip(its, tt):
                    taxes[it[0]] = t
                for (it, rr), x_, t in zip(its, nn, tt):
                    e = report.setdefault(rr, [0, 0])
                    e[0] += x_
                    e[1] += t
            taxed = {it[0] for its in groups.values() for it, _ in its}
            for it in items:
                if it[0] not in taxed:
                    report.setdefault(D(0), [0, 0])[0] += it[1]
        else:
            groups = {}
            for it in items:
                r = item_rate(it)
                groups.setdefault(r if n >= 116 else 'one', []).append((it, r))
            for g, its in groups.items():
                exact = sum((D(it[1]) * r / 100 for it, r in its), D(0))
                gt = int(exact.quantize(D(1), rounding=ROUND_FLOOR if round_down else ROUND_HALF_UP))
                w = [(it[0], int(it[1] * r * 100)) for it, r in its]
                sp = split(gt, w, n) if its else {}
                for it, _ in its:
                    taxes[it[0]] = sp.get(it[0], 0)
                for it, rr in its:
                    e = report.setdefault(rr, [0, 0])
                    e[0] += it[1]
                    e[1] += sp.get(it[0], 0)
        for l in lines:
            ltax[l['id']] = taxes.get(l['id'], 0)
        for k in charges:
            ctax[k] = taxes.get(CHARGE_IDS[k], 0)
        tax = sum(taxes.values())
    chg = sum(charges.values())
    net_rc = inclusive and n >= 119 and rc
    if inclusive:
        grand = subtotal - disc + chg - (tax if net_rc else 0)
        shown_tax = 0 if net_rc else tax
    else:
        grand = subtotal - disc + chg + tax
        shown_tax = tax
    for l in lines:
        i = l['id']
        lt = ltax.get(i)
        if inclusive:
            lnet = nets[i] - shares[i] - (lt or 0)
            if net_rc:
                lt = 0
        else:
            lnet = nets[i] - shares[i]
        out['lines'][i] = dict(amount=nets[i], discount=ldisc[i], share=shares[i], tax=lt, net=lnet)
        if i in billed and n >= 103:
            out['lines'][i]['billedQty'] = qty_str(billed[i])
        if unit_price.get(i) is not None and n >= 103:
            out['lines'][i]['unitPrice'] = m(unit_price[i])
        l = next(x for x in lines if x['id'] == i)
        if n >= 155 and l.get('periodStart') and l.get('periodEnd'):
            out['lines'][i]['period'] = f"{l['periodStart']} to {l['periodEnd']}"
        if n >= 167 and l.get('percentComplete') is not None:
            out['lines'][i]['percent'] = f"{qty_str(D(str(l['percentComplete'])))}%"
        if n >= 173 and l.get('billedPct') is not None:
            out['lines'][i]['billedPct'] = f"{qty_str(D(str(l['billedPct'])))}%"
    if n >= 72:
        if rc:
            out['taxReport'] = [(D(0), grand, 0)]
        else:
            out['taxReport'] = sorted((r, v[0], v[1]) for r, v in report.items())
    out.update(subtotal=subtotal, discount=disc, tax=shown_tax, grand=grand, surcharge=charges.get('sur', 0),
               minimumCharge=charges.get('min', 0), net=grand - shown_tax, reverseCharge=rc,
               volumeDiscount=volume, stdRate=std)
    return out


def month_units(inv, ctx, n, client, settings):
    """cp133: units of each tiered unit type already billed on the client's other sent invoices
    issued earlier in the same calendar month (same date: lower id first).
    cp229: a debit note's units carry on from its invoice's, as if they had been on it: what was
    billed before the invoice that month, the invoice's own units, then its earlier debit notes'."""
    if n >= 229 and inv.get('adjustmentOf') is not None:
        parent = find_inv(ctx, inv['adjustmentOf'])
        out = dict(month_units(parent, ctx, n, client, settings))
        for x in [parent] + [a for a in ctx.invoices if a.get('adjustmentOf') == parent['id']
                             and a['id'] < inv['id'] and a.get('status') == 'SENT']:
            b = base_figures(x, n, settings, client, ctx_dec(ctx, x), ctx=ctx)
            for lid, (q, start, tiers) in b['_tiered'].items():
                if q > 0:
                    ut = next(l for l in x['lineItems'] if l['id'] == lid)['unitType']
                    out[ut] = out.get(ut, D(0)) + q
        return out
    out = {}
    iss = draft_date(inv, ctx, n)
    if not iss:
        return out
    for x in ctx.invoices:
        if x['id'] == inv['id'] or x['clientId'] != inv['clientId'] or x.get('status') != 'SENT':
            continue
        if x.get('creditOf') is not None or not x.get('issueDate') or x['issueDate'][:7] != iss[:7]:
            continue
        if (x['issueDate'], x['id']) >= (iss, inv['id']):
            continue
        b = base_figures(x, n, settings, client, ctx_dec(ctx, x), ctx=ctx)
        for lid, (q, start, tiers) in b['_tiered'].items():
            ut = next(l for l in x['lineItems'] if l['id'] == lid)['unitType']
            out[ut] = out.get(ut, D(0)) + q
    return out


def ctx_dec(ctx, inv):
    return dec_of(ctx.ccy(inv['clientId']))


# ------------------------------------------------------------------------------ the invoice

class Ctx:
    def __init__(self, fx, n):
        self.n = n
        self.settings = fx.get('settings') or {}
        self.clients = {c['id']: c for c in fx.get('clients', [])}
        self.invoices = fx.get('invoices', [])
        self.payments = fx.get('payments', [])
        self.asof = fx.get('asOf', '2026-10-11')   # no asOf: the real date (the run happens after today)

    def ccy(self, cid):
        return (self.clients.get(cid, {}).get('currency') or 'USD') if self.n >= 59 else 'USD'

    def holidays(self):
        """cp209: the workspace's holiday calendar (a set of dates), or None when it keeps calendar days."""
        if self.n < 209 or self.settings.get('holidays') is None:
            return None
        return {d(x) for x in self.settings['holidays']}

    def add_days(self, start, k):
        """start + k days, counted in business days when the workspace has a holiday calendar (cp209)."""
        hol = self.holidays()
        if hol is None:
            return plus_days(start, k)
        return bday_add(d(start), k, hol, self.n).isoformat()

    def grace_end(self, g, due):
        """The last day of the grace period after a due date (cp209: business days with a calendar)."""
        return self.add_days(due, g)

    def days_since(self, a, b):
        """Days from a to b (cp209: business days with a calendar)."""
        hol = self.holidays()
        if hol is None:
            return days_between(a, b)
        return bday_between(d(a), d(b), hol, self.n)

    def balance(self, cid):
        """The client's balance as the client list shows it (owed on sent invoices less unused credit)."""
        n = self.n
        owed = 0
        for inv in self.invoices:
            if inv['clientId'] != cid:
                continue
            f = _figures(inv, n, self)
            if f['status'] not in ('Draft', 'Void', 'Credit note', 'Written off'):
                owed += f['owed']
        dec = dec_of(self.ccy(cid))
        for p in self.payments:
            if p['clientId'] != cid or p.get('reversed'):
                continue
            owed -= self.applied_minor(p) - sum(mr(D(str(a['amount'])), dec) for a in p.get('allocations', [])) \
                - mr(D(str(p.get('refunded', 0))), dec)
        return owed

    def exposure(self, cid):
        """What counts against the client's credit limit: the balance (cp183: less amounts in dispute)."""
        b = self.balance(cid)
        if self.n >= 183:
            for inv in self.invoices:
                if inv['clientId'] == cid and inv.get('status') == 'SENT':
                    b -= _figures(inv, self.n, self).get('disputed') or 0
        return b

    def risk(self, cid, exclude=None):
        """cp161: (score or None, band) from the days the client took to pay its paid invoices (cp179: an
        invoice's own rate is judged on the client's other invoices)."""
        if not hasattr(self, '_risk'):
            self._risk = {}
        key = (cid, exclude)
        if key not in self._risk:
            self._busy = True     # the score itself is worked out without risk-based rules
            try:
                self._risk[key] = risk_of(self, cid, self.n, exclude)
            finally:
                self._busy = False
        return self._risk[key]

    def pay_minor(self, p):
        """A payment's amount in its client's currency (converted when paid in another, cp61)."""
        cc = self.ccy(p['clientId'])
        pc = (p.get('currency') or cc) if self.n >= 61 else cc
        return convert(p['amount'], pc, cc, self.settings, p['date'], self.n)

    def foreign(self, p):
        cc = self.ccy(p['clientId'])
        return self.n >= 61 and (p.get('currency') or cc) != cc

    def fx_fee(self, p):
        """cp130: a payment in another currency loses the conversion fee (a percentage of the converted
        amount, rounded half up)."""
        pct = self.settings.get('fxFeePct')
        if self.n < 130 or not pct or not self.foreign(p):
            return 0
        dec = dec_of(self.ccy(p['clientId']))
        return mr(D(self.pay_minor(p)) / 10 ** dec * D(str(pct)) / 100, dec)

    def card_surcharge(self, p):
        """cp111: the part of a card payment that is the card surcharge: the converted amount minus that
        amount divided by 1 + the surcharge rate (rounded half up); cp147: at most the cap, converted."""
        pct = self.settings.get('cardSurchargePct')
        if self.n < 111 or p.get('method') != 'CARD' or not pct:
            return 0
        cc = self.ccy(p['clientId'])
        dec = dec_of(cc)
        x = self.pay_minor(p)
        sur = x - mr(D(x) / 10 ** dec * 100 / (100 + D(str(pct))), dec)
        if self.n >= 147 and self.settings.get('cardSurchargeCap') is not None:
            sur = min(sur, convert(self.settings['cardSurchargeCap'], 'USD', cc, self.settings, p['date'], self.n))
        return sur

    def applied_minor(self, p):
        """What a payment can pay off: its converted amount less any card surcharge and conversion fee."""
        return self.pay_minor(p) - self.card_surcharge(p) - self.fx_fee(p)

    def grace(self, client):
        n = self.n
        if n >= 78 and client.get('graceDays') is not None:
            return int(client['graceDays'])
        if n >= 139 and client.get('region') in (self.settings.get('regionGraceDays') or {}):
            return int(self.settings['regionGraceDays'][client['region']])   # cp139
        return 7 if n >= 44 else 0

    def writeoff_limit(self, ccy, grand, date):
        """True when an amount (minor units) is small enough to write off."""
        n = self.n
        dec = dec_of(ccy)
        if n < 59:
            return lambda x: x < 100
        rate = rate_at(self.settings, ccy, date, n)
        if n < 92:
            return lambda x: D(x) / 10 ** dec * rate < 1
        # cp92: worth less than $2.00, and no more than 1% of the grand total (cp140: $0.05)
        lim = D('0.05') if n >= 140 else D(2)
        return lambda x: D(x) / 10 ** dec * rate < lim and x * 100 <= grand


def _figures(inv, n, ctx):
    client = ctx.clients.get(inv['clientId'], {})
    settings = ctx.settings
    ccy = ctx.ccy(inv['clientId'])
    dec = dec_of(ccy)
    asof = ctx.asof
    is_adj = n >= 204 and inv.get('adjustmentOf') is not None
    credit_adj = is_adj and is_credit_adj(inv)
    is_cn = (n >= 54 and inv.get('creditOf') is not None) or credit_adj
    if is_adj:
        b = adj_base(inv, n, ctx, client, dec)
    else:
        b = base_figures(inv, n, settings, client, dec, credit_note=is_cn, ctx=ctx)
    st = inv.get('status', 'DRAFT')
    snap = None
    if n >= 203 and is_cn and not credit_adj and st == 'SENT':
        rb = rebill_cn_total(inv, n, ctx)
        if rb is not None:     # cp203: a rebill's credit note is for exactly what the invoice was sent for
            b = dict(b, grand=rb[0], tax=rb[1], net=rb[0] - rb[1])
    if n >= 201 and st == 'SENT' and not is_cn and inv.get('sentTotal') is not None:
        # cp201: a sent invoice is worth what it was sent for
        cur = b['grand']
        sg = mr(D(str(inv['sentTotal'])), dec)
        stx = mr(D(str(inv['sentTax'])), dec) if inv.get('sentTax') is not None else b['tax']
        b = dict(b, grand=sg, tax=stx, net=sg - stx)
        snap = cur
    grand = b['grand']
    out = dict(b, ccy=ccy, credited=0, retention=0, interest=0, lateFee=0, waived=0, earlyDiscount=0,
               settle=None, planTotal=None, nextDue=None, payoff=None, saved=0, fxDiff=None, insts={}, retentionHeld=0,
               paid=0, due=0, writtenOff=0, paidDate=None, owed=0, overdueAmt=0)
    if n >= 201 and st == 'SENT' and not is_cn:
        out['sentTotal'] = grand
        out['currentTotal'] = snap if (snap is not None and snap != grand) else None
    if is_cn:
        out['status'] = 'Draft' if st == 'DRAFT' else ('Void' if st == 'VOID' else (
            'Adjustment' if credit_adj else 'Credit note'))
        return out
    # credit notes against this invoice (cp204: and its credit adjustment notes)
    cns = [x for x in ctx.invoices if n >= 54 and x.get('creditOf') == inv['id'] and x.get('status') == 'SENT']
    cn_tot = {x['id']: _figures(x, n, ctx)['grand'] if n >= 203 else
              base_figures(x, n, settings, client, dec, credit_note=True, ctx=ctx)['grand'] for x in cns}
    credited = sum(cn_tot.values())
    adjs = [x for x in ctx.invoices if n >= 204 and x.get('adjustmentOf') == inv['id'] and x.get('status') == 'SENT']
    cadj = [x for x in adjs if is_credit_adj(x)]
    adj_tot = {x['id']: adj_base(x, n, ctx, client, dec)['grand'] for x in adjs}
    out['adjusted'] = sum(-v if is_credit_adj(x) else v for x, v in zip(adjs, adj_tot.values())) if n >= 204 else None
    for x in cadj:
        cns.append(x)
        cn_tot[x['id']] = adj_tot[x['id']]
    cr_adj = sum(adj_tot[x['id']] for x in cadj)
    if n >= 56:
        for p in ctx.payments:
            if p.get('creditNote') in cn_tot and not p.get('reversed'):
                if p['creditNote'] in adj_tot:
                    cr_adj -= ctx.pay_minor(p)
                else:
                    credited -= ctx.pay_minor(p)
    out['credited'] = credited
    credited += cr_adj
    # retention
    ret = 0
    if 55 <= n < 168 and inv.get('retentionPct'):     # cp168: no more retention
        basev = grand if n < 60 else (b['subtotal'] - b['discount'] if n < 106 else b['net'])   # cp106: before tax
        ret = floor_pct(basev, inv['retentionPct'])
        if n >= 83 and inv.get('retentionCap') is not None:
            ret = min(ret, mr(D(str(inv['retentionCap'])), dec))
    out['retention'] = ret
    # cp117: withholding, never owed by the client (cp124: not on reverse-charged invoices)
    wh = 0
    if n >= 117 and client.get('withholdingPct') and not (n >= 124 and b['reverseCharge']):
        wh_base, judged = b['net'], b['net']
        if n >= 205:
            # cp205: the threshold is judged on the invoice and its adjustment notes together; credit
            # adjustments give back their share of what was withheld
            wh_base, judged = withholding_base(inv, b, n, ctx, client, dec)
        wh = floor_pct(wh_base, client['withholdingPct'])
        if n >= 141 and settings.get('withholdingThreshold') is not None and judged < convert(
                settings['withholdingThreshold'], 'USD', ccy, settings, draft_date(inv, ctx, n), n):
            wh = 0   # cp141: only from the threshold up
    out['withholding'] = wh if n >= 117 else None
    rel_on = inv.get('retentionReleasedOn') if 55 <= n < 168 else None
    if rel_on and rel_on > asof:
        rel_on = None
    # allocations to this invoice
    allocs = []
    for p in ctx.payments:
        if p.get('reversed') and n >= 30:
            continue
        for a in p.get('allocations', []):
            if a['invoiceId'] == inv['id']:
                date = a.get('date', p['date']) if n >= 51 else p['date']
                if n >= 237 and 'date' not in a:
                    date = value_date(ctx, date, n)     # cp237: received on the next business day
                allocs.append((date, p['id'], mr(D(str(a['amount'])), dec), 'date' in a))
    allocs.sort()
    paid = sum(x[2] for x in allocs)
    out['paid'] = paid
    if n >= 82 and ccy != 'USD':
        r0 = rate_at(settings, ccy, inv.get('issueDate'), n)
        if n >= 230 and is_adj:     # cp230: a note's exchange difference is measured from its invoice's date
            r0 = rate_at(settings, ccy, find_inv(ctx, inv['adjustmentOf']).get('issueDate'), n)
        out['fxDiff'] = sum(cents(D(x[2]) / 10 ** dec * (rate_at(settings, ccy, x[0], n) - r0)) for x in allocs)
    if n >= 169 and inv.get('milestones'):
        out['ms'] = milestone_amounts(inv, grand - wh, n)
    if st == 'DRAFT' or st == 'VOID':
        if 57 <= n < 212 and inv.get('instalments'):
            plan(inv, n, ctx, out, grand, allocs, client, ccy, dec, cns, cn_tot, draft=True)
        out['due'] = (out['planTotal'] if out['planTotal'] is not None else grand - wh) - paid if st == 'DRAFT' else 0
        out['status'] = 'Draft' if st == 'DRAFT' else 'Void'
        return out
    if 57 <= n < 212 and inv.get('instalments'):     # cp212: no more instalment plans
        return plan(inv, n, ctx, out, grand, allocs, client, ccy, dec, cns, cn_tot)
    if n >= 169 and inv.get('milestones'):
        return milestone_figures(inv, n, ctx, out, allocs, client, ccy, dec)

    g = grace_of(ctx, client, inv, n)
    duedate = inv.get('dueDate')
    rate = None
    rate_final = None
    if n >= 63:
        rate = settings.get('lateInterestRate')
        if n >= 87 and client.get('interestRate') is not None:
            rate = client['interestRate']
        if rate is not None and D(str(rate)) == 0:
            rate = None
        rate, rate_final = late_rates(rate, ctx, client, inv, n)
    fee_usd = settings.get('lateFee') if 65 <= n < 128 else None   # cp128: no more late fees
    # principal: credit notes come off the invoice before its retention (cp56)
    main = grand - ret - wh
    # a credit note comes off what the invoice still owes after its payments, then its retention
    cr_main = min(credited, max(0, main - paid)) if credited > 0 else credited
    cr_ret = credited - cr_main
    ret_owed = ret - cr_ret
    late_cn = n >= 97   # cp97: a credit note counts from its issue date in the interest periods
    P = main if late_cn else main - cr_main
    rel_part = 0
    if rel_on:
        rel_part = ret_owed
        if n >= 93 and inv.get('retentionReleasedAmount') is not None:
            rel_part = min(ret_owed, mr(D(str(inv['retentionReleasedAmount'])), dec))
    R = rel_part
    held = ret_owed - rel_part
    # early-payment discount (cp62)
    ed = 0
    window_end = None
    if n >= 62 and client.get('earlyPayPct') and not ret and inv.get('issueDate') and not (n >= 231 and is_adj) and not (
            n >= 187 and not getattr(ctx, '_busy', False) and ctx.risk(inv['clientId'], exclude=inv['id'])[1] != 'LOW'):
        ed_base = grand if n < 104 else b['net']
        if n >= 231:
            # cp231: on the amount before tax less what credit notes and credit adjustments took off
            for x in cns:
                g_, t_ = invoice_grand(x, n, ctx) if x.get('adjustmentOf') is not None else (
                    _figures(x, n, ctx)['grand'], _figures(x, n, ctx)['tax'])
                ed_base -= g_ - t_
        ed = floor_pct(ed_base, client['earlyPayPct'])   # cp104: before tax
        window_end = ctx.add_days(inv['issueDate'], int(client.get('earlyPayDays') or 0))
    # interest / fee bearing: something of the invoice (not its retention) still owed after grace
    grace_end = ctx.grace_end(g, duedate) if duedate else None
    bearing = False
    if duedate and (rate is not None or fee_usd):
        owed_then = (main - cr_main) - sum(x[2] for x in allocs if x[0] <= grace_end)
        if late_cn:
            owed_then = main - sum(cn_tot[c['id']] for c in cns if c.get('issueDate', '') <= grace_end) \
                - sum(x[2] for x in allocs if x[0] <= grace_end)
        bearing = owed_then > 0 and grace_end < asof
    start = (duedate if n < 68 else grace_end) if duedate else None
    # cp98: released retention unpaid after its own grace (30 days + grace from release) earns interest
    r_start = None
    bearing_r = False
    if n >= 98 and rel_on and rel_part and rate is not None:
        r_due = plus_days(rel_on, 30)
        r_start = plus_days(r_due, g) if n >= 68 else r_due
        main_left = (main - cr_main) - sum(x[2] for x in allocs if x[0] <= plus_days(r_due, g))
        r_paid = max(0, -main_left)
        bearing_r = rel_part - r_paid > 0 and plus_days(r_due, g) < asof
    if not bearing and bearing_r:
        start = r_start
    fee_date = plus_days(grace_end, 1) if grace_end else None
    st8 = dict(cashAdj=None, P=P, R=R, a=0, fee=0, tot_int=0, fee_charged=0, w_int=0, w_fee=0, fee_done=False,
               t=start, wo=0, closed=False, paid_date=None, early=0, cum=0, manual_wo=False, D=0, rfees=0)

    def accrue(to):
        if not (bearing or bearing_r) or rate is None or st8['closed'] or st8['t'] is None:
            return
        frm = st8['t']
        if to > frm and st8.get('coll'):
            st8['t'] = to       # cp223: no interest once the invoice is in collections
        elif to > frm:
            base = (st8['P'] if bearing else 0) + (st8['R'] if bearing_r and frm >= r_start else 0)
            base = max(0, base - st8['D'])     # cp158: nothing in dispute earns interest
            i = compound(base, rate_final if st8.get('final') else rate, days_between(frm, to), dec, n)
            st8['a'] += i
            st8['tot_int'] += i
            st8['t'] = to

    def charge_fee(at):
        if bearing and fee_usd and not st8['fee_done'] and not st8['closed'] and fee_date <= at:
            if n >= 100:
                pct = floor_pct(st8['P'] + st8['R'], 2)
                F = max(pct, convert(10, 'USD', ccy, settings, fee_date, n))
            else:
                F = convert(fee_usd, 'USD', ccy, settings, fee_date, n)
            if n >= 91:
                F = min(F, floor_pct(grand, 10))
            st8['fee'] += F
            st8['fee_charged'] += F
            st8['fee_done'] = True

    # cp129: late interest is only owed once the invoice's total reaches the threshold
    thr = None
    if n >= 129 and settings.get('interestThreshold') is not None:
        thr = convert(settings['interestThreshold'], 'USD', ccy, settings, inv.get('issueDate'), n)

    def owed_a():
        return st8['a'] if thr is None or st8['tot_int'] >= thr else 0

    events = [(x[0], 1, x[1], ('pay', x[2])) for x in allocs]
    if n >= 70 and inv.get('interestWaivedOn') and inv['interestWaivedOn'] <= asof:
        events.append((inv['interestWaivedOn'], 2, 0, ('waive', 0)))
    wo_on = written_off_on(inv, n, asof)
    if n >= 250 and is_adj and not wo_on:
        wo_on = written_off_on(find_inv(ctx, inv['adjustmentOf']), n, asof)   # cp250: written off with its invoice
    if n >= 86 and wo_on and wo_on <= asof:
        events.append((wo_on, 3, 0, ('writeoff', 0)))
    if n >= 241 and inv.get('promisedOn') and inv['promisedOn'] <= asof:
        keep = promise_kept_on(inv, ctx, n, dec)
        if keep:
            events.append((inv['promisedOn'], 0, 0, ('pstart', 0)))
            events.append((keep, 2, 0, ('pkeep', 0)))
    if late_cn:
        for c in cns:
            events.append((c.get('issueDate', '0000-00-00'), 0, c['id'], ('cn', cn_tot[c['id']])))
    if bearing_r and r_start > (st8['t'] or ''):
        events.append((r_start, 0, 0, ('rstart', 0)))
    if n >= 217:
        for k, r in enumerate(inv.get('reminders') or []):
            if r > asof:
                continue
            lvl = LEVELS[min(k + 1, 4)]
            fee = (settings.get('reminderFees') or {}).get(lvl) if n >= 218 and not (n >= 233 and is_adj) else None
            if fee:
                events.append((r, 0, k, ('rfee', convert(fee, 'USD', ccy, settings, r, n))))
            if n >= 223 and lvl == 'FINAL':
                events.append((r, 0, k, ('final', 0)))
            if n >= 223 and lvl == 'COLLECTIONS':
                events.append((r, 0, k, ('coll', 0)))
    disp = dispute_window(inv, n, asof)
    line_disp = 0
    disp_cut = {}
    if disp and n >= 163:
        # cp163: only the disputed lines are in dispute (after their discount share, with their tax)
        qty_of = {l['id']: D(str(l['qty'])) for l in inv.get('lineItems', [])}
        for l in inv.get('lineItems', []):
            if l.get('disputed'):
                ln = b['lines'][l['id']]
                amt_ = ln['amount'] - ln['share'] + (0 if (n >= 106 and client.get('pricesIncludeTax')) else (ln['tax'] or 0))
                line_disp += amt_
                if n >= 234:
                    # cp234: a disputed line taken off by a credit note leaves the dispute from that day
                    for x in cadj:
                        if any(al.get('adjustsLine') == l['id'] and -D(str(al['qty'])) >= qty_of[l['id']]
                               for al in x.get('lineItems', [])):
                            disp_cut[x['id']] = disp_cut.get(x['id'], 0) + amt_
    if disp and n >= 164 and disp[1] and not (n >= 171 and inv.get('disputeCredit')):
        disp_events = False     # cp164: a resolved dispute only held interest back; it is all owed
    else:
        disp_events = bool(disp)
    if disp_events:
        events.append((disp[0], 4, 0, ('dispute', 0)))
        if disp[1]:
            events.append((disp[1], 5, 0, ('resolve', 0)))
    events.sort()
    methods = {p['id']: p.get('method') for p in ctx.payments}
    cash_ccy = ccy != 'JPY'
    cround = cash_rounding_revised if n >= 120 else cash_rounding
    for date, _, pid_, (kind, x) in events:
        if st8['closed']:
            continue
        if st8['t'] is not None and date > st8['t']:
            accrue(date)
        charge_fee(date)
        if kind == 'rstart':
            continue
        if kind == 'dispute':
            st8['D'] = line_disp if (line_disp or (n >= 234 and any(l.get('disputed') for l in inv.get('lineItems', [])))) \
                else 10 ** 15
            continue
        if kind == 'resolve':
            st8['D'] = 0
            continue
        if kind == 'cn':
            take = min(x, st8['P'])
            st8['P'] -= take
            if pid_ in disp_cut and st8['D'] < 10 ** 15:
                st8['D'] = max(0, st8['D'] - disp_cut[pid_])
            continue
        if kind == 'waive':
            st8['w_int'] += st8['a']
            st8['a'] = 0
            if n < 218:      # cp218: waiving leaves reminder fees owed
                st8['w_fee'] += st8['fee']
                st8['fee'] = 0
            st8['fee_done'] = True
            continue
        if kind == 'rfee':
            st8['fee'] += x
            st8['rfees'] += x
            continue
        if kind == 'pstart':
            st8['int0'] = st8['tot_int']
            continue
        if kind == 'pkeep':
            w = min(st8['a'], st8['tot_int'] - st8.get('int0', 0))    # cp241: a kept promise waives its interest
            st8['a'] -= w
            st8['w_int'] += w
            st8['pwaived'] = w
            continue
        if kind == 'final':
            st8['final'] = True
            continue
        if kind == 'coll':
            st8['coll'] = True
            continue
        if kind == 'writeoff':
            st8['wo'] += st8['P'] + st8['R'] + owed_a() + st8['fee'] + held
            st8['P'] = st8['R'] = st8['a'] = st8['fee'] = 0
            st8['closed'] = True
            st8['manual_wo'] = True
            continue
        rest = x
        st8['cum'] += x
        order = ['fee', 'a', 'P', 'R'] if n < 96 else ['P', 'R', 'fee', 'a']
        cash_settle = False
        if n >= 109 and cash_ccy and methods.get(pid_) == 'CASH':
            # cp109: a cash payment of exactly the cash amount due settles the invoice, the difference
            # being the cash rounding
            before = st8['P'] + st8['R'] + owed_a() + st8['fee']
            cd, adj = cround(before)
            if x == cd and adj != 0:
                cash_settle = True
                st8['cashAdj'] = adj
                rest = min(x, before)
        for k in order:
            if k == 'a' and owed_a() == 0:
                continue
            take = min(rest, st8[k])
            st8[k] -= take
            rest -= take
        if cash_settle:
            for k in order:
                if k == 'a' and owed_a() == 0:
                    continue
                st8[k] = 0
        if ed and window_end and date <= window_end and not st8['early'] and st8['P'] <= ed and st8['P'] > 0 \
                and st8['R'] == 0:
            st8['early'] = st8['P']
            st8['P'] = 0
        rem = st8['P'] + st8['R'] + owed_a() + st8['fee']
        if n >= 40 and 0 < rem and ctx.writeoff_limit(ccy, grand, date)(rem):
            st8['wo'] += rem
            st8['P'] = st8['R'] = st8['fee'] = 0
            if owed_a():
                st8['a'] = 0
            rem = 0
        if st8['paid_date'] is None and rem <= 0 and held <= 0:
            st8['paid_date'] = date
    if st8['t'] is not None and not st8['closed'] and asof > st8['t']:
        accrue(asof)
    charge_fee(asof)
    due_now = st8['P'] + st8['R'] + owed_a() + st8['fee']
    out['interestOwed'] = owed_a()
    out['promiseWaived'] = st8.get('pwaived', 0)
    out['reminderFees'] = st8['rfees'] if n >= 218 else None
    shown_int = st8['tot_int'] - st8['w_int'] if (thr is None or st8['tot_int'] >= thr) else 0
    out.update(due=due_now, writtenOff=st8['wo'], paidDate=st8['paid_date'], interest=shown_int,
               lateFee=st8['fee_charged'] - st8['w_fee'], waived=st8['w_int'] + st8['w_fee'],
               earlyDiscount=st8['early'], owed=due_now + held, retentionHeld=held)
    if n >= 109:
        if cash_ccy:
            cd, adj = cround(due_now)
            out['cashDue'] = cd
            out['cashRounding'] = st8['cashAdj'] if (st8['cashAdj'] is not None and due_now == 0) else adj
        else:
            out['cashDue'], out['cashRounding'] = due_now, 0
    if ed and window_end and asof <= window_end and not st8['early'] and due_now > 0:
        out['settle'] = due_now - ed
    # status
    today = d(asof)
    dsp = 0
    if disp and not disp[1] and st8['D'] and not st8['closed']:
        dsp = min(st8['D'], due_now)
    if n >= 163:
        out['disputed'] = dsp
    if st8['manual_wo']:
        s = 'Written off'
        out['owed'] = 0
    elif due_now + held <= 0:
        if paid == 0 and credited > 0 and n >= 54:
            s = 'Credited'
        else:
            s = 'Paid'
            if n >= 39 and st8['paid_date'] and duedate and d(st8['paid_date']) > d(duedate):
                s = 'Paid late'
    elif due_now <= 0 and held > 0:
        s = 'Retention held'
    elif dsp and due_now - dsp <= 0:
        s = 'Disputed'      # cp158: in dispute, not overdue (cp163: nothing undisputed left owing)
    else:
        over = False
        if n >= 23 and duedate and asof > ctx.grace_end(g, duedate) and \
                st8['P'] + st8['a'] + st8['fee'] - dsp > 0:
            over = True
        if rel_on and st8['R'] > 0 and today > d(rel_on) + dt.timedelta(days=30 + g):
            over = True
        if over and n >= 213 and (promise_stands(inv, allocs, asof, dec, ctx, n) or (
                n >= 247 and is_adj and note_promised(inv, ctx, n))):
            s = 'Promised'     # cp213: a promise to pay holds off being overdue
        elif over:
            s = 'Overdue'
            out['overdueAmt'] = due_now - dsp
        elif paid > 0 and n >= 15:
            s = 'Part paid'
        else:
            s = 'Sent'
    out['status'] = s
    return out


def milestone_amounts(inv, total, n):
    """cp169: each milestone's share of what the client pays (grand total less withholding): the total
    split by the milestones' percentages with largest remainders (ties to the lower id)."""
    ms = sorted(inv['milestones'], key=lambda m: m['id'])
    w = [(m['id'], int(D(str(m['pct'])) * 100)) for m in ms]
    shares = largest_remainder(total, w) if sum(x[1] for x in w) else {m['id']: 0 for m in ms}
    if n >= 196 and ms:
        # cp196: each share rounded down, the last milestone taking what is left
        shares = {m['id']: total * ww // 10000 for m, (_, ww) in zip(ms, w)}
        shares[ms[-1]['id']] = total - sum(v for k, v in shares.items() if k != ms[-1]['id'])
    return {m['id']: dict(amount=shares[m['id']], reachedOn=m.get('reachedOn'), disputedOn=m.get('disputedOn'))
            for m in ms}


def milestone_figures(inv, n, ctx, out, allocs, client, ccy, dec):
    """cp169: an invoice billed by milestones owes only the milestones reached so far. Reached milestones
    are due on the invoice's due date (cp170: the client's terms, else 14 days, after being reached), are
    paid in order of due date (then id), and each earns late interest once past its grace period."""
    settings, asof = ctx.settings, ctx.asof
    g = grace_of(ctx, client, inv, n)
    rate = settings.get('lateInterestRate')
    if client.get('interestRate') is not None:
        rate = client['interestRate']
    if rate is not None and D(str(rate)) == 0:
        rate = None
    rate = capped_rate(risk_rate(rate, ctx, client, inv, n), client, settings, n)
    rows = []
    for mid, m in out['ms'].items():
        r = m['reachedOn'] if m['reachedOn'] and m['reachedOn'] <= asof else None
        due = None
        if r:
            if n >= 170:
                due = ctx.add_days(r, int(client['termsDays']) if client.get('termsDays') else 14)
            else:
                due = inv.get('dueDate')
        dOn = m['disputedOn'] if (n >= 178 and m['disputedOn'] and m['disputedOn'] <= asof) else None
        rows.append(dict(id=mid, amount=m['amount'], reached=r, due=due, unpaid=m['amount'] if r else 0,
                         a=0, tot=0, t=ctx.grace_end(g, due) if due else None, disputed=bool(dOn), dOn=dOn))
        del out['ms'][mid]['disputedOn']
    order = sorted([x for x in rows if x['reached']], key=lambda x: (x['due'], x['id']))

    def accrue(to):
        for x in order:
            if rate is None or x['t'] is None or to <= x['t']:
                continue
            end = min(to, x['dOn']) if x['dOn'] else to     # cp178: nothing accrues once in dispute
            if x['unpaid'] > 0 and end > x['t']:
                i = compound(x['unpaid'], rate, days_between(x['t'], end), dec, n)
                x['a'] += i
                x['tot'] += i
            x['t'] = to

    paid_date = None
    for date, pid, amt, _ in allocs:
        accrue(date)
        rest = amt
        for x in order:     # each reached milestone's amount, then its interest, in due-date order
            if (x['dOn'] and x['dOn'] <= date) or not x['reached'] or x['reached'] > date:
                continue
            for k in ('unpaid', 'a'):
                take = min(rest, x[k])
                x[k] -= take
                rest -= take
        if paid_date is None and all(x['unpaid'] + x['a'] <= 0 for x in rows if x['reached']) \
                and all(x['reached'] for x in rows):
            paid_date = date
    accrue(asof)
    today = d(asof)
    thr = None
    if n >= 129 and settings.get('interestThreshold') is not None:
        thr = convert(settings['interestThreshold'], 'USD', ccy, settings, inv.get('issueDate'), n)
    tot_int = sum(x['tot'] for x in rows)
    under = thr is not None and tot_int < thr
    owed = over_amt = 0
    any_over = False
    for x in rows:
        a = 0 if under else x['a']
        ow = x['unpaid'] + a
        if not x['reached']:
            stx = 'Pending'
        elif x['disputed'] and ow > 0:
            stx = 'Disputed'
        elif ow <= 0:
            stx = 'Paid'
        elif asof > ctx.grace_end(g, x['due']):
            stx = 'Overdue'
            any_over = True
            over_amt += ow
        elif x['amount'] - x['unpaid'] > 0:
            stx = 'Part paid'
        else:
            stx = 'Due'
        x['status'] = stx
        owed += ow
        out['ms'][x['id']].update(status=stx, due=x['due'], lateInterest=0 if under else x['tot'])
    disputed = sum(x['unpaid'] + (0 if under else x['a']) for x in rows if x['disputed'] and x['reached'])
    out.update(due=owed, owed=owed, interest=0 if under else tot_int, paidDate=paid_date,
               disputed=disputed if n >= 178 else out.get('disputed'))
    nxt = sorted(x['due'] for x in rows if x['reached'] and x['unpaid'] + x['a'] > 0)
    out['nextDue'] = nxt[0] if nxt else None
    if owed - disputed <= 0 and disputed > 0:
        s_ = 'Disputed'
    elif owed <= 0 and all(x['reached'] for x in rows):
        s_ = 'Paid'
        if paid_date and inv.get('dueDate') and n < 170 and paid_date > inv['dueDate']:
            s_ = 'Paid late'
    elif owed <= 0:
        s_ = 'Awaiting milestone'
    elif any_over:
        s_ = 'Overdue'
        out['overdueAmt'] = over_amt
    elif out['paid'] > 0:
        s_ = 'Part paid'
    else:
        s_ = 'Sent'
    out['status'] = s_
    if n >= 109 and ccy != 'JPY':
        cd, adj = cash_rounding_revised(owed)
        out['cashDue'], out['cashRounding'] = cd, adj
    return out


def plan(inv, n, ctx, out, grand, allocs, client, ccy, dec, cns, cn_tot, draft=False):
    """An invoice on an instalment plan (cp57 on)."""
    settings = ctx.settings
    asof = ctx.asof
    issue = inv['issueDate']
    rate = inv.get('instalmentRate', 0) or 0
    if n >= 148:
        rate = capped_rate(rate, client, settings, 122)   # cp148: the plan's own rate is capped too
    count = int(inv['instalments'])
    rows = []
    financed = grand - (out.get('withholding') or 0)    # cp117: the plan spreads what the client pays
    down = None
    if n >= 85 and inv.get('planDownPct'):
        down = floor_pct(financed, inv['planDownPct'])
        financed = financed - down
    fee = 0
    if n >= 143 and settings.get('planFee') is not None:
        fee = convert(settings['planFee'], 'USD', ccy, settings, draft_date(inv, ctx, n), n)   # cp143
        financed += fee
    out['planFee'] = fee if n >= 143 else None
    if down is not None:
        rows.append(dict(n=0, payment=down, interest=0, principal=down, balance=financed, due=issue))
    for r in annuity(financed, rate, count, dec, n):
        rows.append(dict(r, due=add_months(issue, r['n'])))
    skip = inv.get('skippedInstalment') if n >= 99 else None
    if skip and 1 <= int(skip) < count:
        j = next(i for i, r in enumerate(rows) if r['n'] == int(skip))
        bal = rows[j - 1]['balance'] if j > 0 else financed
        i_m = D(str(rate)) / 100 / 12
        interest = mr(D(bal) / 10 ** dec * i_m, dec)
        rows[j] = dict(rows[j], payment=interest, interest=interest, principal=0, balance=bal)
        new = annuity(bal, rate, count - int(skip), dec, n)
        for k, r in enumerate(new):
            rows[j + 1 + k] = dict(r, n=rows[j + 1 + k]['n'], due=rows[j + 1 + k]['due'])
    if n >= 73 and not draft:
        for c in sorted(cns, key=lambda c: (c.get('issueDate', ''), c['id'])):
            j = next((i for i, r in enumerate(rows) if r['due'] > c.get('issueDate', '') and r['n'] > 0), None)
            if j is None:
                continue
            before = rows[j - 1]['balance'] if j > 0 else financed
            left = len(rows) - j
            new = annuity(before - cn_tot[c['id']], rate, left, dec, n)
            for i, r in enumerate(new):
                rows[j + i] = dict(r, n=rows[j + i]['n'], due=rows[j + i]['due'])
    plan_total = sum(r['payment'] for r in rows)
    out['planTotal'] = plan_total
    for r in rows:
        out['insts'][r['n']] = dict(due=r['due'], payment=r['payment'], interest=r['interest'],
                                    principal=r['principal'], balance=r['balance'], paid=0,
                                    status='Due', lateInterest=0, fee=0)
    if draft:
        return out
    credited = out['credited'] if n < 73 else 0
    g = ctx.grace(client)
    lrate = None
    if n >= 66:
        lrate = settings.get('lateInterestRate')
        if n >= 87 and client.get('interestRate') is not None:
            lrate = client['interestRate']
        if lrate is not None and D(str(lrate)) == 0:
            lrate = None
        lrate = capped_rate(risk_rate(lrate, ctx, client, inv, n), client, settings, n)
    fee_usd = settings.get('lateFee') if 95 <= n < 128 else None   # cp128: no more late fees
    unpaid = {r['n']: r['payment'] for r in rows}
    a = {r['n']: 0 for r in rows}
    fee = {r['n']: 0 for r in rows}
    tot = {r['n']: 0 for r in rows}
    feetot = {r['n']: 0 for r in rows}
    t = {}
    bearing = {}
    cum = 0
    # an instalment bears late interest (and a fee) when it is not paid off by the end of its grace
    for r in rows:
        ge = plus_days(r['due'], g)
        through = sum(rr['payment'] for rr in rows if rr['n'] <= r['n'])
        paid_by = sum(x[2] for x in allocs if x[0] <= ge) + credited
        bearing[r['n']] = (lrate is not None or fee_usd) and paid_by < through and ge < asof
        t[r['n']] = r['due'] if n < 68 else ge
    fee_done = {r['n']: False for r in rows}

    def accrue(to):
        for r in rows:
            k = r['n']
            if bearing[k] and lrate is not None and to > t[k] and unpaid[k] + a[k] > 0:
                base = unpaid[k]
                i = compound(base, lrate, days_between(t[k], to), dec, n)
                a[k] += i
                tot[k] += i
            if to > t[k]:
                t[k] = to
            fd = plus_days(r['due'], g + 1)
            if bearing[k] and fee_usd and not fee_done[k] and fd <= to and unpaid[k] > 0:
                if n >= 100:
                    F = max(floor_pct(unpaid[k], 2), convert(10, 'USD', ccy, settings, fd, n))
                else:
                    F = convert(fee_usd, 'USD', ccy, settings, fd, n)
                F = min(F, floor_pct(r['payment'], 10))
                fee[k] += F
                feetot[k] += F
                fee_done[k] = True

    settled = False
    saved = 0
    paid_date = None
    wo = 0
    rest_credit = credited
    for k in unpaid:
        take = min(rest_credit, unpaid[k])
        unpaid[k] -= take
        rest_credit -= take
    thr = None
    if n >= 149 and settings.get('interestThreshold') is not None:
        thr = convert(settings['interestThreshold'], 'USD', ccy, settings, issue, n)

    def under():
        """cp149: the plan's late interest is not owed until its total reaches the threshold."""
        return thr is not None and sum(tot.values()) < thr

    def A(k):
        return 0 if under() else a[k]

    def TOT():
        return 0 if under() else sum(tot.values())

    for date, pid, x, _ in allocs:
        if settled:
            continue
        accrue(date)
        cum += x
        rest = x
        for r in rows:
            k = r['n']
            order = [fee, a, unpaid] if n < 96 else [unpaid, fee, a]
            for pot in order:
                if pot is a and under():
                    continue
                take = min(rest, pot[k])
                pot[k] -= take
                rest -= take
        if n >= 71:
            future_int = sum(r['interest'] for r in rows if r['due'] > date)
            payoff_total = plan_total - future_int + TOT() + sum(feetot.values())
            if cum + credited >= payoff_total and any(unpaid[k] > 0 for k in unpaid):
                settled = True
                saved = plan_total + TOT() + sum(feetot.values()) - cum - credited
                for k in unpaid:
                    unpaid[k] = a[k] = fee[k] = 0
        remaining = sum(unpaid.values()) + sum(A(k) for k in a) + sum(fee.values())
        if n >= 40 and 0 < remaining and ctx.writeoff_limit(ccy, grand, date)(remaining):
            wo = remaining
            for k in unpaid:
                unpaid[k] = a[k] = fee[k] = 0
            remaining = 0
        if paid_date is None and remaining <= 0:
            paid_date = date
    if not settled:
        accrue(asof)
    today = d(asof)
    overdue_amt = 0
    any_over = False
    for r in rows:
        k = r['n']
        ins = out['insts'][k]
        ins['paid'] = r['payment'] - unpaid[k] if not settled else r['payment']
        ins['lateInterest'] = 0 if under() else tot[k]
        ins['fee'] = feetot[k]
        owing = unpaid[k] + A(k) + fee[k]
        if owing <= 0:
            ins['status'] = 'Paid'
        elif today > d(r['due']) + dt.timedelta(days=g):
            ins['status'] = 'Overdue'
            any_over = True
            overdue_amt += owing
        elif ins['paid'] > 0:
            ins['status'] = 'Part paid'
        else:
            ins['status'] = 'Due'
    due = sum(unpaid.values()) + sum(A(k) for k in a) + sum(fee.values())
    out.update(due=due, owed=due, writtenOff=wo, paidDate=paid_date, interest=TOT(),
               lateFee=sum(feetot.values()), saved=saved)
    nxt = [r['due'] for r in rows if unpaid[r['n']] + A(r['n']) + fee[r['n']] > 0]
    out['nextDue'] = nxt[0] if nxt else None
    if n >= 71 and due > 0:
        future_int = sum(r['interest'] for r in rows if r['due'] > asof)
        out['payoff'] = plan_total - future_int + TOT() + sum(feetot.values()) - out['paid'] - credited
    if due <= 0:
        s = 'Paid'
    elif any_over:
        s = 'Overdue'
        out['overdueAmt'] = overdue_amt
    elif out['paid'] > 0:
        s = 'Part paid'
    else:
        s = 'Sent'
    out['status'] = s
    return out


# ------------------------------------------------------------------------------ Act IV helpers

def prorate_minor(monthly, start, end, dec, n):
    """cp155: a whole-month amount (minor units) for start..end inclusive: each calendar month's share is
    the monthly amount x days in the period in that month / days in that month, the shares summed exactly
    and rounded half up once (calendar_prorate, cross-checked for cents)."""
    if n >= 176:
        # cp176: a day rate of the monthly amount x 12 / 365, times the days, rounded once
        v = int((D(monthly) * 12 / 365 * ((d(end) - d(start)).days + 1)).quantize(D(1), rounding=ROUND_HALF_UP))
        if dec == 2:
            assert v == calendar_prorate_revised(monthly, d(start), d(end)), (monthly, start, end)
        return v
    total, x, e = D(0), d(start), d(end)
    while x <= e:
        mdays = calendar.monthrange(x.year, x.month)[1]
        seg = min(dt.date(x.year, x.month, mdays), e)
        total += D(monthly) * ((seg - x).days + 1) / mdays
        x = seg + dt.timedelta(days=1)
    v = int(total.quantize(D(1), rounding=ROUND_HALF_UP))
    if dec == 2:
        assert v == calendar_prorate(monthly, d(start), d(end)), (monthly, start, end)
    return v


def grace_of(ctx, client, inv, n):
    """The grace days of an invoice (cp216: none for a client in the HIGH band, judged on their other
    invoices)."""
    if n >= 216 and not getattr(ctx, '_busy', False) and ctx.risk(inv['clientId'], exclude=inv['id'])[1] == 'HIGH':
        return 0
    if n >= 243 and inv.get('adjustmentOf') is not None and inv.get('dueDate') and inv.get('issueDate') \
            and inv['dueDate'] <= inv['issueDate']:
        return 0         # cp243: a note due at once has no grace
    return ctx.grace(client)


def late_rates(rate, ctx, client, inv, n):
    """(late interest rate, rate once a FINAL reminder has gone out). cp179: +3 points for a HIGH client;
    cp223: +2 points from the FINAL reminder; both before the regional cap (cp232: the cap applies to the
    usual rate only, the additions go on top)."""
    settings = ctx.settings
    if rate is None:
        return None, None
    if n >= 232:
        r0 = D(str(capped_rate(rate, client, settings, n)))
        r1 = D(str(risk_rate(r0, ctx, client, inv, n)))
        return r1, r1 + 2
    r1 = risk_rate(rate, ctx, client, inv, n)
    cur = capped_rate(r1, client, settings, n)
    fin = capped_rate(D(str(r1)) + 2, client, settings, n) if n >= 223 else cur
    return cur, fin


def risk_rate(rate, ctx, client, inv, n):
    """cp179: a HIGH-risk client's late interest rate is 3 points higher (before any regional cap)."""
    if n < 179 or rate is None or getattr(ctx, '_busy', False):
        return rate
    if ctx.risk(inv['clientId'], exclude=inv['id'])[1] == 'HIGH':
        return D(str(rate)) + 3
    return rate


def dispute_window(inv, n, asof):
    """cp158: (disputed on, resolved on or None) when the invoice has been put in dispute by today."""
    if n < 158 or not inv.get('disputedOn') or inv['disputedOn'] > asof:
        return None
    r = inv.get('disputeResolvedOn')
    return (inv['disputedOn'], r if r and r <= asof else None)


def approval_limit(client, settings, n, ctx=None):
    """cp151: the workspace approval limit in US dollars; cp166: the client's tier's limit when listed;
    cp194: half of it for a MEDIUM-risk client."""
    lim = settings.get('approvalLimit')
    if n >= 166 and client.get('tier') and client['tier'] in (settings.get('tierApprovalLimits') or {}):
        lim = settings['tierApprovalLimits'][client['tier']]
    if n >= 194 and lim is not None and ctx is not None and client.get('id') is not None \
            and ctx.risk(client['id'])[1] == 'MEDIUM':
        lim = D(str(lim)) / 2
    return lim


def approval_days(client, n):
    """How long an approval lasts (cp156: 30 days; cp191: 90 for KEY clients, 7 for NEW ones)."""
    if n >= 191:
        return {'KEY': 90, 'NEW': 7}.get(client.get('tier'), 30)
    return 30


def committed(ctx, cid, exclude, n):
    """cp190: what the client's approved drafts will add to their balance (grand total less withholding)."""
    if n < 190:
        return 0
    out = 0
    for inv in ctx.invoices:
        if inv['clientId'] == cid and inv.get('status', 'DRAFT') == 'DRAFT' and inv['id'] != exclude \
                and inv.get('creditOf') is None and inv.get('approvedTotal') is not None:
            f = _figures(inv, n, ctx)
            if approval(inv, f, ctx, n, skip_limit=True) == 'Approved':
                out += f['grand'] - (f.get('withholding') or 0)
    return out


def approval(inv, f, ctx, n, skip_limit=False):
    """cp151: 'Not needed', 'Needs approval' or 'Approved' for an invoice (credit notes: None); cp182:
    'Needs 2 approvals' / 'Needs 1 more approval' where two are needed."""
    if n < 151 or (n >= 54 and inv.get('creditOf') is not None):
        return None
    if n >= 204 and inv.get('adjustmentOf') is not None and (n < 210 or is_credit_adj(inv)):
        return None        # cp210: only a debit adjustment note can need approval
    client = ctx.clients.get(inv['clientId'], {})
    settings = ctx.settings
    # cp189: an invoice with an instalment plan is judged (and approved) on the plan total
    amt = f['planTotal'] if (n >= 189 and f.get('planTotal') is not None) else f['grand']
    needs = False
    lim = approval_limit(client, settings, n, ctx)
    lim_c = convert(lim, 'USD', f['ccy'], settings, draft_date(inv, ctx, n), n) if lim is not None else None
    if lim is not None:
        needs = amt > lim_c
    if n >= 152 and f['discount'] * 5 > f['subtotal']:
        needs = True       # cp152: a discount of more than a fifth of the subtotal
    if n >= 202 and inv.get('status', 'DRAFT') == 'DRAFT' and duplicate_of(inv, ctx, n):
        needs = True       # cp202: a possible duplicate
    if n >= 219 and inv.get('status', 'DRAFT') == 'DRAFT' and reminded_overdue(ctx, inv['clientId'], n, 2):
        needs = True       # cp219: a second reminder unpaid
    high = n >= 161 and ctx.risk(inv['clientId'])[1] == 'HIGH'
    if high:
        needs = True       # cp161: every invoice of a high-risk client
    if n >= 180 and not skip_limit and client.get('creditLimit') is not None and inv.get('status', 'DRAFT') == 'DRAFT':
        # cp180: a draft that would take the client over its credit limit can go out once approved
        cl = credit_limit(client, ctx, n)
        if ctx.exposure(inv['clientId']) + committed(ctx, inv['clientId'], inv['id'], n) + \
                f['grand'] - (f.get('withholding') or 0) > cl:
            needs = True
    if not needs:
        return 'Not needed'
    needed = 1
    mult = D('1.5') if n >= 200 else 2
    if n >= 182 and lim is not None and amt > mult * lim_c:
        needed = 2         # cp182: over twice the limit takes two approvals (cp200: one and a half times)
    if n >= 200 and high:
        needed = 2         # cp200: and every invoice of a high-risk client
    at = inv.get('approvedTotal')
    if at is None:
        return 'Needs 2 approvals' if needed == 2 else 'Needs approval'
    at = mr(D(str(at)), dec_of(f['ccy']))
    if n < 156:
        ok = amt <= at
    elif n >= 224:
        # cp224: an approval covers any total up to the one approved, for as long as it lasts
        ok = amt <= at and not (inv.get('approvedOn') and
                                ctx.days_since(inv['approvedOn'], ctx.asof) > approval_days(client, n))
    else:
        # cp156: approved for the exact total, and for 30 days from the day it was given (cp191: by tier)
        ok = amt == at and not (inv.get('approvedOn') and
                                ctx.days_since(inv['approvedOn'], ctx.asof) > approval_days(client, n))
    if ok and needed == 2 and int(inv.get('approvals') or 1) < 2:
        return 'Needs 1 more approval'
    if not ok:
        return 'Needs 2 approvals' if needed == 2 else 'Needs approval'
    return 'Approved'


def risk_of(ctx, cid, n, exclude=None):
    """cp161: exponentially weighted average (alpha 0.3, oldest payment first) of the days from issue to
    payment of the client's paid invoices, to one decimal; its band. No paid invoice: no score, LOW."""
    rows = []
    for inv in ctx.invoices:
        if inv['clientId'] != cid or (n >= 54 and inv.get('creditOf') is not None) or inv.get('status') != 'SENT' \
                or inv['id'] == exclude:
            continue
        f = _figures(inv, n, ctx)
        paid_on = f.get('paidDate') if f['status'] in ('Paid', 'Paid late') else None
        if n >= 193 and f['status'] == 'Written off':
            wo_on = written_off_on(inv, n, ctx.asof)
            if n >= 250 and not wo_on and inv.get('adjustmentOf') is not None:
                wo_on = written_off_on(find_inv(ctx, inv['adjustmentOf']), n, ctx.asof)   # cp250: with its invoice
            if wo_on:
                paid_on = wo_on   # cp193: counts as paid the day it was written off
        if n >= 240 and f['status'] == 'Overdue' and len(inv.get('reminders') or []) >= 3:
            paid_on = ctx.asof     # cp240: an unpaid final notice counts as if paid today
        if not paid_on or not inv.get('issueDate'):
            continue
        if n >= 192:
            # cp192: days late (after the due date, 0 when on time)
            rows.append((paid_on, inv['id'], max(0, days_between(inv.get('dueDate') or paid_on, paid_on))))
        else:
            rows.append((paid_on, inv['id'], days_between(inv['issueDate'], paid_on)))
    if not rows:
        return None, 'LOW'
    rows.sort()
    if n >= 192:
        score = ewma_days_to_pay([r[2] for r in rows], '0.5')
        return score, risk_band_revised(score)
    score = ewma_days_to_pay([r[2] for r in rows], '0.3')
    return score, risk_band(score)


def figures(inv, n, ctx):
    out = _figures(inv, n, ctx)
    if n >= 151:
        out['approval'] = approval(inv, out, ctx, n)
    return out


def remittance_match(fx, pmt, n):
    """cp159: the client's open invoice whose purchase order number is most like the payment's remittance
    text (Jaro-Winkler, lower-cased), when at least 0.85; ties to the earlier due date, then the lower id.
    Open = something due before this payment (and any later one). Returns (number or '', score text)."""
    f2 = dict(fx, payments=[p for p in fx.get('payments', []) if p['id'] < pmt['id']])
    ctx = Ctx(f2, n)
    cands = []
    for inv in ctx.invoices:
        if inv['clientId'] != pmt['clientId'] or inv.get('status') != 'SENT' or inv.get('creditOf') is not None \
                or not inv.get('poNumber'):
            continue
        f = figures(inv, n, ctx)
        if f['due'] <= 0 or f['status'] == 'Disputed':
            continue
        cands.append((inv, f['due']))
    # cp181: several parts separated by ';' are matched in turn, each to an invoice not matched before
    parts = [x.strip() for x in pmt['remittance'].split(';')] if n >= 181 else [pmt['remittance']]
    thr = 0.9 if n >= 184 else 0.85
    nums, scores, used = [], [], set()
    for part in parts:
        best = None
        for inv, due in cands:
            if inv['id'] in used:
                continue
            sc = jaro_winkler(part, inv['poNumber'])
            # cp184: ties go to the larger amount due, then the earlier due date
            key = (-sc, -due, inv.get('dueDate') or '', inv['id']) if n >= 184 else (-sc, inv.get('dueDate') or '', inv['id'])
            if best is None or key < best[0]:
                best = (key, inv, sc)
        if best is not None and best[2] >= thr:
            used.add(best[1]['id'])
            nums.append(number_of(best[1], n, ctx.asof))
            scores.append(str(D(best[2]).quantize(D('0.001'), rounding=ROUND_HALF_UP)))
    if not nums:
        return '', None
    return ', '.join(nums), ', '.join(scores)


def number_of(inv, n, asof=None):
    num = invoice_number_luhn(inv['id'])
    if n >= 236 and number_date(inv, asof) >= MOD11_FROM:
        num = invoice_number_mod11(inv['id'])     # cp236: issued from 2026-07-01, ISO 7064 MOD 11-2
    if n >= 54 and inv.get('creditOf') is not None:
        return 'CN-' + num[4:]
    if n >= 204 and inv.get('adjustmentOf') is not None:
        return 'ADJ-' + num[4:]
    return num


MOD11_FROM = '2026-07-01'


def number_date(inv, asof):
    """The date an invoice's number is judged on: its issue date once sent, today for a draft."""
    if inv.get('status', 'DRAFT') == 'DRAFT' and asof:
        return asof
    return inv.get('issueDate') or asof or ''


def reference_of(inv, n, asof=None):
    """The RF reference: ISO 11649 over the characters after the number's prefix."""
    return rf_reference(number_of(inv, n, asof).split('-', 1)[1])


def workspace_values(fx, n, strict=False):
    """Every figure a spec can read, as the workspace shows it, under the rules at checkpoint n."""
    ctx = Ctx(fx, n)
    out = {}
    bal = {}
    for inv in ctx.invoices:
        f = figures(inv, n, ctx)
        ccy = f['ccy']
        M = lambda c: fmt(c, ccy)
        p = f"inv{inv['id']}."
        for k in ('subtotal', 'discount', 'tax', 'grand', 'paid', 'due', 'writtenOff', 'credited',
                  'retention', 'retentionHeld', 'interest', 'lateFee', 'waived', 'earlyDiscount', 'saved'):
            out[p + k] = M(f[k])
        for k in ('settle', 'planTotal', 'payoff'):
            out[p + k] = M(f[k]) if f[k] is not None else None
        for k in ('surcharge', 'minimumCharge', 'net', 'withholding', 'cashDue', 'cashRounding', 'planFee', 'disputed',
                  'sentTotal', 'currentTotal', 'adjusted', 'reminderFees', 'promiseWaived'):
            if f.get(k) is not None:
                out[p + k] = M(f[k])
        out[p + 'reverseCharge'] = f.get('reverseCharge')
        if f.get('approval') is not None:
            out[p + 'approval'] = f['approval']
        if f.get('taxReport') is not None:
            for r, net_, tax_ in f['taxReport']:
                rs = format(r.normalize(), 'f') if r != 0 else '0'
                out[f"{p}taxReport.{rs}"] = f"TAX_CHARGED id={inv['id']} rate={rs} net={plain(net_, ccy)} tax={plain(tax_, ccy)}"
        out[p + 'fxDiff'] = fmt(f['fxDiff']) if f['fxDiff'] is not None else None
        out[p + 'listTotal'] = M(-f['grand'] if (inv.get('creditOf') is not None and n >= 54)
                                 or (n >= 204 and is_credit_adj(inv)) else f['grand'])
        out[p + 'status'] = f['status']
        out[p + 'paidDate'] = f['paidDate']
        out[p + 'nextDue'] = f['nextDue']
        out[p + 'dueDate'] = inv.get('dueDate')
        out[p + 'number'] = number_of(inv, n, ctx.asof)
        out[p + 'reference'] = reference_of(inv, n, ctx.asof) if n >= 236 else rf_reference(invoice_number_luhn(inv['id'])[4:])
        for lid, dd in f['lines'].items():
            for k, v in dd.items():
                out[f"{p}line{lid}.{k}"] = M(v) if isinstance(v, int) and not isinstance(v, bool) else v
        for k, ins in f['insts'].items():
            for kk, v in ins.items():
                out[f"{p}inst{k}.{kk}"] = M(v) if isinstance(v, int) else v
        for k, ms in (f.get('ms') or {}).items():
            for kk, v in ms.items():
                out[f"{p}ms{k}.{kk}"] = M(v) if isinstance(v, int) and not isinstance(v, bool) else v
        b = bal.setdefault(inv['clientId'], [0, 0])
        if f['status'] not in ('Draft', 'Void', 'Credit note', 'Written off'):
            b[0] += f['owed'] if n >= 51 else f['due']
            if f['status'] == 'Overdue':
                b[1] += f['overdueAmt'] if n >= 51 else f['due']
    credit = {}
    if n >= 51:
        for pmt in ctx.payments:
            if pmt.get('reversed'):
                continue
            out[f"pay{pmt['id']}.surcharge"] = fmt(ctx.card_surcharge(pmt), ctx.ccy(pmt['clientId']))
            out[f"pay{pmt['id']}.fxFee"] = fmt(ctx.fx_fee(pmt), ctx.ccy(pmt['clientId']))
            out[f"pay{pmt['id']}.applied"] = fmt(ctx.applied_minor(pmt), ctx.ccy(pmt['clientId']))
            left = ctx.applied_minor(pmt) - sum(mr(D(str(a['amount'])), dec_of(ctx.ccy(pmt['clientId'])))
                                           for a in pmt.get('allocations', []))
            if n >= 53:
                left -= mr(D(str(pmt.get('refunded', 0))), dec_of(ctx.ccy(pmt['clientId'])))
            if strict:
                assert left >= 0, f"payment {pmt['id']} is over-allocated by {-left}"
            credit[pmt['clientId']] = credit.get(pmt['clientId'], 0) + left
    for cid in ctx.clients:
        ccy = ctx.ccy(cid)
        bb = bal.get(cid, [0, 0])
        out[f'client{cid}.balance'] = fmt(bb[0] - credit.get(cid, 0), ccy)
        out[f'client{cid}.overdue'] = fmt(bb[1], ccy)
        out[f'client{cid}.credit'] = fmt(credit.get(cid, 0), ccy)
        client = ctx.clients[cid]
        expo = bb[0] - credit.get(cid, 0)
        if n >= 183:
            expo = ctx.exposure(cid)
        if n >= 153 and client.get('creditLimit') is not None:
            # cp153: what the client can still owe within its credit limit (cp190: less approved drafts)
            out[f'client{cid}.available'] = fmt(credit_limit(client, ctx, n) - expo - committed(ctx, cid, None, n), ccy)
        if n >= 154:
            out[f'client{cid}.status'] = 'On hold' if client_on_hold(client, expo, n, ctx) else 'Active'
        if n >= 161:
            sc, band = ctx.risk(cid)
            out[f'client{cid}.riskScore'] = '-' if sc is None else str(sc)
            out[f'client{cid}.riskBand'] = band
    if n >= 201:
        act5_values(ctx, n, out)
        out.update(ok_values(fx, n))
    if n >= 159:
        for pmt in ctx.payments:
            if pmt.get('remittance'):
                m_, sc_ = remittance_match(fx, pmt, n)
                out[f"pay{pmt['id']}.match"] = m_
                out[f"pay{pmt['id']}.matchScore"] = sc_
    return out


def credit_limit(client, ctx, n):
    """The client's credit limit in minor units (cp198: half of it for a HIGH-risk client), or None."""
    if client.get('creditLimit') is None:
        return None
    lim = mr(D(str(client['creditLimit'])), dec_of(ctx.ccy(client['id'])))
    if n >= 198 and ctx.risk(client['id'])[1] == 'HIGH':
        lim = lim // 2 if dec_of(ctx.ccy(client['id'])) == 0 else int((D(lim) / 2).quantize(D(1), rounding=ROUND_FLOOR))
    return lim


def client_on_hold(client, balance, n, ctx=None):
    """cp154: a client put on hold; cp160: also while their balance is over their credit limit; cp199: or
    while one of their disputes has been open for more than 30 days."""
    lim = credit_limit(client, ctx, n) if ctx is not None else (
        mr(D(str(client['creditLimit'])), dec_of(client.get('currency') or 'USD')) if client.get('creditLimit') is not None else None)
    if n >= 160 and lim is not None and balance > lim:
        return True
    if n >= 199 and ctx is not None:
        for inv in ctx.invoices:
            if inv['clientId'] != client['id'] or inv.get('status') != 'SENT':
                continue
            dates = [inv.get('disputedOn')] if not inv.get('disputeResolvedOn') else []
            dates += [m.get('disputedOn') for m in inv.get('milestones') or []]
            if any(x and days_between(x, ctx.asof) > 30 for x in dates):
                return True
    if n >= 219 and ctx is not None and reminded_overdue(ctx, client['id'], n, 3):
        return True       # cp219: a final notice unpaid
    return bool(client.get('onHold'))


# ------------------------------------------------------------------------------ Act V

def bday_add(start, k, hol, n):
    """cp209: k business days after start (weekends and holidays skipped; cp220: weekend holidays observed)."""
    if n >= 220:
        hol = observed_holidays(hol)
    return add_business_days(start, k, hol)


def bday_between(a, b, hol, n):
    if n >= 220:
        hol = observed_holidays(hol)
    return business_days_between(a, b, hol)


def find_inv(ctx, iid):
    return next((x for x in ctx.invoices if x['id'] == iid), None)


def is_credit_adj(inv):
    """cp204: an adjustment note taking lines off (every line a negative quantity) works like a credit note."""
    lines = inv.get('lineItems') or []
    return bool(lines) and inv.get('adjustmentOf') is not None and all(D(str(l['qty'])) < 0 for l in lines)


def _abs_num(q):
    v = abs(D(str(q)))
    return int(v) if v == v.to_integral_value() else float(v)


def adj_base(inv, n, ctx, client, dec):
    """cp204: an adjustment note's figures: its lines (quantities as positive) priced and taxed like lines
    of its original (the original's date, region and tax rules), with no minimum charge; cp205: carrying the
    original's percentage discount and surcharge."""
    orig = find_inv(ctx, inv['adjustmentOf'])
    lines = [dict(l, qty=_abs_num(l['qty'])) for l in inv.get('lineItems', [])]
    syn = {k: v for k, v in inv.items() if k not in ('discountPct', 'discountAmount', 'discountCap', 'surchargePct',
                                                       'supplyRegion')}
    syn.update(lineItems=lines, status='SENT', issueDate=draft_date(orig, ctx, n))
    if orig.get('supplyRegion'):
        syn['supplyRegion'] = orig['supplyRegion']
    if n >= 205:
        if orig.get('discountPct'):
            syn['discountPct'] = orig['discountPct']
        if orig.get('surchargePct'):
            syn['surchargePct'] = orig['surchargePct']
    b = base_figures(syn, n, ctx.settings, client, dec, credit_note=False, ctx=ctx, adjustment=True)
    if n >= 242 and is_credit_adj(inv):
        b = keep_minimum(inv, orig, b, n, ctx, client, dec)
    return b


def keep_minimum(inv, orig, b, n, ctx, client, dec):
    """cp242: a credit note never takes its invoice below its minimum charge: the part of the credit that
    would is kept back as a minimum charge, taxed at the standard rate on its own (half up)."""
    settings = ctx.settings
    minimum = None
    if client.get('minimumCharge') is not None:
        minimum = mr(D(str(client['minimumCharge'])), dec)
    elif settings.get('minimumCharge') is not None:
        minimum = convert(settings['minimumCharge'], 'USD', ctx.ccy(orig['clientId']), settings,
                          draft_date(orig, ctx, n), n)
    if not minimum:
        return b
    ob = base_figures(orig, n, settings, client, dec, ctx=ctx)
    left = ob['subtotal'] - ob['discount'] + ob['surcharge'] + ob['minimumCharge']
    for x in sorted(adj_notes(orig, ctx, n), key=lambda x: x['id']):
        if x['id'] >= inv['id']:
            continue
        xb = adj_base(x, n, ctx, client, dec)
        part = xb['subtotal'] - xb['discount'] + xb['surcharge'] - xb.get('minimumCharge', 0)
        left += -part if is_credit_adj(x) else part
    mine = b['subtotal'] - b['discount'] + b['surcharge']
    keep = min(mine, max(0, minimum - (left - mine)))
    if keep <= 0:
        return b
    rate = D(0) if b['reverseCharge'] else b['stdRate']
    if n >= 49 and client.get('taxExempt'):
        rate = D(0)
    ktax = mr(D(keep) / 10 ** dec * rate / 100, dec)
    return dict(b, minimumCharge=keep, tax=b['tax'] - ktax, grand=b['grand'] - keep - ktax,
                net=b['net'] - keep)


def invoice_grand(inv, n, ctx):
    """(grand, tax) of an invoice as it stands, its sent figures when it has them (cp201)."""
    client = ctx.clients.get(inv['clientId'], {})
    dec = ctx_dec(ctx, inv)
    if n >= 204 and inv.get('adjustmentOf') is not None:
        b = adj_base(inv, n, ctx, client, dec)
    else:
        b = base_figures(inv, n, ctx.settings, client, dec, credit_note=False, ctx=ctx)
    if n >= 201 and inv.get('status') == 'SENT' and inv.get('sentTotal') is not None:
        sg = mr(D(str(inv['sentTotal'])), dec)
        stx = mr(D(str(inv['sentTax'])), dec) if inv.get('sentTax') is not None else b['tax']
        return sg, stx
    return b['grand'], b['tax']


def rebill_cn_total(cn, n, ctx):
    """cp203: the credit note a rebill issues is for exactly what its original was sent for."""
    orig = find_inv(ctx, cn.get('creditOf'))
    if orig is None or not orig.get('rebilledOn') or cn.get('issueDate') != orig['rebilledOn']:
        return None
    return invoice_grand(orig, n, ctx)


def adj_notes(inv, ctx, n, sent_only=True):
    return [x for x in ctx.invoices if n >= 204 and x.get('adjustmentOf') == inv['id']
            and (x.get('status') == 'SENT' or not sent_only)]


def withholding_base(inv, b, n, ctx, client, dec):
    """cp205: (amount withheld on, amount the threshold is judged on). The threshold is judged on the invoice
    with its adjustment notes; a credit adjustment gives back its share of what the original withheld, and a
    debit adjustment withholds on its own amount before tax."""
    def net_of(x):
        g, t = invoice_grand(x, n, ctx)
        return g - t
    if inv.get('adjustmentOf') is not None:
        orig = find_inv(ctx, inv['adjustmentOf'])
        tot = net_of(orig)
        for x in adj_notes(orig, ctx, n):
            if x['id'] != inv['id']:
                tot += -net_of(x) if is_credit_adj(x) else net_of(x)
        return b['net'], tot + b['net']
    debit = credit = 0
    for x in adj_notes(inv, ctx, n):
        if is_credit_adj(x):
            credit += net_of(x)
        else:
            debit += net_of(x)
    return b['net'] - credit, b['net'] + debit - credit


def fp_rows(inv, ctx, n):
    """The lines a fingerprint is taken over: (description, quantity, unit price in minor units), the unit
    price the line is charged at (0 for a line priced in bands); cp207: a sent invoice's lines as adjusted."""
    client = ctx.clients.get(inv['clientId'], {})
    dec = ctx_dec(ctx, inv)

    def rows_of(x):
        if n >= 204 and x.get('adjustmentOf') is not None:
            b = adj_base(x, n, ctx, client, dec)
        else:
            b = base_figures(x, n, ctx.settings, client, dec, ctx=ctx)
        out = []
        for l in x.get('lineItems', []):
            pr = b['lines'][l['id']].get('unitPrice')
            if pr is None:
                pr = mr(D(str(l['unitPrice'])), dec) if l.get('unitPrice') is not None and not b['_tiered'].get(l['id']) else 0
            out.append((l['description'], qty_str(D(str(l['qty']))), pr))
        return out
    rows = rows_of(inv)
    if n >= 207 and inv.get('status') == 'SENT':
        for x in sorted(adj_notes(inv, ctx, n), key=lambda x: x['id']):
            for desc, q, pr in rows_of(x):
                if D(q) > 0:
                    rows.append((desc, q, pr))
                else:
                    key = (' '.join(desc.lower().split()), qty_str(-D(q)), pr)
                    for j, r in enumerate(rows):
                        if (' '.join(r[0].lower().split()), r[1], r[2]) == key:
                            del rows[j]
                            break
    return rows


def fingerprint_of(inv, ctx, n):
    rows = fp_rows(inv, ctx, n)
    if n >= 208:
        return fingerprint_revised(inv['clientId'], rows)
    return sha_fingerprint(inv['clientId'], rows)


def dup_candidate(x, inv, ctx, n):
    if x['id'] == inv['id'] or x['clientId'] != inv['clientId'] or not x.get('lineItems'):
        return False
    if x.get('creditOf') is not None or x.get('adjustmentOf') is not None:
        return False
    if x.get('status') == 'SENT':
        dd = ctx.settings.get('duplicateDays')
        if dd is None or not x.get('issueDate') or days_between(x['issueDate'], ctx.asof) > int(dd):
            return False    # cp202: only invoices sent within the workspace's duplicate window
        if n >= 203 and (x.get('rebilledOn') or x['id'] == inv.get('replaces')
                         or _figures(x, n, ctx)['status'] == 'Credited'):
            return False    # cp203: a rebilled or fully credited invoice is not a duplicate
        return True
    # cp208: an earlier draft counts too
    return n >= 208 and ctx.settings.get('duplicateDays') is not None and x.get('status', 'DRAFT') == 'DRAFT' \
        and x['id'] < inv['id'] and x['id'] != inv.get('replaces')


def duplicate_of(inv, ctx, n):
    """cp202: numbers of the client's other invoices with the same fingerprint as this draft."""
    if n < 202 or inv.get('status', 'DRAFT') != 'DRAFT' or inv.get('creditOf') is not None \
            or inv.get('adjustmentOf') is not None or not inv.get('lineItems'):
        return []
    fp = fingerprint_of(inv, ctx, n)
    return [number_of(x, n, ctx.asof) for x in sorted(ctx.invoices, key=lambda x: x['id'])
            if dup_candidate(x, inv, ctx, n) and fingerprint_of(x, ctx, n) == fp]


def major(minor, dec=2):
    """Minor units as a fixture number (whole when it can be)."""
    v = D(minor) / 10 ** dec
    return int(v) if v == v.to_integral_value() else float(v)


# ------------------------------------------------------------------------------ Act V: sending and routing

def norm_ref(s):
    return ''.join(str(s).split()).upper()


def refers_to(ref, inv, ctx, n):
    r = norm_ref(ref)
    return r in (norm_ref(number_of(inv, n, ctx.asof)), norm_ref(reference_of(inv, n, ctx.asof)))


def credit_left(ctx, p):
    dec = dec_of(ctx.ccy(p['clientId']))
    return ctx.applied_minor(p) - sum(mr(D(str(a['amount'])), dec) for a in p.get('allocations', [])) \
        - mr(D(str(p.get('refunded', 0))), dec)


def held_for(ctx, p, n):
    """The draft a deposit is held for (cp67), or None."""
    if n < 67 or p.get('allocations') or not p.get('reference') or p.get('reversed'):
        return None
    for x in ctx.invoices:
        if x['clientId'] == p['clientId'] and x.get('status', 'DRAFT') == 'DRAFT' and refers_to(p['reference'], x, ctx, n):
            return x['id']
    return None


def send_refusal(fx, iid, n):
    """Why sending a draft is refused under the rules at n, or None."""
    ctx = Ctx(fx, n)
    inv = find_inv(ctx, iid)
    if not inv.get('lineItems'):
        return 'no lines'
    f = figures(inv, n, ctx)
    if (f.get('approval') or '').startswith('Needs'):
        return 'approval'
    client = ctx.clients[inv['clientId']]
    if n >= 154:
        expo = ctx.exposure(inv['clientId']) if n >= 183 else ctx.balance(inv['clientId'])
        if client_on_hold(client, expo, n, ctx):
            return 'hold'
    if n >= 162 and inv.get('creditOf') is None and inv.get('adjustmentOf') is None \
            and (ctx.risk(inv['clientId'])[1] == 'HIGH'
                 or (n >= 238 and inv.get('replaces') is None and reminded_overdue(ctx, inv['clientId'], n, 2))):
        held = sum(ctx.applied_minor(p) for p in ctx.payments if held_for(ctx, p, n) == iid)
        if held * 10 < 3 * f['grand']:
            return 'deposit'
    if n >= 169 and inv.get('milestones') and sum(D(str(m['pct'])) for m in inv['milestones']) != 100:
        return 'milestones'
    if n >= 46 and inv.get('manualDueDate') and inv.get('dueDate') and inv['dueDate'] < ctx.asof:
        return 'due date'
    return None


def due_on_send(inv, ctx, n):
    """The due date sending gives a draft (dated today)."""
    issue = ctx.asof
    if inv.get('manualDueDate'):
        return inv['dueDate']
    if n >= 222 and inv.get('replaces') is not None and inv.get('reminders') and inv.get('dueDate'):
        return inv['dueDate']     # cp222: a replacement of a chased invoice keeps the old invoice's due date
    client = ctx.clients.get(inv['clientId'], {})
    terms = None
    if client.get('termsDays'):
        terms = int(client['termsDays'])
    elif n >= 142 and client.get('region') in (ctx.settings.get('regionTermsDays') or {}):
        terms = int(ctx.settings['regionTermsDays'][client['region']])
    due = ctx.add_days(issue, terms) if terms is not None else end_of_next_month(issue)
    if n >= 174:
        cap = {'MEDIUM': 21, 'HIGH': 7}.get(ctx.risk(inv['clientId'])[1])
        if n >= 245 and any(x['clientId'] == inv['clientId'] and len(x.get('reminders') or []) >= 3
                            and 0 <= days_between(x['reminders'][2], issue) <= 90 for x in ctx.invoices):
            cap = 7      # cp245: a final notice in the last 90 days
        if cap is not None:
            due = min(due, ctx.add_days(issue, cap))
    hol = ctx.holidays()
    if n >= 235 and hol is not None:
        # cp235: a due date on a weekend or holiday moves to the next business day
        if n >= 220:
            hol = observed_holidays(hol)
        x = d(due)
        while x.weekday() >= 5 or x in hol:
            x += dt.timedelta(days=1)
        due = x.isoformat()
    return due


def send_state(fx, iid, n):
    """The fixture after sending draft iid today: dated today, due by its terms, its snapshot kept (cp201)
    and the client's credit used on it (cp51/67/90)."""
    import copy as _c
    f2 = _c.deepcopy({k: v for k, v in fx.items() if k != '_ok'})
    ctx0 = Ctx(f2, n)
    inv = find_inv(ctx0, iid)
    due = due_on_send(inv, ctx0, n)
    held = [p for p in ctx0.payments if p['clientId'] == inv['clientId'] and held_for(ctx0, p, n) == iid]
    inv.update(status='SENT', issueDate=ctx0.asof, dueDate=due)
    ctx = Ctx(f2, n)
    dec = ctx_dec(ctx, inv)
    planned = 57 <= n < 212 and inv.get('instalments')
    if not (n >= 185 and inv.get('milestones')) and not planned and inv.get('creditOf') is None \
            and not (n >= 204 and is_credit_adj(inv)):
        fi = figures(inv, n, ctx)
        cap = fi['settle'] if (n >= 90 and fi.get('settle') is not None) else fi['due']
        others = sorted((p for p in ctx.payments if p['clientId'] == inv['clientId'] and not p.get('reversed')
                         and p not in held and held_for(ctx0, p, n) is None), key=lambda p: (p['date'], p['id']))
        for p in sorted(held, key=lambda p: (p['date'], p['id'])) + others:
            left = credit_left(ctx, p)
            take = min(left, cap)
            if take > 0:
                p['allocations'].append(dict(invoiceId=iid, amount=major(take, dec), date=ctx0.asof))
                cap -= take
            if cap <= 0:
                break
    if n >= 201 and inv.get('creditOf') is None:
        g, t = invoice_grand(inv, n, Ctx(f2, n))
        inv['sentTotal'], inv['sentTax'] = major(g, dec), major(t, dec)
    return f2


def pay_order(ctx, cid, n):
    """[(invoice id, amount)] parts of a client's open invoices in payment order: overdue first (oldest due
    date, lower id), then by amount due (cp188: smallest first; before, largest first); disputed amounts last
    (cp172/195); cp206: a debit adjustment note straight after its original."""
    rows = []
    keys = {}

    def key_of(inv, f):
        if n >= 213 and promised(inv, ctx, n):
            over = False
        else:
            over = f['status'] == 'Overdue'
        if over:
            if n >= 248:
                return (0, -LEVELS.index(dunning_of(inv, ctx, n)), inv.get('dueDate') or '', inv['id'])
            return (0, '', inv.get('dueDate') or '', inv['id'])
        und = f['due'] - (f.get('disputed') or 0)
        return (1, '', und if n >= 188 else -und, inv['id'])
    for inv in ctx.invoices:
        if inv['clientId'] != cid or inv.get('status') != 'SENT' or inv.get('creditOf') is not None:
            continue
        if n >= 204 and is_credit_adj(inv):
            continue
        f = figures(inv, n, ctx)
        keys[inv['id']] = key_of(inv, f)
        if f['due'] <= 0 or f['status'] in ('Written off', 'Void', 'Credit note', 'Adjustment'):
            continue
        dsp = (f.get('disputed') or 0) if n >= 163 else (f['due'] if f['status'] == 'Disputed' else 0)
        und = f['due'] - dsp
        rows.append((inv, und, dsp))
    out = []
    for inv, und, dsp in rows:
        k = keys[inv['id']]
        if n >= 206 and inv.get('adjustmentOf') is not None:
            orig = find_inv(ctx, inv['adjustmentOf'])
            k = keys.get(orig['id']) or key_of(orig, figures(orig, n, ctx))
            k = k + (1, inv.get('issueDate') or '', inv['id'])
        else:
            k = k + (0, '', 0)
        if und > 0:
            out.append(((0,) + k, inv['id'], und))
        if dsp > 0:
            out.append(((1, inv.get('dueDate') or '', inv['id']), inv['id'], dsp))
    out.sort(key=lambda r: r[0])
    return [(iid, amt) for _, iid, amt in out]


def route(fx, pmt, n, open_id=None):
    """[(invoice id, amount in minor units)] a payment recorded on the payment form goes to."""
    import copy as _c
    base = {k: v for k, v in fx.items() if k != '_ok'}
    p0 = dict(_c.deepcopy(pmt), allocations=[])
    ctx = Ctx(base, n)
    ctxp = Ctx(dict(base, payments=list(base.get('payments', [])) + [p0]), n)
    avail = ctxp.applied_minor(p0)
    cid = pmt['clientId']
    client = ctx.clients[cid]
    if pmt.get('deposit'):
        return []
    expo = ctx.exposure(cid) if n >= 183 else ctx.balance(cid)
    targets = []
    if n >= 154 and client_on_hold(client, expo, n, ctx):
        if n < 160:
            return []
        for inv in sorted(ctx.invoices, key=lambda x: (x.get('dueDate') or '', x['id'])):
            if inv['clientId'] == cid and inv.get('status') == 'SENT' and inv.get('creditOf') is None:
                f = figures(inv, n, ctx)
                if f['status'] == 'Overdue':
                    targets.append((inv['id'], f['overdueAmt']))
    elif open_id is not None:
        inv = find_inv(ctx, open_id)
        targets.append((open_id, figures(inv, n, ctx)['due']))
        if n >= 206:
            for x in sorted(adj_notes(inv, ctx, n), key=lambda x: (x.get('issueDate') or '', x['id'])):
                if not is_credit_adj(x):
                    targets.append((x['id'], figures(x, n, ctx)['due']))
    elif pmt.get('reference'):
        refs = [r.split('=')[0] for r in pmt['reference'].split(',')]
        named = {x['id'] for x in ctx.invoices for r in refs if x['clientId'] == cid and refers_to(r, x, ctx, n)}
        if n >= 206:      # cp206: naming an invoice names its debit adjustment notes too
            named |= {x['id'] for x in ctx.invoices if x.get('adjustmentOf') in named and not is_credit_adj(x)}
        targets = [(i, a) for i, a in pay_order(ctx, cid, n) if i in named]
    else:
        first = []
        if n >= 159 and pmt.get('remittance'):
            m_, _ = remittance_match(dict(base, payments=list(base.get('payments', [])) + [p0]), p0, n)
            nums = [x.strip() for x in m_.split(',') if x.strip()]
            for num in nums:
                inv = next(x for x in ctx.invoices if number_of(x, n, ctx.asof) == num)
                first.append((inv['id'], figures(inv, n, ctx)['due']))
                if n >= 226:      # cp226: a matched invoice's debit notes are paid straight after it
                    for x in sorted(adj_notes(inv, ctx, n), key=lambda x: (x.get('issueDate') or '', x['id'])):
                        if not is_credit_adj(x) and x['id'] not in {f_[0] for f_ in first}:
                            first.append((x['id'], figures(x, n, ctx)['due']))
        rest = pay_order(ctx, cid, n)
        targets = first + [(i, a) for i, a in rest if i not in {f_[0] for f_ in first}]
    out = []
    for iid, amt in targets:
        take = min(avail, amt)
        if take > 0:
            out.append((iid, take))
            avail -= take
    return out


def apply_credit(fx, cid, n):
    """[(payment id, invoice id, amount)] Apply credit uses: the oldest credit first, in payment order."""
    base = {k: v for k, v in fx.items() if k != '_ok'}
    ctx = Ctx(base, n)
    srcs = sorted((p for p in ctx.payments if p['clientId'] == cid and not p.get('reversed')
                   and held_for(ctx, p, n) is None and credit_left(ctx, p) > 0), key=lambda p: (p['date'], p['id']))
    order = pay_order(ctx, cid, n)
    out = []
    left = {p['id']: credit_left(ctx, p) for p in srcs}
    for iid, amt in order:
        for p in srcs:
            take = min(left[p['id']], amt)
            if take > 0:
                out.append((p['id'], iid, take))
                left[p['id']] -= take
                amt -= take
            if amt <= 0:
                break
    return out


def ok_values(fx, n):
    """Model checks of a test's actions (sending, payment routing, Apply credit), re-evaluated at every
    later checkpoint: 'ok.send<id>', 'ok.pay<id>', 'ok.credit<id>'."""
    out = {}
    for e in fx.get('_ok', []):
        kind = e[0]
        if kind == 'send':
            _, iid, pre = e
            why = send_refusal(pre, iid, n)
            if why:
                out[f'ok.send{iid}'] = why
            else:
                s2 = send_state(pre, iid, n)
                inv = next(x for x in s2['invoices'] if x['id'] == iid)
                cr = [f"{p['id']}:{a['amount']}" for p in s2.get('payments', []) for a in p['allocations']
                      if a['invoiceId'] == iid and a.get('date') == s2.get('asOf')]
                out[f'ok.send{iid}'] = f"ok due={inv['dueDate']} credit={','.join(cr)}"
        elif kind == 'pay':
            _, pid, open_id, pre, pmt = e
            dec = dec_of(Ctx(pre, n).ccy(pmt['clientId']))
            out[f'ok.pay{pid}'] = ','.join(f"{i}:{plain(a, Ctx(pre, n).ccy(pmt['clientId']))}"
                                          for i, a in route(pre, pmt, n, open_id)) or 'credit'
        elif kind == 'remind':
            _, iid, pre = e
            ctx = Ctx(pre, n)
            inv = find_inv(ctx, iid)
            out[f'ok.remind{iid}'] = f"{dunning_of(inv, ctx, n)} {'sent' if can_remind(inv, ctx, n) else 'refused'}"
        elif kind == 'credit':
            _, cid, pre = e
            ccy = Ctx(pre, n).ccy(cid)
            out[f'ok.credit{cid}'] = ','.join(f"{p}>{i}:{plain(a, ccy)}" for p, i, a in apply_credit(pre, cid, n)) or 'none'
    return out


def act5_values(ctx, n, out):
    """Act V figures: fingerprints and possible duplicates (cp202), rebill links (cp203)."""
    for inv in ctx.invoices:
        p = f"inv{inv['id']}."
        if inv.get('lineItems'):
            out[p + 'fingerprint'] = fingerprint_of(inv, ctx, n)[:8].upper()
        dup = duplicate_of(inv, ctx, n)
        out[p + 'duplicateOf'] = ', '.join(dup) if dup else None
        if n >= 217 and inv.get('status') == 'SENT':
            out[p + 'dunning'] = dunning_of(inv, ctx, n)
        if n >= 203:
            if inv.get('replaces') is not None:
                o = find_inv(ctx, inv['replaces'])
                out[p + 'replaces'] = number_of(o, n, ctx.asof) if o else None
            r = next((x for x in ctx.invoices if x.get('replaces') == inv['id']), None)
            out[p + 'replacedBy'] = number_of(r, n, ctx.asof) if r else None


# dunning (cp217 on) and promises (cp213) are defined below; placeholders until then
LEVELS = ['NONE', 'REMINDER_1', 'REMINDER_2', 'FINAL', 'COLLECTIONS']


def promise_payments(inv, ctx, n, dec):
    """[(date, amount)] paid on an invoice since its promise was made (cp247: and on its debit notes)."""
    ids = {inv['id']}
    if n >= 247:
        ids |= {x['id'] for x in adj_notes(inv, ctx, n) if not is_credit_adj(x)}
    out = []
    for p in ctx.payments:
        if p.get('reversed'):
            continue
        for a in p.get('allocations', []):
            date = a.get('date', p['date'])
            if a['invoiceId'] in ids and date >= inv['promisedOn']:
                out.append((date, mr(D(str(a['amount'])), dec)))
    return sorted(out)


def promise_stands(inv, allocs, asof, dec=2, ctx=None, n=0):
    """cp213: a promise to pay stands until its date unless what has been paid since it was made reaches the
    promised amount."""
    if not inv.get('promiseDate') or not inv.get('promisedOn') or asof > inv['promiseDate']:
        return False
    if ctx is not None and n >= 247:
        since = sum(a for _, a in promise_payments(inv, ctx, n, dec))
    else:
        since = sum(x[2] for x in allocs if x[0] >= inv['promisedOn'])
    return since < mr(D(str(inv['promiseAmount'])), dec)


def promise_kept_on(inv, ctx, n, dec):
    """cp241: the day payments since the promise reached the promised amount, by the promise date, or None."""
    if not inv.get('promiseDate'):
        return None
    tot = 0
    for date, a in promise_payments(inv, ctx, n, dec):
        tot += a
        if tot >= mr(D(str(inv['promiseAmount'])), dec):
            return date if date <= inv['promiseDate'] else None
    return None


def note_promised(inv, ctx, n):
    """cp247: a debit note is held off with its invoice's promise."""
    orig = find_inv(ctx, inv['adjustmentOf'])
    if not orig or not orig.get('promiseDate') or not orig.get('promisedOn'):
        return False
    return promise_stands(orig, [], ctx.asof, ctx_dec(ctx, orig), ctx, n)


def promised(inv, ctx, n):
    return n >= 213 and inv.get('promiseDate') is not None and _figures(inv, n, ctx)['status'] == 'Promised'


def dunning_of(inv, ctx, n):
    """cp217: the dunning level an invoice has reached (dunning_level, cp228 dunning_level_revised): from the
    days it is overdue (since its due date; business days with a calendar) and the days overdue at which its
    reminders went out. Only an Overdue invoice is dunned."""
    if n < 217 or inv.get('status') != 'SENT' or inv.get('creditOf') is not None or is_credit_adj(inv) \
            or not inv.get('dueDate'):
        return 'NONE'
    f = _figures(inv, n, ctx)
    if n >= 233 and inv.get('adjustmentOf') is not None:
        # cp233: a debit note is chased with its invoice, at its invoice's level
        return dunning_of(find_inv(ctx, inv['adjustmentOf']), ctx, n) if f['status'] == 'Overdue' else 'NONE'
    over = f['overdueAmt'] if f['status'] == 'Overdue' else 0
    if n >= 233:
        for x in adj_notes(inv, ctx, n):
            if not is_credit_adj(x):
                fx_ = _figures(x, n, ctx)
                if fx_['status'] == 'Overdue':
                    over += fx_['overdueAmt']
    if f['status'] != 'Overdue' and not (n >= 233 and over > 0):
        return 'NONE'
    if n >= 221 and ctx.settings.get('dunningMinimum') is not None and over < convert(
            ctx.settings['dunningMinimum'], 'USD', f['ccy'], ctx.settings, ctx.asof, n):
        return 'NONE'     # cp221: too little overdue to chase
    days = ctx.days_since(inv['dueDate'], ctx.asof)
    hist = [ctx.days_since(inv['dueDate'], r) for r in inv.get('reminders') or [] if r <= ctx.asof]
    if n >= 228:
        return dunning_level_revised(days, hist)
    return dunning_level(days, hist)


def value_date(ctx, date, n):
    """cp237: with a holiday calendar, a payment dated on a weekend or holiday counts from the next business day."""
    hol = ctx.holidays()
    if hol is None:
        return date
    if n >= 220:
        hol = observed_holidays(hol)
    x = d(date)
    while x.weekday() >= 5 or x in hol:
        x += dt.timedelta(days=1)
    return x.isoformat()


def written_off_on(inv, n, asof):
    """The day an invoice was written off: by hand (cp86), or 30 days after its collections notice (cp239)."""
    if inv.get('writtenOffOn'):
        return inv['writtenOffOn']
    rem = inv.get('reminders') or []
    if n >= 239 and len(rem) >= 4:
        return plus_days(rem[3], 30)
    return None


def can_remind(inv, ctx, n):
    """cp217: a reminder can go out when the level reached is the next one not yet sent (cp233: never on a
    debit note itself)."""
    if n >= 233 and inv.get('adjustmentOf') is not None:
        return False
    lvl = dunning_of(inv, ctx, n)
    return lvl != 'NONE' and LEVELS.index(lvl) == len(inv.get('reminders') or []) + 1


def reminded_overdue(ctx, cid, n, k):
    """cp219: the client has an invoice still overdue after its k-th reminder went out."""
    for inv in ctx.invoices:
        if inv['clientId'] == cid and inv.get('status') == 'SENT' and len(inv.get('reminders') or []) >= k:
            if _figures(inv, n, ctx)['status'] == 'Overdue':
                return True
    return False
