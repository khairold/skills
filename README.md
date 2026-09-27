# skills

Claude Code skills by Khairold Safri.

| Skill | What it does |
|---|---|
| [dot-plan](skills/dot-plan/SKILL.md) | Build software with AI agents from a phased plan kept in `.plan/`, mostly unattended. One skill, five modes: `init`, `run`, `gate`, `audit`, `close`. |

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
