// Record XHR/fetch calls (request body + response body) from one tab.
// node capture.mjs --tab <url-substring> --api <url-regex> --out <dir> [--secs 120] [--reload]
//   --reload : reload the tab first (only on pages with no side effects!)
// Writes <out>/capture.log; one block per call.
import { appendFileSync, writeFileSync } from 'node:fs';
import { args, connect, sleep } from './cdp.mjs';

const a = args();
const api = new RegExp(a.api ?? '/api/');
const log = `${a.out}/capture.log`;
writeFileSync(log, '');
const c = await connect({ tab: a.tab, port: a.port });
const reqs = new Map();

c.on('Network.requestWillBeSent', p => {
  if (api.test(p.request.url)) reqs.set(p.requestId, { method: p.request.method, url: p.request.url, body: p.request.postData });
});
c.on('Network.responseReceived', p => { if (reqs.has(p.requestId)) reqs.get(p.requestId).status = p.response.status; });
c.on('Network.loadingFinished', async p => {
  const r = reqs.get(p.requestId);
  if (!r) return;
  const b = await c.send('Network.getResponseBody', { requestId: p.requestId });
  appendFileSync(log, `\n=== ${new Date().toISOString()} ${r.method} ${r.status} ${r.url}\nREQ: ${(r.body ?? '').slice(0, 2000)}\nRES: ${(b.result?.body ?? '').slice(0, 20000)}\n`);
});
c.on('Network.loadingFailed', p => {
  const r = reqs.get(p.requestId);
  if (r) appendFileSync(log, `\n=== FAILED ${r.method} ${r.url} ${p.errorText}\n`);
});

await c.send('Network.enable', { maxResourceBufferSize: 20e6, maxTotalBufferSize: 100e6 });
if (a.reload) await c.send('Page.reload', { ignoreCache: true });
console.log(`capturing ${a.secs ?? 120}s → ${log}`);
await sleep(Number(a.secs ?? 120) * 1000);
c.close();
process.exit(0);
