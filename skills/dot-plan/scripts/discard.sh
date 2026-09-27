#!/usr/bin/env bash
# dot-plan default discard: throw away the current attempt, and only the attempt.
#   discard.sh <label>
# Reverts every change since HEAD except .plan/logs/, .plan/gate.log, .plan/SUPERVISOR-LOG.md and
# the paths in .plan/logs/not-ours (the supervisor adds any path that was dirty before the item
# started). Saves everything first to .plan/logs/failed-<label>.diff, untracked files included.
# Never touches ignored files.
set -uo pipefail
label=${1:?usage: discard.sh <label>}
root=$(git rev-parse --show-toplevel) || exit 2
cd "$root" || exit 2
git rev-parse --verify -q HEAD >/dev/null || { echo "discard: no commit yet; nothing to go back to" >&2; exit 2; }
G="git -c core.quotePath=false"
mkdir -p .plan/logs
out=.plan/logs/failed-$label.diff

keep() {
  grep -v -e '^\.plan/logs/' -e '^\.plan/gate\.log$' -e '^\.plan/SUPERVISOR-LOG\.md$' |
    { if [ -s .plan/logs/not-ours ]; then grep -vxF -f .plan/logs/not-ours; else cat; fi; }
}
tracked=$($G diff --name-only --no-renames HEAD | keep | sort -u)
untracked=$($G ls-files --others --exclude-standard | keep | sort -u)

if [ -z "$tracked$untracked" ]; then echo "discard: nothing to discard"; exit 0; fi

: > "$out"
if [ -n "$tracked" ]; then
  while IFS= read -r f; do $G diff --no-renames HEAD -- "$f" >> "$out"; done <<< "$tracked"
fi
if [ -n "$untracked" ]; then
  while IFS= read -r f; do $G diff --no-index -- /dev/null "$f" >> "$out"; done <<< "$untracked"
fi

n=0
if [ -n "$tracked" ]; then
  while IFS= read -r f; do
    if git cat-file -e "HEAD:$f" 2>/dev/null; then git restore --source=HEAD --staged --worktree -- "$f"
    else git rm --cached -q --ignore-unmatch -- "$f"; rm -f -- "$f"; fi
    n=$((n+1))
  done <<< "$tracked"
fi
if [ -n "$untracked" ]; then
  while IFS= read -r f; do rm -f -- "$f"; n=$((n+1)); done <<< "$untracked"
fi
echo "discard: reverted $n file(s); saved to $out"
