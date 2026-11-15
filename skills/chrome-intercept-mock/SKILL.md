---
name: chrome-intercept-mock
description: Prove whether a UI bug is frontend or backend by driving a real logged-in Chrome tab over the DevTools Protocol — capture the live API calls a page makes, then rewrite a chosen API response in the browser (mocked payload) and screenshot how the real UI renders it. Use when the user asks to "intercept", "mock the response", "fake the payload", "see what the page would show if the API returned X", "check the network calls on this page", or when a bug can't be reproduced because no test account has the needed data. Works on production or any environment; nothing is sent to the server.
---

# Chrome intercept & mock

Answer one question fast: **"If the API returned X, would the UI behave correctly?"**
If the mocked payload renders fine, the frontend is cleared and the bug is in the data
(backend or upstream). If it still breaks, the bug is in the frontend.

`$SKILL` below means the folder that holds this file. Scripts live in `$SKILL/scripts/`
(Node 22+, no deps):
`cdp.mjs` (client), `capture.mjs` (record calls), `intercept.mjs` (rewrite responses),
`page.mjs` (navigate / scroll / click / screenshot). Write outputs and patch files to the
session scratchpad, never the repo.

## 1. Get a debuggable Chrome

1. Launch a **separate** Chrome profile with a debug port (Chrome refuses remote debugging
   on the default profile):
   ```
   open -na "Google Chrome" --args --remote-debugging-port=9222 \
     --user-data-dir="$HOME/.chrome-debug" "<page url>"
   ```
2. Ask the user to **log in themselves** in that window. Never type their credentials.
3. Verify: `curl -s "http://[::1]:9222/json/list"` — the target tab must be listed.

Gotchas:
- localhost calls from Bash need `dangerouslyDisableSandbox: true`.
- If the user's normal Chrome has remote debugging on (chrome://inspect toggle), it holds
  `127.0.0.1:9222` and answers **404** on `/json/version`; the debug instance then binds
  IPv6 only. Use `[::1]` (the scripts default to it) or launch on another port and pass `--port`.
- Argent's Chromium tools probe `127.0.0.1` and will hit the wrong Chrome in that case.
  Fall back to these raw-CDP scripts rather than fighting it.

## 2. Capture the real calls first

Before mocking anything, record what the page actually sends and receives:
```
node $SKILL/scripts/capture.mjs --tab <host> --api '/api/' --out <scratch> --secs 120 [--reload]
```
- Run it with `run_in_background`, then ask the user to perform the action in the window
  (or pass `--reload` on a read-only page). Read `<scratch>/capture.log`.
- This alone often finds the bug: the exact endpoint, request body, status and error
  message the backend returned (vs. the generic message the UI showed).

## 3. Build the mock from the code, not from guesses

1. Take the **real captured response** as the base — only change the fields under test.
2. Get field names, enum values and formats from the backend response schema and the
   frontend type in the codebase (e.g. the `UsageType` enum, date format the UI parses).
3. Read the frontend condition that decides the UI state (the filter / `length > 0` /
   status check) so the mock is guaranteed to hit the branch being tested.
4. Make values realistic and obviously fake-friendly (round numbers, future dates).

Patch file (`<scratch>/patch.mjs`):
```js
export default (json, url) => {
  // mutate the real response — keep everything else intact
  json.Response.Items = [{ /* fields from the schema */ }];
  return json;
};
```

## 4. Intercept, then load the page

```
node $SKILL/scripts/intercept.mjs --tab <host> --pattern '*/api/<path>*' \
  --patch <scratch>/patch.mjs --out <scratch> --secs 900      # run_in_background
node $SKILL/scripts/page.mjs --tab <host> --goto '<page url>' --wait 12000 \
  --scroll-text '<section heading>' --shot <scratch>/mocked.png
```
- Interception is at the **Response** stage: the real request still hits the server; only
  what the page receives is rewritten. `<scratch>/intercept.log` confirms each hit — if it
  stays empty, the page never re-requested (client cache) or the glob doesn't match.
- Use `--goto` to the exact page URL, **not a reload**: the tab may have drifted to another
  route, and reloading a payment/checkout/submit page can re-fire that action.
- Click into tabs/accordions with `--click-text '<label>' --after-text '<heading>'`, then
  `--shot` again. Read every PNG to verify — don't report what you didn't see.

## 5. Report and clean up

- Lead with the verdict: "UI renders correctly with data → bug is upstream" (or not).
- Show the screenshot evidence and name the exact field/condition that controls it.
- State clearly that the data on screen is **fake and browser-local**, and when the
  interceptor stops (`--secs`). Offer to stop it early (TaskStop).
- Mention any side effect that might have fired (e.g. a page reload re-triggering a
  request) so the user can check it.
- Don't copy personal data from captured responses into docs, tickets or memory.
