import { useCallback, useEffect, useState } from 'react'
import {
  addPoints as addPointsCore,
  getLocalPointBalance,
  POINTS_CHANGE_EVENT,
  spendPoints as spendPointsCore,
} from '../game/points'

export function usePoints() {
  const [points, setPoints] = useState(() => getLocalPointBalance())

  const refresh = useCallback(() => {
    setPoints(getLocalPointBalance())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(POINTS_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(POINTS_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  const addPoints = useCallback((amount: number) => {
    const next = addPointsCore(amount)
    setPoints(next)
    return next
  }, [])

  const spendPoints = useCallback((amount: number) => {
    const next = spendPointsCore(amount)
    if (next !== null) setPoints(next)
    return next
  }, [])

  return {
    points,
    loading: false,
    addPoints,
    spendPoints,
  }
}
