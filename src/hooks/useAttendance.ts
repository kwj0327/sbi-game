import { useCallback, useEffect, useState } from 'react'
import {
  ATTENDANCE_CHANGE_EVENT,
  ATTENDANCE_REPEAT_CHECKIN_ENABLED,
  ATTENDANCE_WEEKLY_BONUS_TICKETS,
  checkInToday,
  getAttendanceSummary,
  getCheckInTicketReward,
  type AttendanceSummary,
  type CheckInResult,
} from '../game/attendance'
import { addClawCoins, ATTENDANCE_TICKET_REWARD } from '../game/clawCoins'

export type AttendanceRewardInfo = {
  amount: number
  total: number
  weeklyBonusGranted: boolean
}

export function useAttendance() {
  const [summary, setSummary] = useState<AttendanceSummary>(() => getAttendanceSummary())
  const [lastRewardTickets, setLastRewardTickets] = useState<AttendanceRewardInfo | null>(null)

  const refresh = useCallback(() => {
    setSummary(getAttendanceSummary())
  }, [])

  const applyReward = useCallback((result: CheckInResult) => {
    const amount = getCheckInTicketReward(result.weeklyBonusGranted, ATTENDANCE_TICKET_REWARD)
    const total = addClawCoins(amount)
    setLastRewardTickets({ amount, total, weeklyBonusGranted: result.weeklyBonusGranted })
    setSummary(result.summary)
  }, [])

  const checkIn = useCallback(() => {
    const before = getAttendanceSummary()

    if (before.checkedInToday && !ATTENDANCE_REPEAT_CHECKIN_ENABLED) {
      setSummary(before)
      return
    }

    if (before.checkedInToday && ATTENDANCE_REPEAT_CHECKIN_ENABLED) {
      const amount = ATTENDANCE_TICKET_REWARD
      const total = addClawCoins(amount)
      setLastRewardTickets({ amount, total, weeklyBonusGranted: false })
      return
    }

    applyReward(checkInToday())
  }, [applyReward])

  useEffect(() => {
    refresh()
    window.addEventListener(ATTENDANCE_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ATTENDANCE_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return {
    summary,
    checkIn,
    refresh,
    lastRewardTickets,
    clearLastReward: () => setLastRewardTickets(null),
    weeklyBonusTickets: ATTENDANCE_WEEKLY_BONUS_TICKETS,
  }
}
