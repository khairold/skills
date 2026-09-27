# gate: between phases

Run by `run` when a phase's items are all `[x]` or `[~]`, or by the human. Unattended: never
ask; what needs the human is a DEFERRED row. You are still the supervisor: a fix item here is
done exactly as in run.md §2, by a fresh worker, and committed like any other item.

1. **Full checks.** `$SKILL/scripts/gate.sh full --label gate-<P>` in the background, and
   `verify` from `config` when it exists. Start the services they need first and stop them
   after (ENGINE.md says which). Red: one fix item, done like any other, then the full checks
   again. Still red: DEFERRED row, push, stop the run. Each `full` run's time is already in
   gate.log; log verify as `EV … verify gate-<P> <seconds>`.
2. **Exit criteria.** Each one shown to hold, with evidence: a test name, a command and its
   output, a file. One that does not hold becomes a fix item. Never weaken a criterion to pass
   it; a criterion that turns out wrong is a DRIFT row and a DEFERRED row.
3. **Trust checks,** mechanical, before any rebase:
   - For each commit in the phase with a `Plan:` line: `gate.sh --hash <commit>` has a PASS
     line (mode `build` or `full`) in `gate.log`. A miss is a finding, not a rollback.
   - Any one-way file (a coverage floor, a version, a golden file, a rights row, anything
     ENGINE.md lists) moved only with a reason in its commit.
   - Nothing on the not-ours list was committed.
4. **Batch review** of the last sub-phase, or of the phase if it has none (run.md §3).
5. **The numbers.** Log `EV <epoch> <iso> phase-end <P> 0` now, after the checks and reviews
   above, so their time counts in this phase. Then `$SKILL/scripts/numbers.sh <P>` prints items, items per hour, files per
   item, run minutes, process minutes and share, reviewer calls and catches, skips and times
   the human was needed. Add what only judgement gives: escaped defects (a bug in finished
   work with no test that would have caught it, and which phase let it through). Read the
   previous phase-gate entries for the trend. Big items slow the pace; say so rather than
   blaming the process.
6. **Trim MEMORY.** Delete a gotcha a test now names, and a number nobody re-measured. Back to
   a size a worker reads in seconds.
7. **Proposals,** at most three, removals first. A removal is applied now. An addition is
   applied only when it names the escaped defect it answers; otherwise it is a DEFERRED row. A
   process share that rose at two gates running adds a DEFERRED row asking the human for an
   `audit`.
8. **Write the phase-gate entry** in SESSION-LOG.md:

   ```
   ## Phase 5 gate · 2026-09-28 01:10
   - Checks: full PASS <hash> 4m12s; verify PASS <report path>
   - Exit criteria: <each, with its evidence>
   - Trust: <n> commits paired; <misses or none>
   - Batch review: <findings, or skipped: none unseen>
   - Numbers: 9 items · 3.1/h · 11 files/item · process 38% (phase 4: 41%) · reviewer 5 calls,
     3 catches · escaped: none · human needed: 0
   - MEMORY: 152 → 140 lines
   - Proposals: <applied / deferred>
   ```

9. **Branch mode.** `git fetch`, then rebase the plan's branch on the remote main. Conflicts
   that are not trivial: `git rebase --abort`, a DEFERRED row, carry on unrebased. After a
   rebase, `gate.sh build --label gate-<P>-rebased`; red is a fix item. Push the plan's branch
   (`--force-with-lease` after a rebase). Never push main.
10. Mark the phase done in PLAN.md (`## Phase 5 — … ✓`), move `Current Phase:` on, log
    `EV <epoch> <iso> phase-start <next> 0`, commit `plan: phase 5 gate`, push the
    notification, and go back to `run`, unless `--until` said stop.
