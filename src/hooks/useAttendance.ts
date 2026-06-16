import { useCallback, useEffect, useState } from 'react'
import {
  ATTENDANCE_CHANGE_EVENT,
  checkInToday,
  getAttendanceSummary,
  type AttendanceSummary,
} from '../game/attendance'

export function useAttendance() {
  const [summary, setSummary] = useState<AttendanceSummary>(() => getAttendanceSummary())

  const refresh = useCallback(() => {
    setSummary(getAttendanceSummary())
  }, [])

  const checkIn = useCallback(() => {
    setSummary(checkInToday())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(ATTENDANCE_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ATTENDANCE_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return { summary, checkIn, refresh }
}
