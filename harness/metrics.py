"""Structural metrics for the UI arm.

STUB — signatures fixed, bodies TODO. See DESIGN.md §8.

Two metric families, deliberately kept side by side:

  1. ImpactGate / Lizard structural impact — CONFIRMED native for the mainstream arms:
     Lizard ships TypeScriptReader, TSXReader, VueReader; `.ts/.tsx/.vue` parse at full
     fidelity. Caveats that shape this module (DESIGN.md §8):
       * cohesion container collapses to the FILE (components/hooks are free functions,
         so ImpactGate's `Class::method` qualifier falls back to file scope). The
         `Sigma max(WMC_other,1)` term therefore means "other files", not "other
         classes" -> do NOT compare absolute numbers to the Java REST run; keep arms at
         comparable file granularity (one shared opinionated shell) so arm-vs-arm is fair.
       * visibility is format-dependent: `.svelte` (script only) and `.html`/HTMX
         (embedded <script> only) UNDER-count. Exclude Svelte or add a reader; for HTMX
         the under-count is honest (logic moved to the constant server) — say so, don't
         score it as a clean win.
       * prefer .tsx over .jsx and TS over JS: the JS reader emits '(anonymous)' for
         arrows, which breaks longitudinal unit identity across 60 commits.

  2. Boundary-violation count — the format-NEUTRAL co-metric (DESIGN.md §8). Counts how
     often a checkpoint was FORCED to touch a shared/central file (router, global store,
     a shared primitive). Measures the additive property directly and stays honest where
     Lizard's view is partial. Run alongside ImpactGate, not as a fallback.

Normalize erosion per unit of delivered behaviour (passing-test count/coverage), not
per change (DESIGN.md §8).
"""
from __future__ import annotations

from typing import Optional

CC_THRESHOLD = 10  # SlopCodeBench erosion threshold, kept identical to the REST arm

# Formats Lizard reads at full fidelity (DESIGN.md §8). Others are opt-in per arm.
FULL_FIDELITY_EXTS = (".ts", ".tsx", ".vue")


# --- Lizard-backed structural metrics ----------------------------------------


def functions(root: str, globs: list[str]) -> list[dict]:
    """Parse front-end source with Lizard -> [{file, name, container, cc, nloc, ...}].

    Container = file scope for free-function components (see module docstring). Use the
    same Lizard the REST arm and ImpactGate use, restricted to the arm's source globs.
    TODO.
    """
    raise NotImplementedError


def erosion(fns: list[dict], cc_threshold: int = CC_THRESHOLD) -> float:
    """SlopCodeBench Erosion: sum mass(f) over CC(f)>thr / sum mass(f),
    mass(f)=CC*sqrt(SLOC). Same formula as the REST arm, over TS units. TODO."""
    raise NotImplementedError


def impact_stats(worktree: str, prev_ref: str, cur_ref: str = "HEAD",
                 app_cfg: Optional[dict] = None) -> dict:
    """Blast-radius / before-context-WMC composite for this checkpoint's diff.

    The same signal impact_gate.py gates on. Computed per LAYER — front-end TS (file-scope
    container) and backend Java (class-scope, comparable to the REST arm) as SEPARATE
    series (DESIGN.md §8), never summed. NOTE the file-scope container caveat above. TODO.
    """
    raise NotImplementedError


# --- boundary-violation co-metric (new; DESIGN.md §8) ------------------------


def boundary_violations(worktree: str, prev_ref: str, cur_ref: str, cfg: dict) -> dict:
    """Count edits this checkpoint made to declared shared/central files.

    `cfg` supplies the app's shared-surface globs, both layers — front-end (router/manifest,
    global store, shared primitives) and backend (shared wiring/config). Return e.g.
        {"count": int, "files": [paths...], "by_surface": {surface: n}}
    An additive change scores 0 here; a change that had to reach into a shared file to
    land a feature scores >0. Format-neutral — no Lizard visibility required. TODO.
    """
    raise NotImplementedError


# --- the seam (signature-compatible with the REST arm) -----------------------


def compute_all(worktree: str, app_cfg: dict, tools: dict, base_commit: str,
                prev_ref: Optional[str] = None) -> dict:
    """One checkpoint's full structural metric row, computed PER LAYER from
    app_cfg['source_globs'] {frontend, backend} as separate series (DESIGN.md §8).

    Same seam and return-shape contract as the REST arm's metrics.compute_all, so
    analyze.py can consume either. Composes functions()/erosion()/impact_stats()/
    boundary_violations() (+ verbosity once a TS jscpd/ast-grep ruleset exists). TODO.
    """
    raise NotImplementedError
