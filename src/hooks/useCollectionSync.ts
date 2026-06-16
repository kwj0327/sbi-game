import { useEffect, useRef } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { syncUserCollectionCount } from '../game/firestoreUsers'
import { useDollCollection } from './useDollCollection'

export function useCollectionSync(dollCount: number) {
  const { user, ready } = useFirebaseUser()
  const { summary } = useDollCollection(dollCount)
  const lastSyncedCount = useRef<number | null>(null)
  const skippedInitialSync = useRef(false)

  useEffect(() => {
    if (!ready || !user) {
      skippedInitialSync.current = false
      lastSyncedCount.current = null
      return
    }

    // 로그인 시 bootstrapUserCollection이 처리 — 초기 중복 sync로 0 덮어쓰기 방지
    if (!skippedInitialSync.current) {
      skippedInitialSync.current = true
      lastSyncedCount.current = summary.uniqueCount
      return
    }

    if (lastSyncedCount.current === summary.uniqueCount) return

    lastSyncedCount.current = summary.uniqueCount
    syncUserCollectionCount(user.uid, summary.uniqueCount).catch(() => {
      lastSyncedCount.current = null
    })
  }, [ready, user, summary.uniqueCount])
}
