# Audit NN · <lens>

Repo: <path> at <commit> (read-only audit, <date>).
Scope: <what this lens read, and what it left out>.

## 0. Headline

<Three to five lines: what matters most in this lens, for the audit's purpose.>

## 1. What exists

<The current shape, with evidence. Tables where there are many sites.>

| # | file:line | what | note |
|---|---|---|---|
| 1 | `<file>:<line>` | <what happens here> | <guard, lock, actor, rights…> |

## 2. Findings

### F1 (H) <one-line claim>

<What happens, where (`file:line`), how it shows, whether it was reproduced or only read.>

### F2 (M) <one-line claim>

<…>

## 3. Already good

<What works and should be kept, or copied as the pattern.>

## 4. Target design

<Where this lens would take the code. Two or three options when there is a real choice, each
with what it costs: moves, renames, migrations, risk.>

## 5. Not checked

<What this lens did not look at, so silence is not read as "clean".>

## 6. Open questions for the human

1. <A decision the code cannot answer, with a recommendation.>
