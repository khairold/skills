# <Project> audit: axes (synthesis of audits 01–NN, <date>)

Sources: <the report files>. Audited at <commit>. Findings are from reading code unless marked
reproduced.

## Convergence (flagged independently by 3+ audits)

| Theme | Audits |
|---|---|
| <the shape problem> | 01 03 07 |

## Bugs found in finished work

High:
1. <the bug> (<audit> F<n>, `<file>:<line>`).

Medium: <one line each>.

## The axes

| # | Axis | Done looks like | Size | Depends on |
|---|---|---|---|---|
| A0 | **Safety net** | <today's behaviour pinned; fast, isolated test runs> | M | – |
| A1 | **<axis>** | <observable end state> | L | A0 |

## Suggested order (for discussion)

1. **A0** first: nothing moves until behaviour is pinned.
2. **The High bugs**, each with a test that fails on today's code.
3. <…>

## Open decisions

Structure: <…>.
Behaviour: <…>.
Data and privacy: <…> (<which need legal or the DPO>).
Process: <…>.

## Decided (<date>, <who>)

- <decision, in the human's words where they gave a reason>.
