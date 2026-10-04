"""Deterministic unit tests for harness.correctness scoring (no build, no agents).
Run: .venv/bin/python -m harness.correctness_selftest
"""
from __future__ import annotations

from . import correctness as c


def _outcome(results: dict[str, bool], k: int) -> c.TestOutcome:
    o = c.score_results(results, k)
    o.detail = [{"test_id": t, "category": "functionality", "passed": ok,
                 "duration_ms": 1, "failure": "" if ok else "expected 2 received 1"}
                for t, ok in results.items()]
    for d in o.detail:
        if not d["passed"]:
            o.reasons[d["test_id"]] = c._classify(d, set())
    return o


def test_test_checkpoint_from_basename():
    assert c.test_checkpoint("cp04_project_invoices.spec.ts::shows a total") == 4
    assert c.test_checkpoint("cp21_invoice_line_items.spec.ts::a > b") == 21
    assert c.test_checkpoint("support.ts::no checkpoint") is None


def test_replaced_prior_is_intended():
    """A mutative checkpoint's updated copy renames the prior's tests, so the prior test id is
    ABSENT from the run. That loss is intended."""
    prior = {"cp04_project_invoices.spec.ts::shows the old total"}
    results = {"cp04_project_invoices.spec.ts::shows the tax-inclusive total": True,
               "cp21_invoice_line_items.spec.ts::lists line items": True}
    now = {t for t, ok in results.items() if ok}
    assert c.count_regressions(prior, now) == 1
    assert c.count_true_regressions(prior, now, (4,), results) == 0


def test_failing_replacement_is_a_true_regression():
    """The cp49 case: cp49 declares mutates:[21] and ships its own updated cp21 spec, and that
    replacement FAILS. `mutates` must not forgive it — the replacement asserting the new
    behaviour and not getting it is a plain failure."""
    tid = "cp21_invoice_line_items.spec.ts::invoice amount includes tax on the line-item total"
    prior = {tid}
    results = {tid: False}
    now = set()
    assert c.count_regressions(prior, now) == 1
    assert c.count_true_regressions(prior, now, (21, 47), results) == 1
    # without the results map the old, over-forgiving behaviour is retained for back-compat
    assert c.count_true_regressions(prior, now, (21, 47)) == 0


def test_unmutated_prior_always_counts():
    tid = "cp41_invoice_cancel_audit.spec.ts::a voided invoice is excluded"
    prior = {tid}
    assert c.count_true_regressions(prior, set(), (8, 17), {tid: False}) == 1
    assert c.count_true_regressions(prior, set(), (), {}) == 1


def test_outcome_row_reasons_and_true_regressions():
    """A failing replacement is counted AND gets its real reason, not `intended`."""
    tid = "cp21_invoice_line_items.spec.ts::invoice amount includes tax"
    results = {tid: False, "cp30_invoice_payments.spec.ts::records a payment": True}
    o = _outcome(results, 30)
    row = c.outcome_row(o, prior_passing={tid}, mutated_cps=(21,))
    assert row["regressions"] == 1, row
    assert row["true_regressions"] == 1, row
    # "expected 2 received 1" has no anchor/seed marker -> behaviour_loss
    assert row["behaviour_loss"] == 1, row
    assert row["anchor_drift"] == 0 and row["seed_path"] == 0, row


def test_outcome_row_clean_checkpoint():
    results = {"cp01_clients.spec.ts::lists clients": True,
               "cp02_client_email_validation.spec.ts::rejects a bad email": True}
    o = _outcome(results, 2)
    row = c.outcome_row(o, prior_passing={"cp01_clients.spec.ts::lists clients"})
    assert row["regressions"] == 0 and row["true_regressions"] == 0
    assert row["strict_pass"] is True, row


def test_unsatisfied_replacement_counted():
    """cp49's shape: the updated cp21 spec arrives failing. Never having passed, it cannot be a
    regression — this is the only measure that sees it."""
    repl = "cp21_invoice_line_items.spec.ts::invoice amount includes tax on the line-item total"
    prior_selected = {"cp21_invoice_line_items.spec.ts::lists line items",
                      "cp48_x.spec.ts::something"}
    results = {"cp21_invoice_line_items.spec.ts::lists line items": True,
               repl: False,
               "cp49_sales_tax.spec.ts::applies tax": True}
    assert c.count_unsatisfied_replacements(prior_selected, results, (21, 47)) == 1
    # it is NOT a regression: it was never in prior_passing
    prior_passing = {"cp21_invoice_line_items.spec.ts::lists line items"}
    now = {t for t, ok in results.items() if ok}
    assert c.count_regressions(prior_passing, now) == 0
    assert c.count_true_regressions(prior_passing, now, (21, 47), results) == 0


def test_unsatisfied_replacement_needs_prior_and_declaration():
    repl = "cp21_invoice_line_items.spec.ts::invoice amount includes tax"
    results = {repl: False}
    # no previous selected set -> cannot tell new from pre-existing -> 0
    assert c.count_unsatisfied_replacements(None, results, (21,)) == 0
    # a failing prior test the checkpoint did NOT declare is not a replacement
    assert c.count_unsatisfied_replacements(set(), results, (47,)) == 0
    # a replacement that passes is satisfied
    assert c.count_unsatisfied_replacements(set(), {repl: True}, (21,)) == 0


def test_outcome_row_reports_unsatisfied_replacement():
    repl = "cp21_invoice_line_items.spec.ts::invoice amount includes tax"
    results = {repl: False, "cp49_sales_tax.spec.ts::applies tax": True}
    o = _outcome(results, 49)
    row = c.outcome_row(o, prior_passing=set(), mutated_cps=(21, 47),
                        prior_selected={"cp21_invoice_line_items.spec.ts::lists line items"})
    assert row["unsatisfied_replacement"] == 1, row
    assert row["regressions"] == 0 and row["true_regressions"] == 0, row
    assert row["strict_pass"] is False, row


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
