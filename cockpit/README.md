# dot-plan-cockpit

Part of the `khairold` plugin: a Claude Code mod, a cockpit for a running [dot-plan](../skills/dot-plan/SKILL.md) build. You watch the
run from a second session, see what needs you, and send decisions back to the orchestrator.

Needs Claude Code 2.1.287 or newer (mods).

## What it shows

- **Band** above the prompt, in any session of a repo with `.plan/`: phase and progress, the item
  a worker is on and for how long, the last gate result, how many DEFERRED rows are open.
- **Pane** (`/cockpit`): phase bars, the current worker, the last gate, every open DEFERRED row,
  the overseer's notes, the run's Watch line and a feed of the supervisor log.
  The header estimates time left from the median gap between recent commits. The heartbeat
  turns yellow after 10 minutes and a worker after 45; long rows and notes fold to two lines
  behind **more**.
- A toast when a new DEFERRED row appears.

## What you can do

- **Accept default** on a DEFERRED row: tells the orchestrator you accept the default it chose.
  Rows of the same item are grouped; **Accept all defaults** sends one message for the group.
- **Discuss**: fills this session's prompt with the full row (or note) so Claude here can talk it
  through with you.
- **Overseer** (on once you open `/cockpit`, or `/overseer` to ask now): a model different from
  the workers reads the plan, the log and the open rows when something changes (a verdict, a
  DEFERRED row, a red gate; at most every 3 minutes) and posts up to three notes. **Send to run**
  forwards a note's suggestion; **Dismiss** hides it. Notes are also kept in `.plan/logs/overseer.md`, its call and token totals in
  `.plan/logs/overseer-usage.json`.
- **Copy or send**: the header toggle chooses whether the buttons copy the prompt to the
  clipboard or send it straight to the run session. Every message says it came from the human and
  that the orchestrator decides when to act on it.
- `/cockpit-ping <session id prefix>`: send a test message to a session of this project.

## Where it runs

- The session named in `.plan/logs/run.lock` (the run itself) shows the band only.
- Any other session in the repo shows the band; the pane and the overseer start only after
  `/cockpit` there. Nothing calls a model until you ask.
- It reads `.plan/` and writes only `.plan/logs/overseer.md` and `.plan/logs/overseer-usage.json`,
  which the run never reads.

## Settings

| Field | Default | What |
|---|---|---|
| `overseerModel` (`khairold.overseerModel`) | `fable` | The overseer's model: an alias or id, best one the workers do not use. |

Commands a mod registers are not prefixed: `/cockpit`, `/overseer`, `/cockpit-ping`. The
setting is `khairold.overseerModel` in the config menu.

## Develop

From the repo root:

```
claude --plugin-dir .                      # reloads on save
claude plugin validate .claude-plugin/plugin.json
claude plugin test .
```
