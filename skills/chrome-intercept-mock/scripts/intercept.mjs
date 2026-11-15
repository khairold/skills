// Rewrite matching responses in one tab before the page sees them. Browser-local only.
// node intercept.mjs --tab <url-substring> --pattern '<glob, e.g. */api/x/profile*>' \
//                    --patch <file.mjs> --out <dir> [--secs 900]
// <file.mjs> default-exports (json, url) => json   (mutate or return a new object).
// Logs each patched URL to <out>/intercept.log. Auto-stops after --secs.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { args, connect, sleep } from './cdp.mjs';

const a = args();
const patch = (await import(pathToFileURL(resolve(a.patch)).href)).default;
const log = `${a.out}/intercept.log`;
const c = await connect({ tab: a.tab, port: a.port });

c.on('Fetch.requestPaused', async p => {
  const { requestId, request, responseStatusCode, responseHeaders = [] } = p;
  try {
    const b = await c.send('Fetch.getResponseBody', { requestId });
    const raw = b.result.base64Encoded ? Buffer.from(b.result.body, 'base64').toString() : b.result.body;
    const json = JSON.parse(raw);
    const next = (await patch(json, request.url)) ?? json;
    // Body is re-encoded, so drop length/encoding headers or the browser rejects it.
    const headers = responseHeaders.filter(h => !/^(content-length|content-encoding)$/i.test(h.name));
    await c.send('Fetch.fulfillRequest', {
      requestId, responseCode: responseStatusCode, responseHeaders: headers,
      body: Buffer.from(JSON.stringify(next)).toString('base64')
    });
    appendFileSync(log, `patched ${new Date().toISOString()} ${request.url}\n`);
  } catch (e) {
    appendFileSync(log, `error ${e} — passed through unchanged\n`);
    await c.send('Fetch.continueRequest', { requestId });
  }
});

await c.send('Fetch.enable', { patterns: [{ urlPattern: a.pattern, requestStage: 'Response' }] });
console.log(`intercepting ${a.pattern} for ${a.secs ?? 900}s`);
await sleep(Number(a.secs ?? 900) * 1000);
await c.send('Fetch.disable');
c.close();
process.exit(0);
