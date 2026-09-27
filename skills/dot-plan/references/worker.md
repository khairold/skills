# The worker's contract

You do one item, or the few listed, from a fresh context, then you are gone. No human is
present. Never ask a question. The same contract applies when you are the fix agent, except
step 6: a fix agent adds a line to the item's SESSION-LOG entry and does not touch the tick.

1. **Read only what you were given:** your items, `.plan/MEMORY.md` (Rails and gotchas),
   `.plan/ENGINE.md` if it exists, and the sections the item names. Not the whole plan. Read
   the code, not only the audit; line numbers drift. Leave every not-ours file alone.
2. **Behaviour change: failing test first.** Write the test, watch it fail, then make it pass.
   An item that adds no behaviour skips this.
3. **Stage what you touched,** by name: `git add -- <paths>`. Never `git add -A` or `git add .`.
   Never commit, push, checkout, stash, reset, rebase or restore. Someone else's uncommitted
   work may be in the tree, and it is not yours to include or undo.
4. **Quick checks while working** (the `quick` command in `.plan/config`). **The gate once at
   the end, after staging:** `<$SKILL>/scripts/gate.sh build --label <item>`, with
   `run_in_background` if it may take more than a few minutes. It hashes the staged code, so an
   edit after the gate means stage again and gate again. If you run it in the background, wait
   for it to finish; never return before you have the result. A DIRTY result means code you
   changed is not staged: stage it or undo it, then gate again.
   Red: up to two fix tries within your item. Still red: stop, and say so in your summary.
5. **A correction is fixed twice.** Fix the work, then put the lesson where it is cheapest and
   highest: code that makes it impossible, then a test shown failing once, then a line in
   `.plan/REVIEW.md`, then a written line in `MEMORY.md` or the project docs. In the same
   change. Drop what will not recur.
6. **Write it once,** and stage these too:
   - SESSION-LOG.md: your entry, in full. What was made, what was decided, what changed from
     the item.
   - PLAN.md: the tick, `- [x] 5.3 — <item> — <one short line on what was done>`. No commit id;
     the commit names the item.
   - MEMORY.md: one gotcha at most, a line or two, only if a later worker would trip on it.
   - DRIFT.md: a row if you did more or less than the item said.
7. **Never ask.** Cannot decide: take the safest, most reversible option, add a DEFERRED row
   (what, the default chosen, how to reverse it), continue. Needs a human: mark the item `[~]`,
   add a DEFERRED row, stop. A `(human-verify)` item: build it, write the steps a person
   follows into SESSION-LOG, leave that check unticked.
8. **Never** touch real data, production or customer channels; delete ignored files, secrets
   or untracked files you did not create; edit Claude Code settings or `.git`; lower a floor or
   exit criterion without a reason; rewrite the spec or audits; push; use `--no-verify`. Obey
   the project's never-list lines in ENGINE.md.

Your final message is exactly this block and nothing else:

```
STATUS: complete | partial | blocked
ITEMS: 5.3 | 5.3, 5.4 | none
FILES: <paths staged, one line>
GATE: PASS <hash> | FAIL <hash> | not-run
BLOCKER: <one sentence> | none
NOTES: <a few short bullets the supervisor needs>
```
