# skills

Claude Code skills by Khairold Safri.

| Skill | What it does |
|---|---|
| [dot-plan](skills/dot-plan/SKILL.md) | Build software with AI agents from a phased plan kept in `.plan/`, mostly unattended. One skill, five modes: `init`, `run`, `gate`, `audit`, `close`. |
| [agent-guides](skills/agent-guides/SKILL.md) | Make a codebase legible to an agent that arrives cold: a short guide beside each part of the code, a root guide cut to pointers, one place per fact, kept true by a generator and tests in your own suite. |
| [codebase-audit](skills/codebase-audit/SKILL.md) | Audit a codebase before a refactor with one agent per lens, fold the reports into axes of work in a safe order, and hand them to a build plan; or sweep the codebase for one bug class that keeps coming back. |

## Install

### Claude Code plugin marketplace

In Claude Code:

```
/plugin marketplace add khairold/skills
/plugin install khairold@khairold
```

Then invoke a skill with the plugin name in front, for example `/khairold:dot-plan init`.
Updates arrive when the marketplace refreshes, or with `/plugin marketplace update khairold`.

### npx

```
npx skills add khairold/skills
```

This copies the skill folders into your skills directory. Invoke them without a prefix, for
example `/dot-plan init`. Re-run the command to update.

## dot-plan in one minute

1. `/dot-plan init` reads your spec, asks four questions once, and writes `.plan/`: phases,
   items, rails, a review checklist and a small `config` naming your build commands.
2. `/dot-plan run` builds the plan unattended: one fresh agent per item, the gate before every
   commit, a reviewer on another model for risky changes, a heartbeat, and no questions asked.
   What needs you goes on a list for later. `--attended` if you want to sit with it.
3. Between phases it runs the gate by itself: full checks, exit criteria, a batch review and
   the numbers (items per hour, process share, reviewer catches, escaped defects).
4. `/dot-plan audit` when you want a look at the process from above.
5. `/dot-plan close` writes the report, moves what is worth keeping into your docs, and
   deletes `.plan/`.

It needs `bash`, `git` and `awk`. Work lands on main locally by default, or on one branch per
plan with a pull request at the end (`lands = branch` in `.plan/config`). It never pushes to
main.

## agent-guides in one minute

1. `/agent-guides` surveys the whole codebase: its parts, every guidance file and what it
   claims, stale or duplicated facts, build history left in code comments, and how many tokens
   a cold agent reads before a safe change.
2. It proposes one screen of changes and waits for you to confirm.
3. It writes a short guide beside each part of the code and cuts the root guide to at most 80
   lines of pointers, the loop and your hard rules.
4. It adds a generator script to your repo for the facts the code already knows, and tests to
   your own suite that fail when a guide goes stale.
5. `/agent-guides <path>` refreshes one folder's guide; `/agent-guides --check` only reports.

## codebase-audit in one minute

1. `/codebase-audit` surveys the codebase (parts, data, entry points, tests, guidance, recent
   history) and proposes which lenses to run. You confirm or change the set.
2. One read-only agent per lens runs in parallel: boundaries, state, write paths and sensitive
   data, module shape, tests, agent guidance, resilience, data model, types and contracts, or
   a lens of your codebase's own. Each writes a report with `file:line` evidence.
3. It folds the reports into `AXES.md`: what several lenses flagged, the bugs found in finished
   work, the axes of work with what "done" looks like and what each depends on, and a suggested
   order that starts with a safety net of snapshot tests.
4. It puts the open decisions to you, records your answers, and hands the result to
   `/dot-plan init` as the spec.
5. `/codebase-audit "<bug class>"` sweeps for one recurring bug instead: the invariant it
   breaks, parallel sweeps, confirmed bugs and latent risks, small fixes, and the rule written
   into the guide of the folder it governs. `--check` reports without writing files.
