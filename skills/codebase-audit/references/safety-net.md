# safety net: the first axis

Before a refactor moves anything, record what the code does today, whole, so every later change
in behaviour shows up as a diff someone reads and explains. Point assertions check what their
author thought of; a snapshot of the whole outcome also catches what nobody thought of.

Write this axis into `AXES.md` from what lens 05 found. The build plan builds it.

## What to pin

Pick what a user, a customer or another system can observe. For each, one snapshot file,
committed:

- **Scenario outcomes.** For each end-to-end scenario (the happy path, each rejection, each
  timeout, each human decision and its undo): the sequence of states, deadlines set and cleared,
  the final result with its reasons, the events and audit records in order with their actors,
  the messages sent. Normalised JSON.
- **Outgoing messages.** Each kind of mail, notification or webhook: the headers that matter and
  the body.
- **Screens.** The server-rendered pages for each role on a few scenarios, as normalised HTML or
  text. No browser needed.
- **Per-input results.** What the checks and parsers produce for each sample input.
- **Prompts as sent.** The system and user prompt and the schema for each model call, so a
  wording change is a readable diff.
- **Rules as a table.** Every rule gets a case where it fires and a near miss where it does not,
  plus the edges of every band or threshold. Pure, fast, no database.
- **Invariants as lists.** Which roles reach which URLs; every job and command run once; which
  actions write audit records; which code paths read sensitive data.

## How the helper behaves

A small helper in the project's own test suite, used as `golden.check("<name>", data)`:

- **Normalise before comparing.** What differs run to run (ids, times, tokens, message ids,
  nonces, hashes, temporary paths) becomes a numbered placeholder, the same value the same
  number within one file, so "the reminder quotes the first message's token" survives.
- **A difference fails with a diff**, golden against now.
- **A missing file fails too.** Files are written only with an explicit flag
  (`--update-golden`), never on a normal run.
- **Stale files fail a full run:** the helper records each file a test checks, so a renamed
  scenario cannot leave its old snapshot behind.

## Before the snapshots are worth having

A safety net only helps if it is fast and honest enough to run after every change:

- **One test database per checkout,** so two agents or two terminals don't clobber each other;
  then parallel test runs.
- **Deterministic inputs.** Generated files byte-identical every run (strip creation dates and
  random ids), so caches work and snapshots don't flicker.
- **Shared fixtures in one place,** not imported from other test modules.
- **Random test order,** once fixtures are shared, to flush out order dependence.
- **A quick mode** an agent runs while working, and the full run before a commit.

## Done looks like

The whole snapshot suite passes twice on unchanged code, in random order. Every rule has a
case where it fires. Every job and command has a test. From here on, each snapshot change lands
in the commit that caused it, with a line saying why it changed.
