# Memory

> Every worker reads this at the start of every item. Keep it short enough to read in seconds.
> Details live in SESSION-LOG.md, never here.

## Rails

Decisions made at init. A run never reopens them; a rail that turns out wrong gets a DEFERRED
row and the least invasive way round it.

1. **Goal:** <...>
2. **Must not change:** <...>
3. **Only a human can:** <...>
4. **Work lands:** <local | branch `<name>`>
5. **Thorough about the product, cheap about the process.**
6. **Where things are:** <glossary or code map path>

## Gotchas

The few things a later worker would trip on, a line or two each, with a pointer instead of an
explanation. A gotcha a test now names is deleted at the next gate.
