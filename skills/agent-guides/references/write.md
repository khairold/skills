# write: step 3

## Folder guides

Start each from `$SKILL/templates/guide.md`. Fill it from the code, not from the old docs:
read the unit's public names, its tests and its callers. A section with nothing true to say is
deleted, not left empty.

- **First paragraph:** what the unit is for, in plain words, in two lines at most.
- **Public surface:** the names other units use, grouped by file, with one clause each. Not every
  function: only what a caller needs. Say which units may import it, and name the test that holds
  the rule if there is one.
- **Invariants:** the rules a change here must not break, each with the test that holds it. These
  are the lines that save a cold agent from a wrong change; spend the words here.
- **Tests to run for a change here:** by file or group of files, the exact test command. Then the
  project's full check.
- **Read more:** pointers to the decision log entries and the deeper docs. No restated reasons.
- **The generated block,** empty markers at the end; the generator fills it in step 4.

A fact that two units share goes in the unit that owns it; the other says "see `<path>`".

## Root guide

At most 80 lines. It loads into every session, so every line must earn that.

1. What the project is, in two to four lines: what it does, the stack, where the code is.
2. **Where to look:** the folder guides (say they exist and load by themselves), the map or
   generated inventory, the decision log, the deeper docs.
3. **The loop:** how a change is made here, as numbered steps with the real commands.
4. **Hard stops and conventions:** kept word for word from before (rule 2 of `SKILL.md`),
   commit style, branch rules.
5. **The few facts every session needs:** how to run things, the one command people get wrong.
   Five at most; the rest are folder facts.

Everything else moves to its folder's guide, a pointer, or the generator.

## Build notes

Rewrite each comment or docstring to say what the code does now, in the same voice as the code
around it. Where the history carries a reason worth keeping, the comment names the decision
(`D-42`) and the reason goes to the decision log if it is not there already. A comment that
only held history is deleted.

## Other docs

Fix `stale` claims where they are. Replace `dup` copies with a one-line pointer. Don't rewrite
docs outside the proposal.
