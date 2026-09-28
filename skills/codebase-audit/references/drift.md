# drift: the bug-class sweep

For a bug class that has shipped at least twice, same shape in a different file, and is
suspected in places nobody has looked. The output is the bugs that exist today, the places that
will break under a common edit, and the invariants written where the next session will read
them.

## 0. Confirm the recurrence

Read `git log --oneline -50 -- <area>` and search the history for the shape. Name the earlier
fixes back to the human with their commits. If it has happened once, it is a bug, not drift:
fix it and stop.

## 1. From symptom to invariant

Restate each symptom as the rule it broke. The rule is the search target.

| Symptom | Invariant |
|---|---|
| The language toggle leaves stale strings on screen | Every component that reads a translation re-renders when the locale changes |
| Month names appear in the wrong language | Every date format with month or weekday names passes the locale |
| One user's data shows in the next user's session | Every client cache is cleared on sign-out or keyed by user |
| The screen lags after a save | Every write invalidates the queries that read what it changed |
| A job stops on one bad record | Every loop over work items contains each item's failure |

## 2. Widen, then narrow

**Widen first.** Write a list of at least ten candidate axes before choosing any. The first
axes that come to mind are the ones that feel complete, and the costly miss is usually on one
that did not. Sources:

1. Every "must", "never", "only" and "single source of truth" in the project's guidance. Each is
   a documented invariant; the ones no audit has swept are the richest.
2. Recurring words in fix commits over the last few months (cache, session, sign-out, locale,
   timezone, retry, 401, permission).
3. The load-bearing boundaries: auth wrappers, error envelopes, sign-out cleanup, persisted-state
   migrations, cache keys, audit writes, environment-flag defaults, single helpers for dates or
   roles, the one funnel for outgoing calls, subscriptions and timers that need teardown.
4. The critical miss: which security, data-loss or reliability regression in this area would
   hurt most? It goes on the list even if it feels handled.
5. For each candidate, when was it last swept? "Pretty sure it's clean" is not an answer.

**Then narrow** to 5–8. Each kept axis states its invariant in one sentence, its blast radius,
and when it was last swept. Fold sub-checks into their parent; defer what was swept recently;
drop what is cosmetic with no recurrence.

**Show both lists** to the human: the launch set with invariants, and the dropped candidates
with a line each on why. Ask what is missing. The one they rescue is often the one that matters.

## 3. Sweep in parallel

One read-only agent per axis, all launched in one message, on the strongest model. Each prompt
carries: the project's context and the earlier fixes, the invariant with one example of a
violation, where to look, and this report shape:

- **A. Confirmed bugs:** manifest today. `file:line`, the pattern, the fix.
- **B. Latent risks:** correct now, break under a common edit. `file:line` and the edit.
- **C. Inventory:** counts. N sites use the pattern, N follow the rule, N don't.
- **D. Conventions:** 2–5 lines worth writing down, each with a canonical `file:line`.

The fixed shape is what makes the synthesis possible.

## 4. Synthesize

Wait for every report. Then sort into confirmed bugs, latent risks, and refactors that would
stop the drift (one helper, one funnel). Merge the duplicates two axes found. List what several
agents confirmed correct as **validated good**, so the next sweep does not second-guess it.
Show the human the sorted list and agree what to fix now.

## 5. Fix and write down

- Fix the small, contained ones now, run the project's checks, keep them apart from any
  refactor. A fix of more than a few lines is worth a word with the human first.
- Write each invariant where the next session will read it: one to three sentences with a
  canonical `file:line`, in the guide of the folder it governs (`/agent-guides <path>` if the
  project uses it), or in the root guide when it spans the codebase. A longer explainer in the
  project's docs only when the rule alone is not enough.
- Record the validated-good list and the open refactors where the project tracks work.
- A refactor that spans many files is plan-shaped: name it, estimate it, and leave it for the
  human to start (`/dot-plan init`). Don't start it here.

## 6. Report

```
## Drift sweep: <class>, N axes, M confirmed bugs, K latent risks

### Fixed
- <name>, <file:line>, <what changed>

### Written down
- <guide path>: <the invariant>

### Validated good
- <pattern>

### Open (plan-shaped)
- <name>, <N sites>, <rough size>
```

With `--check`, stop after step 4 and print this with an empty "Fixed" section.
