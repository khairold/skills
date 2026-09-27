# Review checklist

> Only what a machine cannot check. A finding that comes back on a second review becomes a
> test, and its line here is deleted. This list shrinks over time.

- The record is honest: the summary, the tick and the commit message say what the diff does.
- The gate is not weakened: no check removed, skipped, loosened or made slower to avoid it.
- A test changed only with a reason in the commit; no assertion loosened to make it pass.
- A one-way file (coverage floor, version, golden file, rights) moved only the intended way,
  with a reason.
- Errors are handled where they happen; nothing fails silently.
- No secret, personal data or customer content in code, logs, tests or fixtures.

## Project lines

- <privacy, audit events, customer wording, anything this project must never get wrong>
