/** 포인트 — localStorage가 기준, Firestore는 usePointsSync로 실시간 동기화 */
/** 인형 1개당 교환 포인트 */
export const DOLL_EXCHANGE_POINT_VALUE = 10

export const DOLL_COLLECT_POINT_REWARD = 10

const STORAGE_KEY = 'sbi-game-points'
export const POINTS_CHANGE_EVENT = 'sbi-game-points-change'

function readLocalPointBalance(): number {
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

function writeLocalPointBalance(points: number) {
  window.localStorage.setItem(STORAGE_KEY, String(points))
  window.dispatchEvent(new Event(POINTS_CHANGE_EVENT))
}

export function getLocalPointBalance(): number {
  return readLocalPointBalance()
}

/** @deprecated getLocalPointBalance 사용 — UI는 usePoints 훅 권장 */
export function getPointBalance(): number {
  return readLocalPointBalance()
}

export function addPoints(amount: number): number {
  if (amount <= 0) return readLocalPointBalance()

  const next = readLocalPointBalance() + amount
  writeLocalPointBalance(next)
  return next
}

/** @returns 차감 후 잔액, 부족하면 null */
export function spendPoints(amount: number): number | null {
  if (amount <= 0) return readLocalPointBalance()

  const current = readLocalPointBalance()
  if (current < amount) return null

  const next = current - amount
  writeLocalPointBalance(next)
  return next
}
