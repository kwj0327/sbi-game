import { useEffect, useRef } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { syncUserCollectionCount } from '../game/firestoreUsers'
import { useDollCollection } from './useDollCollection'

export function useCollectionSync(dollCount: number) {
  const { user, ready } = useFirebaseUser()
  const { summary } = useDollCollection(dollCount)
  const lastSyncedCount = useRef<number | null>(null)

  useEffect(() => {
    if (!ready || !user) return
    if (lastSyncedCount.current === summary.uniqueCount) return

    lastSyncedCount.current = summary.uniqueCount
    syncUserCollectionCount(user.uid, summary.uniqueCount).catch(() => {
      lastSyncedCount.current = null
    })
  }, [ready, user, summary.uniqueCount])
}
