import { getLocalPointBalance, spendPoints } from './points'

/** 1포인트당 입금 원화 (원) */
export const POINT_CASH_WON_PER_POINT = 1

const ACCOUNT_STORAGE_KEY = 'sbi-game-cash-account'

export type PointCashRedeemResult = {
  pointsSpent: number
  cashWon: number
  accountNumber: string
  remainingPoints: number
}

export function normalizeAccountNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidAccountNumber(accountNumber: string): boolean {
  return accountNumber.length >= 10 && accountNumber.length <= 14
}

export function getSavedAccountNumber(): string {
  if (typeof window === 'undefined') return ''

  try {
    return normalizeAccountNumber(window.localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

export function saveAccountNumber(accountNumber: string) {
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, accountNumber)
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 7) return accountNumber
  return `${accountNumber.slice(0, 4)}${'*'.repeat(accountNumber.length - 7)}${accountNumber.slice(-3)}`
}

export function pointsToCashWon(points: number): number {
  if (points <= 0) return 0
  return points * POINT_CASH_WON_PER_POINT
}

/** 포인트를 현금으로 교환(시뮬레이션) — 성공 시 포인트 차감 */
export function redeemPointsForCash(
  points: number,
  accountNumber: string,
): PointCashRedeemResult | null {
  const normalizedAccount = normalizeAccountNumber(accountNumber)
  if (!isValidAccountNumber(normalizedAccount)) return null
  if (points <= 0) return null

  const balance = getLocalPointBalance()
  if (points > balance) return null

  const remainingPoints = spendPoints(points)
  if (remainingPoints === null) return null

  saveAccountNumber(normalizedAccount)

  return {
    pointsSpent: points,
    cashWon: pointsToCashWon(points),
    accountNumber: normalizedAccount,
    remainingPoints,
  }
}
