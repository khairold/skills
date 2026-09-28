---
name: codebase-audit
description: Audit a whole codebase before a refactor, or sweep it for one bug class that keeps coming back. The full audit fans out one read-only agent per lens (boundaries, state, write paths and sensitive data, module shape, tests, agent guidance, resilience, data model, types and contracts), then folds the reports into axes of work in dependency order, stops for the human's decisions and hands the result to a build plan. The drift mode turns a recurring bug into the invariant it breaks, sweeps every place that could break it in parallel, and reports confirmed bugs, latent risks and the rules worth writing down. --check reports without writing files. Use when the user says /codebase-audit, or asks to "audit the codebase", "what should we refactor", "is this ready for a big refactor", "find the weak spots before prod", "this bug keeps coming back", "find every place that does X wrong" or "systemic drift".
---

# codebase-audit

Find out what is true about a codebase before changing it at scale, with evidence an agent or a
teammate can check, and turn that into work in an order that is safe to build.

- **Evidence is `file:line`.** A finding points at the code that shows it. What was read but not
  reproduced says so; what was not looked at is named, so silence is not taken for "clean".
- **Read-only until the human decides.** The audit writes its reports and nothing else. Fixes,
  plans and guide edits come after the human has read the findings and made the open decisions.
- **Many lenses, one picture.** Each lens is read by its own agent in a fresh context. The value
  is in the synthesis: a problem three lenses flag independently is a real one.
- **Invariants over symptoms.** "The header showed the wrong language" is a bug; "every date
  format passes the locale" is a rule you can search for. Search for the rule.
- **Judgement over checklists.** The lenses in `references/lenses.md` are questions worth asking,
  not a form to fill in. Pick the ones that fit this codebase, add the one it needs, skip the rest.

`$SKILL` below means the folder that holds this file.

## Modes

| Invocation | Does | Writes | Human |
|---|---|---|---|
| `/codebase-audit` | full audit: survey, lenses in parallel, axes, decisions | one report per lens + `AXES.md` | confirms the lens set; makes the open decisions |
| `/codebase-audit "<bug class>"` | drift sweep for one recurring bug class | one drift report; fixes and rules after confirmation | confirms the axes; confirms the fixes |
| `--check` (with either) | the same reading | nothing; the synthesis in chat | reads it |

## The full audit

Read `$SKILL/references/survey.md` before step 1, `$SKILL/references/lenses.md` before step 3,
`$SKILL/references/axes.md` before step 4, and `$SKILL/references/safety-net.md` when writing
the first axis. Read only what the step needs.

1. **Survey.** Map the parts, the data store, the entry points (routes, jobs, commands, queues),
   the tests and how they run, the guidance files, the recent history. Note the commit you are
   auditing.
2. **Propose the lens set, then wait.** One screen: the lenses to run and why, the ones skipped
   and why, any lens this codebase needs that the default set lacks, where the reports go
   (`docs/audit/` unless the project has a place), and what the human already knows is wrong.
   Ask everything open here, together.
3. **Run the lenses in parallel.** One read-only agent per lens, all launched in one message,
   each given the survey, its lens from `lenses.md` and `$SKILL/templates/audit.md`. Each writes
   its report. While they run, read what no lens owns (the spec, the decision log).
4. **Fold into axes.** Read every report, then write `AXES.md` from `$SKILL/templates/AXES.md`:
   what several lenses flagged, the bugs found in finished work, the axes with what "done" looks
   like, their size and what each depends on, a suggested order, and every open decision from
   the reports in one list.
5. **Stop for decisions.** Put the open decisions to the human, grouped, each with a
   recommendation. Record the answers in `AXES.md` under "Decided", with the date.
6. **Hand off.** The reports and `AXES.md` are the spec for a build plan: suggest
   `/dot-plan init` with them (or the project's own planning), with the safety net as the first
   phase and the High bugs, each proven by a test that fails first, as the second. Commit the
   reports only if the user asks or the project's conventions say so. Never push.

## The drift sweep

For a bug class that has already shipped more than once: same shape, different file. Read
`$SKILL/references/drift.md` first; it carries the whole method.

1. Confirm the recurrence in the history, and restate the bug as the invariant it breaks.
2. Widen before narrowing: a long list of candidate axes, then the 5–8 worth sweeping. Show the
   human both lists; the axis they rescue is often the one that matters.
3. One read-only agent per axis, in parallel, each returning confirmed bugs, latent risks, a
   count of the pattern and the conventions worth keeping.
4. Synthesize, confirm scope with the human, fix the small ones, and write each invariant into
   the guide of the folder it governs (`/agent-guides <path>` if the project uses it). Work that
   spans many files becomes a plan, not a drive-by.

## Working well

- **Size the fan-out to the codebase.** A small service may need four lenses; a large monolith
  all nine and a tenth of its own. Above ten, the synthesis suffers.
- **Give each agent what it cannot rediscover cheaply:** the survey, the commit, the decisions
  already made, and the shape its report must take. Tell it not to edit files.
- **The strongest model for the lenses and the synthesis.** This is judgement work; a shallow
  search agent returns inventories, not findings.
- **Keep the human's words.** What the human already believes is wrong goes to the relevant
  lens as a lead to check, not as a finding.
- **Leave what is not yours.** Files already changed when the run started are not staged,
  edited or discarded.
