# close: the plan is finished

The human is present. Either the whole close happens, or nothing is deleted.

1. **REPORT.md** in `.plan/`, one screen then tables: phases and items done; items skipped
   (`[~]`) and why; every DEFERRED row grouped by who must act (a decision for the human, a
   human action, Legal or compliance, suites skipped); the final gate results; every gate's
   numbers in one table; the Parking Lot.
2. **Route what is worth keeping.** Walk MEMORY (Rails and gotchas), DRIFT, DEFERRED, the
   Parking Lot and decisions in SESSION-LOG. For each, propose where it belongs in the
   project's own docs (`CLAUDE.md`, `docs/`, a decision record, an issue, nowhere) as one
   table. Wait for the human to confirm or change it. Never lose a Parking Lot item: it goes
   somewhere or the human drops it by name.
3. **Write** the confirmed updates, integrated into the existing docs, not appended as dumps.
   Read each back.
4. **Move the report** to the place the human picks (default `docs/plans/<plan name>.md`) and
   add one line naming the last commit that still has `.plan/`:
   `The plan's files are at <sha>: git show <sha>:.plan/<file>`.
5. **Delete `.plan/`** and commit: `plan: close <plan name>`.
6. **Branch mode.** Push the plan's branch and open the pull request with the report as its
   description (`gh pr create` when available). Without `gh`, give the human the branch name
   and the report path to open it by hand.
