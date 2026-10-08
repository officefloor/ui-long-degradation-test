"""Metric tiers for cross-arm comparison (DESIGN.md §8; the "Option A" reporting policy).

The harness emits two fundamentally different KINDS of metric when arms are compared across
technologies, and treating them alike is a construct-validity error:

  UNIVERSAL  — derived from the commit history/diffs or from the run itself, with the SAME
               definition for every arm and layer regardless of language or architecture:
               correctness and cost, the comprehension probe, and the git-only structural
               measures (hot_* churn concentration, reedit_* settled-code destruction,
               file-level impact counts, and jscpd dup_* which reads any text incl. Thymeleaf).
               "A file reopened 10 times" or "80 settled lines deleted" means the same thing in
               React, Angular, htmx HTML, OfficeFloor YAML and Spring Java — so these can carry a
               cross-arm RANKING.

  CONDITIONAL — defined relative to a construct that only some arms have, or anchored to a
               per-arm regex/declaration: Lizard parser metrics (erosion, wmc_*, hotspot_*,
               the impact *function* counts), the entry-surface anchors (wmc_handler,
               erosion_handler, entry_cc, existing_fns_modified), the additive-unit metrics
               (fnpkg_*), the wired-node metrics (node_*) and config_loc, the declared-contract
               boundary_*, and the Java/TS-specific pmd_*/ck_*/wmcdist_*/verbosity. These are
               blank for some arms (a Spring controller has no wired node; Lizard cannot parse
               HTML) or measure a per-arm unit, so a cross-arm number is apples-to-oranges.

The policy this module enforces (read and applied in harness.overview):
  1. The HEADLINE cross-arm verdict ranks only on UNIVERSAL metrics.
  2. CONDITIONAL metrics are WITHIN-ARCHITECTURE diagnostics: shown per arm, and compared only
     across arms that share the construct — never as a global ranking.
  3. BLANK != ZERO: a conditional metric absent for an arm is "n/a (architecture)", never a 0
     that flatters or penalises it. (Callers already skip a side whose value is None.)

A new/unknown metric defaults to CONDITIONAL — fail-safe, so nothing silently headlines a
cross-arm ranking until it is explicitly declared universal here.
"""
from __future__ import annotations

# Layer prefixes a structural column may carry (metrics.LAYERS). Stripped to get the base name.
_LAYER_PREFIXES = ("frontend_", "backend_")

# Bases that ARE cross-arm comparable. Everything not here is conditional (see module docstring).
UNIVERSAL_BASES: frozenset[str] = frozenset({
    # --- run outcome: scored from capture, not from code structure ---
    "strict_pass", "selected_pass", "regressions", "true_regressions", "intended_regressions",
    "anchor_drift", "behaviour_loss", "seed_path", "normalized_change",
    "unsatisfied_replacement",
    # --- cost / effort ---
    "cost_usd", "num_turns", "input_tokens", "output_tokens", "duration_ms", "duration_api_ms",
    # --- comprehension probe (same question put to every arm) ---
    "probe_recall", "probe_cost_usd", "probe_input_tokens", "probe_cache_read_tokens",
    # --- git-only structural: no parser, so comparable across technologies (metrics.py) ---
    "hot_share", "hot_top_edits",
    "reedit_rate", "reedit_body_lines", "reedit_prior_lines",
    "reedit_lines_rate", "reedit_lines_removed", "reedit_lines_settled", "reedit_lines_touched",
    "reedit_age_mean", "reedit_age_max",
    "impact_files_changed", "impact_new_files", "impact_renames",
    # --- duplication: jscpd reads any text (every arm declares a jscpd_format, incl. html) ---
    "dup_density", "dup_evolved_density", "dup_cross_area_pairs",
})

# Known CONDITIONAL bases — not needed for classification (anything not universal is conditional),
# but declared so the selftest can assert none drifted into "universal" by a typo, and so the
# policy is legible. Prefix families (pmd_, ck_, wmcdist_, node_, fnpkg_) are matched separately.
CONDITIONAL_BASES: frozenset[str] = frozenset({
    "erosion", "wmc_max", "wmc_median", "n_containers",
    "hotspot_cc", "hotspot_nloc",
    "impact_composite", "impact_mutation", "impact_addition", "impact_new_fns", "impact_mut_fns",
    "wmc_handler", "erosion_handler", "entry_cc", "existing_fns_modified",
    "config_loc", "boundary", "verbosity",
})
_CONDITIONAL_PREFIXES = ("pmd_", "ck_", "wmcdist_", "node_", "fnpkg_")

UNIVERSAL = "universal"
CONDITIONAL = "conditional"


def base(field: str) -> str:
    """The metric's base name, with any single layer prefix removed."""
    for p in _LAYER_PREFIXES:
        if field.startswith(p):
            return field[len(p):]
    return field


def tier(field: str) -> str:
    """UNIVERSAL (cross-arm comparable) or CONDITIONAL (within-architecture diagnostic)."""
    return UNIVERSAL if base(field) in UNIVERSAL_BASES else CONDITIONAL


def is_universal(field: str) -> bool:
    return tier(field) == UNIVERSAL


def split(fields):
    """(universal, conditional) lists, preserving order — for tiered reporting."""
    u = [f for f in fields if is_universal(f)]
    c = [f for f in fields if not is_universal(f)]
    return u, c
