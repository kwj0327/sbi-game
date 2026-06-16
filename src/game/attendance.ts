export type AttendanceState = {
  /** YYYY-MM-DD */
  dates: string[]
}

export type AttendanceSummary = {
  totalDays: number
  streak: number
  checkedInToday: boolean
  todayKey: string
  recentDays: readonly { key: string; label: string; checked: boolean }[]
}

const STORAGE_KEY = 'sbi-game-attendance'
export const ATTENDANCE_CHANGE_EVENT = 'sbi-game-attendance-change'

function readState(): AttendanceState {
  if (typeof window === 'undefined') return { dates: [] }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { dates: [] }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as AttendanceState).dates)) {
      return { dates: [] }
    }

    const dates = (parsed as AttendanceState).dates.filter(
      (value): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    )

    return { dates: [...new Set(dates)].sort() }
  } catch {
    return { dates: [] }
  }
}

function writeState(state: AttendanceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(ATTENDANCE_CHANGE_EVENT))
}

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(key: string, deltaDays: number) {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + deltaDays)
  return getTodayKey(date)
}

function formatRecentLabel(key: string, todayKey: string) {
  if (key === todayKey) return '오늘'
  const yesterday = shiftDateKey(todayKey, -1)
  if (key === yesterday) return '어제'

  const [, month, day] = key.split('-')
  return `${Number(month)}/${Number(day)}`
}

function computeStreak(dates: readonly string[], todayKey: string) {
  const set = new Set(dates)
  if (!set.has(todayKey) && !set.has(shiftDateKey(todayKey, -1))) return 0

  let streak = 0
  let cursor = set.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1)

  while (set.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }

  return streak
}

export function getAttendanceSummary(today = new Date()): AttendanceSummary {
  const todayKey = getTodayKey(today)
  const { dates } = readState()
  const set = new Set(dates)

  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index
    const key = shiftDateKey(todayKey, offset - 6)
    return {
      key,
      label: formatRecentLabel(key, todayKey),
      checked: set.has(key),
    }
  })

  return {
    totalDays: dates.length,
    streak: computeStreak(dates, todayKey),
    checkedInToday: set.has(todayKey),
    todayKey,
    recentDays,
  }
}

export function checkInToday(): AttendanceSummary {
  const summary = getAttendanceSummary()
  if (summary.checkedInToday) return summary

  const state = readState()
  writeState({ dates: [...state.dates, summary.todayKey].sort() })
  return getAttendanceSummary()
}
