"""Golden-fixture tests for harness.quality_gate (needs jscpd + ast-grep on PATH).

Builds a throwaway git repo, stages a refactor that ADDS a duplicated TS block and a wasteful
Java pattern, and asserts the gate flags both; then a clean addition and asserts it passes."""
from __future__ import annotations

import os
import subprocess
import tempfile

from . import quality_gate as qg

HARNESS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES = os.path.join(HARNESS_ROOT, "astgrep-rules")
TOOLS = {"jscpd": "jscpd", "astgrep": "sg", "astgrep_rules": RULES}
QCFG = {"jscpd_min_tokens": 50, "jscpd_min_lines": 5,
        "jscpd_formats": "java,typescript,tsx,javascript,jsx"}

_DUP_TS = """export function compute(x: number): number {
  let total = 0;
  for (let i = 0; i < x; i = i + 1) {
    if (i % 2 === 0) { total = total + i; } else { total = total - i; }
    total = total + i * 2 - 1;
    total = total + (i * 3) - (i - 1);
  }
  return total + x - 1;
}
"""


def _git(root, *args):
    subprocess.run(["git", "-C", root, *args], capture_output=True, text=True, check=False)


def _init(root):
    _git(root, "init")
    _git(root, "config", "user.email", "t@t")
    _git(root, "config", "user.name", "t")
    for d in ("src/main/java", "src/main/frontend"):
        os.makedirs(os.path.join(root, d), exist_ok=True)
    # a clean base commit
    with open(os.path.join(root, "src/main/frontend/base.ts"), "w") as fh:
        fh.write("export const base = 1;\n")
    with open(os.path.join(root, "src/main/java/Base.java"), "w") as fh:
        fh.write("package x;\nclass Base { int v() { return 1; } }\n")
    _git(root, "add", "-A")
    _git(root, "commit", "-m", "base")


def test_flags_clone_and_smell():
    with tempfile.TemporaryDirectory() as root:
        _init(root)
        # duplicated TS block across two files (jscpd clone)
        for name in ("a.ts", "b.ts"):
            with open(os.path.join(root, "src/main/frontend", name), "w") as fh:
                fh.write(_DUP_TS)
        # wasteful Java pattern (ast-grep redundant-boolean-literal-compare)
        with open(os.path.join(root, "src/main/java/Smell.java"), "w") as fh:
            fh.write("package x;\nclass Smell { int f(boolean b) { if (b == true) { return 1; } "
                     "return 0; } }\n")
        _git(root, "add", "-A")
        qr = qg.review(root, ["src/main/java", "src/main/frontend"], TOOLS, QCFG)
        assert qr.ran, f"gate did not run: {qr.reason}"
        assert qr.clones_ran, "jscpd did not run"
        assert qr.smells_ran, "ast-grep did not run"
        assert not qr.passed, "expected findings (clone + smell) but gate passed"
        kinds = {f.kind for f in qr.findings}
        assert "clone" in kinds, f"no clone finding (kinds={kinds}); review:\n{qr.review_text}"
        assert "smell" in kinds, f"no smell finding (kinds={kinds}); review:\n{qr.review_text}"
        print(f"  ok  test_flags_clone_and_smell (clone {qr.clone_finding_lines} + "
              f"smell {qr.smell_finding_lines} lines)")


def test_passes_clean():
    with tempfile.TemporaryDirectory() as root:
        _init(root)
        with open(os.path.join(root, "src/main/frontend/clean.ts"), "w") as fh:
            fh.write("export function greet(name: string): string {\n  return `hi ${name}`;\n}\n")
        _git(root, "add", "-A")
        qr = qg.review(root, ["src/main/java", "src/main/frontend"], TOOLS, QCFG)
        assert qr.ran, f"gate did not run: {qr.reason}"
        assert qr.passed, f"clean change flagged: {qr.review_text}"
        print("  ok  test_passes_clean")


def main() -> int:
    test_flags_clone_and_smell()
    test_passes_clean()
    print("OK — quality_gate tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
