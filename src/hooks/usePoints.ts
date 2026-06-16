import { useCallback, useEffect, useState } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { subscribeUserProfile } from '../game/firestoreUsers'
import {
  addPoints as addPointsCore,
  getLocalPointBalance,
  POINTS_CHANGE_EVENT,
} from '../game/points'

export function usePoints() {
  const { user, ready, error: authError } = useFirebaseUser()
  const [points, setPoints] = useState(() => getLocalPointBalance())
  const [loading, setLoading] = useState(() => ready && Boolean(user))

  const refreshLocal = useCallback(() => {
    setPoints(getLocalPointBalance())
  }, [])

  useEffect(() => {
    if (!ready) return

    if (!user) {
      refreshLocal()
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe =
      subscribeUserProfile(
        user.uid,
        (profile) => {
          setPoints(profile.points)
          setLoading(false)
        },
        () => {
          refreshLocal()
          setLoading(false)
        },
      ) ?? null

    return () => {
      unsubscribe?.()
    }
  }, [ready, user, refreshLocal])

  useEffect(() => {
    if (user) return
    refreshLocal()
    window.addEventListener(POINTS_CHANGE_EVENT, refreshLocal)
    window.addEventListener('storage', refreshLocal)
    return () => {
      window.removeEventListener(POINTS_CHANGE_EVENT, refreshLocal)
      window.removeEventListener('storage', refreshLocal)
    }
  }, [user, refreshLocal])

  const addPoints = useCallback(
    async (amount: number) => {
      const next = await addPointsCore(amount, user?.uid ?? null)
      setPoints(next)
      return next
    },
    [user],
  )

  return {
    points,
    loading: !ready || loading,
    authError,
    addPoints,
  }
}
