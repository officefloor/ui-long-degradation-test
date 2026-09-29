"""Deterministic unit tests for harness.impact_gate (no impact-gate CLI needed)."""
from __future__ import annotations

from . import impact_gate as ig

CFG = {"app": {"source_globs": {
    "frontend": ["src/main/frontend/**/*.{ts,tsx}"],
    "backend": ["src/main/java/**/*.java"],
}}}


def _eq(name, got, want):
    assert got == want, f"{name}: got {got!r} want {want!r}"
    print(f"  ok  {name}")


def test_glob_prefix():
    _eq("glob_prefix java", ig._glob_prefix("src/main/java/**/*.java"), "src/main/java/**")
    _eq("glob_prefix ts", ig._glob_prefix("src/main/frontend/**/*.{ts,tsx}"), "src/main/frontend/**")


def test_layer_ignore():
    _eq("ignore for backend", ig._other_layer_ignore(CFG["app"], "backend"), ["src/main/frontend/**"])
    _eq("ignore for frontend", ig._other_layer_ignore(CFG["app"], "frontend"), ["src/main/java/**"])
    _eq("layers", ig.layers(CFG), ["frontend", "backend"])


def test_grade_and_block():
    _eq("grade", ig.grade_percentile({"grade": {"percentile": 99.2}}), 99.2)
    _eq("grade none", ig.grade_percentile({}), None)
    _eq("blocked hi", ig.is_blocked({"grade": {"percentile": 99.2}}, 98), True)
    _eq("blocked lo", ig.is_blocked({"grade": {"percentile": 50}}, 98), False)
    _eq("blocked flag", ig.is_blocked({"blocked": True}, 98), True)
    _eq("blocked empty", ig.is_blocked({}, 98), False)


def test_any_and_blocked_layers():
    res = {"backend": {"grade": {"percentile": 99}}, "frontend": {"grade": {"percentile": 1}}}
    _eq("any_blocked", ig.any_blocked(res, 98), True)
    _eq("blocked_layers", ig.blocked_layers(res, 98), ["backend"])
    res2 = {"backend": {"grade": {"percentile": 10}}, "frontend": {"grade": {"percentile": 5}}}
    _eq("none blocked", ig.any_blocked(res2, 98), False)


def test_refactor_prompt():
    res = {
        "backend": {"grade": {"percentile": 99}, "blocked": True,
                    "files": [{"path": "src/main/java/App.java", "cost": 500,
                               "mut_fns": 2, "new_fns": 1}],
                    "top_units": [{"path": "src/main/java/App.java", "name": "App::handle",
                                   "container": "App", "cost": 400, "cc": 20, "wmc_other": 30}]},
        "frontend": {"grade": {"percentile": 3}, "files": [], "top_units": []},
    }
    prompt = ig.refactor_prompt("REQ:{request}\nFLAGGED:\n{flagged}",
                                {"request": "Add owner search"}, res, 98)
    assert "Add owner search" in prompt, "request missing"
    assert "src/main/java/App.java" in prompt, "flagged file missing"
    assert "App::handle" in prompt and "in App" in prompt, "driver class missing"
    assert "BACKEND" in prompt, "blocked layer label missing"
    assert "FRONTEND" not in prompt, "unblocked layer must not appear"
    # Design B: never leak the cost/CC/WMC numbers into the refactor prompt.
    assert "500" not in prompt and "400" not in prompt, "cost numbers leaked into refactor prompt"
    print("  ok  test_refactor_prompt")


def test_capture_records_cognitive():
    """attempt_summary must carry the cognitive verdict and WHY a layer blocked, so a capture
    attributes a block to the change-impact percentile, the cognitive gate, or both."""
    cog = {"threshold": 20, "max": 33, "blocked": True,
           "offenders": [{"path": "src/main/java/App.java", "name": "App::handle",
                          "container": "App", "cognitive": 33}]}
    # Cognitive ALONE blocks: the grade is nowhere near the percentile threshold.
    res = {"backend": {"grade": {"percentile": 0.7}, "files": [], "top_units": [],
                       "cognitive": cog},
           "frontend": {"grade": {"percentile": 3}, "files": [], "top_units": [],
                        "cognitive": {"threshold": 20, "max": 4, "blocked": False,
                                      "offenders": []}}}
    e = ig.attempt_summary("implement", res, 98)
    _eq("blocked_layers cognitive", e["blocked_layers"], ["backend"])
    _eq("blocked_on cognitive", e["layers"]["backend"]["blocked_on"], ["cognitive"])
    _eq("cognitive offenders kept", e["layers"]["backend"]["cognitive"]["offenders"][0]["name"],
        "App::handle")
    # A layer that did NOT block still records its measured cognitive max.
    _eq("blocked_on clean", e["layers"]["frontend"]["blocked_on"], [])
    _eq("cognitive max clean", e["layers"]["frontend"]["cognitive"]["max"], 4)
    # Both gates trip.
    e2 = ig.attempt_summary("implement", {"backend": dict(res["backend"],
                                                          grade={"percentile": 99})}, 98)
    _eq("blocked_on both", e2["layers"]["backend"]["blocked_on"], ["impact", "cognitive"])
    # Impact alone.
    e3 = ig.attempt_summary("implement", {"backend": {"grade": {"percentile": 99},
                                                      "files": [], "top_units": []}}, 98)
    _eq("blocked_on impact", e3["layers"]["backend"]["blocked_on"], ["impact"])
    # Gate OFF: None, NOT {"blocked": false} — one never ran.
    _eq("cognitive off is none", e3["layers"]["backend"]["cognitive"], None)


def main() -> int:
    for fn in (test_glob_prefix, test_layer_ignore, test_grade_and_block,
               test_any_and_blocked_layers, test_refactor_prompt,
               test_capture_records_cognitive):
        fn()
    print("OK — impact_gate tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
