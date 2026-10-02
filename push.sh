#!/usr/bin/env bash
#
# Push a STACK repo's evolve/<run_id>/... result branches to GitHub.
#
# The harness commits every chain's record — the evolved source plus that chain's
# evolve-results/capture — onto its own evolve/<run_id>/<condition>/chain<n> branch in
# the stack repo, and never pushes. The aggregate results/ tree stays local and
# gitignored, so pushing these branches is what makes a run a self-contained remote
# record that `analyze` can be re-run against.
#
# Only branches MISSING or STALE on the remote are pushed; anything already published at
# the same sha is skipped. Pushes are fast-forward only — a diverged branch is reported
# and left alone rather than force-pushed.
#
# Usage:  ./push.sh --repo <stack-repo> [run_id] [--dry-run] [--all] [--allow-dirty]
#           --repo <dir>   the STACK repo to push (~/officehq-<frontend>-<backend>).
#                          REQUIRED, and never read from config.yaml — same reasoning as
#                          run_experiment and analyze: one harness drives many stacks, so
#                          a path in the config would make every command silently about
#                          whichever stack was edited into it last. May be repeated to
#                          push several arms in one go.
#           run_id         only push evolve/<run_id>/... (default: every evolve branch)
#           --dry-run      list what would be pushed, push nothing
#           --all          also consider non-evolve local branches (e.g. base-empty)
#           --allow-dirty  push even if a worktree has uncommitted changes
#
# Overrides:  PUSH_URL=<git-url>   push target   (default: origin, rewritten to ssh)
#             PUSH_HTTPS=1         use origin's url as-is, no ssh rewrite
#
# The ssh rewrite exists because an https origin has no stored credentials in a
# non-interactive shell ("could not read Username for 'https://github.com'"), while ssh
# keys are already set up. PUSH_HTTPS=1 opts out.
#
set -euo pipefail

REPOS=() RUN_ID="" DRY_RUN=0 ALL_BRANCHES=0 ALLOW_DIRTY=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)        [ "$#" -ge 2 ] || { echo "--repo needs a directory" >&2; exit 2; }
                   REPOS+=("$2"); shift 2 ;;
    --repo=*)      REPOS+=("${1#--repo=}"); shift ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --all)         ALL_BRANCHES=1; shift ;;
    --allow-dirty) ALLOW_DIRTY=1; shift ;;
    -h|--help)     sed -n '2,33p' "$0"; exit 0 ;;
    -*)            echo "unknown option: $1 (see --help)" >&2; exit 2 ;;
    *)             [ -n "$RUN_ID" ] && { echo "only one run_id may be given" >&2; exit 2; }
                   RUN_ID="$1"; shift ;;
  esac
done

if [ "${#REPOS[@]}" -eq 0 ]; then
  echo "--repo is required: the stack repo to push (e.g. --repo ~/officehq-react-officefloor)." >&2
  echo "It is never configured — see --help." >&2
  exit 2
fi
if [ "$ALL_BRANCHES" = 1 ] && [ -n "$RUN_ID" ]; then
  echo "--all and a run_id are mutually exclusive" >&2; exit 2
fi

# Which local refs are candidates. for-each-ref treats a pattern ending at a slash
# boundary as a prefix, so refs/heads/evolve matches every nested chain branch.
if [ "$ALL_BRANCHES" = 1 ]; then
  REF_PATTERN="refs/heads"
elif [ -n "$RUN_ID" ]; then
  REF_PATTERN="refs/heads/evolve/$RUN_ID"
else
  REF_PATTERN="refs/heads/evolve"
fi

# https://github.com/o/r.git -> git@github.com:o/r.git  (see header)
to_ssh_url() {
  case "$1" in
    https://github.com/*) echo "git@github.com:${1#https://github.com/}" ;;
    *)                    echo "$1" ;;
  esac
}

total_pushed=0 total_skipped=0 total_diverged=0 repos_seen=0

for raw in "${REPOS[@]}"; do
  repo="${raw/#\~/$HOME}"                      # expand a leading ~ (no eval)
  repo="$(cd "$repo" 2>/dev/null && pwd -P || echo "$repo")"
  name="$(basename "$repo")"
  echo "== $name  ($repo)"
  if ! git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "   not a git work tree — skipped" >&2
    continue
  fi
  repos_seen=$((repos_seen + 1))

  if [ -n "${PUSH_URL:-}" ]; then
    url="$PUSH_URL"
  else
    url="$(git -C "$repo" remote get-url origin 2>/dev/null || true)"
    [ -n "$url" ] || { echo "   no origin remote and no PUSH_URL — skipped" >&2; continue; }
    [ "${PUSH_HTTPS:-0}" = 1 ] || url="$(to_ssh_url "$url")"
  fi

  # A dirty worktree means a branch tip may not reflect the finished chain. The harness
  # keeps a worktree per chain under paths.work_root, so check all of them.
  dirty=0
  while read -r wt; do
    [ -n "$wt" ] && [ -d "$wt" ] || continue
    if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null)" ]; then
      echo "   WARNING: uncommitted changes in $wt"
      dirty=1
    fi
  done < <(git -C "$repo" worktree list --porcelain | awk '/^worktree /{print $2}')

  mapfile -t locals < <(git -C "$repo" for-each-ref \
      --format='%(objectname) %(refname:short)' --sort=refname "$REF_PATTERN")
  if [ "${#locals[@]}" -eq 0 ]; then
    echo "   no local branches under ${REF_PATTERN#refs/heads/}"
    continue
  fi

  # One network round-trip for the remote's real heads, rather than trusting possibly
  # stale refs/remotes/origin/*.
  declare -A remote_sha=()
  while read -r sha ref; do
    [ -n "${sha:-}" ] || continue
    remote_sha["${ref#refs/heads/}"]="$sha"
  done < <(git ls-remote --heads "$url" 2>/dev/null)

  to_push=()
  for entry in "${locals[@]}"; do
    sha="${entry%% *}" branch="${entry#* }"
    rsha="${remote_sha[$branch]:-}"
    if [ -z "$rsha" ]; then
      to_push+=("$branch"); echo "   new      $branch"
    elif [ "$rsha" = "$sha" ]; then
      total_skipped=$((total_skipped + 1))
    elif git -C "$repo" merge-base --is-ancestor "$rsha" "$sha" 2>/dev/null; then
      to_push+=("$branch"); echo "   ahead    $branch"
    else
      total_diverged=$((total_diverged + 1))
      echo "   DIVERGED $branch — remote ${rsha:0:9} is not an ancestor; left alone" >&2
    fi
  done

  if [ "${#to_push[@]}" -eq 0 ]; then
    echo "   nothing to push"
    continue
  fi
  if [ "$dirty" = 1 ] && [ "$ALLOW_DIRTY" != 1 ]; then
    echo "   refusing to push with a dirty worktree — commit it, or pass --allow-dirty" >&2
    exit 1
  fi

  if [ "$DRY_RUN" = 1 ]; then
    echo "   [dry-run] would push ${#to_push[@]} branch(es) to $url"
  else
    echo "   pushing ${#to_push[@]} branch(es) to $url"
    git -C "$repo" push "$url" "${to_push[@]}"
    # Keep refs/remotes/origin/* honest even when origin is never fetched from.
    git -C "$repo" fetch --quiet "$url" "+refs/heads/*:refs/remotes/origin/*" 2>/dev/null || true
  fi
  total_pushed=$((total_pushed + ${#to_push[@]}))
done

echo
[ "$repos_seen" -gt 0 ] || { echo "No usable stack repo given." >&2; exit 1; }
prefix=""; [ "$DRY_RUN" = 1 ] && prefix="[dry-run] "
echo "${prefix}${total_pushed} branch(es) pushed, ${total_skipped} already up to date, ${total_diverged} diverged."
if [ "$total_diverged" -gt 0 ]; then
  echo "Diverged branches were NOT force-pushed; resolve them by hand." >&2
  exit 1
fi
exit 0
