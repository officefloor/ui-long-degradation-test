"""Reference implementations of the stream's concentrated algorithms (acceptance/WORKSPACE.md §5).

Authoring aid, never shown to the agent: every expected value a spec asserts for one of these
algorithms is computed here, so a spec can never carry an arithmetic slip, and the definition a
request states in plain English has one exact meaning. Money is handled in integer cents (or a
currency's minor units) and Decimal, never float. Run the worked examples with:

    .venv/bin/python -m acceptance.reference.algorithms
"""
from __future__ import annotations

import calendar
import datetime as dt
import hashlib
from decimal import ROUND_CEILING, ROUND_DOWN, ROUND_HALF_UP, Decimal

D = Decimal


def cents(x) -> int:
    """Round a Decimal amount to whole cents, half up."""
    return int((D(x) * 100).quantize(D(1), rounding=ROUND_HALF_UP))


def money(c: int, symbol: str = "$", decimals: int = 2) -> str:
    """Display minor units as the workspace shows money: $1,234.50 (negative: -$12.00)."""
    sign = "-" if c < 0 else ""
    c = abs(c)
    if decimals == 0:
        return f"{sign}{symbol}{c:,}"
    whole, frac = divmod(c, 10 ** decimals)
    return f"{sign}{symbol}{whole:,}.{frac:0{decimals}d}"


# ---------------------------------------------------------------------------------- Act I

def luhn_check_digit(digits: str) -> int:
    """The Luhn check digit for a string of digits: double every second digit from the right
    (starting with the rightmost), subtract 9 from any result over 9, sum, and return the digit
    that makes the total a multiple of 10."""
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 0:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return (10 - total % 10) % 10


def invoice_number_luhn(sequence: int) -> str:
    """INV-<6-digit sequence><Luhn check digit over those 6 digits>, e.g. 7 -> INV-0000075."""
    s = f"{sequence:06d}"
    return f"INV-{s}{luhn_check_digit(s)}"


def iso7064_mod11_2(digits: str) -> str:
    """ISO 7064 MOD 11-2 check character (0-9 or X): p = 0; for each digit p = (p + d) * 2 mod 11;
    check = (12 - p) mod 11, shown as X when 10."""
    p = 0
    for ch in digits:
        p = ((p + int(ch)) * 2) % 11
    c = (12 - p) % 11
    return "X" if c == 10 else str(c)


def invoice_number_mod11(sequence: int) -> str:
    """Revised invoice number: INV-<6-digit sequence><ISO 7064 MOD 11-2 check character>."""
    s = f"{sequence:06d}"
    return f"INV-{s}{iso7064_mod11_2(s)}"


def _mod97(s: str) -> int:
    """Value mod 97 of an alphanumeric string, letters A=10 .. Z=35 (ISO 7064 MOD 97-10)."""
    num = "".join(str(int(ch, 36)) for ch in s.upper())
    return int(num) % 97


def rf_reference(reference: str) -> str:
    """ISO 11649 structured creditor reference: 'RF' + 2 check digits + the reference, check digits
    = 98 - mod97(reference + 'RF00'), shown in groups of four characters."""
    ref = "".join(reference.split()).upper()
    check = 98 - _mod97(ref + "RF00")
    full = f"RF{check:02d}{ref}"
    return " ".join(full[i:i + 4] for i in range(0, len(full), 4))


def rf_valid(rf: str) -> bool:
    """A reference is valid when moving its first four characters to the end gives mod97 == 1."""
    s = "".join(rf.split()).upper()
    return _mod97(s[4:] + s[:4]) == 1


def largest_remainder(total_cents: int, weights: list[tuple[int, int]]) -> dict[int, int]:
    """Split total_cents across items in proportion to their weights so the shares sum exactly.
    weights: [(item id, weight)]. Each item first gets floor(total * w / W); the cents left over go
    one each to the items with the largest remainders, ties to the lower item id."""
    W = sum(w for _, w in weights)
    base, rems = {}, []
    for item, w in weights:
        q, r = divmod(total_cents * w, W)
        base[item] = q
        rems.append((-r, item))
    left = total_cents - sum(base.values())
    for _, item in sorted(rems)[:left]:
        base[item] += 1
    return base


def largest_remainder_revised(total_cents: int, weights: list[tuple[int, int]]) -> dict[int, int]:
    """The revised tie-break (largest-remainder-discount-revised): as largest_remainder, but cents
    left over on equal remainders go to the item with the LARGER weight first, then the lower id."""
    W = sum(w for _, w in weights)
    base, rems = {}, []
    for item, w in weights:
        q, r = divmod(total_cents * w, W)
        base[item] = q
        rems.append((-r, -w, item))
    left = total_cents - sum(base.values())
    for _, _, item in sorted(rems)[:left]:
        base[item] += 1
    return base


# --------------------------------------------------------------------------------- Act II

def annuity_schedule(principal_cents: int, annual_rate_pct: str, n: int) -> list[dict]:
    """Equal monthly instalments: i = rate/12; payment = P*i / (1 - (1+i)^-n), rounded half up to the
    cent (P/n when the rate is 0). Each month: interest = balance*i rounded to the cent, principal
    = payment - interest; the LAST instalment pays the remaining balance plus its interest, so the
    schedule always clears exactly."""
    P = D(principal_cents) / 100
    i = D(annual_rate_pct) / 100 / 12
    pay = cents(P / n) if i == 0 else cents(P * i / (1 - (1 + i) ** -n))
    bal, rows = principal_cents, []
    for k in range(1, n + 1):
        interest = cents(D(bal) / 100 * i)
        principal = bal if k == n else pay - interest
        rows.append({"n": k, "payment": principal + interest, "interest": interest,
                     "principal": principal, "balance": bal - principal})
        bal -= principal
    return rows


def annuity_schedule_revised(principal_cents: int, annual_rate_pct: str, n: int) -> list[dict]:
    """The revised plan (annuity-instalments-revised): as annuity_schedule, but the equal instalment
    is rounded UP to the next whole currency unit (a whole dollar); interest is still the balance x i
    rounded half up to the cent, and the last instalment still pays the remaining balance plus its
    interest, so it comes out smaller and the schedule clears exactly."""
    P = D(principal_cents) / 100
    i = D(annual_rate_pct) / 100 / 12
    raw = P / n if i == 0 else P * i / (1 - (1 + i) ** -n)
    pay = int(raw.quantize(D(1), rounding=ROUND_CEILING)) * 100
    bal, rows = principal_cents, []
    for k in range(1, n + 1):
        interest = cents(D(bal) / 100 * i)
        principal = bal if k == n else pay - interest
        rows.append({"n": k, "payment": principal + interest, "interest": interest,
                     "principal": principal, "balance": bal - principal})
        bal -= principal
    return rows


def compound_interest(balance_cents: int, annual_rate_pct: str, days: int, basis: int = 365) -> int:
    """Daily compounding, Actual/365: balance * ((1 + rate/365)^days - 1), rounded half up. The revised
    rule (compound-late-interest-revised) uses an Actual/360 day count: basis=360."""
    r = D(annual_rate_pct) / 100 / basis
    return cents(D(balance_cents) / 100 * ((1 + r) ** days - 1))


ROUNDING = {"USD": ("0.01", 2), "EUR": ("0.01", 2), "GBP": ("0.01", 2), "JPY": ("1", 0),
            "CHF": ("0.05", 2)}


def round_to_step(amount: Decimal, step: str) -> Decimal:
    """Round half up to a multiple of step (0.01, 1, 0.05)."""
    s = D(step)
    return (amount / s).quantize(D(1), rounding=ROUND_HALF_UP) * s


def triangulate(amount: str, from_ccy: str, to_ccy: str, usd_per: dict[str, str]) -> Decimal:
    """Convert through USD: amount * usd_per[from] / usd_per[to], then round to the target
    currency's step (JPY whole units, CHF 0.05, others cents). usd_per['USD'] is 1."""
    rates = {"USD": "1", **usd_per}
    raw = D(amount) * D(rates[from_ccy]) / D(rates[to_ccy])
    return round_to_step(raw, ROUNDING[to_ccy][0])


def triangulate_revised(amount: str, from_ccy: str, to_ccy: str, usd_per: dict[str, str]) -> Decimal:
    """The revised conversion (fx-triangulation-revised): as triangulate, but the result is rounded
    DOWN (towards zero) to the target currency's step instead of half up."""
    rates = {"USD": "1", **usd_per}
    raw = D(amount) * D(rates[from_ccy]) / D(rates[to_ccy])
    s = D(ROUNDING[to_ccy][0])
    return (raw / s).quantize(D(1), rounding=ROUND_DOWN) * s


# -------------------------------------------------------------------------------- Act III

def tiered_price(qty: int, tiers: list[tuple[int | None, str]]) -> int:
    """Progressive tiers, like tax brackets: tiers = [(units in band or None for the rest, unit
    price)]. Each band's units are charged at that band's price; returns cents."""
    left, total = qty, D(0)
    for size, price in tiers:
        take = left if size is None else min(left, size)
        total += take * D(price)
        left -= take
        if left <= 0:
            break
    return cents(total)


def tax_inclusive_split(gross_cents: list[int], rate_pct: str) -> tuple[list[int], list[int]]:
    """Lines whose prices include tax. Each line: net = round(gross / (1 + rate)), tax = gross - net.
    Then the invoice tax = round(total gross - total gross / (1 + rate)); if the per-line taxes do
    not add up to it, the difference (one cent at a time) goes to the lines with the largest gross,
    ties to the earlier line, adjusting net the other way so net + tax always equals gross."""
    k = 1 + D(rate_pct) / 100
    nets = [cents(D(g) / 100 / k) for g in gross_cents]
    taxes = [g - n for g, n in zip(gross_cents, nets)]
    total_g = sum(gross_cents)
    target = total_g - cents(D(total_g) / 100 / k)
    diff = target - sum(taxes)
    order = sorted(range(len(gross_cents)), key=lambda j: (-gross_cents[j], j))
    step = 1 if diff > 0 else -1
    for j in order[:abs(diff)]:
        taxes[j] += step
        nets[j] -= step
    return nets, taxes


def cash_rounding(total_cents: int) -> tuple[int, int]:
    """Cash total rounded half up to the nearest 0.05; returns (rounded total, adjustment)."""
    rounded = int(round_to_step(D(total_cents) / 100, "0.05") * 100)
    return rounded, rounded - total_cents


def cash_rounding_revised(total_cents: int) -> tuple[int, int]:
    """The revised cash rounding (cash-rounding-revised): always DOWN to the 0.05 below, in the
    client's favour; returns (rounded total, adjustment <= 0)."""
    rounded = total_cents - total_cents % 5
    return rounded, rounded - total_cents


def tax_number_check(first8: str) -> str:
    """The two check digits of a tax number: 97 minus the remainder of the first eight digits
    divided by 97 (a remainder of 0 gives 97), as two digits."""
    return f"{97 - int(first8) % 97:02d}"


def tax_number_valid(number: str) -> bool:
    """A tax number (spaces ignored, letters case-insensitive) is two letters then ten digits, the
    last two being tax_number_check of the first eight."""
    s = "".join(number.split()).upper()
    if len(s) != 12 or not s[:2].isalpha() or not s[:2].isascii() or not s[2:].isdigit():
        return False
    return s[10:] == tax_number_check(s[2:10])


def tiered_exact(qty, tiers: list[tuple[int | None, str]]) -> Decimal:
    """The exact (unrounded) progressive charge for qty units over tiers (see tiered_price)."""
    left, total = D(str(qty)), D(0)
    for size, price in tiers:
        take = left if size is None else min(left, D(size))
        total += take * D(price)
        left -= take
        if left <= 0:
            break
    return total


def tiered_slice(start, qty, tiers: list[tuple[int | None, str]]) -> int:
    """Progressive tiers counted across several lines (tiered-pricing-revised): the charge, in
    cents, for the units numbered start+1 .. start+qty, i.e. the exact charge for start+qty units
    minus the exact charge for start units, rounded half up once."""
    return cents(tiered_exact(D(str(start)) + D(str(qty)), tiers) - tiered_exact(start, tiers))


# --------------------------------------------------------------------------------- Act IV

def calendar_prorate(monthly_cents: int, start: dt.date, end: dt.date) -> int:
    """Charge for start..end inclusive: for each calendar month touched, monthly fee * days of the
    period in that month / days in that month; the parts are summed exactly, then rounded half up
    to the cent once."""
    total, d = D(0), start
    while d <= end:
        last = dt.date(d.year, d.month, calendar.monthrange(d.year, d.month)[1])
        seg_end = min(last, end)
        days = (seg_end - d).days + 1
        total += D(monthly_cents) / 100 * days / calendar.monthrange(d.year, d.month)[1]
        d = seg_end + dt.timedelta(days=1)
    return cents(total)


def calendar_prorate_revised(monthly_cents: int, start: dt.date, end: dt.date) -> int:
    """The revised proration (calendar-proration-revised): a day rate of the monthly fee x 12 / 365,
    times the days from start to end inclusive, rounded half up to the cent once."""
    days = (end - start).days + 1
    return cents(D(monthly_cents) / 100 * 12 / 365 * days)


def jaro_winkler(a: str, b: str, p: float = 0.1) -> float:
    """Jaro-Winkler similarity on the lower-cased strings (standard definition: matching window
    max(len)/2 - 1, transpositions halved, common prefix up to 4 boosted by p = 0.1)."""
    s1, s2 = a.lower(), b.lower()
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    win = max(len(s1), len(s2)) // 2 - 1
    m1, m2 = [False] * len(s1), [False] * len(s2)
    matches = 0
    for i, c in enumerate(s1):
        for j in range(max(0, i - win), min(len(s2), i + win + 1)):
            if not m2[j] and s2[j] == c:
                m1[i] = m2[j] = True
                matches += 1
                break
    if matches == 0:
        return 0.0
    t, k = 0, 0
    for i, c in enumerate(s1):
        if m1[i]:
            while not m2[k]:
                k += 1
            if c != s2[k]:
                t += 1
            k += 1
    jaro = (matches / len(s1) + matches / len(s2) + (matches - t / 2) / matches) / 3
    prefix = 0
    for x, y in zip(s1[:4], s2[:4]):
        if x != y:
            break
        prefix += 1
    return jaro + prefix * p * (1 - jaro)


def ewma_days_to_pay(days: list[int], alpha: str = "0.3") -> Decimal:
    """Exponentially weighted average of days to pay, oldest payment first: e = first value, then
    e = alpha*x + (1-alpha)*e; returned to one decimal place, half up."""
    a = D(alpha)
    e = D(days[0])
    for x in days[1:]:
        e = a * x + (1 - a) * e
    return e.quantize(D("0.1"), rounding=ROUND_HALF_UP)


def risk_band(score: Decimal) -> str:
    """LOW under 15 days, MEDIUM under 30, HIGH from 30."""
    return "LOW" if score < 15 else ("MEDIUM" if score < 30 else "HIGH")


def risk_band_revised(score: Decimal) -> str:
    """The revised bands (payment-risk-score-revised), on a score of days late: LOW under 5 days,
    MEDIUM under 15, HIGH from 15."""
    return "LOW" if score < 5 else ("MEDIUM" if score < 15 else "HIGH")


# ---------------------------------------------------------------------------------- Act V

def _qty(q) -> str:
    """A quantity written as a plain number with no trailing zeros: 2, 1.5, 0.25."""
    return format(D(str(q)).normalize(), "f")


def fingerprint(client_id: int, lines: list[tuple[str, int, int]]) -> str:
    """Duplicate-invoice fingerprint: SHA-256 hex of
    '<client id>|' + ';'.join(sorted('<description>,<qty>,<unit price cents>')), where each
    description is lower-cased with runs of whitespace collapsed to one space and trimmed, and the
    quantity is written with no trailing zeros. The workspace shows the first 8 hex characters,
    upper-cased."""
    norm = sorted(f"{' '.join(d.lower().split())},{_qty(q)},{p}" for d, q, p in lines)
    return hashlib.sha256(f"{client_id}|{';'.join(norm)}".encode()).hexdigest()


def fingerprint_revised(client_id: int, lines: list[tuple[str, int, int]]) -> str:
    """The revised fingerprint (duplicate-fingerprint-revised): lines with the same normalised
    description and unit price are first merged into one, their quantities added, so a line split
    in two still matches; then as fingerprint."""
    merged: dict[tuple[str, int], Decimal] = {}
    for d, q, p in lines:
        k = (" ".join(d.lower().split()), p)
        merged[k] = merged.get(k, D(0)) + D(str(q))
    return fingerprint(client_id, [(d, q, p) for (d, p), q in merged.items()])


def add_business_days(start: dt.date, n: int, holidays: set[dt.date]) -> dt.date:
    """The date n business days after start, skipping Saturdays, Sundays and listed holidays."""
    d, left = start, n
    while left > 0:
        d += dt.timedelta(days=1)
        if d.weekday() < 5 and d not in holidays:
            left -= 1
    return d


def observed_holidays(holidays: set[dt.date]) -> set[dt.date]:
    """The revised calendar (business-day-calendar-revised): a holiday falling on a Saturday is
    observed on the Friday before, one on a Sunday on the Monday after; weekday holidays stand."""
    out = set()
    for h in holidays:
        if h.weekday() == 5:
            out.add(h - dt.timedelta(days=1))
        elif h.weekday() == 6:
            out.add(h + dt.timedelta(days=1))
        else:
            out.add(h)
    return out


def business_days_between(start: dt.date, end: dt.date, holidays: set[dt.date]) -> int:
    """Business days after start up to and including end (0 when end <= start)."""
    n, d = 0, start
    while d < end:
        d += dt.timedelta(days=1)
        if d.weekday() < 5 and d not in holidays:
            n += 1
    return n


def dunning_level(days_overdue: int, reminders: list[int]) -> str:
    """Escalation from days overdue and the days-overdue at which earlier reminders went out:
    NONE under 7 days; REMINDER_1 from 7; REMINDER_2 from 21, but only once REMINDER_1 went out at
    least 14 days earlier; FINAL from 45, but only once REMINDER_2 went out; COLLECTIONS from 60
    after FINAL. A level never skips the one before it."""
    level = "NONE"
    if days_overdue >= 7:
        level = "REMINDER_1"
    if days_overdue >= 21 and reminders and days_overdue - reminders[0] >= 14:
        level = "REMINDER_2"
    if days_overdue >= 45 and len(reminders) >= 2:
        level = "FINAL"
    if days_overdue >= 60 and len(reminders) >= 3:
        level = "COLLECTIONS"
    return level


def dunning_level_revised(days_overdue: int, reminders: list[int]) -> str:
    """The revised escalation (dunning-escalation-revised): NONE under 10 days; REMINDER_1 from 10;
    then each level needs the reminder before it to have gone out at least 14 days earlier:
    REMINDER_2 from 21, FINAL from 45, COLLECTIONS from 60. A level never skips the one before it."""
    level = "NONE"
    if days_overdue >= 10:
        level = "REMINDER_1"
    if days_overdue >= 21 and len(reminders) >= 1 and days_overdue - reminders[0] >= 14:
        level = "REMINDER_2"
        if days_overdue >= 45 and len(reminders) >= 2 and days_overdue - reminders[1] >= 14:
            level = "FINAL"
            if days_overdue >= 60 and len(reminders) >= 3 and days_overdue - reminders[2] >= 14:
                level = "COLLECTIONS"
    return level


# ------------------------------------------------------------------------ worked examples

def _selftest() -> None:
    assert luhn_check_digit("7992739871") == 3            # the textbook Luhn example
    assert invoice_number_luhn(7) == "INV-0000075"
    assert invoice_number_luhn(123) == "INV-0001230"
    assert iso7064_mod11_2("079") == "X"                  # ISO 7064 published example
    assert iso7064_mod11_2("0794") == "0"
    assert rf_reference("539007547034") == "RF18 5390 0754 7034"   # ISO 11649 published example
    assert rf_valid("RF18 5390 0754 7034") and not rf_valid("RF19 5390 0754 7034")
    assert largest_remainder(1000, [(1, 1), (2, 1), (3, 1)]) == {1: 334, 2: 333, 3: 333}
    assert largest_remainder(2000, [(1, 3333), (2, 6667)]) == {1: 667, 2: 1333}
    # equal remainders: the original gives the cent to the lower id, the revision to the larger line
    assert largest_remainder(100, [(1, 1000), (2, 2000), (3, 1000), (4, 2000)]) == {1: 17, 2: 33, 3: 17, 4: 33}
    assert largest_remainder(1, [(1, 100), (2, 300)]) == {1: 0, 2: 1}
    assert largest_remainder(1, [(1, 200), (2, 200)]) == {1: 1, 2: 0}
    assert largest_remainder_revised(1, [(1, 200), (2, 200)]) == {1: 1, 2: 0}
    # 2 cents over weights 1:3 -> quotas 0.5 and 1.5, equal remainders: the original gives the spare
    # cent to the lower id, the revision to the larger line
    assert largest_remainder(2, [(1, 1), (2, 3)]) == {1: 1, 2: 1}
    assert largest_remainder_revised(2, [(1, 1), (2, 3)]) == {1: 0, 2: 2}
    s = annuity_schedule(120000, "12", 12)
    assert s[0]["payment"] == 10662 and s[0]["interest"] == 1200 and s[-1]["balance"] == 0
    assert sum(r["principal"] for r in s) == 120000
    # 1000.00 over 3 months at 12%: i = 0.01, payment = 10 / (1 - 1.01^-3) = 340.0221 -> 340.02;
    # month 1: 10.00 interest, 330.02 principal, 669.98 left; month 2: 6.6998 -> 6.70, 333.32,
    # 336.66 left; month 3 pays 336.66 + 3.3666 -> 3.37 = 340.03 (not 340.02)
    s = annuity_schedule(100000, "12", 3)
    assert [r["payment"] for r in s] == [34002, 34002, 34003] and [r["interest"] for r in s] == [1000, 670, 337]
    assert annuity_schedule(10000, "0", 3)[-1]["payment"] == 3334      # 33.33, 33.33, 33.34
    # revised: 340.0221 rounds up to 341.00; 10.00 + 331.00 -> 669.00; 6.69 + 334.31 -> 334.69;
    # last 334.69 + 3.3469 -> 3.35 = 338.04
    r = annuity_schedule_revised(100000, "12", 3)
    assert [x["payment"] for x in r] == [34100, 34100, 33804] and [x["interest"] for x in r] == [1000, 669, 335]
    assert compound_interest(100000, "10", 30) == 825
    # 1000 x ((1 + 0.12/365)^60 - 1) = 19.9186... (simple interest would be 19.73)
    assert compound_interest(100000, "12", 60) == 1992
    # Actual/360: 1000 x ((1 + 0.12/360)^60 - 1) = 20.1979... (Actual/365 gives 19.9186...)
    assert compound_interest(100000, "12", 60, basis=360) == 2020
    assert triangulate("100", "EUR", "GBP", {"EUR": "1.10", "GBP": "1.25"}) == D("88.00")
    assert triangulate("100", "EUR", "JPY", {"EUR": "1.10", "JPY": "0.0066"}) == D("16667")
    assert triangulate("10", "USD", "CHF", {"CHF": "1.13"}) == D("8.85")
    # 50 EUR -> CHF: 55 / 1.13 = 48.6725...: half up to 0.05 gives 48.65 (cents would give 48.67)
    assert triangulate("50", "EUR", "CHF", {"EUR": "1.10", "CHF": "1.13"}) == D("48.65")
    # revised, rounded down: 100 EUR -> JPY 16666.67 -> 16666; 49 EUR -> CHF 53.9 / 1.13 = 47.699 -> 47.65
    # (half up gives 47.70); 47 EUR -> CHF 51.7 / 1.13 = 45.7522 -> 45.75 either way
    assert triangulate_revised("100", "EUR", "JPY", {"EUR": "1.10", "JPY": "0.0066"}) == D("16666")
    assert triangulate("47", "EUR", "CHF", {"EUR": "1.10", "CHF": "1.13"}) == D("45.75")
    assert triangulate_revised("49", "EUR", "CHF", {"EUR": "1.10", "CHF": "1.13"}) == D("47.65")
    assert tiered_price(60, [(10, "100"), (40, "90"), (None, "80")]) == 540000   # 1000 + 3600 + 800
    nets, taxes = tax_inclusive_split([1000, 1000, 1000], "10")
    assert sum(nets) + sum(taxes) == 3000 and sum(taxes) == 273
    # 10.00, 5.00, 1.13 including 10%: per line 10/1.1 = 9.0909 -> 9.09 (tax 0.91), 5/1.1 = 4.5454
    # -> 4.55 (0.45), 1.13/1.1 = 1.0272 -> 1.03 (0.10): 1.46; the invoice: 16.13 - 16.13/1.1 =
    # 16.13 - 14.6636 -> 16.13 - 14.66 = 1.47, so the missing cent goes to the largest gross (10.00).
    # (Sharing 1.47 by largest remainder on the exact taxes would give 0.91, 0.46, 0.10 instead.)
    assert tax_inclusive_split([1000, 500, 113], "10") == ([908, 455, 103], [92, 45, 10])
    # tiers 10 @ 100, 40 @ 90, then 80: units 9-13 are 2 x 100 + 3 x 90 = 470.00; 45-60 are
    # 6 x 90 + 10 x 80 = 1,340.00; 0.5 unit at 90 after 10 = 45.00
    T3 = [(10, "100"), (40, "90"), (None, "80")]
    assert tiered_slice(8, 5, T3) == 47000 and tiered_slice(44, 16, T3) == 134000
    assert tiered_slice(10, D("0.5"), T3) == 4500 and tiered_slice(0, 60, T3) == tiered_price(60, T3)
    # 12345678 mod 97 = 12345678 - 97 x 127275 = 3, so the check is 97 - 3 = 94
    assert tax_number_check("12345678") == "94" and tax_number_valid("NY 1234 5678 94")
    assert not tax_number_valid("NY1234567849") and not tax_number_valid("NY12345678")
    # 97000000 = 97 x 1000000: remainder 0 gives 97
    assert tax_number_check("97000000") == "97" and tax_number_valid("tx9700000097")
    assert cash_rounding_revised(1238) == (1235, -3) and cash_rounding_revised(1240) == (1240, 0)
    assert cash_rounding(1237) == (1235, -2) and cash_rounding(1238) == (1240, 2)
    assert calendar_prorate(3100, dt.date(2026, 1, 20), dt.date(2026, 2, 10)) == 2307   # 31*12/31 + 31*10/28
    # 450.00 a month from 2026-01-20 to 2026-02-10: by calendar month 450 x 12/31 + 450 x 10/28 = 174.1935 +
    # 160.7143 = 334.9078 -> 334.91 (each month rounded alone: 174.19 + 160.71 = 334.90); revised, 22 days at
    # 450 x 12 / 365 = 14.794521 a day = 325.479452 -> 325.48; all of March: 90 x 12 / 365 x 31 = 91.726 -> 91.73
    assert calendar_prorate(45000, dt.date(2026, 1, 20), dt.date(2026, 2, 10)) == 33491
    assert calendar_prorate_revised(45000, dt.date(2026, 1, 20), dt.date(2026, 2, 10)) == 32548
    assert calendar_prorate(9000, dt.date(2026, 3, 1), dt.date(2026, 3, 31)) == 9000
    assert calendar_prorate_revised(9000, dt.date(2026, 3, 1), dt.date(2026, 3, 31)) == 9173
    assert round(jaro_winkler("MARTHA", "MARHTA"), 4) == 0.9611   # Winkler's published table
    assert round(jaro_winkler("DWAYNE", "DUANE"), 4) == 0.84 and round(jaro_winkler("DIXON", "DICKSONX"), 4) == 0.8133
    assert ewma_days_to_pay([10, 20, 30]) == D("18.1") and risk_band(D("18.1")) == "MEDIUM"   # 10 -> 13 -> 18.1
    # revised: days late with weight 0.5: 0, 10 -> 5, 4 -> 4.5; LOW under 5 (the 0.3 weight gives 0 -> 3 -> 3.3)
    assert ewma_days_to_pay([0, 10, 4], "0.5") == D("4.5") and risk_band_revised(D("4.5")) == "LOW"
    assert ewma_days_to_pay([10, 19], "0.5") == D("14.5") and risk_band_revised(D("14.5")) == "MEDIUM"
    assert risk_band_revised(D("15.0")) == "HIGH" and risk_band(D("15.0")) == "MEDIUM"
    assert fingerprint(1, [("Web  Design", 2, 5000)]) == fingerprint(1, [("web design", 2, 5000)])
    # sha256sum of '1|hosting,1,8000;web design,2,50000' starts 8865963f; another order, case and spacing match
    assert fingerprint(1, [("Hosting", 1, 8000), ("web  DESIGN ", 2, 50000)]).startswith("8865963f")
    assert fingerprint(1, [("web design", 2, 50000), ("hosting", 1, 8000)]).startswith("8865963f")
    assert fingerprint(2, [("Hosting", 1, 8000), ("Web design", 2, 50000)]).startswith("d30579ba")   # client 2
    # quantities lose trailing zeros: '1|design,1.5,4000' -> 32d29f1c
    assert fingerprint(1, [("Design", "1.50", 4000)]).startswith("32d29f1c")
    # revised: a split line merges back ('1|training,3,20000' -> 6eadf0bc); the plain fingerprint of the split
    # lines ('1|training,1,20000;training,2,20000') is e6c6a649; at another price nothing merges (b592548d)
    split = [("Training", 1, 20000), ("training ", 2, 20000)]
    assert fingerprint(1, split).startswith("e6c6a649") and fingerprint_revised(1, split).startswith("6eadf0bc")
    assert fingerprint_revised(1, [("Training", 1, 20000), ("training", 2, 21000)]).startswith("b592548d")
    assert add_business_days(dt.date(2026, 1, 2), 3, set()) == dt.date(2026, 1, 7)
    assert business_days_between(dt.date(2026, 1, 2), dt.date(2026, 1, 7), set()) == 3
    # Wednesday 2026-06-10 + 10 business days, skipping two weekends and Friday 2026-06-19: Thursday 06-25
    hol = {dt.date(2026, 6, 19), dt.date(2026, 7, 4)}
    assert add_business_days(dt.date(2026, 6, 10), 10, hol) == dt.date(2026, 6, 25)
    # 20 business days: Saturday 2026-07-04 changes nothing (07-09); observed on Friday 07-03 it does (07-10)
    assert add_business_days(dt.date(2026, 6, 10), 20, hol) == dt.date(2026, 7, 9)
    assert add_business_days(dt.date(2026, 6, 10), 20, observed_holidays(hol)) == dt.date(2026, 7, 10)
    assert observed_holidays({dt.date(2026, 7, 4), dt.date(2026, 7, 12), dt.date(2026, 6, 19)}) == {
        dt.date(2026, 7, 3), dt.date(2026, 7, 13), dt.date(2026, 6, 19)}
    # due Friday 2026-06-05, 3 business days of grace end Wednesday 06-10 (calendar days would end Monday)
    assert business_days_between(dt.date(2026, 6, 5), dt.date(2026, 6, 10), set()) == 3
    assert dunning_level(25, [7]) == "REMINDER_2" and dunning_level(25, [15]) == "REMINDER_1"
    # never skipping: 70 days with two reminders is FINAL, not COLLECTIONS; 74 with three is COLLECTIONS
    assert dunning_level(70, [9, 30]) == "FINAL" and dunning_level(74, [10, 31, 65]) == "COLLECTIONS"
    assert dunning_level(9, []) == "REMINDER_1" and dunning_level(6, []) == "NONE"
    # revised: nothing before 10 days, and each later level waits 14 days after the reminder before it
    assert dunning_level_revised(9, []) == "NONE" and dunning_level_revised(10, []) == "REMINDER_1"
    assert dunning_level_revised(74, [10, 31, 65]) == "FINAL" and dunning_level_revised(74, [10, 31, 53]) == "COLLECTIONS"
    assert dunning_level(50, [10, 40]) == "FINAL" and dunning_level_revised(50, [10, 40]) == "REMINDER_2"
    # MOD 11-2: 000028 -> p 0,0,0,0,4,(4+8)x2=24 mod 11=2 -> (12-2) mod 11 = 10 = X; 000005 -> p = 10 -> 2
    assert invoice_number_mod11(28) == "INV-000028X" and invoice_number_mod11(5) == "INV-0000052"
    assert invoice_number_mod11(1) == "INV-000001X" and invoice_number_luhn(28) == "INV-0000281"
    assert rf_reference("000028X") == "RF46 0000 28X" and rf_valid("RF46 0000 28X") and not rf_valid("RF46 0000 281")
    assert money(123450) == "$1,234.50" and money(-1200) == "-$12.00" and money(16667, "¥", 0) == "¥16,667"


if __name__ == "__main__":
    _selftest()
    print("OK — reference algorithms match their worked examples")
