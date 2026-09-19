"""Analysis: phase-binned curves, degradation slopes with bootstrap CIs, EvoScore,
Zero-Regression Rate. Emits plots + summary.md.

STUB. The STATISTICS here are generic and should be LIFTED VERBATIM from the REST arm
(spring-petclinic-rest-long-degradation-test/harness/analyze.py @ 63d5281) — they are
pure functions of the metrics rows and carry no Java/REST assumptions:

    ols_slope, bootstrap_slope, bootstrap_diff_slope, phase_means, evoscore,
    zero_regression_rate, regression_summary, spearman_ci, plot_metric

Keeping these identical is what makes the UI arm's headline statistics directly
comparable to the REST arm's in publishing ("REST arm vs UI arm, same EvoScore, same
Zero-Regression Rate"). Do NOT re-derive them — copy, then extend.

What must be REWRITTEN for the UI arm:
  * recompute_rows(): rebuild each checkpoint's metrics row from the committed source +
    capture using THIS arm's metrics.compute_all and correctness.outcome_row (the
    capture->rows step; everything downstream is the shared stats above).
  * regression_summary(): add the three-way reason breakdown (anchor_drift /
    behaviour_loss / intended) from correctness.RegressionReason (DESIGN.md §6).
  * the metric list plotted: add `boundary_violations` alongside the erosion/impact
    curves (DESIGN.md §8).

Headline test (unchanged shape, DESIGN.md §1, §10): the degradation slope m = OLS slope
of a metric on checkpoint index, per arm; the additive-template arm's erosion slope ~ 0
while the control SPA arm's slope > 0 (CI excludes 0), and the between-arm slope CI
excludes 0.
"""
from __future__ import annotations


def zero_regression_rate(rows: list[dict], field: str = "regressions") -> float:
    """LIFT from the REST arm verbatim. Fraction of checkpoints with 0 regressions."""
    raise NotImplementedError


def evoscore(rows: list[dict], gamma: float) -> float:
    """LIFT from the REST arm verbatim. Gamma-weighted mean per-checkpoint success."""
    raise NotImplementedError


def recompute_rows(cfg: dict, run_id: str, work_root: str) -> list[dict]:
    """REWRITE: rebuild metrics rows from commits+capture via this arm's compute_all /
    outcome_row. Everything downstream is the shared stats. TODO."""
    raise NotImplementedError


def main() -> int:
    """CLI entry, mirroring the REST arm's analyze.main. TODO."""
    raise NotImplementedError


if __name__ == "__main__":
    raise SystemExit(main())
