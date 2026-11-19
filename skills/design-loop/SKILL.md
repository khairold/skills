---
name: design-loop
description: Improve any visual output (an HTML deck, web page, app screen, artifact, dashboard) in rounds until it is dry. Each round the orchestrator picks 1–3 review axes (bugs and layout, design craft against a benchmark, critical stakeholder, presenter run-through, screen-share legibility, accuracy against sources, accessibility, and more), launches one contextless read-only reviewer per axis in parallel, then decides finding by finding what to accept or reject, applies the fixes, verifies them with its own screenshots, and starts the next round. A round where every axis comes back with nothing significant is dry; the orchestrator then picks new axes or stops. Use when the user says /design-loop, or asks to "do a design pass", "loop until dry", "review the slides with a fresh reviewer", "polish this deck/page", "benchmark it against X" or "make it presentation-ready".
---

# design-loop

Make something people will look at better, in rounds, with reviewers who have not seen how it
was made and an orchestrator who decides what to do with what they say.

- **Contextless reviewers.** Each reviewer starts fresh: the artifact, how to see it, the
  audience, its axis. Not the orchestrator's reasoning or earlier verdicts. That is the point:
  it sees what the maker stopped seeing.
- **The orchestrator decides.** A finding is evidence, not an order. Accept it, reject it with a
  one-line reason, or check it first. Never act on a claim your own screenshot contradicts.
- **Axes, not checklists.** Each round looks through 1–3 axes picked for where the work is
  weakest now. When an axis comes back dry, move to another; don't re-run it for comfort.
- **Seeing is required.** Every claim about layout is checked on a real render, at more than one
  size. Words in the source are not the page.
- **No invented facts.** Reviewers often ask for a number to make a slide land. If it isn't in
  a source, it doesn't go in. Say "measured in the pilot" instead.

`$SKILL` below means the folder that holds this file.

## Setup (once)

1. **Pin down the inputs.** The artifact (file or URL), the audience and the occasion, a
   benchmark if there is one (the user's own best example beats any rule), the sources facts
   must match, and the sizes it will be seen at. Ask only what you can't find.
2. **Get eyes on it.** For web output, start Chrome with a DevTools port and a throwaway profile:
   `open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=<scratch>/chrome`
   then use `$SKILL/scripts/shot.mjs` (usage in the file). For a mobile app, use the device
   tools available (e.g. argent). Take a contact sheet of the whole thing before round 1.
3. **Fix what is obviously broken yourself** before the first reviewer; don't spend a reviewer
   on what you can already see.

## A round

1. **Pick the axes.** Read `$SKILL/references/axes.md`. Choose 1–3 for where the work is weakest
   now; tell the user which and why in one line. Early rounds: bugs and layout, then craft
   against the benchmark. Before a live showing: stakeholder, presenter, legibility.
2. **Launch the reviewers in one message,** one per axis, read-only, in the background, each with
   the brief from `$SKILL/references/brief.md`. Give each its own screenshot prefix. Don't do
   their work while they run.
3. **Decide.** For every finding: accept, reject (with a reason), or verify first. Check claims
   about sources against the source and claims about layout against your own render. Tell the
   user the calls in a few lines.
4. **Fix and verify.** Apply the accepted fixes in one batch. Re-shoot the affected views at every
   size; check the script prints no errors. Fix what your own check finds before the next round.
5. **Dry or next.** An axis whose reviewer reports nothing significant (after you re-read its
   nits against the bar) is dry. When every axis in the round is dry, either pick fresh axes or
   stop. Stop when the user's goal is met or two consecutive rounds on different axes are dry.

## Report

At the end: what changed (grouped by axis), what was rejected and why, what was left and why,
anything the reviewers couldn't check (and so isn't verified). Point at the file. Keep it short.

## Working well

- **One reviewer per axis, run in parallel.** Merging axes into one brief gives shallow reviews.
- **Size the loop to the stakes.** A meeting tomorrow: 2–4 rounds. A launch page: more.
- **Name the shortcut.** If a reviewer only read code instead of driving the UI, the report
  says so, and you either verify it yourself or say it's unverified.
- **Don't let a fix break a fix.** Small text edits inside script strings (quotes, apostrophes)
  are the classic way a round breaks the page; the screenshot script's error list catches it.
- **Keep artifacts out of the project.** Screenshots and helper scripts go in the scratchpad.
