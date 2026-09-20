"""ImpactGate integration for the UI arm — the `gated` condition (DESIGN.md §8, §10).

After the agent implements a checkpoint, the harness stages the production diff and calls
`impact-gate score --mode staged --curve` ONCE PER LAYER (front-end TypeScript, backend Java),
scoping each run to that layer's files via a generated measure-config that ignores the other
layer (§8: file-scope TS and class-scope Java are graded separately, never pooled). ImpactGate
maps each changed file to a language by extension and grades the change's composite against the
SHIPPED per-language seed distribution (`impact_gate/data/seed_percentiles.json` already has
`java` and `typescript`) blended with the project baseline (w = n/(n+K); shallow history leans on
the seed — so no TS seed corpus needs building for a first version).

A layer BLOCKS when its grade percentile ≥ block_percentile; the checkpoint blocks if EITHER
layer blocks. On a block the driver discards the change and runs a refactor turn seeded with the
flagged files + concentrated cost-driver CLASSES/units from both layers + the change request
(Design B: locations only, never the cost formula, so the agent can't Goodhart-game the metric).

Composite = (Σ mutation + Σ godclass) × files_changed. JSON keys used: `impact`, `level`,
`blocked`, `files_changed`, `files[]` (path/lang/cost/mut_fns/new_fns), `top_units[]`
(path/name/container/cc/wmc_other/kind/cost), `grade.percentile`.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile


class ImpactGateError(RuntimeError):
    """impact-gate could not run or emitted no parseable JSON — the gated run cannot
    proceed un-scored (a hard error)."""


def default_cmd() -> list[str]:
    """The impact-gate command: config's `cmd` wins; else the ImpactGate venv binary; else
    whatever is on PATH."""
    venv = os.path.expanduser("~/ImpactGate/.venv/bin/impact-gate")
    if os.path.isfile(venv):
        return [venv]
    found = shutil.which("impact-gate")
    return [found] if found else ["impact-gate"]


def _cmd(cfg: dict) -> list[str]:
    raw = (cfg.get("impact_gate") or {}).get("cmd")
    if isinstance(raw, str):
        return raw.split()
    if isinstance(raw, list):
        return list(raw)
    return default_cmd()


def layers(cfg: dict) -> list[str]:
    return list((cfg.get("app", {}).get("source_globs") or {"frontend": [], "backend": []}).keys())


def _glob_prefix(glob: str) -> str:
    """`src/main/java/**/*.java` -> `src/main/java/**` (dir prefix before the first wildcard)."""
    for i, ch in enumerate(glob):
        if ch in "*?[{":
            return glob[:i].rstrip("/") + "/**"
    return glob


def _other_layer_ignore(app_cfg: dict, layer: str) -> list[str]:
    """Ignore globs that exclude every layer EXCEPT `layer`, so a per-layer score sees only
    that layer's changed files."""
    ig: list[str] = []
    for other, globs in (app_cfg.get("source_globs") or {}).items():
        if other == layer:
            continue
        for g in globs:
            ig.append(_glob_prefix(g))
    return sorted(set(ig))


def _write_measure_config(app_cfg: dict, layer: str) -> str:
    """A Surveyor-style measure-config (ignore globs) isolating `layer`. Caller unlinks it."""
    ignore = _other_layer_ignore(app_cfg, layer)
    fd, path = tempfile.mkstemp(prefix=f"ig-{layer}-", suffix=".yml")
    with os.fdopen(fd, "w") as fh:
        fh.write("ignore:\n" + "".join(f'  - "{g}"\n' for g in ignore))
    return path


def score(worktree: str, layer: str, cfg: dict, timeout: int = 300) -> dict:
    """Score the STAGED diff of `worktree` for a single LAYER and return impact-gate's JSON
    (with `_layer` added). Stage the change (git add -A) before calling; `--mode staged`
    scores the index vs HEAD, i.e. exactly this checkpoint's (or refactor's) delta."""
    igc = cfg.get("impact_gate") or {}
    block_p = float(igc.get("block_percentile", 98))
    warn_p = float(igc.get("warn_percentile", 90))
    mc = _write_measure_config(cfg["app"], layer)
    argv = [*_cmd(cfg), "score", "--repo", worktree, "--mode", "staged", "--format", "json",
            "--curve", "--block-percentile", str(block_p), "--warn-percentile", str(warn_p),
            "--measure-config", mc]
    if igc.get("curve_prior_weight") is not None:
        argv += ["--curve-prior-weight", str(igc["curve_prior_weight"])]
    baseline = (igc.get("baseline_files") or {}).get(layer)
    if baseline:
        argv += ["--baseline-file", baseline]
    try:
        proc = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, OSError) as e:
        raise ImpactGateError(
            f"could not run impact-gate ({_cmd(cfg)!r}): {e}. Install it "
            "(pip install -e ~/ImpactGate) or set impact_gate.cmd in config.yaml.") from e
    except subprocess.TimeoutExpired as e:
        raise ImpactGateError(f"impact-gate timed out after {timeout}s") from e
    finally:
        try:
            os.unlink(mc)
        except OSError:
            pass
    # Exit 0 = ok/warn, 2 = blocked (both carry a JSON verdict); 1 = usage/env error.
    if proc.returncode == 1:
        raise ImpactGateError(f"impact-gate error (exit 1): {proc.stderr.strip()[:400]}")
    try:
        out = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise ImpactGateError(
            f"impact-gate produced no JSON (exit {proc.returncode}): "
            f"stdout={proc.stdout[:200]!r} stderr={proc.stderr.strip()[:200]!r}") from e
    out["_layer"] = layer
    return out


def score_layers(worktree: str, cfg: dict, timeout: int = 300) -> dict[str, dict]:
    """Score EVERY layer separately: {layer: impact-gate JSON}."""
    return {layer: score(worktree, layer, cfg, timeout) for layer in layers(cfg)}


def grade_percentile(ig: dict) -> float | None:
    return (ig.get("grade") or {}).get("percentile")


def is_blocked(ig: dict, block_percentile: float) -> bool:
    """A layer fails when its grade percentile ≥ block_percentile. An empty/ungraded layer
    (no source of that language touched) never fails."""
    pct = grade_percentile(ig)
    if pct is None:
        return bool(ig.get("blocked"))
    return pct >= block_percentile


def any_blocked(results: dict[str, dict], block_percentile: float) -> bool:
    return any(is_blocked(ig, block_percentile) for ig in results.values())


def blocked_layers(results: dict[str, dict], block_percentile: float) -> list[str]:
    return [ly for ly, ig in results.items() if is_blocked(ig, block_percentile)]


def _format_files(ig: dict, limit: int = 6) -> list[str]:
    lines = []
    for f in (ig.get("files") or [])[:limit]:
        if (f.get("cost") or 0) <= 0:
            continue
        lines.append(f"    - {f['path']}  ({f.get('mut_fns', 0)} existing fn(s) changed, "
                     f"{f.get('new_fns', 0)} new)")
    return lines


def _format_drivers(ig: dict, limit: int = 6) -> list[str]:
    # Design B: LOCATIONS only — name where complexity concentrated (the class/unit), never the
    # cost/CC/WMC numbers, so the refactor prompt never leaks the metric to optimise.
    lines = []
    for u in (ig.get("top_units") or [])[:limit]:
        if (u.get("cost") or 0) <= 0:
            continue
        where = u.get("container") or "(file scope)"
        lines.append(f"    - {u['path']} :: {u['name']}  (in {where})")
    return lines


def format_flagged(results_by_layer: dict[str, dict], block_percentile: float) -> str:
    """The flagged files + cost-driver classes/units across the blocked layers, for the
    refactor prompt. Only blocked layers are shown (they are what must come down)."""
    blocks = []
    for layer, ig in results_by_layer.items():
        if not is_blocked(ig, block_percentile):
            continue
        files = _format_files(ig)
        drivers = _format_drivers(ig)
        section = [f"  {layer.upper()} — files where the change concentrated cost:"]
        section += files or ["    (no single file dominates)"]
        section += [f"  {layer.upper()} — the classes/units to simplify or restructure:"]
        section += drivers or ["    (none isolated)"]
        blocks.append("\n".join(section))
    return "\n\n".join(blocks) or "  (nothing flagged)"


def refactor_prompt(template: str, cp: dict, results_by_layer: dict[str, dict],
                    block_percentile: float) -> str:
    """Fill the refactor template. Placeholders (plain replace, so braces are safe):
      {request}  the upcoming change the refactor should make land cleanly
      {flagged}  the flagged files + cost-driver classes/units (both layers, blocked only)"""
    return (template
            .replace("{request}", (cp.get("request") or "").strip())
            .replace("{flagged}", format_flagged(results_by_layer, block_percentile)))


def _agent_envelope(ar) -> dict:
    keys = ("ok", "cost_usd", "input_tokens", "output_tokens", "num_turns",
            "duration_ms", "duration_api_ms", "error")
    return {k: getattr(ar, k, None) for k in keys}


def attempt_summary(kind: str, results_by_layer: dict[str, dict], block_percentile: float,
                    sha: str = "", agent=None, tests: dict | None = None,
                    quality: dict | None = None) -> dict:
    """One entry in the capture record's gate history. `kind` is 'implement' or 'refactor'.
    Records, per layer, the grade/verdict + flagged files/drivers (so guidance is
    reproducible from capture), plus the commit sha and (for a refactor) the agent envelope,
    correctness, and quality-gate verdict."""
    per_layer = {}
    for layer, ig in results_by_layer.items():
        per_layer[layer] = {
            "grade": grade_percentile(ig),
            "impact": ig.get("impact"),
            "level": ig.get("level"),
            "blocked": is_blocked(ig, block_percentile),
            "files": [f for f in (ig.get("files") or []) if (f.get("cost") or 0) > 0],
            "drivers": ig.get("top_units") or [],
        }
    entry = {
        "kind": kind,
        "blocked": any_blocked(results_by_layer, block_percentile),
        "blocked_layers": blocked_layers(results_by_layer, block_percentile),
        "layers": per_layer,
        "sha": sha,
    }
    if agent is not None:
        entry["agent"] = _agent_envelope(agent)
    if tests is not None:
        entry["tests"] = tests
    if quality is not None:
        entry["quality"] = quality
    return entry
