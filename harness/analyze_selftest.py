"""Deterministic unit tests for the pure statistics in analyze.py (no run needed).
Run: python -m harness.analyze_selftest   (expect: OK)."""
from __future__ import annotations

import math

from . import analyze as A


def _approx(a, b, tol=1e-6):
    assert abs(a - b) <= tol, f"{a} != {b} (tol {tol})"


def _rows(cond, chain, regs, strict=None, mut_at=None):
    """cp 1..len(regs); regressions=regs[i]; strict_pass=strict[i] if given."""
    out = []
    for i, rg in enumerate(regs, 1):
        out.append({
            "condition": cond, "chain": chain, "checkpoint": i,
            "regressions": rg, "true_regressions": rg, "gate_invalid": False,
            "strict_pass": (strict[i - 1] if strict else (rg == 0)),
            "checkpoint_type": "mutative" if (mut_at and i in mut_at) else "additive",
            "phase": "early" if i <= 1 else ("mid" if i <= 2 else "late"),
            "anchor_drift": 0, "behaviour_loss": rg, "seed_path": 0, "cost_usd": 1.0,
            "num_turns": 3,
        })
    return out


def test_ols_slope():
    _approx(A.ols_slope([1, 2, 3, 4], [2, 4, 6, 8]), 2.0)
    assert math.isnan(A.ols_slope([1], [2]))


def test_zero_regression_rate():
    rows = _rows("x", 1, [0, 0, 0]) + _rows("x", 2, [0, 1, 0])  # chain1 clean, chain2 not
    _approx(A.zero_regression_rate(rows), 0.5)
    _approx(A.zero_regression_rate(_rows("x", 1, [0, 0])), 1.0)


def test_evoscore():
    rows = _rows("x", 1, [0, 0, 0], strict=[True, True, False])
    _approx(A.evoscore(rows, 1.0), 2.0 / 3.0)              # gamma=1 -> plain mean of 1,1,0
    # gamma=2 discounts later checkpoints: (1*1 + 2*1 + 4*0)/(1+2+4) = 3/7
    _approx(A.evoscore(rows, 2.0), 3.0 / 7.0)


def test_regression_summary_mutative():
    # a mutative checkpoint with 2 raw regressions, 1 of them intended (true=1)
    rows = [{
        "condition": "x", "chain": 1, "checkpoint": 9, "gate_invalid": False,
        "regressions": 2, "true_regressions": 1, "checkpoint_type": "mutative",
        "anchor_drift": 1, "behaviour_loss": 1, "seed_path": 0, "strict_pass": False,
    }]
    rs = A.regression_summary(rows)
    assert rs == {"total": 2, "true": 1, "intended": 1, "mutative_cps": 1, "invalid_gates": 0,
                  "anchor_drift": 1, "behaviour_loss": 1, "seed_path": 0}, rs


def test_scored_drops_invalid():
    rows = _rows("x", 1, [0, 0]) + [{"condition": "x", "chain": 1, "checkpoint": 3,
                                     "gate_invalid": True, "regressions": 0}]
    assert len(A.scored(rows)) == 2


def test_bootstrap_slope_point():
    # regressions rise 0,1,2,3 over checkpoints on two identical chains -> slope +1
    rows = _rows("x", 1, [0, 1, 2, 3]) + _rows("x", 2, [0, 1, 2, 3])
    p, lo, hi = A.bootstrap_slope(A.series_by_chain(rows, "regressions"))
    _approx(p, 1.0)
    assert lo <= p <= hi


def test_bootstrap_diff_slope():
    a = _rows("A", 1, [0, 1, 2, 3]) + _rows("A", 2, [0, 1, 2, 3])   # slope +1
    b = _rows("B", 1, [1, 1, 1, 1]) + _rows("B", 2, [1, 1, 1, 1])   # slope 0
    p, lo, hi = A.bootstrap_diff_slope(a, b, "regressions")
    _approx(p, 1.0)
    assert lo > 0, f"expected CI to exclude 0 (rising vs flat), got [{lo},{hi}]"


def test_phase_means():
    order, vals = A.phase_means(_rows("x", 1, [0, 2, 4]), "regressions")
    assert order == ["early", "mid", "late"]
    _approx(vals[0], 0.0); _approx(vals[1], 2.0); _approx(vals[2], 4.0)


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
