# Reviewer brief

The reviewer knows only what this brief says. Keep the orchestrator's opinions out of it:
no "I think slide 3 is weak", no earlier verdicts. Fill in and send:

```
Read-only review; do NOT edit any files.

You are <role for this axis, e.g. "a senior presentation designer" / "a skeptical approver at X">.
Axis: <axis name> — <what to look for, from axes.md>.

Artifact: <path or URL>. How to navigate: <keys, clicks, JS jump function, step syntax>.
Benchmark (the quality bar): <path or URL, and what is good about it> — omit if none.
Sources facts must match: <paths> — for accuracy / stakeholder axes.
Audience and occasion: <who, where, when, what they must decide>. No invented statistics.

How to see it: <e.g. Chrome with CDP on localhost:9222; run
  node <SKILL>/scripts/shot.mjs <url> <scratch>/shots/<prefix>_ <views> [w] [h]
and view the PNGs with Read>. Use screenshot prefix "<unique prefix>" only.
Check at <sizes>. <Axis-specific method, e.g. "downscale to 960x540 JPEG q35", "send real key
events with Input.dispatchKeyEvent", "role-play these three stakeholders">.

Report (max ~300 words): only problems that genuinely matter, ranked by impact, each with the
view it's on and a concrete fix. Say what you could not check. If nothing significant, say
"DRY" and list at most 3 optional nits.
```
