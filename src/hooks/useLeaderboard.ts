import { useEffect, useState } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { bootstrapUserPoints } from '../game/firestoreUsers'
import {
  subscribePointsLeaderboard,
  type LeaderboardSnapshot,
} from '../game/firestoreLeaderboard'
import { getLocalPointBalance } from '../game/points'

const EMPTY: LeaderboardSnapshot = {
  entries: [],
  myRank: null,
  myPoints: 0,
  totalPlayers: 0,
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

    let cancelled = false
    let unsubscribe: (() => void) | null = null

    setLoading(true)
    setError(null)

    const localPoints = getLocalPointBalance()

    bootstrapUserPoints(user.uid, localPoints)
      .then(() => {
        if (cancelled) return

        unsubscribe =
          subscribePointsLeaderboard(
            user.uid,
            (next) => {
              if (cancelled) return
              setSnapshot(next)
              setLoading(false)
            },
            (fetchError) => {
              if (cancelled) return
              setError(fetchError.message)
              setLoading(false)
            },
          ) ?? null

        if (!unsubscribe) {
          setLoading(false)
          setError('Firebase가 설정되지 않았습니다.')
        }
      })
      .catch((syncError: unknown) => {
        if (cancelled) return
        const message =
          syncError instanceof Error ? syncError.message : '랭킹 동기화에 실패했습니다.'
        setError(message)
        setLoading(false)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [ready, user, authError])

  return {
    entries: snapshot.entries,
    myRank: snapshot.myRank,
    myPoints: snapshot.myPoints,
    totalPlayers: snapshot.totalPlayers,
    loading: !ready || loading,
    error,
  }
}
