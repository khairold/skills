// Minimal Chrome DevTools Protocol client (Node 22+: global fetch + WebSocket).
// Usage: const c = await connect({ tab: 'example.com' }); await c.send('Page.reload');

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i] ?? true;
    else out._.push(argv[i]);
  }
  return out;
}

// host defaults to [::1] — a normal Chrome with chrome://inspect remote debugging can hold
// 127.0.0.1:9222 and answer 404, while the --remote-debugging-port instance binds IPv6.
export async function connect({ tab, host = '[::1]', port = 9222 } = {}) {
  const list = await (await fetch(`http://${host}:${port}/json/list`)).json();
  const page = list.find(t => t.type === 'page' && (!tab || t.url.includes(tab)));
  if (!page) throw new Error(`No page tab matching "${tab}". Tabs: ${list.map(t => t.url).join(', ')}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const handlers = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    for (const h of handlers.get(m.method) ?? []) h(m.params);
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  return {
    url: page.url,
    send: (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
    on: (method, fn) => handlers.set(method, [...(handlers.get(method) ?? []), fn]),
    close: () => ws.close()
  };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
