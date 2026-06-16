import { useEffect } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { syncUserCollectionCount } from '../game/firestoreUsers'
import { useDollCollection } from './useDollCollection'

export function useCollectionSync(dollCount: number) {
  const { user, ready } = useFirebaseUser()
  const { summary } = useDollCollection(dollCount)

  useEffect(() => {
    if (!ready || !user) return

    syncUserCollectionCount(user.uid, summary.uniqueCount).catch(() => {
      // 랭킹 동기화 실패는 게임 플레이를 막지 않음
    })
  }, [ready, user, summary.uniqueCount])
}
