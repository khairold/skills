---
name: agent-guides
description: Make a codebase legible to a coding agent that arrives cold. Writes a short guide next to each part of the code, cuts the root guide down to pointers, moves every fact to one place, strips build history out of code comments, adds a generator for the facts the code already knows and tests that keep the guides true. Covers the whole codebase by default; a path scopes it to one folder; --check only reports. Use when the user says /agent-guides, or asks to "write agent guides", "make the repo agent-friendly", "cut CLAUDE.md down", "per-folder CLAUDE.md", "onboard agents to this codebase" or "check the guides are still true".
---

# agent-guides

A cold agent, or a new teammate, should read **under 3k tokens** before making a safe change
anywhere in the codebase: the root guide plus the guide of the folder it works in. Every fact
lives in **one place**, and the tests fail when a guide stops being true.

- **The code is the first source.** A guide says what reading the code would not tell you
  quickly: the purpose, the public surface, the rules that must hold, which tests prove them,
  where the reasons are.
- **One fact, one place.** Each fact sits in the guide of the folder it governs, or in a list
  the code reads, or in a generated block. Everywhere else points at it.
- **What the code knows is generated.** Tables, routes, commands, jobs, env vars, who imports
  whom: a generator script in the repo writes them into each guide, and a test fails when the
  committed block is stale.
- **Present tense only.** Guides and code comments say what is true now. History (plan items,
  "step 4", ticket numbers, "was X before") goes to the decision log and commit messages.

`$SKILL` below means the folder that holds this file.

## Modes

| Invocation | Scope | Writes | Human |
|---|---|---|---|
| `/agent-guides` | the whole codebase (default) | guides, root guide, generator, tests, comments | confirms the proposal once |
| `/agent-guides <path>` | the guide(s) for that folder only | that guide and its generated block | confirms the proposal once |
| `/agent-guides --check` | the whole codebase | nothing; a report | reads the report |

A scoped run never rewrites the root guide or other folders' guides; if it finds a problem
there, it lists it at the end. `--check` stops after step 2 and prints the proposal as a report.

## The run

Read `$SKILL/references/survey.md` before step 1, `$SKILL/references/write.md` before step 3,
and `$SKILL/references/checks.md` before step 4. Read only what the step needs.

1. **Survey (read-only).** Map the codebase into units, list every guidance file and what it
   claims, find the facts that are duplicated, stale, misplaced or derivable from code, the build
   notes in comments, and stale lines in the project's auto-memory. Measure the cold read.
2. **Propose, then wait.** One screen: the units that get a guide, what moves out of the root
   guide and where, what the generator will produce, the tests to add, the comments to rewrite,
   the memory lines to prune, and the cold-read numbers now and expected. Ask every open
   question here, together. Wait for the human to confirm or change it. Nothing is written
   before this.
3. **Write the guides.** One per unit from `$SKILL/templates/guide.md`, then the root guide cut
   to what the project is, where to look, the loop and the hard rules (80 lines at most). Rewrite
   each build note in a comment to say what the code does now.
4. **Add the generator and the tests** to the repo, in the project's own language and test
   suite, following its conventions. Run the generator.
5. **Prune auto-memory.** In the project's memory folder, fix or delete the lines that name
   moved paths or restate what a guide now holds, as confirmed in step 2. Update its index.
6. **Verify.** Run the project's own checks (lint, types, the test suite) until green. Measure
   the cold read again. Report: guides written, facts moved, notes rewritten, tests added, the
   cold read before and after, and anything left for the human.
7. **Commit** only if the user asked or the project's conventions say so, in the project's
   commit style. Never push.

## Rules

1. **Nothing written before the proposal is confirmed.** The root guide is the human's; a
   rewrite they did not see is a bad default.
2. **Keep the project's hard stops.** Deny rules, hooks, "never" lines and safety rules in the
   root guide stay, word for word, unless the human says otherwise in step 2.
3. **A guide where the code has a boundary.** An app, a package, a service, `tests/`, a
   migrations or database folder. Not one per directory: a guide nobody needs is clutter too.
4. **Short.** A folder guide stays under ~1,000 tokens plus its generated block. If it grows
   past that, the folder is two units, or the guide is holding what the code already says.
5. **An invariant names its test.** "Only `trail` writes `audit_event`:
   `tests/test_borders.py::test_only_the_trail_writes`". A rule no test holds is marked
   "(not tested)" and listed in the report.
6. **Never hand-edit a generated block.** Change the generator and run it.
7. **Use the file the project's agents load.** `CLAUDE.md` for Claude Code (it loads a
   folder's `CLAUDE.md` when a file there is read); `AGENTS.md` if the project uses that; both
   only if the project already keeps both, with one pointing at the other.
8. **Don't move decisions into guides.** A guide points at the decision log (`D-nn`, an ADR);
   it never restates the reasoning.
9. **Leave what is not yours.** Files already changed when the run started are not staged,
   edited or discarded.
10. **Don't guess.** A claim you cannot check against the code is a question for step 2, not a
    line in a guide.
