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

# External prerequisites this script does NOT install. Report, never fail: a missing metrics tool
# only blanks its columns (config.yaml: tools), while a missing impact-gate breaks the `gated` run.
miss=0
check() {   # check <label> <path-or-command> <consequence>
  if [ -x "$2" ] || command -v "$2" >/dev/null 2>&1; then
    printf '  ok       %s\n' "$1"
  else
    printf '  MISSING  %-12s %s\n' "$1" "$3"; miss=1
  fi
}
echo "External prerequisites:"
check impact-gate "${HOME}/ImpactGate/.venv/bin/impact-gate" "the 'gated' condition cannot run"
check pmd "${HOME}/spring-petclinic-rest-long-degradation-test/tools/pmd/bin/pmd" \
      "PMD metric columns stay blank"
check java java "the CK metrics cannot run"
check node node "the quality gate and the app build cannot run"
[ "$miss" = 0 ] || echo "  (config.yaml 'tools:' documents each; ck.jar is unset by default.)"
