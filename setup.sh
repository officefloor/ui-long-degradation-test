#!/usr/bin/env bash
# Create the harness Python venv and install the tooling the harness OWNS.
#   - run_experiment (the driver) needs PyYAML
#   - analyze needs numpy + matplotlib
#   - metrics/impact-gate use lizard
#   - the quality gate shells out to jscpd + ast-grep, PINNED in tools/package.json
# System Python is often PEP-668 "externally managed", so the harness runs under this venv:
#   .venv/bin/python -m harness.run_experiment --config config.yaml ...
#   .venv/bin/python -m harness.analyze        --config config.yaml ...
# NOT installed here (see README "Running") — each is external and checked at the end:
#   impact-gate (~/ImpactGate), PMD, ck.jar, the JRE, and the app's own Node/Playwright
#   toolchain (pinned in the stack repo's e2e/package.json, installed by its bin/e2e).
set -euo pipefail
cd "$(dirname "$0")"

python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

# Quality-gate tools, pinned to exact versions (config.yaml -> tools.jscpd / tools.astgrep point
# INTO this dir). ast-grep must come from here: an unrelated npm package also publishes the name
# `ast-grep` (v0.1.0, JS-only, no `scan`), so a PATH lookup can silently disable smell detection.
npm --prefix tools ci --silent --no-fund --no-audit

echo
echo "venv + tools ready. Run the harness with:  .venv/bin/python -m harness.<module>"
echo "Self-check:  .venv/bin/python -m harness.quality_selftest"
echo

# ── Things this script INSTALLS ───────────────────────────────────────────────────────────────
# Everything below is pinned by a file in tools/ and downloaded idempotently, so a second run is
# a no-op and every machine computes the same numbers. A metric produced by a different build of
# a tool is not comparable with runs already recorded, which is why the pins are checked rather
# than assumed.

HARNESS_DIR="$(pwd)"

# PMD — the backend cohesion/cognitive columns (pmd_*) and, where configured, the smell half of
# verbosity. ~140MB unpacked, gitignored, reproducible from tools/pmd-version.txt.
echo
echo "== metrics tooling =="
PMD_VERSION="$(cat "$HARNESS_DIR/tools/pmd-version.txt" 2>/dev/null || echo '')"
if [ -z "$PMD_VERSION" ]; then
  echo "   ! tools/pmd-version.txt missing — skipping PMD (pmd_* columns BLANK, not zero)"
elif [ -x "$HARNESS_DIR/tools/pmd/bin/pmd" ] \
     && "$HARNESS_DIR/tools/pmd/bin/pmd" --version 2>/dev/null | grep -q "PMD $PMD_VERSION"; then
  echo "   PMD $PMD_VERSION already installed (tools/pmd)"
elif ! command -v unzip >/dev/null 2>&1; then
  echo "   ! unzip not found — cannot unpack PMD. Install it, then re-run ./setup.sh"
else
  PMD_ZIP="$HARNESS_DIR/tools/pmd-dist.zip"
  PMD_URL="https://github.com/pmd/pmd/releases/download/pmd_releases/${PMD_VERSION}/pmd-dist-${PMD_VERSION}-bin.zip"
  echo "   downloading PMD $PMD_VERSION ..."
  if curl -sfL -o "$PMD_ZIP" "$PMD_URL"; then
    rm -rf "$HARNESS_DIR/tools/pmd"
    (cd "$HARNESS_DIR/tools" && unzip -q pmd-dist.zip && mv "pmd-bin-$PMD_VERSION" pmd)
    rm -f "$PMD_ZIP"
    echo "   PMD $PMD_VERSION installed (tools/pmd)"
  else
    echo "   ! PMD download failed — pmd_* columns will be BLANK. Manually:"
    echo "       curl -L -o tools/pmd-dist.zip '$PMD_URL'"
    echo "       (cd tools && unzip -q pmd-dist.zip && mv pmd-bin-$PMD_VERSION pmd)"
  fi
fi

# CK — the Chidamber-Kemerer suite (lcom, cbo, rfc, dit, ...). Source-only, so it runs over a
# materialised checkpoint tree exactly as lizard and PMD do. ~16MB, gitignored, pinned by
# tools/ck-version.txt + tools/ck-sha256.txt.
CK_VERSION="$(cat "$HARNESS_DIR/tools/ck-version.txt" 2>/dev/null || echo '')"
ck_sha() { sha256sum "$1" 2>/dev/null | cut -d' ' -f1; }
CK_WANT="$(cut -d' ' -f1 < "$HARNESS_DIR/tools/ck-sha256.txt" 2>/dev/null || echo '')"
if [ -z "$CK_VERSION" ]; then
  echo "   ! tools/ck-version.txt missing — skipping CK (ck_* columns BLANK, not zero)"
elif [ -f "$HARNESS_DIR/tools/ck/ck.jar" ] && [ "$(ck_sha "$HARNESS_DIR/tools/ck/ck.jar")" = "$CK_WANT" ]; then
  echo "   CK $CK_VERSION already installed (tools/ck/ck.jar)"
else
  CK_URL="https://repo1.maven.org/maven2/com/github/mauricioaniche/ck/${CK_VERSION}/ck-${CK_VERSION}-jar-with-dependencies.jar"
  echo "   downloading CK $CK_VERSION ..."
  mkdir -p "$HARNESS_DIR/tools/ck"
  if curl -sfL -o "$HARNESS_DIR/tools/ck/ck.jar" "$CK_URL"; then
    # FAIL CLOSED on a hash mismatch, like the lizard/jscpd pins: a metric computed by a
    # different build of the tool is not comparable with the runs already recorded.
    if [ -n "$CK_WANT" ] && [ "$(ck_sha "$HARNESS_DIR/tools/ck/ck.jar")" != "$CK_WANT" ]; then
      echo "   ! CK sha256 MISMATCH — removing; ck_* columns will be BLANK"
      rm -f "$HARNESS_DIR/tools/ck/ck.jar"
    else
      echo "   CK $CK_VERSION installed (tools/ck/ck.jar)"
    fi
  else
    echo "   ! CK download failed — ck_* columns will be BLANK. Manually:"
    echo "       mkdir -p tools/ck && curl -L -o tools/ck/ck.jar '$CK_URL'"
  fi
fi

# ImpactGate — required by the `gated` condition, optional otherwise. A local checkout is
# installed EDITABLE (so the owner's changes take effect immediately); otherwise it comes from
# the public repo, which is the zero-friction path for a newcomer. Either way it lands in THIS
# venv, which harness/impact_gate.default_cmd looks in first.
echo
echo "== impact-gate (needed only by the \`gated\` condition) =="
IG_SRC="${IMPACT_GATE_SRC:-${HOME}/ImpactGate}"
if [ -x ".venv/bin/impact-gate" ]; then
  echo "   already installed (.venv/bin/impact-gate)"
elif [ -f "$IG_SRC/pyproject.toml" ]; then
  ./.venv/bin/pip install --quiet -e "$IG_SRC" \
    && echo "   installed editable from $IG_SRC" \
    || echo "   ! editable install from $IG_SRC failed"
elif ./.venv/bin/pip install --quiet "git+https://github.com/officefloor/ImpactGate.git" 2>/dev/null; then
  echo "   installed from github.com/officefloor/ImpactGate"
else
  echo "   ! not installed — the \`gated\` condition cannot run (\`just-solve\` is unaffected)."
  echo "     Manually:  .venv/bin/pip install git+https://github.com/officefloor/ImpactGate.git"
  echo "     or set IMPACT_GATE_SRC=/path/to/ImpactGate and re-run ./setup.sh"
fi

# ── Everything else: reported by the ONE prerequisite table ──────────────────────────────────
# harness/doctor.py is the single source of truth, shared with run_experiment's preflight,
# analyze's tool check and ./verify-stack.sh. It used to be a list maintained here as well, and
# the two had already drifted — this file checked PMD but not `fuser`, the run preflight the
# reverse — which is the worst kind of bug to hand a newcomer: setup.sh says all-ok and the run
# then refuses. Each finding carries its consequence and the install command for THIS machine.
echo
./.venv/bin/python -m harness.doctor --config config.yaml --phase setup
doctor=$?

cat <<'NEXT'

Next:
  .venv/bin/python -m harness.quality_selftest          # tools see clones and smells
  .venv/bin/python -m harness.metrics_selftest          # structural metrics
  ./verify-stack.sh --repo ~/officehq-<stack> --smoke   # does the stack satisfy the contract?
  export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)  # long-lived; a run spans hours
  .venv/bin/python -m harness.run_experiment --config config.yaml --repo ~/officehq-<stack>
NEXT
exit $doctor
