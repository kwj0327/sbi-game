import { useEffect, useState } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import {
  subscribePointsLeaderboard,
  type LeaderboardSnapshot,
} from '../game/firestoreLeaderboard'

const EMPTY: LeaderboardSnapshot = {
  entries: [],
  myRank: null,
  myPoints: 0,
}

export function useLeaderboard() {
  const { user, ready, error: authError } = useFirebaseUser()
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return

    if (!user) {
      setSnapshot(EMPTY)
      setLoading(false)
      setError(authError)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe =
      subscribePointsLeaderboard(
        user.uid,
        (next) => {
          setSnapshot(next)
          setLoading(false)
        },
        (fetchError) => {
          setError(fetchError.message)
          setLoading(false)
        },
      ) ?? null

    if (!unsubscribe) {
      setLoading(false)
      setError('Firebase가 설정되지 않았습니다.')
    }

    return () => {
      unsubscribe?.()
    }
  }, [ready, user, authError])

  return {
    entries: snapshot.entries,
    myRank: snapshot.myRank,
    myPoints: snapshot.myPoints,
    loading: !ready || loading,
    error,
  }
}
