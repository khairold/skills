// Pure parsers over the .plan/ files. No `$` here, so tests run them directly.
import type {
  CockpitDeferred,
  CockpitGate,
  CockpitLock,
  CockpitPhase,
} from '../types'

const PHASE = /^## Phase (\S+) — (.+?)(\s+✓)?\s*$/
const ITEM = /^- \[(x| |~)\] (\S+) — (.*)$/

export function parsePlan(md: string) {
  const phases: CockpitPhase[] = []
  let current = ''
  let next = ''
  for (const line of md.split('\n')) {
    const head = line.match(/^> \*\*Current Phase:\*\* (.+?)\s*$/)
    if (head) current = (head[1] ?? '').replace(/^Phase\s+/, '')
    if (/^## Parking Lot/.test(line)) break
    const p = line.match(PHASE)
    if (p) {
      phases.push({ n: p[1] ?? '', title: p[2] ?? '', isDone: !!p[3], done: 0, skipped: 0, total: 0 })
      continue
    }
    const it = line.match(ITEM)
    const ph = phases[phases.length - 1]
    if (it && ph) {
      ph.total += 1
      if (it[1] === 'x') ph.done += 1
      if (it[1] === '~') ph.skipped += 1
      if (it[1] === ' ' && !next) next = `${it[2]} ${shortTitle(it[3] ?? '')}`
    }
  }
  return { current, phases, next }
}

export function shortTitle(text: string) {
  return (text.split(/ — | · /)[0] ?? '').trim()
}

export function parseLock(text: string): CockpitLock | null {
  const kv: Record<string, string> = {}
  for (const tok of text.trim().split(/\s+/)) {
    const i = tok.indexOf('=')
    if (i > 0) kv[tok.slice(0, i)] = tok.slice(i + 1)
  }
  if (!kv.session) return null
  const [worker = '-', since = '0'] = (kv.worker ?? '-').split('@')
  return {
    session: kv.session,
    mode: kv.mode ?? '',
    beat: Number(kv.beat ?? 0),
    worker,
    workerSince: Number(since),
  }
}

export function parseGateTail(log: string): CockpitGate | null {
  const lines = log.trim().split('\n').filter(Boolean)
  const last = lines[lines.length - 1]
  if (!last) return null
  const f = last.split(' ')
  if (f.length < 7) return null
  return {
    at: Number(f[0]),
    hash: f[2] ?? '',
    mode: f[3] ?? '',
    result: f[4] ?? '',
    seconds: Number(f[5]),
    label: f.slice(6).join(' '),
  }
}

export function parseDeferred(md: string): CockpitDeferred[] {
  const open: CockpitDeferred[] = []
  for (const line of md.split('\n')) {
    if (!/^\| \d+ \|/.test(line)) continue
    if (/resolved/i.test(line)) continue
    const cells = line.replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').split(/\s+\|\s+/)
    const what = plain(cells[3] ?? '')
    open.push({
      id: cells[0] ?? '',
      item: cells[2] ?? '',
      what: what.length > 140 ? `${what.slice(0, 137)}...` : what,
      whatFull: what,
      fallback: plain(cells[4] ?? ''),
      reverse: plain(cells[5] ?? ''),
    })
  }
  return open
}

function plain(text: string) {
  return text.replace(/`/g, '').trim()
}

// Human-readable lines from SUPERVISOR-LOG, newest last: each prefixed with the
// time of the EV line before it and the item of its iteration.
export function parseFeed(log: string, count: number) {
  const feed: string[] = []
  let time = ''
  let item = ''
  for (const l of log.split('\n')) {
    const it = l.match(/^### Iteration \d+ · (\S+)/)
    if (it) item = it[1] ?? ''
    const ev = l.match(/^EV \d+ \S+T(\d\d:\d\d)/)
    if (ev) time = ev[1] ?? ''
    const human = l.match(/^- (Proof|Reviewer|Fix|Verdict|Human|Stopped): (.*)$/)
    if (human) feed.push(`${time.padEnd(5)} ${item.padEnd(4)} ${human[1]}: ${human[2]}`)
  }
  const watch = log.split('\n').find(l => l.startsWith('- Watch:'))?.slice(9).trim() ?? ''
  return { feed: feed.slice(-count), watch }
}

export function ago(fromSec: number, nowMs: number) {
  if (!fromSec) return '-'
  const s = Math.max(0, Math.round(nowMs / 1000 - fromSec))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
}

// The prompt pasted into the run session when the human accepts a row's default.
export function acceptPrompt(d: CockpitDeferred, date: string) {
  return [
    `Human decision ${date} (closes DEFERRED #${d.id}): accept the default chosen — "${d.fallback}".`,
    `Mark row #${d.id} resolved ("human accepted default ${date}"). No other change unless the default itself needs follow-up; commit with the next item.`,
  ].join('\n')
}

// The prompt filled into the cockpit session to talk a row through with Claude.
export function discussPrompt(d: CockpitDeferred) {
  return [
    `Let's discuss DEFERRED #${d.id} (item ${d.item}). Recommend what I should decide, briefly, then give me the prompt to paste into the run session.`,
    `What: ${d.whatFull}`,
    `Default chosen: ${d.fallback}`,
    `How to reverse: ${d.reverse}`,
  ].join('\n')
}

// The lines of one phase in PLAN.md, header to the next `## `.
export function phaseSection(md: string, n: string) {
  const lines = md.split('\n')
  const start = lines.findIndex(l => l.startsWith(`## Phase ${n} `))
  if (start < 0) return ''
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines.slice(start, end < 0 ? undefined : end).join('\n').trim()
}

// What changed enough to wake the overseer: a verdict, a DEFERRED row, a red gate.
export function overseerMarker(sup: string, deferredIds: string[], gateResult: string) {
  const verdicts = sup.split('\n').filter(l => l.startsWith('- Verdict:')).length
  return `${verdicts}|${deferredIds.join(',')}|${gateResult === 'PASS' ? '' : gateResult}`
}

export const OVERSEER_SYSTEM = `You are the overseer of an autonomous software build. An orchestrator agent runs the plan (dot-plan): one fresh worker per item, a gate, a reviewer on a different model, DEFERRED rows for what needs the human. You watch from outside and never build. A human reads your notes in a cockpit and decides whether to forward one to the orchestrator.

Look for what the orchestrator, inside one item at a time, cannot easily see: patterns across items (repeat retries or fix rounds, the reviewer catching the same class of problem), drift from the rails or the goal, a DEFERRED default that looks wrong or blocks a lot, process cost rising, an ordering or scoping change that would save work, and anything the human should act on now.

Trust the orchestrator's judgement; speak only when it matters. Do not restate the log. Do not repeat an earlier note unless something changed.

Output at most 3 lines, each exactly:
NOTE <suggest|concern|fyi> | <for the human: one or two plain sentences> | <message to the orchestrator, or ->
If nothing is worth saying, output exactly: NONE`

export function overseerPrompt(ctx: {
  rails: string
  resume: string
  phase: string
  deferred: CockpitDeferred[]
  gateTail: string
  logTail: string
  earlier: string[]
}) {
  const rows = ctx.deferred
    .map(d => `#${d.id} [${d.item}] ${d.whatFull} | default: ${d.fallback} | reverse: ${d.reverse}`)
    .join('\n')
  return [
    `## Rails\n${ctx.rails}`,
    `## Resume card\n${ctx.resume}`,
    `## Current phase\n${ctx.phase}`,
    `## Open DEFERRED rows\n${rows || 'none'}`,
    `## Gate log (newest last)\n${ctx.gateTail}`,
    `## Supervisor log tail (newest last)\n${ctx.logTail}`,
    `## Your earlier notes\n${ctx.earlier.join('\n') || 'none'}`,
  ].join('\n\n')
}

export function parseOverseer(text: string) {
  const notes: { kind: string; text: string; toRun: string }[] = []
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^NOTE\s+(suggest|concern|fyi)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/i)
    if (!m) continue
    const toRun = (m[3] ?? '').trim()
    notes.push({ kind: (m[1] ?? '').toLowerCase(), text: m[2] ?? '', toRun: toRun === '-' ? '' : toRun })
  }
  return notes.slice(0, 3)
}

// Section between a `## <name>` header and the next `## `.
export function section(md: string, name: string) {
  const lines = md.split('\n')
  const start = lines.findIndex(l => l.startsWith(`## ${name}`))
  if (start < 0) return ''
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
}

export function forwardPrompt(toRun: string) {
  return `Overseer suggestion, forwarded by the human: ${toRun}\nWeigh it against what you know; apply it if sound (as a fix item or in the next item), otherwise say in SUPERVISOR-LOG why not.`
}

// Claude Code's project folder name for a working directory.
export function projectSlug(cwd: string) {
  return cwd.replace(/[^A-Za-z0-9]/g, '-')
}

// The full session id whose transcript starts with the lock's short id; '' unless exactly one.
export function matchSession(prefix: string, names: string[]) {
  if (!prefix) return ''
  const hits = names.filter(n => n.startsWith(prefix) && n.endsWith('.jsonl')).map(n => n.slice(0, -6))
  return hits.length === 1 ? hits[0] ?? '' : ''
}

export const TIMING_NOTE =
  'You decide when to implement this: now, at the next item boundary, or at the phase gate, whichever fits the run best.'

export function envelope(text: string) {
  return `[dot-plan cockpit · sent by the human]\n${text}\n\n${TIMING_NOTE}`
}

// Input counts cache reads and writes too: all of it is what one call sent.
export function usageTotals(u: {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
} | undefined) {
  if (!u) return { tokensIn: 0, tokensOut: 0 }
  return {
    tokensIn: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
    tokensOut: u.output_tokens ?? 0,
  }
}

export function compact(n: number) {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
