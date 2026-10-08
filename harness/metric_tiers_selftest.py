"""Selftest for harness.metric_tiers (the cross-arm Option A policy).

Run:  .venv/bin/python -m harness.metric_tiers_selftest
Asserts that every declared metric classifies, that the known universal/conditional splits hold,
and that nothing drifted between the two sets.
"""
from __future__ import annotations

from . import metric_tiers as mt


def _check():
    # base() strips a single layer prefix, and only a layer prefix.
    assert mt.base("frontend_reedit_lines_rate") == "reedit_lines_rate"
    assert mt.base("backend_node_cc_median") == "node_cc_median"
    assert mt.base("cost_usd") == "cost_usd"
    assert mt.base("probe_recall") == "probe_recall"

    # Concrete, load-bearing classifications (the point of the policy).
    universal = [
        "strict_pass", "true_regressions", "normalized_change", "cost_usd", "num_turns",
        "probe_recall",
        "frontend_hot_share", "backend_hot_share",
        "frontend_reedit_lines_rate", "backend_reedit_age_mean", "frontend_reedit_rate",
        "frontend_dup_density", "backend_dup_density", "frontend_dup_cross_area_pairs",
        "frontend_impact_files_changed",
    ]
    conditional = [
        "frontend_erosion", "backend_erosion",
        "frontend_wmc_max", "frontend_wmc_handler", "backend_erosion_handler",
        "frontend_existing_fns_modified",
        "frontend_impact_composite", "frontend_impact_mutation", "frontend_impact_addition",
        "frontend_fnpkg_count", "frontend_fnpkg_nloc_max",
        "backend_node_cc_median", "backend_node_exclusive_share", "backend_config_loc",
        "frontend_boundary", "backend_boundary",
        "frontend_verbosity", "backend_verbosity",
        "backend_pmd_cognitive_max", "backend_ck_wmc_total", "backend_wmcdist_class_gini",
        "backend_wmc_max",
    ]
    for f in universal:
        assert mt.is_universal(f), f"expected UNIVERSAL: {f} -> {mt.tier(f)}"
    for f in conditional:
        assert not mt.is_universal(f), f"expected CONDITIONAL: {f} -> {mt.tier(f)}"

    # No base may be in both sets, and the prefix families must not be listed as universal.
    assert not (mt.UNIVERSAL_BASES & mt.CONDITIONAL_BASES), "a base is in both tier sets"
    for b in mt.UNIVERSAL_BASES:
        assert not b.startswith(mt._CONDITIONAL_PREFIXES), f"universal base hits a conditional family: {b}"

    # Every metric named in the live declarations must classify (fail-safe: unknown -> conditional,
    # so this cannot raise, but it exercises the whole surface and catches an empty import).
    from .analyze import ARCH_EXPECTATION, GATE_EXPECTATION, PLOT_FIELDS
    from .overview import FIELDS
    declared = (set(ARCH_EXPECTATION) | set(GATE_EXPECTATION)
                | {f for f, _ in PLOT_FIELDS} | {f for f, _ in FIELDS})
    for f in declared:
        assert mt.tier(f) in (mt.UNIVERSAL, mt.CONDITIONAL)

    # split() partitions and preserves order.
    u, c = mt.split(["frontend_hot_share", "frontend_erosion", "cost_usd", "backend_node_cc_median"])
    assert u == ["frontend_hot_share", "cost_usd"]
    assert c == ["frontend_erosion", "backend_node_cc_median"]

    # The ARCH thesis spans both tiers — the whole reason the policy exists.
    arch_u = [f for f in ARCH_EXPECTATION if mt.is_universal(f)]
    arch_c = [f for f in ARCH_EXPECTATION if not mt.is_universal(f)]
    assert arch_u and arch_c, "ARCH_EXPECTATION should contain both universal and conditional metrics"


def main() -> int:
    _check()
    print("metric_tiers selftest: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
