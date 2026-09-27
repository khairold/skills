#!/usr/bin/env bash
# dot-plan gate wrapper.
#   gate.sh build|full [--label L]   run the command from .plan/config, log one line to .plan/gate.log
#   gate.sh quick                    run the quick command; never logged, never the gate
#   gate.sh --hash [<commit>]        print the code hash of the staged files, or of a commit
# The hash covers every tracked path except .plan/, so a PASS pairs with exactly what is committed.
# A build is skipped when nothing unstaged is in the way and the same hash already has a PASS at
# build or full strength.
# gate.log line: <epoch> <time> <hash> <mode> PASS|FAIL|DIRTY <seconds> <label>
# The build's own outputs (coverage/, dist/, caches) must be ignored by git, or every run is DIRTY.
set -uo pipefail
root=$(git rev-parse --show-toplevel) || { echo "gate: not in a git repo" >&2; exit 2; }
cd "$root" || exit 2
LOG=.plan/gate.log
G="git -c core.quotePath=false"

code_hash() {
  if [ -n "${1:-}" ]; then
    $G ls-tree -r "$1" | awk -F'\t' '{split($1,a," "); if ($2 ~ /^\.plan\//) next; print a[1], a[3], $2}'
  else
    $G ls-files -s | awk -F'\t' '{split($1,a," "); if ($2 ~ /^\.plan\//) next; print a[1], a[2], $2}'
  fi | LC_ALL=C sort | git hash-object --stdin | cut -c1-12
}

cfg() {
  awk -v k="$1" '{ sub(/[ \t]#.*$/, ""); i = index($0, "="); if (!i) next
    key = substr($0, 1, i-1); gsub(/^[ \t]+|[ \t]+$/, "", key)
    if (key == k) { v = substr($0, i+1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v; exit } }' .plan/config
}

# Code changed but not staged: tracked edits and untracked files, outside .plan/ and not-ours.
unstaged() {
  { $G diff --name-only --no-renames; $G ls-files --others --exclude-standard; } | grep -v '^\.plan/' |
    { if [ -s .plan/logs/not-ours ]; then grep -vxF -f .plan/logs/not-ours; else cat; fi; } | sort -u
}

mode=${1:-}; [ $# -gt 0 ] && shift
case "$mode" in
  --hash) code_hash "${1:-}"; exit 0 ;;
  build|full|quick) ;;
  *) echo "usage: gate.sh build|full|quick [--label L] | --hash [<commit>]" >&2; exit 2 ;;
esac
label=-
while [ $# -gt 0 ]; do
  case "$1" in
    --label) label=${2:--}; shift; [ $# -gt 0 ] && shift ;;
    *) shift ;;
  esac
done

[ -f .plan/config ] || { echo "gate: .plan/config missing" >&2; exit 2; }
cmd=$(cfg "$mode")
[ -n "$cmd" ] || { echo "gate: no '$mode' command in .plan/config" >&2; exit 2; }
mkdir -p .plan/logs

if [ "$mode" = quick ]; then bash -c "$cmd"; exit $?; fi

hash=$(code_hash)
dirty=$(unstaged)
if [ -z "$dirty" ] && [ -f "$LOG" ]; then
  if [ "$mode" = build ]; then want='build|full'; else want='full'; fi
  prior=$(awk -v h="$hash" -v w="^($want)\$" '$3 == h && $4 ~ w && $5 == "PASS" {print $2, $4}' "$LOG" | tail -1)
  if [ -n "$prior" ]; then echo "gate: SKIP $hash already passed ($prior)"; exit 0; fi
fi

start=$(date +%s)
bash -c "$cmd" 2>&1 | tee .plan/logs/gate-last.log
rc=${PIPESTATUS[0]}
secs=$(( $(date +%s) - start ))

dirty=$(unstaged)
if [ "$rc" -ne 0 ]; then result=FAIL
elif [ -n "$dirty" ] || [ "$(code_hash)" != "$hash" ]; then result=DIRTY
else result=PASS; fi

when=$(date -r "$start" +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || date -d "@$start" +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)
printf '%s %s %s %s %s %s %s\n' "$start" "$when" "$hash" "$mode" "$result" "$secs" "$label" >> "$LOG"
echo "gate: $result $hash $mode ${secs}s"
if [ "$result" = DIRTY ]; then
  echo "gate: code changed but not staged (stage it or undo it, then gate again):" >&2
  echo "$dirty" | sed 's/^/  /' >&2
  exit 3
fi
exit "$rc"
