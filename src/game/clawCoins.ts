/** 뽑기 티켓 — localStorage (기존 키 sbi-game-claw-coins 유지) */
export const ATTENDANCE_TICKET_REWARD = 20
export const DRAW_TICKET_PLAY_COST = 2

/** @deprecated ATTENDANCE_TICKET_REWARD */
export const ATTENDANCE_COIN_REWARD = ATTENDANCE_TICKET_REWARD
/** @deprecated DRAW_TICKET_PLAY_COST */
export const CLAW_COIN_PLAY_COST = DRAW_TICKET_PLAY_COST

const STORAGE_KEY = 'sbi-game-claw-coins'
export const CLAW_COINS_CHANGE_EVENT = 'sbi-game-claw-coins-change'

function readBalance(): number {
  if (typeof window === 'undefined') return 0

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0

    const value = Number.parseInt(raw, 10)
    return Number.isFinite(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

function writeBalance(tickets: number) {
  window.localStorage.setItem(STORAGE_KEY, String(tickets))
  window.dispatchEvent(new Event(CLAW_COINS_CHANGE_EVENT))
}

export function getClawCoinBalance(): number {
  return readBalance()
}

export function addClawCoins(amount: number): number {
  if (amount <= 0) return readBalance()

  const next = readBalance() + amount
  writeBalance(next)
  return next
}

/** @returns 차감 후 잔액, 부족하면 null */
export function spendClawCoins(amount: number): number | null {
  if (amount <= 0) return readBalance()

  const current = readBalance()
  if (current < amount) return null

  const next = current - amount
  writeBalance(next)
  return next
}
