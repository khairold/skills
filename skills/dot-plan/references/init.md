# init: write the plan

The human is present. Ask with AskUserQuestion; give a recommendation first in each question.

## 1. Read

- The spec (whatever the human points at, or `SPEC.md`, `docs/`).
- Project guidance: `CLAUDE.md`, `.claude/rules/`, `AGENTS.md`, contributing and commit
  conventions, any branch-naming rules, git hooks (Husky, pre-commit).
- How the project checks itself: its test, lint and typecheck scripts, CI config, Makefile.
- If `.plan/` already exists, go to "Adopting an existing plan" below instead.

## 2. Ask, once

Four questions. The answers become the Rails section of `MEMORY.md`, which a run never reopens.

1. **The goal.** What "done" means for the whole plan. A plan built from an audit can end
   "loop until dry": fix the audit, then re-audit, fix what the round finds, and stop only at
   a round with no High and no Medium (see "Audit rounds" below).
2. **What must not change.** Behaviour, interfaces, data, files the plan may not touch.
3. **What only a human can do.** External systems, sign-offs, device checks, Legal. Items that
   need these are marked `[~]` or human-verify when planned.
4. **Where the work lands.** `local`: commits on main, never pushed (the default). `branch`: one
   branch per plan named by the team's rule, rebased on main at each gate, pull request at
   close. Nothing is ever pushed to main.

One rail is added unless the human strikes it: *thorough about the product, cheap about the
process*.

Then confirm, in one question each or one combined question:

- **Models.** Worker: latest Opus, falling back to the session's model. Reviewer: latest Fable,
  falling back to latest Opus. Recommend the defaults.
- **Commands.** The `build`, `quick` and `full` commands you found (check their outputs,
  such as coverage or build folders, are git-ignored, or every gate reads as DIRTY), `verify` if there is an
  end-to-end check, and the `risky` paths you propose (the gate itself, the test framework,
  migrations, anything touching money, evidence, customers or security).

## 3. Cut the work

- **Phases.** Each delivers something that works, can be checked on its own, builds only on
  earlier phases, and has written exit criteria. Order by dependency, then value. A phase with
  distinct parts worth reviewing apart splits into sub-phases (`3A`, `3B`).
- **Items.** One piece of work a fresh agent finishes in one sitting, described in one line,
  ending in one commit. If it cannot be said in one line, split it. Number them `3.1` or
  `3A.1`. An item names the sections of the spec or audit its agent needs. An item whose
  check needs a person is tagged `(human-verify)`. An item whose count depends on data not yet
  seen can be a `CREATE TASKS` item: it reads the data, inserts concrete items below itself,
  and ends.
- A Parking Lot at the end of PLAN.md holds what was discussed and not planned.

### Audit rounds

When the goal is "loop until dry", the last phase is an audit round, shaped like this:

```
## Phase 11 — Round 3 (loop until dry)

**Goal:** find what the earlier phases missed or broke.
**Exit criteria:** a round finds no High or Medium (the plan is dry), or its findings are planned.

- [ ] 11.1 — CREATE TASKS: re-audit HEAD into `docs/audit-3/` (`/codebase-audit --round 3`),
  each lens given its round-2 report; its High and Medium findings become Phase 12 items and a
  Phase 13 audit round after them; none means the plan is dry · reads: <round 2's AXES>
```

The fold writes the fix phase and the next audit round below itself, so the plan grows one
round at a time. There is no limit on rounds: the run stops when one comes back dry. The round
folders' lens reports go on the never-rewrite line in `ENGINE.md`.

## 4. Write

From `$SKILL/templates/`, into `.plan/`: `config`, `PLAN.md`, `MEMORY.md`, `REVIEW.md`,
`DRIFT.md`, `DEFERRED.md`, `SESSION-LOG.md`, `SUPERVISOR-LOG.md`. Write `ENGINE.md` only if the
project needs an override now. Add `.plan/logs/` to `.gitignore`.

Check the repo has a glossary or a "where things are" doc a worker can be pointed at. If not,
draft a glossary from the spec into `docs/` and the human confirms it. It is the only file
`init` writes outside `.plan/` and `.gitignore`. The Rails point at it.

In `branch` mode, create the plan's branch from an up-to-date main before the first commit.

Commit: `plan: init <plan name>`, message from a file, following the project's commit
convention if it has one.

Show the human the phase list and the first phase's items, and say how to start:
`/dot-plan run`, or `/dot-plan run --until 1` for one phase.

## Adopting an existing plan

A `.plan/` from the older phased-plan skills, or one a project grew by hand:

1. Read it all. Keep `PLAN.md`, `MEMORY.md`, `DRIFT.md`, `SESSION-LOG.md` as they are.
2. Ask only what is missing: the four questions whose answers are not already Rails, the
   models, the commands.
3. Add what is missing from the templates: `config` (carry over `BUILD_CMD` from
   `autopilot.config`), `REVIEW.md` (carry over a project checklist if one exists),
   `DEFERRED.md`, `SUPERVISOR-LOG.md`, the `.gitignore` line. Move `STATUS` and
   `autopilot-logs/` content into `logs/` or leave them; nothing reads them any more.
4. Rules the project wrote for the old skills: keep only the lines that differ from this
   skill's rules, in `ENGINE.md`. Propose the cut; the human confirms.
5. Remove `Shape:` lines from PLAN.md; dot-plan runs one item at a time.
6. Never remove the project's hard stops. Say which exist.
7. Commit: `plan: adopt dot-plan`.
