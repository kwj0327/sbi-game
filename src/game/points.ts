/** 포인트 — Firestore 우선, 오프라인/미연동 시 localStorage fallback */
import { addUserPoints } from './firestoreUsers'

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

export async function addPoints(amount: number, uid?: string | null): Promise<number> {
  if (amount <= 0) return readLocalPointBalance()

  if (uid) {
    const remoteTotal = await addUserPoints(uid, amount)
    if (remoteTotal !== null) {
      writeLocalPointBalance(remoteTotal)
      return remoteTotal
    }
  }

  const next = readLocalPointBalance() + amount
  writeLocalPointBalance(next)
  return next
}
