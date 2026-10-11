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


def _pw_report(tests: dict[str, tuple[str, str]]) -> dict:
    """A minimal Playwright JSON report: {"file::title": (status, error message)}."""
    suites: dict[str, list] = {}
    for tid, (status, err) in tests.items():
        f, title = tid.split("::", 1)
        res = {"status": status, "duration": 1}
        if err:
            res["errors"] = [{"message": err}]
        suites.setdefault(f, []).append({"title": title, "titlePath": [title],
                                         "tests": [{"tags": [], "results": [res]}]})
    return {"suites": [{"file": f, "specs": specs} for f, specs in suites.items()]}


_OK = {"cp01_a.spec.ts::lists": ("passed", ""), "cp02_b.spec.ts::adds": ("failed", "expected 2")}


def test_gate_scores_a_healthy_run_with_failures():
    # A genuine failure on a healthy app is scoreable (and so never retried).
    assert c.gate_problem(1, _pw_report(_OK), {"cp01_a.spec.ts", "cp02_b.spec.ts"}, True) == ""


def test_gate_rejects_missing_report():
    assert "no parseable" in c.gate_problem(-11, None, {"cp01_a.spec.ts"}, True)


def test_gate_rejects_abnormal_exit():
    assert "abnormally" in c.gate_problem(-11, _pw_report(_OK), {"cp01_a.spec.ts", "cp02_b.spec.ts"}, True)


def test_gate_rejects_a_report_missing_an_installed_spec():
    # The stale-report case: the report on disk does not cover what this checkpoint installed.
    p = c.gate_problem(1, _pw_report(_OK), {"cp01_a.spec.ts", "cp02_b.spec.ts", "cp03_c.spec.ts"}, True)
    assert "missing 1 installed spec" in p and "cp03_c.spec.ts" in p, p


def test_gate_rejects_a_runner_crash():
    rep = _pw_report({**_OK, "cp02_b.spec.ts::adds": ("failed", "Error: worker process exited unexpectedly (code=null, signal=SIGSEGV)")})
    assert "worker crashed" in c.gate_problem(1, rep, {"cp01_a.spec.ts", "cp02_b.spec.ts"}, True)


def test_gate_rejects_an_app_that_died():
    p = c.gate_problem(1, _pw_report(_OK), {"cp01_a.spec.ts", "cp02_b.spec.ts"}, False)
    assert p.startswith(c._APP_DIED), p


def test_classify_runner_failures_as_infrastructure():
    row = lambda msg: {"test_id": "cp01_a.spec.ts::x", "passed": False, "failure": msg}
    I, S, A, B = (c.RegressionReason.INFRASTRUCTURE.value, c.RegressionReason.SEED_PATH.value,
                  c.RegressionReason.ANCHOR_DRIFT.value, c.RegressionReason.BEHAVIOUR_LOSS.value)
    # a dead app refuses the reset: infrastructure, not a seed bug
    assert c._classify(row("apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000 /__test__/reset"), set()) == I
    assert c._classify(row("Error: worker process exited unexpectedly (code=null, signal=SIGSEGV)"), set()) == I
    assert c._classify(row("page.goto: Target page, context or browser has been closed"), set()) == I
    # a real seed error, a missing element and a wrong value keep their labels
    assert c._classify(row("seed contract broken: POST /__test__/seed returned HTTP 400 — unknown field"), set()) == S
    assert c._classify(row("Expected string: \"$10.00\" Received: <element(s) not found>"), set()) == A
    assert c._classify(row("Expected string: \"PAID\" Received string: \" PAID Credited\""), set()) == B


def test_changed_copy_failing_on_arrival_is_unsatisfied_not_regression():
    """cp20's copy of cp14 keeps a title but expects $2.46 instead of $2.45. Failing it at cp20 means
    cp20's rule was not carried into that scenario: an unsatisfied replacement, not broken old
    behaviour. A test the copy carried UNCHANGED that fails is still a true regression."""
    changed = "cp14_tax_exempt_lines.spec.ts::charges tax only on taxable lines"
    kept = "cp14_tax_exempt_lines.spec.ts::adds an exempt line"
    prior = {changed, kept}
    o = _outcome({changed: False, kept: False, "cp20_x.spec.ts::own": True}, 20)
    row = c.outcome_row(o, prior, [14], set(prior), replaced=[changed])
    assert row["regressions"] == 2
    assert row["true_regressions"] == 1, row          # only the unchanged one
    assert row["unsatisfied_replacement"] == 1, row   # the changed one
    assert row["behaviour_loss"] == 1, row            # reasons only for true regressions


def test_infrastructure_failure_is_not_a_true_regression():
    tid = "cp05_a.spec.ts::x"
    o = c.score_results({tid: False}, 9)
    o.detail = [{"test_id": tid, "passed": False, "category": "functionality",
                 "failure": "apiRequestContext.post: connect ECONNRESET 127.0.0.1:3000"}]
    o.reasons[tid] = c._classify(o.detail[0], set())
    row = c.outcome_row(o, {tid}, [], {tid})
    assert row["regressions"] == 1 and row["true_regressions"] == 0 and row["infrastructure"] == 1, row


def test_baseline_carries_mutates_and_changes_across_an_invalid_gate():
    """cp20 mutates cp05 (retiring cp05_b::y) but its gate is invalid. At cp21 the retirement and
    the changed copy are still in the suite, so neither may read as a true regression."""
    b = c.Baseline()
    b.score(_outcome({"cp05_b.spec.ts::y": True, "cp05_b.spec.ts::z": True}, 19))
    b.score(c.TestOutcome(build_ok=True, gate_invalid=True), [5], ["cp05_b.spec.ts::z"])
    row = b.score(_outcome({"cp05_b.spec.ts::z": False, "cp21_c.spec.ts::own": True}, 21), [], [])
    assert row["regressions"] == 2
    assert row["true_regressions"] == 0, row
    assert row["intended_regressions"] == 1, row
    assert row["unsatisfied_replacement"] == 1, row
    # scored once: the carried state is spent
    assert b.mutates == set() and b.replaced == set()


def test_broken_app_is_not_scored_and_keeps_the_baseline():
    """A build break must not read as every prior test regressing, nor empty the baseline so the
    next checkpoint's real breakage disappears."""
    b = c.Baseline()
    b.score(_outcome({"cp01_a.spec.ts::x": True, "cp02_b.spec.ts::y": True}, 9))
    row = b.score(c.TestOutcome(build_ok=False, app_broken=True))
    assert row["app_broken"] is True and row["regressions"] == "" and row["true_regressions"] == ""
    row = b.score(_outcome({"cp01_a.spec.ts::x": True, "cp02_b.spec.ts::y": False}, 11))
    assert row["true_regressions"] == 1, row


def test_gate_rejects_two_tests_with_one_id():
    rep = {"suites": [{"file": "cp01_a.spec.ts", "specs": [
        {"title": "same", "tests": [{"results": [{"status": "passed"}]}]},
        {"title": "same", "tests": [{"results": [{"status": "failed"}]}]}]}]}
    p = c.gate_problem(1, rep, {"cp01_a.spec.ts"}, True)
    assert "share the id" in p, p


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
