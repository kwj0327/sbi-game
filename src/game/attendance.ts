export type AttendanceState = {
  version: 2
  /** 이번 주(월~일) 식별 — 월요일 YYYY-MM-DD */
  weekKey: string
  /** 이번 주 연속 출석 일수 (0~7, 7일 달성 후 0으로 리셋) */
  cycleProgress: number
  lastCheckInKey: string | null
  totalCheckIns: number
}

export type AttendanceWeekDay = {
  day: number
  label: string
  checked: boolean
}

export type AttendanceSummary = {
  totalDays: number
  streak: number
  checkedInToday: boolean
  todayKey: string
  weekKey: string
  weekDays: readonly AttendanceWeekDay[]
}

export type CheckInResult = {
  summary: AttendanceSummary
  ticketsEarned: number
  weeklyBonusGranted: boolean
  alreadyCheckedIn: boolean
}

const STORAGE_KEY = 'sbi-game-attendance'
export const ATTENDANCE_CHANGE_EVENT = 'sbi-game-attendance-change'

export const ATTENDANCE_WEEKLY_BONUS_TICKETS = 50
export const ATTENDANCE_WEEK_LENGTH = 7

/** 테스트용 — false로 바꾸면 하루 1회 출석만 가능 */
export const ATTENDANCE_REPEAT_CHECKIN_ENABLED = true

function readRawState(): unknown {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
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

/** 이번 주 월요일 날짜 키 (주간 갱신 기준) */
export function getWeekKey(date = new Date()) {
  const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = cursor.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  cursor.setDate(cursor.getDate() + mondayOffset)
  return getTodayKey(cursor)
}

function createEmptyState(today = new Date()): AttendanceState {
  return {
    version: 2,
    weekKey: getWeekKey(today),
    cycleProgress: 0,
    lastCheckInKey: null,
    totalCheckIns: 0,
  }
}

function migrateLegacyState(raw: unknown, today = new Date()): AttendanceState {
  const todayKey = getTodayKey(today)
  const weekKey = getWeekKey(today)

  if (!raw || typeof raw !== 'object') return createEmptyState(today)

  if ((raw as AttendanceState).version === 2) {
    const state = raw as AttendanceState
    return {
      version: 2,
      weekKey: typeof state.weekKey === 'string' ? state.weekKey : weekKey,
      cycleProgress:
        typeof state.cycleProgress === 'number' && state.cycleProgress >= 0
          ? Math.min(state.cycleProgress, ATTENDANCE_WEEK_LENGTH)
          : 0,
      lastCheckInKey:
        typeof state.lastCheckInKey === 'string' ? state.lastCheckInKey : null,
      totalCheckIns:
        typeof state.totalCheckIns === 'number' && state.totalCheckIns >= 0
          ? state.totalCheckIns
          : 0,
    }
  }

  const legacyDates = Array.isArray((raw as { dates?: unknown }).dates)
    ? (raw as { dates: unknown[] }).dates.filter(
        (value): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
      )
    : []

  let cycleProgress = 0
  let lastCheckInKey: string | null = null

  if (legacyDates.length > 0) {
    const sorted = [...new Set(legacyDates)].sort()
    lastCheckInKey = sorted[sorted.length - 1] ?? null

    if (lastCheckInKey) {
      let cursor = lastCheckInKey
      const set = new Set(sorted)
      while (set.has(cursor)) {
        cycleProgress += 1
        cursor = shiftDateKey(cursor, -1)
      }
      cycleProgress = Math.min(cycleProgress, ATTENDANCE_WEEK_LENGTH)
      if (lastCheckInKey !== todayKey && lastCheckInKey !== shiftDateKey(todayKey, -1)) {
        cycleProgress = 0
      }
    }
  }

  return {
    version: 2,
    weekKey,
    cycleProgress,
    lastCheckInKey,
    totalCheckIns: legacyDates.length,
  }
}

function normalizeState(state: AttendanceState, today = new Date()): AttendanceState {
  const weekKey = getWeekKey(today)

  if (state.weekKey === weekKey) {
    return state
  }

  return {
    ...state,
    weekKey,
    cycleProgress: 0,
    lastCheckInKey: null,
  }
}

function readState(today = new Date()): AttendanceState {
  return normalizeState(migrateLegacyState(readRawState(), today), today)
}

function getEffectiveProgress(state: AttendanceState, todayKey: string) {
  if (!state.lastCheckInKey) return 0
  if (state.lastCheckInKey === todayKey) return state.cycleProgress
  if (state.lastCheckInKey === shiftDateKey(todayKey, -1)) return state.cycleProgress
  return 0
}

function buildWeekDays(progress: number): AttendanceWeekDay[] {
  return Array.from({ length: ATTENDANCE_WEEK_LENGTH }, (_, index) => {
    const day = index + 1
    return {
      day,
      label: `${day}일`,
      checked: day <= progress,
    }
  })
}

export function getAttendanceSummary(today = new Date()): AttendanceSummary {
  const todayKey = getTodayKey(today)
  const state = readState(today)
  const checkedInToday = state.lastCheckInKey === todayKey
  const streak = getEffectiveProgress(state, todayKey)

  return {
    totalDays: state.totalCheckIns,
    streak,
    checkedInToday,
    todayKey,
    weekKey: state.weekKey,
    weekDays: buildWeekDays(streak),
  }
}

export function checkInToday(today = new Date()): CheckInResult {
  const todayKey = getTodayKey(today)
  const state = readState(today)
  const summaryBefore = getAttendanceSummary(today)

  if (summaryBefore.checkedInToday) {
    return {
      summary: summaryBefore,
      ticketsEarned: 0,
      weeklyBonusGranted: false,
      alreadyCheckedIn: true,
    }
  }

  let cycleProgress = 1
  if (
    state.lastCheckInKey &&
    state.lastCheckInKey === shiftDateKey(todayKey, -1) &&
    state.cycleProgress > 0
  ) {
    cycleProgress = Math.min(state.cycleProgress + 1, ATTENDANCE_WEEK_LENGTH)
  }

  const weeklyBonusGranted = cycleProgress >= ATTENDANCE_WEEK_LENGTH
  const nextCycleProgress = weeklyBonusGranted ? 0 : cycleProgress

  writeState({
    version: 2,
    weekKey: getWeekKey(today),
    cycleProgress: nextCycleProgress,
    lastCheckInKey: todayKey,
    totalCheckIns: state.totalCheckIns + 1,
  })

  const summary = getAttendanceSummary(today)

  return {
    summary,
    ticketsEarned: 0,
    weeklyBonusGranted,
    alreadyCheckedIn: false,
  }
}

export function getCheckInTicketReward(weeklyBonusGranted: boolean, dailyReward: number) {
  return dailyReward + (weeklyBonusGranted ? ATTENDANCE_WEEKLY_BONUS_TICKETS : 0)
}
