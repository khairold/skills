// Screenshot views of a page through Chrome DevTools (Node 22+, no dependencies).
// Chrome must run with --remote-debugging-port (default 9222; override with CDP_PORT).
//
// usage: node shot.mjs <url> <out-prefix> <views> [width=1600] [height=900]
//   views: comma list. Each view is evaluated in the page before the shot:
//     - "N" or "N.S"  -> calls show(N-1, S) if the page defines show() (slide decks), else sets location.hash
//     - "js:<expr>"   -> evaluates <expr>
//   e.g.  node shot.mjs file:///path/deck.html shots/r1_ 1,2.2,5.6 1280 720
// Writes <out-prefix><view>.png and prints any page exceptions (a non-empty list means the page broke).
import fs from 'fs';
const [url, out, list, w = '1600', h = '900'] = process.argv.slice(2);
if (!url || !out || !list) { console.error('usage: node shot.mjs <url> <out-prefix> <views> [w] [h]'); process.exit(1); }
const port = process.env.CDP_PORT || 9222;
const pg = (await (await fetch(`http://localhost:${port}/json`)).json()).find(p => p.type === 'page');
if (!pg) { console.error('no page target on CDP port ' + port); process.exit(1); }
const ws = new WebSocket(pg.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const errs = [];
ws.onmessage = m => { const d = JSON.parse(m.data);
  if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
  if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const wait = ms => new Promise(r => setTimeout(r, ms));
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() }); await wait(2000);
for (const v of list.split(/,(?![^(]*\))/)) {
  let expr;
  if (v.startsWith('js:')) expr = v.slice(3);
  else { const [a, b] = v.split('.'); expr = `typeof show==='function'?show(${a - 1},${b || 0}):(location.hash='#${v}')`; }
  await send('Runtime.evaluate', { expression: expr }); await wait(900);
  const s = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${out}${v.replace(/[^\w.-]/g, '_')}.png`, Buffer.from(s.result.data, 'base64'));
}
console.log('errors:', JSON.stringify(errs));
ws.close();
