"""The ONE prerequisite table — environment and stack — that every entry point consults.

Before this, three places each hard-coded their own list: setup.sh's `check` calls,
run_experiment's preflight and analyze's tool mapping. They had already drifted (setup.sh
checked PMD but not `fuser`; the run preflight the reverse), and for a harness handed to
strangers that drift IS the bug: you run setup.sh, see all-ok, and the run then refuses.

Two groups, because they fail differently:

  ENVIRONMENT — what the machine must provide. Split by consequence:
      blocking   a run cannot complete without it
      degrades   something is quietly not enforced or not measured
      analysis   a metric family is blank; the run is unaffected

  STACK — what a `--repo` must provide (docs/SUT_CONTRACT.md). Checked statically against the
      COMMITTED base_ref, so it can be run before anything is built.

Every finding carries its consequence and, where possible, the exact remedy for THIS machine —
a report that says "MISSING pmd" without saying what breaks or how to fix it just moves the
research problem to the reader.

Run:  .venv/bin/python -m harness.doctor --config config.yaml [--repo <stack>] [--condition gated]
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys

BLOCKING, DEGRADES, ANALYSIS = "blocking", "degrades", "analysis"
OK, MISSING, BROKEN = "ok", "missing", "broken"


class Finding:
    __slots__ = ("name", "group", "severity", "status", "detail", "consequence", "remedy")

    def __init__(self, name, group, severity, status, detail="", consequence="", remedy=""):
        self.name, self.group, self.severity = name, group, severity
        self.status, self.detail = status, detail
        self.consequence, self.remedy = consequence, remedy

    @property
    def bad(self) -> bool:
        return self.status != OK

    @property
    def fatal(self) -> bool:
        return self.bad and self.severity == BLOCKING


# ── the package manager, named once so every remedy is copy-pasteable ────────────────────────
_PMS = [("apt-get", "sudo apt-get install -y"), ("dnf", "sudo dnf install -y"),
        ("yum", "sudo yum install -y"), ("pacman", "sudo pacman -S --noconfirm"),
        ("zypper", "sudo zypper install -y"), ("apk", "sudo apk add"), ("brew", "brew install")]


def package_manager() -> str:
    for exe, cmd in _PMS:
        if shutil.which(exe):
            return cmd
    return ""


# ── environment: commands the machine must provide ───────────────────────────────────────────
# (command, package, severity, consequence)
COMMANDS = [
    ("fuser", "psmisc", BLOCKING,
     "frees app.port before each app start (correctness._kill_port); without it every "
     "checkpoint's start fails"),
    ("java", "default-jre", BLOCKING, "builds and runs a JVM stack; also drives the CK metrics"),
    ("node", "nodejs", BLOCKING, "the front-end build and the Playwright acceptance suite"),
    ("git", "git", BLOCKING, "every checkpoint is a commit; the metrics are computed from them"),
    ("unzip", "unzip", DEGRADES, "setup.sh cannot unpack the PMD download"),
    ("curl", "curl", DEGRADES, "setup.sh cannot download PMD or CK"),
]

# ── analysis tools: configured in config.yaml `tools:`, each blanking a column family ─────────
# (tools key, companion keys it needs, column family)
TOOL_COLUMNS = [
    ("pmd", ("pmd_metrics_rules",), "backend cohesion/cognitive columns (pmd_*)"),
    ("ck", ("java",), "Chidamber-Kemerer columns (ck_*)"),
    ("jscpd", (), "duplication columns (dup_*) and verbosity's clone half"),
    ("astgrep", ("astgrep_rules",), "verbosity's smell half"),
]


def _have(value: str) -> bool:
    """A tool value is either a path or a bare command name resolved via PATH."""
    if not value:
        return False
    return os.path.isfile(value) or os.path.isdir(value) or bool(shutil.which(value))


def check_environment(cfg: dict, condition: str | None = None,
                      phase: str = "run") -> list[Finding]:
    """`phase="setup"` softens the things you are not expected to have YET.

    At setup time there is no agent token — you make one just before the first run — so failing
    setup.sh over it is friction with no information in it. The item is still REPORTED, with its
    remedy; it just does not make setup.sh exit non-zero.
    """
    pm = package_manager()
    out: list[Finding] = []

    for cmd, pkg, sev, why in COMMANDS:
        if shutil.which(cmd):
            out.append(Finding(cmd, "env", sev, OK, consequence=why))
        else:
            remedy = f"{pm} {pkg}" if pm else f"install {pkg} with your package manager"
            out.append(Finding(cmd, "env", sev, MISSING, consequence=why, remedy=remedy))

    # Landlock is a KERNEL feature, not a package. Absence is not fatal — the agent turn falls
    # back to unconfined and the sandbox mirror still hides prior specs — but §15 is then not
    # enforced for the WHOLE run, which deserves saying once rather than per checkpoint.
    enabled = ((cfg.get("isolation") or {}).get("agent_confinement") or {}).get("enabled")
    if enabled and not os.environ.get("HARNESS_NO_CONFINE"):
        try:
            from . import landlock
            abi = landlock.abi_version()
        except Exception:                                       # noqa: BLE001
            abi = 0
        if abi >= 1:
            out.append(Finding("landlock", "env", DEGRADES, OK,
                               detail=f"ABI {abi}", consequence="agent turns are confined (§15)"))
        else:
            out.append(Finding("landlock", "env", DEGRADES, MISSING,
                               consequence="agent turns run UNCONFINED; §15 not enforced",
                               remedy="needs Linux 5.13+ with Landlock enabled; it is a kernel "
                                      "feature, not a package"))

    # The agent turn itself. Blocking for a run; merely "not yet" during setup.
    token_sev = DEGRADES if phase == "setup" else BLOCKING
    if (os.environ.get("CLAUDE_CODE_OAUTH_TOKEN") or "").strip():
        out.append(Finding("token", "env", token_sev, OK,
                           consequence="a fresh agent per checkpoint over many hours"))
    else:
        out.append(Finding("token", "env", token_sev, MISSING,
                           consequence=("not set yet — needed before a run, not before setup"
                                        if phase == "setup"
                                        else "the driver cannot start an agent turn"),
                           remedy="export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)"))

    # The scorer, needed only by the gated condition.
    if condition is None or condition == "gated":
        try:
            from . import impact_gate
            cmd = impact_gate.default_cmd()
        except Exception:                                       # noqa: BLE001
            cmd = []
        sev = BLOCKING if condition == "gated" else DEGRADES
        if cmd and _have(cmd[0]):
            out.append(Finding("impact-gate", "env", sev, OK, detail=cmd[0],
                               consequence="the `gated` condition's structural scoring"))
        else:
            out.append(Finding("impact-gate", "env", sev, MISSING,
                               consequence="the `gated` condition cannot run "
                                           "(`just-solve` is unaffected)",
                               remedy=".venv/bin/pip install "
                                      "git+https://github.com/officefloor/ImpactGate.git"))

    # Analysis tooling. UNSET is a choice (its columns are blank by design); CONFIGURED BUT
    # ABSENT is a mistake, and continuing produces blanks that look like findings.
    tools = cfg.get("tools") or {}
    for key, companions, family in TOOL_COLUMNS:
        val = tools.get(key)
        if not val:
            out.append(Finding(key, "analysis", ANALYSIS, MISSING,
                               detail="not configured", consequence=f"BLANK: {family}"))
            continue
        if not _have(str(val)):
            out.append(Finding(key, "analysis", ANALYSIS, BROKEN,
                               detail=f"configured as {val!r} but not found",
                               consequence=f"BLANK: {family}",
                               remedy="./setup.sh installs PMD and CK; paths in config.yaml "
                                      "resolve against the harness root"))
            continue
        absent = [c for c in companions if not _have(str(tools.get(c) or ""))]
        if absent:
            out.append(Finding(key, "analysis", ANALYSIS, BROKEN,
                               detail=f"needs tools.{'/'.join(absent)}, unset or not found",
                               consequence=f"BLANK: {family}"))
        else:
            out.append(Finding(key, "analysis", ANALYSIS, OK, consequence=family))
    return out


# ── stack: what a --repo must provide, checked against the COMMITTED base_ref ─────────────────
def _git(repo: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)


def check_stack(repo: str, base_ref: str, pins: list[str] | None = None) -> list[Finding]:
    out: list[Finding] = []

    def add(name, status, detail="", consequence="", remedy="", sev=BLOCKING):
        out.append(Finding(name, "stack", sev, status, detail, consequence, remedy))

    if _git(repo, "rev-parse", "--is-inside-work-tree").returncode != 0:
        add("git repo", MISSING, repo, "the harness worktrees the stack per chain")
        return out
    add("git repo", OK, repo)

    if _git(repo, "rev-parse", "--verify", base_ref).returncode != 0:
        add("base_ref", MISSING, base_ref, "the run branches from it",
            remedy=f"create the branch {base_ref!r} holding the near-empty base")
        return out
    add("base_ref", OK, base_ref)

    tree = _git(repo, "ls-tree", "-r", "--name-only", base_ref).stdout.split()

    # the four scripts, present AND executable in the COMMITTED tree (SUT_CONTRACT §3)
    modes = {l.split()[-1]: l.split()[0]
             for l in _git(repo, "ls-tree", "-r", base_ref, "--", "bin").stdout.splitlines()
             if l.strip()}
    for script in ("build", "start", "stop", "e2e"):
        rel = f"bin/{script}"
        if rel not in modes:
            add(rel, MISSING, consequence="the harness calls this to build/run/test the app",
                remedy=f"add {rel} (docs/SUT_CONTRACT.md §3)")
        elif modes[rel] != "100755":
            add(rel, BROKEN, f"mode {modes[rel]}", "the harness cannot execute it",
                remedy=f"chmod +x {rel} && git commit")
        else:
            add(rel, OK)

    # stack.yaml and everything it declares
    try:
        from . import class_shape, metrics, stack_layer_options, stack_layers
        globs, prov = stack_layers(repo, base_ref, None, expected=metrics.LAYERS)
        opts = stack_layer_options(repo, base_ref)
        add("stack.yaml", OK, prov, f"layers: {sorted(globs)}")
        for lyr, o in opts.items():
            root = (o or {}).get("root", "")
            hp = o.get("handler_pattern")
            if hp:
                try:
                    re.compile(hp)
                    add(f"{lyr}.handler_pattern", OK, hp)
                except re.error as e:
                    add(f"{lyr}.handler_pattern", BROKEN, str(e),
                        "the entry-surface columns would be blank")
            try:
                class_shape.compile_vocabulary(o.get("unit_vocabulary"),
                                               where=f"{lyr}.unit_vocabulary")
                add(f"{lyr}.unit_vocabulary", OK,
                    str(o.get("unit_vocabulary") or "(from ext)"))
            except SystemExit as e:
                add(f"{lyr}.unit_vocabulary", BROKEN, str(e),
                    "the unit-shape table would say nothing")
            # A glob in a NEAR-EMPTY base cannot be required to MATCH anything — cp01 creates
            # the domain dirs. What is checkable is that it is anchored somewhere real, which
            # catches a typo in the stem, and that it sits under the declared root.
            for key in ("function_package_glob",):
                g = o.get(key)
                if not g:
                    continue
                stem = g.split("*")[0].rstrip("/")
                parts = stem.split("/")
                anchored = any(_git(repo, "ls-tree", base_ref, "--",
                                    "/".join(parts[:i]) + "/").stdout.strip()
                               for i in range(len(parts), 0, -1))
                if not anchored:
                    add(f"{lyr}.{key}", BROKEN, f"stem {stem!r} does not exist at {base_ref}",
                        "the declared additive unit would never be found", sev=DEGRADES)
                elif root and not g.startswith(root.rstrip("/") + "/"):
                    add(f"{lyr}.{key}", BROKEN, f"not under root {root!r}",
                        "it would measure another layer", sev=DEGRADES)
                else:
                    add(f"{lyr}.{key}", OK, g, sev=DEGRADES)
    except SystemExit as e:
        add("stack.yaml", BROKEN, str(e), "the harness cannot tell what to measure")

    # pinned files the harness restores before scoring
    for pin in (pins or []):
        if pin in tree:
            add(f"pinned {pin}", OK, sev=DEGRADES)
        else:
            add(f"pinned {pin}", MISSING, consequence="isolation.pin_files names it",
                remedy=f"add {pin}", sev=DEGRADES)

    # near-empty, and no generated code committed
    migs = [f for f in tree
            if f.startswith("src/main/resources/db/migration/") and f.endswith(".sql")]
    if migs:
        add("near-empty", BROKEN, f"{len(migs)} domain migration(s) at {base_ref}",
            "the base must start with no domain schema (SUT_CONTRACT §1)", sev=DEGRADES)
    else:
        add("near-empty", OK, sev=DEGRADES)

    gen = [f for f in tree if f.endswith(".gen.ts") or "/static/assets/" in f]
    if gen:
        add("generated code", BROKEN, f"{len(gen)} tracked, e.g. {gen[0]}",
            "committed build output swamps every diff-derived metric",
            remedy="gitignore it and `git rm --cached`", sev=DEGRADES)
    else:
        add("generated code", OK, sev=DEGRADES)
    return out


# ── reporting ────────────────────────────────────────────────────────────────────────────────
_ICON = {OK: "ok      ", MISSING: "MISSING ", BROKEN: "BROKEN  "}


def render(findings: list[Finding], show_ok: bool = True) -> list[str]:
    lines = []
    for group, title in (("env", "environment"), ("analysis", "analysis tooling"),
                         ("stack", "stack contract")):
        rows = [f for f in findings if f.group == group]
        if not rows:
            continue
        lines.append(f"== {title} ==")
        for f in rows:
            if f.status == OK and not show_ok:
                continue
            sev = "" if f.severity != BLOCKING or not f.bad else " [BLOCKING]"
            detail = f"  ({f.detail})" if f.detail else ""
            lines.append(f"  {_ICON[f.status]}{f.name:<26}{f.consequence}{detail}{sev}")
            if f.bad and f.remedy:
                lines.append(f"            -> {f.remedy}")
    return lines


def markdown(findings: list[Finding]) -> list[str]:
    """The analysis-tooling table for summary.md: an archived summary must say what it lacked."""
    rows = [f for f in findings if f.group == "analysis"]
    if not rows:
        return []
    L = ["## Tooling (what this analysis could and could not compute)", "",
         "A blank column is NOT a zero. Anything listed as absent below was not computed at all.",
         "", "| tool | status | affects |", "|---|---|---|"]
    for f in rows:
        if f.status == OK:
            L.append(f"| `{f.name}` | ran | {f.consequence} |")
        else:
            L.append(f"| `{f.name}` | **absent** — {f.detail or f.status} | **{f.consequence}** |")
    L.append("")
    return L


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", help="config.yaml, for the tools: section")
    ap.add_argument("--repo", help="also check this stack repo against the contract")
    ap.add_argument("--condition", help="gated | just-solve (decides if impact-gate is required)")
    ap.add_argument("--quiet", action="store_true", help="only show problems")
    ap.add_argument("--phase", choices=("setup", "run"), default="run",
                    help="setup: do not fail over things you are not expected to have yet "
                         "(the agent token). Default: run.")
    args = ap.parse_args()

    cfg = {}
    if args.config:
        import yaml
        with open(args.config) as fh:
            cfg = yaml.safe_load(fh) or {}
        hroot = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tools = {}
        for k, v in (cfg.get("tools") or {}).items():
            if isinstance(v, str) and v:
                v = os.path.expanduser(os.path.expandvars(v))
                # a BARE command name stays bare so PATH lookup works
                if os.sep in v and not os.path.isabs(v):
                    v = os.path.join(hroot, v)
            tools[k] = v
        cfg["tools"] = tools

    findings = check_environment(cfg, args.condition, phase=args.phase)
    if args.repo:
        repo = os.path.realpath(os.path.expanduser(args.repo))
        pins = (cfg.get("isolation") or {}).get("pin_files") or []
        findings += check_stack(repo, (cfg.get("app") or {}).get("base_ref") or "base-empty", pins)

    print("\n".join(render(findings, show_ok=not args.quiet)))
    blockers = [f for f in findings if f.fatal]
    print()
    if blockers:
        print(f"{len(blockers)} blocking problem(s): " + ", ".join(f.name for f in blockers))
        return 1
    degraded = [f for f in findings if f.bad]
    print("No blocking problems." + (f" {len(degraded)} thing(s) will be skipped or blank."
                                     if degraded else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
