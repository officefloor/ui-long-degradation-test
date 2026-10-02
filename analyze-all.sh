#!/usr/bin/env bash
#
# Analyse EVERY run of every stack, then draw them all on one set of graphs.
#
# Discovers stack repos by the naming convention (~/officehq-*), asks each one which runs it
# holds — its evolve/<run_id>/<condition>/chain<n> branches — and runs `harness.analyze` once
# per (repo, run_id). A repo may hold several runs and several conditions; each is analysed
# separately, because `analyze`'s chain-cluster bootstrap is defined within a run.
#
# Then `harness.overview` reads every analysed run back and plots the arms against each other.
# It groups by (stack, condition) from the ROWS rather than from directory names, and adds the
# run id to a label only when the same stack and condition appear under more than one run —
# two runs of one arm are a repeat measurement, and averaging them would hide the spread this
# view exists to show.
#
# Pure derive: no agent, no tokens, CPU and wall clock only. results/<run_id>/analysis is
# OVERWRITTEN per run, and in this harness results/ is gitignored, so back it up first if a
# published number depends on it.
#
# Usage:  ./analyze-all.sh [--repo <dir>]... [<run_id>]... [--dry-run] [--overview-only] [--skip-analyze]
#           --repo <dir>     a stack repo to include (repeatable). Default: every ~/officehq-*
#                            that is a git work tree. Named explicitly it need not match the
#                            convention.
#           <run_id>         only these run ids (default: every run each repo holds)
#           --dry-run        list the work, do none of it
#           --skip-analyze   skip the per-run analysis, just redraw the overview
#           --overview-only  alias for --skip-analyze
#
# Overrides:  STACK_GLOB=<glob>   discovery pattern (default ${HOME}/officehq-*)
#             PY=<python>         interpreter (default ./.venv/bin/python)
#
set -uo pipefail
cd "$(dirname "$0")"

PY="${PY:-./.venv/bin/python}"
STACK_GLOB="${STACK_GLOB:-${HOME}/officehq-*}"
REPOS=() ONLY_RUNS=() DRY_RUN=0 SKIP_ANALYZE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)                   [ "$#" -ge 2 ] || { echo "--repo needs a directory" >&2; exit 2; }
                              REPOS+=("$2"); shift 2 ;;
    --repo=*)                 REPOS+=("${1#--repo=}"); shift ;;
    --dry-run)                DRY_RUN=1; shift ;;
    --skip-analyze|--overview-only) SKIP_ANALYZE=1; shift ;;
    -h|--help)                sed -n '2,30p' "$0"; exit 0 ;;
    -*)                       echo "unknown option: $1 (see --help)" >&2; exit 2 ;;
    *)                        ONLY_RUNS+=("$1"); shift ;;
  esac
done

# Discovery: the naming convention, filtered to actual git work trees so a stray directory
# (a build output, an editor backup) cannot enter the sweep.
if [ "${#REPOS[@]}" -eq 0 ]; then
  for d in $STACK_GLOB; do
    [ -d "$d" ] || continue
    git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1 || continue
    REPOS+=("$d")
  done
fi
if [ "${#REPOS[@]}" -eq 0 ]; then
  echo "no stack repos found under $STACK_GLOB (and none given with --repo)" >&2
  exit 1
fi

wants_run() {                       # $1 = run_id
  [ "${#ONLY_RUNS[@]}" -eq 0 ] && return 0
  for r in "${ONLY_RUNS[@]}"; do [ "$r" = "$1" ] && return 0; done
  return 1
}

echo "=== discovering runs  $(date -Is)"
PAIRS=()                            # "repo<TAB>run_id"
for repo in "${REPOS[@]}"; do
  repo="${repo/#\~/$HOME}"
  name="$(basename "$repo")"
  # Interrogate the repo for what it holds: run id AND condition come from the branch name,
  # so a repo with several runs or several conditions is reported as such rather than assumed.
  mapfile -t found < <(git -C "$repo" for-each-ref --format='%(refname:short)' \
      'refs/heads/evolve' 2>/dev/null | sed 's|^evolve/||')
  if [ "${#found[@]}" -eq 0 ]; then
    printf "  %-32s no runs\n" "$name"
    continue
  fi
  mapfile -t runs < <(printf '%s\n' "${found[@]}" | cut -d/ -f1 | sort -u)
  for run in "${runs[@]}"; do
    conds=$(printf '%s\n' "${found[@]}" | awk -F/ -v r="$run" '$1==r{print $2}' | sort -u | tr '\n' ',' | sed 's/,$//')
    nch=$(printf '%s\n' "${found[@]}" | awk -F/ -v r="$run" '$1==r' | wc -l)
    if wants_run "$run"; then
      printf "  %-32s %s  [%s]  %s chain-branch(es)\n" "$name" "$run" "$conds" "$nch"
      PAIRS+=("$repo"$'\t'"$run")
    else
      printf "  %-32s %s  [%s]  skipped (not in the run ids given)\n" "$name" "$run" "$conds"
    fi
  done
done

echo
if [ "${#PAIRS[@]}" -eq 0 ]; then
  echo "nothing to analyse."
  [ "$SKIP_ANALYZE" = 1 ] || exit 0
fi

ok=0 bad=0
if [ "$SKIP_ANALYZE" = 1 ]; then
  echo "=== skipping per-run analysis (--skip-analyze)"
else
  echo "=== analysing ${#PAIRS[@]} run(s)  $(date -Is)"
  for pair in "${PAIRS[@]}"; do
    repo="${pair%%$'\t'*}" run="${pair##*$'\t'}"
    name="$(basename "$repo")"
    log="results/analyze-${name}-${run}.log"
    echo "--- $name $run  ->  $log"
    if [ "$DRY_RUN" = 1 ]; then
      echo "    [dry-run] $PY -m harness.analyze --config config.yaml --repo $repo --run-id $run"
      continue
    fi
    mkdir -p results
    # tee, not >: a run takes minutes and prints a heartbeat per checkpoint, so a bare
    # redirect leaves the terminal silent throughout. PIPESTATUS[0] is the analyzer's status.
    "$PY" -u -m harness.analyze --config config.yaml --repo "$repo" --run-id "$run" \
        2>&1 | tee "$log"
    code=${PIPESTATUS[0]}
    if [ "$code" -eq 0 ]; then ok=$((ok + 1)); else
      bad=$((bad + 1)); echo "    ! FAILED (exit $code) — see $log" >&2
    fi
  done
fi

echo
echo "=== overview  $(date -Is)"
if [ "$DRY_RUN" = 1 ]; then
  echo "  [dry-run] $PY -m harness.overview"
else
  "$PY" -u -m harness.overview || echo "  ! overview failed" >&2
fi

echo
echo "=== done  $(date -Is)   analysed ok=$ok failed=$bad"
[ "$bad" -eq 0 ] || exit 1
exit 0
