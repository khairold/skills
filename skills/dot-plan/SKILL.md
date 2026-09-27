---
name: dot-plan
description: Build software with AI agents from a phased plan kept in .plan/, mostly unattended. One skill, five modes - init (turn a spec into a plan), run (the build, one fresh agent per item), gate (between phases), audit (the process, from above), close (finish the plan). Use when the user says /dot-plan, or asks to plan a build from a spec, run or continue the plan, supervise the build, run a phase gate, audit the build process, or close the plan.
---

# dot-plan

Build software with AI agents while nobody is watching. One human sets the direction and reads
the results. Everything the agents know lives in `.plan/`, committed next to the code.

- **One human.** Everyone else is an agent.
- **The plan is a list.** Phases, and items small enough to finish in one sitting.
- **One item, one fresh agent.** It does the item, hands it over, and is gone. The next agent
  starts from what is written down.
- **Nothing waits for the human.** What an agent cannot decide goes on a list, the agent picks
  the safest option, and the run continues.
- **Unfinished work counts for nothing.** An item is done when it is committed on a green gate.

`$SKILL` below means the folder that holds this file.

## Modes

Invoked as `/dot-plan <mode>`. Read the mode's reference file before doing anything else, and
read only that one. With no mode given: no `.plan/` means `init`, open items mean `run`, all
items done means `close`. Say which you picked and why.

| Mode | When | Human | Read |
|---|---|---|---|
| `init` | turn a spec into a plan, or adopt an existing `.plan/` | present | `$SKILL/references/init.md` |
| `run [--until 4\|3B] [--attended] [--status]` | the build | unattended, or present with `--attended` | `$SKILL/references/run.md` |
| `gate` | between phases; `run` calls it by itself | unattended | `$SKILL/references/gate.md` |
| `close` | the plan is finished | present | `$SKILL/references/close.md` |
| `audit` | the process from above, when the human asks | present | `$SKILL/references/audit.md` |

Other files in `$SKILL`: `references/worker.md` (given to every worker and fix agent),
`references/reviewer.md` (given to the reviewer), `templates/` (what `init` writes),
`scripts/gate.sh` (the gate wrapper), `scripts/discard.sh` (the default discard),
`scripts/numbers.sh` (the numbers at a gate).

## Roles

- **The human.** Answers the questions at `init`, starts a run, reads the report and the gate
  numbers, owns the never-list. Is asked nothing during an unattended run.
- **The supervisor,** the main session. Picks items, spawns workers, checks the gate proof,
  calls the reviewer, commits, keeps the trail and the heartbeat. Never writes code, unless no
  subagent can be spawned; then it does the items itself and logs that it did.
- **The worker,** a fresh subagent per item. Does one item, or a few small ones, stages, runs
  the gate, logs, returns a summary. Never commits, never asks. After a review, a fresh worker
  is the fix agent.
- **The reviewer,** a fresh subagent on another model. Reviews risky items and the batch at the
  end of each sub-phase. Reports findings, never edits.

`audit` is not a fifth agent. It is the supervisor's judgement, run from above the process,
when the human asks and with the human there.

## Models

| Role | Default | When the default is unavailable |
|---|---|---|
| worker, fix agent | latest Opus (`opus`) | the session's own model (omit `model`) |
| reviewer | latest Fable (`fable`) | latest Opus in a fresh context; say so in SUPERVISOR-LOG |

`init` shows these and the human confirms or changes them; the result is `worker_model` and
`reviewer_model` in `.plan/config`. Never name another model unless the human does.

## Rules

A project changes these only in `.plan/ENGINE.md`, and only by writing the difference.
ENGINE.md wins over this file.

1. **One item, one fresh agent.** It reads only its item, the Rails, the gotchas and the
   sections the item names. Never the whole plan. Small items in one phase may share an agent
   and a commit, as long as together they still fit one sitting.
2. **The gate.** Every item passes the build command before it is committed, and the proof is a
   PASS line in `.plan/gate.log` for the hash of the staged code. Green or it does not commit.
3. **The reviewer did not write it.** An item that touches a risky path is reviewed by an agent
   that did not make it, on another model, with `.plan/REVIEW.md`. One review, then one fix
   round by a fresh fix agent. A finding that comes back item after item becomes a test.
4. **Earlier phases stay green.** Their tests run on every commit. A golden file that changes is
   explained in the commit, file by file.
5. **A correction is fixed twice.** Once in the work, once so it cannot happen again, in the
   same change: code that makes it impossible, then a test, then a `REVIEW.md` line, then a
   written line. A lesson not worth one of those today is not worth a row.
6. **Defer, never wait.** An agent that cannot decide picks the most reversible, safest option,
   writes a DEFERRED row, and continues. An item that truly needs a human is marked `[~]` and
   skipped. An unattended run has no way to ask; `--attended` is the one way a run may.
7. **Write it once.** An item's details go in SESSION-LOG. The tick is one line. A gotcha is a
   line or two. A decision between real options gets a decision record in the project's docs.
8. **Leave what is not yours.** Files already changed when the run started are listed in
   `.plan/logs/not-ours` and never staged, edited or discarded. A discard reverts only the
   worker's own files. A project's own hard stops (deny rules, hooks) are never removed.
9. **Count between phases.** Items per hour, process share and its trend, reviewer calls against
   catches, escaped defects, human interruptions, computed from the logs. Anything that costs
   more than it catches goes. Changing nothing is a valid decision.
10. **One report at the end.** What was done, what was skipped and why, every DEFERRED row
    grouped by who acts, and the numbers.

## The never-list

dot-plan ships no hard stops and removes none a project has. Every agent obeys this list, plus
any lines the project adds in `.plan/ENGINE.md`:

- Never rewrite or discard committed history. Discard goes through the discard step only. The
  one exception: in `branch` mode, `gate` rebases the plan's own unmerged branch on main.
- Never touch real data, a production system, or a customer-facing channel. Such an item is
  `[~]` and a DEFERRED row.
- Never delete ignored files, secrets such as `.env`, or untracked files you did not create.
- Never edit Claude Code settings or the `.git` folder.
- Never lower a floor or an exit criterion without saying why in the commit.
- Never delete or rewrite the spec or the audits. Corrections go in DRIFT.
- Never ask the human during an unattended run.
- Never push to main. In `local` mode nothing is pushed. In `branch` mode only the plan's own
  branch is pushed. Never use `--no-verify`.

## Files in `.plan/`

Committed, so the plan travels with the repo. Only `.plan/logs/` stays local.

| File | Holds | Written by |
|---|---|---|
| `config` | commands, paths, models, where work lands | `init`; `audit` or the human |
| `gate.log` | one line per gate run: time, staged-code hash, mode, result, seconds | `$SKILL/scripts/gate.sh` only |
| `PLAN.md` | header, phases, exit criteria, items, ticks, Parking Lot | `init`; ticks by the worker; header by the supervisor |
| `MEMORY.md` | Rails, then gotchas; short enough to read in seconds | Rails by `init`; one gotcha at most per item |
| `ENGINE.md` | only this project's overrides; may be empty | `init` if needed; `audit` |
| `REVIEW.md` | the reviewer's checklist; shrinks over time | `init` from the template; `audit` |
| `DRIFT.md` | where the build departed from the spec | the worker, the supervisor |
| `DEFERRED.md` | what needed the human, the default chosen, how to reverse it | anyone |
| `SESSION-LOG.md` | each item once in full, each gate, each audit; read by search | the worker, `gate`, `audit` |
| `SUPERVISOR-LOG.md` | the run's trail; enough to resume from alone | the supervisor |
| `REPORT.md` | the end-of-plan report | `close`, or `run` when nothing is left |
| `logs/` | worker outputs, discarded diffs, `run.lock`, `not-ours`; not committed | the supervisor, the discard step |
