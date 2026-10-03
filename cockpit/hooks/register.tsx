import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { CockpitNote, CockpitSnap } from '../types'
import {
  acceptPrompt, ago, clockTime, compact, usageTotals, discussPrompt, envelope, matchSession, projectSlug, forwardPrompt, OVERSEER_SYSTEM, overseerMarker, overseerPrompt,
  parseDeferred, parseFeed, parseGateTail, parseLock, parseOverseer, parsePlan, phaseSection, section,
} from './parse'

const PANE = 'cockpit'
const TICK_MS = 20_000
const FEED_LINES = 8
const snap = atom({ plugin: 'khairold', key: 'snap' } as const, null)
const notes = atom({ plugin: 'khairold', key: 'notes' } as const, [])
const sentRows = atom({ plugin: 'khairold', key: 'sentRows' } as const, [])
const isActive = atom({ plugin: 'khairold', key: 'isActive' } as const, false)
const canSend = atom({ plugin: 'khairold', key: 'canSend' } as const, false)
const overseer = atom({ plugin: 'khairold', key: 'overseer' } as const, {
  status: 'idle', lastAt: 0, calls: 0, tokensIn: 0, tokensOut: 0,
})

// The overseer: a different model from the workers, woken by a verdict, a DEFERRED
// row or a red gate, never more often than MIN_GAP_MS.
const MIN_GAP_MS = 3 * 60_000
const LOG_TAIL_LINES = 60

const FILES = ['PLAN.md', 'DEFERRED.md', 'SUPERVISOR-LOG.md', 'gate.log', 'logs/run.lock']

// Module state: lost on reload, rebuilt by the first refresh.
let root = ''
let ownId = ''
let overseerModel = 'fable'
let cwdDir = ''
let sig = ''
let seen: string[] | null = null
let parsed: Omit<CockpitSnap, 'now'> | null = null
let raw = { plan: '', sup: '', gate: '' }
let marker = ''
let isThinking = false

async function refresh($: EngineInterface) {
  if (!root) return
  const stats = await Promise.all(
    FILES.map(f => $.fs.stat(`${root}/${f}`).then(s => s.mtimeMs).catch(() => 0)),
  )
  const nextSig = stats.join(',')
  if (nextSig !== sig || !parsed) {
    sig = nextSig
    parsed = await load($)
    const ids = parsed.deferred.map(d => d.id)
    const fresh = seen ? ids.filter(id => !seen!.includes(id)) : []
    seen = ids
    if (fresh.length) $.ui.toast(`dot-plan: new DEFERRED ${fresh.map(id => `#${id}`).join(', ')}`)
  }
  const now = await $.clock.now()
  await update($, snap, () => ({ ...parsed!, now }))
  await oversee($, false)
}

async function oversee($: EngineInterface, isForced: boolean) {
  if (!root || !parsed || isThinking || isRunSession() || !(await read($, isActive))) return
  const m = overseerMarker(raw.sup, parsed.deferred.map(d => d.id), parsed.gate?.result ?? 'PASS')
  if (!isForced && m === marker) return
  const now = await $.clock.now()
  const state = await read($, overseer)
  if (!isForced && now - state.lastAt < MIN_GAP_MS) return
  isThinking = true
  await update($, overseer, o => ({ ...o, status: 'thinking' }))
  try {
    const memory = await $.fs.read(`${root}/MEMORY.md`).then(t => String(t)).catch(() => '')
    const earlier = (await read($, notes)).slice(-6).map(n => `[${n.kind}] ${n.text}`)
    const prompt = overseerPrompt({
      rails: section(memory, 'Rails'),
      resume: section(raw.sup, 'Resume'),
      phase: phaseSection(raw.plan, parsed.current),
      deferred: parsed.deferred,
      gateTail: raw.gate.trim().split('\n').slice(-8).join('\n'),
      logTail: raw.sup.trim().split('\n').slice(-LOG_TAIL_LINES).join('\n'),
      earlier,
    })
    const r = await $.model.complete({
      model: overseerModel, system: OVERSEER_SYSTEM, prompt, maxTokens: 1024, timeoutMs: 120_000,
    })
    const at = await $.clock.now()
    const used = usageTotals(r.usage)
    const count = (o: typeof state) => ({
      calls: (o.calls ?? 0) + 1,
      tokensIn: (o.tokensIn ?? 0) + used.tokensIn,
      tokensOut: (o.tokensOut ?? 0) + used.tokensOut,
    })
    if (!r.isAnswered) {
      await update($, overseer, o => ({ ...o, ...count(o), status: `error: ${r.reason}`, lastAt: at }))
      return
    }
    marker = m
    const fresh: CockpitNote[] = parseOverseer(r.text).map((n, i) => ({
      ...n, id: `${at}-${i}`, at, isDismissed: false,
    }))
    if (fresh.length) {
      await update($, notes, list => [...list, ...fresh].slice(-20))
      $.ui.toast(`overseer: ${fresh.length} new note${fresh.length > 1 ? 's' : ''}`)
      const stamp = new Date(at).toISOString()
      const lines = fresh.map(n => `- ${stamp} [${n.kind}] ${n.text}${n.toRun ? ` → run: ${n.toRun}` : ''}`)
      const prev = await $.fs.read(`${root}/logs/overseer.md`).then(t => String(t)).catch(() => '# Overseer notes\n')
      await $.fs.write(`${root}/logs/overseer.md`, `${prev.trimEnd()}\n${lines.join('\n')}\n`)
    }
    await update($, overseer, o => ({ ...o, ...count(o), status: fresh.length ? 'idle' : 'idle (nothing to say)', lastAt: at }))
  } catch (err) {
    await update($, overseer, o => ({ ...o, status: `error: ${String(err).slice(0, 80)}` }))
  } finally {
    isThinking = false
  }
}

async function load($: EngineInterface): Promise<Omit<CockpitSnap, 'now'>> {
  const text = (f: string) => $.fs.read(`${root}/${f}`).then(t => String(t)).catch(() => '')
  try {
    const [plan = '', deferred = '', sup = '', gate = '', lock = ''] = await Promise.all(FILES.map(text))
    raw = { plan, sup, gate }
    const p = parsePlan(plan)
    const f = parseFeed(sup, FEED_LINES)
    return {
      root,
      current: p.current,
      phases: p.phases,
      next: p.next,
      lock: parseLock(lock),
      gate: parseGateTail(gate),
      deferred: parseDeferred(deferred),
      feed: f.feed,
      watch: f.watch,
      error: '',
    }
  } catch (err) {
    return {
      root, current: '', phases: [], next: '', lock: null, gate: null,
      deferred: [], feed: [], watch: '', error: String(err),
    }
  }
}

// The run session's full id, from the lock's short id and this project's transcripts.
async function runSessionId($: EngineInterface, prefix: string) {
  const home = (await $.env.get('HOME')) ?? ''
  const config = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${home}/.claude`
  const names = await $.fs.list(`${config}/projects/${projectSlug(cwdDir)}`).then(l => l.map(x => x.name)).catch(() => [])
  return matchSession(prefix, names)
}

// Send to the run session when sending is on; otherwise, or when it fails, copy.
// Resolves true only when the run session received it.
async function deliver($: EngineInterface, text: string, surface: Parameters<EngineInterface['ui']['copy']>[0]['surface'], what: string) {
  if (await read($, canSend)) {
    const prefix = parsed?.lock?.session ?? ''
    const id = await runSessionId($, prefix)
    if (id) {
      const r = await $.session.send({ to: { sessionId: id }, text: envelope(text) })
      if (r.isDelivered) {
        $.ui.toast(`${what}: sent to the run session (${prefix})`)
        return true
      }
      $.ui.toast(`${what}: send failed (${r.reason}); copied instead`)
    } else {
      $.ui.toast(`${what}: run session ${prefix || '?'} not found; copied instead`)
    }
  }
  const c = await $.ui.copy({ text: envelope(text), surface })
  $.ui.toast(c.isCopied ? `${what}: copied, paste it into the run session` : `${what}: copy failed`)
  return false
}

// The run's own session: it shows the band and nothing else.
function isRunSession() {
  const prefix = parsed?.lock?.session ?? ''
  return !!prefix && ownId.startsWith(prefix)
}

export const register: Register = (on, options) => {
  overseerModel = String(options.overseerModel ?? '') || 'fable'

  on('session.start', async ($, e, next) => {
    const cwd = await $.session.cwd()
    if (await $.fs.exists(`${cwd}/.plan/PLAN.md`)) {
      root = `${cwd}/.plan`
      cwdDir = cwd
      ownId = await $.session.id()
      await $.command.register({
        name: 'cockpit',
        description: 'Open the dot-plan cockpit pane',
      })
      await $.command.register({
        name: 'cockpit-ping',
        description: 'Send a test message to a session of this project',
        argumentHint: '<session id prefix>',
      })
      await $.command.register({
        name: 'overseer',
        description: 'Ask the dot-plan overseer for its view now',
      })
      await refresh($)
      $.clock.every(TICK_MS, () => void refresh($))
    }

    return next(e)
  })

  on('command.run', { command: 'cockpit-ping' }, async ($, e) => {
    const id = await runSessionId($, e.args.trim())
    if (!id) return { text: `No single session in this project starts with "${e.args.trim()}".` }
    const r = await $.session.send({ to: { sessionId: id }, text: envelope('ping from the cockpit; reply "pong" in one word, no action needed.') })

    return { text: r.isDelivered ? `Delivered to ${id}.` : `Not delivered: ${r.reason}` }
  })

  on('command.run', { command: 'overseer' }, async $ => {
    if (isRunSession()) return { text: 'This is the run session; the overseer runs in another session (/cockpit there).' }
    await update($, isActive, () => true)
    void oversee($, true)

    return { text: 'Overseer asked; its notes appear in the cockpit pane.' }
  })

  on('command.run', { command: 'cockpit' }, async $ => {
    if (isRunSession()) return { text: 'This is the run session; open the cockpit in another session of this repo.' }
    await update($, isActive, () => true)
    await refresh($)
    await $.ui.open({ id: PANE, title: 'dot-plan' })

    return { text: 'Cockpit opened.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, snap)
    if (!s || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const ph = s.phases.find(p => p.n === s.current)
    const live = s.lock && s.now / 1000 - s.lock.beat < 3600
    const working = s.lock && s.lock.worker !== '-'

    return (
      <Box flexDirection="column">
        {await next(e)}
        <Box>
          <Text color="cyan">◆ </Text>
          <Text bold>{`P${s.current}`}</Text>
          {ph && <Text dimColor>{` ${ph.done + ph.skipped}/${ph.total}`}</Text>}
          <Text>{working ? `  ▶ ${s.lock!.worker} ${ago(s.lock!.workerSince, s.now)}` : `  next ${s.next.split(' ')[0]}`}</Text>
          {s.gate && (
            <Text color={s.gate.result === 'PASS' ? 'green' : 'red'}>{`  gate ${s.gate.result} ${ago(s.gate.at, s.now)}`}</Text>
          )}
          {s.deferred.length > 0 && <Text color="yellow">{`  ⚑ ${s.deferred.length} open`}</Text>}
          {!live && <Text color="red">  run not live</Text>}
          {isRunSession() ? <Text dimColor>  (run session)</Text> : !(await read($, isActive)) && <Text dimColor>  /cockpit</Text>}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const s = await read($, snap)
    if (!s) return <Text dimColor>No .plan/ in this folder.</Text>
    const width = Math.max(20, e.props.bodyColumns)
    const bar = (done: number, total: number) => {
      const n = 8
      const fill = total ? Math.round((done / total) * n) : 0
      return '▰'.repeat(fill) + '▱'.repeat(n - fill)
    }
    const all = s.phases.reduce((a, p) => a + p.total, 0)
    const finished = s.phases.reduce((a, p) => a + p.done + p.skipped, 0)
    const live = s.lock && s.now / 1000 - s.lock.beat < 3600
    const ov = await read($, overseer)
    const sending = await read($, canSend)
    const sent = await read($, sentRows)
    const sentRow = (id: string) => sent.find(x => x.id === id)?.at ?? 0
    const open = (await read($, notes)).filter(n => !n.isDismissed).slice(-5).reverse()

    return (
      <Box flexDirection="column" width={width}>
        {s.error && <Text color="red" wrap="truncate">{s.error}</Text>}
        <Box>
          <Text bold>{`Phase ${s.current}`}</Text>
          <Text dimColor>{`  ${finished}/${all} items`}</Text>
          <Text color={live ? 'green' : 'red'}>
            {live ? `  live · beat ${ago(s.lock!.beat, s.now)}` : '  no live run'}
          </Text>
        </Box>
        {s.lock && s.lock.worker !== '-' ? (
          <Text wrap="truncate">{`▶ ${s.lock.worker} · worker ${ago(s.lock.workerSince, s.now)}`}</Text>
        ) : (
          <Text wrap="truncate" dimColor>{`next: ${s.next}`}</Text>
        )}
        {s.gate && (
          <Text wrap="truncate" color={s.gate.result === 'PASS' ? 'green' : 'red'}>
            {`gate ${s.gate.result} ${s.gate.mode} ${s.gate.label} · ${s.gate.seconds}s · ${ago(s.gate.at, s.now)} ago`}
          </Text>
        )}

        <Box gap={1}>
          <Text color={sending ? 'green' : undefined} dimColor={!sending}>
            {sending ? `buttons SEND to run ${s.lock?.session ?? '?'}` : 'buttons COPY to clipboard'}
          </Text>
          <Button
            key="send-toggle"
            label={sending ? 'Switch to copy' : 'Switch to send'}
            onPress={() => update($, canSend, v => !v)}
          />
        </Box>

        <Text> </Text>
        {s.phases.map(p => (
          <Text wrap="truncate" dimColor={p.isDone} color={p.n === s.current ? 'cyan' : undefined}>
            {`${p.isDone ? '✓' : p.n === s.current ? '▸' : ' '} P${p.n.padEnd(2)} ${bar(p.done + p.skipped, p.total)} ${p.done}/${p.total}${p.skipped ? ` ~${p.skipped}` : ''}  ${p.title}`}
          </Text>
        ))}

        <Text> </Text>
        <Text bold color="yellow">{`NEEDS YOU (${s.deferred.length})`}</Text>
        {s.deferred.length === 0 && <Text dimColor>nothing open</Text>}
        {s.deferred.map(d => (
          <Box flexDirection="column" marginBottom={1}>
            <Text wrap="wrap" dimColor={!!sentRow(d.id)}>{`#${d.id} [${d.item}] ${d.what}`}</Text>
            <Box gap={1}>
              {sentRow(d.id) ? (
                <Text color="green">{`✓ sent ${clockTime(sentRow(d.id))}`}</Text>
              ) : (
                <Button
                  key={`accept-${d.id}`}
                  label={sending ? 'Accept default (send)' : 'Accept default'}
                  onPress={async press => {
                    const now = await $.clock.now()
                    const date = new Date(now).toISOString().slice(0, 10)
                    if (await deliver($, acceptPrompt(d, date), press.surface, `#${d.id}`)) {
                      await update($, sentRows, list => [...list.filter(x => x.id !== d.id), { id: d.id, at: now }])
                    }
                  }}
                />
              )}
              <Button
                key={`discuss-${d.id}`}
                label="Discuss"
                onPress={async () => {
                  await $.prompt.fill({ text: discussPrompt(d), mode: 'replace' })
                }}
              />
            </Box>
          </Box>
        ))}

        <Box gap={1}>
          <Text bold color="magenta">OVERSEER</Text>
          <Text dimColor>{`${ov.status}${ov.lastAt ? ` · ${ago(Math.round(ov.lastAt / 1000), s.now)} ago` : ''}`}</Text>
          <Text dimColor>{`· ${ov.calls ?? 0} calls · ${compact(ov.tokensIn ?? 0)} in · ${compact(ov.tokensOut ?? 0)} out`}</Text>
          <Button key="ask-overseer" label="Ask now" onPress={() => oversee($, true)} />
        </Box>
        {open.length === 0 && <Text dimColor>no open notes</Text>}
        {open.map(n => (
          <Box flexDirection="column" marginBottom={1}>
            <Text wrap="wrap" dimColor={!!n.sentAt} color={n.sentAt ? undefined : n.kind === 'concern' ? 'red' : n.kind === 'suggest' ? 'cyan' : undefined}>
              {`[${n.kind}] ${n.text}`}
            </Text>
            {n.toRun && <Text wrap="wrap" dimColor>{`→ run: ${n.toRun}`}</Text>}
            <Box gap={1}>
              {n.sentAt ? (
                <Text color="green">{`✓ sent ${clockTime(n.sentAt)}`}</Text>
              ) : n.toRun ? (
                <Button
                  key={`fwd-${n.id}`}
                  label={sending ? 'Send to run' : 'Copy for run'}
                  onPress={async press => {
                    if (await deliver($, forwardPrompt(n.toRun), press.surface, 'note')) {
                      const at = await $.clock.now()
                      await update($, notes, list => list.map(x => (x.id === n.id ? { ...x, sentAt: at } : x)))
                    }
                  }}
                />
              ) : null}
              <Button
                key={`talk-${n.id}`}
                label="Discuss"
                onPress={async () => {
                  await $.prompt.fill({
                    text: `Overseer note on the dot-plan run: [${n.kind}] ${n.text}${n.toRun ? `\nIts suggestion for the orchestrator: ${n.toRun}` : ''}\nIs it right? Check .plan/ and the code, then tell me briefly.`,
                    mode: 'replace',
                  })
                }}
              />
              <Button
                key={`dismiss-${n.id}`}
                label="Dismiss"
                onPress={() => update($, notes, list => list.map(x => (x.id === n.id ? { ...x, isDismissed: true } : x)))}
              />
            </Box>
          </Box>
        ))}

        {s.watch && (
          <Box flexDirection="column">
            <Text> </Text>
            <Text bold>WATCH</Text>
            <Text wrap="wrap" dimColor>{s.watch}</Text>
          </Box>
        )}

        <Text> </Text>
        <Text bold>FEED</Text>
        {s.feed.map(l => (
          <Text wrap="truncate" dimColor>{l}</Text>
        ))}
      </Box>
    )
  })
}
