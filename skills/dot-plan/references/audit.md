# audit: the process, from above

Runs when the human asks, with the human there: after an incident, when a run feels slow, when
a gate asked for one, or on a hunch. It judges; it does not follow a checklist.

1. **Live run?** If `.plan/logs/run.lock` has a `beat` younger than an hour, a run is live.
   Read and talk, but change no file until it stops.
2. **Read** the git history since the last audit (the last SESSION-LOG entry tagged `Audit`,
   or the start of the plan), the phase-gate entries and their numbers, DEFERRED, DRIFT, the
   tail of SUPERVISOR-LOG, `config`, `ENGINE.md`, `REVIEW.md`, and the project's `CLAUDE.md`.
3. **Judge,** against one rule: delivery pays for everything. A check stays only while it
   catches more than it costs. A check comes back only after a real escaped defect, named in
   the fix, in the cheapest form that works: code that makes it impossible, then a test, then
   a written rule. Also ask: does the plan still serve the goal? Is MEMORY, ENGINE or REVIEW
   growing? Are workers reading more than they need? Is the human being needed mid-run?
4. **Propose.** Say what you saw, with numbers, and what you would change, removals first. Ask
   the human where the call is theirs. A big change needs their OK; a small removal may be
   applied and reported. The reviewer can give a second opinion on a big change.
5. **Change** anything the human agreed to: the plan, `config`, `ENGINE.md`, `REVIEW.md`,
   `CLAUDE.md`, the code. The project's own hard stops bind you: changing one is the human's
   to do. Changing nothing is a valid result.
6. **Log** an entry in SESSION-LOG.md tagged `Audit`: what you saw, what changed and why, what
   to watch next time. Commit `plan: audit <date>`.
