export type CockpitPhase = {
  n: string
  title: string
  isDone: boolean
  done: number
  skipped: number
  total: number
}

export type CockpitDeferred = {
  id: string
  item: string
  what: string
  whatFull: string
  fallback: string
  reverse: string
}

export type CockpitGate = {
  at: number
  hash: string
  mode: string
  result: string
  seconds: number
  label: string
}

export type CockpitLock = {
  session: string
  mode: string
  beat: number
  worker: string
  workerSince: number
}

export type CockpitSnap = {
  now: number
  root: string
  current: string
  phases: CockpitPhase[]
  next: string
  lock: CockpitLock | null
  gate: CockpitGate | null
  deferred: CockpitDeferred[]
  feed: string[]
  watch: string
  error: string
}

export type CockpitNote = {
  id: string
  at: number
  kind: string
  text: string
  toRun: string
  isDismissed: boolean
}

export type CockpitOverseer = {
  status: string
  lastAt: number
  calls: number
  tokensIn: number
  tokensOut: number
}

declare module 'claude-code' {
  interface PluginState {
    'khairold': {
      snap: CockpitSnap | null
      notes: CockpitNote[]
      overseer: CockpitOverseer
      canSend: boolean
      isActive: boolean
    }
  }
}
