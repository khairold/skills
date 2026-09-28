# lenses: step 3

Nine default lenses. Each is a set of questions; the report answers them with `file:line`
evidence, rates each finding High / Medium / Low for the audit's purpose, sketches a target
design (two or three options when there is a real choice), and ends with open questions for the
human. Give the lens agent the survey, the commit, its section below and `templates/audit.md`.

Severity, roughly: **High** = wrong outcome, lost or leaked data, or stuck work today; **Medium**
= breaks under a common edit or a likely failure; **Low** = friction for the next change.

A finding is a claim about the code. Mark what was reproduced (a test run, a query, a script in
a scratch folder) and what was only read.

## 01 · Boundaries and the import graph

- What are the parts, and what does each import from the others? Draw the graph at part level.
- Are there cycles, at part level and module level? Which imports close each cycle?
- Which edges are hidden: imports inside functions, string references, signals, plugin
  registries, reflection? They are real dependencies the graph does not show.
- For each cross-part import, why does it exist? Orchestration that has no home is the usual
  cause: "after X, do Y and Z" wired by hand in several places.
- Is there a test or tool that holds the boundaries today? What does it allow that it shouldn't?
- Target: untangle in place, re-cut the parts around the concepts people search for, or one part
  with layered packages. What does each cost (moves, renames, migrations)?

## 02 · State and lifecycle

- Which entities have a state (a status column, a stage, a flag set that acts as one)?
- List every write of that state: `file:line`, the guard (which states it accepts), the new
  state, and whether it locks the row or works on a stale copy.
- List every read that compares, filters or ranks states.
- Draw the transition graph the code actually allows. Compare it with the one the docs or the
  people describe. Where do they differ?
- Which states can nothing leave (intended terminals, and accidental dead ends)? Which can work
  get stuck in, with no retry or sweep?
- What runs at the same time on the same entity (a user action, a job, an inbound message)? Where
  can two of them interleave?
- Is there a history of state changes, and can it be reconciled with the current state?
- Target: one table of allowed moves, one function that makes them (lock, guard, record), and
  whether the database should refuse illegal moves too.

## 03 · Write paths, audit trail and sensitive data

- For each important table, who writes it (every call site), with which actor recorded, and
  whether it is append-only in practice or by rights.
- Where are the audit or event logs? Are they complete, ordered, tamper-evident, and written in
  the same transaction as the change they describe?
- Map sensitive data: where it is stored, encrypted or not, and every place it is read or
  decrypted. Is each read recorded with who and why?
- Leak surfaces: logs, error pages and reports, outgoing messages, filenames, caches, analytics,
  test snapshots.
- Deletion and erasure: when a record must be forgotten, what survives (indexes, copies, derived
  fields, backups, search)?
- Transactions: multi-table writes outside a transaction; "commit, then do the next step" seams
  where a crash in between loses the step; side effects (mail, storage, calls) inside a
  transaction that may roll back.
- Database rights: what the application role may do that the code never needs.

## 04 · Module shape

- Where does logic live that belongs elsewhere: in views, commands, templates, serializers,
  migrations?
- Co-change: which files change together in the history (`git log --name-only`)? A cluster that
  always moves together and sits in several parts is one concept split apart.
- Co-read: to answer one everyday question ("what happens when X arrives?"), which files must be
  opened? Long lists point at a missing module.
- Duplication: the same shape written twice in different files, drifting apart.
- Dead or unreachable code; functions long enough that a change inside them is hard to review.
- Magic strings and numbers that stand for a closed set, repeated rather than named.
- Names an agent or a newcomer will trip on: one concept with two names, two concepts with one.
- Which modules are already deep (a small interface over real work)? Name them as the pattern
  to copy.
- The question is whether each module hides enough behind its interface, not how many files
  there are.

## 05 · Tests and the safety net

- Map the tests: each file, what it covers, what kind (unit, integration, end to end, snapshot).
- Coverage, with branches, per part. What important code has none?
- Speed: the full run, the slowest tests, what makes them slow (real OCR, real network, database
  setup per test).
- Fragility: shared test databases, order dependence, clocks, randomness, generated inputs that
  differ each run, tests that import other tests.
- Which architecture or contract tests exist, and which break on a pure refactor that changes no
  behaviour?
- The characterisation gap: which observable outcomes are pinned only by point assertions, so a
  refactor could change them unseen? This feeds `safety-net.md`.
- Does every rule, job and command have a test that exercises it?

## 06 · Agent guidance

If the `agent-guides` skill is installed, run `/agent-guides --check` for this lens and use its
report. Otherwise:

- Inventory every file an agent reads or is told to read, and what each does for it.
- Spot-check the claims against the code: every path, command and "only X does Y". List every
  stale one.
- Duplicated facts, and which copy is right.
- Is guidance central or next to the code it governs? How many tokens does a cold agent read
  before a safe change?
- Build history in code comments (plan items, "step 4", "was X before").
- For unattended runs: what can an agent break that nothing would notice?

## 07 · Resilience and operability

- For each outside dependency: what happens when it is down, slow, or returns garbage? Does the
  caller time out, retry with back-off, give up, and tell someone?
- Loops over work items: does one bad item stop the rest? Is a failure recorded where a person
  will see it?
- Idempotency: what happens when a job runs twice, a message arrives twice, a user clicks twice?
- Retry forever: work retried every minute with no limit, filling logs or tables.
- Config: missing or wrong settings found at start-up, or at first use in production?
- Observability: can someone tell what happened to one item, from logs or events, without
  reading its sensitive data?
- Data lifecycle: what grows without bound?
- Security surfaces: what an unauthenticated caller can learn or reach.
- End with the risks ranked for go-live.

## 08 · Data model and migrations

- Entity map: tables, keys, relations, which part owns each.
- Table by table: purpose, who writes, who reads, rights, indexes worth having.
- Smells: facts stored twice; a copied foreign key that can drift from its source; JSON columns
  with an implied schema nobody checks; string columns holding a closed set with no database
  check; "latest" found by highest id; unused extensions or columns.
- Constraints the code relies on that the database does not hold.
- Migration history: its length, squashes, data migrations, whether a fresh baseline is possible
  before the first production deploy, and what a baseline must keep exactly.
- Do foreign keys across parts match the import graph from lens 01?

## 09 · Types, contracts and errors

- Measure strictness: run the type checker at its strictest in a scratch config and count by
  part; run the linter with stricter rule families. Report the numbers; change nothing.
- What crosses module borders untyped: dicts, JSON, tuples, `Any`, stringly-typed kinds?
- Closed sets: which are enums, which are loose strings, where the same set is defined twice.
- Errors: broad catches, swallowed errors, errors that abort a whole loop, `None` returned as a
  failure signal, asserts used as runtime checks, the inventory of custom exceptions and whether
  they form a taxonomy.
- Import-time side effects and global state that make tests or workers order-dependent.
- Target: the conventions worth adopting, and a staged path that does not stop the build.
