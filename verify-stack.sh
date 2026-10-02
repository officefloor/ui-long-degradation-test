#!/usr/bin/env bash
#
# Does this stack satisfy the app contract? Run it BEFORE a run, not after.
#
# A run is hours of wall clock and real money, and the ways a stack can be wrong are mostly
# cheap to detect: a missing script, a stack.yaml that declares a root which is not there, a
# committed generated file that will swamp every diff-derived metric. This checks all of that
# statically against the COMMITTED base_ref, then — with --smoke — actually builds the app,
# starts it, polls readiness, pokes the seed endpoint, looks for the shell's data-testid anchors
# and stops it again, which is the whole of what the harness does per checkpoint.
#
# Usage:  ./verify-stack.sh --repo <stack-repo> [--smoke] [--condition gated|just-solve] [--quiet]
#           --repo <dir>   the stack to check (~/officehq-<frontend>-<backend>). REQUIRED, and
#                          never read from config.yaml — same reasoning as every other command.
#           --smoke        also build, start, probe and stop the app (minutes, no agent, no cost)
#           --condition    decides whether impact-gate counts as blocking (default: gated)
#           --quiet        only report problems
#
# Exit 0 = ready. Exit 1 = a blocking problem. Exit 2 = bad usage.
#
set -uo pipefail
cd "$(dirname "$0")"
PY="${PY:-./.venv/bin/python}"

REPO="" SMOKE=0 COND="gated" QUIET=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)      [ "$#" -ge 2 ] || { echo "--repo needs a directory" >&2; exit 2; }
                 REPO="$2"; shift 2 ;;
    --repo=*)    REPO="${1#--repo=}"; shift ;;
    --smoke)     SMOKE=1; shift ;;
    --condition) COND="$2"; shift 2 ;;
    --quiet)     QUIET="--quiet"; shift ;;
    -h|--help)   sed -n '2,20p' "$0"; exit 0 ;;
    *)           echo "unknown argument: $1 (see --help)" >&2; exit 2 ;;
  esac
done
[ -n "$REPO" ] || { echo "--repo is required (see --help)" >&2; exit 2; }
REPO="${REPO/#\~/$HOME}"

# Static checks: environment + the stack contract, from the one prerequisite table.
$PY -m harness.doctor --config config.yaml --repo "$REPO" --condition "$COND" $QUIET
static=$?

if [ "$SMOKE" != 1 ]; then
  echo
  echo "Static checks only. Add --smoke to build, start and probe the app (minutes, no agent)."
  exit $static
fi
[ "$static" -eq 0 ] || { echo; echo "Skipping --smoke: fix the blocking problems first." >&2; exit 1; }

# ── live smoke: exactly what the harness does to the app each checkpoint ──────────────────────
PORT="${PORT:-$($PY -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')}"
export PORT
export AUDIT_FILE="${AUDIT_FILE:-$REPO/.run/verify-audit.log}"
BASE="http://localhost:${PORT}"
HEALTH="$($PY -c '
import sys, yaml
c = yaml.safe_load(open("config.yaml"))
u = (c.get("app") or {}).get("health_url") or ""
sys.stdout.write(u.split("://",1)[-1].split("/",1)[-1] if "://" in u else u.lstrip("/"))')"

echo
echo "== smoke (port $PORT) =="
cleanup() { (cd "$REPO" && bin/stop >/dev/null 2>&1) || true; }
trap cleanup EXIT

step() { printf '  %-34s' "$1"; }
fail() { echo "FAILED"; echo "      $1" >&2; exit 1; }

step "bin/build"
(cd "$REPO" && bin/build >/tmp/verify-build.log 2>&1) || fail "see /tmp/verify-build.log"
echo "ok"

step "bin/start"
(cd "$REPO" && bin/start >/tmp/verify-start.log 2>&1) || fail "see /tmp/verify-start.log"
echo "ok"

step "readiness (/$HEALTH)"
ready=0
for _ in $(seq 1 90); do
  curl -fsS "$BASE/$HEALTH" >/dev/null 2>&1 && { ready=1; break; }
  sleep 1
done
[ "$ready" = 1 ] || fail "no 2xx from $BASE/$HEALTH within 90s (app.health_url)"
echo "ok"

step "seed endpoint (/__test__)"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
       -d '{}' "$BASE/__test__/reset" 2>/dev/null)
case "$code" in
  2*) echo "ok ($code)" ;;
  404) fail "/__test__/reset returned 404 — the acceptance suite arranges data through it (§4)" ;;
  *)   echo "ok (returned $code; a non-404 means the route exists)" ;;
esac

step "shell data-testid anchors"
html=$(curl -fsSL "$BASE/" 2>/dev/null || true)
miss=""
for id in app-root app-nav app-home; do
  case "$html" in *"data-testid=\"$id\""*) ;; *) miss="$miss $id" ;; esac
done
if [ -n "$miss" ]; then
  echo "not in the served HTML:$miss"
  echo "      (fine for a client-rendered SPA — the browser inserts them; the suite will confirm)"
else
  echo "ok"
fi

step "bin/stop frees the port"
(cd "$REPO" && bin/stop >/dev/null 2>&1) || true
sleep 1
if command -v fuser >/dev/null 2>&1 && fuser "${PORT}/tcp" >/dev/null 2>&1; then
  fail "port $PORT still held after bin/stop — it must free the port and be idempotent (§3)"
fi
echo "ok"

step "bin/stop is idempotent"
(cd "$REPO" && bin/stop >/dev/null 2>&1) || fail "second bin/stop returned non-zero (§3)"
echo "ok"

echo
echo "Stack is ready. A full run is still hours and real money:"
echo "  .venv/bin/python -m harness.run_experiment --config config.yaml --repo $REPO"
echo "  (first try --from 1 --to 1: cp01 sets the idiom the remaining checkpoints copy)"
