"""Deterministic code-quality gate for the impact_gated REFACTOR step (Design B), BOTH layers.

WHY. The gated pipeline gates each change on ImpactGate's structural cost. If the agent were
told that cost function it would Goodhart-game it (disperse logic into greenfield classes so
WMC_other collapses to 1, and DUPLICATE code because reuse means editing a penalised big class —
the cost function is blind to duplication). Design B never shows the agent the formula; instead it
holds each REFACTOR's OWN output to this gate, so a refactor cannot buy a lower impact score with
slop.

WHAT IT CHECKS. A finding is a line the refactor ADDED (git diff --cached, restricted to the
layer source dirs) that is EITHER part of a jscpd clone OR matches an ast-grep wasteful-pattern
rule. Runs over BOTH layers (Java + TypeScript): jscpd is language-agnostic; ast-grep applies each
rule to files of its own `language` (java-wasteful.yml + typescript-wasteful.yml). Scoping to
ADDED lines means pre-existing code never blocks the agent. Empty findings => pass.

PARTIAL. If a tool can't run for a layer it's recorded (clones_ran/smells_ran) and the gate
enforces on what worked — never fail-closed, so a broken detector can't kill a run; a later
analyze over the branches can recompute.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from typing import Optional

_SCRATCH = ".jscpd-quality"


@dataclass
class Finding:
    path: str
    line: int
    kind: str        # "clone" | "smell"
    message: str


@dataclass
class QualityReview:
    passed: bool
    findings: list[Finding] = field(default_factory=list)
    added_lines: int = 0
    clone_finding_lines: int = 0
    smell_finding_lines: int = 0
    review_text: str = ""
    ran: bool = True
    reason: str = ""
    clones_ran: bool = True
    smells_ran: bool = True


def _is_noncode(text: str) -> bool:
    """A line that must NOT count as duplicated CODE: blank, comment, or a package/import/export
    declaration (Java and TS). jscpd tokenises these, and identical import blocks or a shared
    header would otherwise flag a clean extract-a-file/class refactor on boilerplate."""
    s = text.strip()
    if not s:
        return True
    if s.startswith(("//", "/*", "*", "#")):
        return True
    if s.startswith(("package ", "import ", "export ")) or s == "export {":
        return True
    return False


def _added_lines(root: str, src_dirs: list[str]) -> set[tuple[str, int]]:
    """(relpath, new-line) for every CODE line the staged tree ADDS over HEAD, inside src_dirs.
    HEAD is the clean base the refactor was made on, so `git diff --cached` is the refactor's
    delta. --unified=0 gives exact new-line spans; non-code lines are excluded."""
    dirs = [d for d in src_dirs if os.path.isdir(os.path.join(root, d))]
    if not dirs:
        return set()
    out = subprocess.run(["git", "-C", root, "diff", "--cached", "--unified=0", "--no-color",
                          "--", *dirs], capture_output=True, text=True).stdout
    added: set[tuple[str, int]] = set()
    path: str | None = None
    new_ln = 0
    for line in out.splitlines():
        if line.startswith("+++ b/"):
            path = line[6:]
            continue
        if line.startswith(("+++ ", "--- ")):
            continue
        if line.startswith("@@"):
            try:
                plus = line.split("+", 1)[1]
                new_ln = int(plus.split(",", 1)[0].split(" ", 1)[0])
            except (IndexError, ValueError):
                new_ln = 0
            continue
        if line.startswith("+") and not line.startswith("+++"):
            if path is not None and new_ln and not _is_noncode(line[1:]):
                added.add((path, new_ln))
            new_ln += 1
    return added


def _line(fobj, base):
    loc = fobj.get(base + "Loc")
    if isinstance(loc, dict) and loc.get("line") is not None:
        return loc["line"]
    v = fobj.get(base)
    return v if isinstance(v, int) else None


def _clone_lines(root: str, src_dirs: list[str], jscpd_bin: str, formats: str,
                 min_tokens: int, min_lines: int) -> tuple[set[tuple[str, int]], list[str]] | None:
    """({(repo-relative path, line)}, [pair descriptions]) of jscpd clones across src_dirs, or
    None if jscpd could not run for any dir. Each dir is scanned separately (jscpd emits paths
    relative to the scanned dir) and its prefix re-joined to get repo-relative paths."""
    lines: set[tuple[str, int]] = set()
    pairs: list[str] = []
    ran = False
    for d in src_dirs:
        if not os.path.isdir(os.path.join(root, d)):
            continue
        out_dir = os.path.join(root, _SCRATCH, d.replace(os.sep, "_"))
        cmd = [jscpd_bin, "--mode", "strict", "--reporters", "json", "--silent",
               "--min-tokens", str(min_tokens), "--min-lines", str(min_lines),
               "--output", out_dir, "--format", formats, d]
        try:
            subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=600)
        except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
            continue
        report = os.path.join(out_dir, "jscpd-report.json")
        if not os.path.isfile(report):
            continue
        try:
            with open(report) as fh:
                data = json.load(fh)
        except (json.JSONDecodeError, OSError):
            continue
        ran = True
        for dup in data.get("duplicates", []):
            span = []
            for side in ("firstFile", "secondFile"):
                f = dup.get(side, {})
                name, start, end = f.get("name"), _line(f, "start"), _line(f, "end")
                if not (name and start and end):
                    span.append(None)
                    continue
                rel = os.path.normpath(os.path.join(d, name))
                for ln in range(int(start), int(end) + 1):
                    lines.add((rel, ln))
                span.append(f"{rel}:{start}-{end}")
            if span[0] and span[1]:
                pairs.append(f"{span[0]}  <=>  {span[1]}")
    return (lines, pairs) if ran else None


def _smell_lines(root: str, src_dirs: list[str], sg_bin: str,
                 rules_dir: str) -> dict[tuple[str, int], str] | None:
    """{(repo-relative path, line): message} for every ast-grep rule match across src_dirs, or
    None if ast-grep did not run. Each rule fires only on files of its own `language`, so the
    java + typescript rule files apply to their respective layers in one scan."""
    dirs = [d for d in src_dirs if os.path.isdir(os.path.join(root, d))]
    if not rules_dir or not os.path.isdir(rules_dir) or not dirs:
        return None
    cfg_dir = tempfile.mkdtemp(prefix="ui-sgcfg-")
    try:
        with open(os.path.join(cfg_dir, "sgconfig.yml"), "w") as fh:
            fh.write("ruleDirs:\n  - " + os.path.abspath(rules_dir) + "\n")
        cmd = [sg_bin, "scan", "--json", "-c", os.path.join(cfg_dir, "sgconfig.yml"), *dirs]
        try:
            proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=600)
        except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
            return None
    finally:
        shutil.rmtree(cfg_dir, ignore_errors=True)
    if proc.returncode != 0:
        first = ((proc.stderr or "").strip().splitlines() or [""])[0]
        print(f"    ! ast-grep exited {proc.returncode}; smell detection DID NOT RUN "
              f"({first[:160]})", flush=True)
        return None
    try:
        matches = json.loads(proc.stdout or "[]")
    except json.JSONDecodeError:
        return None
    out: dict[tuple[str, int], str] = {}
    for m in matches:
        f = m.get("file")
        rng = m.get("range", {})
        start = (rng.get("start") or {}).get("line")
        end = (rng.get("end") or {}).get("line")
        if not (f and start is not None and end is not None):
            continue
        rel = os.path.relpath(f, root) if os.path.isabs(f) else f
        msg = m.get("message") or m.get("ruleId") or m.get("rule") or "wasteful pattern"
        for ln in range(int(start) + 1, int(end) + 2):   # ast-grep lines 0-based -> +1
            out.setdefault((rel, ln), msg)
    return out


def review(root: str, src_dirs: list[str], tools: dict, qcfg: dict) -> QualityReview:
    """Run the quality gate over the staged refactor in `root` across src_dirs (both layers).
    Findings = added lines that are clones or smells. Never fail-closed: if a half can't run it
    is recorded and the other half still enforces."""
    added = _added_lines(root, src_dirs)
    clones = _clone_lines(root, src_dirs, tools.get("jscpd", "jscpd"),
                          qcfg.get("jscpd_formats", "java,typescript,tsx,javascript,jsx"),
                          int(qcfg.get("jscpd_min_tokens", 50)),
                          int(qcfg.get("jscpd_min_lines", 5)))
    smells = _smell_lines(root, src_dirs, tools.get("astgrep", "sg"),
                          tools.get("astgrep_rules", ""))
    shutil.rmtree(os.path.join(root, _SCRATCH), ignore_errors=True)

    if clones is None and smells is None:
        return QualityReview(passed=False, ran=False,
                             reason="neither jscpd nor ast-grep produced output",
                             clones_ran=False, smells_ran=False)
    if clones is None or smells is None:
        half = "ast-grep/smells" if smells is None else "jscpd/clones"
        print(f"    quality-gate: {half} did not run; enforcing on the other half only", flush=True)

    clone_lines = clones[0] if clones else set()
    clone_pairs = clones[1] if clones else []
    smell_map = smells or {}
    findings: list[Finding] = []
    for key in sorted(added):
        if key in clone_lines:
            findings.append(Finding(key[0], key[1], "clone", "part of a duplicated code block"))
        elif key in smell_map:
            findings.append(Finding(key[0], key[1], "smell", smell_map[key]))
    return QualityReview(
        passed=not findings, findings=findings, added_lines=len(added),
        clone_finding_lines=sum(1 for f in findings if f.kind == "clone"),
        smell_finding_lines=sum(1 for f in findings if f.kind == "smell"),
        review_text=render(findings, clone_pairs),
        clones_ran=clones is not None, smells_ran=smells is not None)


def _ranges(findings: list[Finding]) -> list[str]:
    by_path: dict[str, list[int]] = {}
    for f in findings:
        by_path.setdefault(f.path, []).append(f.line)
    out: list[str] = []
    for path in sorted(by_path):
        lns = sorted(set(by_path[path]))
        start = prev = lns[0]
        for ln in lns[1:] + [None]:
            if ln is not None and ln == prev + 1:
                prev = ln
                continue
            out.append(f"{path}:{start}" if start == prev else f"{path}:{start}-{prev}")
            if ln is not None:
                start = prev = ln
    return out


def render(findings: list[Finding], clone_pairs: list[str]) -> str:
    if not findings:
        return "No quality issues found."
    out: list[str] = []
    clones = [f for f in findings if f.kind == "clone"]
    smells = [f for f in findings if f.kind == "smell"]
    if clones:
        out.append("Duplicated code you introduced (consolidate instead of copying):")
        out += [f"  - {r}" for r in _ranges(clones)]
        out += [f"    duplicate block: {p}" for p in clone_pairs]
    if smells:
        out.append("Wasteful patterns you introduced:")
        seen = set()
        for f in smells:
            tag = (f.path, f.line, f.message)
            if tag not in seen:
                seen.add(tag)
                out.append(f"  - {f.path}:{f.line} — {f.message}")
    return "\n".join(out)


def summary(qr: QualityReview) -> dict:
    return {
        "passed": qr.passed, "ran": qr.ran, "added_lines": qr.added_lines,
        "clone_finding_lines": qr.clone_finding_lines, "smell_finding_lines": qr.smell_finding_lines,
        "findings": [{"path": f.path, "line": f.line, "kind": f.kind, "message": f.message}
                     for f in qr.findings],
        "reason": qr.reason or None,
        "clones_ran": qr.clones_ran, "smells_ran": qr.smells_ran,
    }


# --- PMD runner (used by placement.pmd_metrics for the Java backend layer) -----


def run_pmd(root: str, src_dirs: list[str], pmd_bin: str, rulesets: list[str],
            what: str = "pmd", timeout: int = 900) -> "dict | None":
    """ONE PMD process over `rulesets`; the raw JSON report, or None if PMD did not run.

    Guards for the "did not run reads as found nothing" trap: PMD exits 4 when it finds
    violations (so --no-fail-on-violation), and ruleset refs are made ABSOLUTE (PMD runs with
    cwd=worktree, so a relative ref resolves against the worktree and silently fails)."""
    refs = ",".join(os.path.abspath(r) for r in rulesets)
    cmd = [pmd_bin, "check", "-f", "json", "-R", refs,
           "--no-fail-on-violation", "--no-progress", "--no-cache"]
    for d in src_dirs:
        cmd += ["-d", d]
    try:
        proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        first = ((proc.stderr or "").strip().splitlines() or [""])[0]
        print(f"    ! pmd exited {proc.returncode}; {what} DID NOT RUN ({first[:160]})", flush=True)
        return None
    try:
        return json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        return None


# ── PMD line helpers, ported from the REST arm (spring-petclinic-rest-long-degradation-test
# @ 7ea7402) so `deep_metrics.verbosity` can share ONE PMD run with the gate instead of
# spawning its own. `run_pmd` above already does the invocation; these three turn a report
# into line sets and let two rulesets be scanned together and split back apart by rule name.
def _pmd_lines(root: str, src_dirs: list[str], pmd_bin: str,
               ruleset: str) -> dict[tuple[str, int], str] | None:
    """{(repo-relative path, 1-based line): message} for every PMD violation, or None if
    PMD did not run.

    PMD replaces ast-grep as the smell detector: SlopCodeBench's 137 Verbosity rules are
    `language: python` and cannot match these Java arms, while PMD ships a mature Java
    ruleset whose "unnecessary/useless/redundant" rules are the same construct. The
    curated subset lives in `pmd-rules/java-wasteful.xml` (committed; it decides verdicts,
    so it travels with the run like the ast-grep rules did).

    The spawn and its "did not run reads as found nothing" guards live in `run_pmd`.
    Analysis is source-only (no --aux-classpath): checkpoint trees are materialised but
    never compiled, and type resolution is not needed by these rules.

    This is the gate's entry point, and it runs PMD for this ruleset alone.
    `metrics.compute_all` instead runs `run_pmd` ONCE for this ruleset and the metrics
    one together and splits the report with `pmd_lines_from_report`.
    """
    if not ruleset or not os.path.isfile(ruleset):
        return None
    report = run_pmd(root, src_dirs, pmd_bin, [ruleset], "smell detection")
    if report is None:
        return None
    return pmd_lines_from_report(report, root)


def ruleset_rule_names(ruleset: str) -> Optional[set[str]]:
    """The rule NAMES a ruleset file pulls in -- the last path segment of every `ref=`.

    Used to split ONE merged PMD report back into the per-ruleset violation sets, which
    is only sound while the rulesets are DISJOINT; `compute_all` asserts that and falls
    back to separate runs if it ever stops holding. PMD's own `ruleset` JSON field cannot
    do this job: it reports the rule's CATEGORY ("Design"), and both of this repo's
    rulesets draw from category/java/design.xml.

    None means "cannot enumerate, do not split a merged report with this". That is
    returned for a CATEGORY-level ref (`ref="category/java/design.xml"`, no rule after
    it), which pulls in every rule in that file under names this function cannot see:
    those violations would silently vanish from whichever half they belong to, which is
    exactly the "did not run reads as found nothing" failure this file keeps guarding
    against. Neither committed ruleset does this today -- both name every rule -- so the
    branch exists to keep a future edit from quietly corrupting Verbosity.
    """
    if not ruleset or not os.path.isfile(ruleset):
        return None
    try:
        with open(ruleset, encoding="utf-8", errors="ignore") as fh:
            body = fh.read()
    except OSError:
        return None
    names: set[str] = set()
    for r in re.findall(r'ref="([^"]+)"', body):
        leaf = r.rsplit("/", 1)[-1]
        if not leaf or leaf.endswith(".xml"):
            return None          # whole-category ref: rule names are not enumerable here
        names.add(leaf)
    return names or None


def pmd_lines_from_report(report: dict, root: str,
                          keep: Optional[set[str]] = None
                          ) -> dict[tuple[str, int], str]:
    """Violation lines out of an already-parsed PMD report.

    `keep` restricts to one ruleset's rule names when the report came from a merged run.
    """
    out: dict[tuple[str, int], str] = {}
    for f in report.get("files", []):
        path = f.get("filename") or ""
        rel = os.path.relpath(path, root) if os.path.isabs(path) else path
        for v in f.get("violations", []):
            begin, end = v.get("beginline"), v.get("endline")
            if begin is None:
                continue
            if keep is not None and (v.get("rule") or "") not in keep:
                continue
            msg = v.get("rule") or "wasteful pattern"
            # PMD lines are already 1-based. The curated ruleset deliberately excludes
            # class-level rules, so spans stay small (max 3 lines observed) and a single
            # finding cannot flood a LINE-counted metric.
            for ln in range(int(begin), int(end or begin) + 1):
                out.setdefault((rel, ln), msg)
    return out
