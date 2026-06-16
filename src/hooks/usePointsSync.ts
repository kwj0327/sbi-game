import { useEffect, useRef } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { syncUserPoints } from '../game/firestoreUsers'
import { usePoints } from './usePoints'

export function usePointsSync() {
  const { user, ready } = useFirebaseUser()
  const { points } = usePoints()
  const lastSyncedPoints = useRef<number | null>(null)
  const skippedInitialSync = useRef(false)

  useEffect(() => {
    if (!ready || !user) {
      skippedInitialSync.current = false
      lastSyncedPoints.current = null
      return
    }

    // 로그인 시 bootstrapUserPoints가 처리 — 초기 중복 sync 방지
    if (!skippedInitialSync.current) {
      skippedInitialSync.current = true
      lastSyncedPoints.current = points
      return
    }

    if (lastSyncedPoints.current === points) return

    lastSyncedPoints.current = points
    syncUserPoints(user.uid, points).catch(() => {
      lastSyncedPoints.current = null
    })
  }, [ready, user, points])
}
