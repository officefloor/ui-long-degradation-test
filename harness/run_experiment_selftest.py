"""Deterministic unit tests for the driver's resume + stack-identity plumbing (no agent, no CLI).

Covers what a long run depends on and what a wrong answer would silently corrupt: where a resumed
chain restarts, the regression baseline it restarts with, and the refusal to continue a chain
against a different stack than the one that started it.
"""
from __future__ import annotations

import json
import os
import subprocess
import tempfile

from . import run_experiment as rx
from . import stack_repo

REPO = "/repo/officehq-react-officefloor"
GH = "git@github.com:officefloor/officehq-react-officefloor.git"


def _eq(name, got, want):
    assert got == want, f"{name}: got {got!r} want {want!r}"
    print(f"  ok  {name}")


def _refuses(name, fn, *, exc=RuntimeError, contains=""):
    try:
        fn()
    except exc as e:
        assert contains in str(e), f"{name}: {contains!r} not in {str(e)[:200]!r}"
        print(f"  ok  {name}")
        return
    raise AssertionError(f"{name}: expected {exc.__name__}, nothing raised")


def _chain_repo(subjects: list[str]) -> str:
    """A throwaway repo whose history is `subjects`, oldest first."""
    wt = tempfile.mkdtemp(prefix="rxself-")
    subprocess.run(["git", "init", "-q"], cwd=wt, check=True, capture_output=True)
    for subj in subjects:
        subprocess.run(["git", "-c", "user.email=a@b", "-c", "user.name=a", "commit",
                        "-q", "--allow-empty", "-m", subj], cwd=wt, check=True, capture_output=True)
    return wt


def _write_capture(wt: str, k: int, results: dict, gate_invalid: bool = False) -> None:
    cap = os.path.join(wt, "evolve-results", "capture")
    os.makedirs(cap, exist_ok=True)
    with open(os.path.join(cap, f"cp{k:02d}.json"), "w") as fh:
        json.dump({"tests": {"results": results, "gate_invalid": gate_invalid}}, fh)


def test_completed_checkpoints():
    """Only a RESET commit completes a checkpoint: it is the second half of the two-commit
    boundary, so an `agent` commit with no `reset` after it is a checkpoint to redo."""
    _eq("nothing committed", rx.completed_checkpoints(_chain_repo(["init"])), 0)
    _eq("cp01+cp02 complete", rx.completed_checkpoints(_chain_repo(
        ["manifest: gated/chain1", "cp01 agent a", "cp01 reset a",
         "cp02 agent b", "cp02 reset b"])), 2)
    # Died after COMMIT 1 — cp03 is incomplete and must be redone, so cp02 is the resume point.
    _eq("agent without reset", rx.completed_checkpoints(_chain_repo(
        ["cp01 agent a", "cp01 reset a", "cp02 agent b", "cp02 reset b", "cp03 agent c"])), 2)
    # cpNN is zero-padded in the subject; double digits must not sort as strings.
    _eq("cp10 beats cp09", rx.completed_checkpoints(_chain_repo(
        ["cp09 agent i", "cp09 reset i", "cp10 agent j", "cp10 reset j"])), 10)


def test_prior_passing_from_capture():
    """The baseline is the LAST valid checkpoint's passing set, not the union: a test that
    stopped passing must not linger in it, or the next checkpoint scores a phantom regression."""
    wt = _chain_repo(["init"])
    _write_capture(wt, 1, {"a::1": True, "a::2": True})
    _write_capture(wt, 2, {"a::1": True, "a::2": False, "b::1": True})
    _eq("last valid wins", rx.prior_passing_from_capture(wt, 2), {"a::1", "b::1"})
    # A gate that aborted carries NO verdict — it must not replace the baseline.
    _write_capture(wt, 3, {}, gate_invalid=True)
    _eq("gate_invalid skipped", rx.prior_passing_from_capture(wt, 3), {"a::1", "b::1"})
    _eq("earlier k only", rx.prior_passing_from_capture(wt, 1), {"a::1", "a::2"})
    _eq("no captures", rx.prior_passing_from_capture(_chain_repo(["init"]), 3), set())


def _prov_wt(prov: dict | None) -> str:
    wt = tempfile.mkdtemp(prefix="rxprov-")
    os.makedirs(os.path.join(wt, "evolve-results"))
    if prov is not None:
        with open(os.path.join(wt, "evolve-results", "provenance.json"), "w") as fh:
            json.dump(prov, fh)
    return wt


def test_verify_resume_stack():
    """A resumed chain keeps the stack identity it began with (the manifest is written once), so
    resuming against another stack would splice two stacks into one branch and one capture."""
    both = {"app_repo": REPO, "app_origin": GH}
    rx.verify_resume_stack(_prov_wt(both), {"repo": REPO, "origin": GH})
    print("  ok  same stack allowed")
    _refuses("different repo refused",
             lambda: rx.verify_resume_stack(_prov_wt(both), {"repo": "/repo/other", "origin": GH}),
             contains="app_repo")
    _refuses("re-pointed origin refused",
             lambda: rx.verify_resume_stack(_prov_wt(both),
                                            {"repo": REPO, "origin": "git@github.com:x/fork.git"}),
             contains="app_origin")
    _refuses("removed origin refused",
             lambda: rx.verify_resume_stack(_prov_wt(both), {"repo": REPO, "origin": None}),
             contains="app_origin")
    # A manifest written before a field existed cannot be compared on it — skip, never refuse.
    rx.verify_resume_stack(_prov_wt({"app_repo": REPO}), {"repo": REPO, "origin": GH})
    print("  ok  missing app_origin skipped")
    rx.verify_resume_stack(_prov_wt(None), {"repo": REPO, "origin": GH})
    print("  ok  absent provenance warns, does not refuse")


def test_stack_repo_validation():
    """The stack repo comes from the command line, so every bad value must fail before any work."""
    _refuses("empty refused", lambda: stack_repo(""), exc=SystemExit, contains="is required")
    _refuses("missing dir refused", lambda: stack_repo("/no/such/stack/repo"),
             exc=SystemExit, contains="not a directory")
    _refuses("non-git refused", lambda: stack_repo(tempfile.mkdtemp(prefix="notgit-")),
             exc=SystemExit, contains="not a git work tree")
    wt = _chain_repo(["init"])
    path, origin = stack_repo(wt)
    _eq("git work tree accepted", path, os.path.realpath(wt))
    _eq("no origin is None", origin, None)


def main() -> int:
    for fn in (test_completed_checkpoints, test_prior_passing_from_capture,
               test_verify_resume_stack, test_stack_repo_validation):
        fn()
    print("OK — run_experiment resume/stack tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
