import { getUserDocRef } from './firestoreUsers'
import { getFirestoreDb } from '../lib/firebase'
import {
  collection,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

export type LeaderboardEntry = {
  uid: string
  collectionCount: number
  displayName: string
}

export type LeaderboardSnapshot = {
  entries: LeaderboardEntry[]
  myRank: number | null
  myCollectionCount: number
}

function formatPlayerName(uid: string, displayName?: unknown) {
  if (typeof displayName === 'string' && displayName.trim()) return displayName.trim()
  return `플레이어 ·${uid.slice(-4).toUpperCase()}`
}

export function subscribeCollectionLeaderboard(
  uid: string | null,
  onChange: (snapshot: LeaderboardSnapshot) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb()
  if (!db) return null

  const topQuery = query(
    collection(db, 'users'),
    orderBy('collectionCount', 'desc'),
    limit(20),
  )

  let snapshotGeneration = 0

  return onSnapshot(
    topQuery,
    (snapshot) => {
      const generation = ++snapshotGeneration

      void (async () => {
        const entries: LeaderboardEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            uid: docSnap.id,
            collectionCount:
              typeof data.collectionCount === 'number' ? data.collectionCount : 0,
            displayName: formatPlayerName(docSnap.id, data.displayName),
          }
        })

        let myRank: number | null = null
        let myCollectionCount = 0

        if (uid) {
          const mine = entries.find((entry) => entry.uid === uid)

          if (mine) {
            myCollectionCount = mine.collectionCount
            myRank = entries.findIndex((entry) => entry.uid === uid) + 1
          } else {
            const userRef = getUserDocRef(uid)
            if (userRef) {
              const userSnap = await getDoc(userRef)
              if (generation !== snapshotGeneration) return

              myCollectionCount =
                typeof userSnap.data()?.collectionCount === 'number'
                  ? userSnap.data()!.collectionCount
                  : 0
            }

            if (myCollectionCount > 0) {
              const rankQuery = query(
                collection(db, 'users'),
                where('collectionCount', '>', myCollectionCount),
              )
              const rankSnap = await getCountFromServer(rankQuery)
              if (generation !== snapshotGeneration) return
              myRank = rankSnap.data().count + 1
            } else {
              const rankQuery = query(
                collection(db, 'users'),
                where('collectionCount', '>', 0),
              )
              const rankSnap = await getCountFromServer(rankQuery)
              if (generation !== snapshotGeneration) return
              myRank = rankSnap.data().count + 1
            }
          }
        }

        if (generation !== snapshotGeneration) return
        onChange({ entries, myRank, myCollectionCount })
      })().catch((error: unknown) => {
        if (generation !== snapshotGeneration) return
        onError?.(error instanceof Error ? error : new Error('랭킹을 불러오지 못했습니다.'))
      })
    },
    (error) => {
      onError?.(error)
    },
  )
}
