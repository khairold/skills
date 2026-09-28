# survey: steps 1 and 2

Read-only. For a large codebase, use a few search agents (one per group of parts) and keep only
their conclusions; the lens agents in step 3 do the deep reading.

## 1. What to map

- **The commit.** `git rev-parse --short HEAD` and whether the tree is clean. Every report names
  it, so a finding can be checked against the code it came from.
- **Parts.** Apps, packages, services, workspaces: each one's purpose in a line, rough size, what
  it imports and what imports it.
- **Data.** The database and its schema source (models, migrations, SQL files), other stores
  (files, object storage, caches, queues), and anything sensitive: personal data, secrets,
  money, audit trails.
- **Entry points.** Routes, background jobs, scheduled tasks, commands, queue consumers, webhooks,
  inbound mail. These are where outside input and failure arrive.
- **Outside dependencies.** Every service the code calls: what it is, how it is reached, whether
  a stand-in exists for local runs.
- **Tests.** Where they live, how they run, how long they take, what they need (a database, a
  network, a model), whether any snapshot or characterisation tests exist.
- **Guidance.** Root and folder `CLAUDE.md` / `AGENTS.md`, `.claude/rules/`, contributing docs,
  the decision log, the spec. Note every "must", "never", "only" and "single source of truth":
  each is an invariant a lens can test.
- **History.** `git log --oneline -100` and `git log --since='3 months ago' --stat`: areas that
  keep changing together, fixes that repeat a shape, reverts. Hot spots and recurring fixes are
  leads for the lenses.

## 2. Choosing the lenses

Start from the nine in `lenses.md` and fit them to what the survey found:

- **Skip** a lens with nothing to read (no database → no data-model lens; no background work
  and one dependency → a short resilience lens folded into another).
- **Merge** lenses that would read the same files for a small codebase (state and data model
  are often one lens in a small service).
- **Add** a lens the codebase needs: a mobile client's offline sync, a pricing engine's rounding,
  a multi-tenant app's tenant isolation, a regulated domain's retention rules. Write its
  questions in the same shape as the others.
- **Point** the leads from the history and the human at the lens that owns them.

## 3. The proposal (step 2)

One screen, then stop.

1. **Commit and scope:** the commit, what is in, what is left out and why (vendored code,
   generated code, archives).
2. **Lens set:** each lens to run, one line on why, and the leads it gets.
3. **Skipped or merged:** each, one line on why.
4. **Added:** any lens of this codebase's own, with its questions.
5. **Where the reports go:** default `docs/audit/NN-<lens>.md` and `docs/audit/AXES.md`.
6. **Questions:** what the human already knows is wrong, what is out of bounds, what the audit
   is for (a refactor, go-live, a team joining, agent navigation). The purpose decides which
   findings count as High.

With `--check`, go on after confirmation but write no files: each lens returns its report to
the main session, and the synthesis is printed in chat.
