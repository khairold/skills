// One-shot page actions on a tab. Run steps in order:
// node page.mjs --tab <url-substring> [--goto <url>] [--wait 8000]
//               [--scroll-text "<exact text>"] [--click-text "<exact text>" [--after-text "<exact text>"]]
//               [--shot <file.png>]
// --click-text picks the first leaf element with that exact text (after --after-text if given)
// and clicks its centre with a real mouse event.
import { writeFileSync } from 'node:fs';
import { args, connect, sleep } from './cdp.mjs';

const a = args();
const c = await connect({ tab: a.tab, port: a.port });
const evalJs = async expression =>
  (await c.send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const findJs = (text, after) => `(() => {
  const all = [...document.querySelectorAll('body *')];
  const anchor = ${after ? `all.find(d => d.textContent.trim() === ${JSON.stringify(after)})` : 'null'};
  return all.find(d => d.children.length === 0 && d.textContent.trim() === ${JSON.stringify(text)}
    && (!anchor || (anchor.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING)));
})()`;

if (a.goto) { await c.send('Page.navigate', { url: a.goto }); await sleep(Number(a.wait ?? 8000)); }
if (a['scroll-text']) {
  const ok = await evalJs(`(() => { const el = ${findJs(a['scroll-text'])}; el?.scrollIntoView({ block: 'start' }); return !!el; })()`);
  console.log('scroll-text found:', ok);
  await sleep(800);
}
if (a['click-text']) {
  const box = await evalJs(`(() => { const el = ${findJs(a['click-text'], a['after-text'])}; if (!el) return null;
    const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!box) console.log('click-text not found');
  else for (const type of ['mousePressed', 'mouseReleased'])
    await c.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await sleep(1500);
}
if (a.shot) {
  const s = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(a.shot, Buffer.from(s.result.data, 'base64'));
  console.log('screenshot:', a.shot);
}
c.close();
process.exit(0);
