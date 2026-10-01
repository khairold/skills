# reaudit: a round after a build

A re-audit runs the same lenses again on a codebase that a build has just changed, to find what
the build missed or broke. Round 1 is the first full audit; round N audits HEAD after the plan
that fixed round N-1. In a dot-plan build it is the "audit round" item, repeated until a round
finds nothing worth a fix: the plan is then dry.

## 1. The lens brief

Every lens gets the same brief, with its own lens, its previous report and its report path.
Write it once to a file and point each agent at it; the rounds stay comparable that way.

```
You are a read-only audit lens for <project>, round <N>. No human is present; never ask.
Repo: <path> at commit <HEAD>. Round <N-1> audited <sha>; a build then fixed its findings
(`git log --oneline <sha>..<HEAD>`; the record: <the plan's session log>, decisions <D-nn
range> in <the decision log>, the fold and its defaults in <AXES of round N-1>, open human-only
items in <the deferred list and the open-items doc>). <Items deliberately left for the human:
report their status, do not re-rate them.>
Read first: <$SKILL>/references/lenses.md (your lens), <$SKILL>/templates/audit.md, your
round-<N-1> report, the root guide and the folder guides you touch.
Your job: audit HEAD through your lens. For each round-<N-1> finding say fixed / partly fixed /
not fixed / made worse, with file:line evidence. Then look for new problems, above all ones the
build's fixes introduced or moved. Rate exactly as round <N-1> did; a finding with no real
consequence is not a finding. What only a person, the target OS or a real external service can
prove: say so and point at the open item; do not rate it High or Medium unless the code itself
is wrong.
Rules: read-only; the only file you write is your report. Scratch work only under <scratch
folder>, never in the repo or loose in /tmp. Do not run the test suite in this checkout; copy
the repo to your scratch folder first. Never read secrets.
Report header: "Repo: <path> at <HEAD> (read-only audit, <date>, round <N>)". End with one
line: "N findings: h High, m Medium, l Low".
Your final message: the report's path and that count line, nothing else.
```

Lens 10 (hostile input) is the one most worth keeping in every round: give it, by name, the
code the build changed on its surface, and ask it to time the worst shapes it can build within
the new limits and what happens after the parse returns.

Launch all lenses in one message, read-only, on the strongest model. The supervisor or main
session launches them; a lens never spawns agents.

## 2. The fold

One agent (or the main session) reads all reports and writes `AXES.md` for the round, in the
round's folder, beside the lens reports:

1. **Count honestly.** Two lenses on one defect are one finding. Re-check every High and Medium
   against the code before planning it, with a scratch script where the claim is about time or
   a crash; one that does not hold is said so and planned for nothing.
2. **Axes and "done looks like"** for each High and Medium, and for the Lows the defaults choose
   to build. Keep it small: nothing for its own sake.
3. **Decided (default …).** When no human is present, every choice a human would make gets the
   safest, most reversible default, numbered for the round (`C-D1`, `D-D1`, …), each with its
   cost and how to reverse it. In a dot-plan build each becomes a DEFERRED row. A default never
   overrides a decision the human already made; that item is skipped for the human instead.
4. **The next work:** the fix phase, its items each failing first, and the next round after it.
5. **The rest** of the Lows in one paragraph ("not planned, because"), so the next round
   re-checks them rather than rediscovering them.

## 3. Brakes, not caps

There is no limit on the number of rounds. Two patterns change what the fold plans:

- **The same surface draws a High or Medium in two rounds running** (the same parser, door or
  table): the next fix ends the class, not the shape. Bound the whole surface (a time or size
  limit on the whole step, one entry point every read goes through) instead of patching the
  newest case. Say plainly in `AXES.md` how many rounds the surface has drawn.
- **A fix that widened what it fixed** (a new parse of every part, a new read of every header):
  the next round's lens 10 is told by name to look there.

## 4. Dry

A round with no High and no Medium is dry. Before calling it, re-read every Low against the
Medium bar (a stranger can stop a queue, set an item aside, lose or corrupt evidence, or mislead
a reviewer); a Low that meets it is a Medium, and the round is not dry. A dry round's `AXES.md`
is short: what each lens confirmed fixed, the Lows grouped with why each is left, and the few
worth a later human look. No defaults, no new phase.

The lens reports of every round are never rewritten afterwards; corrections go in the next
round's fold.
