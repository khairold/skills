# axes: steps 4 to 6

Read every lens report in full before writing a line. The synthesis is the part only the main
session can do: the lens agents never saw each other's work.

## 1. Convergence

List the problems flagged independently by three or more lenses, with the lenses that flagged
each. These are the codebase's real shape problems; a single lens's finding may be an artefact
of where it looked. A typical set: one concept written from many places with no single writer;
closed sets as loose strings; orchestration wired by hand at each site; loops that stop at the
first bad item; sensitive reads with no record.

## 2. Bugs found in finished work

Separate from the structure work. List each High bug with its lens and `file:line`, then the
Medium ones in a line each. Note which were reproduced and which only read. These get fixed
early, each proven by a test that fails on today's code, because later phases may replace the
code they live in and the test is what carries the fix across.

## 3. The axes

An axis is one direction of work with a clear end: "one table of order states and one function
that moves them", not "improve the state machine". For each:

| Column | What goes in it |
|---|---|
| Axis | a short name |
| Done looks like | the observable end state, concrete enough to check |
| Size | S / M / L, relative to each other |
| Depends on | the axes that must land first |

Draw the dependencies from the findings, not from habit. Common ones: a safety net before any
move; one writer and named vocabularies before the lifecycle and encryption work that build on
them; schema changes after the shape settles; production adapters after the failure handling
they rely on; agent guidance alongside, finalised last.

## 4. Suggested order

Number the phases and say in a line why each comes where it does. Usually:

1. **The safety net** (`safety-net.md`): pin today's behaviour so every later change is seen.
   If agents will run the build unattended, what keeps them from wrecking data belongs here too.
2. **The High bugs**, each with a test that fails first.
3. Then the axes in dependency order, the ones that unblock the most first.

Mark it "for discussion": the human owns the order.

## 5. Open decisions

Collect every open question from every report into one list, deduplicated, grouped:
structure, behaviour, data and privacy (note which need legal or a data-protection officer),
process. For each, give a recommendation and what it would change.

## 6. Decisions and hand-off

Put the decisions to the human, a few at a time, recommendation first. Record each answer in
`AXES.md` under "Decided", dated, in the human's words where they gave reasons. A decision that
reverses a report's recommendation stays in the report as written: the report is evidence, and
`AXES.md` is where the decision lives.

Then hand off. The reports plus `AXES.md` are the spec: `/dot-plan init` (or the project's own
planning) turns the axes into phases, reading the audit sections named in each item before it
touches code. The audit files are not rewritten afterwards; where the build departs from them,
the plan records why.
