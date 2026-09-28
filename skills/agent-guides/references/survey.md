# survey: steps 1 and 2

Read-only. Use Explore subagents for a large codebase (one per group of units), and keep only
their conclusions.

## 1. Units

List the parts of the code that have a boundary an agent can work inside:

- An app or package the build tool knows (Django app, Python package with its own tests, npm
  workspace, Go module or package with a public API, Rust crate, service folder).
- The test folder, the migrations or database folder, the scripts folder if it holds more than a
  few one-offs, infrastructure (`deploy/`, `ansible/`, `k8s/`) if agents change it.
- Not: a folder of three helpers, generated code, vendored code, fixtures, assets.

For each unit write down: its purpose in one line, what it imports and what imports it, its
tables/routes/commands/jobs, its tests, and whether it already has a guide. For a scoped run,
only the named folder's unit(s).

## 2. Guidance inventory

Every file an agent reads or is told to read: root and folder `CLAUDE.md` / `AGENTS.md`,
`.claude/rules/`, `.cursor/rules`, `README.md` files, `CONTRIBUTING.md`, `docs/` pages that
guidance points at, skills in `.claude/skills/`, the project's auto-memory folder
(`~/.claude/projects/<path with / as ->/memory/`).

For each claim in them, mark one of:

| Mark | Meaning | Goes |
|---|---|---|
| keep | true, needed in every session, in the right file | stays |
| move | true, but governs one folder | that folder's guide |
| point | true, but lives better in a doc that already exists | a one-line pointer |
| generate | true, and the code already knows it (a list of tables, commands, env vars) | the generator |
| dup | said in two places | the one place it belongs; the other points |
| stale | names a path, command, setting or behaviour that no longer exists | fixed or deleted |
| history | why it used to be, a plan step, a done migration | decision log or deleted |

Check each path and command a guide names against the repo. Check each "only X does Y" claim
with a search.

## 3. Build notes in code

Search comments and docstrings for history that belongs in commits and the decision log: plan
item numbers (`3A.2`, `phase 5`), build steps (`step 4`), ticket numbers, review names ("per the
Opus review"), "was", "used to", "before the refactor", "TODO from session N". Keep in comments:
decision ids (`D-42`, `ADR-7`), links to specs, standards and version numbers. Write down the
regex that finds the project's forms; step 4 turns it into the test.

## 4. The cold read

Tokens an agent reads before a safe change = the root guide + the files it auto-loads
(`.claude/rules/`, imports in the root guide) + one folder guide. Count with
`wc -c <files> | tail -1` and divide by 4. Report the largest unit, not the average.

## 5. The proposal (step 2)

One screen, then tables. Nothing written yet.

1. **Cold read:** now N tokens (largest unit X), expected M.
2. **Units and guides:** unit, has guide (y/n), guide path, one-line purpose.
3. **Root guide:** lines now → target; what stays; what moves and where.
4. **Claims:** the `move`, `dup`, `stale`, `history` rows with file:line and where each goes.
5. **Generator:** the facts it will produce per unit, where it reads them from, the script path
   (default: the project's scripts folder), and whether it extends an existing generator.
6. **Tests:** the checks from `checks.md`, the test file they go in, the suite that runs them.
7. **Build notes:** count, the regex, a few examples and their rewrites.
8. **Auto-memory:** lines to fix or delete.
9. **Questions:** everything ambiguous, together.

With `--check`, print this as the report and stop.
