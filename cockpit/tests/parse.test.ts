import { expect, test } from 'claude-code/testing'

import { notesForRow, phaseRows, clockTime, compact, usageTotals, envelope, TIMING_NOTE, matchSession, projectSlug, acceptPrompt, ago, discussPrompt, overseerMarker, parseDeferred, parseFeed, parseGateTail, parseLock, parseOverseer, parsePlan, phaseSection, section } from '../hooks/parse'

const PLAN = `# Plan
> **Current Phase:** Phase 3

## Phase 1 — Foundation ✓
- [x] 1.1 — Server skeleton — details
- [x] 1.2 — Android skeleton

## Phase 3 — Card detection
- [x] 3.1 — Baseline · reads: Arch
- [~] 3.2 — Evaluate DocAligner — skipped
- [ ] 3.4 — Side classifier · reads: Findings

## Parking Lot
- [ ] 9.9 — never counted
`

test('plan: phases, counts, current and next item', async () => {
  const p = parsePlan(PLAN)
  expect(p.current).toBe('3')
  expect(p.phases.length).toBe(2)
  expect(p.phases[0]).toEqual({ n: '1', title: 'Foundation', isDone: true, done: 2, skipped: 0, total: 2 })
  expect(p.phases[1]).toEqual({ n: '3', title: 'Card detection', isDone: false, done: 1, skipped: 1, total: 3 })
  expect(p.next).toBe('3.4 Side classifier')
})

test('lock: worker and since', async () => {
  const l = parseLock('session=8b52 mode=unattended started=1 beat=200 worker=3.2@150 tree=7')
  expect(l).toEqual({ session: '8b52', mode: 'unattended', beat: 200, worker: '3.2', workerSince: 150 })
  expect(parseLock('')).toBe(null)
})

test('gate: last line', async () => {
  const g = parseGateTail('1 a h1 build PASS 5 1.1\n100 2026-10-03T17:12:59+0800 abf371 build FAIL 53 3.2\n')
  expect(g).toEqual({ at: 100, hash: 'abf371', mode: 'build', result: 'FAIL', seconds: 53, label: '3.2' })
  expect(parseGateTail('')).toBe(null)
})

test('deferred: open rows only, first sentence', async () => {
  const md = [
    '| # | Date | Item | What | Default chosen | How to reverse | Commit |',
    '|---|------|------|------|----------------|----------------|--------|',
    '| 1 | 2026-10-03 | 1.2 | JUnit is EPL. More text | x | Resolved 2026-10-03 | 1.2 |',
    '| 6 | 2026-10-03 | 2.3 | cffi 2.1+ is `MIT-0`; not allowed | pin | allow it | 2.3 |',
    '| 10 | 2026-10-03 | 3.2 | DocAligner sign-off | eval | promote | 3.2 — Closed 2026-10-03: not adopted |',
    '| 11 | 2026-10-03 | 3.2 | weights | none | fetch — Resolved: human pinned | 3.2 |',
    '| 14 | 2026-10-03 | 4.1 | OCR cannot ship until this is resolved | eval tier | legal accepts | 4.1 |',
  ].join('\n')
  expect(parseDeferred(md)).toEqual([
    {
      id: '6',
      item: '2.3',
      what: 'cffi 2.1+ is MIT-0; not allowed',
      whatFull: 'cffi 2.1+ is MIT-0; not allowed',
      fallback: 'pin',
      reverse: 'allow it',
    },
    {
      id: '14',
      item: '4.1',
      what: 'OCR cannot ship until this is resolved',
      whatFull: 'OCR cannot ship until this is resolved',
      fallback: 'eval tier',
      reverse: 'legal accepts',
    },
  ])
})

test('feed: human lines, newest last, watch', async () => {
  const log = [
    '- Watch: process share rising',
    '### Iteration 1 · 1.1 · started x',
    'EV 1 2026-10-03T17:14:12+08:00 worker 1.1 5',
    '- Proof: PASS abc',
    '- Verdict: committed.',
  ].join('\n')
  const f = parseFeed(log, 2)
  expect(f.feed).toEqual([
    { time: '17:14', item: '1.1', kind: 'Proof', text: 'PASS abc' },
    { time: '17:14', item: '1.1', kind: 'Verdict', text: 'committed.' },
  ])
  expect(f.watch).toBe('process share rising')
})

test('ago', async () => {
  expect(ago(0, 1000)).toBe('-')
  expect(ago(100, 145_000)).toBe('45s')
  expect(ago(100, 100_000 + 7_500_000)).toBe('2h05')
})

test('prompts carry the row', async () => {
  const d = { id: '9', item: '3.x', what: 'w', whatFull: 'full what', fallback: 'flag off', reverse: 'set it up' }
  expect(acceptPrompt(d, '2026-10-03')).toContain('closes DEFERRED #9): accept the default chosen — "flag off"')
  expect(discussPrompt(d)).toContain('What: full what')
  expect(discussPrompt(d)).toContain('How to reverse: set it up')
})

test('overseer: parse notes, marker, sections', async () => {
  const out = 'thinking...\nNOTE concern | 3.5 retried twice | Split 3.5 into edges and quality\nNOTE fyi | all good | -\nnoise'
  expect(parseOverseer(out)).toEqual([
    { kind: 'concern', text: '3.5 retried twice', toRun: 'Split 3.5 into edges and quality' },
    { kind: 'fyi', text: 'all good', toRun: '' },
  ])
  expect(parseOverseer('NONE')).toEqual([])
  expect(overseerMarker('- Verdict: a\n- Verdict: b', ['4', '9'], 'PASS')).toBe('2|4,9|')
  expect(section('# M\n## Rails\nr1\nr2\n## Gotchas\ng', 'Rails')).toBe('r1\nr2')
  expect(phaseSection(PLAN, '3').split('\n').length).toBe(4)
})

test('run session lookup', async () => {
  expect(projectSlug('/Users/k/Pi/personal/ic-ocr')).toBe('-Users-k-Pi-personal-ic-ocr')
  expect(matchSession('8b52', ['8b52aa.jsonl', '8b52aa', 'ffff.jsonl'])).toBe('8b52aa')
  expect(matchSession('8b52', ['8b52aa.jsonl', '8b52bb.jsonl'])).toBe('')
  expect(matchSession('', ['8b52aa.jsonl'])).toBe('')
})

test('every send carries the timing note', async () => {
  expect(envelope('do X')).toBe(`[dot-plan cockpit · sent by the human]\ndo X\n\n${TIMING_NOTE}`)
})

test('overseer usage counts every input token', async () => {
  expect(usageTotals({ input_tokens: 100, cache_read_input_tokens: 50, cache_creation_input_tokens: 25, output_tokens: 7 }))
    .toEqual({ tokensIn: 175, tokensOut: 7 })
  expect(usageTotals({ input_tokens: 10, output_tokens: 2, cache_read_input_tokens: null })).toEqual({ tokensIn: 10, tokensOut: 2 })
  expect(usageTotals(undefined)).toEqual({ tokensIn: 0, tokensOut: 0 })
  expect([compact(950), compact(96_400), compact(1_250_000)]).toEqual(['950', '96k', '1.3M'])
})

test('clock time is HH:MM', async () => {
  expect(clockTime(new Date(2026, 9, 3, 6, 5).getTime())).toBe('06:05')
})

test('phase rows fold done and upcoming phases', async () => {
  const ph = (n: string, done: number, total: number) => ({ n, title: `T${n}`, isDone: done === total, done, skipped: 0, total })
  const rows = phaseRows([ph('1', 5, 5), ph('2', 4, 4), ph('3', 1, 4), ph('4', 0, 5), ph('5', 0, 3)], '3')
  expect(rows.map(r => [r.mark, r.label, r.title, r.done, r.total])).toEqual([
    ['✓', 'P1–2', 'done', 9, 9],
    ['▸', 'P3', 'T3', 1, 4],
    [' ', 'P4–5', 'to go', 0, 8],
  ])
  expect(phaseRows([ph('1', 5, 5), ph('2', 0, 4), ph('3', 0, 4)], '2').map(r => r.label)).toEqual(['P1', 'P2', 'P3'])
})

test('notes linked to a DEFERRED row by #id', async () => {
  const notes = [{ text: 'close #10 now', toRun: '-' }, { text: 'x', toRun: 'see #1 and #100' }, { text: 'none', toRun: '' }]
  expect(notesForRow('10', notes)).toEqual([notes[0]])
  expect(notesForRow('1', notes)).toEqual([notes[1]])
})
