#!/usr/bin/env bash
# dot-plan numbers for one phase, from the EV lines in .plan/SUPERVISOR-LOG.md and .plan/gate.log.
#   numbers.sh <phase>        e.g. numbers.sh 5
# Run time counts only while a run was live (launch to stop), inside the phase window.
# Process = gate runs (build, full) + verify + review + batch review + fix rounds.
set -uo pipefail
P=${1:?usage: numbers.sh <phase>}
root=$(git rev-parse --show-toplevel) || exit 2
cd "$root" || exit 2
SL=.plan/SUPERVISOR-LOG.md; GL=.plan/gate.log
[ -f "$SL" ] || { echo "numbers: $SL missing" >&2; exit 2; }

now=$(date +%s)
{ grep '^EV ' "$SL" | sed 's/^EV /E /'; [ -f "$GL" ] && sed 's/^/G /' "$GL"; } |
awk -v P="$P" -v now="$now" '
  $1 == "E" { n++; t[n] = $2; k[n] = $4; it[n] = $5; v[n] = $6
              if ($4 == "phase-start" && $5 == P) ps = $2
              if ($4 == "phase-end"   && $5 == P) pe = $2 }
  $1 == "G" { g++; gt[g] = $2; gm[g] = $5; gs[g] = $7 }
  END {
    if (ps == "") { print "numbers: no phase-start " P " in SUPERVISOR-LOG"; exit 2 }
    if (pe == "") pe = now
    run = 0; live = ""
    for (i = 1; i <= n; i++) {
      if (k[i] == "launch") live = t[i]
      if (k[i] == "stop" && live != "") { a = (live > ps ? live : ps); b = (t[i] < pe ? t[i] : pe); if (b > a) run += b - a; live = "" }
    }
    if (live != "") { a = (live > ps ? live : ps); b = (now < pe ? now : pe); if (b > a) run += b - a }
    for (i = 1; i <= n; i++) {
      if (t[i] < ps || t[i] > pe) continue
      if (k[i] == "review" || k[i] == "batch") { rv += v[i]; calls++ }
      if (k[i] == "fix") fx += v[i]
      if (k[i] == "verify") vf += v[i]
      if (k[i] == "catch") catches++
      if (k[i] == "skip") skips++
      if (k[i] == "needed") needed++
      if (k[i] == "commit") { m = split(it[i], x, /,/); items += m; files += v[i]; commits++ }
    }
    for (j = 1; j <= g; j++) if (gt[j] >= ps && gt[j] <= pe && (gm[j] == "build" || gm[j] == "full")) { gate += gs[j]; runs++ }
    proc = gate + vf + rv + fx
    printf "Phase %s\n", P
    printf "  items: %d in %d commits · %.1f files/item\n", items, commits, (items ? files / items : 0)
    printf "  run time: %d min · items/hour: %.1f\n", run / 60, (run ? items * 3600 / run : 0)
    printf "  process: %d min (gate %d runs %d min, verify %d, review %d, fix %d) · share %d%%\n", proc / 60, runs, gate / 60, vf / 60, rv / 60, fx / 60, (run ? 100 * proc / run : 0)
    printf "  reviewer: %d calls, %d real catches\n", calls, catches
    printf "  skipped [~]: %d · human needed: %d\n", skips, needed
    printf "  escaped defects: judged at the gate\n"
  }'
