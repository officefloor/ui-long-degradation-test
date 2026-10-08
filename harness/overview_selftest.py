"""Selftest for harness.overview pair pre-registration + tiered judging.

Run:  .venv/bin/python -m harness.overview_selftest
Asserts that only pre-registered cross-arm contrasts (plus the gate control) are formed, that the
model is held constant on both sides, and that only `gate`/`architecture` carry expectation marks.
"""
from __future__ import annotations

from . import overview


def _rows():
    arms = ["tanstack-officefloor", "tanstack-spring", "tanstack-mixed", "react-officefloor",
            "angular-officefloor", "angular-spring", "htmx-officefloor", "htmx-spring"]
    rows = []
    # one model for every arm; a second model only for the architecture pair, to test cross-model.
    plan = {a: ["m1"] for a in arms}
    plan["tanstack-officefloor"].append("m2")
    plan["react-officefloor"].append("m2")
    for arm in arms:
        for model in plan[arm]:
            for cond in ("gated", "just-solve"):
                for ch in (1, 2):
                    for cp in range(1, 4):
                        rows.append({"stack": f"officehq-{arm}", "model": model, "run_id": "R",
                                     "condition": cond, "chain": ch, "checkpoint": cp,
                                     "strict_pass": "True", "cost_usd": 0.1,
                                     "frontend_hot_share": 0.2, "frontend_erosion": 0.3,
                                     "backend_erosion": 0.25})
    return rows


def _check():
    rows = _rows()
    prs = overview.pairs(rows)

    # model is constant on both sides of EVERY pair.
    assert all(a[1] == b[1] for _k, a, b in prs), "a pair crossed models"

    kinds = {(k, overview._short(a[0]), overview._short(b[0]), a[1], a[2]) for k, a, b in prs}

    # architecture contrast exists, oriented additive(tanstack) - mutative(react), under BOTH models.
    for m in ("m1", "m2"):
        assert ("architecture", "tanstack-officefloor", "react-officefloor", m, "gated") in kinds, m

    # backend / framework / paradigm contrasts exist (m1 only for the spring/angular/htmx arms).
    assert ("backend", "tanstack-officefloor", "tanstack-spring", "m1", "gated") in kinds
    assert ("backend", "tanstack-officefloor", "tanstack-mixed", "m1", "just-solve") in kinds
    assert ("framework", "tanstack-spring", "angular-spring", "m1", "gated") in kinds
    assert ("paradigm", "tanstack-officefloor", "htmx-officefloor", "m1", "gated") in kinds

    # gate control: same stack, gated vs just-solve.
    assert any(k == "gate" and overview._short(a[0]) == "angular-spring" for k, a, b in prs)

    # UNREGISTERED pairs are NOT formed (vary >1 dimension), in either direction.
    def _formed(x, y):
        return any({overview._short(a[0]), overview._short(b[0])} == {x, y} for _k, a, b in prs)
    assert not _formed("angular-officefloor", "htmx-spring"), "unregistered pair formed"
    assert not _formed("angular-officefloor", "htmx-officefloor"), "unregistered pair formed"
    assert not _formed("react-officefloor", "angular-officefloor"), "unregistered pair formed"
    # no cross-model architecture pair (m1 tanstack vs m2 react, etc.)
    assert not any("architecture" == k and a[1] != b[1] for k, a, b in prs)

    # judge(): architecture is marked (universal verdict); a backend contrast is descriptive only.
    out = "\n".join(overview.judge(rows))
    assert "architecture:" in out and "cross-arm verdict (universal metrics)" in out
    assert "backend:" in out and "descriptive (no direction pre-declared for a backend contrast)" in out
    # the descriptive backend table must NOT carry a predicted/verdict column.
    assert "| metric | tier | A | B | A − B | rel |" in out
    # counter-signals, if any, come only from gate/architecture (never framework/paradigm/backend).
    for line in out.splitlines():
        if line.startswith("| framework:") or line.startswith("| paradigm:") or line.startswith("| backend:"):
            assert False, f"a descriptive contrast leaked into counter-signals: {line}"


def main() -> int:
    _check()
    print("overview selftest: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
